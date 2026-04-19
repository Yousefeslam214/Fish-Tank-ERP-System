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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Wheat, Plus, Edit, Trash2, AlertCircle, RefreshCw, Loader2, BellRing } from 'lucide-react';
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
import { User, Farm, BuoyancyType, ManufacturingProcess, GrowthStage } from '../types';
import { mockFarms } from '../mockData';
import { apiGet, apiPost, apiPut, apiDelete } from '../api';
import { toast } from 'sonner';

interface FoodTypeManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function FoodTypeManagement({ user, selectedFarm }: FoodTypeManagementProps) {
  const currentFarm = selectedFarm || mockFarms[0];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const showModal = showCreateModal;
  const setShowModal = setShowCreateModal;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // API State
  const [foodTypes, setFoodTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
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
    lowStockThreshold: 100
  });

  const fetchFoodTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<any>('/aquaculture/food-types?limit=100');
      const rawData = res.data || res || [];
      const normalizedData = Array.isArray(rawData) ? rawData.map((item: any) => ({
        ...item,
        id: item.id || item._id
      })) : [];
      
      console.log('✅ Fetched food types:', {
        originalCount: Array.isArray(rawData) ? rawData.length : 'not an array',
        normalizedCount: normalizedData.length,
        normalizedData
      });
      setFoodTypes(normalizedData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoodTypes();
  }, [fetchFoodTypes]);

  const handleEdit = (foodType: any) => {
    setFormData({
      ...foodType,
      lowStockThreshold: foodType.lowStockThreshold || 100
    });
    setEditingId(foodType.id);
    setShowCreateModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiDelete(`/aquaculture/food-types/${deleteConfirmId}`);
      toast.success('Food type deleted');
      fetchFoodTypes();
    } catch (err) {
      toast.error('Failed to delete: ' + (err as Error).message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.name) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.arabicName) {
      toast.error('Arabic product name is required');
      return;
    }
    if (!formData.proteinPercentage || formData.proteinPercentage <= 0) {
      toast.error('Invalid protein percentage');
      return;
    }
    if (!formData.pelletSizeMm || formData.pelletSizeMm <= 0) {
      toast.error('Invalid pellet size');
      return;
    }
    if (!formData.applicableStages || formData.applicableStages.length === 0) {
      toast.error('Please select at least one applicable growth stage');
      return;
    }

    setSaving(true);
    setSaveError(null);

    // Sanitize payload: Omit restricted fields
    const { id, createdAt, updatedAt, deletedAt, ...submissionData } = formData as any;

    try {
      if (editingId) {
        await apiPut(`/aquaculture/food-types/${editingId}`, submissionData);
        toast.success('Food type updated');
      } else {
        await apiPost('/aquaculture/food-types', submissionData);
        toast.success('Food type created');
      }
      setShowCreateModal(false);
      setEditingId(null);
      fetchFoodTypes();
      // Reset form
      setFormData({
        name: '',
        arabicName: '',
        proteinPercentage: 30,
        fatPercentage: 6,
        fiberPercentage: 4,
        moisturePercentage: 10,
        ashPercentage: 12,
        pelletSizeMm: 3,
        buoyancyType: 'FLOATING',
        manufacturingProcess: 'EXTRUDED',
        applicableStages: [],
        minFishWeightGrams: 0,
        maxFishWeightGrams: 0,
        shelfLifeDays: 180,
        storageInstructions: '',
        waterStabilityMinutes: 30,
        isActive: true,
        notes: '',
        lowStockThreshold: 100
      });
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
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFoodTypes()}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              className="bg-[#088395] hover:bg-[#0A4D68]"
              onClick={() => {
                setEditingId(null);
                setFormData({
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
                  lowStockThreshold: 100
                });
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Food Type
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Failed to load feed types</p>
              <p className="text-xs mt-0.5">{error}</p>
            </div>
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => fetchFoodTypes()}>Retry</Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p>Fetching feed catalogue...</p>
            </div>
          ) : foodTypes.length === 0 ? (
            <div className="col-span-full py-20 bg-white border border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400">
              <Plus className="w-10 h-10 mb-4 opacity-20" />
              <p>No feed types registered yet.</p>
              <Button variant="link" onClick={() => setShowCreateModal(true)}>Add your first food type</Button>
            </div>
          ) : (
            foodTypes.map((foodType) => (
              <Card key={foodType.id || foodType._id} className="bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{foodType.name}</CardTitle>
                        {foodType.isActive && (
                          <Badge className="bg-[#10B981] text-white text-xs">Active</Badge>
                        )}
                      </div>
                      {foodType.arabicName && (
                        <p className="text-sm text-gray-500 mt-1">{foodType.arabicName}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                        <Wheat className="w-6 h-6 text-[#F59E0B]" />
                      </div>
                      <Badge variant="secondary" className="bg-[#088395]/10 text-[#088395] border-none flex gap-1 items-center px-2 py-0.5">
                        <BellRing className="w-3 h-3" />
                        <span className="text-[10px] font-bold">{foodType.lowStockThreshold || 100} kg</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Nutritional Composition */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Nutritional Composition</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protein:</span>
                        <span className="font-medium">{foodType.proteinPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fat:</span>
                        <span className="font-medium">{foodType.fatPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fiber:</span>
                        <span className="font-medium">{foodType.fiberPercentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Physical Properties */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Physical Properties</h4>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {foodType.pelletSizeMm}mm
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {foodType.buoyancyType}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {foodType.manufacturingProcess}
                      </Badge>
                    </div>
                  </div>

                  {/* Applicable Stages */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Growth Stages</h4>
                    <div className="flex gap-1 flex-wrap">
                      {foodType.applicableStages.map((stage: any) => (
                        <Badge key={stage} className="bg-[#05BFDB] text-white text-xs">
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Fish Weight Range */}
                  {foodType.minFishWeightGrams && foodType.maxFishWeightGrams && (
                    <div className="bg-gray-50 p-2 rounded text-xs">
                      <span className="text-gray-600">Fish Weight:</span>
                      <span className="font-medium ml-1">
                        {foodType.minFishWeightGrams}-{foodType.maxFishWeightGrams}g
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(foodType)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setDeleteConfirmId(foodType.id || foodType._id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )))}
        </div>
      </div>

      {/* ── Create / Edit Modal ── */}
      <Dialog open={showCreateModal} onOpenChange={(open: boolean) => { if (!saving) setShowCreateModal(open); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Food Type' : 'Create New Food Type'}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Form for specifying nutritional composition, physical properties, and growth stages of fish feed.
            </DialogDescription>
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Arabic Name *</Label>
                  <Input
                    placeholder="e.g., علف البلطي عالي البروتين"
                    value={formData.arabicName}
                    onChange={(e) => setFormData({ ...formData, arabicName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Inventory Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#088395]" />
                Inventory Settings
              </h3>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Low Stock Threshold (kg) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 100"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <p className="text-xs text-gray-500 pb-2 italic">
                  Systems will alert when stock levels fall below this value.
                </p>
              </div>
            </div>

            {/* Nutritional Composition */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Nutritional Composition
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Protein (%) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.proteinPercentage}
                    onChange={(e) => setFormData({ ...formData, proteinPercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Fat (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fatPercentage}
                    onChange={(e) => setFormData({ ...formData, fatPercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Fiber (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fiberPercentage}
                    onChange={(e) => setFormData({ ...formData, fiberPercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Moisture (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.moisturePercentage}
                    onChange={(e) => setFormData({ ...formData, moisturePercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Ash (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.ashPercentage}
                    onChange={(e) => setFormData({ ...formData, ashPercentage: parseFloat(e.target.value) || 0 })}
                  />
                </div>
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
                    onChange={(e) => setFormData({ ...formData, pelletSizeMm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Buoyancy Type *</Label>
                  <Select
                    value={formData.buoyancyType}
                    onValueChange={(value: any) => setFormData({ ...formData, buoyancyType: value as BuoyancyType })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLOATING">Floating</SelectItem>
                      <SelectItem value="SINKING">Sinking</SelectItem>
                      <SelectItem value="SLOW_SINKING">Slow Sinking</SelectItem>
                      <SelectItem value="SEMI_FLOATING">Semi-Floating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Manufacturing Process *</Label>
                  <Select
                    value={formData.manufacturingProcess}
                    onValueChange={(value: any) => setFormData({ ...formData, manufacturingProcess: value as ManufacturingProcess })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXTRUDED">Extruded</SelectItem>
                      <SelectItem value="PELLETED">Pelleted</SelectItem>
                      <SelectItem value="MILLED">Milled</SelectItem>
                      <SelectItem value="CRUMBLED">Crumbled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Applicable Growth Stages */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Applicable Growth Stages *</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  'FRY_1', 'FRY_2',
                  'FINGERLING_1', 'FINGERLING_2',
                  'JUVENILE_1', 'JUVENILE_2', 'JUVENILE_3',
                  'ADULT_1', 'ADULT_2', 'ADULT_3',
                  'FINISHING_1', 'FINISHING_2', 'FINISHING_3',
                  'PRE_HARVEST'
                ].map((stage) => (
                  <div key={stage} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-transparent hover:border-[#088395]/30 transition-colors">
                    <input
                      type="checkbox"
                      id={stage}
                      checked={formData.applicableStages.includes(stage as any)}
                      onChange={() => toggleStage(stage as any)}
                      className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                    />
                    <label htmlFor={stage} className="text-[10px] font-bold text-gray-700 uppercase tracking-tight cursor-pointer">
                      {stage.replace('_', ' ')}
                    </label>
                  </div>
                ))}
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
                    onChange={(e) => setFormData({ ...formData, minFishWeightGrams: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Maximum Fish Weight (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.maxFishWeightGrams}
                    onChange={(e) => setFormData({ ...formData, maxFishWeightGrams: parseFloat(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, shelfLifeDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Water Stability (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.waterStabilityMinutes}
                    onChange={(e) => setFormData({ ...formData, waterStabilityMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Storage Instructions</Label>
                <Textarea
                  placeholder="e.g., Store in cool, dry place away from direct sunlight"
                  value={formData.storageInstructions}
                  onChange={(e) => setFormData({ ...formData, storageInstructions: e.target.value })}
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
                  onCheckedChange={(checked: any) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes or specifications..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                onClick={() => setShowCreateModal(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : (editingId ? 'Update Food Type' : 'Create Food Type')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open: boolean) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the food type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
