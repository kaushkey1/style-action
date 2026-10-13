import type { Store, StoreGrade } from '../types/unified-planning.types';
import type { ClusterId } from '../types/storeIntelligence.types';
import { CANONICAL_STORES, seededUUID } from '@/data/canonicalStores';
import type { CanonicalStore } from '@/data/canonicalStores';

// Seeded PRNG (mulberry32) — deterministic across refreshes
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CityDef {
  name: string;
  state: string;
  region: 'North' | 'South' | 'East' | 'West';
  lat: number;
  lng: number;
  tier: 1 | 2 | 3;
}

const CITIES: CityDef[] = [
  // Tier 1
  { name: 'Mumbai', state: 'Maharashtra', region: 'West', lat: 19.076, lng: 72.8777, tier: 1 },
  { name: 'Delhi', state: 'Delhi', region: 'North', lat: 28.6139, lng: 77.209, tier: 1 },
  { name: 'Bangalore', state: 'Karnataka', region: 'South', lat: 12.9716, lng: 77.5946, tier: 1 },
  { name: 'Chennai', state: 'Tamil Nadu', region: 'South', lat: 13.0827, lng: 80.2707, tier: 1 },
  { name: 'Hyderabad', state: 'Telangana', region: 'South', lat: 17.385, lng: 78.4867, tier: 1 },
  { name: 'Kolkata', state: 'West Bengal', region: 'East', lat: 22.5726, lng: 88.3639, tier: 1 },
  { name: 'Pune', state: 'Maharashtra', region: 'West', lat: 18.5204, lng: 73.8567, tier: 1 },
  { name: 'Ahmedabad', state: 'Gujarat', region: 'West', lat: 23.0225, lng: 72.5714, tier: 1 },
  // Tier 2
  { name: 'Jaipur', state: 'Rajasthan', region: 'North', lat: 26.9124, lng: 75.7873, tier: 2 },
  { name: 'Lucknow', state: 'Uttar Pradesh', region: 'North', lat: 26.8467, lng: 80.9462, tier: 2 },
  { name: 'Chandigarh', state: 'Chandigarh', region: 'North', lat: 30.7333, lng: 76.7794, tier: 2 },
  { name: 'Indore', state: 'Madhya Pradesh', region: 'West', lat: 22.7196, lng: 75.8577, tier: 2 },
  { name: 'Nagpur', state: 'Maharashtra', region: 'West', lat: 21.1458, lng: 79.0882, tier: 2 },
  { name: 'Surat', state: 'Gujarat', region: 'West', lat: 21.1702, lng: 72.8311, tier: 2 },
  { name: 'Kochi', state: 'Kerala', region: 'South', lat: 9.9312, lng: 76.2673, tier: 2 },
  { name: 'Coimbatore', state: 'Tamil Nadu', region: 'South', lat: 11.0168, lng: 76.9558, tier: 2 },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', region: 'South', lat: 17.6868, lng: 83.2185, tier: 2 },
  { name: 'Patna', state: 'Bihar', region: 'East', lat: 25.6093, lng: 85.1376, tier: 2 },
  { name: 'Bhubaneswar', state: 'Odisha', region: 'East', lat: 20.2961, lng: 85.8245, tier: 2 },
  { name: 'Guwahati', state: 'Assam', region: 'East', lat: 26.1445, lng: 91.7362, tier: 2 },
  { name: 'Dehradun', state: 'Uttarakhand', region: 'North', lat: 30.3165, lng: 78.0322, tier: 2 },
  { name: 'Vadodara', state: 'Gujarat', region: 'West', lat: 22.3072, lng: 73.1812, tier: 2 },
  { name: 'Thiruvananthapuram', state: 'Kerala', region: 'South', lat: 8.5241, lng: 76.9366, tier: 2 },
  { name: 'Mysore', state: 'Karnataka', region: 'South', lat: 12.2958, lng: 76.6394, tier: 2 },
  // Tier 3
  { name: 'Ranchi', state: 'Jharkhand', region: 'East', lat: 23.3441, lng: 85.3096, tier: 3 },
  { name: 'Raipur', state: 'Chhattisgarh', region: 'East', lat: 21.2514, lng: 81.6296, tier: 3 },
  { name: 'Jodhpur', state: 'Rajasthan', region: 'North', lat: 26.2389, lng: 73.0243, tier: 3 },
  { name: 'Udaipur', state: 'Rajasthan', region: 'North', lat: 24.5854, lng: 73.7125, tier: 3 },
  { name: 'Aurangabad', state: 'Maharashtra', region: 'West', lat: 19.8762, lng: 75.3433, tier: 3 },
  { name: 'Mangalore', state: 'Karnataka', region: 'South', lat: 12.9141, lng: 74.856, tier: 3 },
  { name: 'Madurai', state: 'Tamil Nadu', region: 'South', lat: 9.9252, lng: 78.1198, tier: 3 },
  { name: 'Varanasi', state: 'Uttar Pradesh', region: 'North', lat: 25.3176, lng: 82.9739, tier: 3 },
  { name: 'Amritsar', state: 'Punjab', region: 'North', lat: 31.634, lng: 74.8723, tier: 3 },
  { name: 'Agra', state: 'Uttar Pradesh', region: 'North', lat: 27.1767, lng: 78.0081, tier: 3 },
  { name: 'Nashik', state: 'Maharashtra', region: 'West', lat: 19.9975, lng: 73.7898, tier: 3 },
  { name: 'Hubli', state: 'Karnataka', region: 'South', lat: 15.3647, lng: 75.124, tier: 3 },
  { name: 'Jalandhar', state: 'Punjab', region: 'North', lat: 31.326, lng: 75.5762, tier: 3 },
  { name: 'Gwalior', state: 'Madhya Pradesh', region: 'North', lat: 26.2183, lng: 78.1828, tier: 3 },
  { name: 'Siliguri', state: 'West Bengal', region: 'East', lat: 26.7271, lng: 88.3953, tier: 3 },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', region: 'South', lat: 10.7905, lng: 78.7047, tier: 3 },
];

