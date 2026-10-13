// ─── Canonical Store Registry ──────────────────────────────────────────────
// Single source of truth for ALL stores referenced in the application.
// Every mock data module must reference stores from this registry.
//
// Organized by region (West, North, South, East, Central), then city.
// Grade is AOP-authoritative. When modules disagree, AOP grade wins.

export type StoreGrade =
  | 'A+'
  | 'A'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'B'
  | 'B1'
  | 'B2'
  | 'C'
  | 'C1'
  | 'C2'
  | 'D';

export interface CanonicalStore {
  /** UUID v4 — the single canonical identifier for this store */
  id: string;
  /** Canonical display name (Mall/Location, City) */
  name: string;
  /** City where the store is located */
  city: string;
  /** Indian state or union territory */
  state: string;
  /** Business region */
  region: 'North' | 'South' | 'East' | 'West' | 'Central';
  /** Store grade — AOP-authoritative */
  grade: StoreGrade;
}

// ─── Canonical Store List ──────────────────────────────────────────────────
// 56 stores covering every reference across all mock data modules.
//
// Deduplication notes:
//   - "Infinity Mall Malad" / "Infinity Malad" / "Inorbit Malad" → separate stores (different malls)
//   - "Phoenix Palladium" / "Mumbai - Phoenix Mall" → same physical store (Palladium, Lower Parel)
//   - "Select Citywalk" / "Select City Walk" / "Delhi - Select Citywalk" → same store
//   - "Forum Mall Bangalore" / "Forum Koramangala" / "Nexus Koramangala" → same store (renamed)
//   - "South City Kolkata" / "South City Mall" → same store
//   - "Lulu Mall" (Kochi) vs "Lulu Mall" (Lucknow/Trivandrum) → different stores, disambiguated by city
//   - "GT World Mall Bangalore" / "GT Central Hyderabad" → different stores in different cities
//   - "Centre Square Kochi" / "Centre Square Kota" → different stores in different cities

