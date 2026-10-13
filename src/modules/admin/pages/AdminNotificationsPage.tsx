import { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Monitor,
  Clock,
  Moon,
  Sun,
  FileText,
  Eye,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Send,
} from 'lucide-react';
import { Badge, Button, Switch, Tabs, TabsList, TabsTrigger, TabsContent, PageHeader, SectionHeader, EmptyState } from '@/components/ui';
import { notificationChannels, quietHoursConfigs, notificationTemplates, severityEscalation, notificationSampleData } from '../data/mockAdminData';
import { cn } from '@/lib/utils';

const sampleData = notificationSampleData;

function renderPreview(text: string): string {
  let result = text;
  for (const [placeholder, value] of Object.entries(sampleData)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

function extractPlaceholders(text: string): string[] {
  const matches = text.match(/\{[^}]+\}/g);
  return matches ? [...new Set(matches)] : [];
}

function getSeverityVariant(severity: string): 'error' | 'warning' | 'info' | 'default' {
  switch (severity) {
    case 'S1': return 'error';
    case 'S2': return 'warning';
    case 'S3': return 'info';
    case 'S4': return 'default';
    default: return 'primary' as 'default';
  }
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'push': return <Smartphone className="w-3 h-3" />;
    case 'in_app': return <Monitor className="w-3 h-3" />;
    case 'email': return <Mail className="w-3 h-3" />;
    case 'digest': return <FileText className="w-3 h-3" />;
    default: return <Bell className="w-3 h-3" />;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'push': return 'Push';
    case 'in_app': return 'In-App';
    case 'email': return 'Email';
    case 'digest': return 'Digest';
    default: return type;
  }
}

// ── Tab 1: Channels ──