const MALL_NAMES = [
  'Phoenix Mall', 'Select Citywalk', 'UB City', 'Express Avenue', 'Inorbit Mall',
  'Phoenix Marketcity', 'Quest Mall', 'Palladium', 'World Trade Park', 'Lulu Mall',
  'Forum Mall', 'Nexus Mall', 'Viviana Mall', 'Oberoi Mall', 'DB Mall',
  'Elante Mall', 'Treasure Island', 'South City Mall', 'Mantri Square', 'GT Central',
  'City Centre', 'Pacific Mall', 'Galleria Market', 'Central Mall', 'Prozone Mall',
  'Alpha One Mall', 'Crystal Mall', 'Wave Mall', 'Unity One Mall', 'Elements Mall',
  'Ambience Mall', 'DLF Promenade', 'Cosmos Mall', 'Centre Square', 'Garuda Mall',
  'Brigade Road', 'Acropolis Mall', 'City Mall', 'Sapphire Mall', 'Star Mall',
  'Grand Mall', 'Royal Mall', 'Crown Mall', 'Heritage Mall', 'Metro Mall',
  'Cross River Mall', 'SRS Mall', 'Esplanade One', 'Park Mall', 'P&M Mall',
];

const CATEGORIES = ['mens-casual', 'mens-formal', 'womens-ethnic', 'womens-western', 'kids-wear'] as const;

const GRADE_DISTRIBUTION: { grade: StoreGrade; weight: number }[] = [
  { grade: 'A+', weight: 0.05 },
  { grade: 'A1', weight: 0.10 },
  { grade: 'A2', weight: 0.15 },
  { grade: 'B1', weight: 0.25 },
  { grade: 'B2', weight: 0.30 },
  { grade: 'C1', weight: 0.15 },
];

const CLUSTER_LABELS: Record<ClusterId, string> = {
  C1: 'Metro Fashion Hub',
  C2: 'Metro Value',
  C3: 'Suburban Family',
  C4: 'Tier-2 Aspirational',
  C5: 'Tier-2/3 Value',
  C6: 'High-Street Premium',
  C7: 'SmartBazaar Adjacent',
  C8: 'Outlet Store',
};

function pickGrade(rand: number): StoreGrade {
  let cumulative = 0;
  for (const { grade, weight } of GRADE_DISTRIBUTION) {
    cumulative += weight;
    if (rand < cumulative) return grade;
  }
  return 'B2';
}

