import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, ChevronLeft, ChevronUp, Download, Sparkles, X, MapPin, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge, MetricCard, EmptyState } from '@/components/ui';
import { cn, formatDate } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { StoreIntelligenceDetailResponse } from '../api/storeIntelligenceApi';

interface StoreProfileViewProps {
  storeId: string;
  apiDetail?: StoreIntelligenceDetailResponse | null;
  hideStoreName?: boolean;
  deepResearchOpen?: boolean;
  onDeepResearchOpenChange?: (open: boolean) => void;
  /** When true, only render the Deep Research Dialog — skip all visible content */
  dialogOnly?: boolean;
}

function NarrativeCard({
  title,
  icon: Icon,
  summary,
  narrative,
  defaultExpanded = true,
}: {
  title: string;
  icon?: React.ElementType;
  summary: string;
  narrative?: string;
  defaultExpanded?: boolean;
}) {
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(defaultExpanded);
  // Only mobile cards with a deep-dive narrative collapse; desktop always shows it.
  const collapsible = isMobile && !!narrative;
  const showNarrative = collapsible ? expanded : !!narrative;

  const header = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon className="w-4 h-4 shrink-0 text-gray-500" />}
        <h4 className="truncate text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      {collapsible && (
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-180')}
          aria-hidden
        />
      )}
    </div>
  );

  const body = (
    <>
      <p className="mt-2 text-xs leading-relaxed text-gray-600">{summary}</p>
      {showNarrative && narrative && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="whitespace-pre-line text-xs leading-relaxed text-gray-700">{narrative}</p>
        </div>
      )}
    </>
  );

  const cardClass = 'rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200';

  // Mobile with a narrative: the whole card toggles the deep-dive.
  if (collapsible) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((v) => !v); } }}
        aria-expanded={expanded}
        aria-label={`${title} — ${expanded ? 'collapse' : 'expand'} details`}
        className={cn(cardClass, 'cursor-pointer hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2')}
      >
        {header}
        {body}
      </div>
    );
  }

  return (
    <div className={cn(cardClass, 'hover:border-primary/30 hover:shadow-md')}>
      {header}
      {body}
    </div>
  );
}

// ── Collapsible section for Deep Research panel ──

function DeepResearchSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full grid grid-cols-[1fr_auto] items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-4 py-3 space-y-3">{children}</div>}
    </div>
  );
}

// ── Deep Research panel body ──

// Shape of analysis_data from the API (matches StoreDeepResearch minus storeId)
interface AnalysisData {
  positioning?: {
    statement?: string;
    differentiator?: string;
    fashionCoreSplit?: { fashion: number; core: number };
  };
  catchmentDeepDive?: {
    narrative?: string;
    incomeBands?: { band: string; percent: number; profile: string }[];
    culturalProfile?: string;
    shoppingBehavior?: string;
    priceSensitivity?: string;
  };
  competitiveLandscape?: {
    intensityScore?: string;
    biggestThreat?: string;
    gapsToExploit?: string;
    whatCompetitorsDoBetter?: string;
  };
  demandSignals?: {
    topCategories?: { rank: number; category: string; priceRange: string; why: string }[];
    underservedCategories?: string;
    seasonalPatterns?: { period: string; pattern: string }[];
    weatherImpact?: string;
    onlineCompetition?: string;
  };
  categoryMixRecommendation?: { category: string; percent: number; notes: string }[];
  priceArchitecture?: { band: string; percent: number; rationale: string }[];
  topActions?: { title: string; description: string }[];
}

