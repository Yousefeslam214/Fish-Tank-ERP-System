import { ReactNode } from 'react';

interface ResponsivePageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function ResponsivePageHeader({ title, description, actions }: ResponsivePageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4 mb-4 md:mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">{title}</h1>
        {description && (
          <p className="text-sm md:text-base text-gray-600 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