// Grade → base sqft range and revenue-per-sqft
const GRADE_CONFIG: Record<string, { sqftMin: number; sqftMax: number; revPerSqft: number; scoreBase: number; catCount: number }> = {
  'A+': { sqftMin: 10000, sqftMax: 15000, revPerSqft: 380, scoreBase: 88, catCount: 4 },
  'A': { sqftMin: 9000, sqftMax: 13000, revPerSqft: 350, scoreBase: 85, catCount: 4 },
  'A1': { sqftMin: 8000, sqftMax: 12000, revPerSqft: 320, scoreBase: 82, catCount: 4 },
  'A2': { sqftMin: 6500, sqftMax: 9500, revPerSqft: 270, scoreBase: 76, catCount: 3 },
  'A3': { sqftMin: 5000, sqftMax: 8000, revPerSqft: 220, scoreBase: 68, catCount: 3 },
  'B': { sqftMin: 4500, sqftMax: 7000, revPerSqft: 210, scoreBase: 66, catCount: 3 },
  'B1': { sqftMin: 5000, sqftMax: 8000, revPerSqft: 230, scoreBase: 70, catCount: 3 },
  'B2': { sqftMin: 3500, sqftMax: 6500, revPerSqft: 190, scoreBase: 62, catCount: 2 },
  'C': { sqftMin: 3000, sqftMax: 5500, revPerSqft: 160, scoreBase: 58, catCount: 2 },
  'C1': { sqftMin: 2500, sqftMax: 5000, revPerSqft: 150, scoreBase: 55, catCount: 2 },
  'C2': { sqftMin: 2000, sqftMax: 4500, revPerSqft: 140, scoreBase: 52, catCount: 2 },
  'D': { sqftMin: 1500, sqftMax: 3500, revPerSqft: 120, scoreBase: 48, catCount: 2 },
};

// City tier lookup for canonical stores
const CITY_TIER: Record<string, 1 | 2 | 3> = {};
for (const city of CITIES) {
  CITY_TIER[city.name] = city.tier;
}

// City → state lookup for canonical stores
const CITY_STATE: Record<string, string> = {};
for (const city of CITIES) {
  CITY_STATE[city.name] = city.state;
}

// City lat/lng lookup for canonical stores
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {};
for (const city of CITIES) {
  CITY_COORDS[city.name] = { lat: city.lat, lng: city.lng };
}

/** Map a canonical store to the generator's Store format using the PRNG for derived fields */
function canonicalToStore(cs: CanonicalStore, rand: () => number): Store {
  const config = GRADE_CONFIG[cs.grade] ?? GRADE_CONFIG['B2']!;

  // Sqft with variance
  const sqft = Math.round(config.sqftMin + rand() * (config.sqftMax - config.sqftMin));

  // Revenue correlated to grade/sqft with ±15% variance
  const revenueVariance = 0.85 + rand() * 0.3;
  const monthlyRevenue = Math.round(sqft * config.revPerSqft * revenueVariance);

  // Score correlated to grade with ±5 variance
  const score = Math.min(99, Math.max(40, Math.round(config.scoreBase + (rand() - 0.5) * 10)));

  // Categories by grade
  const shuffled = [...CATEGORIES].sort(() => rand() - 0.5);
  const categories = shuffled.slice(0, config.catCount);

  // Options correlated to sqft
  const options = Math.round(sqft * (0.08 + rand() * 0.04));

  // City tier for cluster assignment
  const tier = CITY_TIER[cs.city] ?? 2;

  // Cluster assignment — tier 1 cities get metro clusters, tier 3 get value clusters
  let cluster: ClusterId;
  if (tier === 1) {
    const opts: ClusterId[] = ['C1', 'C2', 'C6'];
    cluster = opts[Math.floor(rand() * opts.length)]!;
  } else if (tier === 2) {
    const opts: ClusterId[] = ['C2', 'C3', 'C4', 'C6'];
    cluster = opts[Math.floor(rand() * opts.length)]!;
  } else {
    const opts: ClusterId[] = ['C4', 'C5', 'C7', 'C8'];
    cluster = opts[Math.floor(rand() * opts.length)]!;
  }

  // Lat/lng with small random offset so stores in the same city don't stack
  const coords = CITY_COORDS[cs.city];
  const latitude = (coords?.lat ?? 20) + (rand() - 0.5) * 0.1;
  const longitude = (coords?.lng ?? 77) + (rand() - 0.5) * 0.1;

  return {
    id: cs.id,
    name: cs.name,
    format: '',
    grade: cs.grade as StoreGrade,
    region: cs.region,
    city: cs.city,
    state: cs.state ?? CITY_STATE[cs.city] ?? '',
    sqft,
    monthlyRevenue,
    potentialNPI: +(monthlyRevenue / 100000).toFixed(1),
    recoNPI: +(97 + rand() * 15).toFixed(1),
    ctrSth: +(8 + rand() * 28).toFixed(1),
    options,
    score,
    categories,
    latitude,
    longitude,
    cluster,
    clusterLabel: CLUSTER_LABELS[cluster],
    competitiveGapScore: Math.round(30 + rand() * 60),
    catchmentAffluence: Math.round(30 + rand() * 60),
    twinGapSpsf: Math.round(30 + rand() * 200),
    hasReclassificationTrigger: rand() < 0.15,
  };
}

