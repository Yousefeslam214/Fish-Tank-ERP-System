import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Slider } from '../../ui/slider';
import { Alert, AlertDescription } from '../../ui/alert';
import { HarvestEvent, HarvestType } from '../../../types';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface HarvestDetailsStepProps {
  farmId: string;
  initialData: Partial<HarvestEvent>;
  onNext: (data: Partial<HarvestEvent>) => void;
  onCancel: () => void;
}

export const HarvestDetailsStep: React.FC<HarvestDetailsStepProps> = ({
  farmId,
  initialData,
  onNext,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<HarvestEvent>>({
    ...initialData,
    harvestDate: initialData.harvestDate || new Date().toISOString().split('T')[0],
    harvestTime: initialData.harvestTime || '08:30',
    harvestType: initialData.harvestType || 'PARTIAL',
    partialPercentage: initialData.partialPercentage || 50,
    selectiveMinWeight: initialData.selectiveMinWeight || 450
  });

  // Mock data - سيتم جلبه من context
  const mockTanks = [
    {
      id: 'tank-a03',
      name: 'Tank A-03',
      batchId: 'batch-123',
      batchNumber: '#123',
      fishCount: 850,
      avgWeight: 420,
      biomass: 357,
      daysOld: 45,
      stockedDate: 'Jan 5, 2026',
      fcr: 1.75,
      sgr: 2.8,
      species: 'Nile Tilapia'
    }
  ];

  const [selectedTank] = useState(mockTanks[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const estimatedWeight = calculateEstimatedWeight();
    
    onNext({
      ...formData,
      tankId: selectedTank.id,
      tankName: selectedTank.name,
      batchId: selectedTank.batchId,
      fishType: selectedTank.species,
      estimatedWeight,
      status: 'GRADING'
    });
  };

  const calculateEstimatedWeight = () => {
    if (formData.harvestType === 'FULL') {
      return selectedTank.biomass;
    } else if (formData.harvestType === 'PARTIAL') {
      return selectedTank.biomass * ((formData.partialPercentage || 50) / 100);
    } else {
      // SELECTIVE - تقدير بناءً على الحد الأدنى للوزن
      return selectedTank.biomass * 0.4; // تقدير تقريبي
    }
  };

  const getRemainingInfo = () => {
    if (formData.harvestType === 'PARTIAL') {
      const remaining = selectedTank.fishCount * (1 - (formData.partialPercentage || 50) / 100);
      const remainingWeight = selectedTank.biomass * (1 - (formData.partialPercentage || 50) / 100);
      return `Remaining: ${Math.round(remaining)} fish, ~${Math.round(remainingWeight)}kg in tank`;
    }
    return '';
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Harvest Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tank & Batch Selection */}
          <div className="space-y-2">
            <Label>Select Tank & Batch *</Label>
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="font-semibold text-lg text-[#0A4D68] mb-2">
                {selectedTank.name} - {selectedTank.batchNumber}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                <div>{selectedTank.fishCount} fish • {selectedTank.avgWeight}g avg • {selectedTank.biomass}kg biomass • {selectedTank.daysOld} days old</div>
                <div>Stocked: {selectedTank.stockedDate} • FCR: {selectedTank.fcr} • SGR: {selectedTank.sgr}%/day</div>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm">
              Change Tank/Batch ▼
            </Button>
          </div>

          {/* Harvest Type */}
          <div className="space-y-3">
            <Label>Harvest Type *</Label>
            
            <RadioGroup 
              value={formData.harvestType} 
              onValueChange={(value) => setFormData({ ...formData, harvestType: value as HarvestType })}
            >
              <div className="space-y-3">
                {/* Full Harvest */}
                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="FULL" id="full" />
                  <div className="flex-1">
                    <Label htmlFor="full" className="font-semibold cursor-pointer">
                      Full Harvest (100% of batch) 🟣
                    </Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Recommended for: End of cycle, tank cleaning
                    </p>
                  </div>
                </div>

                {/* Partial Harvest */}
                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="PARTIAL" id="partial" />
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="partial" className="font-semibold cursor-pointer">
                      Partial Harvest (Select percentage) 🟠
                    </Label>
                    {formData.harvestType === 'PARTIAL' && (
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center gap-4">
                          <Label className="min-w-24">Percentage:</Label>
                          <Slider 
                            value={[formData.partialPercentage || 50]}
                            onValueChange={(value) => setFormData({ ...formData, partialPercentage: value[0] })}
                            min={10}
                            max={90}
                            step={5}
                            className="flex-1"
                          />
                          <span className="font-bold text-[#0A4D68] min-w-16 text-right">
                            {formData.partialPercentage}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 pl-2">
                          = ~{Math.round(selectedTank.fishCount * (formData.partialPercentage || 50) / 100)} fish, 
                          ~{Math.round(selectedTank.biomass * (formData.partialPercentage || 50) / 100)}kg estimated
                        </div>
                        <div className="text-sm text-gray-600 pl-2">
                          {getRemainingInfo()}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      Recommended for: Size grading, thinning
                    </p>
                  </div>
                </div>

                {/* Selective Harvest */}
                <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-gray-50">
                  <RadioGroupItem value="SELECTIVE" id="selective" />
                  <div className="flex-1 space-y-3">
                    <Label htmlFor="selective" className="font-semibold cursor-pointer">
                      Selective Harvest (Large fish only) 🩷
                    </Label>
                    {formData.harvestType === 'SELECTIVE' && (
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center gap-4">
                          <Label className="min-w-24">Min Weight:</Label>
                          <Input
                            type="number"
                            value={formData.selectiveMinWeight}
                            onChange={(e) => setFormData({ ...formData, selectiveMinWeight: Number(e.target.value) })}
                            className="w-32"
                          />
                          <span>g</span>
                        </div>
                        <div className="text-sm text-gray-600 pl-2">
                          Est. Count: ~{Math.round(selectedTank.fishCount * 0.25)} fish, ~{Math.round(selectedTank.biomass * 0.4)}kg
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">
                      Recommended for: Market-ready fish, staggered harvest
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Harvest Date *</Label>
              <Input
                type="date"
                value={formData.harvestDate}
                onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Harvest Time *</Label>
              <Input
                type="time"
                value={formData.harvestTime}
                onChange={(e) => setFormData({ ...formData, harvestTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Estimated Weight */}
          <div className="space-y-2">
            <Label>Estimated Total Weight (for planning)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={calculateEstimatedWeight().toFixed(0)}
                readOnly
                className="bg-gray-50"
              />
              <span className="text-gray-600">kg (based on {formData.harvestType?.toLowerCase()} {formData.harvestType === 'PARTIAL' ? formData.partialPercentage + '%' : ''})</span>
            </div>
          </div>

          {/* Weather Check */}
          <Alert>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              <div className="font-semibold text-green-700 mb-1">⚠️ Weather Check:</div>
              <div className="text-sm space-y-1">
                <div>Temperature: 22°C ✅ Good for harvest</div>
                <div>Conditions: Clear, low wind ✅</div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Partial harvest to reduce density before summer. Targeting larger fish for premium market."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0A4D68] hover:bg-[#0A4D68]/90">
              Next: Grading →
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};
