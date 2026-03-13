import { ReactNode } from 'react';
import { Table } from './ui/table';

interface ResponsiveDataTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveDataTable({ children, className = '' }: ResponsiveDataTableProps) {
  return (
    <div className="w-full">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <Table className={className}>
          {children}
        </Table>
      </div>
      
      {/* Mobile View - Will be handled by individual components with cards */}
      <div className="md:hidden">
        {children}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  bgColor?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  bgColor = 'bg-white',
  iconBgColor = 'bg-[#E0F4F5]',
  iconColor = 'text-[#088395]'
}: StatCardProps) {
  return (
    <div className={`${bgColor} p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs md:text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs md:text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-xs md:text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${iconBgColor} flex items-center justify-center flex-shrink-0`}>
          <div className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}
