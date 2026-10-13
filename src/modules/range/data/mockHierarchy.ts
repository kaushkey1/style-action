// ─── Hierarchy Filter Options ────────────────────────────────────────────
// Static data for Segment → Family → Class → Brick cascade filters.
// Values at the Segment level match the `category` field in mock inventory data.

interface Option {
  value: string;
  label: string;
}

// ─── Segment (top level) ─────────────────────────────────────────────────

export const segmentOptions: Option[] = [
  { value: 'all', label: 'All Segments' },
  { value: 'Menswear Casual', label: 'Menswear Casual' },
  { value: 'Menswear Formal', label: 'Menswear Formal' },
  { value: 'Womenswear Western', label: 'Womenswear Western' },
  { value: 'Womenswear Ethnic', label: 'Womenswear Ethnic' },
  { value: 'Kidswear', label: 'Kidswear' },
  { value: 'Footwear', label: 'Footwear' },
  { value: 'Lingerie', label: 'Lingerie' },
  { value: 'Accessories', label: 'Accessories' },
];

// ─── Family (keyed by segment) ───────────────────────────────────────────

export const familyOptionsBySegment: Record<string, Option[]> = {
  'Menswear Casual': [
    { value: 'all', label: 'All Families' },
    { value: 'Top Wear', label: 'Top Wear' },
    { value: 'Bottom Wear', label: 'Bottom Wear' },
    { value: 'Outerwear', label: 'Outerwear' },
    { value: 'Innerwear', label: 'Innerwear' },
  ],
  'Menswear Formal': [
    { value: 'all', label: 'All Families' },
    { value: 'Shirts', label: 'Shirts' },
    { value: 'Trousers', label: 'Trousers' },
    { value: 'Suits & Blazers', label: 'Suits & Blazers' },
    { value: 'Accessories', label: 'Accessories' },
  ],
  'Womenswear Western': [
    { value: 'all', label: 'All Families' },
    { value: 'Tops & Tees', label: 'Tops & Tees' },
    { value: 'Dresses', label: 'Dresses' },
    { value: 'Bottom Wear', label: 'Bottom Wear' },
    { value: 'Outerwear', label: 'Outerwear' },
  ],
  'Womenswear Ethnic': [
    { value: 'all', label: 'All Families' },
    { value: 'Kurtas & Kurtis', label: 'Kurtas & Kurtis' },
    { value: 'Sarees', label: 'Sarees' },
    { value: 'Salwar Sets', label: 'Salwar Sets' },
    { value: 'Dupattas', label: 'Dupattas' },
  ],
  'Kidswear': [
    { value: 'all', label: 'All Families' },
    { value: 'Boys Top Wear', label: 'Boys Top Wear' },
    { value: 'Girls Top Wear', label: 'Girls Top Wear' },
    { value: 'Bottom Wear', label: 'Bottom Wear' },
    { value: 'Sets & Combos', label: 'Sets & Combos' },
  ],
  'Footwear': [
    { value: 'all', label: 'All Families' },
    { value: 'Casual Shoes', label: 'Casual Shoes' },
    { value: 'Formal Shoes', label: 'Formal Shoes' },
    { value: 'Sports Shoes', label: 'Sports Shoes' },
    { value: 'Sandals & Slippers', label: 'Sandals & Slippers' },
  ],
  'Lingerie': [
    { value: 'all', label: 'All Families' },
    { value: 'Bras', label: 'Bras' },
    { value: 'Panties', label: 'Panties' },
    { value: 'Sleepwear', label: 'Sleepwear' },
    { value: 'Shapewear', label: 'Shapewear' },
  ],
  'Accessories': [
    { value: 'all', label: 'All Families' },
    { value: 'Bags', label: 'Bags' },
    { value: 'Belts', label: 'Belts' },
    { value: 'Watches', label: 'Watches' },
    { value: 'Jewellery', label: 'Jewellery' },
  ],
};

// ─── Class (keyed by family) ─────────────────────────────────────────────