export function generateStores(count: number): Store[] {
  const rand = mulberry32(42); // fixed seed for deterministic output

  const stores: Store[] = [];

  // Emit canonical stores first (indices 0–55)
  for (const cs of CANONICAL_STORES) {
    stores.push(canonicalToStore(cs, rand));
  }

  // Generate remaining stores to reach the requested count
  const remaining = count - CANONICAL_STORES.length;
  let mallNameIndex = 0;

  for (let i = 0; i < remaining; i++) {
    const city = CITIES[Math.floor(rand() * CITIES.length)]!;
    const grade = pickGrade(rand());
    const config = GRADE_CONFIG[grade]!;

    // Sqft with variance
    const sqft = Math.round(config.sqftMin + rand() * (config.sqftMax - config.sqftMin));

    // Revenue correlated to grade/sqft with ±15% variance
    const revenueVariance = 0.85 + rand() * 0.3;
    const monthlyRevenue = Math.round(sqft * config.revPerSqft * revenueVariance);

    // Score correlated to grade with ±5 variance
    const score = Math.min(99, Math.max(40, Math.round(config.scoreBase + (rand() - 0.5) * 10)));

    // Categories by grade
    const shuffled = [...CATEGORIES].sort(() => rand() - 0.5);
    const categories = shuffled.slice(0, config.catCount);

    // Options correlated to sqft
    const options = Math.round(sqft * (0.08 + rand() * 0.04));

    // Cluster assignment — tier 1 cities get metro clusters, tier 3 get value clusters
    let cluster: ClusterId;
    if (city.tier === 1) {
      const opts: ClusterId[] = ['C1', 'C2', 'C6'];
      cluster = opts[Math.floor(rand() * opts.length)]!;
    } else if (city.tier === 2) {
      const opts: ClusterId[] = ['C2', 'C3', 'C4', 'C6'];
      cluster = opts[Math.floor(rand() * opts.length)]!;
    } else {
      const opts: ClusterId[] = ['C4', 'C5', 'C7', 'C8'];
      cluster = opts[Math.floor(rand() * opts.length)]!;
    }

    // Mall name — cycle through then generate numbered variants
    const mallName = MALL_NAMES[mallNameIndex % MALL_NAMES.length];
    mallNameIndex++;

    // Lat/lng with small random offset so stores in the same city don't stack
    const latitude = city.lat + (rand() - 0.5) * 0.1;
    const longitude = city.lng + (rand() - 0.5) * 0.1;

    stores.push({
      id: seededUUID(rand),
      name: `${city.name} - ${mallName}`,
      format: '',
      grade,
      region: city.region,
      city: city.name,
      state: city.state,
      sqft,
      monthlyRevenue,
      potentialNPI: +(monthlyRevenue / 100000).toFixed(1),
      recoNPI: +(97 + rand() * 15).toFixed(1),
      ctrSth: +(8 + rand() * 28).toFixed(1),
      options,
      score,
      categories,
      latitude,
      longitude,
      cluster,
      clusterLabel: CLUSTER_LABELS[cluster],
      competitiveGapScore: Math.round(30 + rand() * 60),
      catchmentAffluence: Math.round(30 + rand() * 60),
      twinGapSpsf: Math.round(30 + rand() * 200),
      hasReclassificationTrigger: rand() < 0.15,
    });
  }

  return stores;
}