function ChannelsTab() {
  return (
    <div className="space-y-4">
      {/* Channel Matrix */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Channel Matrix" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Push</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">In-App</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">SMS</th>
                <th className="text-center px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Default Channel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {notificationChannels.length === 0 ? (
                <tr><td colSpan={7}><EmptyState description="No notification channels configured" /></td></tr>
              ) : notificationChannels.map((ch) => (
                <tr key={ch.role} className="hover:bg-gray-50/50">
                  <td className="py-2.5 pr-4 text-sm font-medium text-gray-900">{ch.role}</td>
                  <td className="text-center px-3 py-2.5">
                    <div className="flex justify-center">
                      <Switch checked={ch.push} aria-label={`${ch.role} push`} />
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <div className="flex justify-center">
                      <Switch checked={ch.inApp} aria-label={`${ch.role} in-app`} />
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <div className="flex justify-center">
                      <Switch checked={ch.email} aria-label={`${ch.role} email`} />
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <div className="flex justify-center">
                      <Switch checked={ch.sms} aria-label={`${ch.role} sms`} />
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5">
                    <div className="flex justify-center">
                      <Switch checked={ch.whatsapp} aria-label={`${ch.role} whatsapp`} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">{ch.defaultChannel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Severity-Based Channel Escalation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <SectionHeader title="Severity-Based Channel Escalation" />
        {/* eslint-disable-next-line design-system/prefer-metric-grid -- responsive escalation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {severityEscalation.map((esc) => (
            <div
              key={esc.severity}
              className="rounded-lg border border-gray-200 p-3 hover:border-primary/30 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={esc.variant} size="sm">{esc.severity}</Badge>
                <span className="text-xs font-medium text-gray-700">{esc.label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Send className="w-3 h-3" />
                <span>{esc.channels}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Schedule ──

function ScheduleTab() {
  const [selectedRole, setSelectedRole] = useState(quietHoursConfigs[0]!.role);
  const config = quietHoursConfigs.find((c) => c.role === selectedRole) ?? quietHoursConfigs[0]!;

  return (
    <div className="space-y-4">
      {/* Role Selector */}
      <div className="flex flex-wrap gap-2">
        {quietHoursConfigs.map((c) => (
          <Button
            key={c.role}
            variant={selectedRole === c.role ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedRole(c.role)}
          >
            {c.role}
          </Button>
        ))}
      </div>

      {/* eslint-disable-next-line design-system/prefer-metric-grid -- responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quiet Hours */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Quiet Hours</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Start Time</span>
              <span className="text-sm font-medium text-gray-900">{config.quietStart}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">End Time</span>
              <span className="text-sm font-medium text-gray-900">{config.quietEnd}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">S1 Override</span>
              {config.s1Override ? (
                <Badge variant="success" size="sm">Yes</Badge>
              ) : (
                <Badge variant="default" size="sm">No</Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Weekend Policy</span>
              <span className="text-xs font-medium text-gray-700">{config.weekendPolicy}</span>
            </div>
          </div>
        </div>

        {/* Batching / Digest */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Batching / Digest</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Daily Digest Time</span>
              <span className="text-sm font-medium text-gray-900">{config.digestTime}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">Evening Summary</span>
              {config.eveningSummary ? (
                <span className="text-sm font-medium text-gray-900">{config.eveningSummary}</span>
              ) : (
                <Badge variant="default" size="sm">Disabled</Badge>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500">S2 Batch Interval</span>
              <span className="text-sm font-medium text-gray-900">Hourly</span>
            </div>
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sun className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Schedule Preview</h3>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2">
              <Badge variant="error" size="sm" className="shrink-0 mt-0.5">S1</Badge>
              <span className="text-xs text-gray-700">
                Always delivered{config.s1Override ? ' (overrides quiet hours)' : ''}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="warning" size="sm" className="shrink-0 mt-0.5">S2</Badge>
              <span className="text-xs text-gray-700">Hourly batches during active hours</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="info" size="sm" className="shrink-0 mt-0.5">S3/S4</Badge>
              <span className="text-xs text-gray-700">Daily digest at {config.digestTime}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">24h Timeline</p>
              <div className="flex items-center gap-1 text-[10px]">
                <div className="flex-1 h-5 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                  {config.quietStart} - {config.quietEnd}
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                <div className="flex-[2] h-5 rounded bg-primary/10 flex items-center justify-center text-primary font-medium">
                  Active Hours
                </div>
                <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                <div className="flex-1 h-5 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                  Quiet
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Templates ──

function TemplatesTab() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(notificationTemplates[0]!.id);
  const selectedTemplate = notificationTemplates.find((t) => t.id === selectedTemplateId) ?? notificationTemplates[0]!;
  const allPlaceholders = extractPlaceholders(selectedTemplate.title + ' ' + selectedTemplate.body);

  return (
    // eslint-disable-next-line design-system/prefer-metric-grid -- responsive layout
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Template List */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <SectionHeader title="Templates" />
        <div className="space-y-1">
          {notificationTemplates.length === 0 ? (
            <EmptyState description="No notification templates configured" />
          ) : notificationTemplates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedTemplateId(tmpl.id)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200',
                'hover:bg-gray-50',
                selectedTemplateId === tmpl.id
                  ? 'bg-primary/5 border border-primary/20'
                  : 'border border-transparent'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={cn(
                  'text-sm font-medium',
                  selectedTemplateId === tmpl.id ? 'text-primary' : 'text-gray-900'
                )}>
                  {tmpl.name}
                </span>
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    tmpl.status === 'published' ? 'bg-green-500' : 'bg-gray-300'
                  )}
                  title={tmpl.status}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getSeverityVariant(tmpl.severity)} size="sm">
                  {tmpl.severity}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  {getTypeIcon(tmpl.type)}
                  {getTypeLabel(tmpl.type)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Template Editor */}
      <div className="lg:col-span-2 space-y-4">
        {/* Template Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <SectionHeader
            title={selectedTemplate.name}
            actions={
              <div className="flex items-center gap-2">
                <Badge variant={getSeverityVariant(selectedTemplate.severity)} size="sm">
                  {selectedTemplate.severity}
                </Badge>
                <Badge
                  variant={selectedTemplate.status === 'published' ? 'success' : 'default'}
                  size="sm"
                >
                  {selectedTemplate.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            }
            className="mb-4"
          />

          <div className="space-y-3">
            <div>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                Type
              </label>
              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                {getTypeIcon(selectedTemplate.type)}
                <span>{getTypeLabel(selectedTemplate.type)}</span>
              </div>
            </div>

            <div>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                Title
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-900 font-mono">
                {selectedTemplate.title}
              </div>
            </div>

            <div>
              {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                Body
              </label>
              <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700 font-mono leading-relaxed">
                {selectedTemplate.body}
              </div>
            </div>

            {allPlaceholders.length > 0 && (
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Available Placeholders
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {allPlaceholders.map((ph) => (
                    <span
                      key={ph}
                      className="px-2 py-0.5 bg-primary/5 text-primary text-xs font-mono rounded-lg border border-primary/10"
                    >
                      {ph}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
            <div className="flex items-start gap-2">
              {selectedTemplate.severity === 'S1' && <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
              {selectedTemplate.severity === 'S2' && <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
              {selectedTemplate.severity === 'S3' && <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
              {selectedTemplate.severity === 'S4' && <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
              {selectedTemplate.severity === 'All' && <Bell className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {renderPreview(selectedTemplate.title)}
                </p>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {renderPreview(selectedTemplate.body)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export function AdminNotificationsPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 z-10 flex items-start justify-center pt-48 bg-white/60 rounded-lg">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-500">Coming Soon</p>
          <p className="text-xs text-gray-400 mt-1">Platform configuration is under development</p>
        </div>
      </div>
    <div className="space-y-4 pointer-events-none select-none opacity-40 grayscale">
      <PageHeader title="Notification Configuration" />

      <Tabs defaultValue="channels">
        <TabsList>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <ChannelsTab />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
    </div>
  );
}
