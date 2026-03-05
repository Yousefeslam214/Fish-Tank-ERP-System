import React from 'react';

interface GradeData {
  name: string;
  weight: number;
  percentage: number;
  color: string;
}

interface GradeDistributionChartProps {
  grades: GradeData[];
  showComparison?: boolean;
  expectedGrades?: GradeData[];
}

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  grades,
  showComparison = false,
  expectedGrades
}) => {
  const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {grades.map((grade, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{grade.name}</span>
              <span className="text-gray-600">
                {grade.weight.toFixed(1)}kg ({grade.percentage.toFixed(1)}%)
              </span>
            </div>
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 flex items-center justify-center text-white text-xs font-semibold transition-all duration-500"
                style={{
                  width: `${grade.percentage}%`,
                  backgroundColor: grade.color,
                  minWidth: grade.percentage > 5 ? undefined : '40px'
                }}
              >
                {grade.percentage > 5 && `${grade.percentage.toFixed(0)}%`}
              </div>
              {grade.percentage <= 5 && grade.percentage > 0 && (
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-600">
                  {grade.percentage.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showComparison && expectedGrades && (
        <div className="border-t pt-4 space-y-2">
          <div className="font-semibold text-sm text-gray-700">
            ✅ Comparison to Expected (Species Average)
          </div>
          {grades.map((grade, index) => {
            const expected = expectedGrades.find(e => e.name === grade.name);
            if (!expected) return null;
            
            const diff = grade.percentage - expected.percentage;
            const isDiffPositive = diff > 0;
            const isSignificant = Math.abs(diff) >= 3;
            
            return (
              <div key={index} className="text-sm flex justify-between items-center pl-2">
                <span className="text-gray-600">{grade.name}:</span>
                <span className={isSignificant ? (isDiffPositive && grade.name !== 'Sherr' && grade.name !== 'Waste' ? 'text-green-600' : 'text-red-600') : ''}>
                  {grade.percentage.toFixed(0)}% vs {expected.percentage.toFixed(0)}% expected
                  {isSignificant && (
                    <span className="ml-2">
                      {isDiffPositive && grade.name !== 'Sherr' && grade.name !== 'Waste' && '🎉 Better!'}
                      {isDiffPositive && (grade.name === 'Sherr' || grade.name === 'Waste') && '⚠️'}
                      {!isDiffPositive && grade.name !== 'Sherr' && grade.name !== 'Waste' && '📉'}
                      {!isDiffPositive && (grade.name === 'Sherr' || grade.name === 'Waste') && '🎉 Excellent!'}
                    </span>
                  )}
                  {!isSignificant && ' ✅'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t pt-3 flex justify-between font-semibold">
        <span>TOTAL</span>
        <span>{totalWeight.toFixed(1)} kg (100%)</span>
      </div>
    </div>
  );
};
