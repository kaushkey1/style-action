// ── Store Intelligence Mock Data ──
// Comprehensive mock data for the Store Intelligence module

import { CANONICAL_STORES } from '@/data/canonicalStores';
import type {
  Competitor,
  StoreCompetitorEntry,
  CompetitiveGapScore,
  CatchmentProfile,
  CrossFormatSignals,
  StoreDemandProfile,
  StoreCustomerProfile,
  StoreTwinAnalysis,
  StoreCluster,
  ClusterId,
  IntelligenceRecommendation,
  ReclassificationTrigger,
  StoreIntelligenceProfile,
  AopTwinReconciliation,
  BasketIntelligence,
  ReturnsIntelligence,
  DemandForecast,
  StoreDeepResearch,
} from '../types/storeIntelligence.types';

// ── 1. Competitors (30+ entries across major cities) ──

export const competitors: Competitor[] = [
  // Mumbai
  { id: 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', storeName: 'Westside Linking Road', brandChain: 'Tata (Westside)', tier: 'direct', latitude: 19.0650, longitude: 72.8325, estimatedSft: 8200, estimatedSpsf: 780, categoryFocus: ['womens-western', 'womens-ethnic', 'mens-casual'], pricePositioning: 'mid', vmQualityScore: 7, rating: 4.1, status: 'active', lastSurveyed: '2026-02-15' },
  { id: 'd2b3c4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', storeName: 'Max Bandra', brandChain: 'Landmark (Max)', tier: 'direct', latitude: 19.0596, longitude: 72.8295, estimatedSft: 6500, estimatedSpsf: 620, categoryFocus: ['mens-casual', 'womens-western', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 6, rating: 3.8, status: 'active', lastSurveyed: '2026-02-10' },
  { id: 'e3c4d5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', storeName: 'Zara Palladium', brandChain: 'Inditex (Zara)', tier: 'aspirational', latitude: 19.0044, longitude: 72.8317, estimatedSft: 12000, estimatedSpsf: 1450, categoryFocus: ['womens-western', 'mens-casual'], pricePositioning: 'premium', vmQualityScore: 9, rating: 4.5, status: 'active', lastSurveyed: '2026-01-20' },
  { id: 'f4d5e6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', storeName: 'H&M Linking Road', brandChain: 'H&M', tier: 'aspirational', latitude: 19.0631, longitude: 72.8302, estimatedSft: 10500, estimatedSpsf: 1120, categoryFocus: ['womens-western', 'mens-casual', 'kids-wear'], pricePositioning: 'mid', vmQualityScore: 8, rating: 4.3, status: 'active', lastSurveyed: '2026-02-01' },
  { id: 'a5e6f7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', storeName: 'V-Mart Khar', brandChain: 'V-Mart', tier: 'value', latitude: 19.0714, longitude: 72.8358, estimatedSft: 4200, estimatedSpsf: 380, categoryFocus: ['mens-casual', 'womens-ethnic', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 4, rating: 3.2, status: 'active', lastSurveyed: '2026-01-15' },
  { id: 'b6f7a8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', storeName: 'Pantaloons Lower Parel', brandChain: 'Aditya Birla (Pantaloons)', tier: 'direct', latitude: 19.0052, longitude: 72.8285, estimatedSft: 7800, estimatedSpsf: 710, categoryFocus: ['mens-casual', 'womens-western', 'womens-ethnic'], pricePositioning: 'mid', vmQualityScore: 6, rating: 3.9, status: 'active', lastSurveyed: '2026-02-12' },
  { id: 'c7a8b9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', storeName: 'Zudio Borivali', brandChain: 'Tata (Zudio)', tier: 'value', latitude: 19.2307, longitude: 72.8567, estimatedSft: 3500, estimatedSpsf: 520, categoryFocus: ['mens-casual', 'womens-western', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 5, rating: 3.6, status: 'active', lastSurveyed: '2026-02-05' },
  // Delhi
  { id: 'd8b9c0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', storeName: 'Shoppers Stop Select Citywalk', brandChain: 'Shoppers Stop', tier: 'direct', latitude: 28.5280, longitude: 77.2185, estimatedSft: 9500, estimatedSpsf: 820, categoryFocus: ['womens-western', 'mens-formal', 'womens-ethnic'], pricePositioning: 'mid', vmQualityScore: 7, rating: 4.2, status: 'active', lastSurveyed: '2026-02-18' },
  { id: 'e9c0d1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', storeName: 'Zara Select Citywalk', brandChain: 'Inditex (Zara)', tier: 'aspirational', latitude: 28.5292, longitude: 77.2192, estimatedSft: 11000, estimatedSpsf: 1380, categoryFocus: ['womens-western', 'mens-casual'], pricePositioning: 'premium', vmQualityScore: 9, rating: 4.4, status: 'active', lastSurveyed: '2026-01-25' },
  { id: 'f0d1e2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', storeName: 'Lifestyle GK-II', brandChain: 'Landmark (Lifestyle)', tier: 'direct', latitude: 28.5358, longitude: 77.2434, estimatedSft: 7200, estimatedSpsf: 690, categoryFocus: ['mens-casual', 'womens-western', 'kids-wear'], pricePositioning: 'mid', vmQualityScore: 6, rating: 3.7, status: 'active', lastSurveyed: '2026-02-08' },
  { id: 'a1e2f3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', storeName: 'FabIndia Khan Market', brandChain: 'FabIndia', tier: 'direct', latitude: 28.6005, longitude: 77.2275, estimatedSft: 3800, estimatedSpsf: 950, categoryFocus: ['womens-ethnic', 'mens-casual'], pricePositioning: 'premium', vmQualityScore: 8, rating: 4.3, status: 'active', lastSurveyed: '2026-01-30' },
  // Bangalore
  { id: 'b2f3a4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', storeName: 'Shoppers Stop UB City', brandChain: 'Shoppers Stop', tier: 'direct', latitude: 12.9720, longitude: 77.5960, estimatedSft: 8800, estimatedSpsf: 850, categoryFocus: ['womens-western', 'mens-formal', 'womens-ethnic'], pricePositioning: 'premium', vmQualityScore: 8, rating: 4.2, status: 'active', lastSurveyed: '2026-02-14' },
  { id: 'c3a4b5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', storeName: 'H&M Brigade Road', brandChain: 'H&M', tier: 'aspirational', latitude: 12.9724, longitude: 77.6076, estimatedSft: 9800, estimatedSpsf: 1050, categoryFocus: ['womens-western', 'mens-casual'], pricePositioning: 'mid', vmQualityScore: 8, rating: 4.1, status: 'active', lastSurveyed: '2026-02-03' },
  { id: 'd4b5c6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', storeName: 'Westside Forum Mall', brandChain: 'Tata (Westside)', tier: 'direct', latitude: 12.9344, longitude: 77.6115, estimatedSft: 7500, estimatedSpsf: 740, categoryFocus: ['womens-western', 'womens-ethnic', 'kids-wear'], pricePositioning: 'mid', vmQualityScore: 7, rating: 4.0, status: 'active', lastSurveyed: '2026-01-28' },
  // Chennai
  { id: 'e5c6d7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', storeName: 'Lifestyle Express Avenue', brandChain: 'Landmark (Lifestyle)', tier: 'direct', latitude: 13.0585, longitude: 80.2630, estimatedSft: 8500, estimatedSpsf: 720, categoryFocus: ['womens-western', 'womens-ethnic', 'kids-wear'], pricePositioning: 'mid', vmQualityScore: 7, rating: 4.0, status: 'active', lastSurveyed: '2026-02-16' },
  { id: 'f6d7e8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a', storeName: 'Max T. Nagar', brandChain: 'Landmark (Max)', tier: 'direct', latitude: 13.0418, longitude: 80.2337, estimatedSft: 5800, estimatedSpsf: 580, categoryFocus: ['mens-casual', 'womens-western', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 5, rating: 3.5, status: 'active', lastSurveyed: '2026-02-09' },
  { id: 'a7e8f9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b', storeName: 'Nalli Silks T. Nagar', brandChain: 'Nalli Silks', tier: 'direct', latitude: 13.0410, longitude: 80.2342, estimatedSft: 4500, estimatedSpsf: 1100, categoryFocus: ['womens-ethnic'], pricePositioning: 'premium', vmQualityScore: 7, rating: 4.6, status: 'active', lastSurveyed: '2026-01-22' },
  // Hyderabad
  { id: 'b8f9a0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c', storeName: 'Pantaloons Inorbit', brandChain: 'Aditya Birla (Pantaloons)', tier: 'direct', latitude: 17.4330, longitude: 78.3860, estimatedSft: 7200, estimatedSpsf: 660, categoryFocus: ['mens-casual', 'womens-western', 'kids-wear'], pricePositioning: 'mid', vmQualityScore: 6, rating: 3.8, status: 'active', lastSurveyed: '2026-02-11' },
  { id: 'c9a0b1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', storeName: 'Max Banjara Hills', brandChain: 'Landmark (Max)', tier: 'direct', latitude: 17.4156, longitude: 78.4485, estimatedSft: 6800, estimatedSpsf: 610, categoryFocus: ['mens-casual', 'womens-western', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 5, rating: 3.6, status: 'active', lastSurveyed: '2026-02-07' },
  { id: 'd0b1c2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e', storeName: 'Westside Jubilee Hills', brandChain: 'Tata (Westside)', tier: 'direct', latitude: 17.4315, longitude: 78.4073, estimatedSft: 7000, estimatedSpsf: 720, categoryFocus: ['womens-western', 'womens-ethnic'], pricePositioning: 'mid', vmQualityScore: 7, rating: 4.0, status: 'active', lastSurveyed: '2026-01-29' },
  // Pune
  { id: 'e1c2d3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', storeName: 'Shoppers Stop Phoenix', brandChain: 'Shoppers Stop', tier: 'direct', latitude: 18.5610, longitude: 73.9160, estimatedSft: 8200, estimatedSpsf: 780, categoryFocus: ['womens-western', 'mens-formal', 'womens-ethnic'], pricePositioning: 'mid', vmQualityScore: 7, rating: 4.1, status: 'active', lastSurveyed: '2026-02-13' },
  { id: 'f2d3e4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', storeName: 'Westside Aundh', brandChain: 'Tata (Westside)', tier: 'direct', latitude: 18.5575, longitude: 73.8072, estimatedSft: 6500, estimatedSpsf: 690, categoryFocus: ['womens-western', 'womens-ethnic', 'kids-wear'], pricePositioning: 'mid', vmQualityScore: 6, rating: 3.9, status: 'active', lastSurveyed: '2026-02-06' },
  { id: 'a3e4f5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', storeName: 'Zudio Kothrud', brandChain: 'Tata (Zudio)', tier: 'value', latitude: 18.5074, longitude: 73.8077, estimatedSft: 3200, estimatedSpsf: 490, categoryFocus: ['mens-casual', 'womens-western'], pricePositioning: 'entry', vmQualityScore: 5, rating: 3.4, status: 'active', lastSurveyed: '2026-01-18' },
  // Kolkata
  { id: 'b4f5a6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c', storeName: 'Pantaloons Park Street', brandChain: 'Aditya Birla (Pantaloons)', tier: 'direct', latitude: 22.5512, longitude: 88.3510, estimatedSft: 6800, estimatedSpsf: 580, categoryFocus: ['womens-ethnic', 'mens-casual', 'kids-wear'], pricePositioning: 'mid', vmQualityScore: 5, rating: 3.7, status: 'active', lastSurveyed: '2026-02-04' },
  { id: 'c5a6b7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d', storeName: 'Shoppers Stop South City', brandChain: 'Shoppers Stop', tier: 'direct', latitude: 22.5018, longitude: 88.3625, estimatedSft: 7500, estimatedSpsf: 650, categoryFocus: ['womens-western', 'womens-ethnic'], pricePositioning: 'mid', vmQualityScore: 6, rating: 3.9, status: 'active', lastSurveyed: '2026-01-26' },
  // Ahmedabad
  { id: 'd6b7c8e9-f0a1-4b2c-3d4e-5f6a7b8c9d0e', storeName: 'Westside CG Road', brandChain: 'Tata (Westside)', tier: 'direct', latitude: 23.0305, longitude: 72.5622, estimatedSft: 6200, estimatedSpsf: 650, categoryFocus: ['womens-western', 'womens-ethnic'], pricePositioning: 'mid', vmQualityScore: 6, rating: 3.8, status: 'active', lastSurveyed: '2026-02-17' },
  { id: 'e7c8d9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f', storeName: 'Max SG Highway', brandChain: 'Landmark (Max)', tier: 'direct', latitude: 23.0352, longitude: 72.5085, estimatedSft: 5800, estimatedSpsf: 540, categoryFocus: ['mens-casual', 'womens-western', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 5, rating: 3.5, status: 'active', lastSurveyed: '2026-02-02' },
  { id: 'f8d9e0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a', storeName: 'FabIndia Law Garden', brandChain: 'FabIndia', tier: 'direct', latitude: 23.0320, longitude: 72.5640, estimatedSft: 3000, estimatedSpsf: 880, categoryFocus: ['womens-ethnic', 'mens-casual'], pricePositioning: 'premium', vmQualityScore: 7, rating: 4.2, status: 'active', lastSurveyed: '2026-01-21' },
  // Jaipur
  { id: 'a9e0f1b2-c3d4-4e5f-6a7b-8c9d0e1f2a3b', storeName: 'Pantaloons WTP', brandChain: 'Aditya Birla (Pantaloons)', tier: 'direct', latitude: 26.8510, longitude: 75.8060, estimatedSft: 6500, estimatedSpsf: 520, categoryFocus: ['womens-ethnic', 'mens-casual', 'kids-wear'], pricePositioning: 'mid', vmQualityScore: 5, rating: 3.6, status: 'active', lastSurveyed: '2026-02-15' },
  { id: 'b0f1a2c3-d4e5-4f6a-7b8c-9d0e1f2a3b4c', storeName: 'V-Mart MI Road', brandChain: 'V-Mart', tier: 'value', latitude: 26.9124, longitude: 75.7873, estimatedSft: 3800, estimatedSpsf: 340, categoryFocus: ['mens-casual', 'womens-ethnic', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 3, rating: 2.9, status: 'active', lastSurveyed: '2026-01-12' },
  { id: 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5e', storeName: 'Zudio WTP', brandChain: 'Tata (Zudio)', tier: 'value', latitude: 26.8505, longitude: 75.8062, estimatedSft: 3000, estimatedSpsf: 480, categoryFocus: ['mens-casual', 'womens-western'], pricePositioning: 'entry', vmQualityScore: 5, rating: 3.5, status: 'active', lastSurveyed: '2026-02-08' },
  // Lucknow
  { id: 'd2b3c4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6f', storeName: 'Max Lulu Mall', brandChain: 'Landmark (Max)', tier: 'direct', latitude: 26.8088, longitude: 80.9245, estimatedSft: 6000, estimatedSpsf: 540, categoryFocus: ['mens-casual', 'womens-western', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 5, rating: 3.7, status: 'active', lastSurveyed: '2026-02-19' },
  { id: 'e3c4d5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7a', storeName: 'Pantaloons Hazratganj', brandChain: 'Aditya Birla (Pantaloons)', tier: 'direct', latitude: 26.8512, longitude: 80.9465, estimatedSft: 5500, estimatedSpsf: 490, categoryFocus: ['womens-ethnic', 'mens-casual'], pricePositioning: 'mid', vmQualityScore: 5, rating: 3.5, status: 'active', lastSurveyed: '2026-02-10' },
  { id: 'f4d5e6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8b', storeName: 'V-Mart Aminabad', brandChain: 'V-Mart', tier: 'value', latitude: 26.8525, longitude: 80.9358, estimatedSft: 3500, estimatedSpsf: 310, categoryFocus: ['mens-casual', 'womens-ethnic', 'kids-wear'], pricePositioning: 'entry', vmQualityScore: 3, rating: 2.8, status: 'active', lastSurveyed: '2026-01-14' },
];

// ── 2. Store-Competitor Mappings ──

export const storeCompetitorMappings: Record<string, StoreCompetitorEntry[]> = {
  'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d': [
    { competitorId: 'e3c4d5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', distanceMeters: 450, threatLevel: 'high' },
    { competitorId: 'b6f7a8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', distanceMeters: 600, threatLevel: 'high' },
    { competitorId: 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', distanceMeters: 1200, threatLevel: 'medium' },
    { competitorId: 'f4d5e6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', distanceMeters: 1500, threatLevel: 'medium' },
    { competitorId: 'a5e6f7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', distanceMeters: 1800, threatLevel: 'low' },
  ],
  'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b': [
    { competitorId: 'e9c0d1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', distanceMeters: 200, threatLevel: 'high' },
    { competitorId: 'd8b9c0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', distanceMeters: 350, threatLevel: 'high' },
    { competitorId: 'f0d1e2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', distanceMeters: 1100, threatLevel: 'medium' },
    { competitorId: 'a1e2f3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', distanceMeters: 1800, threatLevel: 'low' },
  ],
  '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42': [
    { competitorId: 'b2f3a4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', distanceMeters: 150, threatLevel: 'high' },
    { competitorId: 'c3a4b5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', distanceMeters: 800, threatLevel: 'medium' },
    { competitorId: 'd4b5c6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', distanceMeters: 1400, threatLevel: 'medium' },
  ],
  '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75': [
    { competitorId: 'e5c6d7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', distanceMeters: 200, threatLevel: 'high' },
    { competitorId: 'f6d7e8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a', distanceMeters: 900, threatLevel: 'medium' },
    { competitorId: 'a7e8f9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b', distanceMeters: 1000, threatLevel: 'medium' },
  ],
  'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97': [
    { competitorId: 'b8f9a0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c', distanceMeters: 300, threatLevel: 'high' },
    { competitorId: 'c9a0b1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', distanceMeters: 1200, threatLevel: 'medium' },
    { competitorId: 'd0b1c2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e', distanceMeters: 1500, threatLevel: 'medium' },
  ],
  '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a': [
    { competitorId: 'e1c2d3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', distanceMeters: 250, threatLevel: 'high' },
    { competitorId: 'f2d3e4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', distanceMeters: 1800, threatLevel: 'medium' },
    { competitorId: 'a3e4f5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', distanceMeters: 2000, threatLevel: 'low' },
  ],
  '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20': [
    { competitorId: 'b4f5a6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c', distanceMeters: 600, threatLevel: 'medium' },
    { competitorId: 'c5a6b7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d', distanceMeters: 1500, threatLevel: 'medium' },
  ],
  '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b': [
    { competitorId: 'd6b7c8e9-f0a1-4b2c-3d4e-5f6a7b8c9d0e', distanceMeters: 800, threatLevel: 'medium' },
    { competitorId: 'e7c8d9f0-a1b2-4c3d-4e5f-6a7b8c9d0e1f', distanceMeters: 1200, threatLevel: 'medium' },
    { competitorId: 'f8d9e0a1-b2c3-4d4e-5f6a-7b8c9d0e1f2a', distanceMeters: 900, threatLevel: 'low' },
  ],
  '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20': [
    { competitorId: 'a9e0f1b2-c3d4-4e5f-6a7b-8c9d0e1f2a3b', distanceMeters: 150, threatLevel: 'high' },
    { competitorId: 'b0f1a2c3-d4e5-4f6a-7b8c-9d0e1f2a3b4c', distanceMeters: 1800, threatLevel: 'low' },
    { competitorId: 'c1a2b3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5e', distanceMeters: 200, threatLevel: 'medium' },
  ],
  '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c': [
    { competitorId: 'd2b3c4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6f', distanceMeters: 200, threatLevel: 'high' },
    { competitorId: 'e3c4d5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7a', distanceMeters: 1500, threatLevel: 'medium' },
    { competitorId: 'f4d5e6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8b', distanceMeters: 1800, threatLevel: 'low' },
  ],
};

// ── 3. Competitive Gap Scores ──

const getComps = (storeId: string) => storeCompetitorMappings[storeId] || [];

export const competitiveGapScores: CompetitiveGapScore[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', overallScore: 62, dimensions: { optionBreadth: 58, priceLadder: 65, sizeAvailability: 55, newnessCadence: 68, vmDisplay: 62, digitalPresence: 64 }, gapBand: 'gap-exists', topGap: 'Size availability gap vs Zara (-9pp)', competitors: getComps('b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d') },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', overallScore: 74, dimensions: { optionBreadth: 72, priceLadder: 78, sizeAvailability: 70, newnessCadence: 76, vmDisplay: 74, digitalPresence: 74 }, gapBand: 'competitive', topGap: 'Newness cadence gap vs Zara Select Citywalk', competitors: getComps('b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b') },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', overallScore: 78, dimensions: { optionBreadth: 80, priceLadder: 82, sizeAvailability: 74, newnessCadence: 78, vmDisplay: 76, digitalPresence: 78 }, gapBand: 'competitive', topGap: 'VM display gap vs Shoppers Stop', competitors: getComps('5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42') },
  { storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', overallScore: 68, dimensions: { optionBreadth: 65, priceLadder: 72, sizeAvailability: 64, newnessCadence: 70, vmDisplay: 68, digitalPresence: 69 }, gapBand: 'competitive', topGap: 'Option breadth gap in women\'s ethnic vs Nalli', competitors: getComps('80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75') },
  { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', overallScore: 55, dimensions: { optionBreadth: 52, priceLadder: 58, sizeAvailability: 50, newnessCadence: 56, vmDisplay: 55, digitalPresence: 59 }, gapBand: 'gap-exists', topGap: 'Size availability gap across categories (-12pp vs Pantaloons)', competitors: getComps('a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97') },
  { storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', overallScore: 71, dimensions: { optionBreadth: 68, priceLadder: 74, sizeAvailability: 70, newnessCadence: 72, vmDisplay: 70, digitalPresence: 72 }, gapBand: 'competitive', topGap: 'Price ladder gap in premium segment', competitors: getComps('8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a') },
  { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', overallScore: 42, dimensions: { optionBreadth: 38, priceLadder: 45, sizeAvailability: 40, newnessCadence: 44, vmDisplay: 42, digitalPresence: 43 }, gapBand: 'at-risk', topGap: 'Overall option breadth deficit vs Pantaloons Park Street', competitors: getComps('3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20') },
  { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', overallScore: 65, dimensions: { optionBreadth: 62, priceLadder: 68, sizeAvailability: 60, newnessCadence: 66, vmDisplay: 65, digitalPresence: 69 }, gapBand: 'competitive', topGap: 'Newness cadence gap — slower refresh vs Westside CG Road', competitors: getComps('9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b') },
  { storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', overallScore: 74, dimensions: { optionBreadth: 72, priceLadder: 76, sizeAvailability: 72, newnessCadence: 74, vmDisplay: 74, digitalPresence: 76 }, gapBand: 'competitive', topGap: 'Minimal gaps — value positioning well-covered', competitors: getComps('3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20') },
  { storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', overallScore: 81, dimensions: { optionBreadth: 80, priceLadder: 82, sizeAvailability: 78, newnessCadence: 82, vmDisplay: 80, digitalPresence: 84 }, gapBand: 'leader', topGap: 'Leading in catchment — no critical gaps', competitors: getComps('2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c') },
];

// ── 4. Catchment Profiles ──

export const catchmentProfiles: CatchmentProfile[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', affluenceScore: 78, fashionForwardness: 82, familyIndex: 55, youthIndex: 71, destinationScore: 88, catchmentPopulation: 850000, estimatedApparelSpend: 420, currentMarketShare: 8.2 },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', affluenceScore: 81, fashionForwardness: 79, familyIndex: 60, youthIndex: 68, destinationScore: 90, catchmentPopulation: 920000, estimatedApparelSpend: 480, currentMarketShare: 7.5 },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', affluenceScore: 85, fashionForwardness: 86, familyIndex: 48, youthIndex: 75, destinationScore: 92, catchmentPopulation: 680000, estimatedApparelSpend: 380, currentMarketShare: 9.1 },
  { storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', affluenceScore: 66, fashionForwardness: 62, familyIndex: 72, youthIndex: 58, destinationScore: 78, catchmentPopulation: 750000, estimatedApparelSpend: 320, currentMarketShare: 6.8 },
  { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', affluenceScore: 62, fashionForwardness: 58, familyIndex: 68, youthIndex: 62, destinationScore: 72, catchmentPopulation: 620000, estimatedApparelSpend: 280, currentMarketShare: 5.4 },
  { storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', affluenceScore: 70, fashionForwardness: 72, familyIndex: 58, youthIndex: 70, destinationScore: 82, catchmentPopulation: 580000, estimatedApparelSpend: 310, currentMarketShare: 7.2 },
  { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', affluenceScore: 52, fashionForwardness: 48, familyIndex: 78, youthIndex: 45, destinationScore: 65, catchmentPopulation: 520000, estimatedApparelSpend: 220, currentMarketShare: 5.8 },
  { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', affluenceScore: 58, fashionForwardness: 55, familyIndex: 75, youthIndex: 52, destinationScore: 70, catchmentPopulation: 480000, estimatedApparelSpend: 240, currentMarketShare: 6.2 },
  { storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', affluenceScore: 45, fashionForwardness: 42, familyIndex: 82, youthIndex: 48, destinationScore: 62, catchmentPopulation: 420000, estimatedApparelSpend: 180, currentMarketShare: 5.1 },
  { storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', affluenceScore: 48, fashionForwardness: 44, familyIndex: 80, youthIndex: 50, destinationScore: 58, catchmentPopulation: 380000, estimatedApparelSpend: 160, currentMarketShare: 4.8 },
];

// ── 5. Cross-Format Signals ──

export const crossFormatSignals: CrossFormatSignals[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', smartBazaarPresent: true, smartBazaarDistance: 2.5, smartBazaarApparelAdjacentSales: 12.4, catchmentPotentialMultiplier: 1.15, ajioOrdersPerMonth: 4200, ajioTopCategory: 'womens-western', onlineDemandLeakage: 18, ajioRushEnabled: true, ajioRushOrdersPerMonth: 850, freshStoresNearby: 3 },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', smartBazaarPresent: false, catchmentPotentialMultiplier: 1.0, ajioOrdersPerMonth: 3800, ajioTopCategory: 'mens-casual', onlineDemandLeakage: 22, ajioRushEnabled: true, ajioRushOrdersPerMonth: 720, freshStoresNearby: 1 },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', smartBazaarPresent: false, catchmentPotentialMultiplier: 1.0, ajioOrdersPerMonth: 3200, ajioTopCategory: 'womens-western', onlineDemandLeakage: 20, ajioRushEnabled: true, ajioRushOrdersPerMonth: 580, freshStoresNearby: 2 },
  { storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', smartBazaarPresent: true, smartBazaarDistance: 1.8, smartBazaarApparelAdjacentSales: 8.5, catchmentPotentialMultiplier: 1.12, ajioOrdersPerMonth: 2400, ajioTopCategory: 'womens-ethnic', onlineDemandLeakage: 15, ajioRushEnabled: false, freshStoresNearby: 2 },
  { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', smartBazaarPresent: true, smartBazaarDistance: 3.2, smartBazaarApparelAdjacentSales: 6.2, catchmentPotentialMultiplier: 1.08, ajioOrdersPerMonth: 1800, ajioTopCategory: 'mens-casual', onlineDemandLeakage: 12, ajioRushEnabled: false, freshStoresNearby: 1 },
  { storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', smartBazaarPresent: true, smartBazaarDistance: 2.0, smartBazaarApparelAdjacentSales: 9.8, catchmentPotentialMultiplier: 1.10, ajioOrdersPerMonth: 2200, ajioTopCategory: 'womens-western', onlineDemandLeakage: 16, ajioRushEnabled: true, ajioRushOrdersPerMonth: 420, freshStoresNearby: 2 },
  { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', smartBazaarPresent: false, catchmentPotentialMultiplier: 1.0, ajioOrdersPerMonth: 1200, ajioTopCategory: 'womens-ethnic', onlineDemandLeakage: 10, ajioRushEnabled: false, freshStoresNearby: 0 },
  { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', smartBazaarPresent: true, smartBazaarDistance: 1.5, smartBazaarApparelAdjacentSales: 5.8, catchmentPotentialMultiplier: 1.06, ajioOrdersPerMonth: 1400, ajioTopCategory: 'womens-ethnic', onlineDemandLeakage: 11, ajioRushEnabled: false, freshStoresNearby: 1 },
  { storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', smartBazaarPresent: false, catchmentPotentialMultiplier: 1.0, ajioOrdersPerMonth: 900, ajioTopCategory: 'womens-ethnic', onlineDemandLeakage: 8, ajioRushEnabled: false, freshStoresNearby: 0 },
  { storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', smartBazaarPresent: true, smartBazaarDistance: 0.8, smartBazaarApparelAdjacentSales: 7.2, catchmentPotentialMultiplier: 1.18, ajioOrdersPerMonth: 1100, ajioTopCategory: 'mens-casual', onlineDemandLeakage: 9, ajioRushEnabled: false, freshStoresNearby: 2 },
];

// ── 6. Store Demand Profiles ──

const makeDemandProfile = (storeId: string, data: Partial<StoreDemandProfile>): StoreDemandProfile => ({
  storeId,
  categoryDemand: data.categoryDemand || [],
  priceAffinity: data.priceAffinity || { entry: 30, mid: 45, premium: 25, networkEntry: 35, networkMid: 42, networkPremium: 23 },
  sizeCurveHealth: data.sizeCurveHealth || [],
  newnessAbsorptionRate: data.newnessAbsorptionRate || 65,
  customerLoyaltyIndex: data.customerLoyaltyIndex || 55,
  basketDepthScore: data.basketDepthScore || 2.1,
  brandAffluenceScore: data.brandAffluenceScore || 2.0,
});

// ── Category → Segment/Family mapping ──
const CATEGORY_HIERARCHY: Record<string, { segment: string; family: string }> = {
  'mens-casual': { segment: 'Menswear Casual', family: 'Top Wear' },
  'mens-formal': { segment: 'Menswear Formal', family: 'Shirts' },
  'womens-ethnic': { segment: 'Womenswear Ethnic', family: 'Kurtas & Kurtis' },
  'womens-western': { segment: 'Womenswear Western', family: 'Tops & Tees' },
  'kids-wear': { segment: 'Kidswear', family: 'Boys Top Wear' },
};

const withHierarchy = (category: string) => ({
  segment: CATEGORY_HIERARCHY[category]?.segment ?? category,
  family: CATEGORY_HIERARCHY[category]?.family ?? category,
});

export const storeDemandProfiles: StoreDemandProfile[] = [
  makeDemandProfile('b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', {
    categoryDemand: [
      { category: 'mens-casual', ...withHierarchy('mens-casual'), salesIndex: 1.15, growthYoY: 12, lflGrowth: 8.5, lflGrowth2Y: 7.2, bestPeriod: { period: 'Nov 2025', revenue: 1420000, currentRevenue: 1180000, percentOfBest: 83, driver: 'Diwali + wedding season' }, sellThrough30: 72, gmrof: 425, demandSignal: 'strong' },
      { category: 'womens-ethnic', ...withHierarchy('womens-ethnic'), salesIndex: 1.32, growthYoY: 22, lflGrowth: 18.2, lflGrowth2Y: 14.5, bestPeriod: { period: 'Oct 2025', revenue: 1850000, currentRevenue: 1540000, percentOfBest: 83, driver: 'Navratri festival' }, sellThrough30: 78, gmrof: 485, demandSignal: 'very-strong' },
      { category: 'womens-western', ...withHierarchy('womens-western'), salesIndex: 1.28, growthYoY: 18, lflGrowth: 14.8, lflGrowth2Y: 12.1, bestPeriod: { period: 'Dec 2025', revenue: 1620000, currentRevenue: 1380000, percentOfBest: 85, driver: 'Year-end sales + New Year' }, sellThrough30: 75, gmrof: 465, demandSignal: 'very-strong' },
      { category: 'mens-formal', ...withHierarchy('mens-formal'), salesIndex: 0.85, growthYoY: -8, lflGrowth: -5.2, lflGrowth2Y: -3.1, bestPeriod: { period: 'Jan 2025', revenue: 680000, currentRevenue: 520000, percentOfBest: 76, driver: 'Interview season' }, sellThrough30: 58, gmrof: 310, demandSignal: 'declining' },
      { category: 'kids-wear', ...withHierarchy('kids-wear'), salesIndex: 0.92, growthYoY: 4, lflGrowth: 2.8, lflGrowth2Y: 3.5, bestPeriod: { period: 'Jun 2025', revenue: 580000, currentRevenue: 480000, percentOfBest: 83, driver: 'Summer vacation + back-to-school' }, sellThrough30: 62, gmrof: 345, demandSignal: 'stable' },
    ],
    priceAffinity: { entry: 18, mid: 42, premium: 40, networkEntry: 35, networkMid: 42, networkPremium: 23 },
    sizeCurveHealth: [
      { category: 'womens-western', sizeAccuracy: 82, topOosSize: 'M', lostSalesEstimate: 240000 },
      { category: 'mens-casual', sizeAccuracy: 88, topOosSize: 'L', lostSalesEstimate: 120000 },
    ],
    newnessAbsorptionRate: 78, customerLoyaltyIndex: 72, basketDepthScore: 2.8, brandAffluenceScore: 3.2,
  }),
  makeDemandProfile('b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', {
    categoryDemand: [
      { category: 'mens-casual', ...withHierarchy('mens-casual'), salesIndex: 1.22, growthYoY: 15, lflGrowth: 11.2, lflGrowth2Y: 9.8, bestPeriod: { period: 'Nov 2025', revenue: 1350000, currentRevenue: 1120000, percentOfBest: 83, driver: 'Diwali festive season' }, sellThrough30: 74, gmrof: 440, demandSignal: 'strong' },
      { category: 'mens-formal', ...withHierarchy('mens-formal'), salesIndex: 1.08, growthYoY: 5, lflGrowth: 3.5, lflGrowth2Y: 4.2, bestPeriod: { period: 'Feb 2025', revenue: 920000, currentRevenue: 780000, percentOfBest: 85, driver: 'Wedding + corporate season' }, sellThrough30: 65, gmrof: 380, demandSignal: 'stable' },
      { category: 'womens-western', ...withHierarchy('womens-western'), salesIndex: 1.18, growthYoY: 14, lflGrowth: 10.5, lflGrowth2Y: 9.2, bestPeriod: { period: 'Dec 2025', revenue: 1280000, currentRevenue: 1050000, percentOfBest: 82, driver: 'Year-end party season' }, sellThrough30: 71, gmrof: 420, demandSignal: 'strong' },
      { category: 'womens-ethnic', ...withHierarchy('womens-ethnic'), salesIndex: 0.95, growthYoY: 3, lflGrowth: 1.8, lflGrowth2Y: 2.5, bestPeriod: { period: 'Oct 2025', revenue: 780000, currentRevenue: 620000, percentOfBest: 79, driver: 'Karva Chauth + Dussehra' }, sellThrough30: 62, gmrof: 355, demandSignal: 'stable' },
      { category: 'kids-wear', ...withHierarchy('kids-wear'), salesIndex: 0.88, growthYoY: 2, lflGrowth: 0.5, lflGrowth2Y: 1.8, bestPeriod: { period: 'Jun 2025', revenue: 520000, currentRevenue: 420000, percentOfBest: 81, driver: 'Summer vacation' }, sellThrough30: 60, gmrof: 330, demandSignal: 'stable' },
    ],
    priceAffinity: { entry: 15, mid: 40, premium: 45, networkEntry: 35, networkMid: 42, networkPremium: 23 },
    sizeCurveHealth: [
      { category: 'mens-casual', sizeAccuracy: 90, topOosSize: 'XL', lostSalesEstimate: 95000 },
      { category: 'womens-western', sizeAccuracy: 85, topOosSize: 'S', lostSalesEstimate: 150000 },
    ],
    newnessAbsorptionRate: 75, customerLoyaltyIndex: 68, basketDepthScore: 2.6, brandAffluenceScore: 3.4,
  }),
  makeDemandProfile('5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', {
    categoryDemand: [
      { category: 'mens-formal', ...withHierarchy('mens-formal'), salesIndex: 1.25, growthYoY: 10, lflGrowth: 7.8, lflGrowth2Y: 6.5, bestPeriod: { period: 'Jan 2026', revenue: 1180000, currentRevenue: 980000, percentOfBest: 83, driver: 'Corporate hiring season' }, sellThrough30: 70, gmrof: 420, demandSignal: 'strong' },
      { category: 'womens-ethnic', ...withHierarchy('womens-ethnic'), salesIndex: 1.10, growthYoY: 8, lflGrowth: 6.2, lflGrowth2Y: 5.8, bestPeriod: { period: 'Oct 2025', revenue: 1050000, currentRevenue: 880000, percentOfBest: 84, driver: 'Dasara festival' }, sellThrough30: 68, gmrof: 400, demandSignal: 'strong' },
      { category: 'kids-wear', ...withHierarchy('kids-wear'), salesIndex: 1.05, growthYoY: 6, lflGrowth: 4.5, lflGrowth2Y: 4.0, bestPeriod: { period: 'Jun 2025', revenue: 620000, currentRevenue: 520000, percentOfBest: 84, driver: 'Summer break' }, sellThrough30: 65, gmrof: 375, demandSignal: 'stable' },
      { category: 'womens-western', ...withHierarchy('womens-western'), salesIndex: 1.15, growthYoY: 12, lflGrowth: 9.5, lflGrowth2Y: 8.2, bestPeriod: { period: 'Dec 2025', revenue: 980000, currentRevenue: 820000, percentOfBest: 84, driver: 'IT crowd + New Year parties' }, sellThrough30: 72, gmrof: 435, demandSignal: 'strong' },
      { category: 'mens-casual', ...withHierarchy('mens-casual'), salesIndex: 0.90, growthYoY: 2, lflGrowth: 0.8, lflGrowth2Y: 1.5, bestPeriod: { period: 'Nov 2025', revenue: 680000, currentRevenue: 560000, percentOfBest: 82, driver: 'Festive season' }, sellThrough30: 60, gmrof: 340, demandSignal: 'stable' },
    ],
    priceAffinity: { entry: 12, mid: 38, premium: 50, networkEntry: 35, networkMid: 42, networkPremium: 23 },
    sizeCurveHealth: [
      { category: 'mens-formal', sizeAccuracy: 92, topOosSize: '40', lostSalesEstimate: 80000 },
    ],
    newnessAbsorptionRate: 82, customerLoyaltyIndex: 75, basketDepthScore: 3.1, brandAffluenceScore: 3.6,
  }),
  // Simplified profiles for stores 4-10
  ...[
    { storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', baseIdx: 0.95, growth: 6, signal: 'stable' as const, absorption: 68, loyalty: 62, basket: 2.2, affluence: 2.4, entryPct: 28, midPct: 45, premPct: 27 },
    { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', baseIdx: 0.88, growth: 4, signal: 'stable' as const, absorption: 60, loyalty: 55, basket: 1.9, affluence: 2.0, entryPct: 35, midPct: 42, premPct: 23 },
    { storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', baseIdx: 1.02, growth: 8, signal: 'strong' as const, absorption: 72, loyalty: 65, basket: 2.4, affluence: 2.6, entryPct: 25, midPct: 45, premPct: 30 },
    { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', baseIdx: 0.78, growth: -2, signal: 'weak' as const, absorption: 55, loyalty: 48, basket: 1.8, affluence: 1.8, entryPct: 42, midPct: 40, premPct: 18 },
    { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', baseIdx: 0.85, growth: 3, signal: 'stable' as const, absorption: 62, loyalty: 52, basket: 2.0, affluence: 2.2, entryPct: 38, midPct: 42, premPct: 20 },
    { storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', baseIdx: 0.82, growth: 2, signal: 'stable' as const, absorption: 58, loyalty: 45, basket: 1.7, affluence: 1.6, entryPct: 48, midPct: 38, premPct: 14 },
    { storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', baseIdx: 0.90, growth: 5, signal: 'stable' as const, absorption: 64, loyalty: 50, basket: 1.9, affluence: 1.8, entryPct: 45, midPct: 40, premPct: 15 },
  ].map((cfg) => makeDemandProfile(cfg.storeId, {
    categoryDemand: ['mens-casual', 'womens-ethnic', 'womens-western', 'mens-formal', 'kids-wear'].map((cat) => ({
      category: cat,
      ...withHierarchy(cat),
      salesIndex: cfg.baseIdx + (Math.random() * 0.3 - 0.15),
      growthYoY: cfg.growth + Math.floor(Math.random() * 6 - 3),
      lflGrowth: cfg.growth * 0.75,
      lflGrowth2Y: cfg.growth * 0.6,
      bestPeriod: { period: 'Nov 2025', revenue: 800000 + Math.floor(Math.random() * 400000), currentRevenue: 600000 + Math.floor(Math.random() * 300000), percentOfBest: 78 + Math.floor(Math.random() * 10), driver: 'Festive season' },
      sellThrough30: 55 + Math.floor(Math.random() * 20),
      gmrof: 280 + Math.floor(Math.random() * 150),
      demandSignal: cfg.signal,
    })),
    priceAffinity: { entry: cfg.entryPct, mid: cfg.midPct, premium: cfg.premPct, networkEntry: 35, networkMid: 42, networkPremium: 23 },
    sizeCurveHealth: [{ category: 'womens-ethnic', sizeAccuracy: 78 + Math.floor(Math.random() * 12), topOosSize: 'M', lostSalesEstimate: 80000 + Math.floor(Math.random() * 100000) }],
    newnessAbsorptionRate: cfg.absorption,
    customerLoyaltyIndex: cfg.loyalty,
    basketDepthScore: cfg.basket,
    brandAffluenceScore: cfg.affluence,
  })),
];

// ── 7. Store Customer Profiles ──

const makeCustomerProfile = (storeId: string, weights: [number, number, number, number, number], health: Partial<StoreCustomerProfile['health']>): StoreCustomerProfile => ({
  storeId,
  personas: [
    { name: 'Budget Family', customerPercent: weights[0], revenuePercent: weights[0] * 0.7, avgBasket: 1200 + (weights[0] * 10), visitFrequency: 1.5, brandAffluence: 1, keyCategories: ['kids-wear', 'womens-ethnic'] },
    { name: 'Young Professional', customerPercent: weights[1], revenuePercent: weights[1] * 1.2, avgBasket: 2800 + (weights[1] * 20), visitFrequency: 2.5, brandAffluence: 3, keyCategories: ['mens-casual', 'womens-western'] },
    { name: 'Fashion Forward', customerPercent: weights[2], revenuePercent: weights[2] * 1.5, avgBasket: 4200 + (weights[2] * 30), visitFrequency: 3.0, brandAffluence: 4, keyCategories: ['womens-western', 'mens-casual'] },
    { name: 'Premium Loyalist', customerPercent: weights[3], revenuePercent: weights[3] * 1.8, avgBasket: 5500 + (weights[3] * 40), visitFrequency: 2.0, brandAffluence: 4, keyCategories: ['mens-formal', 'womens-ethnic'] },
    { name: 'Occasional Shopper', customerPercent: weights[4], revenuePercent: weights[4] * 0.5, avgBasket: 1800 + (weights[4] * 15), visitFrequency: 0.5, brandAffluence: 2, keyCategories: ['mens-casual', 'kids-wear'] },
  ],
  health: {
    activeCustomers90Day: health.activeCustomers90Day || 5000,
    vsGradeAvg: health.vsGradeAvg || 100,
    newCustomerRate: health.newCustomerRate || 12,
    repeatRate: health.repeatRate || 45,
    churnRate180Day: health.churnRate180Day || 18,
  },
});

export const storeCustomerProfiles: StoreCustomerProfile[] = [
  makeCustomerProfile('b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', [15, 28, 22, 18, 17], { activeCustomers90Day: 12500, vsGradeAvg: 112, newCustomerRate: 15, repeatRate: 58, churnRate180Day: 12 }),
  makeCustomerProfile('b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', [12, 30, 20, 22, 16], { activeCustomers90Day: 11800, vsGradeAvg: 108, newCustomerRate: 14, repeatRate: 55, churnRate180Day: 13 }),
  makeCustomerProfile('5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', [10, 25, 25, 25, 15], { activeCustomers90Day: 10200, vsGradeAvg: 105, newCustomerRate: 16, repeatRate: 60, churnRate180Day: 11 }),
  makeCustomerProfile('80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', [22, 22, 18, 15, 23], { activeCustomers90Day: 8500, vsGradeAvg: 98, newCustomerRate: 12, repeatRate: 48, churnRate180Day: 16 }),
  makeCustomerProfile('a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', [25, 20, 15, 12, 28], { activeCustomers90Day: 7200, vsGradeAvg: 92, newCustomerRate: 10, repeatRate: 42, churnRate180Day: 20 }),
  makeCustomerProfile('8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', [18, 26, 20, 16, 20], { activeCustomers90Day: 7800, vsGradeAvg: 102, newCustomerRate: 13, repeatRate: 50, churnRate180Day: 15 }),
  makeCustomerProfile('3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', [30, 18, 12, 10, 30], { activeCustomers90Day: 5800, vsGradeAvg: 88, newCustomerRate: 8, repeatRate: 38, churnRate180Day: 24 }),
  makeCustomerProfile('9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', [28, 20, 14, 12, 26], { activeCustomers90Day: 6200, vsGradeAvg: 94, newCustomerRate: 9, repeatRate: 40, churnRate180Day: 22 }),
  makeCustomerProfile('3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', [35, 15, 10, 8, 32], { activeCustomers90Day: 4800, vsGradeAvg: 85, newCustomerRate: 7, repeatRate: 35, churnRate180Day: 26 }),
  makeCustomerProfile('2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', [32, 16, 12, 10, 30], { activeCustomers90Day: 5200, vsGradeAvg: 90, newCustomerRate: 8, repeatRate: 37, churnRate180Day: 25 }),
];

// ── 8. Store Twin Analyses ──

const makeTwinAnalysis = (storeId: string, severity: 'critical' | 'high' | 'medium' | 'low', uplift: number, margin: number, metrics: [number, number][]): StoreTwinAnalysis => {
  const m = (i: number): [number, number] => metrics[i] ?? [0, 0];
  const gap = (i: number) => m(i)[1] - m(i)[0];
  const gapPct = (i: number) => Math.round((gap(i) / m(i)[0]) * 100);
  return {
    storeId,
    metrics: [
      { metric: 'SPSF', currentValue: m(0)[0], twinValue: m(0)[1], gap: gap(0), gapPercent: gapPct(0), unit: '₹', priority: gap(0) > 100 ? 'critical' : 'medium' },
      { metric: 'GMROF', currentValue: m(1)[0], twinValue: m(1)[1], gap: gap(1), gapPercent: gapPct(1), unit: '₹/SFT', priority: 'medium' },
      { metric: 'ASP', currentValue: m(2)[0], twinValue: m(2)[1], gap: gap(2), gapPercent: gapPct(2), unit: '₹', priority: 'low' },
      { metric: 'Option Count', currentValue: m(3)[0], twinValue: m(3)[1], gap: gap(3), gapPercent: gapPct(3), unit: 'options', priority: 'medium' },
      { metric: 'Fill Rate', currentValue: m(4)[0], twinValue: m(4)[1], gap: gap(4), gapPercent: gapPct(4), unit: '%', priority: 'high' },
      { metric: 'Sell-Through %', currentValue: m(5)[0], twinValue: m(5)[1], gap: gap(5), gapPercent: gapPct(5), unit: '%', priority: 'medium' },
      { metric: 'Fashion Mix', currentValue: m(6)[0], twinValue: m(6)[1], gap: gap(6), gapPercent: gapPct(6), unit: '%', priority: 'low' },
      { metric: 'Size Accuracy', currentValue: m(7)[0], twinValue: m(7)[1], gap: gap(7), gapPercent: gapPct(7), unit: '%', priority: 'high' },
      { metric: 'Newness Rate', currentValue: m(8)[0], twinValue: m(8)[1], gap: gap(8), gapPercent: gapPct(8), unit: '%', priority: 'low' },
      { metric: 'Basket Size', currentValue: m(9)[0], twinValue: m(9)[1], gap: +gap(9).toFixed(1), gapPercent: gapPct(9), unit: '×', priority: 'medium' },
    ],
    revenueUpliftMonthly: uplift,
    marginImprovementAnnual: margin,
    overallGapSeverity: severity,
  };
};

export const storeTwinAnalyses: StoreTwinAnalysis[] = [
  makeTwinAnalysis('b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', 'high', 580000, 4200000, [[825, 950], [371, 420], [1050, 1150], [1245, 1100], [83, 91], [68, 78], [24, 28], [82, 91], [72, 80], [2.8, 3.2]]),
  makeTwinAnalysis('b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', 'medium', 320000, 2400000, [[890, 952], [385, 415], [1080, 1140], [1180, 1050], [85, 90], [70, 76], [25, 28], [85, 90], [75, 80], [2.6, 3.0]]),
  makeTwinAnalysis('5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', 'medium', 240000, 1800000, [[920, 968], [395, 425], [1200, 1280], [1050, 980], [87, 92], [72, 78], [28, 30], [88, 93], [82, 85], [3.1, 3.4]]),
  makeTwinAnalysis('80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', 'high', 380000, 2800000, [[720, 815], [340, 385], [880, 960], [920, 820], [80, 88], [64, 74], [20, 24], [78, 88], [68, 76], [2.2, 2.6]]),
  makeTwinAnalysis('a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', 'critical', 520000, 3600000, [[680, 860], [310, 380], [820, 920], [880, 780], [76, 86], [60, 72], [18, 24], [74, 86], [60, 72], [1.9, 2.4]]),
  makeTwinAnalysis('8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', 'medium', 280000, 2000000, [[750, 822], [355, 395], [920, 990], [850, 780], [82, 89], [66, 74], [22, 26], [80, 88], [72, 78], [2.4, 2.8]]),
  makeTwinAnalysis('3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', 'critical', 620000, 4800000, [[580, 790], [280, 360], [720, 840], [750, 650], [72, 84], [55, 68], [16, 22], [70, 82], [55, 68], [1.8, 2.4]]),
  makeTwinAnalysis('9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', 'high', 420000, 3200000, [[640, 780], [300, 370], [780, 880], [720, 640], [75, 85], [58, 70], [18, 24], [72, 84], [62, 72], [2.0, 2.5]]),
  makeTwinAnalysis('3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', 'medium', 250000, 1600000, [[520, 605], [245, 295], [650, 740], [650, 580], [78, 86], [62, 70], [14, 18], [76, 84], [58, 66], [1.7, 2.1]]),
  makeTwinAnalysis('2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', 'medium', 180000, 1200000, [[540, 595], [255, 300], [620, 700], [620, 560], [80, 87], [64, 72], [15, 20], [78, 85], [64, 70], [1.9, 2.2]]),
];

// ── 9. Store Clusters ──

export const storeClusters: StoreCluster[] = [
  { id: 'C1', label: 'Metro Fashion Hub', profile: 'High-traffic metro malls with strong fashion forward customer base', storeCount: 120, avgSpsf: 892, avgCompetitiveGap: 71, avgAffluence: 76, avgFashionPercent: 28, avgAsp: 1050, competitiveIntensity: 'high', typicalGrades: ['A+', 'A1'], keyCharacteristic: 'High competition, fashion-forward, premium ASP' },
  { id: 'C2', label: 'Metro Value', profile: 'Metro locations with value-conscious, family-oriented customer base', storeCount: 180, avgSpsf: 748, avgCompetitiveGap: 62, avgAffluence: 65, avgFashionPercent: 22, avgAsp: 780, competitiveIntensity: 'high', typicalGrades: ['A1', 'A2'], keyCharacteristic: 'Metro presence, value-driven, broad appeal' },
  { id: 'C3', label: 'Suburban Family', profile: 'Suburban mall anchors serving family shopping occasions', storeCount: 250, avgSpsf: 612, avgCompetitiveGap: 58, avgAffluence: 55, avgFashionPercent: 20, avgAsp: 720, competitiveIntensity: 'low', typicalGrades: ['A2', 'B1'], keyCharacteristic: 'Family destination, ethnic strong, moderate competition' },
  { id: 'C4', label: 'Tier-2 Aspirational', profile: 'Tier-2 city stores with upwardly mobile, aspirational customers', storeCount: 300, avgSpsf: 534, avgCompetitiveGap: 55, avgAffluence: 52, avgFashionPercent: 24, avgAsp: 680, competitiveIntensity: 'medium', typicalGrades: ['A2', 'B1'], keyCharacteristic: 'Aspirational demand, growing market, brand-building opportunity' },
  { id: 'C5', label: 'Tier-2/3 Value', profile: 'Value-oriented stores in smaller cities', storeCount: 350, avgSpsf: 398, avgCompetitiveGap: 72, avgAffluence: 42, avgFashionPercent: 18, avgAsp: 550, competitiveIntensity: 'low', typicalGrades: ['B1', 'B2'], keyCharacteristic: 'Value-first, ethnic-heavy, limited fashion appetite' },
  { id: 'C6', label: 'High-Street Premium', profile: 'High-street locations with premium positioning', storeCount: 80, avgSpsf: 945, avgCompetitiveGap: 78, avgAffluence: 82, avgFashionPercent: 30, avgAsp: 1200, competitiveIntensity: 'high', typicalGrades: ['A+'], keyCharacteristic: 'Flagship potential, premium-dominant, high VM standards' },
  { id: 'C7', label: 'SmartBazaar Adjacent', profile: 'Stores near SmartBazaar with cross-format synergy', storeCount: 200, avgSpsf: 588, avgCompetitiveGap: 68, avgAffluence: 48, avgFashionPercent: 22, avgAsp: 650, competitiveIntensity: 'medium', typicalGrades: ['A2', 'B1'], keyCharacteristic: 'Cross-format traffic, value-mid mix, grocery-driven footfall' },
  { id: 'C8', label: 'Standalone Tier-3', profile: 'Standalone stores in Tier-3 cities with limited competition', storeCount: 410, avgSpsf: 372, avgCompetitiveGap: 82, avgAffluence: 38, avgFashionPercent: 16, avgAsp: 480, competitiveIntensity: 'very-low', typicalGrades: ['B2', 'C1'], keyCharacteristic: 'Market creator, basics-heavy, low competition' },
];

// ── 10. Store-Cluster Assignments ──

export const storeClusterAssignments: Record<string, ClusterId> = {
  'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d': 'C1',
  'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b': 'C1',
  '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42': 'C6',
  '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75': 'C2',
  'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97': 'C4',
  '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a': 'C2',
  '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20': 'C3',
  '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b': 'C4',
  '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20': 'C5',
  '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c': 'C7',
};

// ── 10b. AOP vs Twin Reconciliation ──

export const aopReconciliations: Record<string, AopTwinReconciliation> = {
  'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d': {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹72 L', twinRecommendation: '₹85 L', gap: '+₹13 L', explanation: 'Catchment affluence 78 supports higher inventory depth' },
      { metric: 'WW Mix', aopTarget: '22%', twinRecommendation: '30%', gap: '+8pp', explanation: 'Competitive gap vs Zara + demand index 1.28' },
      { metric: 'Avg MRP', aopTarget: '₹950', twinRecommendation: '₹1,100', gap: '+₹150', explanation: 'Affluence score 78 + competitor ASPs justify premium' },
      { metric: 'Option Count', aopTarget: '800', twinRecommendation: '680', gap: '-120', explanation: 'Fewer options, deeper inventory per option improves sell-through' },
      { metric: 'Fashion %', aopTarget: '23%', twinRecommendation: '28%', gap: '+5pp', explanation: 'Fashion Forward score 82 supports higher fashion mix' },
    ],
  },
  'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b': {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹68 L', twinRecommendation: '₹78 L', gap: '+₹10 L', explanation: 'Premium catchment in South Delhi supports deeper buys' },
      { metric: 'WW Mix', aopTarget: '24%', twinRecommendation: '28%', gap: '+4pp', explanation: 'Youth index 68 + IT professional persona drives WW' },
      { metric: 'Avg MRP', aopTarget: '₹1,050', twinRecommendation: '₹1,200', gap: '+₹150', explanation: 'Select Citywalk premium positioning + Zara adjacency' },
      { metric: 'Option Count', aopTarget: '750', twinRecommendation: '720', gap: '-30', explanation: 'Slight reduction for deeper buys on winning styles' },
      { metric: 'Fashion %', aopTarget: '25%', twinRecommendation: '30%', gap: '+5pp', explanation: 'Fashion Forward 79 + Delhi trend-consciousness' },
    ],
  },
  '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42': {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹65 L', twinRecommendation: '₹75 L', gap: '+₹10 L', explanation: 'UB City premium positioning warrants higher investment' },
      { metric: 'WW Mix', aopTarget: '20%', twinRecommendation: '26%', gap: '+6pp', explanation: 'IT crowd demand index 1.15 + youth index 75' },
      { metric: 'Avg MRP', aopTarget: '₹1,100', twinRecommendation: '₹1,250', gap: '+₹150', explanation: 'Affluence 85 — highest in network justifies premium' },
      { metric: 'Option Count', aopTarget: '700', twinRecommendation: '650', gap: '-50', explanation: 'Curated assortment for premium customer base' },
      { metric: 'Fashion %', aopTarget: '26%', twinRecommendation: '32%', gap: '+6pp', explanation: 'Fashion Forward 86 — strongest trend-forward catchment' },
    ],
  },
  '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75': {
    storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹55 L', twinRecommendation: '₹52 L', gap: '-₹3 L', explanation: 'Moderate catchment — optimize existing inventory first' },
      { metric: 'WW Mix', aopTarget: '18%', twinRecommendation: '15%', gap: '-3pp', explanation: 'Ethnic-dominant catchment; shift allocation to WIW' },
      { metric: 'Avg MRP', aopTarget: '₹850', twinRecommendation: '₹780', gap: '-₹70', explanation: 'Affluence 66 suggests value positioning preference' },
      { metric: 'Option Count', aopTarget: '680', twinRecommendation: '720', gap: '+40', explanation: 'Broader ethnic options needed to compete with Nalli' },
      { metric: 'Fashion %', aopTarget: '20%', twinRecommendation: '18%', gap: '-2pp', explanation: 'Fashion Forward 62 — basics and ethnic core perform better' },
    ],
  },
  'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97': {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹48 L', twinRecommendation: '₹58 L', gap: '+₹10 L', explanation: 'Size availability gaps indicate understocking' },
      { metric: 'WW Mix', aopTarget: '16%', twinRecommendation: '14%', gap: '-2pp', explanation: 'Ethnic-leaning catchment favors WIW expansion' },
      { metric: 'Avg MRP', aopTarget: '₹780', twinRecommendation: '₹720', gap: '-₹60', explanation: 'Affluence 62 + value competition from Pantaloons/Max' },
      { metric: 'Option Count', aopTarget: '620', twinRecommendation: '700', gap: '+80', explanation: 'Need broader options to address size availability gap' },
      { metric: 'Fashion %', aopTarget: '18%', twinRecommendation: '15%', gap: '-3pp', explanation: 'Fashion Forward 58 — basics-first strategy performs better' },
    ],
  },
  '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a': {
    storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹58 L', twinRecommendation: '₹65 L', gap: '+₹7 L', explanation: 'SmartBazaar adjacency drives incremental traffic' },
      { metric: 'WW Mix', aopTarget: '20%', twinRecommendation: '24%', gap: '+4pp', explanation: 'Youth index 70 supports western category growth' },
      { metric: 'Avg MRP', aopTarget: '₹900', twinRecommendation: '₹950', gap: '+₹50', explanation: 'Affluence 70 + premium segment gap opportunity' },
      { metric: 'Option Count', aopTarget: '720', twinRecommendation: '680', gap: '-40', explanation: 'Deeper buys on proven styles vs breadth play' },
      { metric: 'Fashion %', aopTarget: '22%', twinRecommendation: '25%', gap: '+3pp', explanation: 'Fashion Forward 72 supports moderate fashion increase' },
    ],
  },
  '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20': {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹42 L', twinRecommendation: '₹55 L', gap: '+₹13 L', explanation: 'Currently significantly understocked vs potential' },
      { metric: 'WW Mix', aopTarget: '15%', twinRecommendation: '12%', gap: '-3pp', explanation: 'Family-dominant catchment; shift to KW + ethnic' },
      { metric: 'Avg MRP', aopTarget: '₹720', twinRecommendation: '₹650', gap: '-₹70', explanation: 'Affluence 52 — value-first positioning needed' },
      { metric: 'Option Count', aopTarget: '550', twinRecommendation: '730', gap: '+180', explanation: 'Critical option breadth gap vs Pantaloons (-180 options)' },
      { metric: 'Fashion %', aopTarget: '15%', twinRecommendation: '12%', gap: '-3pp', explanation: 'Fashion Forward 48 — basics-heavy assortment recommended' },
    ],
  },
  '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b': {
    storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹50 L', twinRecommendation: '₹54 L', gap: '+₹4 L', explanation: 'Moderate uplift to support newness cadence improvement' },
      { metric: 'WW Mix', aopTarget: '19%', twinRecommendation: '21%', gap: '+2pp', explanation: 'Moderate WW growth supported by catchment profile' },
      { metric: 'Avg MRP', aopTarget: '₹820', twinRecommendation: '₹850', gap: '+₹30', explanation: 'Slight premium push based on FabIndia adjacency effect' },
      { metric: 'Option Count', aopTarget: '650', twinRecommendation: '680', gap: '+30', explanation: 'Incremental options to improve newness rate' },
      { metric: 'Fashion %', aopTarget: '18%', twinRecommendation: '20%', gap: '+2pp', explanation: 'Fashion Forward 55 — moderate fashion increase' },
    ],
  },
  '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20': {
    storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹38 L', twinRecommendation: '₹42 L', gap: '+₹4 L', explanation: 'Wedding season peak drives ethnic inventory need' },
      { metric: 'WW Mix', aopTarget: '14%', twinRecommendation: '10%', gap: '-4pp', explanation: 'Strong ethnic-first market; reduce WW for ethnic depth' },
      { metric: 'Avg MRP', aopTarget: '₹680', twinRecommendation: '₹620', gap: '-₹60', explanation: 'Affluence 45 — value positioning is key to volume' },
      { metric: 'Option Count', aopTarget: '580', twinRecommendation: '620', gap: '+40', explanation: 'Broader ethnic range for wedding + festival seasons' },
      { metric: 'Fashion %', aopTarget: '14%', twinRecommendation: '10%', gap: '-4pp', explanation: 'Fashion Forward 42 — basics and ethnic core dominate' },
    ],
  },
  '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c': {
    storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c',
    items: [
      { metric: 'Total Inventory', aopTarget: '₹35 L', twinRecommendation: '₹40 L', gap: '+₹5 L', explanation: 'SmartBazaar cross-traffic (1.18x multiplier) supports uplift' },
      { metric: 'WW Mix', aopTarget: '12%', twinRecommendation: '10%', gap: '-2pp', explanation: 'Value-seeking catchment; shift to mens-casual depth' },
      { metric: 'Avg MRP', aopTarget: '₹650', twinRecommendation: '₹580', gap: '-₹70', explanation: 'Affluence 48 — entry-price depth drives conversion' },
      { metric: 'Option Count', aopTarget: '520', twinRecommendation: '560', gap: '+40', explanation: 'Cross-format traffic needs broader entry-level range' },
      { metric: 'Fashion %', aopTarget: '12%', twinRecommendation: '10%', gap: '-2pp', explanation: 'Fashion Forward 44 — basics dominate, minimal fashion risk' },
    ],
  },
};

// ── 11. Intelligence Recommendations ──

export const intelligenceRecommendations: IntelligenceRecommendation[] = [
  { id: 'rec-001', type: 'category-expansion', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Mumbai - Phoenix Mall', title: 'Expand Women\'s Western allocation', evidence: ['Demand Index: 1.28 (over-indexes vs network)', 'Growth: +18% YoY (fastest growing)', 'Competitive Gap: -140 options vs Zara', 'Catchment: Affluence 78, Youth 71'], action: 'Increase WW from 22% to 30% of store SFT', source: 'Contract Mens Formal from 14% to 8%', impactSpsf: 18, impactGmrof: 22, impactRevenueMonthly: 210000, severity: 'high', status: 'pending', createdAt: '2026-02-28T10:00:00Z', handoffState: 'available', aiRationale: 'Women\'s Western demand index of 1.28 combined with 18% YoY growth and a 140-option gap vs Zara creates a clear category expansion opportunity. The affluent catchment (78/100) supports premium WW positioning, and contracting underperforming Men\'s Formal (-8% YoY) frees space without revenue risk.' },
  { id: 'rec-002', type: 'size-curve', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Mumbai - Phoenix Mall', title: 'Improve size availability in Women\'s Western', evidence: ['Size in-stock: 82% vs Westside 91% (-9pp)', 'Top size OOS: M (31% of misses)', 'Lost sales: ₹2.4 L/month from size mismatches', 'Returns due to size: 52% of WW returns'], action: 'Adjust WW size curve — increase M allocation by 15%', source: 'Reduce XXL allocation by 8%', impactSpsf: 8, impactGmrof: 12, impactRevenueMonthly: 180000, severity: 'high', status: 'pending', createdAt: '2026-02-28T10:30:00Z', handoffState: 'available', aiRationale: 'Size M accounts for 31% of all OOS events in Women\'s Western, directly causing ₹2.4 L/month in lost sales. The 52% of WW returns citing size mismatch further confirms the size curve misalignment. Shifting 8% from XXL (lowest demand size) to M is a zero-cost inventory rebalance with immediate revenue impact.' },
  { id: 'rec-003', type: 'cluster-strategy', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Mumbai - Phoenix Mall', title: 'Premium positioning for C1 cluster stores', evidence: ['C1 avg affluence: 76/100', 'Premium price band: 40% of sales (vs 27% network)', 'Aspirational competitors set premium expectation', 'Young Professional persona: 28%'], action: 'Increase premium (>₹1,000) from 27% to 35% across C1', source: 'Reduce entry-level depth', impactSpsf: 32, impactGmrof: 28, impactRevenueMonthly: 150000, severity: 'medium', status: 'pending', createdAt: '2026-02-25T09:00:00Z', handoffState: 'available', aiRationale: 'C1 cluster stores consistently over-index on premium purchases (40% vs 27% network), and the presence of aspirational competitors (Zara, H&M) has elevated customer price expectations. Deepening premium depth while reducing entry-level redundancy aligns with actual purchase behavior.' },
  { id: 'rec-004', type: 'category-expansion', storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', storeName: 'Hyderabad - Inorbit Mall', title: 'Expand Ethnic Wear allocation', evidence: ['Demand Index: 1.18 for ethnic', 'Catchment family index 68 — ethnic-strong demographic', 'Competitor gap in ethnic options', 'Current allocation 18% vs potential 25%'], action: 'Increase WIW from 18% to 25% of SFT', source: 'Contract mens-formal from 12% to 8%', impactSpsf: 22, impactGmrof: 18, impactRevenueMonthly: 165000, severity: 'high', status: 'pending', createdAt: '2026-02-27T11:00:00Z', handoffState: 'available', aiRationale: 'The catchment\'s family index of 68 creates strong latent ethnic demand (index 1.18), but current 18% allocation undersupplies this category vs the 25% optimum. Men\'s Formal at 12% can safely contract to 8% given declining demand.' },
  { id: 'rec-005', type: 'size-curve', storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', storeName: 'Hyderabad - Inorbit Mall', title: 'Address size availability gap', evidence: ['Size in-stock: 74% vs Pantaloons 85% (-11pp)', 'Lost sales: ₹1.8 L/month', 'Top OOS: M in womens-ethnic'], action: 'Rebalance size curve in WIW', source: 'Internal optimization', impactSpsf: 12, impactGmrof: 8, impactRevenueMonthly: 120000, severity: 'high', status: 'sent-to-otb', createdAt: '2026-02-26T14:00:00Z', handoffState: 'pending', handoffTarget: 'Inventory/OTB', handoffDate: '2026-02-26T14:00:00Z', aiRationale: 'At 74% size in-stock vs Pantaloons 85%, the 11pp gap is the single largest driver of lost sales at this store. The M-size gap in Women\'s Ethnic alone costs ₹1.8 L/month. This is a surgical fix with high ROI.' },
  { id: 'rec-006', type: 'category-expansion', storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', storeName: 'Kolkata - Quest Mall', title: 'Expand Kids Wear — underserved segment', evidence: ['Family index: 78 (highest in network)', 'Kidswear demand index: 1.15', 'Limited competition in KW segment', 'Current KW allocation only 10%'], action: 'Increase KW from 10% to 18% of SFT', source: 'Contract mens-casual from 20% to 14%', impactSpsf: 28, impactGmrof: 20, impactRevenueMonthly: 180000, severity: 'critical', status: 'pending', createdAt: '2026-02-28T08:00:00Z', handoffState: 'available', aiRationale: 'This catchment has the highest Family Index in the network (78) with a kids-wear demand index of 1.15, yet only 10% of SFT is allocated to Kids Wear. This is the single largest category-to-catchment misalignment in the network. The limited KW competition locally amplifies the opportunity.' },
  { id: 'rec-007', type: 'competitive-response', storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', storeName: 'Kolkata - Quest Mall', title: 'Improve option breadth vs Pantaloons', evidence: ['Option count gap: -180 vs Pantaloons Park Street', 'Competitive gap score: 42 (at-risk)', 'Footfall declining -5% QoQ'], action: 'Add 120 options in womens-ethnic and kids-wear', source: 'New season intake + carry-forward optimization', impactSpsf: 35, impactGmrof: 25, impactRevenueMonthly: 220000, severity: 'critical', status: 'pending', createdAt: '2026-02-27T09:00:00Z', handoffState: 'available', aiRationale: 'The -180 option gap vs Pantaloons Park Street is directly correlated with the -5% QoQ footfall decline: customers perceive less variety and shift to the competitor. Adding 120 options in the store\'s strongest demand categories (ethnic and kids) addresses the gap where it matters most.' },
  { id: 'rec-008', type: 'cluster-strategy', storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', storeName: 'Chennai - Express Avenue', title: 'Value positioning for C2 cluster', evidence: ['C2 avg affluence: 65/100', 'Entry-mid price band: 73% of sales', 'Price-sensitive catchment', 'Max & Zudio presence in catchment'], action: 'Shift price mix: increase <₹500 options by 10pp', source: 'Reduce premium options depth', impactSpsf: 15, impactGmrof: 12, impactRevenueMonthly: 95000, severity: 'medium', status: 'applied', createdAt: '2026-02-20T10:00:00Z', handoffState: 'resolved', handoffTarget: 'Space Planning', handoffDate: '2026-02-20T10:00:00Z', resolvedDate: '2026-02-28T09:00:00Z', resolvedSummary: 'Price mix shift applied. Entry-level depth increased by 8pp. Monitoring conversion impact.' },
  { id: 'rec-009', type: 'category-expansion', storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', storeName: 'Bangalore - UB City', title: 'Expand Women\'s Western — IT crowd demand', evidence: ['WW demand index: 1.15', 'Youth index: 75', 'IT professional persona: 25%', 'Competitive gap: -85 options vs H&M'], action: 'Increase WW from 20% to 26% of SFT', source: 'Contract kids-wear from 15% to 11%', impactSpsf: 14, impactGmrof: 16, impactRevenueMonthly: 125000, severity: 'medium', status: 'sent-to-space-planning', createdAt: '2026-02-24T11:00:00Z', handoffState: 'pending', handoffTarget: 'Space Planning', handoffDate: '2026-02-24T11:00:00Z', aiRationale: 'The IT professional and youth persona concentration (Youth Index 75) drives WW demand index of 1.15, but H&M Brigade Road holds an 85-option advantage. Expanding from 20% to 26% of SFT would close two-thirds of this gap, and Kids Wear at 15% exceeds the catchment\'s modest family index (48).' },
  { id: 'rec-010', type: 'competitive-response', storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', storeName: 'Ahmedabad - Palladium', title: 'Improve newness cadence', evidence: ['Newness rate: 62% vs Westside 75% (-13pp)', 'Fashion Forward persona: 14%', 'Customer feedback: "same collection too long"'], action: 'Increase monthly new option intake by 20%', source: 'Faster clearance of slow-movers', impactSpsf: 10, impactGmrof: 14, impactRevenueMonthly: 85000, severity: 'medium', status: 'pending', createdAt: '2026-02-26T15:00:00Z', handoffState: 'available', aiRationale: 'The 13pp newness gap vs Westside CG Road is the top competitive dimension gap. Customer dwell time data and feedback confirm that stale assortment is reducing visit frequency. Faster slow-mover clearance is a self-funding mechanism to increase new option intake.' },
  { id: 'rec-011', type: 'cluster-strategy', storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', storeName: 'Jaipur - World Trade Park', title: 'Ethnic-first strategy for C5 cluster', evidence: ['Family index: 82', 'Womens ethnic demand index: 1.2', 'Value positioning dominant', 'Wedding season peak: +35% in ethnic'], action: 'Make WIW anchor category (30%+ of SFT)', source: 'Reduce western categories', impactSpsf: 20, impactGmrof: 15, impactRevenueMonthly: 110000, severity: 'medium', status: 'pending', createdAt: '2026-02-25T12:00:00Z', handoffState: 'available' },
  { id: 'rec-012', type: 'competitive-response', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', storeName: 'Delhi - Select Citywalk', title: 'Close VM quality gap vs Zara', evidence: ['VM quality score: 7 vs Zara 9', 'Customer dwell time: 12min vs Zara 22min', 'VM impact on conversion: est. +5pp'], action: 'VM refresh with premium display fixtures', source: 'Capex allocation from store refresh budget', impactSpsf: 15, impactGmrof: 10, impactRevenueMonthly: 95000, severity: 'medium', status: 'dismissed', createdAt: '2026-02-18T09:00:00Z', handoffState: 'available', aiRationale: 'The VM quality gap (7 vs Zara 9) creates a measurable dwell time disadvantage (12min vs 22min). However, VM refresh requires capex that may not clear threshold for this budget cycle.' },
  { id: 'rec-013', type: 'category-expansion', storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', storeName: 'Lucknow - Lulu Mall', title: 'Leverage SmartBazaar cross-traffic', evidence: ['SmartBazaar 0.8km away', 'Apparel-adjacent sales: ₹7.2 Cr', 'Catchment multiplier: 1.18', 'Cross-format customer overlap: 32%'], action: 'Expand value segment in mens-casual', source: 'Increase entry-price options depth', impactSpsf: 8, impactGmrof: 6, impactRevenueMonthly: 65000, severity: 'low', status: 'pending', createdAt: '2026-02-28T16:00:00Z', handoffState: 'available' },
  // Event-driven recommendations
  { id: 'rec-014', type: 'demand-anomaly', storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', storeName: 'Mumbai - Phoenix Mall', title: 'Holi Festival readiness — Ethnic & Kids surge expected', evidence: ['Historical Holi uplift: +25% footfall', 'Ethnic and kids-wear spike in festive colors', 'Competitor Westside running pre-Holi promotion', 'Current ethnic festive stock at 72% of recommended level'], action: 'Fast-track festive ethnic and kids-wear replenishment; ensure floor-ready stock by Mar 12', source: 'Seasonal planning + vendor acceleration', impactSpsf: 15, impactGmrof: 18, impactRevenueMonthly: 280000, severity: 'high', status: 'pending', createdAt: '2026-03-02T08:00:00Z', handoffState: 'available', isEventDriven: true, eventName: 'Holi Festival', eventDate: '2026-03-14', readinessStatus: 'not-prepared', aiRationale: 'Holi is 11 days away with a historically verified +25% footfall impact. Current festive ethnic stock is at only 72% of recommended levels, and Westside is already running pre-Holi promotions. Delay beyond Mar 12 risks missing the 48-hour pre-festival buying window.' },
  { id: 'rec-015', type: 'demand-anomaly', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', storeName: 'Delhi - Select Citywalk', title: 'Delhi Fashion Week — WW showcase opportunity', evidence: ['Delhi Fashion Week: Mar 20-24', 'Historical WW sales uplift: +18% during event', 'Premium customer influx from event attendees', 'Current WW display allocation sub-optimal for event traffic'], action: 'Refresh WW visual merchandising and ensure new collection is floor-ready by Mar 18', source: 'VM team + buying team coordination', impactSpsf: 12, impactGmrof: 15, impactRevenueMonthly: 165000, severity: 'medium', status: 'pending', createdAt: '2026-03-01T09:00:00Z', handoffState: 'available', isEventDriven: true, eventName: 'Delhi Fashion Week', eventDate: '2026-03-20', readinessStatus: 'prepared', aiRationale: 'Delhi Fashion Week reliably drives +18% WW sales through event attendee spillover. Premium customer traffic during this window has the highest conversion rate of any seasonal event for this store. Early VM refresh positions the store to capture this demand.' },
  { id: 'rec-016', type: 'demand-anomaly', storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', storeName: 'Bangalore - UB City', title: 'Bengaluru Tech Summit — Formal wear demand spike', evidence: ['Tech Summit: Mar 18-20', 'Corporate attendees drive formal wear demand', 'Historical +8% incremental footfall', 'Men\'s Formal is uniquely strong at this store (index 1.25)'], action: 'Increase Men\'s Formal floor space temporarily; feature premium formal collections', source: 'Temporary space reallocation from slow-moving casual', impactSpsf: 10, impactGmrof: 12, impactRevenueMonthly: 95000, severity: 'medium', status: 'pending', createdAt: '2026-03-01T10:00:00Z', handoffState: 'available', isEventDriven: true, eventName: 'Bengaluru Tech Summit', eventDate: '2026-03-18', readinessStatus: 'prepared', aiRationale: 'This is the only store in the network where Men\'s Formal is a genuine growth category (index 1.25). The Tech Summit brings corporate professionals who over-index on formal purchases. A temporary space reallocation captures event-specific demand without permanent commitment.' },
  // Returns spike recommendation
  { id: 'rec-017', type: 'returns-spike', storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', storeName: 'Hyderabad - Inorbit Mall', title: 'Returns rate spike — investigate size mismatch root cause', evidence: ['Returns rate: 10.5% (highest in A1 cohort)', '48% of returns cite size mismatch', 'Net revenue impact: ₹3.4 L/month', 'Correlation with 74% size in-stock rate'], action: 'Audit size curve accuracy and reset size ratios for top 3 categories', source: 'Returns analysis + demand data', impactSpsf: 6, impactGmrof: 10, impactRevenueMonthly: 140000, severity: 'high', status: 'pending', createdAt: '2026-02-28T12:00:00Z', handoffState: 'available', aiRationale: 'The 10.5% returns rate is a direct consequence of the 74% size in-stock rate: customers receive substitute sizes that do not fit. Fixing the size curve (rec-005) would also reduce returns, but this recommendation specifically targets the returns processing and size ratio audit as a complementary action.' },
  // AOP variance recommendation
  { id: 'rec-018', type: 'aop-variance', storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', storeName: 'Kolkata - Quest Mall', title: 'AOP variance — inventory target significantly below twin recommendation', evidence: ['AOP inventory target: ₹42 L', 'Twin recommendation: ₹55 L', 'Gap: +₹13 L (31% under-investment)', 'Current SPSF gap: ₹210 (largest in network)'], action: 'Flag AOP inventory target for review and potential upward revision', source: 'Twin analysis + competitive benchmarking', impactSpsf: 35, impactGmrof: 22, impactRevenueMonthly: 320000, severity: 'critical', status: 'pending', createdAt: '2026-02-28T14:00:00Z', handoffState: 'available', aiRationale: 'The AOP inventory target of ₹42 L is ₹13 L below the twin recommendation, representing a 31% under-investment. This is the single largest AOP-to-twin gap in the network, and directly constrains the store\'s ability to close its ₹210 SPSF gap. Without inventory uplift, the option breadth and category reallocation recommendations cannot be fully executed.' },
  // Grade mismatch recommendation
  { id: 'rec-019', type: 'grade-mismatch', storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', storeName: 'Hyderabad - Inorbit Mall', title: 'Grade reclassification review — A1 to A2', evidence: ['New Westside competitor within 1km', 'Competitive intensity increased from medium to high', 'SPSF declining trend over 2 quarters', 'Catchment affluence at 62 (below A1 median of 70)'], action: 'Initiate formal reclassification review with regional team', source: 'Reclassification trigger: competitor-change', impactSpsf: 0, impactGmrof: 0, impactRevenueMonthly: 0, severity: 'medium', status: 'pending', createdAt: '2026-02-28T16:00:00Z', handoffState: 'available', aiRationale: 'The new Westside store within 1km has materially changed the competitive landscape. Combined with below-median affluence for the A1 grade, a reclassification to A2 would realign inventory and assortment targets to achievable levels, potentially improving relative performance metrics.' },
  // ── Additional recommendations for fuller coverage ──
  // store-004 (Chennai - Express Avenue) — currently 1 rec
  { id: 'rec-020', type: 'size-curve', storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', storeName: 'Chennai - Express Avenue', title: 'Fix ethnic wear size curve — L/XL undersupplied', evidence: ['Size in-stock: 78% vs Lifestyle 88% (-10pp)', 'Top OOS sizes: L (35% of misses), XL (22%)', 'Lost sales: ₹1.6 L/month from ethnic size mismatches', 'Returns citing size: 45% of ethnic returns'], action: 'Rebalance WIW size curve — increase L/XL allocation by 12%', source: 'Reduce S allocation by 8%', impactSpsf: 10, impactGmrof: 14, impactRevenueMonthly: 130000, severity: 'high', status: 'pending', createdAt: '2026-03-01T09:00:00Z', handoffState: 'available', aiRationale: 'The Chennai catchment skews towards larger sizes in ethnic wear (L/XL account for 57% of demand but only 40% of allocation). The 10pp size in-stock gap vs Lifestyle Express Avenue directly drives ₹1.6 L/month in lost sales.' },
  { id: 'rec-021', type: 'competitive-response', storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', storeName: 'Chennai - Express Avenue', title: 'Address Nalli Silks ethnic overlap', evidence: ['Nalli Silks T. Nagar 2km away with SPSF ₹1,100', 'Premium ethnic customer overlap: 28%', 'Nalli silk saree range: 400+ options vs our 85', 'Customer survey: 40% cross-shop with Nalli'], action: 'Introduce curated premium silk/occasion-wear capsule of 50 SKUs', source: 'Vendor sourcing from premium ethnic suppliers', impactSpsf: 18, impactGmrof: 22, impactRevenueMonthly: 145000, severity: 'medium', status: 'pending', createdAt: '2026-02-27T11:00:00Z', handoffState: 'available', aiRationale: 'Rather than competing head-on with Nalli\'s 400+ silk range, a curated 50-SKU premium ethnic capsule targets the 28% cross-shopping customers who want occasion-wear convenience alongside western categories — a positioning Nalli cannot match.' },
  // store-006 (Pune - Phoenix Marketcity) — currently 0 recs
  { id: 'rec-022', type: 'category-expansion', storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', storeName: 'Pune - Phoenix Marketcity', title: 'Expand Women\'s Western — IT corridor demand', evidence: ['CDI for WW: 1.22 (3rd highest in network)', 'Youth Index: 72, Hinjewadi IT corridor catchment', 'WW allocation: 20% vs optimal 28%', 'Competitive gap: -95 options vs Westside Aundh'], action: 'Increase WW from 20% to 28% of SFT', source: 'Contract mens-formal from 14% to 9%', impactSpsf: 20, impactGmrof: 18, impactRevenueMonthly: 175000, severity: 'high', status: 'pending', createdAt: '2026-03-01T10:00:00Z', handoffState: 'available', aiRationale: 'Pune\'s IT corridor catchment (Youth Index 72) creates strong WW demand (CDI 1.22), but current 20% allocation leaves an 8pp gap to the optimal 28%. The 95-option gap vs Westside Aundh confirms underinvestment. Men\'s Formal at 14% can contract given the catchment\'s casual-preference profile.' },
  { id: 'rec-023', type: 'competitive-response', storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', storeName: 'Pune - Phoenix Marketcity', title: 'Close option breadth gap vs Westside Aundh', evidence: ['Option count gap: -95 vs Westside Aundh', 'Competitive gap score: 58 (moderate risk)', 'Footfall flat QoQ despite catchment growth', 'VM Quality: 7 vs Westside 8 in WW zone'], action: 'Add 70 options in womens-western and kids-wear', source: 'New season buy + faster carry-forward clearance', impactSpsf: 16, impactGmrof: 14, impactRevenueMonthly: 140000, severity: 'medium', status: 'sent-to-otb', createdAt: '2026-02-25T14:00:00Z', handoffState: 'pending', handoffTarget: 'OTB/Buying', handoffDate: '2026-02-25T14:00:00Z', aiRationale: 'The 95-option gap vs Westside is concentrated in WW (60 options) and KW (35 options). Adding these options is within normal seasonal buy capacity and addresses the primary reason for flat footfall despite catchment growth.' },
  { id: 'rec-024', type: 'demand-anomaly', storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', storeName: 'Pune - Phoenix Marketcity', title: 'Holi Festival — ethnic & color-wear readiness', evidence: ['Pune Holi celebrations drive +20% footfall historically', 'Ethnic festive stock at 68% of recommended level', 'Competitor promotions starting Mar 10', 'Kids-wear festive demand spike: +30%'], action: 'Expedite festive ethnic and kids-wear replenishment by Mar 11', source: 'Seasonal planning + express vendor fulfillment', impactSpsf: 12, impactGmrof: 15, impactRevenueMonthly: 195000, severity: 'high', status: 'pending', createdAt: '2026-03-02T09:00:00Z', handoffState: 'available', isEventDriven: true, eventName: 'Holi Festival', eventDate: '2026-03-14', readinessStatus: 'not-prepared', aiRationale: 'Festive ethnic stock at 68% is the lowest readiness level in A-grade stores. With competitors starting promotions Mar 10, any delay past Mar 11 risks losing the critical pre-Holi purchase window. Kids-wear festive demand (+30%) is particularly strong in the family-oriented Pune catchment.' },
  // store-008 (Ahmedabad - Palladium) — currently 1 rec
  { id: 'rec-025', type: 'category-expansion', storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', storeName: 'Ahmedabad - Palladium', title: 'Expand Ethnic Wear — Navratri anchor strategy', evidence: ['Navratri uplift: +48% (highest seasonal peak)', 'Ethnic CDI: 1.18, currently 22% of SFT', 'Chaniya choli demand unmet: est. ₹2.1 L/season', 'Family Index: 71 supports ethnic depth'], action: 'Increase ethnic allocation from 22% to 30% as anchor category', source: 'Reduce mens-formal from 12% to 7%', impactSpsf: 24, impactGmrof: 18, impactRevenueMonthly: 155000, severity: 'high', status: 'pending', createdAt: '2026-02-28T10:00:00Z', handoffState: 'available', aiRationale: 'Ahmedabad\'s Navratri season generates the highest seasonal uplift in the network (+48%). Making ethnic the anchor category at 30% positions the store to capture the ₹2.1 L unmet chaniya choli demand and aligns with the catchment\'s Family Index of 71.' },
  { id: 'rec-026', type: 'returns-spike', storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', storeName: 'Ahmedabad - Palladium', title: 'Returns rate above grade average — quality audit needed', evidence: ['Returns rate: 9.8% vs A2 grade avg 8.2%', '44% cite size mismatch', 'Ethnic category returns: 12.5% (highest)', 'Net revenue impact: ₹2.9 L/month'], action: 'Conduct quality and size accuracy audit for ethnic category', source: 'Returns data analysis + vendor quality review', impactSpsf: 4, impactGmrof: 8, impactRevenueMonthly: 110000, severity: 'medium', status: 'pending', createdAt: '2026-03-01T11:00:00Z', handoffState: 'available', aiRationale: 'The 1.6pp returns premium over grade average (9.8% vs 8.2%) is concentrated in the ethnic category at 12.5%. Size mismatch at 44% suggests the size curve does not match the local body-type distribution. A targeted audit is needed before expanding ethnic allocation (see rec-025).' },
  // store-009 (Jaipur - World Trade Park) — currently 1 rec
  { id: 'rec-027', type: 'competitive-response', storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', storeName: 'Jaipur - World Trade Park', title: 'Counter V-Mart price pressure on basics', evidence: ['V-Mart WTP opened 6 months ago, entry pricing', 'Men\'s casual basics sales: -12% since V-Mart opening', 'Price-sensitive catchment (affluence: 52)', 'Option count gap in <₹500 segment: -200 vs V-Mart'], action: 'Launch value basics capsule at ₹299-₹499 with 80 options', source: 'Private label sourcing + direct vendor', impactSpsf: 8, impactGmrof: 6, impactRevenueMonthly: 75000, severity: 'medium', status: 'pending', createdAt: '2026-02-26T10:00:00Z', handoffState: 'available', aiRationale: 'V-Mart\'s entry into the WTP catchment has directly cannibalized basics demand (-12%). Rather than matching V-Mart\'s full range, a focused 80-option value capsule defends the entry segment while maintaining margin through private label sourcing.' },
  { id: 'rec-028', type: 'demand-anomaly', storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', storeName: 'Jaipur - World Trade Park', title: 'Wedding season prep — ethnic lehenga demand spike', evidence: ['Wedding season peak: +50% in ethnic categories', 'Lehenga/sharara demand index: 1.35 (seasonal)', 'Current bridal ethnic stock: 55% of recommended', 'Competitor ethnic pop-ups appearing in catchment'], action: 'Fast-track bridal ethnic replenishment; set up dedicated wedding zone by Apr 1', source: 'Seasonal planning + vendor fast-track', impactSpsf: 18, impactGmrof: 20, impactRevenueMonthly: 165000, severity: 'high', status: 'pending', createdAt: '2026-03-02T10:00:00Z', handoffState: 'available', isEventDriven: true, eventName: 'Wedding Season', eventDate: '2026-04-15', readinessStatus: 'not-prepared', aiRationale: 'Jaipur\'s wedding season generates the 2nd highest seasonal uplift in the network (+50%). Current bridal ethnic stock at 55% of recommended levels is critically low. Competitor pop-ups suggest high catchment demand that we risk ceding entirely without immediate action.' },
  // store-010 (Lucknow - Lulu Mall) — currently 1 rec
  { id: 'rec-029', type: 'size-curve', storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', storeName: 'Lucknow - Lulu Mall', title: 'Correct men\'s casual size curve — XL/XXL deficit', evidence: ['Size in-stock: 71% (lowest in B1 cohort)', 'XL and XXL account for 38% of demand but 22% of allocation', 'Lost sales from size: ₹1.2 L/month', 'Regional body-type data confirms larger size preference'], action: 'Rebalance MC size curve: increase XL/XXL by 16pp', source: 'Reduce S/M allocation proportionally', impactSpsf: 8, impactGmrof: 10, impactRevenueMonthly: 95000, severity: 'high', status: 'pending', createdAt: '2026-02-27T09:00:00Z', handoffState: 'available', aiRationale: 'The 16pp allocation-to-demand gap in XL/XXL is the largest size curve misalignment in the B1 cohort. Regional body-type data from the UP catchment confirms this is a structural mismatch, not a seasonal anomaly. This is a zero-cost rebalance with ₹1.2 L/month revenue recovery.' },
  { id: 'rec-030', type: 'cluster-strategy', storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', storeName: 'Lucknow - Lulu Mall', title: 'Value-first assortment for Tier-2 catchment', evidence: ['Affluence score: 45 (lowest in network)', 'Entry-mid (<₹500) price band: 78% of sales', 'Premium (>₹1000) sell-through: only 28% vs 52% network', 'SmartBazaar cross-traffic: 32% customer overlap'], action: 'Shift assortment: increase <₹500 options by 15pp, reduce premium depth', source: 'Assortment strategy + vendor mix optimization', impactSpsf: 10, impactGmrof: 8, impactRevenueMonthly: 85000, severity: 'medium', status: 'pending', createdAt: '2026-02-26T15:00:00Z', handoffState: 'available', aiRationale: 'The catch-all buying strategy from the network template doesn\'t work here. With 78% of sales in entry-mid pricing and premium sell-through at half the network rate, the store is carrying dead premium inventory. Shifting to a value-first assortment aligns with both SmartBazaar cross-traffic behavior and catchment purchasing power.' },
  // store-002 (Delhi - Select Citywalk) — currently 2 recs, adding 1 more
  { id: 'rec-031', type: 'category-expansion', storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', storeName: 'Delhi - Select Citywalk', title: 'Strengthen Men\'s Formal — corporate corridor demand', evidence: ['Men\'s formal CDI: 1.15 in Delhi catchment', 'Corporate professional persona: 22%', 'Competitive gap: -65 formal options vs Shoppers Stop', 'Premium formal sell-through: 62% (above network 48%)'], action: 'Increase MF allocation from 14% to 19% with premium focus', source: 'Reduce kids-wear from 12% to 9% (lower family index)', impactSpsf: 14, impactGmrof: 16, impactRevenueMonthly: 120000, severity: 'medium', status: 'pending', createdAt: '2026-02-28T11:00:00Z', handoffState: 'available', aiRationale: 'Delhi Select Citywalk\'s corporate corridor location drives above-average formal demand (CDI 1.15) with premium sell-through 14pp above network. The 65-option gap vs Shoppers Stop in formal is the primary category-level competitive weakness. Kids-wear at 12% exceeds the catchment\'s modest family index (42).' },
  // store-003 (Bangalore - UB City) — currently 2 recs, adding 1 more
  { id: 'rec-032', type: 'returns-spike', storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', storeName: 'Bangalore - UB City', title: 'Investigate WW returns rate anomaly', evidence: ['WW returns: 8.8% vs A+ grade avg 6.2%', '35% cite size mismatch despite 85% in-stock', 'Online-first shoppers trying in-store: different size expectations', 'Net revenue impact: ₹2.2 L/month'], action: 'Implement try-before-you-buy fitting room experience for WW; add size guide signage', source: 'Customer experience + operations team', impactSpsf: 6, impactGmrof: 8, impactRevenueMonthly: 110000, severity: 'medium', status: 'pending', createdAt: '2026-03-01T08:00:00Z', handoffState: 'available', aiRationale: 'UB City\'s tech-savvy catchment (IT professional persona 25%) includes many online-first shoppers whose size expectations are calibrated to e-commerce sizing. Despite 85% in-stock rate, the 8.8% WW returns rate suggests a size perception gap rather than an inventory gap. Enhanced fitting experiences address the root cause.' },
];

// ── 12. Reclassification Triggers ──

export const reclassificationTriggers: ReclassificationTrigger[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', triggerType: 'spsf-shift', description: 'SPSF below grade target for 2 consecutive quarters', currentGrade: 'A+', recommendedGrade: 'A1', currentCluster: 'C1', detectedAt: '2026-02-15T10:00:00Z', status: 'pending' },
  { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', triggerType: 'competitor-change', description: 'New direct competitor (Westside) opened within 1km — competitive intensity increased', currentGrade: 'A1', recommendedGrade: 'A2', currentCluster: 'C4', detectedAt: '2026-02-20T14:00:00Z', status: 'pending' },
  { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', triggerType: 'catchment-change', description: 'Catchment affluence score dropped 18 points (70→52) after residential demographic shift', currentGrade: 'A2', recommendedGrade: 'B1', currentCluster: 'C3', detectedAt: '2026-02-22T09:00:00Z', status: 'pending' },
  { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', triggerType: 'cluster-outlier', description: 'Store is >2 SD from C4 cluster centroid on affluence dimension', currentGrade: 'A2', recommendedGrade: 'A2', currentCluster: 'C4', recommendedCluster: 'C3', detectedAt: '2026-02-25T11:00:00Z', status: 'deferred' },
];

// ── 13. Weather Data ──

export interface WeatherData {
  storeId: string;
  condition: string;
  temperature: number;
  humidity: number;
  forecast: string;
  footfallImpact: number;
  categoryImpact: string;
}

export const weatherData: WeatherData[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', condition: 'Pleasant', temperature: 28, humidity: 65, forecast: 'Clear skies, mild for next 5 days', footfallImpact: 5, categoryImpact: 'Even distribution — good for new launches' },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', condition: 'Cold Wave', temperature: 8, humidity: 45, forecast: 'Cold wave continuing for 3 days', footfallImpact: -8, categoryImpact: 'Winterwear ↑, Thermals ↑, Light fabrics ↓' },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', condition: 'Heavy Rain', temperature: 24, humidity: 88, forecast: 'Moderate to heavy rain for 2 days', footfallImpact: -18, categoryImpact: 'Footwear ↑, Rainwear ↑, Casual ↓' },
];

// ── 14. Upcoming Events ──

export interface UpcomingEvent {
  storeId: string;
  eventName: string;
  eventType: string;
  dateRange: string;
  expectedFootfallImpact: number;
  categoryAffinity: string[];
}

export const upcomingEvents: UpcomingEvent[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', eventName: 'Holi Festival', eventType: 'National Festival', dateRange: 'Mar 14-15, 2026', expectedFootfallImpact: 25, categoryAffinity: ['womens-ethnic', 'kids-wear'] },
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', eventName: 'Mumbai Marathon Expo', eventType: 'Local Event', dateRange: 'Mar 8-9, 2026', expectedFootfallImpact: 10, categoryAffinity: ['mens-casual'] },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', eventName: 'Holi Festival', eventType: 'National Festival', dateRange: 'Mar 14-15, 2026', expectedFootfallImpact: 30, categoryAffinity: ['womens-ethnic', 'kids-wear', 'mens-casual'] },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', eventName: 'Delhi Fashion Week', eventType: 'Industry Event', dateRange: 'Mar 20-24, 2026', expectedFootfallImpact: 15, categoryAffinity: ['womens-western', 'mens-formal'] },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', eventName: 'Holi Festival', eventType: 'National Festival', dateRange: 'Mar 14-15, 2026', expectedFootfallImpact: 20, categoryAffinity: ['womens-ethnic', 'kids-wear'] },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', eventName: 'Bengaluru Tech Summit', eventType: 'Corporate Event', dateRange: 'Mar 18-20, 2026', expectedFootfallImpact: 8, categoryAffinity: ['mens-formal', 'mens-casual'] },
];

// ── 15. Basket Intelligence ──

export const basketIntelligence: BasketIntelligence[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', avgBasketSize: 2.8, avgBasketValue: 3200, crossSellRate: 34, topCombinations: [{ primary: 'womens-western', secondary: 'accessories', frequency: 28 }, { primary: 'mens-casual', secondary: 'mens-formal', frequency: 18 }, { primary: 'womens-ethnic', secondary: 'jewellery', frequency: 15 }], basketTrend: 'growing', vsGradeAvg: 112 },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', avgBasketSize: 2.6, avgBasketValue: 3450, crossSellRate: 32, topCombinations: [{ primary: 'mens-casual', secondary: 'footwear', frequency: 25 }, { primary: 'womens-western', secondary: 'accessories', frequency: 22 }, { primary: 'mens-formal', secondary: 'accessories', frequency: 16 }], basketTrend: 'stable', vsGradeAvg: 108 },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', avgBasketSize: 3.1, avgBasketValue: 4100, crossSellRate: 38, topCombinations: [{ primary: 'mens-formal', secondary: 'accessories', frequency: 30 }, { primary: 'womens-western', secondary: 'footwear', frequency: 22 }, { primary: 'womens-ethnic', secondary: 'jewellery', frequency: 18 }], basketTrend: 'growing', vsGradeAvg: 118 },
  { storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', avgBasketSize: 2.2, avgBasketValue: 2100, crossSellRate: 26, topCombinations: [{ primary: 'womens-ethnic', secondary: 'accessories', frequency: 22 }, { primary: 'mens-casual', secondary: 'footwear', frequency: 18 }, { primary: 'kids-wear', secondary: 'accessories', frequency: 14 }], basketTrend: 'stable', vsGradeAvg: 96 },
  { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', avgBasketSize: 1.9, avgBasketValue: 1650, crossSellRate: 22, topCombinations: [{ primary: 'mens-casual', secondary: 'footwear', frequency: 20 }, { primary: 'womens-ethnic', secondary: 'accessories', frequency: 16 }, { primary: 'kids-wear', secondary: 'footwear', frequency: 12 }], basketTrend: 'declining', vsGradeAvg: 88 },
  { storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', avgBasketSize: 2.4, avgBasketValue: 2500, crossSellRate: 30, topCombinations: [{ primary: 'womens-western', secondary: 'accessories', frequency: 24 }, { primary: 'mens-casual', secondary: 'footwear', frequency: 20 }, { primary: 'kids-wear', secondary: 'accessories', frequency: 15 }], basketTrend: 'growing', vsGradeAvg: 104 },
  { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', avgBasketSize: 1.8, avgBasketValue: 1400, crossSellRate: 20, topCombinations: [{ primary: 'womens-ethnic', secondary: 'accessories', frequency: 18 }, { primary: 'kids-wear', secondary: 'footwear', frequency: 14 }, { primary: 'mens-casual', secondary: 'footwear', frequency: 10 }], basketTrend: 'declining', vsGradeAvg: 82 },
  { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', avgBasketSize: 2.0, avgBasketValue: 1800, crossSellRate: 24, topCombinations: [{ primary: 'womens-ethnic', secondary: 'accessories', frequency: 20 }, { primary: 'mens-casual', secondary: 'footwear', frequency: 16 }, { primary: 'kids-wear', secondary: 'accessories', frequency: 12 }], basketTrend: 'stable', vsGradeAvg: 90 },
  { storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', avgBasketSize: 1.7, avgBasketValue: 1200, crossSellRate: 18, topCombinations: [{ primary: 'womens-ethnic', secondary: 'accessories', frequency: 22 }, { primary: 'kids-wear', secondary: 'footwear', frequency: 12 }, { primary: 'mens-casual', secondary: 'footwear', frequency: 8 }], basketTrend: 'stable', vsGradeAvg: 78 },
  { storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', avgBasketSize: 1.9, avgBasketValue: 1350, crossSellRate: 20, topCombinations: [{ primary: 'mens-casual', secondary: 'footwear', frequency: 18 }, { primary: 'womens-ethnic', secondary: 'accessories', frequency: 14 }, { primary: 'kids-wear', secondary: 'accessories', frequency: 10 }], basketTrend: 'stable', vsGradeAvg: 84 },
];

// ── 16. Returns Intelligence ──

export const returnsIntelligence: ReturnsIntelligence[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', returnRate: 8.2, topReturnReasons: [{ reason: 'Size mismatch', percentage: 42 }, { reason: 'Quality issue', percentage: 22 }, { reason: 'Color difference', percentage: 18 }, { reason: 'Changed mind', percentage: 18 }], categoryReturns: [{ category: 'womens-western', returnRate: 12.5, topReason: 'Size mismatch' }, { category: 'mens-casual', returnRate: 6.8, topReason: 'Color difference' }, { category: 'womens-ethnic', returnRate: 5.2, topReason: 'Quality issue' }], exchangeRate: 35, netRevenueImpact: 320000, vsGradeAvg: 105 },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', returnRate: 7.8, topReturnReasons: [{ reason: 'Size mismatch', percentage: 38 }, { reason: 'Quality issue', percentage: 24 }, { reason: 'Changed mind', percentage: 22 }, { reason: 'Color difference', percentage: 16 }], categoryReturns: [{ category: 'mens-formal', returnRate: 10.2, topReason: 'Size mismatch' }, { category: 'womens-western', returnRate: 9.5, topReason: 'Size mismatch' }, { category: 'kids-wear', returnRate: 4.8, topReason: 'Size mismatch' }], exchangeRate: 38, netRevenueImpact: 280000, vsGradeAvg: 98 },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', returnRate: 6.5, topReturnReasons: [{ reason: 'Size mismatch', percentage: 35 }, { reason: 'Changed mind', percentage: 28 }, { reason: 'Quality issue', percentage: 20 }, { reason: 'Color difference', percentage: 17 }], categoryReturns: [{ category: 'womens-western', returnRate: 8.8, topReason: 'Size mismatch' }, { category: 'mens-formal', returnRate: 7.2, topReason: 'Changed mind' }, { category: 'womens-ethnic', returnRate: 4.5, topReason: 'Quality issue' }], exchangeRate: 42, netRevenueImpact: 220000, vsGradeAvg: 92 },
  { storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', returnRate: 9.1, topReturnReasons: [{ reason: 'Size mismatch', percentage: 45 }, { reason: 'Quality issue', percentage: 25 }, { reason: 'Color difference', percentage: 18 }, { reason: 'Changed mind', percentage: 12 }], categoryReturns: [{ category: 'womens-ethnic', returnRate: 11.5, topReason: 'Size mismatch' }, { category: 'mens-casual', returnRate: 8.2, topReason: 'Quality issue' }, { category: 'kids-wear', returnRate: 7.5, topReason: 'Size mismatch' }], exchangeRate: 30, netRevenueImpact: 260000, vsGradeAvg: 110 },
  { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', returnRate: 10.5, topReturnReasons: [{ reason: 'Size mismatch', percentage: 48 }, { reason: 'Quality issue', percentage: 22 }, { reason: 'Changed mind', percentage: 18 }, { reason: 'Color difference', percentage: 12 }], categoryReturns: [{ category: 'womens-ethnic', returnRate: 13.2, topReason: 'Size mismatch' }, { category: 'mens-casual', returnRate: 9.8, topReason: 'Size mismatch' }, { category: 'kids-wear', returnRate: 8.5, topReason: 'Quality issue' }], exchangeRate: 25, netRevenueImpact: 340000, vsGradeAvg: 118 },
  { storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', returnRate: 7.5, topReturnReasons: [{ reason: 'Size mismatch', percentage: 40 }, { reason: 'Quality issue', percentage: 24 }, { reason: 'Color difference', percentage: 20 }, { reason: 'Changed mind', percentage: 16 }], categoryReturns: [{ category: 'womens-western', returnRate: 10.2, topReason: 'Size mismatch' }, { category: 'mens-casual', returnRate: 6.5, topReason: 'Color difference' }, { category: 'kids-wear', returnRate: 5.8, topReason: 'Size mismatch' }], exchangeRate: 36, netRevenueImpact: 240000, vsGradeAvg: 96 },
  { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', returnRate: 12.2, topReturnReasons: [{ reason: 'Size mismatch', percentage: 50 }, { reason: 'Quality issue', percentage: 22 }, { reason: 'Changed mind', percentage: 16 }, { reason: 'Color difference', percentage: 12 }], categoryReturns: [{ category: 'womens-ethnic', returnRate: 15.5, topReason: 'Size mismatch' }, { category: 'kids-wear', returnRate: 10.8, topReason: 'Size mismatch' }, { category: 'mens-casual', returnRate: 9.5, topReason: 'Quality issue' }], exchangeRate: 22, netRevenueImpact: 380000, vsGradeAvg: 128 },
  { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', returnRate: 9.8, topReturnReasons: [{ reason: 'Size mismatch', percentage: 44 }, { reason: 'Quality issue', percentage: 24 }, { reason: 'Changed mind', percentage: 18 }, { reason: 'Color difference', percentage: 14 }], categoryReturns: [{ category: 'womens-ethnic', returnRate: 12.5, topReason: 'Size mismatch' }, { category: 'mens-casual', returnRate: 8.5, topReason: 'Quality issue' }, { category: 'kids-wear', returnRate: 7.8, topReason: 'Size mismatch' }], exchangeRate: 28, netRevenueImpact: 290000, vsGradeAvg: 112 },
  { storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', returnRate: 11.5, topReturnReasons: [{ reason: 'Size mismatch', percentage: 48 }, { reason: 'Quality issue', percentage: 25 }, { reason: 'Changed mind', percentage: 15 }, { reason: 'Color difference', percentage: 12 }], categoryReturns: [{ category: 'womens-ethnic', returnRate: 14.2, topReason: 'Size mismatch' }, { category: 'kids-wear', returnRate: 10.5, topReason: 'Size mismatch' }, { category: 'mens-casual', returnRate: 8.8, topReason: 'Quality issue' }], exchangeRate: 24, netRevenueImpact: 320000, vsGradeAvg: 122 },
  { storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', returnRate: 10.8, topReturnReasons: [{ reason: 'Size mismatch', percentage: 46 }, { reason: 'Quality issue', percentage: 24 }, { reason: 'Changed mind', percentage: 18 }, { reason: 'Color difference', percentage: 12 }], categoryReturns: [{ category: 'mens-casual', returnRate: 12.2, topReason: 'Size mismatch' }, { category: 'womens-ethnic', returnRate: 11.5, topReason: 'Quality issue' }, { category: 'kids-wear', returnRate: 9.2, topReason: 'Size mismatch' }], exchangeRate: 26, netRevenueImpact: 300000, vsGradeAvg: 118 },
];

// ── 17. Demand Forecasting ──

export const demandForecasts: DemandForecast[] = [
  { storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', nextMonthForecast: 4800000, nextQuarterForecast: 15200000, forecastAccuracy: 88, seasonalPeak: 'Diwali 2026', peakUplift: 45, categoryForecasts: [{ category: 'womens-western', nextMonthRevenue: 1520000, trend: 'up' }, { category: 'womens-ethnic', nextMonthRevenue: 1380000, trend: 'up' }, { category: 'mens-casual', nextMonthRevenue: 1080000, trend: 'flat' }, { category: 'mens-formal', nextMonthRevenue: 420000, trend: 'down' }, { category: 'kids-wear', nextMonthRevenue: 400000, trend: 'flat' }] },
  { storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', nextMonthForecast: 4500000, nextQuarterForecast: 14100000, forecastAccuracy: 85, seasonalPeak: 'Diwali 2026', peakUplift: 40, categoryForecasts: [{ category: 'mens-casual', nextMonthRevenue: 1350000, trend: 'up' }, { category: 'womens-western', nextMonthRevenue: 1200000, trend: 'up' }, { category: 'mens-formal', nextMonthRevenue: 900000, trend: 'flat' }, { category: 'womens-ethnic', nextMonthRevenue: 650000, trend: 'flat' }, { category: 'kids-wear', nextMonthRevenue: 400000, trend: 'flat' }] },
  { storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', nextMonthForecast: 3800000, nextQuarterForecast: 12000000, forecastAccuracy: 90, seasonalPeak: 'Dasara 2026', peakUplift: 35, categoryForecasts: [{ category: 'mens-formal', nextMonthRevenue: 1050000, trend: 'up' }, { category: 'womens-western', nextMonthRevenue: 920000, trend: 'up' }, { category: 'womens-ethnic', nextMonthRevenue: 850000, trend: 'flat' }, { category: 'kids-wear', nextMonthRevenue: 520000, trend: 'up' }, { category: 'mens-casual', nextMonthRevenue: 460000, trend: 'flat' }] },
  { storeId: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', nextMonthForecast: 2800000, nextQuarterForecast: 8500000, forecastAccuracy: 82, seasonalPeak: 'Pongal 2027', peakUplift: 38, categoryForecasts: [{ category: 'womens-ethnic', nextMonthRevenue: 820000, trend: 'up' }, { category: 'mens-casual', nextMonthRevenue: 680000, trend: 'flat' }, { category: 'kids-wear', nextMonthRevenue: 520000, trend: 'flat' }, { category: 'womens-western', nextMonthRevenue: 450000, trend: 'flat' }, { category: 'mens-formal', nextMonthRevenue: 330000, trend: 'down' }] },
  { storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', nextMonthForecast: 2400000, nextQuarterForecast: 7200000, forecastAccuracy: 78, seasonalPeak: 'Diwali 2026', peakUplift: 42, categoryForecasts: [{ category: 'mens-casual', nextMonthRevenue: 680000, trend: 'flat' }, { category: 'womens-ethnic', nextMonthRevenue: 620000, trend: 'up' }, { category: 'kids-wear', nextMonthRevenue: 480000, trend: 'flat' }, { category: 'womens-western', nextMonthRevenue: 380000, trend: 'flat' }, { category: 'mens-formal', nextMonthRevenue: 240000, trend: 'down' }] },
  { storeId: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', nextMonthForecast: 3200000, nextQuarterForecast: 9800000, forecastAccuracy: 84, seasonalPeak: 'Ganesh Chaturthi 2026', peakUplift: 32, categoryForecasts: [{ category: 'womens-western', nextMonthRevenue: 880000, trend: 'up' }, { category: 'mens-casual', nextMonthRevenue: 780000, trend: 'flat' }, { category: 'womens-ethnic', nextMonthRevenue: 620000, trend: 'flat' }, { category: 'kids-wear', nextMonthRevenue: 520000, trend: 'up' }, { category: 'mens-formal', nextMonthRevenue: 400000, trend: 'flat' }] },
  { storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', nextMonthForecast: 1800000, nextQuarterForecast: 5200000, forecastAccuracy: 75, seasonalPeak: 'Durga Puja 2026', peakUplift: 55, categoryForecasts: [{ category: 'womens-ethnic', nextMonthRevenue: 580000, trend: 'up' }, { category: 'kids-wear', nextMonthRevenue: 420000, trend: 'flat' }, { category: 'mens-casual', nextMonthRevenue: 380000, trend: 'down' }, { category: 'womens-western', nextMonthRevenue: 250000, trend: 'down' }, { category: 'mens-formal', nextMonthRevenue: 170000, trend: 'down' }] },
  { storeId: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', nextMonthForecast: 2200000, nextQuarterForecast: 6500000, forecastAccuracy: 80, seasonalPeak: 'Navratri 2026', peakUplift: 48, categoryForecasts: [{ category: 'womens-ethnic', nextMonthRevenue: 650000, trend: 'up' }, { category: 'mens-casual', nextMonthRevenue: 520000, trend: 'flat' }, { category: 'kids-wear', nextMonthRevenue: 420000, trend: 'flat' }, { category: 'womens-western', nextMonthRevenue: 380000, trend: 'flat' }, { category: 'mens-formal', nextMonthRevenue: 230000, trend: 'down' }] },
  { storeId: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', nextMonthForecast: 1600000, nextQuarterForecast: 4800000, forecastAccuracy: 76, seasonalPeak: 'Wedding Season 2026', peakUplift: 50, categoryForecasts: [{ category: 'womens-ethnic', nextMonthRevenue: 580000, trend: 'up' }, { category: 'kids-wear', nextMonthRevenue: 380000, trend: 'flat' }, { category: 'mens-casual', nextMonthRevenue: 320000, trend: 'flat' }, { category: 'womens-western', nextMonthRevenue: 180000, trend: 'down' }, { category: 'mens-formal', nextMonthRevenue: 140000, trend: 'down' }] },
  { storeId: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', nextMonthForecast: 1500000, nextQuarterForecast: 4500000, forecastAccuracy: 74, seasonalPeak: 'Diwali 2026', peakUplift: 40, categoryForecasts: [{ category: 'mens-casual', nextMonthRevenue: 450000, trend: 'flat' }, { category: 'womens-ethnic', nextMonthRevenue: 420000, trend: 'up' }, { category: 'kids-wear', nextMonthRevenue: 320000, trend: 'flat' }, { category: 'womens-western', nextMonthRevenue: 180000, trend: 'flat' }, { category: 'mens-formal', nextMonthRevenue: 130000, trend: 'down' }] },
];

// ── 18. Helper Functions ──

// Canonical store UUIDs that have intelligence data
export const KNOWN_STORE_IDS = [
  'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d', // Phoenix Palladium
  'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b', // Select Citywalk
  '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42', // UB City Bangalore
  '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75', // Express Avenue Chennai
  'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97', // Inorbit Mall Hyderabad
  '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a', // Phoenix Marketcity Pune
  '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20', // Quest Mall Kolkata
  '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b', // Palladium Ahmedabad
  '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20', // World Trade Park Jaipur
  '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c', // Lulu Mall Lucknow
];

const KNOWN_SET = new Set(KNOWN_STORE_IDS);

// Build STORE_NAMES from canonical store registry
const STORE_NAMES: Record<string, { name: string; grade: string }> = {};
for (const id of KNOWN_STORE_IDS) {
  const cs = CANONICAL_STORES.find((s) => s.id === id);
  if (cs) {
    STORE_NAMES[id] = { name: cs.name, grade: cs.grade };
  }
}

export function getStoreIntelligence(storeId: string): StoreIntelligenceProfile | undefined {
  if (!KNOWN_SET.has(storeId)) return undefined;

  const gap = competitiveGapScores.find((g) => g.storeId === storeId);
  const catchment = catchmentProfiles.find((c) => c.storeId === storeId);
  const crossFormat = crossFormatSignals.find((c) => c.storeId === storeId);
  const demand = storeDemandProfiles.find((d) => d.storeId === storeId);
  const customer = storeCustomerProfiles.find((c) => c.storeId === storeId);
  const twin = storeTwinAnalyses.find((t) => t.storeId === storeId);
  const clusterId = storeClusterAssignments[storeId];
  const cluster = storeClusters.find((c) => c.id === clusterId);

  if (!gap || !catchment || !crossFormat || !demand || !customer || !twin || !clusterId || !cluster) return undefined;

  const info = STORE_NAMES[storeId];
  if (!info) return undefined;

  return {
    storeId,
    storeName: info.name,
    grade: info.grade,
    cluster: clusterId,
    clusterLabel: cluster.label,
    demandProfile: { ...demand, storeId },
    competitiveGap: { ...gap, storeId },
    catchment: { ...catchment, storeId },
    crossFormat: { ...crossFormat, storeId },
    customerProfile: { ...customer, storeId },
    twinAnalysis: { ...twin, storeId },
    lastUpdated: '2026-03-03T06:00:00Z',
  };
}

export function getCompetitorsForStore(storeId: string): Competitor[] {
  const mapping = storeCompetitorMappings[storeId];
  if (!mapping) return [];
  return mapping
    .map((entry) => competitors.find((c) => c.id === entry.competitorId))
    .filter((c): c is Competitor => c !== undefined);
}

export function getClusterForStore(storeId: string): StoreCluster | undefined {
  const clusterId = storeClusterAssignments[storeId];
  if (!clusterId) return undefined;
  return storeClusters.find((c) => c.id === clusterId);
}

// ── Deep Research Data ──

export const storeDeepResearch: Record<string, StoreDeepResearch> = {
  // Phoenix Palladium Mumbai
  'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d': {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    positioning: {
      statement: 'Premium Mall Anchor',
      differentiator: 'Curated Style with Trial-Room Comfort. The biggest advantage over Linking Road street vendors is the ability to try clothes on in a climate-controlled, well-lit environment with guaranteed quality, sizing, and spacious fitting rooms.',
      fashionCoreSplit: { fashion: 75, core: 25 },
    },
    catchmentDeepDive: {
      narrative: 'The Phoenix Mall catchment spans a 5km radius encompassing Bandra, Khar, and Lower Parel — some of Mumbai\'s most affluent residential corridors. Bandra West is Mumbai\'s "Queen of the Suburbs" and arguably the city\'s most cosmopolitan, vibrant, and affluent micro-market. The immediate radius encompasses Pali Hill, Carter Road, Perry Cross Road, and Mount Mary. A unique mix of old-money Catholic families, wealthy Gujarati/Sindhi business owners, high-earning expats, Bollywood celebrities, and young, highly-paid professionals (DINKs) working in media, advertising, and the nearby BKC financial hub.',
      incomeBands: [
        { band: '₹5–10 Lakh p.a.', percent: 10, profile: 'Legacy tenants, local street vendors' },
        { band: '₹10–20 Lakh p.a.', percent: 20, profile: 'Young starting professionals, students sharing PGs' },
        { band: '₹20–50 Lakh p.a.', percent: 40, profile: 'Mid-to-senior management, media professionals' },
        { band: '₹50 Lakh+ p.a.', percent: 30, profile: 'HNIs, expats, established business owners, celebrities' },
      ],
      culturalProfile: 'Highly diverse. Massive Catholic population driving huge demand for western dresses, gowns, and suits during Christmas/Easter. Strong Muslim affluent class driving high-value ethnic wear during Eid. Wealthy Gujarati/Marwari families driving heavy ethnic/Navratri/Diwali demand.',
      shoppingBehavior: 'Driven by "FOMO" and social events. Shoppers combine eating at legacy spots (Elco Panipuri) with retail therapy. Shopping is highly impulsive. Insane evening and weekend footfalls. Weekday mornings are slow, picking up post 4:00 PM. Weekends are chaotic and packed.',
      priceSensitivity: 'High-Low Market. Not strictly price-sensitive — will happily drop ₹2,500 on a premium dress if the styling is right. However, refuse to pay ₹1,000 for a "basic" t-shirt when export surplus is available for ₹250 on the pavement outside. Items must justify their price through design, fabric, and fit.',
    },
    competitiveLandscape: {
      intensityScore: 'EXTREME',
      biggestThreat: 'Westside and the Hill Road Street Market. Westside dominates the "chic ethnic/fusion" space that affluent Bandra women love. Meanwhile, the street market right outside captures all entry-level "budget fashion" shoppers. Zudio is also a major threat for the ₹299-₹999 price bracket.',
      gapsToExploit: 'Coordinated festive family-wear (matching sets), plus-size trendy fashion (highly underserved on the street market), and premium activewear/athleisure (street market quality is poor; Nike/Adidas are too expensive).',
      whatCompetitorsDoBetter: 'Zudio wins on visual merchandising and sheer trend turnover for Gen-Z. Westside wins on store ambiance and perceived brand premiumness. The street wins on price.',
    },
    demandSignals: {
      topCategories: [
        { rank: 1, category: 'Women\'s Smart Casuals / Party Wear', priceRange: '₹999 – ₹1,999', why: 'Flowy dresses, co-ord sets, crop tops. Driven by cafe/club culture.' },
        { rank: 2, category: 'Women\'s Ethnic Fusion', priceRange: '₹1,299 – ₹2,499', why: 'Breathable kurtas, palazzo sets, Indo-western styles for office/brunch.' },
        { rank: 3, category: 'Athleisure/Activewear', priceRange: '₹599 – ₹1,299', why: 'Joggers, sports bras, dri-fit tees. Bandstand/Carter Road jogging culture.' },
        { rank: 4, category: 'Men\'s Premium Casuals', priceRange: '₹899 – ₹1,599', why: 'Printed resort shirts, textured polos, linen trousers. BKC media/tech crowd doesn\'t wear stiff formals.' },
        { rank: 5, category: 'Kidswear (Event wear)', priceRange: '₹799 – ₹1,499', why: 'Cute dresses, smart boy\'s sets for birthday parties and brunches.' },
      ],
      underservedCategories: 'Men\'s streetwear/oversized fits (currently dominated by online D2C brands), and high-quality sustainable cottons at mid-tier pricing.',
      seasonalPatterns: [
        { period: 'Oct – Nov', pattern: 'Diwali & Wedding season. Peak ethnic wear.' },
        { period: 'December', pattern: 'Christmas & New Year. Peak western wear, party dresses, jackets. Not heavy woolens, just stylish layering.' },
        { period: 'Mar – May', pattern: 'Summer/Resort wear, swim coverups, shorts, cottons.' },
        { period: 'Jun – Sep', pattern: 'Monsoon wear. Cropped pants, synthetic easy-dry fabrics. Mumbai monsoons are brutal, long hemlines stop selling.' },
      ],
      weatherImpact: 'Hot and humid for 9 months of the year. Do not waste floor space on heavy winter wear (sweaters/woolens). Stick to light layering, denim jackets, and cotton blends.',
      onlineCompetition: 'Massive. Ajio, Myntra, and Nykaa capture a huge share of basic apparel. The physical store must offer flawless try-on experiences, instant gratification, and superior O2O (online-to-offline) integration.',
    },
    categoryMixRecommendation: [
      { category: 'Women\'s Western & Fusion', percent: 35, notes: 'Highlight Rio and Fig brands — keep styling young and chic.' },
      { category: 'Women\'s Ethnic Wear', percent: 20, notes: 'Highlight Avaasa — focus on premium fabrics, less on basic daily kurtas.' },
      { category: 'Men\'s Casual & Streetwear', percent: 20, notes: 'Over-index on DNMX oversized tees, Netplay linens, resort wear. Downplay formal suits.' },
      { category: 'Athleisure', percent: 10, notes: 'Teamspirit needs a front-and-center display.' },
      { category: 'Kidswear', percent: 10, notes: 'Focus on party and smart-casual.' },
      { category: 'Footwear & Accessories', percent: 5, notes: '' },
    ],
    priceArchitecture: [
      { band: 'Entry (<₹500)', percent: 10, rationale: 'Only to catch footfall bleeding in from street market looking for a quick bargain.' },
      { band: 'Mid (₹500 – ₹1,500)', percent: 40, rationale: 'The core revenue driver.' },
      { band: 'Premium (₹1,500+)', percent: 50, rationale: 'Catchment can afford it. Push highest-margin, highest-quality garments here.' },
    ],
    topActions: [
      { title: 'Aggressive Front-Window Merchandising', description: 'The street is intensely visually noisy. Window mannequins must display the most expensive, trendiest "Insta-worthy" outfits to pull the Gen-Z/Millennial shopper inside. Do not display basic kurtas in the window.' },
      { title: 'Premiumize the Trial Room Experience', description: 'Biggest advantage over street vendors is the ability to try clothes on. Make trial rooms pristine, well-lit (flattering lighting is crucial for this demographic), and heavily staffed for quick size swaps.' },
      { title: 'Hyper-Localize Assortment (The Bandra Edit)', description: 'Entirely remove heavy winter wear and traditional "small-town" synthetics. Stock up heavily on linen, breathable cottons, party wear, co-ord sets, and resort wear. Make the store feel like a boutique rather than a mass-market department store.' },
    ],
  },

  // Select Citywalk Delhi
  'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b': {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b',
    positioning: {
      statement: 'Premium Mall Destination',
      differentiator: 'The Wardrobe Refresh Hub. South Delhi shoppers compare across Zara, H&M, and Shoppers Stop before buying. Win by offering equivalent trend velocity at accessible price points with superior size availability.',
      fashionCoreSplit: { fashion: 70, core: 30 },
    },
    catchmentDeepDive: {
      narrative: 'Select Citywalk anchors a premium catchment spanning Greater Kailash, Saket, and Malviya Nagar. The trade area has the highest density of aspirational retail in Delhi, with Zara, H&M, and Shoppers Stop all within 400m. Home to senior professionals, entrepreneurs, and diplomatic families. The winter season (Nov-Feb) sees the strongest footfall driven by wedding and festive shopping.',
      incomeBands: [
        { band: '₹5–10 Lakh p.a.', percent: 8, profile: 'Service staff, small shop employees in Saket' },
        { band: '₹10–20 Lakh p.a.', percent: 18, profile: 'Young professionals, government employees' },
        { band: '₹20–50 Lakh p.a.', percent: 42, profile: 'Senior corporate, business owners, media professionals' },
        { band: '₹50 Lakh+ p.a.', percent: 32, profile: 'Entrepreneurs, diplomats, established families in GK-II' },
      ],
      culturalProfile: 'Cosmopolitan North Indian mix. Strong Punjabi influence drives wedding-wear demand (Nov-Feb is peak). Growing Bihari/UP professional population in Malviya Nagar. South Indian diaspora in CR Park adds Pongal/Onam demand. Karva Chauth, Lohri, and Diwali are the festive anchors.',
      shoppingBehavior: 'Weekend family outings dominate — Select Citywalk is a destination for dining + shopping combos. Weekday traffic is office lunch-break and post-work browsing from Saket corporates. Brand-conscious customers actively compare across Zara and H&M before purchasing. EOSS draws the largest footfall spikes of the year.',
      priceSensitivity: 'Premium-accepting but value-aware. Will pay ₹1,500+ for a well-designed kurta or formal shirt. Comparison shopping is the norm — perceived value matters more than absolute price. Wedding/occasion shopping is fully full-price; everyday shopping seeks offers.',
    },
    competitiveLandscape: {
      intensityScore: 'HIGH',
      biggestThreat: 'Zara Select Citywalk. Located in the same mall, Zara sets the visual merchandising and newness benchmark. Customers who walk past Zara and then enter our store immediately notice the VM gap. Shoppers Stop provides broad category coverage competition.',
      gapsToExploit: 'Affordable wedding-ready ethnic fusion (Zara doesn\'t do ethnic, Shoppers Stop is overpriced). Premium men\'s casual at ₹899-₹1,499 (gap between Zara\'s ₹1,990+ and Max\'s ₹599 ceiling). Kidswear for the GK-II family demographic.',
      whatCompetitorsDoBetter: 'Zara: VM displays feel dated compared to Zara next door (our 7/10 vs their 9/10). Shoppers Stop: deeper formal wear and beauty integration. H&M: faster trend cycle and better sustainability messaging.',
    },
    demandSignals: {
      topCategories: [
        { rank: 1, category: 'Men\'s Premium Casuals', priceRange: '₹999 – ₹1,799', why: 'Corporate professionals refreshing wardrobes. Smart casual dominates over formal. BFC media/IT crowd.' },
        { rank: 2, category: 'Women\'s Western', priceRange: '₹899 – ₹1,999', why: 'Young professionals and fashion-forward shoppers. Dresses, co-ords, blazers for work-to-evening transitions.' },
        { rank: 3, category: 'Women\'s Ethnic (Wedding/Festive)', priceRange: '₹1,499 – ₹2,999', why: 'Wedding season Nov-Feb is massive. Karva Chauth, sangeet, reception outfits.' },
        { rank: 4, category: 'Men\'s Formal', priceRange: '₹1,299 – ₹2,499', why: 'Unique demand driver from corporate + wedding circuit. Holds steady unlike other metros.' },
        { rank: 5, category: 'Kidswear (Premium)', priceRange: '₹699 – ₹1,299', why: 'GK-II families shop here on weekends. Birthday party and school event outfits.' },
      ],
      underservedCategories: 'Affordable wedding-ready fusion wear (₹1,500-₹3,000 range). Premium athleisure — Lululemon/Nike prices too high, but joggers market lacks good mid-tier options.',
      seasonalPatterns: [
        { period: 'Nov – Feb', pattern: 'Peak season. Wedding + winter + festive (Diwali, Karva Chauth, Lohri, Christmas). Ethnic and occasion-wear surge 30-40%.' },
        { period: 'Mar – Apr', pattern: 'Wedding tail + Delhi Fashion Week spillover. Western wear refreshes for spring.' },
        { period: 'May – Jun', pattern: 'EOSS. Volume spikes 40-50% but ASP drops. Summer casuals and cottons.' },
        { period: 'Jul – Sep', pattern: 'Monsoon lull. Footfall drops 15-20%. Focus on online integration and loyalty retention.' },
        { period: 'Oct', pattern: 'Pre-Diwali surge. Gifting, ethnic wear preparation, festive collections launch.' },
      ],
      weatherImpact: 'Delhi has real seasons. Winter (Dec-Feb) drives genuine winterwear demand — light jackets, sweaters, layering. Summer (Apr-Jun) is brutal heat requiring breathable cottons. Monsoon reduces footfall but doesn\'t shift category preference significantly.',
      onlineCompetition: 'High. Ajio leakage at 22% is the highest in the A+ cohort. Myntra strong for western basics. Need Ajio Rush integration to capture online-aware customer who wants instant delivery.',
    },
    categoryMixRecommendation: [
      { category: 'Men\'s Casual & Smart Casual', percent: 25, notes: 'Lead with smart casual. Over-index on resort shirts, chinos, linen.' },
      { category: 'Women\'s Western', percent: 25, notes: 'Work-to-evening transition pieces. Blazers, co-ords, dresses.' },
      { category: 'Women\'s Ethnic Wear', percent: 20, notes: 'Wedding-ready fusion. Premium Avaasa and occasion kurtas.' },
      { category: 'Men\'s Formal', percent: 10, notes: 'Maintain — unique demand here from corporate + wedding circuit.' },
      { category: 'Kidswear', percent: 10, notes: 'Premium party-wear for GK families.' },
      { category: 'Athleisure', percent: 5, notes: 'Growing but limited space — focus on key jogger/tee combos.' },
      { category: 'Footwear & Accessories', percent: 5, notes: '' },
    ],
    priceArchitecture: [
      { band: 'Entry (<₹500)', percent: 12, rationale: 'Catch value-seeker traffic. Basic tees and accessories.' },
      { band: 'Mid (₹500 – ₹1,500)', percent: 43, rationale: 'Core revenue driver. Everyday work and casual wear.' },
      { band: 'Premium (₹1,500+)', percent: 45, rationale: 'South Delhi affluence supports premium. Wedding and occasion-wear at full price.' },
    ],
    topActions: [
      { title: 'Close the VM Gap with Zara', description: 'Customers walk past Zara\'s 9/10 VM and then enter our store. Invest in display quality — better mannequin styling, editorial-quality visual narratives, and seasonal theme windows that compete on the same floor.' },
      { title: 'Own the ₹1,000-₹3,000 Wedding Edit', description: 'Zara doesn\'t do ethnic. Shoppers Stop is overpriced. Create a curated "Wedding Guest Edit" zone with fusion kurtas, cocktail dresses, and festive accessories that captures the Nov-Feb wedding circuit.' },
      { title: 'Launch Ajio Rush Integration', description: 'With 22% online leakage (highest in cohort), enable ship-from-store for Ajio Rush. Convert "browse online, try in store" behavior into a competitive advantage over pure-play e-commerce.' },
    ],
  },

  // UB City Bangalore
  '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42': {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42',
    positioning: {
      statement: 'Tech Professional\'s Fashion Destination',
      differentiator: 'The Smart Wardrobe Store. Bangalore\'s tech crowd wants quality without fuss — well-made, trend-aware pieces that work for both board meetings and Indiranagar bar crawls. Win by being the one store that does both equally well.',
      fashionCoreSplit: { fashion: 65, core: 35 },
    },
    catchmentDeepDive: {
      narrative: 'UB City is Bangalore\'s premier luxury retail destination, attracting a catchment from Vittal Mallya Road, Lavelle Road, and the Central Business District. Home to senior IT executives and startup founders. The catchment population is smaller (680 K vs 850 K for Mumbai) but spends more per capita on fashion. Weekend:weekday footfall ratio is 2.1x, lower than Mumbai\'s 3.2x, suggesting stronger weekday corporate shopping.',
      incomeBands: [
        { band: '₹5–10 Lakh p.a.', percent: 5, profile: 'Service sector, retail staff' },
        { band: '₹10–20 Lakh p.a.', percent: 15, profile: 'Junior IT professionals, startup early employees' },
        { band: '₹20–50 Lakh p.a.', percent: 45, profile: 'Senior engineers, tech leads, product managers' },
        { band: '₹50 Lakh+ p.a.', percent: 35, profile: 'Startup founders, VPs, NRI returnees, senior corporate' },
      ],
      culturalProfile: 'Cosmopolitan tech-driven culture. Significant Kannada, Tamil, and North Indian professional diaspora. Less festival-driven demand compared to Mumbai/Delhi — more consistent through the year. Bengaluru Tech Summit and corporate events create demand spikes. Restaurant/pub culture is a major lifestyle driver.',
      shoppingBehavior: 'Weekday corporate shopping is significant — lunch breaks and post-work visits account for 40% of traffic. Weekend visits are destination-driven with dining + shopping combos at UB City. Tech professionals prefer efficient, curated shopping — less browsing, more purposeful buying. High digital literacy means online research before in-store purchase.',
      priceSensitivity: 'Premium-accepting. Highest brand affluence score in the network (3.6). Tech professionals have high disposable income and willingly pay for quality. However, they are value-rational — will research price-to-quality ratios online before buying. Not impulse-driven.',
    },
    competitiveLandscape: {
      intensityScore: 'HIGH',
      biggestThreat: 'Shoppers Stop UB City (same building) and H&M Brigade Road. Shoppers Stop has a deeper formal wear selection and beauty counter integration. H&M captures the younger tech crowd with faster trend cycles and stronger sustainability positioning.',
      gapsToExploit: 'Premium smart-casual workwear (gap between Shoppers Stop\'s conservative formal and Zara\'s ₹2,000+ casual). Sustainable/eco-conscious fashion — Bangalore\'s tech crowd cares about this more than any other city. Women\'s tech-professional wear that bridges office and social.',
      whatCompetitorsDoBetter: 'Shoppers Stop: Formal wear depth, grooming products, loyalty program integration. H&M: Sustainability messaging, trend speed, digital marketing to young tech crowd. Zara (1 Mg Road Mall): Aspirational positioning and VM execution.',
    },
    demandSignals: {
      topCategories: [
        { rank: 1, category: 'Men\'s Smart Formal', priceRange: '₹1,299 – ₹2,499', why: 'One of the few stores where formal is growing (+10% YoY). Driven by corporate professional concentration in CBD.' },
        { rank: 2, category: 'Women\'s Western Contemporary', priceRange: '₹999 – ₹1,999', why: 'IT professionals want trend-aware pieces for both work and Indiranagar evenings. Growing +12% YoY.' },
        { rank: 3, category: 'Men\'s Premium Casual', priceRange: '₹899 – ₹1,599', why: 'Smart casual is the new formal for tech. Linen shirts, chinos, quality polos for office-to-bar transitions.' },
        { rank: 4, category: 'Women\'s Ethnic (Contemporary)', priceRange: '₹1,299 – ₹2,499', why: 'Steady demand from corporate Puja celebrations, team events, and festive seasons.' },
        { rank: 5, category: 'Athleisure', priceRange: '₹799 – ₹1,499', why: 'Running/gym culture is massive in Cubbon Park / Indiranagar. Weekend leisure wear demand.' },
      ],
      underservedCategories: 'Sustainable/eco-conscious fashion at mid-tier pricing. Tech-professional women\'s workwear that doesn\'t look "corporate boring." Premium basics (quality tees, well-cut trousers) at ₹800-₹1,200.',
      seasonalPatterns: [
        { period: 'Jan – Mar', pattern: 'Bengaluru Tech Summit (mid-Mar) + corporate events. Formal and smart-casual spike.' },
        { period: 'Apr – May', pattern: 'Summer heat. Breathable cottons, linens, light casual. New financial year drives work wardrobe refresh.' },
        { period: 'Jun – Sep', pattern: 'Monsoon but Bangalore rain is mild. Footfall stable. Good window for new launches.' },
        { period: 'Oct – Nov', pattern: 'Diwali + Dasara. Ethnic wear demand from Kannada and North Indian communities.' },
        { period: 'Dec', pattern: 'Year-end celebrations, Christmas, New Year parties. Western party-wear and gifting.' },
      ],
      weatherImpact: 'Bangalore\'s moderate climate (20-32°C year-round) means no extreme seasonal category shifts. No need for heavy winterwear ever. Light layering (denim jackets, light sweaters) works year-round. Rain is consistent but not monsoon-brutal like Mumbai.',
      onlineCompetition: 'Moderate. Tech-savvy customers research online extensively but prefer in-store for premium purchases. Ajio leakage at 15% is moderate. The bigger threat is D2C brands like Bewakoof, The Souled Store, and Bombay Shirt Company capturing the quality basics market.',
    },
    categoryMixRecommendation: [
      { category: 'Men\'s Formal & Smart Casual', percent: 25, notes: 'Unique strength — lean into it. Quality shirts, trousers, blazers.' },
      { category: 'Women\'s Western', percent: 25, notes: 'Contemporary work-to-evening pieces. Highlight quality and fit over pure trend.' },
      { category: 'Men\'s Premium Casual', percent: 15, notes: 'Linen, quality cotton, resort-casual. The tech wardrobe staples.' },
      { category: 'Women\'s Ethnic', percent: 15, notes: 'Contemporary ethnic, not traditional. Fusion pieces that work for office Puja and dinners.' },
      { category: 'Athleisure', percent: 10, notes: 'Strong Cubbon Park running culture. Weekend leisure demand.' },
      { category: 'Kidswear', percent: 5, notes: 'Lower family index — minimal but quality selection.' },
      { category: 'Footwear & Accessories', percent: 5, notes: '' },
    ],
    priceArchitecture: [
      { band: 'Entry (<₹500)', percent: 8, rationale: 'Minimal — this catchment doesn\'t come for bargains.' },
      { band: 'Mid (₹500 – ₹1,500)', percent: 42, rationale: 'The sweet spot. Quality everyday pieces at tech-professional price acceptance.' },
      { band: 'Premium (₹1,500+)', percent: 50, rationale: 'Highest premium absorption in the network. Lean into it — 50% of sales already here.' },
    ],
    topActions: [
      { title: 'Create the "Office to Out" Zone', description: 'Dedicated merchandising area showing complete looks for work-to-social transitions. Pair formal trousers with casual blazers, add a pair of white sneakers. Style it editorially — not department-store flat.' },
      { title: 'Sustainability Messaging on Floor', description: 'Bangalore\'s tech crowd cares about sustainability more than any other city. Add shelf talkers for organic cotton, sustainable packaging, BCI cotton. Tell the story — it justifies the premium.' },
      { title: 'Leverage Weekday Corporate Traffic', description: 'Unlike other stores that are weekend-dependent, this store has strong weekday traffic. Create a "Lunch Break Edit" — curated, quick-pick racks near the entrance for professionals who have 20 minutes to browse. Speed + curation > depth.' },
    ],
  },

  // Inorbit Mall Hyderabad
  'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97': {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97',
    positioning: {
      statement: 'Family Value Champion',
      differentiator: 'One-Stop Family Fashion Store. HITEC City families want to clothe the entire family in a single trip without breaking the bank. Win by being the only store where mom, dad, and both kids walk out with bags — at a price that doesn\'t sting.',
      fashionCoreSplit: { fashion: 55, core: 45 },
    },
    catchmentDeepDive: {
      narrative: 'Inorbit Mall serves a catchment spanning Madhapur, Kondapur, and HITEC City — Hyderabad\'s technology corridor. The catchment population of 620 K has been growing rapidly (+8% in 2 years) as new residential developments come online. A new Westside store opened within 1km in Q4 2025, intensifying competition. The area is distinctly family-oriented with moderate affluence reflecting a mix of IT professionals and value-seeking families.',
      incomeBands: [
        { band: '₹5–10 Lakh p.a.', percent: 15, profile: 'Support staff, BPO employees, local shopkeepers' },
        { band: '₹10–20 Lakh p.a.', percent: 35, profile: 'Junior-mid IT professionals, 2-5 year experience' },
        { band: '₹20–50 Lakh p.a.', percent: 35, profile: 'Senior IT professionals, team leads, managers' },
        { band: '₹50 Lakh+ p.a.', percent: 15, profile: 'IT directors, entrepreneurs, established families in Jubilee Hills' },
      ],
      culturalProfile: 'Telugu-dominant with significant influx of North Indian and Tamil IT professionals. Strong Dasara/Sankranti demand driving ethnic wear. Bathukamma festival is a unique Telangana cultural event creating saree and ethnic accessory demand. Eid is significant with the Tolichowki/Mehdipatnam Muslim community overlapping the catchment edge.',
      shoppingBehavior: 'Weekend family outings to Inorbit Mall dominate. Shopping is planned and purposeful — not impulse-driven. Value comparison before purchase is standard. EOSS events generate the highest footfall (40-50% volume spike). Pay-day cycles visible in first-week-of-month traffic spikes.',
      priceSensitivity: 'Value-conscious but not cheap. Will pay ₹999-₹1,499 for good quality ethnic or casual wear. Resistant to ₹2,000+ price points unless for occasion-wear. The "per piece" mental math is strong — families calculate total basket cost carefully.',
    },
    competitiveLandscape: {
      intensityScore: 'HIGH',
      biggestThreat: 'Westside Jubilee Hills (new store, 1km away). Strong brand recognition in ethnic and western. Pantaloons Inorbit is in the same mall offering similar value positioning. The combination of Westside\'s brand pull and Pantaloons\' proximity creates a pincer.',
      gapsToExploit: 'Complete family outfit solutions (no competitor does "matching family festive-wear" well). Boys\' fashion (8-14 age group is severely underserved — only Max and V-Mart compete, both weak on trend). Value athleisure for the growing HITEC City running community.',
      whatCompetitorsDoBetter: 'Westside: Better ethnic curation and premium perception. Pantaloons: Stronger loyalty program and EOSS marketing. Max: Lower entry price points on basics. V-Mart: Deeper value options.',
    },
    demandSignals: {
      topCategories: [
        { rank: 1, category: 'Women\'s Ethnic Wear', priceRange: '₹799 – ₹1,499', why: 'Dasara, Sankranti, Bathukamma, and wedding season create year-round ethnic demand. The primary purchase driver.' },
        { rank: 2, category: 'Men\'s Casual', priceRange: '₹599 – ₹1,299', why: 'IT professional wardrobe refresh. T-shirts, chinos, polos. Practical over fashionable.' },
        { rank: 3, category: 'Kidswear (Full Range)', priceRange: '₹499 – ₹999', why: 'Family Index 68 is one of the highest. Both everyday school-wear and occasion outfits sell well.' },
        { rank: 4, category: 'Women\'s Western Casual', priceRange: '₹699 – ₹1,299', why: 'Growing among younger IT professional women. Tops, jeans, casual dresses for weekend outings.' },
        { rank: 5, category: 'Men\'s Formal', priceRange: '₹999 – ₹1,799', why: 'Steady demand from HITEC City corporate dress codes. Shirts and trousers are staple purchases.' },
      ],
      underservedCategories: 'Boys\' trend-led fashion (8-14 years). Family festive matching sets. Value athleisure between ₹499-₹999 (gap between V-Mart quality and Nike/Adidas pricing).',
      seasonalPatterns: [
        { period: 'Jan', pattern: 'Sankranti/Pongal. Strong ethnic demand — pattu pavadai, traditional sarees.' },
        { period: 'Mar – Apr', pattern: 'Holi + Ugadi. Festive wear followed by new financial year work wardrobe refresh.' },
        { period: 'Jun – Jul', pattern: 'Bonalu festival + school reopening. Kids uniforms + ethnic wear.' },
        { period: 'Aug – Sep', pattern: 'Bathukamma + Dasara. The biggest festive window for Telangana — ethnic surges 35-40%.' },
        { period: 'Oct – Nov', pattern: 'Diwali + wedding season onset. Broad category lift.' },
        { period: 'Dec – Jan', pattern: 'EOSS. Massive volume spike. Clear aging inventory.' },
      ],
      weatherImpact: 'Hyderabad is hot (35-42°C) from March to June. Cotton and breathable fabrics essential. Monsoon (Jul-Sep) is moderate — doesn\'t crush footfall like Mumbai. Winter is mild — no winterwear demand beyond light jackets. Year-round warm-weather assortment is the default.',
      onlineCompetition: 'Moderate. Online leakage 14%. Myntra strong for basics and western casual. But families still prefer in-store for kidswear (sizing) and ethnic wear (fabric feel). Biggest risk is Ajio Rush if it launches in this catchment.',
    },
    categoryMixRecommendation: [
      { category: 'Women\'s Ethnic Wear', percent: 25, notes: 'Lead category. Daily-wear kurtas + festive sarees. Avaasa for premium, basics for volume.' },
      { category: 'Men\'s Casual', percent: 20, notes: 'IT professional staples. T-shirts, chinos, polos at value price points.' },
      { category: 'Kidswear', percent: 20, notes: 'Above-average allocation. Both everyday and party-wear. Boys\' fashion opportunity.' },
      { category: 'Women\'s Western', percent: 15, notes: 'Growing category. Casual tops, jeans, dresses for younger IT demographic.' },
      { category: 'Men\'s Formal', percent: 10, notes: 'Steady demand. Shirts and trousers focus. Don\'t over-allocate.' },
      { category: 'Athleisure', percent: 5, notes: 'Emerging. Value joggers and tees for HITEC City health-conscious crowd.' },
      { category: 'Footwear & Accessories', percent: 5, notes: '' },
    ],
    priceArchitecture: [
      { band: 'Entry (<₹500)', percent: 22, rationale: 'Important for family shopping economics. Kids basics, men\'s undershirts, accessories.' },
      { band: 'Mid (₹500 – ₹1,500)', percent: 53, rationale: 'The heartland. Core ethnic kurtas, men\'s casual shirts, kidswear sets.' },
      { band: 'Premium (₹1,500+)', percent: 25, rationale: 'Occasion and festive wear. Pattu sarees, wedding-ready ethnic, premium formal.' },
    ],
    topActions: [
      { title: 'Launch "Family Festival Packs"', description: 'Create co-ordinated festive family outfits for Dasara, Sankranti, and Diwali. Bundle mom + dad + 2 kids ethnic sets at ₹3,999-₹5,999. No competitor does this well — it\'s a unique value proposition for this family-heavy catchment.' },
      { title: 'Fix Size Availability (Critical)', description: 'Size availability at 78% is the biggest pain point. Customers are leaving because they can\'t find their size — especially in Women\'s Ethnic (size L/XL) and Kidswear. This is recoverable revenue of ₹3.2 L/month. Fix the replenishment cycle.' },
      { title: 'Counter the Westside Threat', description: 'New Westside 1km away is pulling ethnic and western traffic. Respond with aggressive pricing on ethnic entry-points (₹699-₹999 kurtas), stronger VM on the ethnic floor, and a "price match" perception campaign through strategic signage.' },
    ],
  },

  // Quest Mall Kolkata
  '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20': {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20',
    positioning: {
      statement: 'Cultural Heritage Fashion Hub',
      differentiator: 'The Puja-to-Party Wardrobe. Kolkata shoppers have deep cultural pride and strong opinions about fashion. Win by curating an assortment that respects ethnic heritage while offering contemporary freshness — the store that understands both Durga Puja sarees and Saturday night party dresses.',
      fashionCoreSplit: { fashion: 60, core: 40 },
    },
    catchmentDeepDive: {
      narrative: 'Quest Mall serves the premium Southern Kolkata catchment — Ballygunge, Alipore, and Park Street. This is old-money Kolkata — educated, cultured, and deeply opinionated about fashion and quality. The area has lower footfall than Mumbai or Delhi malls but higher conversion rates and basket values. The cultural calendar (Durga Puja, Diwali, Christmas) drives extreme demand seasonality.',
      incomeBands: [
        { band: '₹5–10 Lakh p.a.', percent: 12, profile: 'Young graduates, small business employees' },
        { band: '₹10–20 Lakh p.a.', percent: 25, profile: 'Mid-level professionals, government employees, teachers' },
        { band: '₹20–50 Lakh p.a.', percent: 40, profile: 'Senior professionals, established traders, doctors, lawyers' },
        { band: '₹50 Lakh+ p.a.', percent: 23, profile: 'Business families in Alipore, senior corporate, NRIs' },
      ],
      culturalProfile: 'Strongly Bengali. Durga Puja (Oct) is the single biggest demand event — not just ethnic but complete wardrobe overhaul. Dhoti-kurta demand for men during Puja is unique to this market. Christmas/New Year is significant (Anglo-Indian and progressive Bengali influence). Holi drives casual/festive casual demand. Poila Boishakh (Bengali New Year, Apr) creates a secondary ethnic spike.',
      shoppingBehavior: 'Quality-over-quantity mindset. Kolkata shoppers buy fewer pieces but inspect each carefully — fabric feel, stitching quality, and finishing matter enormously. They are vocal critics and loyal advocates. Weekend shopping is dominant. Pandal-hopping during Puja drives massive impulse buying. Book Fair (Jan-Feb) creates adjacent footfall opportunity.',
      priceSensitivity: 'Price-conscious but quality-aware. Will pay premium for perceived quality and fit but will walk away from anything that feels overpriced for its construction. The "paisa vasool" (value for money) metric is applied rigorously. Discount-responsive — EOSS loyalty is very high.',
    },
    competitiveLandscape: {
      intensityScore: 'MEDIUM',
      biggestThreat: 'Pantaloons Park Street has broader category coverage and stronger ethnic range. Shoppers Stop South City has deeper premium positioning. The biggest implicit threat is the strong unorganized saree/ethnic market in Gariahat and New Market which captures significant ethnic wallet share.',
      gapsToExploit: 'Contemporary Bengali-inflected ethnic fusion (cotton saree blouses paired with modern palazzos). Premium men\'s casual at ₹999-₹1,599 — gap between Pantaloons\' basic range and Shoppers Stop\'s formal focus. Puja-specific pop-up collections.',
      whatCompetitorsDoBetter: 'Pantaloons: Stronger product range — "too few options" is the top customer complaint. Shoppers Stop: Better store ambiance and premium perception. Gariahat market: Unbeatable ethnic saree depth and pricing.',
    },
    demandSignals: {
      topCategories: [
        { rank: 1, category: 'Women\'s Ethnic (Sarees & Kurtas)', priceRange: '₹999 – ₹2,499', why: 'Cultural identity drives ethnic demand. Cotton sarees, tant sarees, and premium kurtas for Puja, weddings, and daily wear.' },
        { rank: 2, category: 'Men\'s Casual', priceRange: '₹799 – ₹1,499', why: 'Quality polos, linen shirts, smart casual. Bengali men care about fabric quality and fit.' },
        { rank: 3, category: 'Women\'s Western (Party)', priceRange: '₹999 – ₹1,799', why: 'Growing among young professionals. Christmas/New Year party wear and Park Street nightlife demand.' },
        { rank: 4, category: 'Men\'s Ethnic (Puja-specific)', priceRange: '₹899 – ₹1,999', why: 'Dhoti-kurta sets for Puja are unique to this market. Seasonal but high-value.' },
        { rank: 5, category: 'Kidswear', priceRange: '₹599 – ₹1,199', why: 'Family shopping hub — "almost nothing for children despite being a family mall" is a live complaint.' },
      ],
      underservedCategories: 'Kidswear is severely underserved (top customer complaint). Contemporary Bengali ethnic fusion — cotton saree-inspired tops, tant-fabric dresses. Plus-size fashion across all categories — demand is vocal but supply is thin.',
      seasonalPatterns: [
        { period: 'Oct', pattern: 'DURGA PUJA. The single biggest event. Ethnic wear surges 60-80%. Complete wardrobe overhaul for many families. Plan 4-6 weeks ahead.' },
        { period: 'Nov – Dec', pattern: 'Diwali + Christmas/New Year. Western party-wear and gifting. Kali Puja adds another ethnic moment.' },
        { period: 'Jan – Feb', pattern: 'Saraswati Puja (Jan). Book Fair adjacent footfall. Post-festive lull otherwise. EOSS opportunity.' },
        { period: 'Apr', pattern: 'Poila Boishakh (Bengali New Year). Secondary ethnic demand spike — cotton sarees, tant.' },
        { period: 'May – Jun', pattern: 'Summer heat + EOSS. Volume-driven. Light cottons and casual wear.' },
        { period: 'Jul – Sep', pattern: 'Monsoon. Moderate footfall drop. Pre-Puja planning and early Puja collection launches (Sep end).' },
      ],
      weatherImpact: 'Hot and humid Apr-Sep, pleasant Oct-Feb. Winter (Dec-Jan) is mild but Kolkata enjoys "winter fashion" — sweaters, shawls, light wool. Don\'t skip winterwear entirely unlike Mumbai. Monsoon reduces footfall moderately. Cotton is king year-round.',
      onlineCompetition: 'Moderate. Online penetration growing but Kolkata shoppers still trust in-store for ethnic wear (fabric feel is paramount). Myntra is the main threat for western casual and men\'s basics. Local e-tailers for sarees. Online leakage 12%.',
    },
    categoryMixRecommendation: [
      { category: 'Women\'s Ethnic Wear', percent: 30, notes: 'Lead category. Cotton sarees, tant, premium kurtas. Must-win for Puja season.' },
      { category: 'Men\'s Casual', percent: 20, notes: 'Quality fabrics. Linen, cotton. Bengali men notice stitching quality.' },
      { category: 'Women\'s Western', percent: 15, notes: 'Growing for young professionals. Party-wear focus for Christmas/NY.' },
      { category: 'Kidswear', percent: 15, notes: 'CRITICAL gap to fill. Top customer complaint is "almost nothing for children." Double current allocation.' },
      { category: 'Men\'s Ethnic', percent: 10, notes: 'Seasonal but high-value. Dhoti-kurta sets for Puja, kurtas for Poila Boishakh.' },
      { category: 'Athleisure & Accessories', percent: 10, notes: 'Combined. Light activewear + winter accessories (shawls, scarves).' },
    ],
    priceArchitecture: [
      { band: 'Entry (<₹500)', percent: 15, rationale: 'Basics, kids essentials, accessories. The value-conscious Kolkata shopper needs an entry point.' },
      { band: 'Mid (₹500 – ₹1,500)', percent: 50, rationale: 'Core revenue. Quality ethnic kurtas, men\'s casual, everyday wear.' },
      { band: 'Premium (₹1,500+)', percent: 35, rationale: 'Premium sarees, occasion ethnic, quality formal. Kolkata pays premium for quality — not for brand.' },
    ],
    topActions: [
      { title: 'Fix the Kidswear Gap (Urgent)', description: '"Almost nothing for children despite being a family mall" is the #1 customer complaint. Double kidswear allocation immediately. Add both everyday school-wear and premium occasion outfits. This is free revenue — demand exists, supply doesn\'t.' },
      { title: 'Create a Puja Destination (4-Week Pop-Up)', description: 'Build a dedicated "Puja Edit" zone in September. Curated ethnic collections for men, women, and kids. Pandal-hopping outfit ideas. Family matching sets. This is Kolkata\'s Christmas — make it feel special, not transactional.' },
      { title: 'Expand Option Count Across Categories', description: '"Too few options" is the second most common complaint. Customers compare this store unfavorably to Pantaloons\' breadth. Increase option depth in Women\'s Ethnic (+40 options), Men\'s Casual (+25 options), and Kidswear (+30 options). Breadth drives dwell time drives conversion.' },
    ],
  },
};
