import { ReactNode } from 'react';
import { Card } from './ui/card';

interface ResponsiveTableProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveTableWrapper({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border-b border-gray-200 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

interface MobileCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
  className?: string;
}

export function MobileCardList<T>({ items, renderCard, className = '' }: MobileCardListProps<T>) {
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <Card key={index} className="p-4">
          {renderCard(item, index)}
        </Card>
      ))}
    </div>
  );
}
