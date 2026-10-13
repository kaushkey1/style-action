// Store master data for the Store Range page
export interface StoreDetail {
  id: string;
  code: string;
  name: string;
  grade: 'A' | 'A1' | 'B' | 'B1' | 'C';
  cluster: string;
  location: string;
  region: string;
  city: string;
  sqft: number;
  status: 'active' | 'renovation' | 'new';
}

export const mockStoreData: StoreDetail[] = [
  // A-Grade Stores (Flagship)
  {
    id: '7c4b2e6f-893d-4b2a-a7e5-2f8a4d6b0c3e',
    code: 'MUM-INF-001',
    name: 'Infinity Mall Malad',
    grade: 'A',
    cluster: 'Metro West',
    location: 'Malad, Mumbai',
    region: 'West',
    city: 'Mumbai',
    sqft: 8450,
    status: 'active'
  },
  {
    id: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    code: 'MUM-PHX-001',
    name: 'Phoenix Palladium',
    grade: 'A1',
    cluster: 'Metro South',
    location: 'Lower Parel, Mumbai',
    region: 'West',
    city: 'Mumbai',
    sqft: 8008,
    status: 'active'
  },
  {
    id: 'f9e8d7c6-b5a4-3210-9876-543210fedcba',
    code: 'DEL-SEL-001',
    name: 'Select City Walk',
    grade: 'A',
    cluster: 'NCR Premium',
    location: 'Saket, Delhi',
    region: 'North',
    city: 'Delhi',
    sqft: 7800,
    status: 'active'
  },
  {
    id: 'e1d2c3b4-a596-7834-bcde-f12345678901',
    code: 'BLR-PHX-001',
    name: 'Phoenix Marketcity',
    grade: 'A',
    cluster: 'Bangalore Metro',
    location: 'Whitefield, Bangalore',
    region: 'South',
    city: 'Bangalore',
    sqft: 7500,
    status: 'active'
  },

  // A1-Grade Stores
  {
    id: 'c5b4a3d2-e1f6-9078-5634-21098765dcba',
    code: 'DEL-PAC-001',
    name: 'Pacific Mall',
    grade: 'A1',
    cluster: 'NCR Standard',
    location: 'Tagore Garden, Delhi',
    region: 'North',
    city: 'Delhi',
    sqft: 6200,
    status: 'active'
  },
  {
    id: 'd6c5b4a3-f2e1-8907-6534-321098765abc',
    code: 'BLR-ORI-001',
    name: 'Orion Mall',
    grade: 'A1',
    cluster: 'Bangalore North',
    location: 'Brigade Gateway, Bangalore',
    region: 'South',
    city: 'Bangalore',
    sqft: 6500,
    status: 'active'
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    code: 'PUN-PHX-001',
    name: 'Phoenix Mall Pune',
    grade: 'A1',
    cluster: 'Pune Metro',
    location: 'Viman Nagar, Pune',
    region: 'West',
    city: 'Pune',
    sqft: 6000,
    status: 'active'
  },

  // B-Grade Stores
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    code: 'CHE-EXP-001',
    name: 'Express Avenue',
    grade: 'B',
    cluster: 'Chennai Central',
    location: 'Royapettah, Chennai',
    region: 'South',
    city: 'Chennai',
    sqft: 5200,
    status: 'active'
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-345678901234',
    code: 'KOL-QST-001',
    name: 'Quest Mall',
    grade: 'B',
    cluster: 'Kolkata Metro',
    location: 'Park Circus, Kolkata',
    region: 'East',
    city: 'Kolkata',
    sqft: 5000,
    status: 'active'
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-456789012345',
    code: 'AHM-APL-001',
    name: 'AlphaOne Mall',
    grade: 'B',
    cluster: 'Ahmedabad Central',
    location: 'Vastrapur, Ahmedabad',
    region: 'West',
    city: 'Ahmedabad',
    sqft: 4800,
    status: 'active'
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-567890123456',
    code: 'HYD-INO-001',
    name: 'Inorbit Mall',
    grade: 'B',
    cluster: 'Hyderabad West',
    location: 'Cyberabad, Hyderabad',
    region: 'South',
    city: 'Hyderabad',
    sqft: 5500,
    status: 'active'
  },

  // B1-Grade Stores
  {
    id: 'f6a7b8c9-d0e1-2345-fabc-678901234567',
    code: 'JAI-WTP-001',
    name: 'World Trade Park',
    grade: 'B1',
    cluster: 'Jaipur Central',
    location: 'Malviya Nagar, Jaipur',
    region: 'North',
    city: 'Jaipur',
    sqft: 4200,
    status: 'active'
  },
  {
    id: 'a7b8c9d0-e1f2-3456-abcd-789012345678',
    code: 'LUC-FUN-001',
    name: 'Fun Republic Mall',
    grade: 'B1',
    cluster: 'Lucknow Metro',
    location: 'Gomti Nagar, Lucknow',
    region: 'North',
    city: 'Lucknow',
    sqft: 4000,
    status: 'renovation'
  },
  {
    id: 'b8c9d0e1-f2a3-4567-bcde-890123456789',
    code: 'CHD-ELN-001',
    name: 'Elante Mall',
    grade: 'B1',
    cluster: 'Chandigarh',
    location: 'Industrial Area, Chandigarh',
    region: 'North',
    city: 'Chandigarh',
    sqft: 4500,
    status: 'active'
  },

  // C-Grade Stores
  {
    id: 'c9d0e1f2-a3b4-5678-cdef-901234567890',
    code: 'COI-BRK-001',
    name: 'Brookefields Mall',
    grade: 'C',
    cluster: 'Coimbatore',
    location: 'Brookefields, Coimbatore',
    region: 'South',
    city: 'Coimbatore',
    sqft: 3200,
    status: 'active'
  },
  {
    id: 'd0e1f2a3-b4c5-6789-defa-012345678901',
    code: 'SRT-VR-001',
    name: 'VR Surat',
    grade: 'C',
    cluster: 'Surat',
    location: 'Dumas Road, Surat',
    region: 'West',
    city: 'Surat',
    sqft: 3000,
    status: 'active'
  },
  {
    id: 'e1f2a3b4-c5d6-7890-efab-123456789012',
    code: 'NGP-CNT-001',
    name: 'Central Mall',
    grade: 'C',
    cluster: 'Nagpur',
    location: 'Ramdaspeth, Nagpur',
    region: 'West',
    city: 'Nagpur',
    sqft: 2800,
    status: 'active'
  },
  {
    id: 'f2a3b4c5-d6e7-8901-fabc-234567890123',
    code: 'VAD-INO-001',
    name: 'Inorbit Mall Vadodara',
    grade: 'C',
    cluster: 'Vadodara',
    location: 'Alkapuri, Vadodara',
    region: 'West',
    city: 'Vadodara',
    sqft: 3500,
    status: 'new'
  },
  {
    id: 'a3b4c5d6-e7f8-9012-abcd-345678901234',
    code: 'IND-TRE-001',
    name: 'Treasure Island',
    grade: 'C',
    cluster: 'Indore',
    location: 'MG Road, Indore',
    region: 'Central',
    city: 'Indore',
    sqft: 3300,
    status: 'active'
  },
  {
    id: 'b4c5d6e7-f8a9-0123-bcde-456789012345',
    code: 'BHO-DB-001',
    name: 'DB Mall',
    grade: 'C',
    cluster: 'Bhopal',
    location: 'MP Nagar, Bhopal',
    region: 'Central',
    city: 'Bhopal',
    sqft: 2900,
    status: 'active'
  },
  {
    id: 'c5d6e7f8-a9b0-1234-cdef-567890123456',
    code: 'VIS-CMR-001',
    name: 'CMR Central',
    grade: 'C',
    cluster: 'Visakhapatnam',
    location: 'Maddilapalem, Visakhapatnam',
    region: 'South',
    city: 'Visakhapatnam',
    sqft: 2700,
    status: 'active'
  },
  {
    id: 'd6e7f8a9-b0c1-2345-defa-678901234567',
    code: 'GUW-CTY-001',
    name: 'City Centre',
    grade: 'C',
    cluster: 'Guwahati',
    location: 'GS Road, Guwahati',
    region: 'East',
    city: 'Guwahati',
    sqft: 2600,
    status: 'active'
  }
];