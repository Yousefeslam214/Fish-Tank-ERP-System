import { useState, useEffect, useCallback } from 'react';
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
  AlertDialogTitle
} from './ui/alert-dialog';
import { toast } from 'sonner';
import {
  Fish,
  Droplet,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react';
import { Progress } from './ui/progress';
import { User, Farm } from '../types';
import { apiGet, apiPost, apiDelete, apiPatch, apiPut } from '../api';
import TankDetailView from './tanks/TankDetailView';
import { AddTankModal } from './tanks/modals/AddTankModal';
import { Pencil } from 'lucide-react';

interface TankManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

// ── API response shape for a single tank (matches actual /api/v1/tanks response) ──
interface ApiTankBiomass {
  actual?: number;
  capacity?: number;
  unit?: string;
  overstockPercentage?: number | null;
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

export default function TankManagement({ user, selectedFarm }: TankManagementProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedTank, setSelectedTank] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // -- API state --
  const [tanks, setTanks] = useState<ApiTank[]>([]);
  const [tanksLoading, setTanksLoading] = useState(true);
  const [tanksError, setTanksError] = useState<string | null>(null);
  const [showAddTankModal, setShowAddTankModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'EMPTY'>('ALL');
  const [editingTank, setEditingTank] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTankId, setEditTankId] = useState<string | null>(null);

  const currentFarm = selectedFarm;

  // ── Fetch tanks from API ──
  const fetchTanks = useCallback(async () => {
    if (!currentFarm) return;
    setTanksLoading(true);
    setTanksError(null);
    try {
      const res = await apiGet<{ success: boolean; data: RawApiTank[] } | RawApiTank[]>('/tanks');
      const list: RawApiTank[] = Array.isArray(res)
        ? res
        : ((res as { success: boolean; data: RawApiTank[] }).data ?? []);

      const normalised = list.map(t => {
        // Map biomass from backend structure (nested object)
        const bioObj = t.biomass as any;
        const biomassKg = bioObj?.actual ?? 0;
        const capacityKg = bioObj?.capacity ?? 25000;
        
        // Map water quality summary
        const wq = t.waterQuality as ApiTankWaterQuality | undefined;
        
        // Map feeding summary
        const fd = t.feeding as ApiTankFeeding | undefined;

        // Ensure we handle Arabic/other fish types correctly
        const species = t.fishType && t.fishType !== 'None' ? t.fishType : 'Empty/No Fish';

        return {
          ...t,
          id: t.id || t._id || '',
          species,
          biomass: biomassKg,
          capacity: capacityKg,
          volume: t.volumeCubicMeters ?? (bioObj?.volumeM3 ?? 50), // Fallback to 50 if missing
          waterQuality: wq ? {
            overall: (wq?.overallStatus ?? 'unknown').toLowerCase(),
            temp: { value: parseFloat((wq?.temperature ?? 0).toFixed(1)), status: 'unknown' },
            do: { value: parseFloat((wq?.dissolvedOxygen ?? 0).toFixed(2)), status: 'unknown' },
            ph: { value: parseFloat((wq?.ph ?? 0).toFixed(2)), status: 'unknown' },
            nh3: { value: parseFloat((wq?.ammonia ?? 0).toFixed(4)), status: 'unknown' },
          } : null,
          feeding: fd ? {
            todayMeals: fd?.currentMeal ?? 0,
            totalMeals: fd?.totalMeals ?? 4,
            todayFed: fd?.weightFed ?? 0,
            recommended: fd?.targetWeight ?? 0,
          } : null,
        };
      });

      setTanks(normalised as any[]);
    } catch (err) {
      console.error('Fetch Tanks Error:', err);
      setTanksError((err as Error).message);
    } finally {
      setTanksLoading(false);
    }
  }, [currentFarm?.id]);

  // Keep selectedTank updated if the tanks list refreshes
  useEffect(() => {
    if (viewMode === 'detail' && selectedTank) {
      const updated = tanks.find(t => t.id === selectedTank.id);
      if (updated) {
        if (JSON.stringify(updated) !== JSON.stringify(selectedTank)) {
          setSelectedTank(updated);
        }
      }
    }
  }, [tanks, viewMode, selectedTank]);

  const handleAddTank = async (data: { name: string; capacity: number; volume: number; location: string }) => {
    try {
      const payload = {
        name: data.name,
        location: data.location || 'General',
        volumeCubicMeters: data.volume,
        status: 'EMPTY'
      };

      await apiPost('/tanks', payload);
      setShowAddTankModal(false);
      fetchTanks();
      toast.success('Tank created successfully');
    } catch (err) {
      console.error('Failed to create tank:', err);
      toast.error('Failed to create tank: ' + (err as Error).message);
    }
  };

  const handleUpdateTank = async (data: { name: string; capacity: number; volume: number; location: string }) => {
    if (!editTankId) return;
    try {
      const payload = {
        name: data.name,
        location: data.location,
        volumeCubicMeters: data.volume,
        biomassLimit: data.capacity
      };

      // NOTE: The current backend (v1) does not expose a PATCH/PUT endpoint for tanks.
      // This has been verified via OpenAPI documentation check.
      // Attempting anyway as a fallback, but handling failure specifically.
      try {
          await apiPatch(`/tanks/${editTankId}`, payload);
          toast.success('Tank updated successfully');
      } catch (patchErr: any) {
          if (patchErr.message.includes('404')) {
              // Try PUT as secondary alternative
              try {
                  await apiPut(`/tanks/${editTankId}`, payload);
                  toast.success('Tank updated successfully');
              } catch (putErr) {
                  throw new Error('This feature is currently not supported by the backend API (404 Not Found). Please contact the system administrator.');
              }
          } else {
              throw patchErr;
          }
      }

      setShowEditModal(false);
      setEditTankId(null);
      setEditingTank(null);
      fetchTanks();
    } catch (err) {
      console.error('Failed to update tank:', err);
      toast.error('Failed to update tank: ' + (err as Error).message);
    }
  };

  const handleDeleteTank = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiDelete(`/tanks/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      fetchTanks();
      toast.success('Tank deleted successfully');
    } catch (err) {
      console.error('Failed to delete tank:', err);
      toast.error('Failed to delete tank: ' + (err as Error).message);
      setDeleteConfirmId(null);
    }
  };

  useEffect(() => {
    fetchTanks();
  }, [fetchTanks]);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'critical': return 'bg-[#EF4444]';
      case 'warning': return 'bg-[#F59E0B]';
      case 'acceptable': return 'bg-[#3B82F6]';
      case 'optimal': return 'bg-[#10B981]';
      case 'active': return 'bg-[#10B981]';
      case 'maintenance': return 'bg-purple-500';
      case 'empty': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  if (viewMode === 'detail' && selectedTank) {
    return <TankDetailView user={user} tank={selectedTank} onBack={() => setViewMode('list')} />;
  }

  const filteredTanks = tanks.filter(tank => {
    if (statusFilter === 'ALL') return true;
    return (tank.status ?? '').toUpperCase() === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation Bar */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-6 h-6" />
            <span className="text-xl font-semibold">Tank Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarm?.name}</span>
            <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-gray-900">All Tanks</h1>
          <Button className="bg-[#088395] hover:bg-[#0A4D68]" onClick={() => setShowAddTankModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Tank
          </Button>
        </div>

        {/* Status Filter Bar */}
        <div className="flex flex-wrap gap-2">
          {['ALL', 'ACTIVE', 'INACTIVE', 'MAINTENANCE', 'EMPTY'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              className={statusFilter === status ? 'bg-[#088395] hover:bg-[#0A4D68]' : ''}
              onClick={() => setStatusFilter(status as any)}
            >
              {status}
            </Button>
          ))}
        </div>

        <AddTankModal
          open={showAddTankModal}
          onOpenChange={setShowAddTankModal}
          onConfirm={handleAddTank}
        />

        {/* Error banner */}
        {tanksError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Failed to load tanks</p>
              <p className="text-xs text-red-600 mt-0.5">{tanksError}</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchTanks}>Retry</Button>
          </div>
        )}

        {/* Tank Grid */}
        {tanksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="bg-white shadow-sm animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                  <div className="h-12 bg-gray-100 rounded" />
                  <div className="h-10 bg-gray-100 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTanks.length === 0 && !tanksError ? (
          <div className="text-center py-16">
            <Fish className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} tanks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTanks.map((tank) => (
              <Card
                key={tank.id}
                className="bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedTank(tank);
                  setViewMode('detail');
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{tank.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(tank.status ?? '')} text-white text-[10px]`}>
                        {(tank.status ?? 'unknown').toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setEditingTank({
                              name: tank.name,
                              location: tank.location || 'General',
                              capacity: tank.capacity || 25000,
                              volume: tank.volume || 50
                            });
                            setEditTankId(tank.id);
                            setShowEditModal(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            setDeleteConfirmId(tank.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{tank.species}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Biomass */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Biomass</span>
                      <span className="font-medium">{tank.biomass as number} / {tank.capacity} kg</span>
                    </div>
                    <Progress value={Math.min(((tank.biomass as number) / (tank.capacity as number)) * 100, 100)} className="h-2" />
                    {(tank.biomass as number) > (tank.capacity as number) && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Overstocked by {Math.round((((tank.biomass as number) - (tank.capacity as number)) / (tank.capacity as number)) * 100)}%
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
            <AlertDialogAction onClick={handleDeleteTank} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Tank
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddTankModal
        open={showAddTankModal}
        onOpenChange={setShowAddTankModal}
        onConfirm={handleAddTank}
        mode="add"
      />

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
