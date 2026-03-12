import { useState, useEffect, ChangeEvent } from 'react';
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
import { Wheat, Plus, Edit, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { User, Farm, BuoyancyType, ManufacturingProcess, GrowthStage } from '../types';
import { mockFarms } from '../mockData';
import { getFoodTypes, createFoodType, updateFoodType, deleteFoodType, FoodType } from '../services/foodTypesApi';

interface FoodTypeManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function FoodTypeManagement({ user, selectedFarm }: FoodTypeManagementProps) {
  const currentFarm = selectedFarm || mockFarms[0];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    notes: ''
  });

  const fetchFoodTypes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFoodTypes();
      setFoodTypes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch food types');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodTypes();
  }, []);

  const handleEdit = (foodType: FoodType) => {
    setFormData({
      name: foodType.name,
      arabicName: foodType.arabicName || '',
      proteinPercentage: foodType.proteinPercentage,
      fatPercentage: foodType.fatPercentage || 0,
      fiberPercentage: foodType.fiberPercentage || 0,
      moisturePercentage: foodType.moisturePercentage || 0,
      ashPercentage: foodType.ashPercentage || 0,
      pelletSizeMm: foodType.pelletSizeMm,
      buoyancyType: foodType.buoyancyType,
      manufacturingProcess: foodType.manufacturingProcess,
      applicableStages: foodType.applicableStages,
      minFishWeightGrams: foodType.minFishWeightGrams || 0,
      maxFishWeightGrams: foodType.maxFishWeightGrams || 0,
      shelfLifeDays: foodType.shelfLifeDays || 180,
      storageInstructions: foodType.storageInstructions || '',
      waterStabilityMinutes: foodType.waterStabilityMinutes || 30,
      isActive: foodType.isActive,
      notes: foodType.notes || ''
    });
    setEditingId(foodType.id);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateFoodType(editingId, formData);
      } else {
        await createFoodType(formData);
      }
      await fetchFoodTypes();
      setShowCreateModal(false);
      setEditingId(null);
      toast.success(editingId ? 'Food type updated' : 'Food type created');
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
        notes: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save food type');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteFoodType(deleteConfirmId);
      await fetchFoodTypes();
      setDeleteConfirmId(null);
      toast.success('Food type deleted successfully');
    } catch (err: any) {
      toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
      setDeleteConfirmId(null);
    }
  };

  const toggleStage = (stage: GrowthStage) => {
    setFormData({
      ...formData,
      applicableStages: formData.applicableStages.includes(stage)
        ? formData.applicableStages.filter(s => s !== stage)
        : [...formData.applicableStages, stage]
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Top Navigation Bar */}
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Fish Feed Products</h2>
            <p className="text-gray-600 text-sm mt-1">Manage feed types with nutritional composition and physical properties</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchFoodTypes}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                  buoyancyType: 'FLOATING',
                  manufacturingProcess: 'EXTRUDED',
                  applicableStages: [],
                  minFishWeightGrams: 0,
                  maxFishWeightGrams: 0,
                  shelfLifeDays: 180,
                  storageInstructions: '',
                  waterStabilityMinutes: 30,
                  isActive: true,
                  notes: ''
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
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-10 h-10 animate-spin text-[#088395] mb-4" />
            <p className="text-gray-500">Loading food types...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {foodTypes.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-lg border-2 border-dashed border-gray-200">
                <Wheat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No food types found. Add your first feed product!</p>
              </div>
            ) : (
              foodTypes.map((foodType) => (
                <Card key={foodType.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
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
                      <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                        <Wheat className="w-6 h-6 text-[#F59E0B]" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Nutritional Composition */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Nutritional Composition</h4>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
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
                        <div className="flex justify-between">
                          <span className="text-gray-600">Moisture:</span>
                          <span className="font-medium">{foodType.moisturePercentage}%</span>
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
                        {foodType.applicableStages.map((stage) => (
                          <Badge key={stage} className="bg-[#05BFDB] text-white text-xs">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Fish Weight Range */}
                    {(foodType.minFishWeightGrams !== undefined || foodType.maxFishWeightGrams !== undefined) && (
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <span className="text-gray-600">Fish Weight:</span>
                        <span className="font-medium ml-1">
                          {foodType.minFishWeightGrams || 0} - {foodType.maxFishWeightGrams || '∞'}g
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
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteConfirmId(foodType.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Food Type' : 'Create New Food Type'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    placeholder="e.g., High Protein Tilapia Feed 32%"
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Arabic Name</Label>
                  <Input
                    placeholder="e.g., علف البلطي عالي البروتين"
                    value={formData.arabicName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, arabicName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Nutritional Composition */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Nutritional Composition</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Protein (%) *</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.proteinPercentage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, proteinPercentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Fat (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fatPercentage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fatPercentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Fiber (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fiberPercentage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fiberPercentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Moisture (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.moisturePercentage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, moisturePercentage: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Ash (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.ashPercentage}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ashPercentage: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Physical Properties */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Physical Properties</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Pellet Size (mm) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="10"
                    value={formData.pelletSizeMm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, pelletSizeMm: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Buoyancy Type *</Label>
                  <Select
                    value={formData.buoyancyType}
                    onValueChange={(value) => setFormData({ ...formData, buoyancyType: value as BuoyancyType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    onValueChange={(value) => setFormData({ ...formData, manufacturingProcess: value as ManufacturingProcess })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXTRUDED">Extruded</SelectItem>
                      <SelectItem value="PELLETIZED">Pelletized</SelectItem>
                      <SelectItem value="CRUMBLED">Crumbled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Applicable Stages */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Applicable Growth Stages *</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Fry */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fry Stages</p>
                  {['FRY_1', 'FRY_2'].map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={stage}
                        checked={formData.applicableStages.includes(stage as GrowthStage)}
                        onChange={() => toggleStage(stage as GrowthStage)}
                        className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                      />
                      <label htmlFor={stage} className="text-sm font-medium text-gray-700">
                        {stage.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Fingerling */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fingerling Stages</p>
                  {['FINGERLING_1', 'FINGERLING_2'].map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={stage}
                        checked={formData.applicableStages.includes(stage as GrowthStage)}
                        onChange={() => toggleStage(stage as GrowthStage)}
                        className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                      />
                      <label htmlFor={stage} className="text-sm font-medium text-gray-700">
                        {stage.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Juvenile */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Juvenile Stages</p>
                  {['JUVENILE_1', 'JUVENILE_2', 'JUVENILE_3'].map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={stage}
                        checked={formData.applicableStages.includes(stage as GrowthStage)}
                        onChange={() => toggleStage(stage as GrowthStage)}
                        className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                      />
                      <label htmlFor={stage} className="text-sm font-medium text-gray-700">
                        {stage.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Adult */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Adult Stages</p>
                  {['ADULT_1', 'ADULT_2', 'ADULT_3'].map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={stage}
                        checked={formData.applicableStages.includes(stage as GrowthStage)}
                        onChange={() => toggleStage(stage as GrowthStage)}
                        className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                      />
                      <label htmlFor={stage} className="text-sm font-medium text-gray-700">
                        {stage.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Finishing */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Finishing Stages</p>
                  {['FINISHING_1', 'FINISHING_2', 'FINISHING_3'].map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={stage}
                        checked={formData.applicableStages.includes(stage as GrowthStage)}
                        onChange={() => toggleStage(stage as GrowthStage)}
                        className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                      />
                      <label htmlFor={stage} className="text-sm font-medium text-gray-700">
                        {stage.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>

                {/* Pre-Harvest */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Harvest Prep</p>
                  {['PRE_HARVEST'].map((stage) => (
                    <div key={stage} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={stage}
                        checked={formData.applicableStages.includes(stage as GrowthStage)}
                        onChange={() => toggleStage(stage as GrowthStage)}
                        className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                      />
                      <label htmlFor={stage} className="text-sm font-medium text-gray-700">
                        {stage.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fish Weight Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Fish Weight Range (Optional)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Fish Weight (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.minFishWeightGrams}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, minFishWeightGrams: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Maximum Fish Weight (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.maxFishWeightGrams}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxFishWeightGrams: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Quality & Storage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Quality & Storage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Shelf Life (days)</Label>
                  <Input
                    type="number"
                    value={formData.shelfLifeDays}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, shelfLifeDays: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Water Stability (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.waterStabilityMinutes}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, waterStabilityMinutes: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Storage Instructions</Label>
                <Textarea
                  placeholder="e.g., Store in cool, dry place away from direct sunlight"
                  value={formData.storageInstructions}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, storageInstructions: e.target.value })}
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
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes or specifications..."
                  value={formData.notes}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                {editingId ? 'Update Food Type' : 'Create Food Type'}
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
