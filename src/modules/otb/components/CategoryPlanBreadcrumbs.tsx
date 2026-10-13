import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { planPath } from '../api/categoryPlanData';
import { getSaleMonthLabel } from '../data/mockBuyingModuleV2';

interface CategoryPlanBreadcrumbsProps {
  saleMonth: string;
  runId?: string;
  category: { code: string; name: string };
  subcategory?: { code: string; name: string };
}

export function CategoryPlanBreadcrumbs({ saleMonth, runId, category, subcategory }: CategoryPlanBreadcrumbsProps) {
  const items = [
    { label: 'Buy Plans', to: '/buy-plans?tab=category' },
    { label: getSaleMonthLabel(saleMonth), to: planPath(saleMonth, undefined, undefined, undefined, runId) },
    { label: category.name, to: planPath(saleMonth, category.code, undefined, undefined, runId) },
    ...(subcategory ? [{ label: subcategory.name, to: planPath(saleMonth, category.code, subcategory.code, undefined, runId) }] : []),
  ];

  return (
    <nav aria-label="Buy plan breadcrumb" className="mb-3 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={item.to} className="inline-flex min-w-0 items-center gap-2">
            {index > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-gray-400" />}
            {index === items.length - 1
              ? <span aria-current="page" className="font-medium text-gray-900">{item.label}</span>
              : <Link to={item.to} className="rounded transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">{item.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
