import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
  /** Minimum table width — prevents column squishing. Default: "800px" */
  minWidth?: string;
}

function DataTable({ className, children, minWidth = '800px', ...props }: DataTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)} {...props}>
      { }
      <table className="w-full text-xs" style={{ minWidth }}>{children}</table>
    </div>
  );
}

function DataTableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead {...props}>
      <tr className={cn('bg-gray-50 border-b border-gray-200', className)}>{children}</tr>
    </thead>
  );
}

function DataTableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-gray-100', className)} {...props}>
      {children}
    </tbody>
  );
}

function DataTableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  // Clickable/drill-down rows (those with an onClick) get a clear hover + pointer
  // affordance; static rows keep the subtle readability hover.
  const clickable = typeof props.onClick === 'function';
  return (
    <tr
      className={cn(
        'transition-colors',
        clickable ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

interface DataTableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right' | 'center';
}

function DataTableHead({ className, align = 'left', children, ...props }: DataTableHeadProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={cn(
        'px-3 py-2 font-medium text-gray-500',
        alignClass,
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

interface DataTableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'right' | 'center';
}

function DataTableCell({ className, align = 'left', children, ...props }: DataTableCellProps) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td
      className={cn(
        'px-3 py-2 text-gray-700',
        alignClass,
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export { DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell };
