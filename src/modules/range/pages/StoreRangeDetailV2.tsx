/* eslint-disable design-system/prefer-section-header -- store range detail uses custom layouts */
import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  TrendingUp,
  Calendar,
  ChevronRight,
  BarChart3,
  Grid3x3,
  List,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/ui";
import { mockStoreRangeData } from "../data/mockRangeArchitecture";
import { getCurrencySymbol } from '@/lib/utils';

type ViewMode = "visual" | "table" | "analytics";

// Precompute deterministic mock values to avoid impure Math.random() calls during render
const mockThumbPrices = Array.from(
  { length: 10 },
  (_, i) => ((i * 173 + 41) % 2000) + 500,
);
const mockDetailPrices = Array.from(
  { length: 40 },
  (_, i) => ((i * 137 + 29) % 2000) + 500,
);
const mockDetailUnits = Array.from(
  { length: 40 },
  (_, i) => ((i * 83 + 47) % 500) + 100,
);

export default function StoreRangeDetailV2() {
  const { storeId } = useParams();
  const [viewMode, setViewMode] = useState<ViewMode>("visual");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get store data
  const store = mockStoreRangeData.find((s) => s.id === storeId);
  if (!store) {
    return <div className="p-4 text-sm text-gray-500">Store not found</div>;
  }

  // Mock data for demonstration
  const storeMetrics = {
    ytdSales: 142.5,
    ytdGrowth: 12.3,
    avgBasketSize: 3420,
    conversionRate: 42,
    repeatCustomerRate: 68,
    inventoryTurnover: 4.2,
    stockoutRate: 3.2,
    customerSatisfaction: 4.6,
  };

  const categories = [
    {
      id: "mc",
      name: "Men's Casual",
      options: 420,
      units: 12000,
      revenue: 42.5,
      growth: 15,
    },
    {
      id: "mf",
      name: "Men's Formal",
      options: 180,
      units: 4200,
      revenue: 28.3,
      growth: 8,
    },
    {
      id: "ww",
      name: "Women's Western",
      options: 380,
      units: 9800,
      revenue: 38.7,
      growth: 22,
    },
    {
      id: "we",
      name: "Women's Ethnic",
      options: 290,
      units: 7200,
      revenue: 31.2,
      growth: 18,
    },
    {
      id: "kw",
      name: "Kids Wear",
      options: 220,
      units: 8500,
      revenue: 18.9,
      growth: 25,
    },
  ];

  const topProducts = [
    {
      name: "Slim Fit Jeans",
      category: "MC",
      units: 2400,
      revenue: 4.8,
      trend: "up",
    },
    {
      name: "Cotton Kurta Set",
      category: "WE",
      units: 1800,
      revenue: 3.6,
      trend: "up",
    },
    {
      name: "Formal Shirt White",
      category: "MF",
      units: 1500,
      revenue: 3.2,
      trend: "stable",
    },
    {
      name: "Summer Dress Floral",
      category: "WW",
      units: 1200,
      revenue: 2.8,
      trend: "up",
    },
    {
      name: "Kids T-Shirt Pack",
      category: "KW",
      units: 2200,
      revenue: 2.4,
      trend: "up",
    },
  ];

  const insights = [
    {
      type: "opportunity",
      title: "Underindexed in Women's Western",
      description:
        "Store is 23% below similar Grade A stores in WW options. Consider adding 40-50 more styles.",
      impact: "+₹8.2 L monthly",
      priority: "high",
    },
    {
      type: "risk",
      title: "High stockout rate in Kids Wear",
      description:
        "KW category showing 8.3% stockout rate vs 3.2% store average. Increase depth by 20%.",
      impact: "-₹2.1 L lost sales",
      priority: "critical",
    },
    {
      type: "success",
      title: "Men's Casual outperforming",
      description:
        "MC category is 18% above cluster average. Maintain current allocation.",
      impact: "+₹5.4 L above plan",
      priority: "low",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header with Breadcrumbs */}
      <PageHeader
        backTo={{ label: "Store Range", path: "/ra/store-range" }}
        title={store.storeName}
        badges={
          <>
            <Badge variant="outline" className="font-bold">
              Grade {store.storeGrade}
            </Badge>
            {store.isTopPerformer && (
              <Badge variant="success" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                Top Performer #{store.storeRank}
              </Badge>
            )}
          </>
        }
      />

      <div className="p-4 space-y-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-8 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">YTD Sales</div>
            <div className="text-lg font-bold text-gray-900">
              {getCurrencySymbol()}{storeMetrics.ytdSales}M
            </div>
            <div className="text-xs text-green-600 font-medium">
              +{storeMetrics.ytdGrowth}%
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Avg Basket</div>
            <div className="text-lg font-bold text-gray-900">
              {getCurrencySymbol()}{storeMetrics.avgBasketSize}
            </div>
            <div className="text-xs text-gray-500">per transaction</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Conversion</div>
            <div className="text-lg font-bold text-gray-900">
              {storeMetrics.conversionRate}%
            </div>
            <div className="text-xs text-gray-500">walk-in to buy</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Repeat Rate</div>
            <div className="text-lg font-bold text-gray-900">
              {storeMetrics.repeatCustomerRate}%
            </div>
            <div className="text-xs text-green-600 font-medium">
              +5% vs last yr
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Inventory Turn</div>
            <div className="text-lg font-bold text-gray-900">
              {storeMetrics.inventoryTurnover}x
            </div>
            <div className="text-xs text-gray-500">per year</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Stockout Rate</div>
            <div className="text-lg font-bold text-red-600">
              {storeMetrics.stockoutRate}%
            </div>
            <div className="text-xs text-red-600 font-medium">Above target</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">Total Options</div>
            <div className="text-lg font-bold text-gray-900">
              {store.totalOptions}
            </div>
            <div className="text-xs text-gray-500">unique styles</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 mb-1">CSAT Score</div>
            <div className="text-lg font-bold text-gray-900">
              {storeMetrics.customerSatisfaction}
            </div>
            <div className="text-xs text-gray-500">out of 5.0</div>
          </div>
        </div>

        {/* Main Content Area - Full Width Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Range Composition - Expanded */}
          <div className="col-span-8 space-y-6">
            {/* View Mode Selector */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Range Composition
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode("visual")}
                    className={cn(
                      "p-1.5 rounded-md",
                      viewMode === "visual"
                        ? "bg-indigo-100 text-primary-700"
                        : "text-gray-400 hover:text-gray-600",
                    )}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "p-1.5 rounded-md",
                      viewMode === "table"
                        ? "bg-indigo-100 text-primary-700"
                        : "text-gray-400 hover:text-gray-600",
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("analytics")}
                    className={cn(
                      "p-1.5 rounded-md",
                      viewMode === "analytics"
                        ? "bg-indigo-100 text-primary-700"
                        : "text-gray-400 hover:text-gray-600",
                    )}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-full",
                      selectedCategory === "all"
                        ? "bg-indigo-100 text-primary-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-full",
                        selectedCategory === cat.id
                          ? "bg-indigo-100 text-primary-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content based on view mode */}
              {viewMode === "visual" && (
                <div className="p-4">
                  {selectedCategory === "all" ? (
                    // Show all categories in a more compact view
                    <div className="space-y-6">
                      {categories.map((cat) => (
                        <div key={cat.id}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {cat.name}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {cat.options} styles ·{" "}
                                {cat.units.toLocaleString()} units · ₹
                                {cat.revenue}M
                              </span>
                            </div>
                            <button className="text-xs text-primary font-medium hover:text-primary-700">
                              View all →
                            </button>
                          </div>
                          <div className="grid grid-cols-10 gap-2">
                            {[...Array(Math.min(10, cat.options))].map(
                              (_, i) => (
                                <div key={i} className="relative group">
                                  <div className="aspect-[3/4] bg-gray-100 rounded overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                                    <div className="absolute bottom-1 left-1 right-1">
                                      <div className="text-[8px] text-white font-medium truncate">
                                        #{cat.id.toUpperCase()}
                                        {i + 1}
                                      </div>
                                      <div className="text-[7px] text-white/80">
                                        {getCurrencySymbol()}{mockThumbPrices[i]}
                                      </div>
                                    </div>
                                    {/* Stock indicator */}
                                    <div
                                      className={cn(
                                        "absolute top-1 right-1 w-1.5 h-1.5 rounded-full",
                                        i % 7 === 0
                                          ? "bg-red-500"
                                          : i % 5 === 0
                                            ? "bg-amber-500"
                                            : "bg-green-500",
                                      )}
                                    />
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                          {cat.options > 10 && (
                            <div className="text-center text-[10px] text-gray-400 mt-2">
                              +{cat.options - 10} more styles
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Show single category in detail
                    <div>
                      <div className="grid grid-cols-8 gap-3">
                        {[...Array(40)].map((_, i) => (
                          <div key={i} className="relative group">
                            <div className="aspect-[3/4] bg-gray-100 rounded-md overflow-hidden relative">
                              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                              <div className="absolute bottom-2 left-2 right-2">
                                <div className="text-[9px] text-white font-medium">
                                  Style #{i + 1001}
                                </div>
                                <div className="text-[8px] text-white/80">
                                  {getCurrencySymbol()}{mockDetailPrices[i]} · {mockDetailUnits[i]}{" "}
                                  units
                                </div>
                              </div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
                                <button className="p-1 bg-white rounded shadow-sm">
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewMode === "table" && (
                <div className="p-4">
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs text-gray-500 border-b">
                        <th className="text-left pb-2">Category</th>
                        <th className="text-right pb-2">Options</th>
                        <th className="text-right pb-2">Units</th>
                        <th className="text-right pb-2">Revenue (₹M)</th>
                        <th className="text-right pb-2">Growth%</th>
                        <th className="text-right pb-2">Mix%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories
                        .filter(
                          (cat) =>
                            selectedCategory === "all" ||
                            cat.id === selectedCategory,
                        )
                        .map((cat) => (
                          <tr key={cat.id} className="border-b text-sm">
                            <td className="py-2 font-medium">{cat.name}</td>
                            <td className="py-2 text-right">{cat.options}</td>
                            <td className="py-2 text-right">
                              {cat.units.toLocaleString()}
                            </td>
                            <td className="py-2 text-right">{cat.revenue}</td>
                            <td className="py-2 text-right">
                              <span
                                className={cn(
                                  "font-medium",
                                  cat.growth > 15
                                    ? "text-green-600"
                                    : cat.growth > 10
                                      ? "text-gray-900"
                                      : "text-amber-600",
                                )}
                              >
                                +{cat.growth}%
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              {((cat.revenue / 159.6) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {viewMode === "analytics" && (
                <div className="p-4 space-y-4">
                  {/* Price Architecture */}
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Price Architecture
                    </div>
                    <div className="flex items-end gap-1 h-32">
                      {[
                        { label: "<₹500", height: 20, value: 120 },
                        { label: "₹500-999", height: 45, value: 380 },
                        { label: "₹1000-1499", height: 80, value: 680 },
                        { label: "₹1500-1999", height: 65, value: 520 },
                        { label: "₹2000-2999", height: 40, value: 340 },
                        { label: "₹3000+", height: 25, value: 180 },
                      ].map((bar, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div className="text-[10px] text-gray-600 mb-1">
                            {bar.value}
                          </div>
                          <div
                            className="w-full bg-indigo-500 rounded-t"
                            // eslint-disable-next-line no-restricted-syntax -- Dynamic value
                            style={{ height: `${bar.height}%` }}
                          />
                          <div className="text-[9px] text-gray-500 mt-1">
                            {bar.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Core vs Fashion Split */}
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Core vs Fashion Mix
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex h-6 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="bg-gray-600 w-[65%]"
                          />
                          <div
                            className="bg-indigo-600 w-[35%]"
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                          <span>Core: 65%</span>
                          <span>Fashion: 35%</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">Target: 70/30</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  Top Performing Styles
                </h2>
              </div>
              <div className="p-4">
                {/* Column Headers */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8" />
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product / Category
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right w-20">
                      Units Sold
                    </span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right w-16">
                      Revenue
                    </span>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider w-6">
                      Trend
                    </span>
                  </div>
                </div>
                {/* Product List */}
                <div className="space-y-3">
                  {topProducts.map((product, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 text-right w-20">
                          {product.units} units
                        </span>
                        <span className="text-sm font-medium text-right w-16">
                          {getCurrencySymbol()}{product.revenue}M
                        </span>
                        <div className="w-6 flex justify-center">
                          {product.trend === "up" && (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Insights, Actions & Analytics - Expanded */}
          <div className="col-span-4 space-y-4">
            {/* Store Insights */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">
                  Store Insights
                </h2>
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="p-4 space-y-3">
                {insights.map((insight, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 rounded-lg border",
                      insight.type === "opportunity"
                        ? "bg-blue-50 border-blue-200"
                        : insight.type === "risk"
                          ? "bg-red-50 border-red-200"
                          : "bg-green-50 border-green-200",
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-xs font-semibold text-gray-900">
                        {insight.title}
                      </div>
                      {insight.priority === "critical" && (
                        <Badge
                          variant="destructive"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Critical
                        </Badge>
                      )}
                      {insight.priority === "high" && (
                        <Badge
                          variant="warning"
                          className="text-[10px] px-1.5 py-0"
                        >
                          High
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {insight.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          insight.type === "opportunity"
                            ? "text-blue-700"
                            : insight.type === "risk"
                              ? "text-red-700"
                              : "text-green-700",
                        )}
                      >
                        {insight.impact}
                      </span>
                      <button className="text-xs text-primary font-medium hover:text-primary-700">
                        Take Action →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison with Similar Stores */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  vs Similar Stores
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comparing with 5 Grade {store.storeGrade} stores in region
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      Options per store
                    </span>
                    <span className="text-xs font-medium text-green-600">
                      +12% above avg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 w-[78%]"
                      />
                    </div>
                    <span className="text-xs text-gray-900 font-medium">
                      2,374
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Cluster avg: 2,118
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      Sales per SqFt
                    </span>
                    <span className="text-xs font-medium text-amber-600">
                      -5% below avg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 w-[68%]"
                      />
                    </div>
                    <span className="text-xs text-gray-900 font-medium">
                      ₹8.2 K
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Cluster avg: ₹8.6 K
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">
                      Inventory Turnover
                    </span>
                    <span className="text-xs font-medium text-green-600">
                      +0.4x above avg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 w-[84%]"
                      />
                    </div>
                    <span className="text-xs text-gray-900 font-medium">
                      4.2x
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    Cluster avg: 3.8x
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Actions */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Upcoming Range Events
                </h2>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      Summer Collection Launch
                    </div>
                    <div className="text-xs text-gray-500">
                      420 new styles arriving
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Mar 15
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      End of Season Sale
                    </div>
                    <div className="text-xs text-gray-500">
                      Clear 180 slow-moving styles
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Mar 25
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      Festive Range Drop
                    </div>
                    <div className="text-xs text-gray-500">
                      Limited edition 60 styles
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    Apr 5
                  </Badge>
                </div>
              </div>
            </div>

            {/* Local Market Trends */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">
                  Local Market Trends
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Based on {store.city} catchment analysis
                </p>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-purple-100 rounded" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        Ethnic Fusion
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Growing demand
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-green-600">
                    +34%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        Sustainable Fashion
                      </div>
                      <div className="text-[10px] text-gray-500">
                        High interest
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-green-600">
                    +28%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded" />
                    <div>
                      <div className="text-xs font-medium text-gray-900">
                        Athleisure
                      </div>
                      <div className="text-[10px] text-gray-500">
                        Steady growth
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-600">
                    +12%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