export const classOptionsByFamily: Record<string, Option[]> = {
  'Top Wear': [
    { value: 'all', label: 'All Classes' },
    { value: 'T-Shirts', label: 'T-Shirts' },
    { value: 'Polo Shirts', label: 'Polo Shirts' },
    { value: 'Casual Shirts', label: 'Casual Shirts' },
  ],
  'Bottom Wear': [
    { value: 'all', label: 'All Classes' },
    { value: 'Jeans', label: 'Jeans' },
    { value: 'Chinos', label: 'Chinos' },
    { value: 'Shorts', label: 'Shorts' },
  ],
  'Outerwear': [
    { value: 'all', label: 'All Classes' },
    { value: 'Jackets', label: 'Jackets' },
    { value: 'Sweatshirts', label: 'Sweatshirts' },
    { value: 'Hoodies', label: 'Hoodies' },
  ],
  'Shirts': [
    { value: 'all', label: 'All Classes' },
    { value: 'Regular Fit', label: 'Regular Fit' },
    { value: 'Slim Fit', label: 'Slim Fit' },
  ],
  'Trousers': [
    { value: 'all', label: 'All Classes' },
    { value: 'Flat Front', label: 'Flat Front' },
    { value: 'Pleated', label: 'Pleated' },
  ],
  'Tops & Tees': [
    { value: 'all', label: 'All Classes' },
    { value: 'Blouses', label: 'Blouses' },
    { value: 'Crop Tops', label: 'Crop Tops' },
    { value: 'T-Shirts', label: 'T-Shirts' },
  ],
  'Dresses': [
    { value: 'all', label: 'All Classes' },
    { value: 'Midi', label: 'Midi' },
    { value: 'Maxi', label: 'Maxi' },
    { value: 'Mini', label: 'Mini' },
  ],
  'Kurtas & Kurtis': [
    { value: 'all', label: 'All Classes' },
    { value: 'Straight', label: 'Straight' },
    { value: 'A-Line', label: 'A-Line' },
    { value: 'Anarkali', label: 'Anarkali' },
  ],
  'Sarees': [
    { value: 'all', label: 'All Classes' },
    { value: 'Silk', label: 'Silk' },
    { value: 'Cotton', label: 'Cotton' },
    { value: 'Georgette', label: 'Georgette' },
  ],
  'Casual Shoes': [
    { value: 'all', label: 'All Classes' },
    { value: 'Sneakers', label: 'Sneakers' },
    { value: 'Loafers', label: 'Loafers' },
    { value: 'Slip-ons', label: 'Slip-ons' },
  ],
};

// ─── Brick (keyed by class) ──────────────────────────────────────────────

export const brickOptionsByClass: Record<string, Option[]> = {
  'T-Shirts': [
    { value: 'all', label: 'All Bricks' },
    { value: 'Round Neck', label: 'Round Neck' },
    { value: 'V-Neck', label: 'V-Neck' },
    { value: 'Henley', label: 'Henley' },
  ],
  'Jeans': [
    { value: 'all', label: 'All Bricks' },
    { value: 'Skinny', label: 'Skinny' },
    { value: 'Straight', label: 'Straight' },
    { value: 'Relaxed', label: 'Relaxed' },
  ],
  'Jackets': [
    { value: 'all', label: 'All Bricks' },
    { value: 'Bomber', label: 'Bomber' },
    { value: 'Denim', label: 'Denim' },
    { value: 'Windcheater', label: 'Windcheater' },
  ],
  'Sneakers': [
    { value: 'all', label: 'All Bricks' },
    { value: 'Low Top', label: 'Low Top' },
    { value: 'High Top', label: 'High Top' },
    { value: 'Running', label: 'Running' },
  ],
  'Straight': [
    { value: 'all', label: 'All Bricks' },
    { value: 'Printed', label: 'Printed' },
    { value: 'Solid', label: 'Solid' },
    { value: 'Embroidered', label: 'Embroidered' },
  ],
};

// ─── State & City Geography ──────────────────────────────────────────────

