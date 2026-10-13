import { useState } from 'react';
import { Slider, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useUnifiedPlanningStore } from '../stores/unified-planning.store';
import { categorySegmentMap } from '@/modules/range/data/mockSpacePlanning';
import { CategorySpacePanel } from './CategorySpacePanel';
import { CategorySpaceRecommendations } from './CategorySpaceRecommendations';
import type { CategorySummary, CategoryDetails } from '../types/unified-planning.types';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface CategoryDetailsPanelProps {
  category: CategorySummary;
  details: CategoryDetails;
}

export function CategoryDetailsPanel({ category, details }: CategoryDetailsPanelProps) {
  const { updateOTBBudget } = useUnifiedPlanningStore();
  const [activeGrade, setActiveGrade] = useState(details.grades[0]);

  const segmentCode = categorySegmentMap[category.id];

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
      <Tabs defaultValue="planning">
        <TabsList>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="space">Space Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="planning">
      {/* First Row */}
      <div className="grid grid-cols-12 gap-4">
        {/* Category Cover & FTP Trends */}
        <div className="col-span-2 space-y-4">
          {/* Category Cover */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Category Cover
            </h4>
            <div className="space-y-3">
              {/* eslint-disable-next-line design-system/prefer-section-header -- inline label+value pair, not a section header */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">OTB Budget</span>
                <span className="font-semibold text-gray-900">{details.otbBudget.percentage.toFixed(0)}%</span>
              </div>
              <Slider
                value={details.otbBudget.percentage}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => updateOTBBudget(category.id, value[0] ?? 0)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>Target: 100%</span>
              </div>
            </div>
          </div>

          {/* FTP Trends */}
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              FTP Trends
            </h4>
            <div className="space-y-2">
              {details.ftpTrends.map((trend, index) => (
                <div key={index} className="flex items-center gap-2">
                  { }
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    // eslint-disable-next-line no-restricted-syntax -- dynamic color
                    style={{ backgroundColor: trend.color }}
                  />
                  <span className="text-xs text-gray-600 flex-1 truncate">{trend.name}</span>
                  <span className="text-xs font-semibold text-gray-900 tabular-nums">{trend.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Target Layer */}
        <div className="col-span-2 bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Target Layer
          </h4>
          <div className="space-y-4">
            <div>
              {/* eslint-disable-next-line design-system/prefer-section-header -- inline value+change indicator, not a section header */}
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(details.targetLayer.base * 10000000, { decimals: 2 })}</p>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${
                  details.targetLayer.baseChange > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {details.targetLayer.baseChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {details.targetLayer.baseChange > 0 ? '+' : ''}{details.targetLayer.baseChange}%
                </span>
              </div>
              <p className="text-xs text-gray-500 uppercase">Base Layer</p>
            </div>
            <div>
              {/* eslint-disable-next-line design-system/prefer-section-header -- inline value+change indicator, not a section header */}
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(details.targetLayer.mid * 10000000, { decimals: 2 })}</p>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${
                  details.targetLayer.midChange > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {details.targetLayer.midChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {details.targetLayer.midChange > 0 ? '+' : ''}{details.targetLayer.midChange}%
                </span>
              </div>
              <p className="text-xs text-gray-500 uppercase">Mid Layer</p>
            </div>
            <div>
              {/* eslint-disable-next-line design-system/prefer-section-header -- inline value+change indicator, not a section header */}
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(details.targetLayer.top * 10000000, { decimals: 2 })}</p>
                <span className={`text-xs font-medium flex items-center gap-0.5 ${
                  details.targetLayer.topChange > 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {details.targetLayer.topChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {details.targetLayer.topChange > 0 ? '+' : ''}{details.targetLayer.topChange}%
                </span>
              </div>
              <p className="text-xs text-gray-500 uppercase">Top Layer</p>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-primary">{details.targetLayer.totalPercentage}% Coverage</span>
            </div>
          </div>
        </div>

        {/* Buying Parallels */}
        <div className="col-span-2 bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Buying Parallels
          </h4>
          <div className="space-y-4">
            <div>
              <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(details.buyingParallels.planned * 10000000, { decimals: 2 })}</p>
              <p className="text-xs text-gray-500 uppercase">Planned Budget</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-500 tabular-nums">{formatCurrency(details.buyingParallels.actual * 10000000, { decimals: 2 })}</p>
              <p className="text-xs text-gray-500 uppercase">Utilized</p>
            </div>
            <div className="pt-3 border-t border-gray-100">
              {/* eslint-disable-next-line design-system/prefer-section-header -- inline label+value pair, not a section header */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase">Fulfillment</span>
                <span className="text-sm font-bold text-emerald-600">{details.buyingParallels.percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden mt-2">
                { }
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  // eslint-disable-next-line no-restricted-syntax -- dynamic width
                  style={{ width: `${Math.min(details.buyingParallels.percentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Range Structure */}
        <div className="col-span-3 bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Range Structure
          </h4>
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatNumber(details.rangeStructure.totalOptions)}</p>
                <p className="text-xs text-gray-500 uppercase">Total Options</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700 tabular-nums">{formatNumber(details.rangeStructure.newOptions)}</p>
                <p className="text-xs text-gray-500">New</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700 tabular-nums">{formatNumber(details.rangeStructure.carryForward)}</p>
                <p className="text-xs text-gray-500">Carry Fwd</p>
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="h-3 rounded-full overflow-hidden flex bg-gray-100">
              { }
              {details.rangeStructure.distribution.map((item, index) => (
                <div
                  key={index}
                  className="h-full transition-all"
                  // eslint-disable-next-line no-restricted-syntax -- dynamic width
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  title={`${item.label}: ${item.percentage}%`}
                />
              ))}
            </div>

            {/* eslint-disable-next-line design-system/prefer-metric-grid -- legend color swatches, not a metric grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {details.rangeStructure.distribution.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line no-restricted-syntax -- dynamic color from data */}
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600 truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Proposition */}
        <div className="col-span-3 bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Proposition Achievement
          </h4>
          <div className="flex items-start gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-lg font-bold text-gray-900 tabular-nums">{formatCurrency(details.proposition.target)}</p>
                  <p className="text-xs text-gray-500 uppercase">Target</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary tabular-nums">{formatCurrency(details.proposition.achieved)}</p>
                  <p className="text-xs text-gray-500 uppercase">Achieved</p>
                </div>
              </div>
              <div>
                {/* eslint-disable-next-line design-system/prefer-section-header -- inline progress label+value, not a section header */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-semibold text-gray-700">{details.proposition.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  { }
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    // eslint-disable-next-line no-restricted-syntax -- dynamic width
                    style={{ width: `${Math.min(details.proposition.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Progress Circle */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  stroke="var(--color-primary)"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(details.proposition.percentage / 100) * 175.9} 175.9`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-gray-900">{details.proposition.percentage}%</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase">vs LY</p>
              <p className={`text-sm font-semibold flex items-center gap-1 justify-end ${
                details.proposition.lyComparison > 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {details.proposition.lyComparison > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {details.proposition.lyComparison > 0 ? '+' : ''}{details.proposition.lyComparison}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-12 gap-4 mt-4">
        {/* Story Performance */}
        <div className="col-span-3 bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Story Performance
          </h4>

          {/* Performance Bars */}
          <div className="flex items-end gap-2 mb-3 h-16">
            {[
              { label: 'AY', value: details.storyPerformance.ay, color: '#059669' },
              { label: 'AL', value: details.storyPerformance.al, color: '#3b82f6' },
              { label: 'AT', value: details.storyPerformance.at, color: '#d97706' },
              { label: 'AS', value: details.storyPerformance.as, color: '#dc2626' },
            ].map((item) => (
              <div key={item.label} className="flex-1 flex flex-col items-center">
                <span className="text-xs font-semibold text-gray-700 mb-1 tabular-nums">{item.value}%</span>
                { }
                <div
                  className="w-full rounded-t transition-all"
                  // eslint-disable-next-line no-restricted-syntax -- dynamic height
                  style={{ height: `${(item.value / 120) * 48}px`, backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-500 mt-1">{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-500 text-center">Based on 16 Active Stories</p>
        </div>

        {/* Option Mix by Grade */}
        <div className="col-span-5 bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Option Mix by Grade
          </h4>
          <div className="space-y-2">
            {details.optionMix.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-28 truncate">{item.name}</span>
                <div className="flex-1 h-4 rounded overflow-hidden flex bg-gray-100">
                  {/* eslint-disable-next-line no-restricted-syntax -- dynamic width based on percentage */}
                  <div className="h-full bg-primary" style={{ width: `${item.classic}%` }} />
                  {/* eslint-disable-next-line no-restricted-syntax -- dynamic width based on percentage */}
                  <div className="h-full bg-blue-500" style={{ width: `${item.fashionBase}%` }} />
                  {/* eslint-disable-next-line no-restricted-syntax -- dynamic width based on percentage */}
                  <div className="h-full bg-indigo-500" style={{ width: `${item.fashionPulse}%` }} />
                  {/* eslint-disable-next-line no-restricted-syntax -- dynamic width based on percentage */}
                  <div className="h-full bg-gray-400" style={{ width: `${item.fastFashion}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-14 text-right tabular-nums">
                  {formatNumber(item.total)}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            {[
              { label: 'Core Basics', color: 'var(--color-primary-700)' },
              { label: 'Seasonal', color: '#3b82f6' },
              { label: 'Fashion Fwd', color: '#6366f1' },
              { label: 'Trend', color: '#9ca3af' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                {/* eslint-disable-next-line no-restricted-syntax -- dynamic color from data */}
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grades */}
        <div className="col-span-4 bg-white rounded-lg p-4 border border-gray-100">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Grade Distribution
          </h4>

          {/* Grade Tabs */}
          <div className="flex items-center gap-1.5 mb-4">
            {details.grades.map((grade) => (
              <button
                key={grade}
                onClick={() => setActiveGrade(grade)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  activeGrade === grade
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>

          {/* Grade Options */}
          <div className="space-y-2">
            {details.gradeOptions.map((option) => (
              <div key={option.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-28 truncate">{option.name}</span>
                <div className="flex-1 h-3 rounded overflow-hidden flex bg-gray-100">
                  { }
                  {option.values.map((val, idx) => (
                    <div
                      key={idx}
                      className="h-full transition-all"
                      // eslint-disable-next-line no-restricted-syntax -- dynamic width
                      style={{ width: `${(val.value / 15000) * 100}%`, backgroundColor: val.color }}
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-gray-700 w-14 text-right tabular-nums">
                  {formatNumber(option.values.reduce((sum, v) => sum + v.value, 0))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="space">
          {segmentCode ? (
            <Tabs defaultValue="performance">
              <TabsList>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>
              <TabsContent value="performance">
                <CategorySpacePanel
                  segmentCode={segmentCode}
                />
              </TabsContent>
              <TabsContent value="recommendations">
                <CategorySpaceRecommendations categoryId={category.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No space data available for this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
