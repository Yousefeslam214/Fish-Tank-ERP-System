import React from 'react';

interface WaterParameterProps {
  name: string;
  value: string | number;
  status: string;
}

export function WaterParameter({ name, value, status }: WaterParameterProps) {
  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'optimal':
      case 'low': // for ammonia 'low' is good
        return 'text-green-600 font-bold';
      case 'acceptable':
        return 'text-blue-600 font-bold';
      case 'warning':
        return 'text-yellow-600 font-bold';
      case 'critical':
      case 'high': // for ammonia 'high' is bad
        return 'text-red-600 font-bold';
      default:
        return 'text-gray-900 font-bold';
    }
  };

  return (
    <div className="bg-white p-3 rounded border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">{name}</span>
      <span className={`text-lg transition-colors ${getStatusColor(status)}`}>{value}</span>
    </div>
  );
}
