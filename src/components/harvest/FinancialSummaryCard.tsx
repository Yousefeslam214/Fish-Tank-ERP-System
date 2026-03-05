import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FinancialSummaryCardProps {
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
  breakdown?: {
    feedCost?: number;
    operatingCost?: number;
    fingerllingCost?: number;
    laborCost?: number;
    transportCost?: number;
    packagingCost?: number;
    iceCost?: number;
    otherCost?: number;
  };
}

export const FinancialSummaryCard: React.FC<FinancialSummaryCardProps> = ({
  revenue,
  costs,
  profit,
  margin,
  breakdown
}) => {
  const [expanded, setExpanded] = useState(false);

  const getMarginColor = (m: number) => {
    if (m >= 30) return 'text-green-600';
    if (m >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarginLabel = (m: number) => {
    if (m >= 30) return '⭐ Excellent';
    if (m >= 15) return '⚠️ Moderate';
    return '❌ Low';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Financial Performance</span>
          <span className={`text-2xl font-bold ${getMarginColor(margin)}`}>
            {profit.toLocaleString()} EGP
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Gross Revenue:</span>
            <span className="font-semibold">{revenue.toLocaleString()} EGP</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Total Costs:</span>
            <span className="font-semibold">{costs.toLocaleString()} EGP</span>
          </div>
          
          <div className="border-t pt-2 flex justify-between items-center">
            <span className="font-medium">Net Profit:</span>
            <div className="text-right">
              <div className={`text-xl font-bold ${getMarginColor(margin)}`}>
                {profit.toLocaleString()} EGP 💰
              </div>
              <div className={`text-sm ${getMarginColor(margin)}`}>
                Margin: {margin.toFixed(1)}% {getMarginLabel(margin)}
              </div>
            </div>
          </div>
        </div>

        {breakdown && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center gap-2 text-sm text-[#0A4D68] hover:underline"
            >
              {expanded ? (
                <>
                  Hide Breakdown <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  Show Breakdown <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>

            {expanded && (
              <div className="space-y-2 pt-2 border-t text-sm">
                <div className="font-semibold text-gray-700 mb-2">Cost Breakdown:</div>
                {breakdown.feedCost !== undefined && breakdown.feedCost > 0 && (
                  <div className="flex justify-between pl-2">
                    <span className="text-gray-600">• Feed:</span>
                    <span>{breakdown.feedCost.toLocaleString()} EGP</span>
                  </div>
                )}
                {breakdown.operatingCost !== undefined && breakdown.operatingCost > 0 && (
                  <div className="flex justify-between pl-2">
                    <span className="text-gray-600">• Operating:</span>
                    <span>{breakdown.operatingCost.toLocaleString()} EGP</span>
                  </div>
                )}
                {breakdown.fingerllingCost !== undefined && breakdown.fingerllingCost > 0 && (
                  <div className="flex justify-between pl-2">
                    <span className="text-gray-600">• Fingerlings:</span>
                    <span>{breakdown.fingerllingCost.toLocaleString()} EGP</span>
                  </div>
                )}
                {breakdown.laborCost !== undefined && breakdown.laborCost > 0 && (
                  <div className="flex justify-between pl-2">
                    <span className="text-gray-600">• Labor:</span>
                    <span>{breakdown.laborCost.toLocaleString()} EGP</span>
                  </div>
                )}
                {breakdown.transportCost !== undefined && breakdown.transportCost > 0 && (
                  <div className="flex justify-between pl-2">
                    <span className="text-gray-600">• Transport:</span>
                    <span>{breakdown.transportCost.toLocaleString()} EGP</span>
                  </div>
                )}
                {breakdown.packagingCost !== undefined && breakdown.packagingCost > 0 && (
                  <div className="flex justify-between pl-2">
                    <span className="text-gray-600">• Packaging:</span>
                    <span>{breakdown.packagingCost.toLocaleString()} EGP</span>
                  </div>
                )}
                {breakdown.iceCost !== undefined && breakdown.iceCost > 0 && (
                  <div className="flex justify-between pl-2">
                    <span className="text-gray-600">• Ice:</span>
                    <span>{breakdown.iceCost.toLocaleString()} EGP</span>
                  </div>
                )}
                {breakdown.otherCost !== undefined && breakdown.otherCost > 0 && (
                  <div className="flex justify-between pl-2">
                    <span className="text-gray-600">• Other:</span>
                    <span>{breakdown.otherCost.toLocaleString()} EGP</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
