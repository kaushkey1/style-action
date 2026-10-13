import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, EmptyState, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label } from '@/components/ui';
import { Search, Building2, Package, TrendingUp, Calendar, ChevronRight, ChevronLeft, Upload, ExternalLink } from 'lucide-react';
import { SectionHeader } from '@/components/ui';
import { MetricGrid, MetricCard } from '@/components/ui';
import { getCurrencySymbol } from '@/lib/utils';

// Mock curation data for table view
const mockCurations = [
  {
    id: 'Q938550002550BAWSS2026H5',
    brand: 'OUTRYT BY AZORTE',
    segment: 'WOMENS WEAR',
    family: 'WESTERN WEAR',
    fashionGrade: 'APL-Fashion',
    hit: 5,
    expectedRevenue: 45.2,
    options: 156,
    quantity: 245000,
    status: 'partial_costing',
    completionPercentage: 65,
    lastUpdated: '2 hours ago',
    totLink: 'https://docs.reliance.com/tot/outryt-azorte-womens-western-2026.pdf',
  },
  {
    id: 'Q189420002420BAWSS2026H6',
    brand: 'JOHN PLAYERS',
    segment: 'MENS WEAR',
    family: 'FORMAL WEAR',
    fashionGrade: 'APL-Fashion',
    hit: 6,
    expectedRevenue: 38.5,
    options: 142,
    quantity: 185000,
    status: 'pending_costing',
    completionPercentage: 0,
    lastUpdated: '1 day ago',
    totLink: 'https://docs.reliance.com/tot/john-players-mens-formal-2026.pdf',
  },
  {
    id: 'J674800002800ZAWSS2026H6',
    brand: 'LEE COOPER',
    segment: 'MENS CASUAL',
    family: 'CASUAL WEAR',
    fashionGrade: 'APL-Fashion',
    hit: 6,
    expectedRevenue: 52.3,
    options: 189,
    quantity: 320000,
    status: 'partial_costing',
    completionPercentage: 45,
    lastUpdated: '3 hours ago',
    totLink: 'https://docs.reliance.com/tot/lee-cooper-mens-casual-2026.pdf',
  },
  {
    id: 'J674560002560ZAWSS2026H6',
    brand: 'LEE COOPER',
    segment: 'KIDS WEAR',
    family: 'KIDS BOYS',
    fashionGrade: 'APL-Fashion',
    hit: 6,
    expectedRevenue: 68.7,
    options: 245,
    quantity: 420000,
    status: 'completed',
    completionPercentage: 100,
    lastUpdated: '5 hours ago',
    totLink: 'https://docs.reliance.com/tot/lee-cooper-kids-boys-2026.pdf',
  },
  {
    id: 'J674560002560ZAWSS202607',
    brand: 'LEE COOPER',
    segment: 'KIDS WEAR',
    family: 'KIDS BOYS',
    fashionGrade: 'APL-Fashion',
    hit: 7,
    expectedRevenue: 55.4,
    options: 7,
    quantity: 15000,
    status: 'partial_costing',
    completionPercentage: 80,
    lastUpdated: '6 hours ago',
    totLink: 'https://docs.reliance.com/tot/lee-cooper-kids-boys-2026.pdf',
  },
  {
    id: 'HA465500035508AWSS202607',
    brand: 'YOUSTA',
    segment: 'WOMENS WEAR',
    family: 'WESTERN WEAR',
    fashionGrade: 'APL-Fast Fashion',
    hit: 7,
    expectedRevenue: 3.8,
    options: 10,
    quantity: 28000,
    status: 'completed',
    completionPercentage: 100,
    lastUpdated: '1 day ago',
    totLink: 'https://docs.reliance.com/tot/yousta-womens-western-2026.pdf',
  },
  {
    id: 'F835560002561AWSS2026H6',
    brand: 'RIO GIRLS',
    segment: 'KIDS WEAR',
    family: 'YOUTH GIRLS',
    fashionGrade: 'APL-Fashion',
    hit: 6,
    expectedRevenue: 1.7,
    options: 14,
    quantity: 35000,
    status: 'pending_costing',
    completionPercentage: 0,
    lastUpdated: 'Just now',
    totLink: 'https://docs.reliance.com/tot/rio-girls-youth-2026.pdf',
  },
  {
    id: 'F137560004560ZAWSS2026H6',
    brand: 'INF FRENDZ',
    segment: 'KIDS WEAR',
    family: 'BOYS',
    fashionGrade: 'APL-Ultimate',
    hit: 6,
    expectedRevenue: 1.7,
    options: 15,
    quantity: 42000,
    status: 'completed',
    completionPercentage: 100,
    lastUpdated: '12 hours ago',
    totLink: 'https://docs.reliance.com/tot/inf-frendz-boys-2026.pdf',
  },
  {
    id: 'F137560002560AWSS2026H6',
    brand: 'INF FRENDZ',
    segment: 'KIDS WEAR',
    family: 'GIRLS',
    fashionGrade: 'APL-Fashion',
    hit: 6,
    expectedRevenue: 18.5,
    options: 2,
    quantity: 8500,
    status: 'partial_costing',
    completionPercentage: 55,
    lastUpdated: '4 hours ago',
    totLink: 'https://docs.reliance.com/tot/inf-frendz-girls-2026.pdf',
  },
  {
    id: 'Q938550002550AWSS2026H6',
    brand: 'OUTRYT BY AZORTE',
    segment: 'WOMENS WEAR',
    family: 'WESTERN WEAR',
    fashionGrade: 'APL-Fashion',
    hit: 6,
    expectedRevenue: 1.9,
    options: 32,
    quantity: 65000,
    status: 'completed',
    completionPercentage: 100,
    lastUpdated: '2 days ago',
    totLink: 'https://docs.reliance.com/tot/outryt-azorte-womens-western-2026.pdf',
  },
];

