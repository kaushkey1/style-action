import { Badge } from '@/components/ui';
import { pullbackTemplates } from '../data/anrConfigLoader';
import type { PullbackTemplate } from '../data/anrConfigTypes';
import { cn } from '@/lib/utils';
import { Circle, CheckCircle2 } from 'lucide-react';

interface PullbackTemplateSelectorProps {
  selectedTemplate: PullbackTemplate;
  activeTemplate: PullbackTemplate;
  onTemplateChange: (template: PullbackTemplate) => void;
}

export function PullbackTemplateSelector({
  selectedTemplate,
  activeTemplate,
  onTemplateChange,
}: PullbackTemplateSelectorProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Pullback Strategy</h3>
      <p className="text-xs text-gray-500 mb-3">
        Select ONE active pullback strategy. Only the active strategy will run in production.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {pullbackTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          const isActive = activeTemplate === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onTemplateChange(template.id)}
              className={cn(
                'flex flex-col items-start gap-2 p-3 rounded-lg border-2 transition-all text-left',
                isSelected
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center gap-2 w-full">
                {/* Radio indicator */}
                {isActive ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}

                <Badge variant={template.badge} className="text-xs">
                  {template.label}
                </Badge>

                {isActive && (
                  <Badge variant="success" className="text-xs ml-auto">
                    Running
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 pl-6">{template.description}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2 px-3 py-2 mt-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <span className="font-medium">Note:</span>
        <span>Click a template to view/edit its configuration. Only the template marked "Running" will execute in production.</span>
      </div>
    </div>
  );
}
