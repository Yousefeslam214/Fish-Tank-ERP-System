import React from 'react';
import { Progress } from '../ui/progress';

interface HarvestProgressBarProps {
  estimated: number;
  actual: number;
  unit?: string;
}

export const HarvestProgressBar: React.FC<HarvestProgressBarProps> = ({
  estimated,
  actual,
  unit = 'kg'
}) => {
  const percentage = estimated > 0 ? Math.min((actual / estimated) * 100, 100) : 0;
  const remaining = Math.max(estimated - actual, 0);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">
          Graded So Far: <span className="text-[#0A4D68] font-bold">{actual.toFixed(1)} {unit}</span>
        </span>
        <span className="text-gray-600">
          Remaining: {remaining.toFixed(1)} {unit}
        </span>
      </div>
      
      <div className="relative">
        <Progress value={percentage} className="h-6" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white mix-blend-difference">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>Estimated Total: {estimated} {unit}</span>
        <span className={percentage >= 80 ? 'text-green-600 font-semibold' : ''}>
          {percentage >= 100 ? '✓ Complete' : `${percentage.toFixed(0)}% done`}
        </span>
      </div>
    </div>
  );
};
