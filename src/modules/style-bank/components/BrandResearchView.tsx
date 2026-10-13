import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
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
import { BRAND_DNA_MAP, type BrandDNA } from '../data/mockBrandDNA';
import { useShowroomCurationStore } from '../stores/useShowroomCurationStore';
import { cn } from '@/lib/utils';
import { Badge, Button } from '@/components/ui';

// ── Brand Listing ────────────────────────────────────────────────────────

const allBrands = Object.values(BRAND_DNA_MAP);

export function BrandResearchView() {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const selectedBrand = selectedBrandId ? BRAND_DNA_MAP[selectedBrandId] ?? null : null;

  if (selectedBrand) {
    return (
      <BrandDetail
        brand={selectedBrand}
        onBack={() => setSelectedBrandId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeInUp">
      <div className="px-6 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Brand Research</h2>
          <p className="text-sm text-gray-500 mt-1">
            AI-generated brand DNA for design curation and style validation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {allBrands.map((brand) => (
            <BrandCard
              key={brand.brandId}
              brand={brand}
              onClick={() => setSelectedBrandId(brand.brandId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Brand Card ───────────────────────────────────────────────────────────

function BrandCard({ brand, onClick }: { brand: BrandDNA; onClick: () => void }) {
  return (
    <div
      className="group cursor-pointer bg-white rounded-lg border border-gray-200 p-4 hover:border-primary/30 hover:shadow-md transition-all duration-200 flex flex-col"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{brand.brandName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{brand.brandClassification}</p>
        </div>
        <Badge variant="primary" size="sm" className="whitespace-nowrap">{brand.marketPositioning.brandTier}</Badge>
      </div>

      {/* Price range + demographics */}
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
        <span>{brand.priceRange.currency} {brand.priceRange.min.toLocaleString('en-IN')} - {brand.priceRange.max.toLocaleString('en-IN')}</span>
        {/* eslint-disable-next-line no-restricted-syntax -- decorative separator between price and demographic */}
        <span className="text-gray-300">|</span>
        <span>{brand.marketPositioning.targetGender}, {brand.marketPositioning.targetAgeRange}</span>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1 mb-3">
        {brand.primaryCategories.slice(0, 4).map((cat) => (
          <span key={cat} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
            {cat}
          </span>
        ))}
        {brand.primaryCategories.length > 4 && (
          <span className="px-2 py-0.5 text-gray-400 text-xs">+{brand.primaryCategories.length - 4}</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-3 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-1 text-primary text-sm font-medium">
          View Research
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

// ── Brand Detail ─────────────────────────────────────────────────────────

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

function BrandDetail({ brand, onBack }: { brand: BrandDNA; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const navigate = useNavigate();
  const { setBrandFilter } = useShowroomCurationStore();
  const styles = useShowroomCurationStore((s) => s.styles);

  // Find the style brandId that matches this brand name
  const styleBrandId = styles.find(
    (s) => s.product.brand.toLowerCase() === brand.brandName.toLowerCase()
  )?.product.brandId;

  const handleExploreStyles = () => {
    if (styleBrandId) {
      setBrandFilter(styleBrandId);
    }
    navigate('/showroom/discover');
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fadeInUp">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          {/* eslint-disable-next-line design-system/prefer-section-header -- brand research header with back + CTA */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-1 text-gray-600 hover:text-gray-900 transition-colors"
                aria-label="Back to brands"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm">Brands</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{brand.brandName}</h1>
                <p className="text-sm text-gray-500">{brand.brandClassification}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button size="sm" onClick={handleExploreStyles}>
                Explore Styles
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Tab bar */}
          <nav className="flex gap-1 border-t border-gray-100 pt-2 -mb-4 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2',
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6 max-w-5xl">
        {activeTab === 'overview' && <OverviewContent brand={brand} />}
        {activeTab === 'visual' && <VisualIdentityContent brand={brand} />}
        {activeTab === 'guardrails' && <GuardrailsContent brand={brand} />}
        {activeTab === 'market' && <MarketContent brand={brand} />}
        {activeTab === 'cultural' && <CulturalContent brand={brand} />}
        {activeTab === 'values' && <ValuesContent brand={brand} />}
        {activeTab === 'sources' && <SourcesContent brand={brand} />}
      </div>
    </div>
  );
}

// ── Shared Section Card ──────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ── Tab Content Components ───────────────────────────────────────────────

function OverviewContent({ brand }: { brand: BrandDNA }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Brand Identity">
        <InfoRow label="Brand Name" value={brand.brandName} />
        <InfoRow label="Classification" value={brand.brandClassification} />
        <InfoRow label="Brand Tier" value={brand.marketPositioning.brandTier} />
      </Section>

      <Section title="Price Architecture">
        <InfoRow label="Currency" value={brand.priceRange.currency} />
        <InfoRow label="Minimum" value={`${brand.priceRange.currency} ${brand.priceRange.min.toLocaleString('en-IN')}`} />
        <InfoRow label="Median" value={`${brand.priceRange.currency} ${brand.priceRange.median.toLocaleString('en-IN')}`} />
        <InfoRow label="Maximum" value={`${brand.priceRange.currency} ${brand.priceRange.max.toLocaleString('en-IN')}`} />
      </Section>

      <Section title="Primary Categories">
        <div className="flex flex-wrap gap-1.5">
          {brand.primaryCategories.map((cat) => (
            <Badge key={cat} variant="primary" size="sm">{cat}</Badge>
          ))}
        </div>
      </Section>

      <Section title="Descriptive Tags">
        <div className="flex flex-wrap gap-1.5">
          {brand.descriptiveTags.map((tag) => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
        </div>
      </Section>
    </div>
  );
}

function VisualIdentityContent({ brand }: { brand: BrandDNA }) {
  return (
    <div className="space-y-6">
      <Section title="Palette Overview">
        <p className="text-sm text-gray-700">{brand.visualIdentity.paletteOverview}</p>
      </Section>

      <Section title="Master Palette">
        <div className="space-y-2">
          {brand.visualIdentity.masterPalette.map((description, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50">
              <Palette className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{description}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Accessibility Notes">
        <p className="text-sm text-gray-700">{brand.visualIdentity.accessibilityNotes}</p>
      </Section>
    </div>
  );
}

function GuardrailsContent({ brand }: { brand: BrandDNA }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Should Do">
        <div className="space-y-2">
          {brand.designGuardrails.shouldDo.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-lg p-3">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Should Not Do">
        <div className="space-y-2">
          {brand.designGuardrails.shouldNotDo.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function MarketContent({ brand }: { brand: BrandDNA }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Target Audience">
        <InfoRow label="Gender" value={brand.marketPositioning.targetGender} />
        <InfoRow label="Age Range" value={brand.marketPositioning.targetAgeRange} />
        <InfoRow label="Regions" value={brand.marketPositioning.regions} />
        <InfoRow label="Brand Tier" value={brand.marketPositioning.brandTier} />
      </Section>

      <Section title="Style Archetypes">
        <div className="space-y-2">
          {brand.marketPositioning.styleArchetypes.map((archetype) => (
            <div key={archetype} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <Target className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-sm text-gray-700">{archetype}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="md:col-span-2">
        <Section title="Psychographics">
          <p className="text-sm text-gray-700 leading-relaxed">{brand.marketPositioning.psychographics}</p>
        </Section>
      </div>

      <div className="md:col-span-2">
        <Section title="Demographic Summary">
          <p className="text-sm text-gray-700 leading-relaxed">{brand.marketPositioning.demographicSummary}</p>
        </Section>
      </div>
    </div>
  );
}

function CulturalContent({ brand }: { brand: BrandDNA }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Cultural References">
        <div className="space-y-2">
          {brand.culturalInfluences.culturalReferences.map((ref, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
              <Globe className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{ref}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Key Symbols & Motifs">
        <div className="space-y-2">
          {brand.culturalInfluences.importantSymbolsOrMotifs.map((motif, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{motif}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="md:col-span-2">
        <Section title="Sensitivity Notes">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
            <Globe className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700">{brand.culturalInfluences.sensitivityNotes}</span>
          </div>
        </Section>
      </div>

      <Section title="Community & Subculture">
        <div className="space-y-2">
          {brand.culturalInfluences.subcultureAssociations.map((assoc, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{assoc}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Festivals & Occasions">
        <div className="space-y-2">
          {brand.culturalInfluences.festivalsOrOccasions.map((occasion, idx) => (
            <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{occasion}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function ValuesContent({ brand }: { brand: BrandDNA }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Voice Style">
        <p className="text-sm text-gray-700 leading-relaxed">{brand.coreValues.voiceStyle}</p>
      </Section>

      <Section title="Heritage Background">
        <p className="text-sm text-gray-700 leading-relaxed">{brand.coreValues.heritageBackground}</p>
      </Section>

      <Section title="Design Theme Summary">
        <p className="text-sm text-gray-700 leading-relaxed">{brand.coreValues.designThemeSummary}</p>
      </Section>

      <Section title="Brand Values & Tones">
        <p className="text-sm text-gray-700 leading-relaxed">{brand.coreValues.brandValuesAndTones}</p>
      </Section>

      <div className="md:col-span-2">
        <Section title="Brand Story & Ideology">
          <p className="text-sm text-gray-700 leading-relaxed">{brand.coreValues.brandStoryAndIdeology}</p>
        </Section>
      </div>
    </div>
  );
}

function SourcesContent({ brand }: { brand: BrandDNA }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Reference Sources">
        <div className="space-y-2">
          {brand.sourceReferences.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors group p-2 rounded-lg hover:bg-primary/5"
            >
              <Link className="w-4 h-4 flex-shrink-0" />
              <span className="truncate group-hover:underline">{url}</span>
            </a>
          ))}
        </div>
      </Section>

      <Section title="Research Methodology">
        <p className="text-sm text-gray-500 leading-relaxed">
          This brand research was generated by AI agents analyzing publicly
          available brand materials, product catalogues, social media
          presence, and industry positioning data. Last updated March 2026.
        </p>
      </Section>
    </div>
  );
}
