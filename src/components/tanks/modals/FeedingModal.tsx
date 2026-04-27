import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Slider } from '../../ui/slider';
import { Progress } from '../../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Droplet, Fish, TrendingUp, Activity, AlertTriangle, RefreshCw, Save, History } from 'lucide-react';
import { apiPost, apiGet } from '../../../api';
import { getFoodTypesBySpecies, FoodType } from '../../../services/foodTypesApi';
import { createTask } from '../../../services/taskApi';
import { getTankAssignedUserIds } from '../../../services/tankAssignmentApi';
import { toast } from 'sonner';

interface FeedingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tank: any;
  batchId?: string;
  tankBatches?: any[];
  onSuccess?: (record: any) => void;
  user: any;
}

export function FeedingModal({ open, onOpenChange, tank, batchId, tankBatches = [], onSuccess, user }: FeedingModalProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [weightFed, setWeightFed] = useState(0);
  const [foodTypeId, setFoodTypeId] = useState<string>('');
  const [availableFoodTypes, setAvailableFoodTypes] = useState<FoodType[]>([]);
  const [isLoadingFoodTypes, setIsLoadingFoodTypes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [skipReason, setSkipReason] = useState(false);
  const [skipNotes, setSkipNotes] = useState('');
  const [batchRequirement, setBatchRequirement] = useState<any>(null);
  const [isLoadingRequirement, setIsLoadingRequirement] = useState(false);

  const parseWeightValue = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const roundToOneDecimal = (value: number): number =>
    Math.round(value * 10) / 10;

  const formatKg = (value: number): string => {
    const rounded = roundToOneDecimal(value);
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  };

  useEffect(() => {
    if (open) {
      setWeightFed(0);
      setNotes('');
      setSkipReason(false);
      setSkipNotes('');

      // Initialize selected batch
      if (batchId) {
        setSelectedBatchId(batchId.toString());
      } else if (tankBatches && tankBatches.length > 0) {
        setSelectedBatchId(tankBatches[0].id.toString());
      } else {
        setSelectedBatchId('');
      }
    }
  }, [open, batchId, tankBatches]);

  useEffect(() => {
    if (open && tank?.species) {
      const fetchFood = async () => {
        setIsLoadingFoodTypes(true);
        try {
          const data = await getFoodTypesBySpecies(tank.species);
          console.log('Food types for species:', tank.species, data);
          setAvailableFoodTypes(data);
          if (data.length > 0) {
            setFoodTypeId(data[0].id);
          }
        } catch (err) {
          console.error('Failed to fetch food types:', err);
        } finally {
          setIsLoadingFoodTypes(false);
        }
      };
      fetchFood();
    }
  }, [open, tank?.species]);

  useEffect(() => {
    if (selectedBatchId && open) {
      const fetchBatchRequirement = async () => {
        setIsLoadingRequirement(true);
        try {
          // Attempting the route mentioned by the user
          const res = await apiGet<any>(`/tanks/feeding-records/calculation/batch/${selectedBatchId}`);
          console.log('Batch feeding requirement response:', res);
          setBatchRequirement(res.data ?? res);
        } catch (err) {
          console.error('Failed to fetch batch requirement from API:', err);

          // Fallback to batch data from props if API fails
          const selectedBatch = tankBatches.find(b => b.id.toString() === selectedBatchId);
          if (selectedBatch?.feedingPlan) {
            console.log('Falling back to feedingPlan from batch props');
            setBatchRequirement({
              recommendedAmount: parseFloat(selectedBatch.feedingPlan.dailyFeedingAmount || '0'),
              totalRecommended: parseFloat(selectedBatch.feedingPlan.dailyFeedingAmount || '0'),
              mealsPerDay: selectedBatch.feedingPlan.mealsPerDay || 4,
              todayFed: selectedBatch.feedingPlan.todayFed || 0
            });
          } else {
            setBatchRequirement(null);
          }
        } finally {
          setIsLoadingRequirement(false);
        }
      };
      fetchBatchRequirement();
    } else {
      setBatchRequirement(null);
    }
  }, [selectedBatchId, open, tankBatches]);

  const dailyRecommended = parseWeightValue(
    batchRequirement?.totalDailyFeedKg ||
    batchRequirement?.recommendedAmount ||
    batchRequirement?.totalRecommended ||
    tank?.feeding?.recommended ||
    90,
  );

  const currentTotalFed = parseWeightValue(
    batchRequirement?.fedTodayKg ??
    batchRequirement?.todayFed ??
    batchRequirement?.alreadyFedKg ??
    tank?.feeding?.todayFed ??
    0,
  );
  const totalWithNewMeal = roundToOneDecimal(
    currentTotalFed + parseWeightValue(weightFed),
  );
  const targetRounded = roundToOneDecimal(dailyRecommended);
  const displayProgressFed =
    dailyRecommended > 0 ? Math.min(totalWithNewMeal, targetRounded) : 0;
  const progressPercent =
    targetRounded > 0
      ? Math.round((displayProgressFed / targetRounded) * 100)
      : 0;
  const showUnderfeedingWarning =
    dailyRecommended > 0 && totalWithNewMeal < dailyRecommended * 0.8;

  // Auto-select recommended food type when available
  useEffect(() => {
    if (batchRequirement?.recommendedFoodType?.id && availableFoodTypes.length > 0) {
      const recommendedId = batchRequirement.recommendedFoodType.id;
      const exists = availableFoodTypes.some(ft => ft.id === recommendedId);
      if (exists) {
        setFoodTypeId(recommendedId);
      }
    }
  }, [batchRequirement, availableFoodTypes]);

  // Auto-populate weight fed based on remaining recommendation
  useEffect(() => {
    if (open && dailyRecommended > 0 && weightFed === 0) {
      const remaining =
        currentTotalFed > 0
          ? Math.max(0, dailyRecommended - currentTotalFed)
          : dailyRecommended;
      setWeightFed(Number(remaining.toFixed(2)));
    }
  }, [open, dailyRecommended, currentTotalFed, weightFed]);

  const handleSave = async () => {
    if (!foodTypeId) {
      toast.error('Please select a food type');
      return;
    }
    if (weightFed <= 0 && !skipReason) {
      toast.error('Please enter weight fed');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        foodTypeId: foodTypeId,
        fedAt: new Date().toISOString(),
        weightKg: weightFed,
        notes: notes,
        skipReason: skipReason,
        skipNotes: skipNotes
      };

      if (!selectedBatchId) {
        throw new Error('Please select a batch to record feeding for.');
      }

      console.log('Sending feeding record request:', {
        url: `/tanks/feeding-records/${selectedBatchId}`,
        payload: payload
      });

      const res = await apiPost<any>(`/tanks/feeding-records/${selectedBatchId}`, payload);
      console.log('Feeding record creation response:', res);

      if (res && res.success === false) {
        toast.error('Failed to record feeding: ' + (res.message || 'Validation error'));
        setIsSaving(false);
        return;
      }

      const createdTasks: any[] = [];
      // Auto-create tasks for this feeding
      try {
        const assignedUserIds = await getTankAssignedUserIds(tank.id);
        console.log('Assigned user IDs for tank tasks:', assignedUserIds);
        const targetUserIds = assignedUserIds.length > 0 ? assignedUserIds : [user.id];

        const taskPromises = targetUserIds.map(userId =>
          createTask({
            taskType: 'FEED_FISH',
            assignedToUserId: userId,
            tankId: tank.id,
            title: `Feeding Record: ${tank.name}`,
            description: `Recorded ${weightFed}kg of ${availableFoodTypes.find(f => f.id === foodTypeId)?.name || 'feed'}.`,
            dueAt: new Date().toISOString()
          })
        );
        const tasks = await Promise.all(taskPromises);
        const filteredTasks = tasks.filter(Boolean);
        createdTasks.push(...filteredTasks);
        console.log('Tasks synchronization response:', filteredTasks);
      } catch (taskErr) {
        console.warn('Feeding record saved, but failed to create task(s):', taskErr);
      }

      toast.success('Feeding record saved and tasks synchronized', {
        description: createdTasks.length > 0 ? `${createdTasks.length} task(s) created and assigned.` : undefined,
        action: {
          label: 'View Tasks',
          onClick: () => {
            // We can't easily change the global page state from here without a prop,
            // but we can at least show the success message.
            // If we want to support this, we'd need to pass a 'onNavigate' prop.
          }
        }
      });

      if (onSuccess) {
        onSuccess({
          record: res?.data || res || payload,
          tasks: createdTasks
        });
      }

      onOpenChange(false);
    } catch (err) {
      console.error('Failed to record feeding:', err);
      toast.error('Failed to record feeding: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
        <div className="bg-gradient-to-r from-[#0A4D68] to-[#088395] p-6 text-white">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <History className="w-5 h-5" />
              </div>
              Record Feeding - {tank?.name}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2 opacity-90">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                <Droplet className="w-3 h-3" /> {tank?.name}
              </span>
              <span className="text-xs text-white/70">·</span>
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                <Fish className="w-3 h-3" /> Batch #{selectedBatchId?.slice(-6).toUpperCase() || '---'}
              </span>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#E0F4F5]/40 border border-[#088395]/20 rounded-2xl p-5 relative overflow-hidden group">

            <div className="flex items-center justify-between gap-2 font-bold mb-4">
              <div className="flex items-center gap-2 text-[#0A4D68]">
                <div className="w-8 h-8 rounded-lg bg-[#088395] flex items-center justify-center shadow-sm">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <span className="tracking-tight">Feeding Recommendation</span>
              </div>
              {batchRequirement?.safetyStatus && batchRequirement.safetyStatus !== 'SAFE' && (
                <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 h-5 ${batchRequirement.safetyStatus === 'WARNING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                  'bg-red-500/10 text-red-600 border-red-500/20'
                  }`}>
                  {batchRequirement.safetyStatus}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <p className="text-[#0A4D68]/60 text-[10px] uppercase font-bold tracking-wider">Daily Target</p>
                <div className="flex items-baseline gap-1">
                  {isLoadingRequirement ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-[#0A4D68]/40" />
                  ) : (
                    <>
                      <span className="text-xl font-bold text-[#0A4D68]">{formatKg(dailyRecommended)}</span>
                      <span className="text-sm font-medium text-[#0A4D68]/70">kg / day</span>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-1 pl-6">
                <div className="flex justify-between items-center">
                  <p className="text-[#0A4D68]/60 text-[10px] uppercase font-bold tracking-wider">Already Fed</p>
                </div>
                <div className="flex items-baseline gap-1">
                  {isLoadingRequirement ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-[#0A4D68]/40" />
                  ) : (
                    <>
                      <span className="text-xl font-bold text-[#0A4D68]">{formatKg(currentTotalFed)}</span>
                      <span className="text-sm font-medium text-[#0A4D68]/70">kg</span>
                    </>
                  )}
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#088395]/10">
                <p className="text-[#0A4D68]/60 text-[10px] uppercase font-bold tracking-wider mb-1">Recommended Feed Type</p>
                <p className="text-[#0A4D68] font-semibold text-sm">
                  {batchRequirement?.assignedFeedType ||
                    (typeof batchRequirement?.recommendedFoodType === 'object'
                      ? batchRequirement?.recommendedFoodType?.name
                      : batchRequirement?.recommendedFoodType) ||
                    'Grower 30% 3mm Floating'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {tankBatches.length === 0 ? (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="font-bold uppercase tracking-wider text-xs">No Active Batches</span>
                </div>
                <p className="text-[11px] leading-relaxed">You cannot record feeding for a tank without active batches. Please stock this tank before adding feeding logs.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Target Batch</Label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200">
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {tankBatches.map(b => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        Batch {b.batchNumber || b.id.toString().substring(0, 8)} ({(b.counts?.current ?? b.currentCount ?? 0).toLocaleString()} fish)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Food Type Selection</Label>
              <Select value={foodTypeId} onValueChange={setFoodTypeId}>
                <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200">
                  <SelectValue placeholder={isLoadingFoodTypes ? "Loading food types..." : "Select food type"} />
                </SelectTrigger>
                <SelectContent>
                  {availableFoodTypes.length === 0 && !isLoadingFoodTypes ? (
                    <SelectItem value="none" disabled>No matching food types found</SelectItem>
                  ) : (
                    availableFoodTypes.map(ft => (
                      <SelectItem key={ft.id} value={ft.id}>
                        {ft.name} ({ft.proteinPercentage}% Protein, {ft.pelletSizeMm}mm)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Weight Fed Today</Label>
              <div className="relative group">
                <Input
                  type="number"
                  value={weightFed}
                  onChange={(e) => setWeightFed(parseWeightValue(e.target.value))}
                  className="h-12 pl-4 pr-12 text-lg font-bold bg-white border-2 border-gray-100 focus:border-[#088395] transition-all"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#0A4D68]/40 font-bold">
                  KG
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-inner">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Progress</h4>
              <Badge className={`${progressPercent >= 100 ? 'bg-green-500' : 'bg-[#088395]'} text-[10px] uppercase font-bold`}>
                {progressPercent}% Fulfilled
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-medium text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Droplet className="w-3 h-3" />
                    <span>Progression: {formatKg(displayProgressFed)} / {formatKg(dailyRecommended)} kg</span>
                  </div>
                </div>
                <Progress
                  value={progressPercent}
                  className="h-2 bg-gray-800"
                />
              </div>



              {showUnderfeedingWarning && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[10px] text-amber-200 leading-relaxed shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                  <p><strong className="text-amber-500">Caution:</strong> Currently underfeeding relative to optimal growth projection. If appetite is low, verify water parameters immediately.</p>
                </div>
              )}
            </div>
          </div>




          <div className="flex gap-3 pt-4 border-t">
            <Button variant="ghost" className="flex-1 h-12 text-gray-500 font-bold uppercase text-[10px] tracking-widest hover:bg-gray-100" onClick={() => onOpenChange(false)}>
              Discard
            </Button>
            <Button
              className="flex-[2] h-12 bg-gradient-to-r from-[#0A4D68] to-[#088395] hover:shadow-lg transition-all text-white font-bold uppercase text-[10px] tracking-widest"
              onClick={handleSave}
              disabled={isSaving || tankBatches.length === 0}
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Finalize & Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
