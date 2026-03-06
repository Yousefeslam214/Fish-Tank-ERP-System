import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { HarvestEvent, HarvestGrading } from '../../../types';
import { CheckCircle, Package, DollarSign, BarChart3, Printer, Mail, Share2 } from 'lucide-react';

interface HarvestCompletionStepProps {
  harvestData: Partial<HarvestEvent>;
  gradings: HarvestGrading[];
  onComplete: () => void;
}

export const HarvestCompletionStep: React.FC<HarvestCompletionStepProps> = ({
  harvestData,
  gradings,
  onComplete
}) => {
  const actualWeight = gradings.reduce((sum, g) => sum + g.weightKg, 0);
  const totalRevenue = gradings.reduce((sum, g) => sum + g.totalValue, 0);
  
  // Generate mock lot numbers
  const baseLotNumber = 87;
  const lots = gradings.map((grading, index) => ({
    lotNumber: `LOT-2026-${String(baseLotNumber + index).padStart(3, '0')}`,
    grade: grading.gradeName,
    gradeType: grading.gradeType,
    weight: grading.weightKg,
    storage: 'FRESH',
    expiry: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status: '🟢'
  }));

  const getGradeIcon = (gradeType: string) => {
    switch (gradeType) {
      case 'SUPER': return '⭐';
      case 'GRADE_1': return '🔵';
      case 'GRADE_2': return '🟠';
      case 'SHERR': return '🔴';
      case 'WASTE': return '⚠️';
      default: return '📦';
    }
  };

  const harvestNumber = `HRV-2026-045`;

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="border-green-500 border-2 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                🎉 Harvest {harvestNumber} Complete!
              </h2>
              <p className="text-gray-700">
                {harvestData.tankName} • Batch #{harvestData.batchId || '123'} • {new Date().toLocaleDateString()}
              </p>
              <p className="text-lg font-semibold text-gray-800 mt-2">
                {actualWeight.toFixed(0)} kg harvested • {totalRevenue.toLocaleString()} EGP value • {harvestData.profitMargin?.toFixed(1)}% profit
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Completion Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm">{lots.length} inventory lots created and ready for sale</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm">
              Batch status updated ({harvestData.harvestType === 'FULL' 
                ? 'Fully harvested' 
                : `${harvestData.partialPercentage}% harvested, ${100 - (harvestData.partialPercentage || 0)}% remains active`})
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm">Accounting entries recorded</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm">Traceability links established</span>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Created */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Inventory Created
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {lots.map((lot, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getGradeIcon(gradings[index].gradeType)}</span>
                  <div>
                    <div className="font-semibold">{lot.lotNumber}</div>
                    <div className="text-sm text-gray-600">
                      {lot.grade} • {lot.weight.toFixed(1)}kg
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{lot.storage}</div>
                  <div className="text-xs text-gray-600">Exp: {lot.expiry}</div>
                  <div className="text-lg mt-1">{lot.status}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <Package className="w-6 h-6 text-[#0A4D68]" />
              <div>
                <div className="font-semibold">View Inventory</div>
                <div className="text-xs text-gray-600">Check stock levels</div>
              </div>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-semibold">Create Sales Order</div>
                <div className="text-xs text-gray-600">Start selling</div>
              </div>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-semibold">View Analytics</div>
                <div className="text-xs text-gray-600">See performance</div>
              </div>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print Summary
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Report
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share QR Codes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-r from-[#0A4D68] to-[#0A4D68]/80 text-white">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold">{actualWeight.toFixed(0)}</div>
              <div className="text-sm opacity-90">kg Harvested</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{totalRevenue.toLocaleString()}</div>
              <div className="text-sm opacity-90">EGP Revenue</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{harvestData.profitMargin?.toFixed(1)}%</div>
              <div className="text-sm opacity-90">Profit Margin</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{lots.length}</div>
              <div className="text-sm opacity-90">Inventory Lots</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onComplete}>
          ← Back to Dashboard
        </Button>
        <Button 
          onClick={onComplete}
          className="bg-[#0A4D68] hover:bg-[#0A4D68]/90"
        >
          Start New Harvest
        </Button>
      </div>
    </div>
  );
};
