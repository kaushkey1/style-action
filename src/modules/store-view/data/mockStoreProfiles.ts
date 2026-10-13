// ── Store Profile Mock Data ──
// Rich narrative profiles for curated stores (AI-generated summaries)

export interface StoreProfile {
  storeId: string;
  catchmentSummary: string;
  catchmentNarrative: string;
  shoppersSummary: string;
  shoppersNarrative: string;
  demandSummary: string;
  demandNarrative: string;
  dateGenerated: string;
}

export const storeProfiles: Record<string, StoreProfile> = {
  'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d': {
    storeId: 'b3a1d5e7-8f2c-4a19-b6d4-1e7f3c5a9b2d',
    catchmentSummary: 'Affluent metro catchment with strong fashion appetite and high destination pull.',
    catchmentNarrative:
      'The Phoenix Mall catchment spans a 5km radius encompassing Bandra, Khar, and Lower Parel — some of Mumbai\'s most affluent residential corridors. Household incomes in the primary zone average 2.4x the metro median, driving strong premium price-point absorption. The area has seen a 12% increase in young professional residents over the past 18 months, fueled by new co-living and premium apartment developments. Weekend footfall is 3.2x weekday, indicating strong destination shopping behavior rather than convenience-driven visits.',
    shoppersSummary: 'Young professionals and fashion-forward shoppers dominate, with growing premium loyalist segment.',
    shoppersNarrative:
      'The store\'s customer base skews younger (62% under 35) and more affluent than the network average. Young Professionals account for 28% of customers but 34% of revenue, with an average basket of ₹3,360. The Fashion Forward segment (22%) visits most frequently at 3x/month, acting as trend validators. Repeat rate of 58% is best-in-class for A+ stores, suggesting strong brand affinity. Customer acquisition cost is declining as word-of-mouth and Ajio-to-store conversions grow. The top cross-sell pair — Women\'s Western + Accessories — occurs in 28% of multi-item baskets.',
    demandSummary: 'Women\'s Western and Ethnic are the growth engines; Men\'s Formal is declining and needs reallocation.',
    demandNarrative:
      'Category demand is sharply polarized: Women\'s Western (index 1.28, +18% YoY) and Women\'s Ethnic (index 1.32, +22% YoY) together account for 58% of store revenue and are accelerating. Men\'s Casual holds steady but Men\'s Formal has declined 8% YoY with sell-through at only 58%, indicating structural over-allocation. The store absorbs newness at 78% — well above the 65% network average — suggesting the customer base rewards fresh inventory. Price affinity data shows 40% of sales in the premium band (>₹1,000), nearly double the network average of 23%.',
    dateGenerated: '2026-03-03T06:00:00Z',
  },
  'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b': {
    storeId: 'b3e3b7c9-0d4a-4e3d-88b6-3c9d5a7e1f4b',
    catchmentSummary: 'Premium South Delhi catchment with high brand awareness and competitive saturation.',
    catchmentNarrative:
      'Select Citywalk anchors a premium catchment spanning Greater Kailash, Saket, and Malviya Nagar. The trade area has the highest density of aspirational retail in Delhi, with Zara, H&M, and Shoppers Stop all within 400m. Affluence score of 81 reflects the concentration of senior professionals, entrepreneurs, and diplomatic families. The winter season (Nov-Feb) sees the strongest footfall — cold-wave conditions in February drove winterwear demand up 35% but reduced overall store visits by 8%. Online demand leakage to Ajio is at 22%, the highest in the A+ cohort, suggesting opportunity for Ajio Rush integration.',
    shoppersSummary: 'Brand-conscious shoppers who compare across formats; high premium loyalist concentration.',
    shoppersNarrative:
      'Delhi\'s Select Citywalk attracts the network\'s most brand-conscious customer base. Premium Loyalists (22% of customers) contribute disproportionate revenue at 39.6% share, with an average basket of ₹5,940. The store has the highest repeat rate among A+ stores at 55%, though new customer acquisition (14%) lags behind Mumbai. Customers actively compare across Zara and H&M before purchasing — VM display quality at 7/10 vs Zara\'s 9/10 is a quantified dwell-time gap. The Fashion Forward segment responds strongly to Delhi Fashion Week (Mar 20-24), historically lifting WW sales 18% in the event window.',
    demandSummary: 'Balanced demand across Men\'s Casual and Western; Ethnic underperforms catchment potential.',
    demandNarrative:
      'Men\'s Casual (index 1.22, +15% YoY) leads demand, followed by Women\'s Western (index 1.18, +14%). Men\'s Formal holds at index 1.08 — stable demand driven by the corporate and wedding segments. Women\'s Ethnic underperforms at 0.95 index despite a moderate Family Index of 60, suggesting the current assortment may not match the Delhi ethnic aesthetic preference. Size curve accuracy is strong at 90% for Men\'s Casual but only 85% for Women\'s Western, where size S is the top OOS — costing an estimated ₹1.5 L/month in lost sales. The store\'s price affinity tilts premium: 45% of sales above ₹1,000.',
    dateGenerated: '2026-03-03T06:00:00Z',
  },
  '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42': {
    storeId: '5dc3f7a9-0b4e-4230-98f6-3a9b5e7c1d42',
    catchmentSummary: 'Premium Bangalore catchment driven by IT professionals with the highest fashion-forward score in the network.',
    catchmentNarrative:
      'UB City is Bangalore\'s premier luxury retail destination, attracting a catchment that scores 85 on affluence and 86 on fashion forwardness — both the highest in the network. The primary trade area covers Vittal Mallya Road, Lavelle Road, and the Central Business District, home to senior IT executives and startup founders. The catchment population is smaller (680 K vs 850 K for Mumbai) but spends more per capita on fashion. Weekend:weekday footfall ratio is 2.1x, lower than Mumbai\'s 3.2x, suggesting stronger weekday corporate shopping. Two aspirational competitors (Shoppers Stop UB City, H&M Brigade Road) create a premium benchmark that our store largely meets.',
    shoppersSummary: 'IT professionals and fashion-forward shoppers with the highest basket depth in the network.',
    shoppersNarrative:
      'The customer base is uniquely balanced: Fashion Forward (25%), Young Professional (25%), and Premium Loyalist (25%) each represent a quarter of customers. This balance drives the network\'s highest basket depth score (3.1) and average basket value (₹4,100). Repeat rate of 60% is the best in the network. The IT professional demographic creates strong weekday demand for Men\'s Formal (+10% YoY), a category that struggles elsewhere. New customer acquisition at 16% is the highest — driven by Bengaluru Tech Summit (Mar 18-20) and corporate events that bring new-to-brand visitors. Churn rate at 11% is the lowest, indicating strong loyalty.',
    demandSummary: 'Men\'s Formal uniquely strong here; Women\'s Western growing fast on IT crowd demand.',
    demandNarrative:
      'This is one of the few stores where Men\'s Formal (index 1.25, +10% YoY) is a genuine growth category, driven by the corporate professional concentration. Women\'s Western (index 1.15, +12%) grows on the back of the IT crowd\'s preference for contemporary styles. Women\'s Ethnic (index 1.10, +8%) is steady. The store has the highest newness absorption rate in the network at 82%, and the highest brand affluence score at 3.6. Size accuracy is excellent at 92% for the key formal category. Premium price band captures 50% of sales — the highest concentration in the entire network. GMROF at 420+ for formal and western categories indicates strong space productivity.',
    dateGenerated: '2026-03-03T06:00:00Z',
  },
  'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97': {
    storeId: 'a2b8e2f4-5a9d-4780-83e1-8f4a0d2b6c97',
    catchmentSummary: 'Mid-tier Hyderabad catchment with family-oriented shoppers and significant competitive gap.',
    catchmentNarrative:
      'Inorbit Mall serves a catchment spanning Madhapur, Kondapur, and HITEC City — Hyderabad\'s technology corridor. Affluence at 62 is moderate, reflecting a mix of IT professionals and value-seeking families. The catchment population of 620 K has been growing rapidly (+8% in 2 years) as new residential developments come online. A new Westside store opened within 1km in Q4 2025, intensifying competition and triggering a reclassification review. SmartBazaar is 3.2km away, providing cross-format traffic at a 1.08x multiplier. The area is distinctly family-oriented (Family Index 68), favoring ethnic and kids-wear categories.',
    shoppersSummary: 'Value-conscious families with moderate fashion appetite; size availability is the biggest pain point.',
    shoppersNarrative:
      'Budget Family (25%) and Occasional Shopper (28%) personas dominate the customer mix, reflecting the value-first orientation. Young Professionals account for only 20% — below the metro average. Active customers (7,200 in 90 days) are 92% of grade average, and the repeat rate of 42% is below the A1 benchmark of 50%. The store\'s size availability gap is the most acute in the network: 74% in-stock vs Pantaloons at 85%, costing an estimated ₹1.8 L/month in lost sales. The top OOS size is M in Women\'s Ethnic — the store\'s strongest demand category. Returns rate at 10.5% is the highest in the A1 cohort, with 48% of returns citing size mismatch.',
    demandSummary: 'Ethnic demand growing but constrained by availability; significant size curve and option breadth gaps.',
    demandNarrative:
      'Women\'s Ethnic demand index is strong at approximately 1.18, aligned with the catchment\'s family orientation, but is constrained by a critical size availability gap (-12pp vs Pantaloons). Overall growth at +4% YoY is below the market rate, suggesting competitive share loss to the newly opened Westside and established Max. The competitive gap score of 55 places this store in the "gap-exists" band. Price affinity is value-oriented: 35% entry, 42% mid, only 23% premium — perfectly matching the network average. The fill rate of 76% is the lowest among A1 stores, indicating systematic understocking that a deeper inventory buy could resolve.',
    dateGenerated: '2026-03-03T06:00:00Z',
  },
  '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20': {
    storeId: '3be7b1c3-4d8a-4610-b2b0-7c3d9a1e5f20',
    catchmentSummary: 'Underperforming Kolkata catchment with high family index but declining footfall.',
    catchmentNarrative:
      'Quest Mall serves a catchment spanning Park Street, South Kolkata, and Ballygunge. Despite a prime location, the store\'s competitive gap score of 42 places it in the "at-risk" band — the lowest in the network. Affluence at 52 is below the A2 grade median, and fashion forwardness at 48 indicates a basics-oriented market. The catchment\'s distinguishing strength is its Family Index of 78 — the highest in the network — suggesting significant untapped potential in Kids Wear and Women\'s Ethnic. However, overall footfall has declined 5% QoQ, partly due to Pantaloons Park Street capturing family shoppers with a broader option range (+180 options advantage).',
    shoppersSummary: 'Family shoppers with the lowest basket depth in the network; significant option breadth gap drives attrition.',
    shoppersNarrative:
      'Budget Family (30%) and Occasional Shopper (30%) together account for 60% of the customer base — the highest concentration in the network. Active customers (5,800 in 90 days) are only 88% of grade average, and churn at 24% is alarmingly high. Basket depth at 1.8 items and value at ₹1,400 are the lowest in the network. The core issue is option breadth: Pantaloons Park Street offers 180 more options in the same categories, creating a "more to discover" perception that drives higher dwell time and conversion. The store\'s Fashion Forward segment (12%) is too small to justify significant fashion investment; a basics-and-ethnic-first strategy would better serve this catchment.',
    demandSummary: 'Critical underperformance driven by option gap; family categories are the recovery lever.',
    demandNarrative:
      'The store is critically underperforming: SPSF at ₹580 vs twin target of ₹790 represents a 36% gap — the largest in the network. Kids Wear demand index is approximately 1.15 but current allocation at only 10% of SFT severely constrains this category. Women\'s Ethnic demand is moderate but size curve accuracy at approximately 70% results in frequent stockouts. The twin analysis identifies ₹6.2 L/month in recoverable revenue, primarily through option breadth expansion (+180 options) and Kids Wear reallocation (10% to 18% of SFT). Newness absorption is low at 55%, but this reflects the current basics-heavy assortment rather than customer resistance — comparable stores that increased fashion mix saw absorption rates climb.',
    dateGenerated: '2026-03-03T06:00:00Z',
  },
};
