import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Wheat, Plus, Edit, Trash2 } from 'lucide-react';
import { User, Farm, BuoyancyType, ManufacturingProcess, GrowthStage } from '../types';
import { mockFarms } from '../mockData';

interface FoodTypeManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function FoodTypeManagement({ user, selectedFarm }: FoodTypeManagementProps) {
  const currentFarm = selectedFarm || mockFarms[0];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Mock food types
  const foodTypes = [
    {
      id: '1',
      name: 'High Protein Tilapia Feed 32%',
      arabicName: 'علف البلطي عالي البروتين 32%',
      proteinPercentage: 32,
      fatPercentage: 6,
      fiberPercentage: 4,
      pelletSizeMm: 3,
      buoyancyType: 'FLOATING' as BuoyancyType,
      manufacturingProcess: 'EXTRUDED' as ManufacturingProcess,
      applicableStages: ['GROWER', 'FINISHER'] as GrowthStage[],
      minFishWeightGrams: 50,
      maxFishWeightGrams: 500,
      isActive: true
    },
    {
      id: '2',
      name: 'Fingerling Starter 38%',
      arabicName: 'علف الزريعة 38%',
      proteinPercentage: 38,
      fatPercentage: 8,
      fiberPercentage: 3,
      pelletSizeMm: 1.5,
      buoyancyType: 'SLOW_SINKING' as BuoyancyType,
      manufacturingProcess: 'CRUMBLED' as ManufacturingProcess,
      applicableStages: ['FRY', 'FINGERLING'] as GrowthStage[],
      minFishWeightGrams: 1,
      maxFishWeightGrams: 50,
      isActive: true
    }
  ];

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

  const handleEdit = (foodType: any) => {
    setFormData(foodType);
    setEditingId(foodType.id);
    setShowCreateModal(true);
  };

  const handleSave = () => {
    console.log('Saving food type:', formData);
    setShowCreateModal(false);
    setEditingId(null);
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
          <Button 
            className="bg-[#088395] hover:bg-[#0A4D68]"
            onClick={() => {
              setEditingId(null);
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Food Type
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {foodTypes.map((foodType) => (
            <Card key={foodType.id} className="bg-white shadow-sm">
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
                    {foodType.applicableStages.map((stage) => (
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
                  <Button size="sm" variant="outline">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Arabic Name</Label>
                  <Input 
                    placeholder="e.g., علف البلطي عالي البروتين"
                    value={formData.arabicName}
                    onChange={(e) => setFormData({...formData, arabicName: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, proteinPercentage: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Fat (%)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.fatPercentage}
                    onChange={(e) => setFormData({...formData, fatPercentage: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Fiber (%)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.fiberPercentage}
                    onChange={(e) => setFormData({...formData, fiberPercentage: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Moisture (%)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.moisturePercentage}
                    onChange={(e) => setFormData({...formData, moisturePercentage: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Ash (%)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.ashPercentage}
                    onChange={(e) => setFormData({...formData, ashPercentage: parseFloat(e.target.value)})}
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
                    onChange={(e) => setFormData({...formData, pelletSizeMm: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Buoyancy Type *</Label>
                  <Select 
                    value={formData.buoyancyType}
                    onValueChange={(value) => setFormData({...formData, buoyancyType: value as BuoyancyType})}
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
                    onValueChange={(value) => setFormData({...formData, manufacturingProcess: value as ManufacturingProcess})}
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
              <div className="grid grid-cols-3 gap-3">
                {['FRY', 'FINGERLING', 'JUVENILE', 'GROWER', 'FINISHER'].map((stage) => (
                  <div key={stage} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={stage}
                      checked={formData.applicableStages.includes(stage as GrowthStage)}
                      onChange={() => toggleStage(stage as GrowthStage)}
                      className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                    />
                    <label htmlFor={stage} className="text-sm font-medium text-gray-700">
                      {stage}
                    </label>
                  </div>
                ))}
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
                    onChange={(e) => setFormData({...formData, minFishWeightGrams: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Maximum Fish Weight (g)</Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={formData.maxFishWeightGrams}
                    onChange={(e) => setFormData({...formData, maxFishWeightGrams: parseFloat(e.target.value)})}
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
                    onChange={(e) => setFormData({...formData, shelfLifeDays: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Water Stability (minutes)</Label>
                  <Input 
                    type="number" 
                    value={formData.waterStabilityMinutes}
                    onChange={(e) => setFormData({...formData, waterStabilityMinutes: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label>Storage Instructions</Label>
                <Textarea 
                  placeholder="e.g., Store in cool, dry place away from direct sunlight"
                  value={formData.storageInstructions}
                  onChange={(e) => setFormData({...formData, storageInstructions: e.target.value})}
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
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Additional notes or specifications..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
              >
                {editingId ? 'Update Food Type' : 'Create Food Type'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
