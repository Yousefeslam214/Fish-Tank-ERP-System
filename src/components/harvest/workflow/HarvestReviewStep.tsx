import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Alert, AlertDescription } from '../../ui/alert';
import { HarvestEvent, HarvestGrading, HarvestCosts } from '../../../types';
import { GradeDistributionChart } from '../GradeDistributionChart';
import { FinancialSummaryCard } from '../FinancialSummaryCard';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

interface HarvestReviewStepProps {
  harvestData: Partial<HarvestEvent>;
  gradings: HarvestGrading[];
  onNext: (costs: HarvestCosts) => void;
  onBack: () => void;
}

export const HarvestReviewStep: React.FC<HarvestReviewStepProps> = ({
  harvestData,
  gradings,
  onNext,
  onBack
}) => {
  const [costs, setCosts] = useState<HarvestCosts>({
    laborCost: 250,
    transportCost: 100,
    packagingCost: 75,
    iceCost: 50,
    otherCost: 0
  });
  const [finalNotes, setFinalNotes] = useState('');

  const actualWeight = gradings.reduce((sum, g) => sum + g.weightKg, 0);
  const totalRevenue = gradings.reduce((sum, g) => sum + g.totalValue, 0);
  
  // Production costs (mock data - should come from batch tracking)
  const productionCosts = {
    feedCost: 3120,
    operatingCost: 805,
    fingerllingCost: 1000
  };
  
  const totalProductionCosts = productionCosts.feedCost + productionCosts.operatingCost + productionCosts.fingerllingCost;
  const totalHarvestCosts = costs.laborCost + costs.transportCost + costs.packagingCost + costs.iceCost + costs.otherCost;
  const totalCosts = totalProductionCosts + totalHarvestCosts;
  const netProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const costPerKg = actualWeight > 0 ? totalCosts / actualWeight : 0;
  const revenuePerKg = actualWeight > 0 ? totalRevenue / actualWeight : 0;
  const profitPerKg = actualWeight > 0 ? netProfit / actualWeight : 0;

  const variance = actualWeight - (harvestData.estimatedWeight || 0);
  const variancePercentage = harvestData.estimatedWeight ? (variance / harvestData.estimatedWeight) * 100 : 0;
  const accuracy = 100 - Math.abs(variancePercentage);

  // Calculate grade distribution
  const gradeDistribution = gradings.reduce((acc, grading) => {
    const existing = acc.find(g => g.name === grading.gradeName);
    if (existing) {
      existing.weight += grading.weightKg;
    } else {
      acc.push({
        name: grading.gradeName,
        weight: grading.weightKg,
        percentage: 0,
        color: getGradeColor(grading.gradeType)
      });
    }
    return acc;
  }, [] as Array<{ name: string; weight: number; percentage: number; color: string }>);

  // Calculate percentages
  gradeDistribution.forEach(grade => {
    grade.percentage = actualWeight > 0 ? (grade.weight / actualWeight) * 100 : 0;
  });

  // Expected distribution (species average)
  const expectedDistribution = [
    { name: 'Super', weight: actualWeight * 0.25, percentage: 25, color: '#10B981' },
    { name: 'Grade 1', weight: actualWeight * 0.40, percentage: 40, color: '#3B82F6' },
    { name: 'Grade 2', weight: actualWeight * 0.25, percentage: 25, color: '#F59E0B' },
    { name: 'Sherr', weight: actualWeight * 0.10, percentage: 10, color: '#EF4444' },
    { name: 'Waste', weight: 0, percentage: 0, color: '#DC2626' }
  ];

  function getGradeColor(gradeType: string): string {
    switch (gradeType) {
      case 'SUPER': return '#10B981';
      case 'GRADE_1': return '#3B82F6';
      case 'GRADE_2': return '#F59E0B';
      case 'SHERR': return '#EF4444';
      case 'WASTE': return '#DC2626';
      default: return '#6B7280';
    }
  }

  const handleComplete = () => {
    if (profitMargin < 15) {
      if (!confirm('Warning: Profit margin is below 15%. Do you want to proceed?')) {
        return;
      }
    }
    onNext(costs);
  };

  const remainingFish = harvestData.harvestType === 'PARTIAL' 
    ? Math.round((harvestData.partialPercentage || 0) / 100 * 850) // mock fish count
    : 0;

  return (
    <div className="space-y-6">
      {/* Harvest Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Harvest Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tank:</p>
              <p className="font-semibold">{harvestData.tankName || 'A-03'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Harvest Type:</p>
              <p className="font-semibold">
                {harvestData.harvestType} {harvestData.harvestType === 'PARTIAL' && `(${harvestData.partialPercentage}%)`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Batch:</p>
              <p className="font-semibold">#{harvestData.batchId || '123'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date:</p>
              <p className="font-semibold">
                {harvestData.harvestDate && new Date(harvestData.harvestDate).toLocaleDateString()} {harvestData.harvestTime}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Weight:</span>
              <span className="font-semibold">{harvestData.estimatedWeight?.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Actual Weight:</span>
              <span className="font-semibold text-[#0A4D68]">{actualWeight.toFixed(1)} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Variance:</span>
              <span className={`font-semibold ${Math.abs(variancePercentage) > 20 ? 'text-red-600' : 'text-green-600'}`}>
                {variance >= 0 ? '+' : ''}{variance.toFixed(1)} kg ({variancePercentage.toFixed(1)}%)
                {accuracy >= 80 && ' ✅'}
              </span>
            </div>
            {accuracy >= 80 && (
              <div className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {accuracy.toFixed(0)}% accuracy - Excellent estimation!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <GradeDistributionChart
            grades={gradeDistribution}
            showComparison={true}
            expectedGrades={expectedDistribution}
          />
        </CardContent>
      </Card>

      {/* Financial Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Gross Revenue:</span>
              <span className="font-bold text-green-600">{totalRevenue.toLocaleString()} EGP</span>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="font-semibold text-gray-700">Production Costs:</div>
              <div className="pl-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">• Feed consumed:</span>
                  <span>{productionCosts.feedCost.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">• Operating costs:</span>
                  <span>{productionCosts.operatingCost.toLocaleString()} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">• Fingerling cost:</span>
                  <span>{productionCosts.fingerllingCost.toLocaleString()} EGP {harvestData.harvestType === 'PARTIAL' && '(prorated)'}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1">
                  <span>Subtotal:</span>
                  <span>{totalProductionCosts.toLocaleString()} EGP</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="font-semibold text-gray-700">Harvest Costs:</div>
              <div className="pl-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="w-32">Labor:</Label>
                  <Input
                    type="number"
                    value={costs.laborCost}
                    onChange={(e) => setCosts({ ...costs, laborCost: Number(e.target.value) })}
                    className="w-32"
                  />
                  <span>EGP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-32">Transport:</Label>
                  <Input
                    type="number"
                    value={costs.transportCost}
                    onChange={(e) => setCosts({ ...costs, transportCost: Number(e.target.value) })}
                    className="w-32"
                  />
                  <span>EGP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-32">Packaging:</Label>
                  <Input
                    type="number"
                    value={costs.packagingCost}
                    onChange={(e) => setCosts({ ...costs, packagingCost: Number(e.target.value) })}
                    className="w-32"
                  />
                  <span>EGP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-32">Ice:</Label>
                  <Input
                    type="number"
                    value={costs.iceCost}
                    onChange={(e) => setCosts({ ...costs, iceCost: Number(e.target.value) })}
                    className="w-32"
                  />
                  <span>EGP</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="w-32">Other:</Label>
                  <Input
                    type="number"
                    value={costs.otherCost}
                    onChange={(e) => setCosts({ ...costs, otherCost: Number(e.target.value) })}
                    className="w-32"
                  />
                  <span>EGP</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 text-sm">
                  <span>Subtotal:</span>
                  <span>{totalHarvestCosts.toLocaleString()} EGP</span>
                </div>
              </div>
            </div>

            <div className="border-t-2 pt-3 space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total Costs:</span>
                <span className="font-bold">{totalCosts.toLocaleString()} EGP</span>
              </div>
              <div className="flex justify-between text-xl">
                <span className="font-bold">Net Profit:</span>
                <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {netProfit.toLocaleString()} EGP 💰
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Profit Margin:</span>
                <span className={`font-bold text-lg ${profitMargin >= 30 ? 'text-green-600' : profitMargin >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}% {profitMargin >= 30 ? '⭐ Excellent' : profitMargin >= 15 ? '⚠️ Moderate' : '❌ Low'}
                </span>
              </div>
            </div>

            <div className="border-t pt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Cost per kg:</p>
                <p className="font-semibold">{costPerKg.toFixed(2)} EGP</p>
              </div>
              <div>
                <p className="text-gray-600">Revenue per kg:</p>
                <p className="font-semibold text-green-600">{revenuePerKg.toFixed(2)} EGP</p>
              </div>
              <div>
                <p className="text-gray-600">Profit per kg:</p>
                <p className="font-semibold text-[#0A4D68]">{profitPerKg.toFixed(2)} EGP</p>
              </div>
            </div>

            {harvestData.fcr && (
              <div className="text-sm">
                <span className="text-gray-600">FCR (Batch):</span>
                <span className="font-semibold ml-2">{harvestData.fcr} ⭐ Good</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Before Harvest:</p>
              <div className="space-y-1 text-sm">
                <div>• Fish count: 850</div>
                <div>• Biomass: 357 kg</div>
                <div>• Status: ACTIVE</div>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">After Harvest:</p>
              <div className="space-y-1 text-sm">
                <div>• Fish count: ~{remainingFish} {harvestData.harvestType === 'PARTIAL' ? '(est)' : ''}</div>
                <div>• Biomass: ~{(357 - actualWeight).toFixed(0)} kg</div>
                <div>• Status: {harvestData.harvestType === 'FULL' ? 'HARVESTED' : 'PARTIALLY_HARVESTED'}</div>
                {harvestData.harvestType === 'PARTIAL' && (
                  <div>• Remaining: {100 - (harvestData.partialPercentage || 0)}%</div>
                )}
              </div>
            </div>
          </div>
          
          {harvestData.harvestType !== 'FULL' && (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                ✅ Batch will remain active for continued growth
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Harvested inventory will be created ({gradings.length} lots)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Lot numbers will be auto-generated (LOT-2026-XXX)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Storage: Default to FRESH in Cold Room A</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Expiry: 2 days from now ({new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()})</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Accounting: Asset entry recorded ({totalCosts.toLocaleString()} EGP basis)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
            <span>Available for sales orders immediately</span>
          </div>
        </CardContent>
      </Card>

      {/* Final Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Final Notes (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={finalNotes}
            onChange={(e) => setFinalNotes(e.target.value)}
            placeholder="Excellent harvest. Fish quality very high. No disease observed. Remaining fish healthy and growing well."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Warnings */}
      {profitMargin < 15 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            ⚠️ Warning: Profit margin is below 15%. Please review costs and pricing.
          </AlertDescription>
        </Alert>
      )}

      {Math.abs(variancePercentage) > 20 && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            ⚠️ Warning: Actual weight is {Math.abs(variancePercentage).toFixed(0)}% different from estimate. Please verify measurements.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Edit Grading
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            Save as Draft
          </Button>
          <Button 
            onClick={handleComplete}
            className="bg-green-600 hover:bg-green-700"
          >
            ✓ Complete Harvest
          </Button>
        </div>
      </div>
    </div>
  );
};
