import { ExternalLink } from 'lucide-react';
import {
  Badge, SectionHeader, Tooltip, TooltipTrigger, TooltipContent,
  DataTable, DataTableHeader, DataTableBody, DataTableRow, DataTableHead, DataTableCell,
  Button,
} from '@/components/ui';
import type { StoreAuditData, AuditGrade, AuditTag, ChecklistTheme } from '@/modules/store-view/types/storeAudit.types';

const THEME_ORDER: ChecklistTheme[] = [
  'Store Entry',
  'In-Store Look & Feel',
  'Product Exploration',
  'Trial Avenues',
  'Checkout & Experience',
];

function gradeBadgeVariant(grade: AuditGrade): 'success' | 'warning' | 'error' | 'default' {
  switch (grade) {
    case 'Good': return 'success';
    case 'Amber': return 'warning';
    case 'Red': return 'error';
    default: return 'default';
  }
}

function gradeLabel(grade: AuditGrade): string {
  switch (grade) {
    case 'NOT_SUBMITTED': return 'N/A';
    default: return grade;
  }
}

function tagBadgeVariant(tag: AuditTag): 'success' | 'error' | 'warning' | 'info' | 'default' {
  switch (tag) {
    case 'GRADE_CONFIRMED': return 'success';
    case 'VIDEO_CONTRADICTS_GRADE': return 'error';
    case 'INSUFFICIENT_EVIDENCE': return 'warning';
    case 'SUBMITTER_NOTE_CONFIRMS': return 'info';
    case 'NO_RELEVANT_VIDEO': return 'default';
  }
}

function tagLabel(tag: AuditTag): string {
  switch (tag) {
    case 'GRADE_CONFIRMED': return 'Confirmed';
    case 'VIDEO_CONTRADICTS_GRADE': return 'Contradicts';
    case 'INSUFFICIENT_EVIDENCE': return 'Insufficient';
    case 'SUBMITTER_NOTE_CONFIRMS': return 'Submitter Confirms';
    case 'NO_RELEVANT_VIDEO': return 'No Video';
  }
}

interface StoreChecklistGradesProps {
  data: StoreAuditData;
}

export function StoreChecklistGrades({ data }: StoreChecklistGradesProps) {
  const itemsByTheme = THEME_ORDER.map((theme) => ({
    theme,
    items: data.checklistItems.filter((item) => item.theme === theme),
  })).filter((group) => group.items.length > 0);

  return (
    <div>
      <SectionHeader title="Detailed Checklist Grades (25 Points)" />
      <p className="text-xs text-gray-500 mb-4">
        * = Grade changed from submitted grade after video/evidence cross-check
      </p>

      <div className="space-y-4">
        {itemsByTheme.map((group) => (
          <div key={group.theme}>
            <div className="text-xs font-semibold text-primary uppercase tracking-wide px-3 py-2 bg-primary/5 rounded-md mb-2">
              {group.theme}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <DataTable>
                <DataTableHeader>
                  <DataTableHead className="min-w-[180px]">Item</DataTableHead>
                  <DataTableHead>Submitted</DataTableHead>
                  <DataTableHead>Video</DataTableHead>
                  <DataTableHead>Final</DataTableHead>
                  <DataTableHead>Tag</DataTableHead>
                  <DataTableHead className="min-w-[200px]">Reasoning</DataTableHead>
                  <DataTableHead>Evidence</DataTableHead>
                </DataTableHeader>
                <DataTableBody>
                  {group.items.map((item) => {
                    const gradeChanged = item.finalGrade !== item.submittedGrade
                      && item.finalGrade !== 'Insufficient'
                      && item.submittedGrade !== 'NOT_SUBMITTED';

                    return (
                      <DataTableRow key={item.itemKey}>
                        <DataTableCell>
                          <div>
                            <span className="font-mono font-semibold text-xs text-gray-900">{item.itemKey}</span>
                            <span className="text-sm text-gray-700 ml-2">{item.itemName}</span>
                          </div>
                        </DataTableCell>
                        <DataTableCell>
                          <Badge variant={gradeBadgeVariant(item.submittedGrade)} size="sm">
                            {gradeLabel(item.submittedGrade)}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell>
                          <Badge variant={gradeBadgeVariant(item.videoGrade)} size="sm">
                            {gradeLabel(item.videoGrade)}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell>
                          <span className={gradeChanged ? 'ring-1 ring-dashed ring-current rounded-full' : ''}>
                            <Badge variant={gradeBadgeVariant(item.finalGrade)} size="sm">
                              {gradeLabel(item.finalGrade)}{gradeChanged ? '*' : ''}
                            </Badge>
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <Badge variant={tagBadgeVariant(item.tag)} size="sm">
                            {tagLabel(item.tag)}
                          </Badge>
                        </DataTableCell>
                        <DataTableCell>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-gray-500 max-w-[200px] truncate cursor-default">
                                {item.reasoning}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-sm">
                              <p className="text-xs">{item.reasoning}</p>
                            </TooltipContent>
                          </Tooltip>
                        </DataTableCell>
                        <DataTableCell>
                          {item.videoUrl ? (
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => window.open(item.videoUrl!, '_blank', 'noopener,noreferrer')}
                              aria-label={`Watch evidence video for ${item.itemName}`}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Watch
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400">No video</span>
                          )}
                        </DataTableCell>
                      </DataTableRow>
                    );
                  })}
                </DataTableBody>
              </DataTable>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
