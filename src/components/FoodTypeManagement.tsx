// ============================================================
// FoodTypeManagement.tsx  –  Hazem Yasser
// ============================================================
// WHY this file fetches from the API:
//   All create/edit/list operations on fish feed products must
//   be persisted on the server so every team member sees the
//   same catalogue. Local mock state would be lost on refresh
//   and would not be visible to co-workers.
//
// Endpoints used:
//   GET  /api/v1/aquaculture/food-types        – list all
//   POST /api/v1/aquaculture/food-types        – create new
//   PUT  /api/v1/aquaculture/food-types/:id    – update existing
//   GET  /api/v1/aquaculture/food-types/species?name=X – filter by species
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import {
  Wheat,
  Plus,
  Edit,
  RefreshCw,
  AlertCircle,
  Search,
  Loader2,
} from 'lucide-react';
import { User, Farm, BuoyancyType, ManufacturingProcess, GrowthStage } from '../types';
import { mockFarms } from '../mockData';
import { apiGet, apiPost, apiPut } from '../api';

// ── API Response shape ──
// WHY define this separately from the local form state?
// The API returns snake_case or camelCase fields that may differ
// from what our form needs. Keeping a dedicated interface avoids
// accidental field mismatches when mapping the response to state.
interface ApiFoodType {
  id: string;
  name: string;
  arabicName?: string;
  proteinPercentage?: number;
  fatPercentage?: number;
  fiberPercentage?: number;
  moisturePercentage?: number;
  ashPercentage?: number;
  pelletSizeMm?: number;
  buoyancyType?: BuoyancyType;
  manufacturingProcess?: ManufacturingProcess;
  applicableStages?: GrowthStage[];
  minFishWeightGrams?: number;
  maxFishWeightGrams?: number;
  shelfLifeDays?: number;
  storageInstructions?: string;
  waterStabilityMinutes?: number;
  isActive?: boolean;
  notes?: string;
}

interface FoodTypeManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

const EMPTY_FORM = {
  name: '',
  arabicName: '',
  proteinPercentage: 30,
  fatPercentage: 6,
  fiberPercentage: 4,
  moisturePercentage: 10,
  ashPercentage: 12,
  pelletSizeMm: 3,
  buoyancyType: 'FLOATING' as BuoyancyType,
  manufacturingProcess: 'EXTRUDED' as ManufacturingProcess,
  applicableStages: [] as GrowthStage[],
  minFishWeightGrams: 0,
  maxFishWeightGrams: 0,
  shelfLifeDays: 180,
  storageInstructions: '',
  waterStabilityMinutes: 30,
  isActive: true,
  notes: '',
};

