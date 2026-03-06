import React from 'react';
import { GradeType } from '../../types';
import { Check } from 'lucide-react';

interface GradeCardProps {
  gradeName: string;
  gradeType: GradeType;
  weightRange: string;
  pricePerKg: number;
  color: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
}

export const GradeCard: React.FC<GradeCardProps> = ({
  gradeName,
  weightRange,
  pricePerKg,
  color,
  icon,
  selected,
  onClick
}) => {
  const getIconEmoji = (iconType?: string) => {
    switch (iconType) {
      case 'super': return '⭐';
      case 'grade1': return '🔵';
      case 'grade2': return '🟠';
      case 'sherr': return '🔴';
      case 'waste': return '⚠️';
      default: return '📦';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-lg border-2 transition-all
        min-h-[120px] flex flex-col items-center justify-center
        hover:shadow-lg active:scale-95
        ${selected 
          ? 'border-[#0A4D68] bg-[#0A4D68]/10 shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
        }
      `}
      style={{
        borderColor: selected ? color : undefined
      }}
    >
      {selected && (
        <div 
          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          <Check className="w-4 h-4" />
        </div>
      )}
      
      <div className="text-3xl mb-2">{getIconEmoji(icon)}</div>
      <div className="text-lg font-bold text-center mb-1">{gradeName}</div>
      <div className="text-sm text-gray-600 text-center mb-2">{weightRange}</div>
      <div className="text-base font-semibold" style={{ color }}>
        {pricePerKg} EGP/kg
      </div>
    </button>
  );
};
