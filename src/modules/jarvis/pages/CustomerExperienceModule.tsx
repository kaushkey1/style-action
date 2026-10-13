import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from '@/components/ui';
import { JarvisDashboardPage } from './JarvisDashboardPage';

export function CustomerExperienceModule(): React.ReactNode {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Breadcrumb + back navigation */}
      <div className="flex items-center gap-2 text-sm">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gray-500 hover:text-gray-900 px-2"
          onClick={() => navigate('/jarvis')}
          aria-label="Back to Jarvis modules"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Modules</span>
        </Button>

        <nav className="flex items-center gap-1 text-gray-400" aria-label="Breadcrumb">
          <button
            type="button"
            className="hover:text-gray-700 transition-colors min-h-[44px] lg:min-h-0 flex items-center"
            onClick={() => navigate('/jarvis')}
          >
            Dashboard
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 font-medium">CX</span>
        </nav>
      </div>

      {/* Tab bar */}
      <Tabs defaultValue="dashboard">
        <TabsList variant="underline">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <JarvisDashboardPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