export default function FoodTypeManagement({ user, selectedFarm }: FoodTypeManagementProps) {
  const currentFarm = selectedFarm || mockFarms[0];

  // ── Data state ──
  const [foodTypes, setFoodTypes] = useState<ApiFoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── UI state ──
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState(EMPTY_FORM);

  // ── Fetch food types ──
  // WHY useCallback?
  // So we can call fetchFoodTypes() from the "refresh" button
  // without re-creating the function on every render.
  const fetchFoodTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // The endpoint may return an array directly or { data: [...] }
      const res = await apiGet<ApiFoodType[] | { data: ApiFoodType[] }>('/aquaculture/food-types');
      const list = Array.isArray(res) ? res : (res as { data: ApiFoodType[] }).data ?? [];
      setFoodTypes(list);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoodTypes();
  }, [fetchFoodTypes]);

  // ── Filter ──
  const filtered = foodTypes.filter(ft =>
    ft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ft.arabicName ?? '').includes(searchQuery)
  );

  // ── Open create modal ──
  const handleCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setSaveError(null);
    setShowModal(true);
  };

  // ── Open edit modal ──
  const handleEdit = (ft: ApiFoodType) => {
    setEditingId(ft.id);
    setFormData({
      name: ft.name,
      arabicName: ft.arabicName ?? '',
      proteinPercentage: ft.proteinPercentage ?? 30,
      fatPercentage: ft.fatPercentage ?? 6,
      fiberPercentage: ft.fiberPercentage ?? 4,
      moisturePercentage: ft.moisturePercentage ?? 10,
      ashPercentage: ft.ashPercentage ?? 12,
      pelletSizeMm: ft.pelletSizeMm ?? 3,
      buoyancyType: ft.buoyancyType ?? 'FLOATING',
      manufacturingProcess: ft.manufacturingProcess ?? 'EXTRUDED',
      applicableStages: ft.applicableStages ?? [],
      minFishWeightGrams: ft.minFishWeightGrams ?? 0,
      maxFishWeightGrams: ft.maxFishWeightGrams ?? 0,
      shelfLifeDays: ft.shelfLifeDays ?? 180,
      storageInstructions: ft.storageInstructions ?? '',
      waterStabilityMinutes: ft.waterStabilityMinutes ?? 30,
      isActive: ft.isActive ?? true,
      notes: ft.notes ?? '',
    });
    setSaveError(null);
    setShowModal(true);
  };

  // ── Save (create or update) ──
  // WHY two separate API calls for create vs. update?
  // REST conventions: POST creates a new resource while PUT/PATCH
  // replaces an existing one identified by ID. Mixing them up would
  // corrupt data on the server.
  const handleSave = async () => {
    if (!formData.name.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        // Update existing food type
        await apiPut(`/aquaculture/food-types/${editingId}`, formData);
      } else {
        // Create new food type
        await apiPost('/aquaculture/food-types', formData);
      }
      setShowModal(false);
      setEditingId(null);
      // Re-fetch to get the server-generated ID and any computed fields
      await fetchFoodTypes();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStage = (stage: GrowthStage) => {
    setFormData(prev => ({
      ...prev,
      applicableStages: prev.applicableStages.includes(stage)
        ? prev.applicableStages.filter(s => s !== stage)
        : [...prev.applicableStages, stage],
    }));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Top Navigation Bar ── */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="w-6 h-6" />
            <span className="text-xl font-semibold">Food Type Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarm.name}</span>
            <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Header + Controls ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Fish Feed Products</h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage feed types with nutritional composition and physical properties
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search feed types…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 w-52"
              />
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFoodTypes}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>

            {/* Add */}
            <Button className="bg-[#088395] hover:bg-[#0A4D68]" onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Food Type
            </Button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load food types</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto"
              onClick={fetchFoodTypes}
            >
              Retry
            </Button>
          </div>
        )}

        {/* ── Food Type Cards ── */}
        {loading ? (
          // Skeleton placeholders while fetching
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="bg-white shadow-sm animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Wheat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchQuery ? 'No feed types match your search' : 'No feed types yet'}
            </p>
            {!searchQuery && (
              <Button className="mt-4 bg-[#088395]" onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" /> Add First Feed Type
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ft => (
              <Card key={ft.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{ft.name}</CardTitle>
                        {ft.isActive ? (
                          <Badge className="bg-[#10B981] text-white text-xs">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      {ft.arabicName && (
                        <p className="text-sm text-gray-500 mt-1">{ft.arabicName}</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                      <Wheat className="w-6 h-6 text-[#F59E0B]" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Nutritional Composition */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Nutritional Composition
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein:</span>
                        <span className="font-medium">{ft.proteinPercentage ?? '–'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fat:</span>
                        <span className="font-medium">{ft.fatPercentage ?? '–'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fiber:</span>
                        <span className="font-medium">{ft.fiberPercentage ?? '–'}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Physical Properties */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Physical Properties
                    </h4>
                    <div className="flex gap-2 flex-wrap">
                      {ft.pelletSizeMm != null && (
                        <Badge variant="outline" className="text-xs">
                          {ft.pelletSizeMm}mm
                        </Badge>
                      )}
                      {ft.buoyancyType && (
                        <Badge variant="outline" className="text-xs">
                          {ft.buoyancyType}
                        </Badge>
                      )}
                      {ft.manufacturingProcess && (
                        <Badge variant="outline" className="text-xs">
                          {ft.manufacturingProcess}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Growth Stages */}
                  {(ft.applicableStages ?? []).length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Growth Stages
                      </h4>
                      <div className="flex gap-1 flex-wrap">
                        {ft.applicableStages!.map(stage => (
                          <Badge key={stage} className="bg-[#05BFDB] text-white text-xs">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fish Weight Range */}
                  {ft.minFishWeightGrams != null && ft.maxFishWeightGrams != null &&
                    ft.minFishWeightGrams > 0 && ft.maxFishWeightGrams > 0 && (
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <span className="text-gray-600">Fish Weight Range: </span>
                        <span className="font-medium">
                          {ft.minFishWeightGrams}–{ft.maxFishWeightGrams}g
                        </span>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(ft)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ── */}
      <Dialog open={showModal} onOpenChange={(open: boolean) => { if (!saving) setShowModal(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Food Type' : 'Create New Food Type'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., High Protein Tilapia Feed 32%"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Arabic Name</Label>
                  <Input
                    placeholder="e.g., علف البلطي عالي البروتين"
                    value={formData.arabicName}
                    onChange={e => setFormData({ ...formData, arabicName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Nutritional Composition */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Nutritional Composition
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    ['Protein (%)*', 'proteinPercentage'],
                    ['Fat (%)', 'fatPercentage'],
                    ['Fiber (%)', 'fiberPercentage'],
                    ['Moisture (%)', 'moisturePercentage'],
                    ['Ash (%)', 'ashPercentage'],
                  ] as [string, keyof typeof formData][]
                ).map(([label, field]) => (
                  <div key={field}>
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData[field] as number}
                      onChange={e =>
                        setFormData({ ...formData, [field]: parseFloat(e.target.value) })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Physical Properties */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Physical Properties
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Pellet Size (mm) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={formData.pelletSizeMm}
                    onChange={e =>
                      setFormData({ ...formData, pelletSizeMm: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Buoyancy Type *</Label>
                  <Select
                    value={formData.buoyancyType}
                    onValueChange={(v: string) =>
                      setFormData({ ...formData, buoyancyType: v as BuoyancyType })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLOATING">Floating</SelectItem>
                      <SelectItem value="SLOW_SINKING">Slow Sinking</SelectItem>
                      <SelectItem value="FAST_SINKING">Fast Sinking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Manufacturing Process *</Label>
                  <Select
                    value={formData.manufacturingProcess}
                    onValueChange={(v: string) =>
                      setFormData({ ...formData, manufacturingProcess: v as ManufacturingProcess })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXTRUDED">Extruded</SelectItem>
                      <SelectItem value="PELLETIZED">Pelletized</SelectItem>
                      <SelectItem value="CRUMBLED">Crumbled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Applicable Growth Stages */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Applicable Growth Stages *
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['FRY', 'FINGERLING', 'JUVENILE', 'GROWER', 'FINISHER'] as GrowthStage[]).map(
                  stage => (
                    <div key={stage} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`stage-${stage}`}
                        checked={formData.applicableStages.includes(stage)}
                        onChange={() => toggleStage(stage)}
                        className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                      />
                      <label htmlFor={`stage-${stage}`} className="text-sm font-medium text-gray-700">
                        {stage}
                      </label>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Fish Weight Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Fish Weight Range (Optional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Fish Weight (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minFishWeightGrams}
                    onChange={e =>
                      setFormData({ ...formData, minFishWeightGrams: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Maximum Fish Weight (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.maxFishWeightGrams}
                    onChange={e =>
                      setFormData({ ...formData, maxFishWeightGrams: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Quality & Storage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Quality & Storage
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shelf Life (days)</Label>
                  <Input
                    type="number"
                    value={formData.shelfLifeDays}
                    onChange={e =>
                      setFormData({ ...formData, shelfLifeDays: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>Water Stability (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.waterStabilityMinutes}
                    onChange={e =>
                      setFormData({ ...formData, waterStabilityMinutes: parseInt(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Storage Instructions</Label>
                <Textarea
                  placeholder="e.g., Store in cool, dry place away from direct sunlight"
                  value={formData.storageInstructions}
                  onChange={e =>
                    setFormData({ ...formData, storageInstructions: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            {/* Status & Notes */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium">Active Status</Label>
                  <p className="text-xs text-gray-600">Enable this food type for use in the system</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes or specifications..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Save error */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {saveError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : editingId ? (
                  'Update Food Type'
                ) : (
                  'Create Food Type'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
