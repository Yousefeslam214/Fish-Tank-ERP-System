import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Alert, AlertDescription } from '../../ui/alert';
import { HarvestEvent, HarvestGrading, HarvestCondition, GradeType, FishGradePricing } from '../../../types';
import { GradeCard } from '../GradeCard';
import { HarvestProgressBar } from '../HarvestProgressBar';
import { X, Save, AlertCircle } from 'lucide-react';

interface HarvestGradingStepProps {
  harvestData: Partial<HarvestEvent>;
  initialGradings: HarvestGrading[];
  onNext: (gradings: HarvestGrading[]) => void;
  onBack: () => void;
  onSaveDraft: () => void;
}

export const HarvestGradingStep: React.FC<HarvestGradingStepProps> = ({
  harvestData,
  initialGradings,
  onNext,
  onBack,
  onSaveDraft
}) => {
  const [gradings, setGradings] = useState<HarvestGrading[]>(initialGradings);
  const [selectedGrade, setSelectedGrade] = useState<FishGradePricing | null>(null);
  const [weight, setWeight] = useState<string>('');
  const [condition, setCondition] = useState<HarvestCondition>('EXCELLENT');
  const [notes, setNotes] = useState<string>('');

  // Log state changes to the console for the user
  useEffect(() => {
    console.log('--- Current Harvest Gradings State ---');
    console.log(gradings);
    console.log('Total weight graded:', gradings.reduce((sum, g) => sum + g.weightKg, 0), 'kg');
    console.log('--------------------------------------');
  }, [gradings]);

  // Mock grade pricing data
  const gradePricings: FishGradePricing[] = [
    {
      id: 'grade-super',
      fishTypeId: 'nile-tilapia',
      gradeName: 'Super',
      gradeType: 'SUPER',
      minWeight: 300,
      maxWeight: 500,
      numOfFishInKilo: 2,
      pricePerKg: 50,
      isWaste: false,
      isActive: true,
      color: '#10B981',
      icon: 'super'
    },
    {
      id: 'grade-1',
      fishTypeId: 'nile-tilapia',
      gradeName: 'Grade 1',
      gradeType: 'GRADE_1',
      minWeight: 200,
      maxWeight: 300,
      numOfFishInKilo: 3,
      pricePerKg: 45,
      isWaste: false,
      isActive: true,
      color: '#3B82F6',
      icon: 'grade1'
    },
    {
      id: 'grade-2',
      fishTypeId: 'nile-tilapia',
      gradeName: 'Grade 2',
      gradeType: 'GRADE_2',
      minWeight: 150,
      maxWeight: 200,
      numOfFishInKilo: 5,
      pricePerKg: 40,
      isWaste: false,
      isActive: true,
      color: '#F59E0B',
      icon: 'grade2'
    },
    {
      id: 'grade-sherr',
      fishTypeId: 'nile-tilapia',
      gradeName: 'Sherr',
      gradeType: 'SHERR',
      minWeight: 0,
      maxWeight: 150,
      numOfFishInKilo: 8,
      pricePerKg: 30,
      isWaste: false,
      isActive: true,
      color: '#EF4444',
      icon: 'sherr'
    },
    {
      id: 'grade-waste',
      fishTypeId: 'nile-tilapia',
      gradeName: 'Waste',
      gradeType: 'WASTE',
      minWeight: 0,
      maxWeight: 0,
      numOfFishInKilo: 0,
      pricePerKg: 0,
      isWaste: true,
      isActive: true,
      color: '#DC2626',
      icon: 'waste'
    }
  ];

  const handleAddGrading = () => {
    if (!selectedGrade || !weight || parseFloat(weight) <= 0) {
      return;
    }

    const weightKg = parseFloat(weight);
    const totalValue = weightKg * selectedGrade.pricePerKg;

    const newGrading: HarvestGrading = {
      id: `grading-${Date.now()}`,
      harvestEventId: harvestData.id || 'temp-id',
      pricingId: selectedGrade.id,
      gradeName: selectedGrade.gradeName,
      gradeType: selectedGrade.gradeType,
      sourceBatchId: harvestData.batchId || '',
      weightKg,
      condition,
      pricePerKg: selectedGrade.pricePerKg,
      totalValue,
      timestamp: new Date().toISOString(),
      notes: notes || undefined
    };

    console.log('Adding new grading record:', newGrading);
    setGradings([...gradings, newGrading]);

    // Reset form
    setWeight('');
    setNotes('');
    setCondition('EXCELLENT');
  };

  const handleDeleteGrading = (id: string) => {
    setGradings(gradings.filter(g => g.id !== id));
  };

  const getTotalGraded = () => {
    return gradings.reduce((sum, g) => sum + g.weightKg, 0);
  };

  const getTotalValue = () => {
    return gradings.reduce((sum, g) => sum + g.totalValue, 0);
  };

  const getProgress = () => {
    const estimated = harvestData.estimatedWeight || 0;
    const actual = getTotalGraded();
    return estimated > 0 ? (actual / estimated) * 100 : 0;
  };

  const handleNext = () => {
    if (gradings.length === 0) {
      alert('Please add at least one grading record');
      return;
    }
    onNext(gradings);
  };

  const getConditionIcon = (cond: HarvestCondition) => {
    switch (cond) {
      case 'EXCELLENT': return '⭐⭐⭐';
      case 'GOOD': return '⭐⭐';
      case 'ACCEPTABLE': return '⭐';
      case 'DAMAGED': return '❌';
      default: return '';
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <HarvestProgressBar
            estimated={harvestData.estimatedWeight || 0}
            actual={getTotalGraded()}
          />
        </CardContent>
      </Card>

      {/* Grading Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Add Grading Record</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Grade Selection */}
          <div className="space-y-3">
            <Label>Quick Grade Selection (tap to select):</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {gradePricings.map((grade) => (
                <GradeCard
                  key={grade.id}
                  gradeName={grade.gradeName}
                  gradeType={grade.gradeType}
                  weightRange={`${grade.minWeight}-${grade.maxWeight}g`}
                  pricePerKg={grade.pricePerKg}
                  color={grade.color}
                  icon={grade.icon}
                  selected={selectedGrade?.id === grade.id}
                  onClick={() => setSelectedGrade(grade)}
                />
              ))}
            </div>
          </div>

          {selectedGrade && (
            <>
              <Alert>
                <AlertDescription>
                  <div className="font-semibold">
                    Selected Grade: {selectedGrade.gradeName} ({selectedGrade.minWeight}-{selectedGrade.maxWeight}g) @ {selectedGrade.pricePerKg} EGP/kg
                  </div>
                </AlertDescription>
              </Alert>

              {/* Weight Entry */}
              <div className="space-y-2">
                <Label>Weight Entry *</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="35.5"
                    className="text-2xl h-16 text-center font-bold"
                  />
                  <span className="text-xl font-semibold">kg</span>
                </div>
                <div className="text-sm text-gray-600">
                  [Scan Scale 📊] or enter manually
                </div>
                {weight && parseFloat(weight) > 0 && (
                  <div className="text-lg font-semibold text-green-600">
                    💰 Value: {(parseFloat(weight) * selectedGrade.pricePerKg).toLocaleString()} EGP ({weight} × {selectedGrade.pricePerKg})
                  </div>
                )}
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label>Fish Condition:</Label>
                <RadioGroup value={condition} onValueChange={(v: string) => setCondition(v as HarvestCondition)}>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="EXCELLENT" id="excellent" />
                      <Label htmlFor="excellent" className="cursor-pointer">Excellent</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="GOOD" id="good" />
                      <Label htmlFor="good" className="cursor-pointer">Good</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ACCEPTABLE" id="acceptable" />
                      <Label htmlFor="acceptable" className="cursor-pointer">Acceptable</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DAMAGED" id="damaged" />
                      <Label htmlFor="damaged" className="cursor-pointer">Damaged</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Uniform size, good color, very active"
                  rows={2}
                />
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAddGrading}
                disabled={!weight || parseFloat(weight) <= 0}
                className="w-full bg-[#0A4D68] hover:bg-[#0A4D68]/90"
                size="lg"
              >
                ✓ Add Grade Record
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action to proceed to next step moved up or kept at bottom but history box removed */}

      {/* Warning */}
      {getProgress() < 100 && gradings.length > 0 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            ⚠️ Estimated Remaining: {(harvestData.estimatedWeight || 0) - getTotalGraded()} kg ({(100 - getProgress()).toFixed(0)}%)
            <br />
            Continue grading or proceed to review
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button variant="outline" onClick={onSaveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>
        <Button
          onClick={handleNext}
          disabled={gradings.length === 0}
          className="bg-[#0A4D68] hover:bg-[#0A4D68]/90"
        >
          Next Step →
        </Button>
      </div>
    </div>
  );
};
