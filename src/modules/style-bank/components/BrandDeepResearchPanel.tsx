import { useState } from 'react';
import {
  Download,
  Check,
  X,
  BookOpen,
  Palette,
  Shield,
  Target,
  Globe,
  Heart,
  Link,
} from 'lucide-react';
import {
  DetailPanel,
  DetailPanelSection,
  DetailPanelRow,
  Badge,
  Button,
  EmptyState,
} from '@/components/ui';
import { getBrandDNA, BRAND_DNA_MAP } from '../data/mockBrandDNA';
import { cn } from '@/lib/utils';

interface BrandDeepResearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  brandId: string | null;
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'visual', label: 'Visual Identity', icon: Palette },
  { id: 'guardrails', label: 'Design Guardrails', icon: Shield },
  { id: 'market', label: 'Market & Audience', icon: Target },
  { id: 'cultural', label: 'Cultural Influences', icon: Globe },
  { id: 'values', label: 'Values & Voice', icon: Heart },
  { id: 'sources', label: 'Sources', icon: Link },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function BrandDeepResearchPanel({
  isOpen,
  onClose,
  brandId,
}: BrandDeepResearchPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const brand = brandId ? getBrandDNA(brandId) : null;

  const availableBrands = Object.values(BRAND_DNA_MAP).map((b) => b.brandName);

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={onClose}
      title={brand ? `Brand Research: ${brand.brandName}` : 'Brand Research'}
      subtitle="AI-Generated Research"
      width="2xl"
      footer={
        brand ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4 mr-2" />
            Export as PDF
          </Button>
        ) : undefined
      }
    >
      {!brand ? (
        <div className="space-y-4">
          <EmptyState
            icon={BookOpen}
            title="No research available"
            description="No AI-generated brand research is available for this brand."
          />
          <div className="px-4">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Research available for:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableBrands.map((name) => (
                <Badge key={name} variant="primary" size="sm">
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto border-b border-gray-100 -mx-4 px-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && <OverviewTab brand={brand} />}
            {activeTab === 'visual' && <VisualIdentityTab brand={brand} />}
            {activeTab === 'guardrails' && <GuardrailsTab brand={brand} />}
            {activeTab === 'market' && <MarketAudienceTab brand={brand} />}
            {activeTab === 'cultural' && <CulturalTab brand={brand} />}
            {activeTab === 'values' && <ValuesVoiceTab brand={brand} />}
            {activeTab === 'sources' && <SourcesTab brand={brand} />}
          </div>
        </div>
      )}
    </DetailPanel>
  );
}

// ── Tab Components ──────────────────────────────────────────────────────

interface TabProps {
  brand: NonNullable<ReturnType<typeof getBrandDNA>>;
}