function DeepResearchPanelBody({
  storeName,
  apiDetail,
}: {
  storeName: string;
  apiDetail?: StoreIntelligenceDetailResponse | null;
}) {
  const apiAnalysis = (apiDetail?.analysis_data ?? null) as AnalysisData | null;

  const positioning = apiAnalysis?.positioning;
  const catchmentDeepDive = apiAnalysis?.catchmentDeepDive;
  const competitiveLandscape = apiAnalysis?.competitiveLandscape;
  const demandSignals = apiAnalysis?.demandSignals;
  const categoryMixRecommendation = apiAnalysis?.categoryMixRecommendation;
  const priceArchitecture = apiAnalysis?.priceArchitecture;
  const topActions = apiAnalysis?.topActions;

  const hasData = positioning || catchmentDeepDive || competitiveLandscape || demandSignals;

  if (!hasData) {
    return (
      // eslint-disable-next-line no-restricted-syntax -- side panel body needs p-6 for comfortable reading
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">AI-Generated Analysis</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Deep research for {storeName} has not been generated yet. This analysis combines
            catchment demographics, competitive intelligence, demand patterns, and historical
            performance into a comprehensive strategic brief.
          </p>
        </div>
        <EmptyState description="Run Deep Research to generate a full store intelligence report for this location." />
      </div>
    );
  }

  const fashionPct = positioning?.fashionCoreSplit?.fashion ?? 50;
  const corePct = positioning?.fashionCoreSplit?.core ?? (100 - fashionPct);

  return (
    // eslint-disable-next-line no-restricted-syntax -- side panel body needs p-6 for comfortable reading
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Store Positioning */}
      {positioning && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Store Identity</span>
          </div>
          {positioning.statement && (
            <p className="text-lg font-bold text-gray-900">{positioning.statement}</p>
          )}
          {positioning.differentiator && (
            <p className="text-xs text-gray-600 leading-relaxed mt-2">{positioning.differentiator}</p>
          )}
          {positioning.fashionCoreSplit && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/10">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Fashion</p>
                <p className="text-sm font-bold text-gray-900">{fashionPct}%</p>
              </div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                {/* eslint-disable-next-line no-restricted-syntax -- dynamic width */}
                <div className="h-full bg-primary rounded-full" style={{ width: `${fashionPct}%` }} />
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Core</p>
                <p className="text-sm font-bold text-gray-900">{corePct}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Catchment Deep Dive */}
      {catchmentDeepDive && (
        <DeepResearchSection title="Catchment Deep Dive">
          {catchmentDeepDive.narrative && (
            <p className="text-xs text-gray-700 leading-relaxed">{catchmentDeepDive.narrative}</p>
          )}

          {(catchmentDeepDive.incomeBands?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1.5">Income Distribution</p>
              <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-1 text-left font-medium">Band</th>
                    <th className="py-1 text-right font-medium w-14">%</th>
                    <th className="py-1 text-left font-medium pl-3">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {catchmentDeepDive.incomeBands!.map((band) => (
                    <tr key={band.band}>
                      <td className="py-1.5 font-medium text-gray-900 whitespace-nowrap">{band.band}</td>
                      <td className="py-1.5 text-right tabular-nums text-gray-700">{band.percent}%</td>
                      <td className="py-1.5 text-gray-500 pl-3">{band.profile}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {catchmentDeepDive.culturalProfile && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Cultural Profile</p>
              <p className="text-xs text-gray-600 leading-relaxed">{catchmentDeepDive.culturalProfile}</p>
            </div>
          )}
          {catchmentDeepDive.shoppingBehavior && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Shopping Behavior</p>
              <p className="text-xs text-gray-600 leading-relaxed">{catchmentDeepDive.shoppingBehavior}</p>
            </div>
          )}
          {catchmentDeepDive.priceSensitivity && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Price Sensitivity</p>
              <p className="text-xs text-gray-600 leading-relaxed">{catchmentDeepDive.priceSensitivity}</p>
            </div>
          )}
        </DeepResearchSection>
      )}

      {/* Competitive Landscape */}
      {competitiveLandscape && (
        <DeepResearchSection title="Competitive Landscape">
          {competitiveLandscape.intensityScore && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-500">Intensity:</span>
              <Badge
                variant={
                  competitiveLandscape.intensityScore === 'EXTREME' ? 'error'
                    : competitiveLandscape.intensityScore === 'HIGH' ? 'warning'
                    : 'info'
                }
              >
                {competitiveLandscape.intensityScore}
              </Badge>
            </div>
          )}
          {competitiveLandscape.biggestThreat && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Biggest Threat</p>
              <p className="text-xs text-gray-600 leading-relaxed">{competitiveLandscape.biggestThreat}</p>
            </div>
          )}
          {competitiveLandscape.gapsToExploit && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Gaps to Exploit</p>
              <p className="text-xs text-gray-600 leading-relaxed">{competitiveLandscape.gapsToExploit}</p>
            </div>
          )}
          {competitiveLandscape.whatCompetitorsDoBetter && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">What Competitors Do Better</p>
              <p className="text-xs text-gray-600 leading-relaxed">{competitiveLandscape.whatCompetitorsDoBetter}</p>
            </div>
          )}
        </DeepResearchSection>
      )}

      {/* Local Demand Signals */}
      {demandSignals && (
        <DeepResearchSection title="Local Demand Signals">
          {(demandSignals.topCategories?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1.5">Top Categories in Demand</p>
              <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="py-1 text-left font-medium w-6">#</th>
                    <th className="py-1 text-left font-medium">Category</th>
                    <th className="py-1 text-left font-medium">Price Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {demandSignals.topCategories!.map((cat) => (
                    <tr key={cat.rank}>
                      <td className="py-1.5 tabular-nums text-gray-400">{cat.rank}</td>
                      <td className="py-1.5">
                        <p className="font-medium text-gray-900">{cat.category}</p>
                        <p className="text-gray-500 mt-0.5">{cat.why}</p>
                      </td>
                      <td className="py-1.5 text-gray-700 whitespace-nowrap align-top">{cat.priceRange}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {demandSignals.underservedCategories && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Underserved Categories</p>
              <p className="text-xs text-gray-600 leading-relaxed">{demandSignals.underservedCategories}</p>
            </div>
          )}

          {(demandSignals.seasonalPatterns?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1.5">Seasonal Patterns</p>
              <div className="space-y-1">
                {demandSignals.seasonalPatterns!.map((sp) => (
                  <div key={sp.period} className="flex gap-2 text-xs">
                    <span className="font-medium text-gray-900 whitespace-nowrap w-20 shrink-0">{sp.period}</span>
                    <span className="text-gray-600">{sp.pattern}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {demandSignals.weatherImpact && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Weather Impact</p>
              <p className="text-xs text-gray-600 leading-relaxed">{demandSignals.weatherImpact}</p>
            </div>
          )}
          {demandSignals.onlineCompetition && (
            <div>
              <p className="text-xs font-semibold text-gray-900 mb-1">Online Competition</p>
              <p className="text-xs text-gray-600 leading-relaxed">{demandSignals.onlineCompetition}</p>
            </div>
          )}
        </DeepResearchSection>
      )}

      {/* Recommended Category Mix */}
      {categoryMixRecommendation && categoryMixRecommendation.length > 0 && (
        <DeepResearchSection title="Recommended Category Mix">
          <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-100">
                <th className="py-1 text-left font-medium">Category</th>
                <th className="py-1 text-right font-medium w-12">%</th>
                <th className="py-1 text-left font-medium pl-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categoryMixRecommendation.map((cat) => (
                <tr key={cat.category}>
                  <td className="py-1.5 font-medium text-gray-900 whitespace-nowrap">{cat.category}</td>
                  <td className="py-1.5 text-right tabular-nums text-gray-900 font-semibold">{cat.percent}%</td>
                  <td className="py-1.5 text-gray-500 pl-3">{cat.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {/* Visual bar */}
          <div className="flex h-3 rounded-full overflow-hidden">
            {categoryMixRecommendation.map((cat, i) => {
              const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-sky-400', 'bg-teal-400', 'bg-emerald-400', 'bg-gray-300'];
              return (
                <div
                  key={cat.category}
                  className={cn(colors[i % colors.length], 'first:rounded-l-full last:rounded-r-full')}
                  // eslint-disable-next-line no-restricted-syntax -- dynamic width for category allocation bar
                  style={{ width: `${cat.percent}%` }}
                  title={`${cat.category}: ${cat.percent}%`}
                />
              );
            })}
          </div>
        </DeepResearchSection>
      )}

      {/* Price Architecture */}
      {priceArchitecture && priceArchitecture.length > 0 && (
        <DeepResearchSection title="Price Architecture">
          <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-100">
                <th className="py-1 text-left font-medium">Band</th>
                <th className="py-1 text-right font-medium w-12">%</th>
                <th className="py-1 text-left font-medium pl-3">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {priceArchitecture.map((band) => (
                <tr key={band.band}>
                  <td className="py-1.5 font-medium text-gray-900 whitespace-nowrap">{band.band}</td>
                  <td className="py-1.5 text-right tabular-nums text-gray-900 font-semibold">{band.percent}%</td>
                  <td className="py-1.5 text-gray-500 pl-3">{band.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </DeepResearchSection>
      )}

      {/* Top Actions to Win */}
      {topActions && topActions.length > 0 && (
        <DeepResearchSection title="Top Actions to Win">
          <div className="space-y-3">
            {topActions.map((action, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900">{action.title}</p>
                  <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{action.description}</p>
                </div>
              </div>
            ))}
          </div>
        </DeepResearchSection>
      )}

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg border border-gray-100 p-3">
        <p className="text-xs text-gray-500 text-center">
          Analysis generated from POS data, Google Places API, catchment demographics, and competitive intelligence feeds.
        </p>
      </div>
    </div>
  );
}

export function StoreProfileView({
  storeId,
  apiDetail,
  hideStoreName,
  deepResearchOpen: externalDeepResearchOpen,
  onDeepResearchOpenChange,
  dialogOnly,
}: StoreProfileViewProps) {
  const isMobile = useIsMobile();
  const [localDeepResearchOpen, setLocalDeepResearchOpen] = useState(false);

  // Use external state if provided (from StoreIntelligenceDetail), otherwise use local state
  const deepResearchOpen = externalDeepResearchOpen ?? localDeepResearchOpen;
  const setDeepResearchOpen = onDeepResearchOpenChange ?? setLocalDeepResearchOpen;

  // Extract storeProfile narratives from API analysis_data
  const apiStoreProfile = (apiDetail?.analysis_data?.storeProfile ?? null) as {
    catchmentSummary?: string;
    catchmentNarrative?: string;
    shoppersSummary?: string;
    shoppersNarrative?: string;
    demandSummary?: string;
    demandNarrative?: string;
  } | null;

  const displayStoreName = apiDetail?.store_name ?? storeId;
  const displayAffluence = apiDetail?.affluenceScore ?? null;
  const displayFashion = apiDetail?.fashionForwardness ?? null;
  const displayYouth = apiDetail?.youthIndex ?? null;
  const displayFamily = apiDetail?.familyIndex ?? null;
  const displayDestination = apiDetail?.destinationScore ?? null;

  if (!apiDetail) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
        <p className="text-sm text-gray-500">
          No profile data available for this store.
        </p>
      </div>
    );
  }

  const handleDownloadPdf = () => {
    // If API provides a PDF download URL, use it directly
    if (apiDetail?.detailed_analysis_pdf_cdn_url) {
      window.open(apiDetail.detailed_analysis_pdf_cdn_url, '_blank');
      return;
    }

    // Fallback: generate HTML report from API data
    if (!apiDetail) return;

    const pdfAnalysis = (apiDetail.analysis_data ?? null) as AnalysisData | null;

    const scores = [
      { label: 'Affluence', value: displayAffluence != null ? `${displayAffluence}/100` : 'N/A' },
      { label: 'Fashion Fwd', value: displayFashion != null ? `${displayFashion}/100` : 'N/A' },
      { label: 'Youth', value: displayYouth != null ? `${displayYouth}/100` : 'N/A' },
      { label: 'Family', value: displayFamily != null ? `${displayFamily}/100` : 'N/A' },
      { label: 'Destination', value: displayDestination != null ? `${displayDestination}/100` : 'N/A' },
    ];

    let bodyHtml = '';

    const positioning = pdfAnalysis?.positioning;
    const catchmentDeepDive = pdfAnalysis?.catchmentDeepDive;
    const competitiveLandscape = pdfAnalysis?.competitiveLandscape;
    const demandSignals = pdfAnalysis?.demandSignals;
    const categoryMixRecommendation = pdfAnalysis?.categoryMixRecommendation;
    const priceArchitecture = pdfAnalysis?.priceArchitecture;
    const topActions = pdfAnalysis?.topActions;

    if (positioning || catchmentDeepDive || competitiveLandscape || demandSignals) {

      // Store Identity
      if (positioning?.statement) {
        bodyHtml += `<div class="section highlight">
<h2>${positioning.statement}</h2>
${positioning.differentiator ? `<p>${positioning.differentiator}</p>` : ''}
${positioning.fashionCoreSplit ? `<p class="split"><strong>Fashion/Core Split:</strong> ${positioning.fashionCoreSplit.fashion}% Fashion / ${positioning.fashionCoreSplit.core}% Core</p>` : ''}
</div>`;
      }

      // Catchment Deep Dive
      if (catchmentDeepDive) {
        bodyHtml += `<div class="section">
<h3>1. Catchment Deep Dive</h3>
${catchmentDeepDive.narrative ? `<p>${catchmentDeepDive.narrative}</p>` : ''}
${(catchmentDeepDive.incomeBands?.length ?? 0) > 0 ? `<table><thead><tr><th>Income Band</th><th>%</th><th>Profile</th></tr></thead><tbody>
${catchmentDeepDive.incomeBands!.map(b => `<tr><td>${b.band}</td><td>${b.percent}%</td><td>${b.profile}</td></tr>`).join('')}
</tbody></table>` : ''}
${catchmentDeepDive.culturalProfile ? `<h4>Cultural Profile</h4><p>${catchmentDeepDive.culturalProfile}</p>` : ''}
${catchmentDeepDive.shoppingBehavior ? `<h4>Shopping Behavior</h4><p>${catchmentDeepDive.shoppingBehavior}</p>` : ''}
${catchmentDeepDive.priceSensitivity ? `<h4>Price Sensitivity</h4><p>${catchmentDeepDive.priceSensitivity}</p>` : ''}
</div>`;
      }

      // Competitive Landscape
      if (competitiveLandscape) {
        bodyHtml += `<div class="section">
<h3>2. Competitive Landscape</h3>
${competitiveLandscape.intensityScore ? `<p><strong>Competitive Intensity: ${competitiveLandscape.intensityScore}</strong></p>` : ''}
${competitiveLandscape.biggestThreat ? `<h4>Biggest Threat</h4><p>${competitiveLandscape.biggestThreat}</p>` : ''}
${competitiveLandscape.gapsToExploit ? `<h4>Gaps to Exploit</h4><p>${competitiveLandscape.gapsToExploit}</p>` : ''}
${competitiveLandscape.whatCompetitorsDoBetter ? `<h4>What Competitors Do Better</h4><p>${competitiveLandscape.whatCompetitorsDoBetter}</p>` : ''}
</div>`;
      }

      // Local Demand Signals
      if (demandSignals) {
        bodyHtml += `<div class="section">
<h3>3. Local Demand Signals</h3>
${(demandSignals.topCategories?.length ?? 0) > 0 ? `<h4>Top Categories in Demand</h4>
<table><thead><tr><th>#</th><th>Category</th><th>Price Range</th><th>Why</th></tr></thead><tbody>
${demandSignals.topCategories!.map(c => `<tr><td>${c.rank}</td><td>${c.category}</td><td>${c.priceRange}</td><td>${c.why}</td></tr>`).join('')}
</tbody></table>` : ''}
${demandSignals.underservedCategories ? `<h4>Underserved Categories</h4><p>${demandSignals.underservedCategories}</p>` : ''}
${(demandSignals.seasonalPatterns?.length ?? 0) > 0 ? `<h4>Seasonal Patterns</h4>
<table><thead><tr><th>Period</th><th>Pattern</th></tr></thead><tbody>
${demandSignals.seasonalPatterns!.map(s => `<tr><td>${s.period}</td><td>${s.pattern}</td></tr>`).join('')}
</tbody></table>` : ''}
${demandSignals.weatherImpact ? `<h4>Weather Impact</h4><p>${demandSignals.weatherImpact}</p>` : ''}
${demandSignals.onlineCompetition ? `<h4>Online Competition</h4><p>${demandSignals.onlineCompetition}</p>` : ''}
</div>`;
      }

      // Recommended Category Mix
      if (categoryMixRecommendation && categoryMixRecommendation.length > 0) {
        bodyHtml += `<div class="section">
<h3>4. Recommended Category Mix</h3>
<table><thead><tr><th>Category</th><th>%</th><th>Notes</th></tr></thead><tbody>
${categoryMixRecommendation.map(c => `<tr><td>${c.category}</td><td><strong>${c.percent}%</strong></td><td>${c.notes}</td></tr>`).join('')}
</tbody></table>
</div>`;
      }

      // Price Architecture
      if (priceArchitecture && priceArchitecture.length > 0) {
        bodyHtml += `<div class="section">
<h3>5. Price Architecture</h3>
<table><thead><tr><th>Band</th><th>%</th><th>Rationale</th></tr></thead><tbody>
${priceArchitecture.map(b => `<tr><td>${b.band}</td><td><strong>${b.percent}%</strong></td><td>${b.rationale}</td></tr>`).join('')}
</tbody></table>
</div>`;
      }

      // Top Actions to Win
      if (topActions && topActions.length > 0) {
        bodyHtml += `<div class="section">
<h3>6. Top Actions to Win</h3>
<ol>${topActions.map(a => `<li><strong>${a.title}:</strong> ${a.description}</li>`).join('')}</ol>
</div>`;
      }
    } else {
      bodyHtml = `<div class="section"><p>Deep research has not been generated for this store. Run Full Store Analysis to populate this report.</p></div>`;
    }

    const reportName = displayStoreName;
    const reportMeta = `${displayStoreName}${apiDetail.cluster ? ` · ${apiDetail.cluster}` : ''}`;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Store Intelligence Report - ${reportName}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 740px; margin: 0 auto; padding: 40px 32px; color: #1a1a1a; font-size: 12px; line-height: 1.6; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 0 0 6px; color: #4338ca; }
  h3 { font-size: 14px; margin: 0 0 8px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  h4 { font-size: 12px; font-weight: 600; margin: 12px 0 4px; color: #374151; }
  .meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
  .scores { display: flex; gap: 16px; flex-wrap: wrap; padding: 12px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; margin-bottom: 24px; }
  .score { text-align: center; }
  .score-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .score-value { font-size: 14px; font-weight: 600; }
  .section { margin-bottom: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
  .section.highlight { background: #eef2ff; border-color: #c7d2fe; }
  .section p { color: #4b5563; margin: 0 0 8px; font-size: 12px; }
  .section .split { font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #c7d2fe; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; font-size: 12px; }
  th { text-align: left; padding: 6px 8px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; }
  td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  ol { padding-left: 20px; }
  ol li { margin-bottom: 10px; color: #4b5563; }
  ol li strong { color: #1a1a1a; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 20px; } .section { break-inside: avoid; } }
</style></head><body>
<h1>Store Intelligence Report</h1>
<p class="meta">${reportMeta} · Generated ${formatDate(new Date())}</p>
<div class="scores">${scores.map(s => `<div class="score"><div class="score-label">${s.label}</div><div class="score-value">${s.value}</div></div>`).join('')}</div>
${bodyHtml}
<div class="footer">Analysis generated from POS data, Google Places API, catchment demographics, and competitive intelligence feeds.<br>Impetus Command Center · ${formatDate(new Date())}</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        printWindow.print();
        // Clean up after print dialog closes
        printWindow.addEventListener('afterprint', () => {
          printWindow.close();
          URL.revokeObjectURL(url);
        });
      });
    }
  };

  // When dialogOnly, skip all visible content — only render the Deep Research Dialog
  if (dialogOnly) {
    return (
      <Dialog.Root open={deepResearchOpen} onOpenChange={setDeepResearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 top-14 bg-black/30 z-50 hidden lg:block data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className={cn(
              'fixed right-0 z-50 bg-white shadow-2xl',
              'inset-0 top-14 lg:inset-auto lg:right-0 lg:top-14 lg:h-[calc(100%-3.5rem)] lg:w-[560px] lg:rounded-tl-xl lg:border-l lg:border-gray-200 focus:outline-none flex flex-col',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:data-[state=closed]:slide-out-to-right lg:data-[state=open]:slide-in-from-right',
              'duration-200 lg:duration-300',
            )}
          >
            <div className="grid grid-cols-[1fr_auto] items-center px-4 lg:px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <Dialog.Close asChild>
                  <button type="button" className="lg:hidden p-1 text-gray-500 hover:text-gray-700 transition-colors" aria-label="Go back">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </Dialog.Close>
                <div>
                  <Dialog.Title className="text-sm font-semibold text-gray-900">Full Store Analysis</Dialog.Title>
                  <p className="text-xs text-gray-500 mt-0.5">{displayStoreName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">Default view: Last month</span>
                <button type="button" onClick={handleDownloadPdf} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Download as PDF">
                  <Download className="w-4 h-4" />
                </button>
                <Dialog.Close asChild>
                  <button type="button" className="hidden lg:block rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Close">
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>
            <DeepResearchPanelBody storeName={displayStoreName} apiDetail={apiDetail} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <div className="space-y-4">
      {/* Store identity line — hidden when parent already shows it */}
      {!hideStoreName && (
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-semibold text-gray-900">
            {displayStoreName}
          </h3>
          {apiDetail.cluster && (
            <span className="text-xs text-gray-500">{apiDetail.cluster}</span>
          )}
        </div>
      )}

      {/* Score bar — max 4 per row (design-system metric-grid rule); the 5th wraps. */}
      {/* eslint-disable-next-line design-system/prefer-metric-grid -- custom compact score bar with mixed metric types */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Affluence"
          infoKey="Affluence"
          value={displayAffluence != null ? `${Math.round(displayAffluence)}/100` : 'N/A'}
          className="!p-3"
        />
        <MetricCard
          label="Fashion"
          infoKey="Fashion Fwd"
          value={displayFashion != null ? `${Math.round(displayFashion)}/100` : 'N/A'}
          className="!p-3"
        />
        <MetricCard
          label="Youth"
          infoKey="Youth"
          value={displayYouth != null ? `${Math.round(displayYouth)}/100` : 'N/A'}
          className="!p-3"
        />
        <MetricCard
          label="Family"
          infoKey="Family"
          value={displayFamily != null ? `${Math.round(displayFamily)}/100` : 'N/A'}
          className="!p-3"
        />
        <MetricCard
          label="Destination"
          infoKey="Destination"
          value={displayDestination != null ? `${Math.round(displayDestination)}/100` : 'N/A'}
          className="!p-3"
        />
      </div>

      {/* Narrative cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NarrativeCard
          icon={MapPin}
          title="Catchment"
          summary={apiDetail.catchment_summary ?? apiStoreProfile?.catchmentSummary ?? `Affluence ${displayAffluence != null ? displayAffluence : 'N/A'}/100, Fashion ${displayFashion != null ? displayFashion : 'N/A'}/100`}
          narrative={apiStoreProfile?.catchmentNarrative}
          defaultExpanded={!isMobile}
        />
        <NarrativeCard
          icon={Users}
          title="Shoppers"
          summary={apiDetail.shoppers_summary ?? apiStoreProfile?.shoppersSummary ?? 'No shopper data available'}
          narrative={apiStoreProfile?.shoppersNarrative}
          defaultExpanded={!isMobile}
        />
        <NarrativeCard
          icon={TrendingUp}
          title="Demand"
          summary={apiDetail.demand_summary ?? apiStoreProfile?.demandSummary ?? 'No demand data available'}
          narrative={apiStoreProfile?.demandNarrative}
          defaultExpanded={!isMobile}
        />
        <NarrativeCard
          icon={AlertCircle}
          title="Situation"
          summary={apiDetail.situation_summary ?? 'No situational intelligence available for this store.'}
          defaultExpanded={!isMobile}
        />
      </div>

      {/* 5.2 -- Deep Research CTA (hidden when rendered from detail page — button is in tabs row) */}
      {!hideStoreName && (
        <button
          onClick={() => setDeepResearchOpen(true)}
          className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-primary/30 rounded-lg p-3 transition-all duration-200 text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                Run Full Store Analysis
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                AI-generated deep dive into catchment, competition, demand, and strategic opportunities
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90 group-hover:text-primary transition-colors shrink-0" />
          </div>
        </button>
      )}

      {/* 5.2 -- Deep Research side panel */}
      <Dialog.Root open={deepResearchOpen} onOpenChange={setDeepResearchOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 top-14 bg-black/30 z-50 hidden lg:block data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content
            className={cn(
              'fixed right-0 z-50 bg-white shadow-2xl',
              'inset-0 top-14 lg:inset-auto lg:right-0 lg:top-14 lg:h-[calc(100%-3.5rem)] lg:w-[560px] lg:rounded-tl-xl lg:border-l lg:border-gray-200 focus:outline-none flex flex-col',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:data-[state=closed]:slide-out-to-right lg:data-[state=open]:slide-in-from-right lg:data-[state=closed]:fade-out-0 lg:data-[state=open]:fade-in-0',
              'duration-200 lg:duration-300',
            )}
          >
            {/* Panel header */}
            {/* eslint-disable-next-line design-system/prefer-section-header -- side panel header with close/back button */}
            <div className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                {/* Mobile: back arrow */}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="lg:hidden p-1 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Go back"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </Dialog.Close>
                <div>
                  <Dialog.Title className="text-sm font-semibold text-gray-900">
                    Full Store Analysis
                  </Dialog.Title>
                  <p className="text-xs text-gray-500 mt-0.5">{displayStoreName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0 whitespace-nowrap">Default view: Last month</span>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  aria-label="Download as PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                {/* Desktop: X close button */}
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="hidden lg:block rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Panel body */}
            <DeepResearchPanelBody storeName={displayStoreName} apiDetail={apiDetail} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
