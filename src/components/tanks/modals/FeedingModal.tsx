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
import { Droplet, Fish, TrendingUp, Activity, AlertTriangle, RefreshCw, Save } from 'lucide-react';
import { apiPost } from '../../../api';
import { getFoodTypesBySpecies, FoodType } from '../../../services/foodTypesApi';
import { toast } from 'sonner';

interface FeedingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tank: any;
  batchId?: string;
  tankBatches?: any[];
  onSuccess?: (record: any) => void;
}

export function FeedingModal({ open, onOpenChange, tank, batchId, tankBatches = [], onSuccess }: FeedingModalProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [meals, setMeals] = useState(1);
  const [weightFed, setWeightFed] = useState(0);
  const [foodTypeId, setFoodTypeId] = useState<string>('');
  const [availableFoodTypes, setAvailableFoodTypes] = useState<FoodType[]>([]);
  const [isLoadingFoodTypes, setIsLoadingFoodTypes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [skipReason, setSkipReason] = useState(false);
  const [skipNotes, setSkipNotes] = useState('');

  useEffect(() => {
    if (open) {
      setMeals(1);
      setWeightFed(0);
      setNotes('');
      setSkipReason(false);
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

  const dailyRecommended = tank?.feeding?.recommended ?? 90;
  const perMeal = dailyRecommended / 4;
  const currentTotalFed = (tank?.feeding?.todayFed ?? 0);
  const totalWithNewMeal = currentTotalFed + weightFed;

  const progress = {
    weight: dailyRecommended > 0 ? totalWithNewMeal / dailyRecommended : 0
  };

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
        numMeals: meals,
        weightKg: weightFed,
        notes: notes,
        skipReason: skipReason,
        skipNotes: skipNotes
      };

      if (!selectedBatchId) {
        throw new Error('Please select a batch to record feeding for.');
      }
      const res = await apiPost<any>(`/tanks/feeding-records/${selectedBatchId}`, payload);
      toast.success('Feeding record saved successfully');

      if (onSuccess) onSuccess(res?.data || res || payload);

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
            <DialogTitle className="text-2xl font-bold text-white leading-tight">Record Feeding</DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2 opacity-90">
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                <Droplet className="w-3 h-3" /> {tank?.name}
              </span>
              <span className="text-xs text-white/70">·</span>
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                <Fish className="w-3 h-3" /> Batch #{selectedBatchId?.slice(-6).toUpperCase() || '---'}
              </span>
              <span className="text-xs text-white/70">·</span>
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                {tank?.species || 'Nile Tilapia'}
              </span>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-[#E0F4F5]/40 border border-[#088395]/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="w-32 h-32 text-[#0A4D68]" />
            </div>

            <div className="flex items-center gap-2 text-[#0A4D68] font-bold mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#088395] flex items-center justify-center shadow-sm">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="tracking-tight">Feeding Recommendation</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1">
                <p className="text-[#0A4D68]/60 text-[10px] uppercase font-bold tracking-wider">Daily Target</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#0A4D68]">{dailyRecommended}</span>
                  <span className="text-sm font-medium text-[#0A4D68]/70">kg / day</span>
                </div>
              </div>
              <div className="space-y-1 border-l pl-6 border-[#088395]/10">
                <p className="text-[#0A4D68]/60 text-[10px] uppercase font-bold tracking-wider">Per Meal (Avg)</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-[#0A4D68]">{perMeal.toFixed(1)}</span>
                  <span className="text-sm font-medium text-[#0A4D68]/70">kg</span>
                </div>
              </div>
              <div className="col-span-2 pt-2 border-t border-[#088395]/10">
                <p className="text-[#0A4D68]/60 text-[10px] uppercase font-bold tracking-wider mb-1">Recommended Feed Type</p>
                <p className="text-[#0A4D68] font-semibold text-sm">Grower 30% 3mm Floating</p>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Number of Meals</Label>
                <div className="text-lg font-bold text-[#0A4D68]">{meals} <span className="text-[10px] font-medium text-gray-400">Meals</span></div>
              </div>
              <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <Slider
                  value={[meals]}
                  onValueChange={(value: number[]) => setMeals(value[0])}
                  min={0.5}
                  max={4}
                  step={0.5}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={meals}
                  onChange={(e) => setMeals(parseFloat(e.target.value) || 0)}
                  className="w-14 h-9 text-center font-bold border-none shadow-none bg-transparent"
                  step={0.5}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Weight Fed Today</Label>
              <div className="relative group">
                <Input
                  type="number"
                  value={weightFed}
                  onChange={(e) => setWeightFed(parseFloat(e.target.value) || 0)}
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
              <Badge className={`${progress.weight >= 1 ? 'bg-green-500' : 'bg-[#088395]'} text-[10px] uppercase font-bold`}>
                {Math.round(progress.weight * 100)}% Fulfilled
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-medium text-gray-500">
                  <span>Consumption Status</span>
                  <span className="text-white">{totalWithNewMeal.toFixed(1)} / {dailyRecommended} kg</span>
                </div>
                <Progress 
                  value={Math.min(progress.weight * 100, 100)} 
                  className="h-2 bg-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Meals</span>
                  <span className="text-sm font-bold text-white">{meals} <span className="text-[10px] text-gray-600">/ 4</span></span>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">Diff</span>
                  <span className={`text-sm font-bold ${totalWithNewMeal >= dailyRecommended ? 'text-green-400' : 'text-orange-400'}`}>
                    {Math.max(0, dailyRecommended - totalWithNewMeal).toFixed(1)} <span className="text-[10px] opacity-70">KG</span>
                  </span>
                </div>
              </div>

              {weightFed < dailyRecommended * 0.8 && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-[10px] text-amber-200 leading-relaxed shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 animate-pulse" />
                  <p><strong className="text-amber-500">Caution:</strong> Currently underfeeding relative to optimal growth projection. If appetite is low, verify water parameters immediately.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Field Observations</Label>
            <Textarea
              placeholder="Record any unusual behavior, water clarity issues, or external conditions..."
              className="resize-none min-h-[80px] bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold text-gray-700">Skip Feeding?</Label>
                <p className="text-[10px] text-gray-500 font-medium">Toggle if this meal was not delivered</p>
              </div>
              <Switch checked={skipReason} onCheckedChange={setSkipReason} />
            </div>

            {skipReason && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs font-bold text-red-500 uppercase tracking-wide">Reason for Skipping</Label>
                <Textarea
                  placeholder="e.g., Low appetite, water quality issues, power failure..."
                  className="resize-none min-h-[60px] border-red-100 bg-red-50/30 focus:bg-white"
                  value={skipNotes}
                  onChange={(e) => setSkipNotes(e.target.value)}
                />
              </div>
            )}
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