export const CANONICAL_STORES: CanonicalStore[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // WEST REGION
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Mumbai ─────────────────────────────────────────────────────────────
  {
    id: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    name: 'Phoenix Palladium',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A+',
  },
  {
    id: '7c4b2e6f-893d-4b2a-a7e5-2f8a4d6b0c3e',
    name: 'Infinity Mall Malad',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A',
  },
  {
    id: '15c3f7a9-0b4e-4c3b-98f6-3a9b5e7c1d4f',
    name: 'Phoenix Marketcity Kurla',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A',
  },
  {
    id: '26d4a8b0-1c5f-4d4c-a9a7-4b0c6f8d2e5a',
    name: 'Inorbit Malad',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A1',
  },
  {
    id: '37e5b9c1-2d6a-4e5d-80b8-5c1d7a9e3f6b',
    name: 'Infinity Mall Andheri',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },
  {
    id: '48f6c0d2-3e7b-4f6e-a1c9-6d2e8b0f4a7c',
    name: 'R-City Ghatkopar',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A1',
  },
  {
    id: '59a7d1e3-4f8c-4a7f-b2d0-7e3f9c1a5b8d',
    name: 'Bandra Linking Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A2',
  },
  {
    id: '6ab8e2f4-5a9d-4b8a-83e1-8f4a0d2b6c9e',
    name: 'Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    grade: 'B1',
  },

  // ─── Thane ──────────────────────────────────────────────────────────────
  {
    id: '7bc9f3a5-6b0e-4c9b-94f2-9a5b1e3c7d0f',
    name: 'Viviana Thane',
    city: 'Thane',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A',
  },

  // ─── Pune ───────────────────────────────────────────────────────────────
  {
    id: '8cd0a4b6-7c1f-4d0c-a5a3-0b6c2f4d8e1a',
    name: 'Phoenix Marketcity Pune',
    city: 'Pune',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A1',
  },

  // ─── Ahmedabad ──────────────────────────────────────────────────────────
  {
    id: '9de1b5c7-8d2a-4e1d-b6b4-1c7d3a5e9f2b',
    name: 'Palladium Ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    region: 'West',
    grade: 'A2',
  },

  // ─── Surat ──────────────────────────────────────────────────────────────
  {
    id: '0ef2c6d8-9e3b-4f2e-a7c5-2d8e4b6f0a3c',
    name: 'VR Surat',
    city: 'Surat',
    state: 'Gujarat',
    region: 'West',
    grade: 'A2',
  },

  // ─── Nashik ─────────────────────────────────────────────────────────────
  {
    id: '1fa3d7e9-0f4c-4a3f-b8d6-3e9f5c7a1b4d',
    name: 'City Centre Nashik',
    city: 'Nashik',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A2',
  },

  // ─── Rajkot ─────────────────────────────────────────────────────────────
  {
    id: '2ab4e8f0-1a5d-4b4a-89e7-4f0a6d8b2c5e',
    name: 'Crystal Mall Rajkot',
    city: 'Rajkot',
    state: 'Gujarat',
    region: 'West',
    grade: 'A2',
  },

  // ─── Kolhapur ───────────────────────────────────────────────────────────
  {
    id: '3bc5f9a1-2b6e-4c5b-90f8-5a1b7e9c3d6f',
    name: 'Mall Road Kolhapur',
    city: 'Kolhapur',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },

  // ─── Nagpur ─────────────────────────────────────────────────────────────
  {
    id: '4cd6a0b2-3c7f-4d6c-a1a9-6b2c8f0d4e7a',
    name: 'Fun Republic Nagpur',
    city: 'Nagpur',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },

  // ─── Jalgaon ────────────────────────────────────────────────────────────
  {
    id: '5de7b1c3-4d8a-4e7d-b2b0-7c3d9a1e5f8b',
    name: 'City Mall Jalgaon',
    city: 'Jalgaon',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },

  // ─── Satara ─────────────────────────────────────────────────────────────
  {
    id: '6ef8c2d4-5e9b-4f8e-a3c1-8d4e0b2f6a9c',
    name: 'Main Road Satara',
    city: 'Satara',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },

  // ─── Latur ──────────────────────────────────────────────────────────────
  {
    id: '7fa9d3e5-6f0c-4a9f-b4d2-9e5f1c3a7b0d',
    name: 'Market Yard Latur',
    city: 'Latur',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },

  // ─── Amravati ───────────────────────────────────────────────────────────
  {
    id: '80b0e4f6-7a1d-4b0a-85e3-0f6a2d4b8c1e',
    name: 'Civil Lines Amravati',
    city: 'Amravati',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },

  // ─── Solapur ────────────────────────────────────────────────────────────
  {
    id: '91c1f5a7-8b2e-4c1b-96f4-1a7b3e5c9d2f',
    name: 'Bus Stand Solapur',
    city: 'Solapur',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },

  // ─── Aurangabad ─────────────────────────────────────────────────────────
  {
    id: 'a2d2a6b8-9c3f-4d2c-a7a5-2b8c4f6d0e3a',
    name: 'Station Road Aurangabad',
    city: 'Aurangabad',
    state: 'Maharashtra',
    region: 'West',
    grade: 'A3',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NORTH REGION
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Delhi / NCR ────────────────────────────────────────────────────────
  {
    id: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b',
    name: 'Select Citywalk',
    city: 'Delhi',
    state: 'Delhi',
    region: 'North',
    grade: 'A+',
  },
  {
    id: 'c4f4c8d0-1e5b-4f4e-a9c7-4d0e6b8f2a5c',
    name: 'DLF Promenade',
    city: 'Delhi',
    state: 'Delhi',
    region: 'North',
    grade: 'A+',
  },
  {
    id: 'd5a5d9e1-2f6c-4a5f-b0d8-5e1f7c9a3b6d',
    name: 'Connaught Place',
    city: 'Delhi',
    state: 'Delhi',
    region: 'North',
    grade: 'A1',
  },

  // ─── Gurgaon ────────────────────────────────────────────────────────────
  {
    id: 'e6b6e0f2-3a7d-4b6a-81e9-6f2a8d0b4c7e',
    name: 'Ambience Mall Gurgaon',
    city: 'Gurgaon',
    state: 'Haryana',
    region: 'North',
    grade: 'A',
  },

  // ─── Chandigarh ─────────────────────────────────────────────────────────
  {
    id: 'f7c7f1a3-4b8e-4c7b-92f0-7a3b9e1c5d8f',
    name: 'Elante Mall Chandigarh',
    city: 'Chandigarh',
    state: 'Chandigarh',
    region: 'North',
    grade: 'A1',
  },

  // ─── Lucknow ────────────────────────────────────────────────────────────
  {
    id: '08d8a2b4-5c9f-4d8c-a3a1-8b4c0f2d6e9a',
    name: 'Sahara Mall Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    region: 'North',
    grade: 'A2',
  },
  {
    id: '19e9b3c5-6d0a-4e9d-b4b2-9c5d1a3e7f0b',
    name: 'Phoenix Palassio Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    region: 'North',
    grade: 'A1',
  },
  {
    id: '2af0c4d6-7e1b-4f0e-a5c3-0d6e2b4f8a1c',
    name: 'Lulu Mall Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    region: 'North',
    grade: 'B1',
  },
  {
    id: 'c5d6e7f8-9a0b-4c3d-a4e5-f6a7b8c9d0e1',
    name: 'Saharaganj Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    region: 'North',
    grade: 'A2',
  },

  // ─── Jaipur ─────────────────────────────────────────────────────────────
  {
    id: '3ba1d5e7-8f2c-4019-b6d4-1e7f3c5a9b20',
    name: 'World Trade Park Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    region: 'North',
    grade: 'B1',
  },

  // ─── Kota ───────────────────────────────────────────────────────────────
  {
    id: '4cb2e6f8-9a3d-4120-87e5-2f8a4d6b0c31',
    name: 'Centre Square Kota',
    city: 'Kota',
    state: 'Rajasthan',
    region: 'North',
    grade: 'A2',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOUTH REGION
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Bangalore ──────────────────────────────────────────────────────────
  {
    id: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42',
    name: 'UB City Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    region: 'South',
    grade: 'A+',
  },
  {
    id: '6ed4a8b0-1c5f-4340-a9a7-4b0c6f8d2e53',
    name: 'Forum Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    region: 'South',
    grade: 'A1',
  },
  {
    id: '7fe5b9c1-2d6a-4450-b0b8-5c1d7a9e3f64',
    name: 'GT World Mall Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    region: 'South',
    grade: 'A2',
  },
  {
    id: 'a3b4c5d6-7e8f-4a1b-92c3-d4e5f6a7b8c9',
    name: 'Indiranagar Bangalore',
    city: 'Bangalore',
    state: 'Karnataka',
    region: 'South',
    grade: 'A2',
  },

  // ─── Chennai ────────────────────────────────────────────────────────────
  {
    id: '80f6c0d2-3e7b-4560-a1c9-6d2e8b0f4a75',
    name: 'Express Avenue Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
    grade: 'A1',
  },
  {
    id: 'b4c5d6e7-8f9a-4b2c-a3d4-e5f6a7b8c9d0',
    name: 'Phoenix Mall Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
    grade: 'A1',
  },
  {
    id: '91a7d1e3-4f8c-4670-b2d0-7e3f9c1a5b86',
    name: 'VR Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    region: 'South',
    grade: 'A2',
  },

  // ─── Hyderabad ──────────────────────────────────────────────────────────
  {
    id: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97',
    name: 'Inorbit Mall Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    grade: 'A1',
  },
  {
    id: 'b3c9f3a5-6b0e-4890-94f2-9a5b1e3c7da8',
    name: 'Nexus Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    grade: 'A1',
  },
  {
    id: 'c4d0a4b6-7c1f-4900-a5a3-0b6c2f4d8eb9',
    name: 'Pavilion Mall Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    grade: 'A2',
  },
  {
    id: 'd5e1b5c7-8d2a-4010-b6b4-1c7d3a5e9fca',
    name: 'Manjeera Mall Kukatpally',
    city: 'Hyderabad',
    state: 'Telangana',
    region: 'South',
    grade: 'A3',
  },

  // ─── Kochi ──────────────────────────────────────────────────────────────
  {
    id: 'e6f2c6d8-9e3b-4110-a7c5-2d8e4b6f0adb',
    name: 'Centre Square Kochi',
    city: 'Kochi',
    state: 'Kerala',
    region: 'South',
    grade: 'A2',
  },
  {
    id: 'f7a3d7e9-0f4c-4210-b8d6-3e9f5c7a1bec',
    name: 'Lulu Mall Kochi',
    city: 'Kochi',
    state: 'Kerala',
    region: 'South',
    grade: 'A1',
  },

  // ─── Mangalore ──────────────────────────────────────────────────────────
  {
    id: '08b4e8f0-1a5d-4310-89e7-4f0a6d8b2cfd',
    name: 'Forum Fiza Mangalore',
    city: 'Mangalore',
    state: 'Karnataka',
    region: 'South',
    grade: 'A2',
  },

  // ─── Vizag ──────────────────────────────────────────────────────────────
  {
    id: '19c5f9a1-2b6e-4410-90f8-5a1b7e9c3d0e',
    name: 'Coastal City Vizag',
    city: 'Vizag',
    state: 'Andhra Pradesh',
    region: 'South',
    grade: 'A2',
  },

  // ─── Trivandrum ─────────────────────────────────────────────────────────
  {
    id: '2ad6a0b2-3c7f-4510-a1a9-6b2c8f0d4e1f',
    name: 'Lulu Mall Trivandrum',
    city: 'Trivandrum',
    state: 'Kerala',
    region: 'South',
    grade: 'A2',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EAST REGION
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Kolkata ────────────────────────────────────────────────────────────
  {
    id: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20',
    name: 'Quest Mall Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    grade: 'A2',
  },
  {
    id: '4cf8c2d4-5e9b-4710-a3c1-8d4e0b2f6a31',
    name: 'South City Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    grade: 'A1',
  },
  {
    id: '5da9d3e5-6f0c-4810-b4d2-9e5f1c3a7b42',
    name: 'Salt Lake City Centre Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    region: 'East',
    grade: 'A2',
  },

  // ─── Siliguri ───────────────────────────────────────────────────────────
  {
    id: '6eb0e4f6-7a1d-4910-85e3-0f6a2d4b8c53',
    name: 'City Mall Siliguri',
    city: 'Siliguri',
    state: 'West Bengal',
    region: 'East',
    grade: 'A3',
  },

  // ─── Ranchi ─────────────────────────────────────────────────────────────
  {
    id: '7fc1f5a7-8b2e-4020-96f4-1a7b3e5c9d64',
    name: 'Nucleus Mall Ranchi',
    city: 'Ranchi',
    state: 'Jharkhand',
    region: 'East',
    grade: 'A3',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CENTRAL REGION
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Indore ─────────────────────────────────────────────────────────────
  {
    id: '80d2a6b8-9c3f-4130-a7a5-2b8c4f6d0e75',
    name: 'Treasure Island Indore',
    city: 'Indore',
    state: 'Madhya Pradesh',
    region: 'Central',
    grade: 'A2',
  },

  // ─── Bhopal ─────────────────────────────────────────────────────────────
  {
    id: '91e3b7c9-0d4a-4240-b8b6-3c9d5a7e1f86',
    name: 'DB City Bhopal',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    region: 'Central',
    grade: 'A2',
  },
];

// ─── Lookup Map ────────────────────────────────────────────────────────────

/** Fast lookup: UUID → CanonicalStore */
export const STORE_MAP = new Map<string, CanonicalStore>(
  CANONICAL_STORES.map((s) => [s.id, s]),
);

// ─── Seeded UUID Generator ─────────────────────────────────────────────────

/** Generate a deterministic v4 UUID from a seeded PRNG.
 *  Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *  where y is one of [8, 9, a, b] (RFC 4122 variant bits). */
export function seededUUID(rand: () => number): string {
  const hex = '0123456789abcdef';
  let uuid = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-';
    } else if (i === 14) {
      uuid += '4'; // version nibble
    } else if (i === 19) {
      uuid += hex[(Math.floor(rand() * 16) & 0x3) | 0x8]; // variant nibble
    } else {
      uuid += hex[Math.floor(rand() * 16)];
    }
  }
  return uuid;
}
