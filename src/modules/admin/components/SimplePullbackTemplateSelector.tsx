import { Badge } from '@/components/ui';
import type { PullbackTemplate } from '../data/anrConfigTypes';
import { cn } from '@/lib/utils';

interface SimplePullbackTemplateSelectorProps {
  selectedTemplate: PullbackTemplate;
  onTemplateChange: (template: PullbackTemplate) => void;
}

const pullbackTemplates: Array<{
  id: PullbackTemplate;
  label: string;
  description: string;
  badge: 'error' | 'warning' | 'info' | 'success';
}> = [
  {
    id: 'bottom_seller',
    label: 'Bottom Seller',
    description: 'Lowest ROS options',
    badge: 'error',
  },
  {
    id: 'broken_set',
    label: 'Broken Set',
    description: 'Incomplete size profiles',
    badge: 'warning',
  },
  {
    id: 'lifecycle_crossed',
    label: 'Lifecycle Crossed',
    description: 'Age-based pullback',
    badge: 'info',
  },
  {
    id: 'planogram_overfill',
    label: 'Planogram Overfill',
    description: 'Excess stock',
    badge: 'success',
  },
];

export function SimplePullbackTemplateSelector({
  selectedTemplate,
  onTemplateChange,
}: SimplePullbackTemplateSelectorProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Select Pullback Template</h3>

      {/* eslint-disable-next-line design-system/prefer-metric-grid -- This is a template selector grid, not a metric grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {pullbackTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateChange(template.id)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center',
                isSelected
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <Badge variant={template.badge} className="text-xs">
                {template.label}
              </Badge>
              <p className="text-xs text-gray-600">{template.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