export function BrandListingPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterSegment, setFilterSegment] = useState<string>('all');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [filterHitMonth, setFilterHitMonth] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFormData, setUploadFormData] = useState({
    brand: '',
    segment: '',
    family: '',
    fashionGrade: '',
    hit: '',
  });
  const itemsPerPage = 10;

  const filteredPlans = mockCurations.filter(plan => {
    const matchesSearch = plan.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          plan.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = filterBrand === 'all' || plan.brand === filterBrand;
    const matchesSegment = filterSegment === 'all' || plan.segment === filterSegment;
    const matchesFamily = filterFamily === 'all' || plan.family === filterFamily;
    const matchesHitMonth = filterHitMonth === 'all' || `H${plan.hit}` === filterHitMonth;
    return matchesSearch && matchesBrand && matchesSegment && matchesFamily && matchesHitMonth;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPlans.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPlans = filteredPlans.slice(startIndex, endIndex);

  // Calculate overall metrics
  const totalPlans = mockCurations.length;
  const completedPlans = mockCurations.filter(p => p.status === 'completed').length;
  const partialCostingPlans = mockCurations.filter(p => p.status === 'partial_costing').length;
  const totalRevenue = mockCurations.reduce((sum, p) => sum + p.expectedRevenue, 0);



  const handleUploadSubmit = () => {
    // Validate form
    if (!uploadFormData.brand || !uploadFormData.segment || !uploadFormData.family ||
        !uploadFormData.fashionGrade || !uploadFormData.hit) {
      return;
    }

    // Navigate to the external brands page with the selected parameters
    const brandSlug = uploadFormData.brand.toLowerCase().replace(/\s+/g, '-');
    const segmentSlug = uploadFormData.segment.toLowerCase().replace(/\s+/g, '-');
    const familySlug = uploadFormData.family.toLowerCase().replace(/\s+/g, '-');

    navigate(`/vendor-catalog/${brandSlug}/${segmentSlug}/${familySlug}`, {
      state: {
        brand: uploadFormData.brand,
        segment: uploadFormData.segment,
        family: uploadFormData.family,
        fashionGrade: uploadFormData.fashionGrade,
        hitMonth: uploadFormData.hit,
        uploadMode: true,
      }
    });

    // Close dialog and reset form
    setShowUploadDialog(false);
    setUploadFormData({
      brand: '',
      segment: '',
      family: '',
      fashionGrade: '',
      hit: '',
    });
  };

  return (
    <div className="p-3">
      <PageHeader
        title="External Brands"
        backTo={{ label: 'Range Architecture', path: '/range' }}
      />

      {/* Metrics Overview */}
      <div className="mt-6">
        <MetricGrid>
          <MetricCard
            label="Total Curations"
            value={totalPlans.toString()}
            icon={Building2}
            iconColor="info"
          />
          <MetricCard
            label="Completed"
            value={completedPlans.toString()}
            icon={TrendingUp}
            iconColor="success"
            trend={`+12% from last month`}
          />
          <MetricCard
            label="In Progress"
            value={partialCostingPlans.toString()}
            icon={Package}
            iconColor="warning"
            trend={`-5% from last month`}
          />
          <MetricCard
            label="Expected Revenue"
            value={`${getCurrencySymbol()}${totalRevenue.toFixed(1)}Cr`}
            icon={Calendar}
            iconColor="info"
          />
        </MetricGrid>
      </div>

      {/* Filters and Search */}
      <div className="mt-6">
        <div className="flex items-center gap-2">
          <Select value={filterBrand} onValueChange={setFilterBrand}>
            <SelectTrigger className="w-[140px] h-8 text-gray-600 border-gray-300">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              <SelectItem value="OUTRYT BY AZORTE">OUTRYT BY AZORTE</SelectItem>
              <SelectItem value="JOHN PLAYERS">JOHN PLAYERS</SelectItem>
              <SelectItem value="LEE COOPER">LEE COOPER</SelectItem>
              <SelectItem value="YOUSTA">YOUSTA</SelectItem>
              <SelectItem value="RIO GIRLS">RIO GIRLS</SelectItem>
              <SelectItem value="INF FRENDZ">INF FRENDZ</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterSegment} onValueChange={setFilterSegment}>
            <SelectTrigger className="w-[140px] h-8 text-gray-600 border-gray-300">
              <SelectValue placeholder="All Segments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Segments</SelectItem>
              <SelectItem value="WOMENS WEAR">WOMENS WEAR</SelectItem>
              <SelectItem value="MENS WEAR">MENS WEAR</SelectItem>
              <SelectItem value="MENS CASUAL">MENS CASUAL</SelectItem>
              <SelectItem value="KIDS WEAR">KIDS WEAR</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterFamily} onValueChange={setFilterFamily}>
            <SelectTrigger className="w-[140px] h-8 text-gray-600 border-gray-300">
              <SelectValue placeholder="All Families" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Families</SelectItem>
              <SelectItem value="WESTERN WEAR">WESTERN WEAR</SelectItem>
              <SelectItem value="FORMAL WEAR">FORMAL WEAR</SelectItem>
              <SelectItem value="CASUAL WEAR">CASUAL WEAR</SelectItem>
              <SelectItem value="KIDS BOYS">KIDS BOYS</SelectItem>
              <SelectItem value="YOUTH GIRLS">YOUTH GIRLS</SelectItem>
              <SelectItem value="BOYS">BOYS</SelectItem>
              <SelectItem value="GIRLS">GIRLS</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterHitMonth} onValueChange={setFilterHitMonth}>
            <SelectTrigger className="w-[140px] h-8 text-gray-600 border-gray-300">
              <SelectValue placeholder="All Hit Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Hit Months</SelectItem>
              <SelectItem value="H5">H5</SelectItem>
              <SelectItem value="H6">H6</SelectItem>
              <SelectItem value="H7">H7</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search buy plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Catalog
          </Button>
        </div>
      </div>

      {/* Table View */}
      <div className="mt-6">
        <SectionHeader
          title={`External Brand Curations (${filteredPlans.length})`}
        />

        <Card className="mt-4 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">External Brand Range ID</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">Brand</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">Segment</th>
                  <th className="text-left p-3 text-xs font-medium text-gray-700 uppercase">Family</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-700 uppercase">Fashion Grade</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-700 uppercase">Hit</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-700 uppercase">Options</th>
                  <th className="text-right p-3 text-xs font-medium text-gray-700 uppercase">Quantity</th>
                  <th className="text-center p-3 text-xs font-medium text-gray-700 uppercase">ToT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentPlans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      // Navigate directly to the brand-segment-family view
                      const brandSlug = plan.brand.toLowerCase().replace(/\s+/g, '-');
                      const segmentSlug = plan.segment.toLowerCase().replace(/\s+/g, '-');
                      const familySlug = plan.family.toLowerCase().replace(/\s+/g, '-');
                      const hitMonth = `H${plan.hit}`;

                      // Pass the plan data through state
                      navigate(`/vendor-catalog/${brandSlug}/${segmentSlug}/${familySlug}`, {
                        state: {
                          brand: plan.brand,
                          segment: plan.segment,
                          family: plan.family,
                          hitMonth: hitMonth,
                          planId: plan.id,
                        }
                      });
                    }}
                  >
                    <td className="p-3">
                      <div className="text-sm font-medium text-gray-900">{plan.id}</div>
                      <div className="text-xs text-gray-500">{plan.lastUpdated}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-900">{plan.brand}</td>
                    <td className="p-3">
                      <span className="text-sm text-gray-900">{plan.segment}</span>
                    </td>
                    <td className="p-3 text-sm text-gray-900">{plan.family}</td>
                    <td className="p-3 text-center">
                      <span className="text-sm text-gray-900">
                        {plan.fashionGrade}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm text-gray-900">H{plan.hit}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-sm font-medium text-gray-900">{plan.options}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-sm font-medium text-gray-900">{(plan.quantity || 0).toLocaleString()}</span>
                    </td>
                    <td className="p-3 text-center">
                      <a
                        href={plan.totLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">View</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          { }
          {totalPages > 1 && (
            /* eslint-disable-next-line design-system/prefer-section-header -- pagination bar, not a section header */
            <div className="flex items-center justify-between border-t p-3">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredPlans.length)} of {filteredPlans.length} results
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      if (page === currentPage - 2 || page === currentPage + 2) return true;
                      return false;
                    })
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <Button
                          variant={page === currentPage ? 'primary' : 'ghost'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[32px]"
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredPlans.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No curations found"
              description="Try adjusting your search or filters"
            />
          )}
        </Card>
      </div>

      {/* Upload Catalog Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Catalog</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
              <Select
                value={uploadFormData.brand}
                onValueChange={(value) => setUploadFormData(prev => ({ ...prev, brand: value }))}
              >
                <SelectTrigger id="brand" className="mt-1">
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OUTRYT BY AZORTE">OUTRYT BY AZORTE</SelectItem>
                  <SelectItem value="JOHN PLAYERS">JOHN PLAYERS</SelectItem>
                  <SelectItem value="LEE COOPER">LEE COOPER</SelectItem>
                  <SelectItem value="YOUSTA">YOUSTA</SelectItem>
                  <SelectItem value="RIO GIRLS">RIO GIRLS</SelectItem>
                  <SelectItem value="INF FRENDZ">INF FRENDZ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="segment" className="text-sm font-medium">Segment</Label>
              <Select
                value={uploadFormData.segment}
                onValueChange={(value) => setUploadFormData(prev => ({ ...prev, segment: value }))}
              >
                <SelectTrigger id="segment" className="mt-1">
                  <SelectValue placeholder="Select segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MENS WEAR">Men's Wear</SelectItem>
                  <SelectItem value="WOMENS WEAR">Women's Wear</SelectItem>
                  <SelectItem value="KIDS WEAR">Kids Wear</SelectItem>
                  <SelectItem value="FOOTWEAR">Footwear</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="family" className="text-sm font-medium">Family</Label>
              <Select
                value={uploadFormData.family}
                onValueChange={(value) => setUploadFormData(prev => ({ ...prev, family: value }))}
              >
                <SelectTrigger id="family" className="mt-1">
                  <SelectValue placeholder="Select family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FORMAL WEAR">Formal Wear</SelectItem>
                  <SelectItem value="CASUAL WEAR">Casual Wear</SelectItem>
                  <SelectItem value="WESTERN WEAR">Western Wear</SelectItem>
                  <SelectItem value="BOTTOM WEAR">Bottom Wear</SelectItem>
                  <SelectItem value="KIDS BOYS">Kids Boys</SelectItem>
                  <SelectItem value="KIDS GIRLS">Kids Girls</SelectItem>
                  <SelectItem value="YOUTH GIRLS">Youth Girls</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fashionGrade" className="text-sm font-medium">Fashion Grade</Label>
              <Select
                value={uploadFormData.fashionGrade}
                onValueChange={(value) => setUploadFormData(prev => ({ ...prev, fashionGrade: value }))}
              >
                <SelectTrigger id="fashionGrade" className="mt-1">
                  <SelectValue placeholder="Select fashion grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APL-Core">APL-Core</SelectItem>
                  <SelectItem value="APL-Fashion">APL-Fashion</SelectItem>
                  <SelectItem value="APL-Ultimate">APL-Ultimate</SelectItem>
                  <SelectItem value="APL-Fast Fashion">APL-Fast Fashion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hit" className="text-sm font-medium">HIT Month</Label>
              <Select
                value={uploadFormData.hit}
                onValueChange={(value) => setUploadFormData(prev => ({ ...prev, hit: value }))}
              >
                <SelectTrigger id="hit" className="mt-1">
                  <SelectValue placeholder="Select HIT month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="H5">H5</SelectItem>
                  <SelectItem value="H6">H6</SelectItem>
                  <SelectItem value="H7">H7</SelectItem>
                  <SelectItem value="H8">H8</SelectItem>
                  <SelectItem value="H9">H9</SelectItem>
                  <SelectItem value="H10">H10</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUploadSubmit}
              disabled={!uploadFormData.brand || !uploadFormData.segment || !uploadFormData.family ||
                       !uploadFormData.fashionGrade || !uploadFormData.hit}
            >
              Continue to Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}