export const stateOptions: Option[] = [
  { value: 'all', label: 'All States' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Chandigarh', label: 'Chandigarh' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
];

export const cityOptionsByState: Record<string, Option[]> = {
  'Maharashtra': [
    { value: 'all', label: 'All Cities' },
    { value: 'Mumbai', label: 'Mumbai' },
    { value: 'Pune', label: 'Pune' },
    { value: 'Nagpur', label: 'Nagpur' },
    { value: 'Nashik', label: 'Nashik' },
    { value: 'Aurangabad', label: 'Aurangabad' },
    { value: 'Thane', label: 'Thane' },
    { value: 'Kolhapur', label: 'Kolhapur' },
    { value: 'Jalgaon', label: 'Jalgaon' },
    { value: 'Satara', label: 'Satara' },
    { value: 'Latur', label: 'Latur' },
    { value: 'Amravati', label: 'Amravati' },
    { value: 'Solapur', label: 'Solapur' },
  ],
  'Gujarat': [
    { value: 'all', label: 'All Cities' },
    { value: 'Ahmedabad', label: 'Ahmedabad' },
    { value: 'Surat', label: 'Surat' },
    { value: 'Rajkot', label: 'Rajkot' },
    { value: 'Vadodara', label: 'Vadodara' },
  ],
  'Delhi': [
    { value: 'all', label: 'All Cities' },
    { value: 'Delhi', label: 'Delhi' },
  ],
  'Haryana': [
    { value: 'all', label: 'All Cities' },
    { value: 'Gurgaon', label: 'Gurgaon' },
  ],
  'Chandigarh': [
    { value: 'all', label: 'All Cities' },
    { value: 'Chandigarh', label: 'Chandigarh' },
  ],
  'Uttar Pradesh': [
    { value: 'all', label: 'All Cities' },
    { value: 'Lucknow', label: 'Lucknow' },
    { value: 'Varanasi', label: 'Varanasi' },
    { value: 'Agra', label: 'Agra' },
  ],
  'Rajasthan': [
    { value: 'all', label: 'All Cities' },
    { value: 'Jaipur', label: 'Jaipur' },
    { value: 'Kota', label: 'Kota' },
    { value: 'Jodhpur', label: 'Jodhpur' },
    { value: 'Udaipur', label: 'Udaipur' },
  ],
  'Karnataka': [
    { value: 'all', label: 'All Cities' },
    { value: 'Bangalore', label: 'Bangalore' },
    { value: 'Mangalore', label: 'Mangalore' },
    { value: 'Mysore', label: 'Mysore' },
    { value: 'Hubli', label: 'Hubli' },
  ],
  'Tamil Nadu': [
    { value: 'all', label: 'All Cities' },
    { value: 'Chennai', label: 'Chennai' },
    { value: 'Coimbatore', label: 'Coimbatore' },
    { value: 'Madurai', label: 'Madurai' },
    { value: 'Tiruchirappalli', label: 'Tiruchirappalli' },
  ],
  'Telangana': [
    { value: 'all', label: 'All Cities' },
    { value: 'Hyderabad', label: 'Hyderabad' },
  ],
  'Kerala': [
    { value: 'all', label: 'All Cities' },
    { value: 'Kochi', label: 'Kochi' },
    { value: 'Thiruvananthapuram', label: 'Thiruvananthapuram' },
  ],
  'Andhra Pradesh': [
    { value: 'all', label: 'All Cities' },
    { value: 'Visakhapatnam', label: 'Visakhapatnam' },
    { value: 'Vizag', label: 'Vizag' },
  ],
  'West Bengal': [
    { value: 'all', label: 'All Cities' },
    { value: 'Kolkata', label: 'Kolkata' },
    { value: 'Siliguri', label: 'Siliguri' },
  ],
  'Jharkhand': [
    { value: 'all', label: 'All Cities' },
    { value: 'Ranchi', label: 'Ranchi' },
  ],
  'Madhya Pradesh': [
    { value: 'all', label: 'All Cities' },
    { value: 'Indore', label: 'Indore' },
    { value: 'Bhopal', label: 'Bhopal' },
    { value: 'Gwalior', label: 'Gwalior' },
  ],
  'Bihar': [
    { value: 'all', label: 'All Cities' },
    { value: 'Patna', label: 'Patna' },
  ],
  'Odisha': [
    { value: 'all', label: 'All Cities' },
    { value: 'Bhubaneswar', label: 'Bhubaneswar' },
  ],
  'Assam': [
    { value: 'all', label: 'All Cities' },
    { value: 'Guwahati', label: 'Guwahati' },
  ],
  'Uttarakhand': [
    { value: 'all', label: 'All Cities' },
    { value: 'Dehradun', label: 'Dehradun' },
  ],
  'Punjab': [
    { value: 'all', label: 'All Cities' },
    { value: 'Amritsar', label: 'Amritsar' },
    { value: 'Jalandhar', label: 'Jalandhar' },
  ],
  'Chhattisgarh': [
    { value: 'all', label: 'All Cities' },
    { value: 'Raipur', label: 'Raipur' },
  ],
};

// ─── City → State Lookup ─────────────────────────────────────────────────
// Used to resolve a city name to its parent state for filtering.

export const CITY_TO_STATE: Record<string, string> = {};
for (const [state, cities] of Object.entries(cityOptionsByState)) {
  for (const city of cities) {
    if (city.value !== 'all') {
      CITY_TO_STATE[city.value] = state;
    }
  }
}
