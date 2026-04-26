import { useState, useEffect, useCallback, MouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { Activity, Droplet, Fish, HeartPulse, Loader2, Plus, Trash2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { User, Farm } from '../types';
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../api';
import TankDetailView from './tanks/TankDetailView';
import { AddTankModal } from './tanks/modals/AddTankModal';
import { Pencil } from 'lucide-react';
import { fetchAllTankHealthOverviews, TankHealthOverview } from '../services/tankHealthOverview';
import { formatHealthStatus, getHealthStatusColor } from '../services/healthCheckApi';

interface TankManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

interface ApiTankBiomass {
  actual?: number;
  capacity?: number;
  unit?: string;
  overstockPercentage?: number | null;
  volumeM3?: number;
}
interface ApiTankWaterQuality {
  overallStatus?: string;
  temperature?: number;
  dissolvedOxygen?: number;
  ph?: number;
  ammonia?: number;
}
interface ApiTankFeeding {
  currentMeal?: number;
  totalMeals?: number;
  weightFed?: number;
  targetWeight?: number;
  percentage?: number;
}
interface RawApiTank {
  id: string;
  _id?: string;
  name: string;
  status: string;
  fishType?: string;
  biomass?: ApiTankBiomass;
  waterQuality: ApiTankWaterQuality | null;
  feeding: ApiTankFeeding | null;
  batches?: any[];
  assignedUserIds?: string[];
  assignedUsers?: Array<string | { id?: string; _id?: string; userId?: string }>;
  volumeCubicMeters?: number;
  location?: string;
  farmId?: string;
}
interface ApiTank {
  id: string;
  name: string;
  farmId?: string;
  status: string;
  fishType?: string;
  species: string;
  biomass: number;
  capacity: number;
  volume: number;
  location?: string;
  waterQuality: {
    overall: string;
    temp: { value: number; status: string };
    do: { value: number; status: string };
    ph: { value: number; status: string };
    nh3: { value: number; status: string };
  } | null;
  feeding: {
    todayMeals: number;
    totalMeals: number;
    todayFed: number;
    recommended: number;
  } | null;
  batches?: any[];
}

const formatDateTime = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function TankManagement({ user, selectedFarm }: TankManagementProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedTank, setSelectedTank] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [tanks, setTanks] = useState<ApiTank[]>([]);
  const [tanksLoading, setTanksLoading] = useState(true);
  const [tanksError, setTanksError] = useState<string | null>(null);
  const [showAddTankModal, setShowAddTankModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'EMPTY'>('ALL');
  const [editingTank, setEditingTank] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTankId, setEditTankId] = useState<string | null>(null);
  const [healthOverviewByTank, setHealthOverviewByTank] = useState<Record<string, TankHealthOverview>>({});
  const [loadingHealthOverview, setLoadingHealthOverview] = useState(false);

  const currentFarm = selectedFarm;

  const loadHealthOverviews = useCallback(async (sourceTanks: ApiTank[]) => {
    if (sourceTanks.length === 0) {
      setHealthOverviewByTank({});
      return;
    }

    setLoadingHealthOverview(true);
    try {
      const result = await fetchAllTankHealthOverviews(sourceTanks);
      const nextMap = result.overviews.reduce<Record<string, TankHealthOverview>>((acc, overview) => {
        acc[overview.tank.id] = overview;
        return acc;
      }, {});
      setHealthOverviewByTank(nextMap);
    } catch (error) {
      toast.error(`Failed to load tank health data: ${(error as Error).message}`);
    } finally {
      setLoadingHealthOverview(false);
    }
  }, []);

  const fetchTanks = useCallback(async () => {
    if (!currentFarm) {
      setTanks([]);
      setHealthOverviewByTank({});
      setTanksLoading(false);
      return;
    }

    setTanksLoading(true);
    setTanksError(null);
    try {
      const res = await apiGet<{ success: boolean; data: RawApiTank[] } | RawApiTank[]>('/tanks');
      const list: RawApiTank[] = Array.isArray(res)
        ? res
        : ((res as { success: boolean; data: RawApiTank[] }).data ?? []);

      const normalised = list.map((tank) => {
        const bioObj = tank.biomass as ApiTankBiomass | undefined;
        const biomassKg = bioObj?.actual ?? 0;
        const capacityKg = bioObj?.capacity ?? 25000;
        const wq = tank.waterQuality as ApiTankWaterQuality | undefined;
        const fd = tank.feeding as ApiTankFeeding | undefined;
        const species = tank.fishType && tank.fishType !== 'None' ? tank.fishType : 'Empty/No Fish';

        return {
          ...tank,
          id: tank.id || tank._id || '',
          species,
          biomass: biomassKg,
          capacity: capacityKg,
          volume: tank.volumeCubicMeters ?? bioObj?.volumeM3 ?? 50,
          waterQuality: wq
            ? {
                overall: (wq.overallStatus ?? 'unknown').toLowerCase(),
                temp: { value: parseFloat((wq.temperature ?? 0).toFixed(1)), status: 'unknown' },
                do: { value: parseFloat((wq.dissolvedOxygen ?? 0).toFixed(2)), status: 'unknown' },
                ph: { value: parseFloat((wq.ph ?? 0).toFixed(2)), status: 'unknown' },
                nh3: { value: parseFloat((wq.ammonia ?? 0).toFixed(4)), status: 'unknown' },
              }
            : null,
          feeding: fd
            ? {
                todayMeals: fd.currentMeal ?? 0,
                totalMeals: fd.totalMeals ?? 4,
                todayFed: fd.weightFed ?? 0,
                recommended: fd.targetWeight ?? 0,
              }
            : null,
        };
      });

      setTanks(normalised as ApiTank[]);
      await loadHealthOverviews(normalised as ApiTank[]);
    } catch (err) {
      console.error('Fetch Tanks Error:', err);
      setTanksError((err as Error).message);
    } finally {
      setTanksLoading(false);
    }
  }, [currentFarm, loadHealthOverviews]);

  useEffect(() => {
    void fetchTanks();
  }, [fetchTanks]);

  useEffect(() => {
    if (viewMode === 'detail' && selectedTank) {
      const updated = tanks.find((tank) => tank.id === selectedTank.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTank)) {
        setSelectedTank(updated);
      }
    }
  }, [selectedTank, tanks, viewMode]);

  const handleAddTank = async (data: { name: string; capacity: number; volume: number; location: string }) => {
    try {
      await apiPost('/tanks', {
        name: data.name,
        location: data.location || 'General',
        volumeCubicMeters: data.volume,
        status: 'EMPTY',
      });
      setShowAddTankModal(false);
      await fetchTanks();
      toast.success('Tank created successfully');
    } catch (err) {
      toast.error(`Failed to create tank: ${(err as Error).message}`);
    }
  };

  const handleUpdateTank = async (data: { name: string; capacity: number; volume: number; location: string }) => {
    if (!editTankId) return;
    try {
      const payload = {
        name: data.name,
        location: data.location,
        volumeCubicMeters: data.volume,
        biomassLimit: data.capacity,
      };

      try {
        await apiPatch(`/tanks/${editTankId}`, payload);
        toast.success('Tank updated successfully');
      } catch (patchErr: any) {
        if (patchErr.message.includes('404')) {
          await apiPut(`/tanks/${editTankId}`, payload);
          toast.success('Tank updated successfully');
        } else {
          throw patchErr;
        }
      }

      setShowEditModal(false);
      setEditTankId(null);
      setEditingTank(null);
      await fetchTanks();
    } catch (err) {
      toast.error(`Failed to update tank: ${(err as Error).message}`);
    }
  };

  const handleDeleteTank = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiDelete(`/tanks/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      await fetchTanks();
      toast.success('Tank deleted successfully');
    } catch (err) {
      toast.error(`Failed to delete tank: ${(err as Error).message}`);
      setDeleteConfirmId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'critical':
        return 'bg-[#EF4444]';
      case 'warning':
        return 'bg-[#F59E0B]';
      case 'acceptable':
        return 'bg-[#3B82F6]';
      case 'optimal':
      case 'active':
        return 'bg-[#10B981]';
      case 'maintenance':
        return 'bg-purple-500';
      case 'empty':
        return 'bg-gray-400';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'critical':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'acceptable':
        return '🔵';
      case 'optimal':
        return '🟢';
      case 'maintenance':
        return '🔧';
      case 'empty':
        return '⚪';
      default:
        return '⚪';
    }
  };

  if (viewMode === 'detail' && selectedTank) {
    return <TankDetailView user={user} tank={selectedTank} onBack={() => setViewMode('list')} />;
  }

  const filteredTanks = tanks.filter((tank) => {
    if (statusFilter === 'ALL') return true;
    return (tank.status ?? '').toUpperCase() === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#0A4D68] px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="h-6 w-6" />
            <span className="text-xl font-semibold">Tank Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarm?.name}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#088395] font-semibold">
              {user.name
                .split(' ')
                .map((segment) => segment[0])
                .join('')
                .toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">All Tanks</h1>
            <p className="mt-1 text-sm text-gray-500">
              Health status now includes live AI reports and recovery actions without opening the full tank view.
            </p>
          </div>
          <Button className="bg-[#088395] hover:bg-[#0A4D68]" onClick={() => setShowAddTankModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Tank
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {['ALL', 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'EMPTY'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              className={statusFilter === status ? 'bg-[#088395] hover:bg-[#0A4D68]' : ''}
              onClick={() => setStatusFilter(status as typeof statusFilter)}
            >
              {status}
            </Button>
          ))}
        </div>

        <AddTankModal open={showAddTankModal} onOpenChange={setShowAddTankModal} onConfirm={handleAddTank} />

        {tanksError && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <Activity className="h-5 w-5 flex-shrink-0 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Failed to load tanks</p>
              <p className="mt-0.5 text-xs text-red-600">{tanksError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void fetchTanks()}>
              Retry
            </Button>
          </div>
        )}

        {tanksLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((index) => (
              <Card key={index} className="animate-pulse bg-white shadow-sm">
                <CardContent className="space-y-3 p-6">
                  <div className="h-5 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                  <div className="h-2 w-full rounded bg-gray-200" />
                  <div className="h-12 rounded bg-gray-100" />
                  <div className="h-20 rounded bg-gray-100" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTanks.length === 0 && !tanksError ? (
          <div className="py-16 text-center">
            <Fish className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-gray-600">No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} tanks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTanks.map((tank) => {
              const healthOverview = healthOverviewByTank[tank.id];

              return (
                <Card
                  key={tank.id}
                  className="cursor-pointer bg-white shadow-sm transition-shadow hover:shadow-md"
                  onClick={() => {
                    setSelectedTank(tank);
                    setViewMode('detail');
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{tank.name}</CardTitle>
                        <p className="font-mono text-[10px] text-gray-400">ID: {tank.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(tank.status ?? '')} text-[10px] text-white`}>
                          {(tank.status ?? 'unknown').toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            onClick={(event: MouseEvent<HTMLButtonElement>) => {
                              event.stopPropagation();
                              setEditingTank({
                                name: tank.name,
                                location: tank.location || 'General',
                                capacity: tank.capacity || 25000,
                                volume: tank.volume || 50,
                              });
                              setEditTankId(tank.id);
                              setShowEditModal(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            onClick={(event: MouseEvent<HTMLButtonElement>) => {
                              event.stopPropagation();
                              setDeleteConfirmId(tank.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{tank.species}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Biomass</span>
                        <span className="font-medium">
                          {tank.biomass} / {tank.capacity} kg
                        </span>
                      </div>
                      <Progress value={Math.min((tank.biomass / tank.capacity) * 100, 100)} className="h-2" />
                      {tank.biomass > tank.capacity && (
                        <p className="mt-1 text-xs text-red-600">
                          Overstocked by {Math.round(((tank.biomass - tank.capacity) / tank.capacity) * 100)}%
                        </p>
                      )}
                    </div>

                    {tank.waterQuality ? (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Water Quality</span>
                          <span className="text-xs">
                            {getStatusIcon(tank.waterQuality.overall)} {tank.waterQuality.overall}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Temp:</span>
                            <span className="ml-1 font-medium">{tank.waterQuality.temp.value}°C</span>
                          </div>
                          <div>
                            <span className="text-gray-600">DO:</span>
                            <span className="ml-1 font-medium">{tank.waterQuality.do.value} mg/L</span>
                          </div>
                          <div>
                            <span className="text-gray-600">pH:</span>
                            <span className="ml-1 font-medium">{tank.waterQuality.ph.value}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">NH₃:</span>
                            <span className="ml-1 font-medium">{tank.waterQuality.nh3.value} mg/L</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-4 text-center">
                        <p className="text-xs italic text-gray-400">No water quality data</p>
                      </div>
                    )}

                    {tank.feeding ? (
                      <div className="rounded-lg bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Today's Feeding</span>
                          <span className="text-xs">
                            {tank.feeding.todayMeals}/{tank.feeding.totalMeals} meals
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            Fed: {tank.feeding.todayFed} / {tank.feeding.recommended} kg
                          </span>
                          {tank.feeding.recommended > 0 && (
                            <span
                              className={`font-medium ${
                                tank.feeding.todayFed < tank.feeding.recommended ? 'text-yellow-600' : 'text-green-600'
                              }`}
                            >
                              {Math.round((tank.feeding.todayFed / tank.feeding.recommended) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-4 text-center">
                        <p className="text-xs italic text-gray-400">No feeding plan</p>
                      </div>
                    )}

                    <div className="rounded-2xl border border-[#D7E9EE] bg-[#F7FCFD] p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <HeartPulse className="h-4 w-4 text-[#088395]" />
                          Tank Health File
                        </div>
                        {loadingHealthOverview ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                        ) : healthOverview?.latestRecord ? (
                          <Badge variant="outline" className={getHealthStatusColor(healthOverview.latestRecord.healthStatus)}>
                            {formatHealthStatus(healthOverview.latestRecord.healthStatus)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-200 text-slate-500">
                            No reports
                          </Badge>
                        )}
                      </div>

                      {!healthOverview || healthOverview.healthChecks.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No AI health reports have been recorded for this tank yet.
                        </p>
                      ) : healthOverview.requiresAttention ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-sm font-semibold text-slate-800">Latest report available</p>
                          <p className="mt-1 text-xs text-slate-600">
                            {formatDateTime(healthOverview.latestRecord?.checkedAt)}
                          </p>
                        </div>
                      ) : healthOverview.isRecovered ? (
                        <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-sm font-semibold text-emerald-800">
                            Recovered from {healthOverview.latestActiveRecord?.bacterialType || healthOverview.currentDiseaseLabel}
                          </p>
                          <p className="text-xs text-emerald-700">
                            Recovery recorded on {formatDateTime(healthOverview.recoveredAt)}
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-sm font-semibold text-emerald-800">Latest report is healthy</p>
                          <p className="mt-1 text-xs text-emerald-700">
                            {formatDateTime(healthOverview.latestRecord?.checkedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open: boolean) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this tank?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All data associated with this tank, including historical records and batches, might be affected or lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTank} className="bg-red-600 text-white hover:bg-red-700">
              Delete Tank
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddTankModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onConfirm={handleUpdateTank}
        initialData={editingTank}
        mode="edit"
      />
    </div>
  );
}
