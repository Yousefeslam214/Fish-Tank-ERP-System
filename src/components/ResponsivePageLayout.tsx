import { ReactNode } from 'react';

interface ResponsivePageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ResponsivePageLayout({ children, className = '' }: ResponsivePageLayoutProps) {
  return (
    <div className={`min-h-screen bg-[#F9FAFB] p-4 md:p-6 space-y-4 md:space-y-6 ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveCardGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ResponsiveCardGrid({ children, cols = 3, className = '' }: ResponsiveCardGridProps) {
  const gridClasses = {
    1: 'grid grid-cols-1 gap-3 md:gap-4',
    2: 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4',
    3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4',
    4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'
  };

  return (
    <div className={`${gridClasses[cols]} ${className}`}>
      {children}
    </div>
  );
}