function OverviewTab({ brand }: TabProps) {
  return (
    <div className="space-y-4">
      <DetailPanelSection title="Brand Identity">
        <DetailPanelRow label="Brand Name" value={brand.brandName} />
        <DetailPanelRow
          label="Classification"
          value={brand.brandClassification}
        />
      </DetailPanelSection>

      <DetailPanelSection title="Tags">
        <div className="flex flex-wrap gap-1.5">
          {brand.descriptiveTags.map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
        </div>
      </DetailPanelSection>

      <DetailPanelSection title="Price Range">
        <DetailPanelRow
          label="Currency"
          value={brand.priceRange.currency}
        />
        <DetailPanelRow
          label="Minimum"
          value={`${brand.priceRange.currency} ${brand.priceRange.min.toLocaleString('en-IN')}`}
        />
        <DetailPanelRow
          label="Median"
          value={`${brand.priceRange.currency} ${brand.priceRange.median.toLocaleString('en-IN')}`}
        />
        <DetailPanelRow
          label="Maximum"
          value={`${brand.priceRange.currency} ${brand.priceRange.max.toLocaleString('en-IN')}`}
        />
      </DetailPanelSection>

      <DetailPanelSection title="Primary Categories">
        <div className="flex flex-wrap gap-1.5">
          {brand.primaryCategories.map((cat) => (
            <Badge key={cat} variant="primary" size="sm">
              {cat}
            </Badge>
          ))}
        </div>
      </DetailPanelSection>
    </div>
  );
}

function VisualIdentityTab({ brand }: TabProps) {
  return (
    <div className="space-y-4">
      <DetailPanelSection title="Overview">
        <p className="text-sm text-gray-700">
          {brand.visualIdentity.paletteOverview}
        </p>
      </DetailPanelSection>

      <DetailPanelSection title="Master Palette">
        <div className="space-y-2">
          {brand.visualIdentity.masterPalette.map((description, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
              <Palette className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-gray-700">{description}</span>
            </div>
          ))}
        </div>
      </DetailPanelSection>

      <DetailPanelSection title="Accessibility Notes">
        <p className="text-sm text-gray-700">
          {brand.visualIdentity.accessibilityNotes}
        </p>
      </DetailPanelSection>
    </div>
  );
}

function GuardrailsTab({ brand }: TabProps) {
  return (
    <div className="space-y-4">
      <DetailPanelSection title="Should Do">
        <div className="space-y-2">
          {brand.designGuardrails.shouldDo.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-2.5"
            >
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </DetailPanelSection>

      <DetailPanelSection title="Should Not Do">
        <div className="space-y-2">
          {brand.designGuardrails.shouldNotDo.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-2.5"
            >
              <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </DetailPanelSection>
    </div>
  );
}

function MarketAudienceTab({ brand }: TabProps) {
  return (
    <div className="space-y-4">
      <DetailPanelSection title="Target Audience">
        <DetailPanelRow
          label="Gender"
          value={brand.marketPositioning.targetGender}
        />
        <DetailPanelRow
          label="Age Range"
          value={brand.marketPositioning.targetAgeRange}
        />
        <DetailPanelRow
          label="Regions"
          value={brand.marketPositioning.regions}
        />
        <DetailPanelRow
          label="Brand Tier"
          value={brand.marketPositioning.brandTier}
        />
      </DetailPanelSection>

      <DetailPanelSection title="Psychographics">
        <p className="text-sm text-gray-700">
          {brand.marketPositioning.psychographics}
        </p>
      </DetailPanelSection>

      <DetailPanelSection title="Demographic Summary">
        <p className="text-sm text-gray-700">
          {brand.marketPositioning.demographicSummary}
        </p>
      </DetailPanelSection>

      <DetailPanelSection title="Style Archetypes">
        <div className="flex flex-wrap gap-1.5">
          {brand.marketPositioning.styleArchetypes.map((archetype) => (
            <Badge key={archetype} variant="primary" size="sm">
              {archetype}
            </Badge>
          ))}
        </div>
      </DetailPanelSection>
    </div>
  );
}

function CulturalTab({ brand }: TabProps) {
  return (
    <div className="space-y-4">
      <DetailPanelSection title="Cultural References">
        <div className="space-y-2">
          {brand.culturalInfluences.culturalReferences.map((ref, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
              <Globe className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{ref}</span>
            </div>
          ))}
        </div>
      </DetailPanelSection>

      <DetailPanelSection title="Sensitivity Notes">
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
          <Globe className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm text-gray-700">{brand.culturalInfluences.sensitivityNotes}</span>
        </div>
      </DetailPanelSection>

      <DetailPanelSection title="Key Symbols & Motifs">
        <div className="flex flex-wrap gap-1.5">
          {brand.culturalInfluences.importantSymbolsOrMotifs.map((motif) => (
            <Badge key={motif} variant="default" size="sm">
              {motif}
            </Badge>
          ))}
        </div>
      </DetailPanelSection>

      <DetailPanelSection title="Community & Subculture">
        <div className="space-y-2">
          {brand.culturalInfluences.subcultureAssociations.map((assoc, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{assoc}</span>
            </div>
          ))}
        </div>
      </DetailPanelSection>
    </div>
  );
}

function ValuesVoiceTab({ brand }: TabProps) {
  return (
    <div className="space-y-4">
      <DetailPanelSection title="Voice Style">
        <p className="text-sm text-gray-700">
          {brand.coreValues.voiceStyle}
        </p>
      </DetailPanelSection>

      <DetailPanelSection title="Heritage Background">
        <p className="text-sm text-gray-700">
          {brand.coreValues.heritageBackground}
        </p>
      </DetailPanelSection>

      <DetailPanelSection title="Design Theme Summary">
        <p className="text-sm text-gray-700">
          {brand.coreValues.designThemeSummary}
        </p>
      </DetailPanelSection>

      <DetailPanelSection title="Brand Values & Tones">
        <p className="text-sm text-gray-700">
          {brand.coreValues.brandValuesAndTones}
        </p>
      </DetailPanelSection>

      <DetailPanelSection title="Brand Story & Ideology">
        <p className="text-sm text-gray-700">
          {brand.coreValues.brandStoryAndIdeology}
        </p>
      </DetailPanelSection>
    </div>
  );
}

function SourcesTab({ brand }: TabProps) {
  return (
    <div className="space-y-4">
      <DetailPanelSection title="Reference Sources">
        <div className="space-y-2">
          {brand.sourceReferences.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary-600 transition-colors group"
            >
              <Link className="w-3 h-3 flex-shrink-0" />
              <span className="truncate group-hover:underline">{url}</span>
            </a>
          ))}
        </div>
      </DetailPanelSection>

      <DetailPanelSection title="Research Methodology">
        <p className="text-sm text-gray-500">
          This brand research was generated by AI agents analyzing publicly
          available brand materials, product catalogues, social media
          presence, and industry positioning data. Last updated March 2026.
        </p>
      </DetailPanelSection>
    </div>
  );
}
