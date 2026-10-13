import { useNavigate } from 'react-router-dom';
import {
  PageHeader,
  Badge,
  Button,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  EmptyState,
} from '@/components/ui';
import { ChevronRight } from 'lucide-react';
import { useModulePermissions } from '@/permissions';
import { getOTBMonths, getOTBMonthStatusConfig, type OTBMonth } from '../data/mockBuyingModuleV2';

export default function OTBMonthListPage() {
  const navigate = useNavigate()
  const { view: canView } = useModulePermissions('otb')

  const months = getOTBMonths()

  if (!canView) {
    return (
      <div className="animate-fadeInUp p-4 space-y-6">
        <PageHeader title="OTB Review" />
        <EmptyState
          title="Access restricted"
          description="OTB Review is available to Commercial, CFO, and Admin roles."
        />
      </div>
    )
  }

  return (
    <div className="animate-fadeInUp p-4 space-y-6">
      <PageHeader title="OTB Review" />

      <DataTable>
        <DataTableHeader>
            <DataTableHead>Sale Month</DataTableHead>
            <DataTableHead align="right">Categories</DataTableHead>
            <DataTableHead align="right">OTB Requested (₹L)</DataTableHead>
            <DataTableHead align="right">OTB Approved (₹L)</DataTableHead>
            <DataTableHead align="right">Exceptions Pending</DataTableHead>
            <DataTableHead align="right">Intake margin</DataTableHead>
            <DataTableHead>Deadline</DataTableHead>
            <DataTableHead>OTB Period</DataTableHead>
            <DataTableHead>Status</DataTableHead>
            <DataTableHead></DataTableHead>
</DataTableHeader>
        <DataTableBody>
          {months.map((month: OTBMonth) => {
            const { label: statusLabel, variant: statusVariant } = getOTBMonthStatusConfig(month.status)
            return (
              <DataTableRow
                key={month.saleMonth}
                onClick={() => navigate(`/otb/review/${month.saleMonth}`)}
              >
                <DataTableCell>
                  <span className="font-medium text-gray-900">{month.label}</span>
                </DataTableCell>
                <DataTableCell align="right">{month.categories}</DataTableCell>
                <DataTableCell align="right">
                  <span className="font-medium">₹{month.otbRequested.toLocaleString()}L</span>
                </DataTableCell>
                <DataTableCell align="right">
                  {month.otbApproved > 0 ? `₹${month.otbApproved.toLocaleString()}L` : '—'}
                </DataTableCell>
                <DataTableCell align="right">
                  {month.exceptionsPending > 0 ? (
                    <Badge variant="warning" size="sm">{month.exceptionsPending}</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </DataTableCell>
                <DataTableCell align="right">{month.intakeMarginPct.toFixed(1)}%</DataTableCell>
                <DataTableCell>
                  <span className="text-xs text-gray-600">{month.deadline}</span>
                </DataTableCell>
                <DataTableCell>
                  <span className="text-xs text-gray-600">Until {month.otbPeriodEnd}</span>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
                </DataTableCell>
                <DataTableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/otb/review/${month.saleMonth}`)
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </DataTableCell>
              </DataTableRow>
            )
          })}
        </DataTableBody>
      </DataTable>
    </div>
  )
}
