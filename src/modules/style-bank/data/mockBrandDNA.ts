/**
 * Brand DNA data for the Design Showroom journey.
 *
 * Data sourced from the Fynd Create Trend Analysis agent's brand research output.
 * BrandDNA captures a brand's visual identity, design guardrails,
 * market positioning, cultural influences, and price architecture — used by
 * agents and designers during curation to validate style fit.
 */

// ── Type ────────────────────────────────────────────────────────────────

export interface BrandDNA {
  brandId: string;
  brandName: string;
  brandClassification: string;

  visualIdentity: {
    paletteOverview: string;
    masterPalette: string[];
    accessibilityNotes: string;
  };

  designGuardrails: {
    shouldDo: string[];
    shouldNotDo: string[];
  };

  marketPositioning: {
    brandTier: string;
    targetGender: string;
    targetAgeRange: string;
    regions: string;
    psychographics: string;
    styleArchetypes: string[];
    demographicSummary: string;
  };

  descriptiveTags: string[];

  priceRange: {
    currency: string;
    min: number;
    median: number;
    max: number;
  };

  primaryCategories: string[];

  coreValues: {
    voiceStyle: string;
    heritageBackground: string;
    designThemeSummary: string;
    brandValuesAndTones: string;
    brandStoryAndIdeology: string;
  };

  culturalInfluences: {
    culturalReferences: string[];
    languageOrScriptUsage: string[];
    sensitivityNotes: string;
    importantSymbolsOrMotifs: string[];
    subcultureAssociations: string[];
    festivalsOrOccasions: string[];
  };

  sourceReferences: string[];
}

// ── Data ────────────────────────────────────────────────────────────────

const dnmx: BrandDNA = {
  brandId: 'dnmx',
  brandName: 'DNMX',
  brandClassification:
    'Mass/value private-label casualwear \u2014 denim-first everyday fashion for young men',

  visualIdentity: {
    paletteOverview:
      'Mass-market casualwear colour world anchored in denim blues and neutral basics, with occasional sporty/brights and camo/print accents for youth appeal. Supports everyday wear (college, weekend, casual workdays) with versatile mix-and-match tones and seasonal outerwear layering.',
    masterPalette: [
      'Denim blues (indigo, mid-wash, light-wash) as the core identity',
      'Neutrals for basics and layering: black, white, heather grey, navy',
      'Earthy utility tones: olive, khaki, tan (often in joggers/outerwear)',
      'Accent brights for trend pops in tees/graphics: red, yellow, cobalt, teal (used sparingly)',
      'Print-led palettes: camo greens/greys and colourblocked combinations',
    ],
    accessibilityNotes:
      'Maintain clear contrast between garments and backgrounds in e-commerce (e.g., mid-wash denim against light neutral backdrops). Ensure typography/graphics remain legible on prints (avoid low-contrast tone-on-tone). For promotional banners, keep text overlays on solid/blurred zones and meet WCAG-like contrast guidance for readability.',
  },

  designGuardrails: {
    shouldDo: [
      'Keep a denim-first assortment with repeatable core fits/washes (straight/slim/skinny) plus seasonal wash updates.',
      'Prioritise comfort and easy-care messaging (soft handfeel, stretch, machine-wash practicality) in product copy and on-page highlights.',
      'Use trend injections in controlled ways: graphics/typography, colourblocking, checks/stripes, camo, tropical motifs\u2014while keeping silhouettes wearable for daily use.',
      'Maintain value-first clarity: communicate MRPs, discounts, and multi-buy/basics value propositions prominently (AJIO/Reliance Trends context).',
      'Use youth-leaning, energetic, benefit-led copy that guides shoppers through wardrobe building (tees \u2192 shirts \u2192 denim \u2192 athleisure \u2192 layering).',
      'Photography: clear fit visibility (front/back/close-ups), consistent lighting for wash accuracy, and styling that matches college-to-smart-casual use cases.',
    ],
    shouldNotDo: [
      'Over-claim heritage crafts or regional provenance for prints/collars unless explicitly sourced and documented by the brand.',
      'Move into premium/luxury signalling that conflicts with value positioning (overly ornate trims, high-gloss editorial styling, exclusivity language).',
      'Rely on overly niche runway silhouettes that reduce everyday wearability for core customers.',
      'Use culturally loaded narratives around camo/tropical/mandarin-collar elements; keep descriptions functional and style-focused.',
      'Obscure product details with heavy filters that distort denim wash/colour accuracy in e-commerce imagery.',
    ],
  },

  marketPositioning: {
    brandTier: 'Mass / Value',
    targetGender: 'Men',
    targetAgeRange: '16\u201335',
    regions: 'India (pan-India via Reliance Trends stores and AJIO e-commerce)',
    psychographics:
      'Value-conscious, style-seeking shoppers who want frequent wardrobe refreshes (denim, tees, shirts, athleisure) with comfort-first fabrics and easy-care finishes. Typical motivations: looking on-trend for college, weekends, casual workdays, and everyday commuting\u2014without spending on premium denim brands.',
    styleArchetypes: [
      'College casual (graphic tee + jeans)',
      'Everyday denim staple buyer (multiple fits/washes)',
      'Smart-casual upgrader (solid/striped shirts, mandarin-collar options)',
      'Athleisure weekender (joggers/shorts, camouflage and sporty basics)',
      'Budget outerwear shopper (bomber/puffer for winter layering)',
    ],
    demographicSummary:
      'Urban and semi-urban Indian men, typically students/early professionals, seeking reliable everyday casuals (especially denim) at value MRPs and frequent discounts across AJIO and Reliance Trends.',
  },

  descriptiveTags: [
    'denim-inspired casuals',
    'value fashion',
    'trend-led basics',
    'comfort-first',
    'graphic/typographic prints',
    'checks & stripes',
    'athleisure',
    'easy-care',
    'everyday wardrobe',
    'Reliance private label',
  ],

  priceRange: { currency: 'INR', min: 399, median: 999, max: 3499 },

  primaryCategories: [
    'Jeans (multiple fits/washes; distressed/washed)',
    'T-shirts (graphic/typographic, colourblock)',
    'Casual shirts (checks/stripes/solids; including mandarin-collar styles)',
    'Trousers & joggers',
    'Shorts',
    'Jackets & coats (bombers/puffers/biker styles)',
  ],

  coreValues: {
    voiceStyle:
      'Energetic, youth-leaning and benefit-led\u2014framing the brand as \u2018trendy\u2019 and \u2018comfortable\u2019, using playful fashion metaphors while directing shoppers through categories (tees \u2192 shirts \u2192 denim \u2192 athleisure).',
    heritageBackground:
      'DNMX is positioned as a Reliance Retail private-label fashion brand; trademark listings associate \u2018DNMX\u2019 with Reliance Retail Limited since 2007, indicating a long-running in-house brand strategy in India\u2019s value-fashion ecosystem.',
    designThemeSummary:
      'Denim-first casual wardrobe system: core jeans in mass-fashion fits (straight/slim/skinny) paired with casual tops (graphic tees, colourblock tees, checked/striped/solid shirts) and practical layering (bombers/puffers/biker jackets). Balances everyday basics with trend injections (tropical prints, camo, typography) for a youthful street-to-smart-casual mix.',
    brandValuesAndTones:
      'Accessibility and wearability: trend-forward but easy, comfort-oriented, and designed for repeat, everyday use with mix-and-match categories at value MRPs.',
    brandStoryAndIdeology:
      'Positions itself as a casualwear label delivering trend-led \u2018absolute fashion\u2019 with comfort and denim-inspired everyday style across tees, shirts, jeans, joggers and athleisure-led bottoms through Reliance\u2019s value-retail channels.',
  },

  culturalInfluences: {
    culturalReferences: [
      'Global denim culture (washed/distressed finishes, core 5-pocket storytelling)',
      'High-street casualwear codes (checks, stripes, mandarin-collar shirts as a crossover \u2018smart casual\u2019 cue)',
      'Street/athleisure signals (camouflage joggers/shorts, hooded silhouettes, graphic typography)',
    ],
    languageOrScriptUsage: [
      'English-led product naming and upbeat English copywriting (e.g., \u2018splash of style\u2019, \u2018style happy\u2019)',
    ],
    sensitivityNotes:
      'When using motifs like camouflage, tropical prints, or mandarin-collar references, keep the storytelling grounded in style/function (casual, smart-casual, weather layering) rather than attributing designs to specific communities or heritage crafts. Avoid claiming traditional Indian craft provenance unless the brand explicitly names a craft/region and provides maker details.',
    importantSymbolsOrMotifs: [
      'Denim washes (mid-wash, lightly washed, distressed)',
      'Graphic/typographic prints',
      'Checks and stripes',
      'Colourblocking',
      'Camo prints',
      'Hooded/layering details (hooded tees, puffers, bombers)',
    ],
    subcultureAssociations: [
      'AJIO deal-hunters and D2C/value e-commerce shoppers',
      'Reliance Trends mall shoppers',
      'College/first-job wardrobes built around affordable denim + graphic tees',
    ],
    festivalsOrOccasions: [
      'End-of-season and festive discount cycles (common in Indian value retail)',
      'Winter layering season (puffers/bikers/quilted jackets)',
    ],
  },

  sourceReferences: [
    'https://ajiogram.ajio.com/dnmx-men-quilted-slim-fit-hooded-puffer-jacket/p/443019877002',
    'https://trademarking.in/details/Dnmx-1530856.html',
  ],
};

const avaasa: BrandDNA = {
  brandId: 'avaasa',
  brandName: 'Avaasa',
  brandClassification:
    'Mass-to-value Indian ethnic/fusion wear \u2014 mix-and-match everyday kurtas and sets',

  visualIdentity: {
    paletteOverview:
      'A bright, everyday-wear Indian ethnic/fusion colour world designed to rotate easily between weekday, casual and light-festive use\u2014anchored by wearable neutrals and refreshed with print-led seasonal colours.',
    masterPalette: [
      'Soft neutrals and light grounds (cream, off-white, beige) for versatile daywear and print bases',
      'Warm earthy tones (rust, maroon, mustard) for ethnic familiarity and festive-adjacent looks',
      'Jewel and deep accents (navy, emerald, wine) for work-to-evening versatility',
      'Print-forward combinations (florals, block-style repeats, ikat-inspired geometrics) used as the hero across kurtas and sets',
    ],
    accessibilityNotes:
      'Prefer high-contrast garment-to-background pairings in e-commerce and campaigns; avoid busy backdrops that compete with all-over prints; keep text overlays clear with sufficient contrast against patterned areas and use solid scrims when placing copy on print-heavy imagery.',
  },

  designGuardrails: {
    shouldDo: [
      'Prioritise comfortable, repeat-wear fabrics (cotton/rayon/viscose blends) and easy-care finishes for everyday use',
      'Lead with flattering, practical silhouettes (straight and A-line kurtas; relaxed co-ords/sets) that work with leggings/churidars',
      'Use print as the primary design feature (florals, block-style repeats, ikat-inspired patterns) and keep styling simple to highlight wearability',
      'Offer mix-and-match compatibility across tops and bottoms to support wardrobe building and frequent repurchase',
      'Keep embellishment light and functional (yoke embroidery, subtle foil/mukaish-style shine) for \u2018occasion-ready\u2019 without heaviness',
      'Maintain value-fashion clarity in communication: direct benefit-led copy (comfort, versatility, easy styling) and consistent size/fit information',
      'Use clean, legible e-commerce imagery that clearly shows print scale, neckline, sleeve and hem details',
    ],
    shouldNotDo: [
      'Over-claim craft provenance (e.g., call something Ajrakh/handblock/ikat or artisan-made) unless explicitly verified at product level',
      'Overuse heavy festive embellishment or bridal/ceremonial motifs that conflict with everyday positioning',
      'Rely on complicated styling that makes outfits feel high-effort or hard to re-create for value-conscious shoppers',
      'Use culturally sensitive motifs casually or without context; avoid stereotyping \u2018ethnic\u2019 as a single generic print language',
      'Push premium/luxury cues (excessive packaging/overly editorial messaging) that may create a mismatch with accessible pricing and promotion-led retail context',
    ],
  },

  marketPositioning: {
    brandTier: 'Mass / Value',
    targetGender: 'Women',
    targetAgeRange: '20\u201345',
    regions: 'India (pan-India via Reliance Trends and AJIO)',
    psychographics:
      'Value-conscious, style-seeking Indian shoppers who want easy, mix-and-match ethnic looks for workdays, college, errands, and low-effort occasion dressing. Motivations include looking \u2018put-together\u2019 without heavy styling, preference for comfort fabrics and wearable silhouettes, and print-led fashion (florals/blocks/ikat-style) that feels fresh across multiple wears.',
    styleArchetypes: [
      'Smart-casual workwear kurta wearer',
      'Everyday ethnic minimal (straight/A-line kurtas + leggings)',
      'Print lover (floral/block/ikat) wardrobe builder',
      'Occasion-ready but not heavy (kurta-pant sets)',
    ],
    demographicSummary:
      'Urban and semi-urban Indian women, typically mid-income to upper mid-income, buying affordable ethnic/fusion staples (kurtas, sets, leggings, shrugs) via large-format value fashion retail and deal-led online shopping.',
  },

  descriptiveTags: [
    'Indian ethnic staples',
    'fusion wear',
    'mix-and-match separates',
    'print-forward kurtas',
    'everyday-to-occasion versatility',
    'affordable wardrobe building',
    'A-line & straight silhouettes',
    'leggings/churidar friendly',
  ],

  priceRange: { currency: 'INR', min: 299, median: 999, max: 2199 },

  primaryCategories: [
    'Kurtas',
    'Kurtis',
    'Kurta & pant sets / co-ords',
    'Leggings / churidars',
    'Shrugs / light layering pieces',
    'Fusion tunic-like tops',
  ],

  coreValues: {
    voiceStyle:
      'Bright, practical, and outfit-led\u2014direct styling promises and daily-wear utility. Signature messaging is motivational and routine-based (e.g., \u201cEvery day is different, so should be your look!\u201d) and positions the assortment as ready-made solutions across fusion + ethnic categories.',
    heritageBackground:
      'Avaasa is part of Reliance Trends\u2019 private-label portfolio; positioned as women\u2019s Indian wear with a fast-evolving \u201cMix \u2018n\u2019 Match\u201d range (salwar kurtas, churidars, and coordinating separates) distributed through Trends/AJIO channels.',
    designThemeSummary:
      'Wearable kurtas (straight and A-line) and easy co-ords/sets designed to recombine. Practical, flattering silhouettes supported by comfort fabrics (cotton/rayon/viscose) with print-as-hero storytelling (florals, block repeats, ikat-inspired motifs) and occasional light embellishment for lift.',
    brandValuesAndTones:
      'Affordability, versatility, and everyday confidence\u2014upbeat and empowering, encouraging frequent style changes without high effort or spend; quality reassurance often signposted through retail platform cues (e.g., \u2018assured quality\u2019).',
    brandStoryAndIdeology:
      'A practical fashion solution: an accessible \u2018designer-leaning\u2019 Indian/fusion wardrobe that makes daily dressing easier through mix-and-match building blocks (kurtas, leggings/churidars, shrugs, sets). Ideology aligns with democratized fashion at scale via Reliance Trends/AJIO\u2014broad distribution, accessible pricing, and rapid refresh of wearable Indian silhouettes.',
  },

  culturalInfluences: {
    culturalReferences: [
      'Contemporary Indian everyday ethnic wear (salwar-kurta ecosystem; mix-and-match dressing)',
      'Indian craft/print storytelling referenced within the parent retail ecosystem (Ajrakh and Indigo narratives; print-led Indian-to-fusion styling)',
      'Pan-India print vocabulary: florals, block-style prints, ikat-inspired patterning, and festive-season colour/print emphasis',
    ],
    languageOrScriptUsage: [
      'English-led product and brand communication on e-commerce; Hinglish-style naming such as \u201cMix \u2018n\u2019 Match\u201d',
    ],
    sensitivityNotes:
      'When referencing craft terms (e.g., Ajrakh, Indigo stories, Ikat, handblock), avoid treating them as generic \u201cethnic prints.\u201d Attribute them to their craft traditions/regions where possible, don\u2019t claim artisan/handcrafted provenance unless explicitly stated at product level, and avoid mixing sacred/ceremonial motifs into casual styling narratives.',
    importantSymbolsOrMotifs: [
      'Floral prints (everyday feminine staple)',
      'Block-print look / all-over repeats',
      'Ikat-inspired geometric patterning',
      'Light embellishment cues like yoke embroidery and foil/mukaish-style surface shine (dress-up without heaviness)',
    ],
    subcultureAssociations: [
      'Omnichannel value-fashion shoppers (Reliance Trends store customers + AJIO deal seekers)',
      'Everyday ethnicwear users (office/college/home) who build repeat outfits by swapping bottoms, dupattas, shrugs, and accessories',
    ],
    festivalsOrOccasions: [
      'Festive season colour/print refreshes within the wider retail calendar (seasonally festive palette and styling)',
      'Daily wear / weekday versatility positioned as a core use-case (\u201cEvery day is different\u2026\u201d)',
    ],
  },

  sourceReferences: [
    'https://trends.ajio.com/avaasa-mix-n-match-women-floral-print-a-line-kurta-pants-set/p/443103232_cream',
    'https://www.ril.com/sites/default/files/2023-01/Press-Release-Reliance-Trends-300-stores-(Final).pdf',
    'https://www.limeroad.com/brand/avaasa-mix-n-match-74834',
  ],
};

const fig: BrandDNA = {
  brandId: 'fig',
  brandName: 'FIG',
  brandClassification:
    'Accessible-premium women\u2019s western contemporary \u2014 smart separates for the working professional',

  visualIdentity: {
    paletteOverview:
      'Modern Indian high-street colour world built for repeatable weekday dressing: office-safe neutrals and wearable mid-tones, punctuated by print-led seasonal brights for day-to-night and weekend looks. Colours support mix-and-match separates, with occasional festive-leaning accents through florals and contrast colour-blocking.',
    masterPalette: [
      'Core neutrals: black, white, navy, charcoal, beige/tan (for office-ready foundations)',
      'Wearable solids: dusty pinks, mauves, wine, teal, olive, rust, mustard (for easy statement without looking loud)',
      'Print palettes: floral medleys, stripes, colour-blocking combinations that pair back to neutral bottoms',
      'Metallic/embellishment accents used sparingly (e.g., subtle trims) rather than heavy shine',
    ],
    accessibilityNotes:
      'Ensure strong garment-to-background contrast in studio and e-commerce imagery (avoid beige-on-beige and dark-on-dark). Maintain readable typography and clear separation for print-heavy garments by using simple backdrops. When featuring colour-blocking/stripes, avoid low-contrast pairings that reduce pattern legibility at thumbnail size.',
  },

  designGuardrails: {
    shouldDo: [
      'Prioritise versatile silhouettes that transition from office to evening (shift, fit-and-flare, tailored trousers, polished shirts)',
      'Use easy-care, comfortable fabrics suitable for frequent wear and weekly rotation; clearly communicate care and comfort benefits',
      'Balance solids with print-led tops/dresses; keep prints wearable and office-appropriate in scale and placement',
      'Offer flattering, dependable fits with consistent sizing; include styling guidance for work-to-weekend use-cases',
      'Maintain value-led, promo-ready merchandising (clear pricing ladders, mix-and-match separates) without compromising perceived polish',
      'Use clean, bright studio photography that shows true colour, drape, and detailing (tassels/embroidery) clearly',
    ],
    shouldNotDo: [
      'Over-claim specific craft lineage or regional provenance unless explicitly verified for the exact product/capsule',
      'Lean into overly ornate/bridal or heavily embellished looks that break the \u2018smart, wearable, repeatable\u2019 promise',
      'Use extremely fragile, high-maintenance fabrics or finishes without clear care messaging (conflicts with easy-care positioning)',
      'Over-index on ultra-trendy silhouettes that reduce wardrobe longevity or office appropriateness',
      'Use confusing, low-contrast imagery/backgrounds that make products hard to read in thumbnails or mobile browsing',
    ],
  },

  marketPositioning: {
    brandTier: 'Accessible Premium',
    targetGender: 'Women',
    targetAgeRange: '24\u201340',
    regions: 'India (pan-India via Reliance Trends stores and AJIO online)',
    psychographics:
      'Discerning, independent, working and socially active urban women who want dependable \u2018smart\u2019 outfits that read polished at work but can switch to brunch/coffee dates and evenings with minimal styling changes. Motivated by: look-put-together ease, flattering silhouettes, versatile separates, and trend updates without designer price points. Comfort and easy-care fabrics matter because pieces are used in repeat weekly rotation.',
    styleArchetypes: [
      'Corporate-chic minimal dresser',
      'Smart-casual weekender',
      'Boho-printed top + trousers wearer',
      'Desk-to-dinner dresser',
      'Indo-western/fusion experimenter',
    ],
    demographicSummary:
      'Urban/mini-metro Indian women, mid-income to upper-mid-income, largely working professionals seeking versatile, trend-relevant westernwear and smart separates at accessible prices (often purchased during AJIO/Trends sale cycles).',
  },

  descriptiveTags: [
    'working-woman wardrobe',
    'corporate chic',
    'smart separates',
    'prints + solids',
    'easy-care',
    'boho details (tassels/embroidery)',
    'day-to-night',
    'modern Indian high-street',
    'value-driven',
  ],

  priceRange: { currency: 'INR', min: 399, median: 1499, max: 2999 },

  primaryCategories: [
    'Tops',
    'Shirts',
    'Dresses',
    'Bottomwear (trousers, palazzos, culottes, leggings, skirts, joggers)',
    'Innerwear (bras)',
    'Occasional accessories/bags',
  ],

  coreValues: {
    voiceStyle:
      'Retail-editorial but practical and upbeat: short, benefit-forward styling prompts (e.g., how to \u2018channel a boho look\u2019 or achieve \u2018corporate chic\u2019), with reassuring, choice-heavy language (\u2018you can find your choice\u2026\u2019, \u2018for every occasion\u2019). The broader AJIO tone pushes self-expression and confidence, framing fashion as personal empowerment.',
    heritageBackground:
      'FIG operates as a Reliance Trends private label/own-brand within the Reliance Retail fashion ecosystem, positioned for working women and distributed through Trends\u2019 omnichannel network and AJIO. Trends itself was built to \u2018democratize fashion\u2019 in India and scales across a wide store footprint, making FIG a scaled, mass-relevant private-label brand rather than a niche designer house.',
    designThemeSummary:
      'A \u2018complete wardrobe\u2019 approach focused on modern working-woman dressing: (1) clean solids in wearable hues, (2) print-driven blouses/tops and feminine detail (tassels, embroidery), (3) office-appropriate shirts and tailored bottoms, and (4) occasion-flex dresses\u2014from shift dresses for corporate polish to fit-and-flare/printed dresses for off-duty and evenings.',
    brandValuesAndTones:
      'Versatility, polish, and confidence without fuss\u2014clothes that look smart, feel wearable, and are easy to style across multiple moments of a woman\u2019s week. Emotionally: self-assured, capable, contemporary, and optimistic.',
    brandStoryAndIdeology:
      'FIG\u2019s ideology is rooted in accessible fashion-as-empowerment: it sits inside a retail platform that encourages fearless personal style and self-expression, while delivering trend-led, practical wardrobe pieces for working women at value-led price points (often discount-driven). It\u2019s less about a single founder narrative and more about a scaled private-label promise: relevant trends + wearable design + dependable availability through Reliance\u2019s retail engine.',
  },

  culturalInfluences: {
    culturalReferences: [
      'Urban Indian workwear needs (polished, repeatable outfits)',
      'Global high-street trend language (stripes, colour-blocking, high-low hems, shift dresses)',
      'Indo-western fusion cues (select Indian-inspired motifs and print stories used in contemporary silhouettes)',
      'Bohemian craft-leaning styling (tassels, light embroidery accents)',
    ],
    languageOrScriptUsage: [
      'English-first brand communication across AJIO/Trends interfaces (category-led, benefit-driven copy such as \u2018corporate chic\u2019, \u2018boho look\u2019, \u2018style savvy\u2019)',
      'Occasional Hinglish-style retail phrasing appears in platform content, but FIG brand descriptors are primarily English',
    ],
    sensitivityNotes:
      'When referencing Indian motifs/embroidery/print stories, avoid claiming a specific craft lineage unless the product copy explicitly names it. Describe influences as \u2018Indian-inspired motifs\u2019 or \u2018fusion detailing\u2019 rather than attributing to a region/community. If a named craft (e.g., ajrakh/indigo stories) is used in broader Trends storytelling, verify it is present in the FIG capsule before using it in FIG-specific narratives.',
    importantSymbolsOrMotifs: [
      'Floral and medley prints',
      'Stripes and colour-blocking',
      'High-low hems',
      'Shift silhouettes',
      'Fit-and-flare shapes',
      'Tassels and light embroidery',
      'Tailored trousers/clean waistbands for office styling',
    ],
    subcultureAssociations: [
      'Office-going millennials shopping Reliance Trends + AJIO',
      'D2C/omnichannel value seekers who wait for big-sale moments',
      'Smart-casual minimalists who still want print-led \u2018easy statement\u2019 pieces',
    ],
    festivalsOrOccasions: [
      'Workwear and weekday dressing (core driver)',
      'Brunch/coffee-date casualwear',
      'Evening engagements and semi-formal social events (desk-to-dinner dressing)',
    ],
  },

  sourceReferences: [
    'https://ajiogram.ajio.com/fig-women-straight-fit-flat-front-pants/p/443050282009',
    'https://www.ril.com/sites/default/files/2023-01/Press-Release-Reliance-Trends-300-stores-(Final).pdf',
    'https://trends.ajio.com/help/whoweare',
  ],
};

const teamspirit: BrandDNA = {
  brandId: 'teamspirit',
  brandName: 'Teamspirit',
  brandClassification:
    'Mass-to-accessible sporty-casual \u2014 athleisure and everyday basics for young adults',

  visualIdentity: {
    paletteOverview:
      'Sporty-casual, mass-market colour world built around wearable neutrals (black, grey, navy) with energetic brights used for graphics, stripes and colourblocking. Supports everyday/college/work-from-anywhere dressing with seasonal pops for trend updates and winter layering.',
    masterPalette: [
      'Core neutrals: black, charcoal/grey melange, white',
      'Dark basics: navy, deep olive',
      'Sport brights: red, cobalt/royal blue, yellow accents for stripes/prints',
      'Pastels/seasonal tones for women\u2019s casual tops and dresses',
      'Colourblocking/contrast panels combining neutrals + a single bright accent',
    ],
    accessibilityNotes:
      'Maintain strong contrast between typography/graphics and base garment colours (e.g., white on dark, dark on light). Avoid low-contrast heather-on-heather print placements. Ensure product imagery uses clean, uncluttered backgrounds and accurate colour representation for value-led online shoppers.',
  },

  designGuardrails: {
    shouldDo: [
      'Prioritize comfort-first athleisure fits and easy-care fabrics suitable for repeat wear (tees, hoodies, joggers).',
      'Use trend-right but practical details: stripes, colourblock panels, typographic/graphic prints, subtle texture on polos.',
      'Keep pricing/value communication clear (MRP, discounts) and product copy focused on fit, comfort, and versatility.',
      'Maintain inclusive, youth-centric styling (college/young professional) with mix-and-match basics for wardrobe building.',
      'Use straightforward studio product photography plus sporty lifestyle cues that emphasize movement and everyday wear.',
      'Offer seasonal layering updates (sweatshirts/hoodies/jackets) without moving into technical-performance claims.',
    ],
    shouldNotDo: [
      'Position as luxury/designer fashion or over-index on premium heritage narratives not supported by the private-label model.',
      'Use culturally specific craft/heritage claims (artisan, handloom, regional craft) unless explicitly verified on official brand channels.',
      'Overcomplicate silhouettes with high-maintenance trims or delicate fabrics that conflict with value basics and easy care.',
      'Rely on overly niche/avant-garde graphics that reduce mass appeal and repeat purchase potential.',
      'Make technical sports-performance promises (professional training, advanced moisture-wicking) unless materially validated by product specs.',
    ],
  },

  marketPositioning: {
    brandTier: 'Mass / Value',
    targetGender: 'Men & Women',
    targetAgeRange: '18\u201335',
    regions: 'India (via AJIO and Reliance Trends ecosystem)',
    psychographics:
      'Value-conscious, trend-aware shoppers seeking easy, daily-wear sporty casuals (graphics/stripes/colourblock) at affordable prices. They buy for comfort, repeat-wear, and wardrobe-building staples (tees, hoodies, joggers) with occasional fashion updates (shift/bodycon dresses, statement sleeves).',
    styleArchetypes: [
      'Athleisure everyday',
      'College / young professional casual',
      'Street-casual graphics wearer',
      'Smart-casual weekender',
    ],
    demographicSummary:
      'India-based AJIO/Reliance Trends customer, primarily Gen Z to young millennials, mid-to-lower-mid spending power, seeking affordable sporty-casual clothing and wardrobe staples with trend detailing.',
  },

  descriptiveTags: [
    'athleisure',
    'sporty casual',
    'value basics',
    'typographic/graphic prints',
    'stripes',
    'colourblock',
    'hoodies & sweatshirts',
    'joggers/track pants',
    'Reliance Trends private label',
    'AJIO in-house brand',
  ],

  priceRange: { currency: 'INR', min: 199, median: 699, max: 1799 },

  primaryCategories: [
    'T-shirts & polos',
    'Tops',
    'Sweatshirts & hoodies',
    'Joggers / track pants',
    'Shorts (incl. cargo shorts)',
    'Casual dresses (e.g., shift/bodycon styles)',
  ],

  coreValues: {
    voiceStyle:
      'Energetic, youthful, and practical\u2014positioning basics as fun and trend-forward (\u201cfunkiness to basics\u201d, \u201cstand out in a crowd\u201d) while framing the wardrobe as sporty casual and easy to style.',
    heritageBackground:
      'Teamspirit is positioned on AJIO/Trends as an in-house brand associated with Reliance Trends, operating as part of Reliance Retail\u2019s private-label portfolio and scaled through AJIO\u2019s distribution and promotions.',
    designThemeSummary:
      'Sport-inspired casualwear and athleisure at mass pricing: crew and graphic tees, striped/texture polos, joggers/track pants, shorts/cargo shorts, and sweatshirts/hoodies. For women, casual dresses (e.g., shift/bodycon) and trend tops with sleeve/print details extend beyond pure basics.',
    brandValuesAndTones:
      'Accessibility and repeatable everyday value, with comfort-first silhouettes and trend cues (graphics/stripes/colourblock) to keep basics feeling current; upbeat, youthful, style-boosting rather than technical-performance sportswear.',
    brandStoryAndIdeology:
      'Framed as a Reliance Trends in-house proposition delivering exclusive, affordable athleisure for men and women with broad assortment breadth (tops to outerwear) and platform-led scaling typical of Reliance private labels on AJIO.',
  },

  culturalInfluences: {
    culturalReferences: [
      'Global athleisure and sporty-casual styling translated for Indian mass retail',
      'Western casual staples (polo tees, hoodies, joggers) mixed with trend-led womenswear options like shift/bodycon dresses',
    ],
    languageOrScriptUsage: [
      'English-first product and brand communication (AJIO/Trends copy)',
      'Frequent use of fashion-utility descriptors (fit, sleeve details, prints) and sport-casual framing',
    ],
    sensitivityNotes:
      'Teamspirit\u2019s visible identity is largely sportswear/athleisure and western casual (graphics, stripes, colourblocking) rather than direct use of culturally specific craft. If referencing India in storytelling, keep it grounded in everyday Indian climate/lifestyle needs (breathability, easy care, layering) and avoid claiming heritage crafts or regional artisanship unless explicitly verified on official brand channels.',
    importantSymbolsOrMotifs: [
      'Stripes (incl. polo striping / patterned weave)',
      'Typographic/graphic prints',
      'Colourblocking',
      'Sporty silhouettes (hooded tops, raglan cues, zip-front layers)',
    ],
    subcultureAssociations: [
      'AJIO/Reliance private-label shoppers (deal/value driven, high repeat purchase behavior on platform)',
      'Everyday athleisure wearers (comfort-led casual styling)',
    ],
    festivalsOrOccasions: [
      'Primarily everyday casual/active styling rather than occasionwear; seasonal emphasis shows up through winter layering categories (sweatshirts/hoodies)',
    ],
  },

  sourceReferences: [
    'https://trends.ajio.com/teamspirit-men-regular-fit-joggers/p/443050453_black',
  ],
};

const siyahi: BrandDNA = {
  brandId: 'siyahi',
  brandName: 'SIYAHI',
  brandClassification:
    'Value contemporary ethnic/fusion wear \u2014 print-led everyday kurtas and separates',

  visualIdentity: {
    paletteOverview:
      'A print-led, contemporary-ethnic colour world designed for daily wear and smart-casual work use\u2014anchored in classic Indian craft-inspired hues (especially indigo/blue families associated with ajrakh/ajrak stories) and balanced with wearable neutrals and seasonal brights for variety across office, casual and low-key festive moments.',
    masterPalette: [
      'Indigo, navy and deep blue families for ajrakh/ajrak-inspired stories and everyday kurtas',
      'Earthy neutrals (black, off-white/ivory, beige, tan) to keep prints wearable and mixable',
      'Warm craft tones (rust, brick, maroon, mustard/ochre) commonly paired with block/dabu-style prints',
      'Fresh accent brights (coral, teal, green) used as seasonal refreshes for print drops and casual tops/sets',
    ],
    accessibilityNotes:
      'Ensure clear contrast between garment and background in e-commerce imagery (avoid busy backgrounds with dense prints). Use readable overlay text with sufficient contrast against patterned areas; prefer solid colour bands or clean negative space for copy. Maintain consistent white balance so print colours remain accurate and distinguishable for shoppers.',
  },

  designGuardrails: {
    shouldDo: [
      'Keep silhouettes practical and everyday-first (straight/A-line/flared kurtas, tunics, easy bottoms) with comfort-focused fits',
      'Lead with print stories (ajrakh/ajrak, block, dabu-inspired, florals) while keeping styling mix-and-match friendly',
      'Offer coordinated pairings (kurta-bottom sets/co-ord style) and layering options (ethnic jackets) for versatility',
      'Communicate value clearly (MRP vs offer price, fabric/care details, size inclusivity) and provide styling tips for office-to-weekend wear',
      'Use e-commerce-optimized photography: clear front/back views, close-ups of print, accurate colour representation',
    ],
    shouldNotDo: [
      'Over-claim artisan provenance or certification for prints/crafts unless explicitly verified on the specific product page',
      'Collapse distinct regional craft practices into generic \u2018ethnic\u2019 claims; avoid inaccurate naming of techniques/regions',
      'Drift into heavy occasionwear positioning (highly ornate construction) that conflicts with the everyday, value contemporary-ethnic tier',
      'Use confusing terminology or inconsistent product naming that makes online discovery difficult (keep craft/fit terms standard and accurate)',
      'Use cluttered lifestyle imagery that reduces legibility of prints, fit and garment details',
    ],
  },

  marketPositioning: {
    brandTier: 'Value / Mass',
    targetGender: 'Women',
    targetAgeRange: '22\u201340',
    regions: 'India (nationwide via AJIO / Reliance Retail ecosystem)',
    psychographics:
      'Modern Indian women seeking easy, mix-and-match ethnic and fusion pieces for daily wear\u2014office-appropriate kurtas, casual tunics/tops, and printed separates\u2014motivated by comfort, variety in prints/colours, and \u2018traditional-meets-modern\u2019 styling without the formality of occasionwear.',
    styleArchetypes: [
      'Everyday ethnic essentialist (straight/A-line kurtas + easy bottoms)',
      'Smart-casual workwear dresser (kurti/tunic with jeans; light ethnic layering)',
      'Print-led weekender (ajrakh/block/dabu/florals; co-ords/sets when needed)',
    ],
    demographicSummary:
      'Urban and semi-urban Indian women in their 20s\u201340s shopping online for affordable, contemporary ethnic/fusion wardrobe staples\u2014kurtas, tunics/tops, bottoms and light layers\u2014prioritising comfort and print variety.',
  },

  descriptiveTags: [
    'contemporary ethnic',
    'fusion wear',
    'print-led',
    'ajrakh/ajrak influence',
    'block prints',
    'dabu prints',
    'Bagru-inspired accents',
    'everyday kurtas',
    'easy separates',
    'layering jackets',
    'value pricing',
  ],

  priceRange: { currency: 'INR', min: 499, median: 899, max: 1499 },

  primaryCategories: [
    'Kurtas (A-line, straight, flared)',
    'Kurtis & tunics',
    'Fusion/ethnic tops',
    'Bottoms: palazzos, salwars, skirts',
    'Kurta-bottom sets / co-ord style sets',
    'Ethnic jackets / layering pieces',
  ],

  coreValues: {
    voiceStyle:
      'Upbeat, trend-forward and helpful styling guidance\u2014frames the brand as \u2018made for the woman of today,\u2019 emphasising variety (styles, fits, prints, colours) and mix-and-match pairing tips to stay \u2018on top of the style charts.\u2019',
    heritageBackground:
      'Operates as a Reliance Retail-owned brand identity (trademark: \u201cSiyahi By Avaasa\u201d registered for women\u2019s ethnic clothing; product pages also list Reliance Retail Limited as manufacturer/marketer). Built for scaled distribution through AJIO / Reliance channels rather than a single-designer atelier heritage.',
    designThemeSummary:
      'Contemporary Indian everyday wardrobe built on core ethnic silhouettes (straight/A-line/flared kurtas) plus fusion styling (kurtis/tunics and ethnic-touch tops) with coordinated bottoms (palazzos, salwars, skirts). Strong reliance on print stories (ajrakh/ajrak, florals, block and dabu-inspired patterns) and accessible layering (ethnic jackets) to add drama without heavy occasionwear construction.',
    brandValuesAndTones:
      'Accessibility, versatility, comfort and modernised tradition\u2014\u2018tradition meets modernity\u2019 tone, positioned as stylish yet wearable day-to-day ethnic/fusion fashion.',
    brandStoryAndIdeology:
      'SIYAHI is presented as a contemporary ethnic/fusion label designed for modern Indian women, offering a broad, curated mix of silhouettes and prints to simplify everyday Indian dressing. As a Reliance Retail-linked brand/trademark, its ideology is mass-access fashion: on-trend prints and practical silhouettes delivered at value price points through large-scale retail distribution.',
  },

  culturalInfluences: {
    culturalReferences: [
      'North/West Indian print and craft vocabulary (ajrakh/ajrak, block prints, dabu) used as key styling identifiers',
      'Regional craft cues in layering (Bagru-inspired printing; Kullu-work referenced for sleeveless jackets)',
      'Classic Indian ethnic silhouettes modernised for everyday wear (A-line/straight kurtas; tunics with jeans)',
    ],
    languageOrScriptUsage: [
      'English-first communication on AJIO; uses Indian craft/wardrobe terms such as ajrak/ajrakh, dabu, Bagru, Kullu work, palazzo, kurta, churidar, patiala, kolhapuri',
    ],
    sensitivityNotes:
      'When referencing heritage prints/crafts (ajrakh/ajrak, dabu, Bagru, Kullu), attribute them as inspirations/print stories rather than claiming direct artisan provenance unless the specific product page explicitly states handcraft technique, artisan cluster, or certification. Avoid flattening distinct regional practices into a single \u2018ethnic\u2019 category; name the technique/region accurately and keep claims product-specific.',
    importantSymbolsOrMotifs: [
      'Ajrak/ajrakh-style geometric and indigo-inspired print language',
      'Floral prints',
      'Block-print look motifs',
      'Dabu-inspired patterns',
      'Layering silhouettes (ethnic jackets; sleeveless/longline options)',
    ],
    subcultureAssociations: [
      'Value-conscious D2C/e-commerce shoppers',
      'Everyday-ethnic wearers (work + casual)',
      'Print-and-colour seekers who rotate kurtas/sets as wardrobe staples',
    ],
    festivalsOrOccasions: [
      'Primarily daily wear and smart casual use-cases; pieces can flex into low-key festive moments via print intensity and light layering, but the core message is \u2018chic, everyday\u2019 contemporary Indian wear',
    ],
  },

  sourceReferences: [
    'https://www.ajio.com/b/siyahi?classifier=intent&gridColumns=3&query=%3Anewn',
    'https://trends.ajio.com/siyahi-women-checked-straight-kurta-pants-set/p/443050861002',
    'https://www.quickcompany.in/trademarks/2702396-siyahi-by-avaasa',
  ],
};

const avaasaSet: BrandDNA = {
  brandId: 'avaasaSet',
  brandName: 'Avaasa Set',
  brandClassification:
    'Mid-market value-led Indian wear sets \u2014 coordinated kurta-bottom outfits for everyday and festive-lite',

  visualIdentity: {
    paletteOverview:
      'Bright-yet-wearable Indian-wear colour stories anchored by light neutrals and grounded deep tones, then lifted with cheerful brights. This supports everyday/office looks (off-white, sepia, indigo), casual/weekend freshness (pista, coral, mauve), and festive-lite elevation (mustard, deep purple, richer blues) without feeling high-risk or runway-driven.',
    masterPalette: [
      'Light neutrals for clean, office-ready bases (off-white, cream) paired with darker anchors (indigo blue, deep purple)',
      'Warm Indian-wear brights for upbeat, flattering prints and accents (coral, mustard)',
      'Soft, feminine mid-tones for everyday polish (mauve, pista green)',
      'Earthy grounding shades for versatility and perceived value (sepia brown)',
    ],
    accessibilityNotes:
      'Use high-contrast pairings for text and UI over apparel imagery (e.g., dark text over off-white; white text over indigo/deep purple). Avoid placing small type over busy florals/stripes; add a solid overlay/gradient if needed. Ensure key CTAs meet contrast standards and keep product colour accuracy consistent across devices by using neutral backdrops and controlled lighting.',
  },

  designGuardrails: {
    shouldDo: [
      'Lead with coordinated \u2018ready outfit\u2019 solutions (kurta + bottom, suit sets, easy dresses) and clearly label what\u2019s included (e.g., with/without dupatta).',
      'Prioritize comfort and wearability: breathable, easy-care fabrics; movement-friendly fits in straight and A-line silhouettes; practical necklines and sleeve lengths for everyday use.',
      'Use commercial, flattering prints (especially florals and stripes) and balanced placement to look \u2018put together\u2019 quickly for work-to-dinner use.',
      'Offer versatile colourways that style easily (light neutrals + bright accents) and keep a consistent master palette across drops for recognizability.',
      'Use embroidery as a controlled \u2018upgrade\u2019 lever for festive-lite capsules; keep embellishment comfortable and not overly heavy/scratchy.',
      'Keep naming and copy retail-direct and benefit-led (occasion readiness, versatility, value), aligned with mass omnichannel merchandising.',
      'Use clean, consistent product photography with accurate colour, clear set visibility, and multiple views to support comparison shopping.',
    ],
    shouldNotDo: [
      'Do not over-claim heritage crafts or regional techniques (e.g., \u2018Ajrakh\u2019, \u2018Bagru\u2019, \u2018ikat\u2019, \u2018chikankari\u2019, \u2018handblock\u2019) unless explicitly verified on the product page with technique/origin details.',
      'Avoid high-risk runway trends, extreme proportions, or styling that reduces practicality for office/everyday use.',
      'Do not rely on overly ornate, heavy festive positioning that conflicts with \u2018festive-lite\u2019 and value-forward convenience.',
      'Avoid cluttered graphics or low-contrast layouts that make prints and details hard to read; do not place key copy over busy motifs without overlays.',
      'Do not present ambiguous set contents or hidden pricing; avoid mismatched colour grading that misrepresents garment shades across channels.',
    ],
  },

  marketPositioning: {
    brandTier: 'Mid-market / Value',
    targetGender: 'Women',
    targetAgeRange: '20\u201345',
    regions: 'India (pan-India; omnichannel via Reliance Trends stores and e-commerce)',
    psychographics:
      'Value-forward shoppers who want \u2018ready outfit\u2019 convenience (complete kurta set / suit set / dress) rather than building separates. They are discount-aware, compare across marketplaces, and prioritize versatility (work-to-dinner, family functions, small festive moments) and comfort/ease of movement over runway trend risk.',
    styleArchetypes: [
      'Office ethnic (straight kurta + palazzo/salwar)',
      'Smart-casual weekender (printed A-line / fit-and-flare dresses)',
      'Festive-lite dresser (embroidered kurta + pants/dupatta sets)',
      'Family-function attendee (coordinated kurta suit sets)',
    ],
    demographicSummary:
      'India-based women, typically early-career to mid-career and family shoppers, seeking coordinated Indian-wear sets and dresses at accessible mid-market MRPs with frequent promotions; preference for versatile silhouettes that can cover office, daily wear, and light festive use.',
  },

  descriptiveTags: [
    'Indian wear sets',
    'kurta-palazzo sets',
    'salwar/kurta sets',
    'printed florals',
    'stripes',
    'embroidered occasionwear (festive-lite)',
    'value-led fashion',
    'mix-and-match friendly',
    'easy outfit solutions',
  ],

  priceRange: { currency: 'INR', min: 999, median: 1999, max: 2799 },

  primaryCategories: [
    'Kurta & palazzo sets',
    'Kurta & pants sets',
    'Kurta suit sets (with dupatta in some styles)',
    'Kurta & salwar sets',
    'A-line / fit-and-flare dresses',
    'Layered/jacket dresses',
  ],

  coreValues: {
    voiceStyle:
      'Value-forward, practical fashion language emphasizing style + quality at accessible pricing and framing outfits as easy, coordinated solutions. Retail-direct communication with category-led naming (e.g., \u2018Women Printed Kurta Suit Set\u2019) and benefits expressed through versatility and occasion-readiness rather than couture storytelling.',
    heritageBackground:
      'AVAASA (and AVAASA SET as the coordinated sets line) operates within Reliance Trends\u2019 own-brand portfolio, positioned around \u2018fashion at great value\u2019 and focused on women\u2019s Indian wear including salwar kurtas, churidars, and mix-and-match ranges\u2014context for AVAASA SET\u2019s kurta-set and suit-set focus.',
    designThemeSummary:
      'Contemporary Indian-wear sets and easy dresses: straight and A-line kurtas paired with palazzos/salwars plus fit-and-flare/A-line dresses. Prints (especially florals and stripes) are the key identity driver; embroidery is the primary elevation lever for occasion-forward, festive-lite styles.',
    brandValuesAndTones:
      'Accessibility and value without feeling basic; comfort and repeat wearability; versatility across office/daily/festive-lite; cheerful, feminine, and polished tone via florals and bright-but-wearable colour stories.',
    brandStoryAndIdeology:
      'Part of a large Indian fashion retail ecosystem that democratizes on-trend dressing through wide reach and value-led own brands. AVAASA SET\u2019s ideology centers on making Indian-wear coordination effortless via sets while keeping looks current through commercial prints and light embellishment for day-to-evening needs.',
  },

  culturalInfluences: {
    culturalReferences: [
      'Contemporary Indian ethnicwear wardrobe staples (salwar kurtas, churidars, mix-and-match sets)',
      'Everyday-to-occasion Indian dressing culture (workwear ethnic + small festive gatherings)',
      'Print traditions interpreted for mass retail (floral placements, stripe rhythms; modern repeats rather than archival reproductions)',
      'High-rotation colour stories common in Indian wear (mustard, pista green, off-white, coral, mauve, blues, purples)',
    ],
    languageOrScriptUsage: [
      'English-first product naming and UI on Reliance Trends e-commerce',
      'Common Indian-wear terms used as standard category language: \u2018kurta\u2019, \u2018salwar\u2019, \u2018palazzo\u2019, \u2018dupatta\u2019, \u2018churidar\u2019',
    ],
    sensitivityNotes:
      'Avoid claiming specific heritage crafts (e.g., \u2018handblock\u2019, \u2018Ajrakh\u2019, \u2018Bagru\u2019, \u2018ikat\u2019, \u2018chikankari\u2019) unless the product page explicitly confirms technique and origin. When referencing tradition, describe motifs neutrally (e.g., \u2018floral print\u2019, \u2018stripe\u2019, \u2018embroidered detailing\u2019) and do not attribute to a region/community without substantiation. Position designs as contemporary, mass-retail interpretations of Indian-wear codes\u2014respectful, practical, and accessible.',
    importantSymbolsOrMotifs: [
      'Floral prints (recurring across dresses and kurta sets)',
      'Stripes (as an all-over or panel-led rhythm)',
      'Embroidery as elevation (festive-lite sets)',
      'A-line and straight silhouettes (core flattering shapes for Indian wear sets)',
    ],
    subcultureAssociations: [
      'Value-conscious omnichannel shoppers (Reliance Trends stores + e-commerce)',
      'Working women and everyday ethnicwear buyers seeking quick coordinated looks',
      'Family shoppers purchasing for multiple occasions (daily, office, festive-lite)',
    ],
    festivalsOrOccasions: [
      'Everyday/workwear Indian dressing',
      'Festive-lite events (small pujas, dinners, celebrations) supported by embroidered set options',
      'Wedding-season shopping context within the larger Trends ecosystem',
    ],
  },

  sourceReferences: [
    'https://reliancetrends.com/',
    'https://www.trends.ajio.com/',
  ],
};

const rio: BrandDNA = {
  brandId: 'rio',
  brandName: 'RIO',
  brandClassification:
    'Mass/value trend-led westernwear \u2014 playful dresses and casual separates for young women',

  visualIdentity: {
    paletteOverview:
      'RIO\u2019s colour world aligns with Indian high-street, trend-led womenswear: bright and playful accents balanced with easy neutrals for daily wear. The palette supports casual college/early-career dressing (denim + neutrals), weekend/outing looks (pops of colour and prints), and seasonal/vacation drops (lighter, fresher tones and florals).',
    masterPalette: [
      'Everyday neutrals: black, white, off-white/cream, grey melange',
      'Denim blues: light-wash to mid indigo, paired with whites and brights',
      'Playful brights: reds/corals, pinks, cobalt/royal blues for statement tops and dresses',
      'Pastels and soft brights for seasonal drops: sky blue, mint, lilac, peach',
      'Print-led colour mixes: floral multicolours and contrast trims used on easy silhouettes (tiered dresses, co-ords)',
    ],
    accessibilityNotes:
      'Use high-contrast pairings for text over imagery (e.g., dark text on light backgrounds or white text on deep solids). Avoid placing key product details over busy floral prints; introduce solid overlays/gradients when needed. Ensure garments photographed against backgrounds that don\u2019t match the dominant garment tone (e.g., light dresses on mid/dark backgrounds) to keep silhouettes legible in small thumbnails.',
  },

  designGuardrails: {
    shouldDo: [
      'Prioritize easy-to-style, trend-forward western silhouettes (A-line/shift/skater dresses, ribbed tops, casual shirts, jumpsuits, co-ords) with comfort-focused fits suitable for Indian daily wear.',
      'Keep pricing/value cues visible in communication (offers, deals, new-in drops, easy exchange/assurance messaging) consistent with mass/value positioning.',
      'Use playful prints and approachable details (florals, ruffles/tiering, smocking, tie-ups, belts) to deliver \u2018quick styling wins\u2019 for outings and casual occasions.',
      'Maintain practical fabric/seasonality decisions for Indian climates (breathable options for summer, sensible layering pieces like light jackets/puffers for winter capsules).',
      'Ensure product photography and listings highlight fit, key details (smocking, belts, textures), and styling versatility (day-to-night, campus-to-weekend).',
      'Write in a benefit-led, upbeat, youthful tone focused on wearability, comfort, and trend relevance rather than designer/heritage craftsmanship claims.',
    ],
    shouldNotDo: [
      'Avoid positioning language that implies luxury, couture, or long-investment craftsmanship; keep narrative aligned with accessible, trend-led value fashion.',
      'Avoid over-claiming specific Indian craft heritages, regional communities, or traditional techniques unless a product explicitly uses and names them with accurate sourcing.',
      'Avoid overly complex construction, high-maintenance materials, or delicate trims that conflict with frequent-wear, price-conscious use cases.',
      'Avoid inconsistent colour/background choices in imagery that reduce garment contrast (e.g., black outfits on dark backgrounds) or text placed directly on busy prints without overlays.',
      'Avoid niche or exclusionary styling that skews older/premium; keep sizing/fit and communication inclusive for young, mass-market shoppers.',
    ],
  },

  marketPositioning: {
    brandTier: 'Mass / Value',
    targetGender: 'Women',
    targetAgeRange: '16\u201330',
    regions: 'India (national reach via Reliance Trends retail network and online)',
    psychographics:
      'Trend-seeking, price-conscious shoppers who want fast wardrobe refreshes for college, casual outings, and going-out moments. They value easy styling (sets, dresses, co-ords), comfortable fits, and playful prints/details\u2014buying frequently during promotions and seasonal drops rather than investing in long-lasting luxury pieces.',
    styleArchetypes: [
      'College/early-career casual',
      'Smart-casual weekender',
      'Easy day-dress wearer',
      'Going-out/party casual',
      'Vacation/holiday dresser',
    ],
    demographicSummary:
      'Young women in India (metro + tier-2/3 cities), typically students and early professionals seeking affordable, trend-forward westernwear for daily wear and social occasions, often shopping during sales/promotions.',
  },

  descriptiveTags: [
    'value fashion',
    'trend-led',
    'youthful',
    'westernwear',
    'playful prints',
    'easy dresses',
    'casual separates',
    'seasonal drops',
    'Reliance Trends private label',
  ],

  priceRange: { currency: 'INR', min: 399, median: 799, max: 2099 },

  primaryCategories: [
    'Dresses (day dresses, fit & flare, tiered styles)',
    'Tops (ribbed knits, fashion tops)',
    'Shirts',
    'Jackets & outerwear (including puffers)',
    'Jeans & fashion bottoms',
    'Jumpsuits',
    'Loungewear / sleepwear basics (e.g., pyjamas)',
  ],

  coreValues: {
    voiceStyle:
      'Promotional, benefit-led, and value-forward\u2014frequent emphasis on sale events, deals, and shopping assurance cues (e.g., exchange/quality assurances) rather than designer narrative.',
    heritageBackground:
      'RIO is part of Reliance Trends\u2019 in-house brand portfolio under Reliance Retail, positioned within a large Indian omnichannel fashion retailer focused on delivering fashion at great value.',
    designThemeSummary:
      'Youthful westernwear built around easy-to-wear silhouettes (A-line/shift/skater dresses, ribbed tops, casual shirts) with playful prints and details (belts, tie-ups, smocking). The line expands into outerwear and jumpsuits for seasonal completeness while staying in an accessible price band.',
    brandValuesAndTones:
      'Accessibility, trendiness, and fun. The emotional tone is upbeat and youthful\u2014optimized for quick styling wins and frequent newness at approachable prices.',
    brandStoryAndIdeology:
      'Designed as a private label to serve young women who want trend-forward fashion without premium pricing\u2014leveraging Reliance Trends\u2019 scale, distribution, and value positioning to keep fashion current and affordable.',
  },

  culturalInfluences: {
    culturalReferences: [
      'Indian high-street youth fashion sensibility (price/value first, trend adaptation)',
      'Global fast-fashion silhouettes (shift, A-line, skater, jumpsuits) adapted for Indian climates and daily wear',
      'Seasonal casual dressing culture (everyday wear + outing outfits rather than formal occasion couture)',
    ],
    languageOrScriptUsage: [
      'Primarily English for navigation, category naming, and promotional messaging on Trends/AJIO surfaces',
    ],
    sensitivityNotes:
      'RIO reads as a mass-market, trend-driven label rather than a craft-heritage brand. When referencing Indian inspiration, avoid claiming specific regional crafts/communities unless a product explicitly states it (e.g., named weaves/embroidery traditions). Keep storytelling centered on contemporary styling, comfort, and print trends rather than cultural ownership.',
    importantSymbolsOrMotifs: [
      'Floral prints',
      'Tiered / ruffle constructions',
      'Smocking (bodices)',
      'Ribbed knit textures',
      'Belts/tie-ups used as styling features',
    ],
    subcultureAssociations: [
      'Value-conscious omnichannel shoppers',
      'College and early-career fashion shoppers',
      'Sale-led/high-frequency wardrobe refresh buyers',
    ],
    festivalsOrOccasions: [
      'Seasonal sales moments and new-in cycles on Trends/AJIO',
      'Casual party/outing wear needs (brunch, movies, meetups)',
      'Travel/vacation dressing (light dresses, playful prints)',
    ],
  },

  sourceReferences: [
    'https://www.relianceretail.com/reliance-trends.html',
    'https://trends.ajio.com/s/rio-3676-33331',
    'https://reliancetrends.com/product/printed-a-line-dress-with-belt-mdyo2j-16708836',
  ],
};

const infFrendz: BrandDNA = {
  brandId: 'infFrendz',
  brandName: 'INF Frendz',
  brandClassification:
    'Mass/value infantwear \u2014 cute everyday essentials and basics for babies',

  visualIdentity: {
    paletteOverview:
      'Bright, cheerful babywear colour world anchored in soft cotton-friendly neutrals with playful pops (pastels and primary brights) to keep everyday essentials feeling cute, giftable, and easy to mix-and-match for home-to-outing dressing.',
    masterPalette: [
      'Soft neutrals and light bases (white/cream/grey melange) for everyday essentials and multipacks',
      'Pastels (baby pink, powder blue, mint, lavender) for newborn/gifting and sweet \u2018cute\u2019 styling',
      'Primary/bright pops (red, navy, sunshine yellow) used in graphics, trims, and character/novelty prints',
      'Denim blues and indigo tones as a recurring motif for baby jeans/jogger-jeans and denim-look bottoms',
    ],
    accessibilityNotes:
      'Ensure high contrast between text/graphics and garment grounds (avoid pale-on-pale print placements). Use clear, legible type for sizes/care and avoid overly thin outlines on busy prints. In e-commerce imagery, keep backgrounds clean and distinct from light garments; for dark garments, avoid dark backdrops and preserve edge definition.',
  },

  designGuardrails: {
    shouldDo: [
      'Prioritise comfort-led construction: soft handfeel, tagless/soft labels, gentle seams, elasticated waists, easy-on closures for infants.',
      'Lead with value and practicality: multipacks/sets, mix-and-match basics, clear product benefits (easy-care, machine-wash, comfort fits).',
      'Use playful-but-simple graphics and cute details (small embroidery, ruffles, animal-ear beanies in sets) while keeping everyday wearability.',
      'Keep fabrics cotton-forward/cotton blends with breathable, easy-care finishes suited to frequent washing.',
      'Maintain consistent sizing clarity for newborn to ~24 months (and toddler extensions where applicable) and communicate care instructions prominently.',
      'Use clean studio product imagery plus warm parent-facing lifestyle cues that show home-to-outing versatility.',
      'Seasonalise responsibly: lightweight layers for most climates, with focused winter layering capsules (cardigans/puffers) for colder regions/seasonality.',
    ],
    shouldNotDo: [
      'Do not over-claim heritage/handcrafted narratives, regional crafts, or indigenous motifs unless verifiably present and transparently credited.',
      'Avoid fussy, high-maintenance embellishment or delicate trims that conflict with machine-washable, practical babywear positioning.',
      'Avoid overly mature styling, dark/heavy palettes as the core identity, or fashion-forward silhouettes that reduce comfort/ease of dressing.',
      'Do not use low-contrast prints where graphics and messaging become illegible on e-commerce thumbnails.',
      'Avoid inconsistent bundle logic (sets that don\u2019t coordinate) or unclear value communication that undermines mass/value positioning.',
    ],
  },

  marketPositioning: {
    brandTier: 'Mass / Value',
    targetGender: 'Baby Boys & Girls',
    targetAgeRange: 'Newborn\u201324 months',
    regions: 'India (national via Reliance Trends, AJIO, JioMart)',
    psychographics:
      'Value-conscious parents buying practical, machine-washable daywear for babies (home + outings). Motivated by comfort, easy dressing (elastic waists, sets), giftability (bundles/gift sets), and playful \u2018cute\u2019 visuals. Preference leans toward fuss-free basics (tees, rompers, leggings/jeans) with small trend cues (embroidery, character/licensed prints, ruffles).',
    styleArchetypes: [
      'Everyday essentials parent (mix-and-match basics)',
      'Gift-set shopper (newborn gifting / bundling)',
      'Cute-casual dresser (playful graphics, ruffles, embroidery)',
      'Winter layering parent (cardigans/puffer jackets for infants)',
    ],
    demographicSummary:
      'Indian urban + value-seeking mass market families shopping Reliance formats; parents of infants/toddlers seeking affordable, durable, machine-washable babywear with cute styling and frequent deal-led purchasing.',
  },

  descriptiveTags: [
    'infantwear',
    'value basics',
    'cute graphics',
    'baby jeans',
    'rompers & bodysuits',
    'sets & multipacks',
    'cotton-focused',
    'easy-care',
    'Reliance Retail / Trends ecosystem',
  ],

  priceRange: { currency: 'INR', min: 199, median: 699, max: 999 },

  primaryCategories: [
    'Infant T-shirts / tops',
    'Rompers & bodysuits',
    'Multipacks (2-pack/3-pack essentials)',
    'Jeans & jogger jeans',
    'Shorts',
    'Leggings',
    'Sets / gift sets',
    'Light outerwear (cardigans, puffer jackets)',
  ],

  coreValues: {
    voiceStyle:
      'Playful, parent-facing, and benefit-led. Uses warm \u2018cute/sweet\u2019 language and frames products around everyday moments (staying in vs hanging out), emphasizing style made practical for babies.',
    heritageBackground:
      'INF FRENDZ appears as a Reliance Retail (Trends/AJIO ecosystem) infantwear label; JioMart product information lists Reliance Retail Limited as the manufacturer/marketer for INF FRENDZ items. The brand is positioned by the retail platform copy as \u2018Frendz\u2019 infant clothing within AJIO/Trends channels.',
    designThemeSummary:
      'Core wardrobe staples for infants\u2014tees, rompers/bodysuits, baby jeans/jogger jeans, shorts, leggings\u2014often sold as multipacks/sets for value. Styling is casual-cute with prints, simple embellishments/embroidery, and comfort-driven fits (elasticated waists, easy layering). Materials skew toward cotton/cotton blends and easy-care finishes.',
    brandValuesAndTones:
      'Affordability + practicality + cuteness. Emotional tone: cheerful, sweet, and reassuring for parents\u2014\u2018everyday style\u2019 without sacrificing comfort and ease of maintenance (machine wash).',
    brandStoryAndIdeology:
      'Rather than a designer-founder narrative, INF FRENDZ is communicated through Reliance retail platforms as an infant clothing proposition that brings \u2018style to everyday clothes for babies\u2019\u2014a retail-driven ideology centered on accessible, mix-and-match baby basics and value bundles for daily use.',
  },

  culturalInfluences: {
    culturalReferences: [
      'Global \u2018cute babywear\u2019 language (sweet, playful, home-to-outing styling) as expressed in brand copy positioning it as an \u201cinternational\u201d infant clothing brand',
      'Mass Indian family shopping culture: bundle value (multipacks), gifting, and easy-care daily wear',
      'Kid-pop/character culture (e.g., superhero/character-themed packs), reinforcing playful graphic direction',
    ],
    languageOrScriptUsage: [
      'Predominantly English in consumer-facing brand descriptions and product naming (e.g., \u2018cute\u2019, \u2018sweet\u2019, \u2018baby jeans\u2019, \u2018T-shirts\u2019)',
    ],
    sensitivityNotes:
      'INF FRENDZ leans more into universal baby-cute tropes than region-specific craft. If extending storytelling in India, keep it parent-first and function-led (comfort, safety, easy wash). Avoid claiming heritage crafts/handloom/indigenous motifs unless the product is verifiably made with those techniques and credited transparently.',
    importantSymbolsOrMotifs: [
      'Playful prints and graphics (assorted printed multipacks/sets)',
      'Small \u2018cute\u2019 details (e.g., beanies with animal ears in sets)',
      'Ruffles / embellishment accents in select girls\u2019 items',
      'Denim-look baby bottoms (baby jeans/jogger jeans as a core motif)',
    ],
    subcultureAssociations: [
      'Reliance Trends shoppers (family/value retail)',
      'AJIO deal-led online shoppers',
      'New parents & gifting buyers (bundles, sets)',
    ],
    festivalsOrOccasions: [
      'Newborn gifting (gift sets / bundled sets)',
      'Seasonal layering (infant winterwear such as cardigans/puffer jackets)',
      'Everyday wear (home + casual outings)',
    ],
  },

  sourceReferences: [],
};

// ── Exports ─────────────────────────────────────────────────────────────

export const BRAND_DNA_MAP: Record<string, BrandDNA> = {
  dnmx,
  avaasa,
  fig,
  teamspirit,
  siyahi,
  avaasaSet,
  rio,
  infFrendz,
};

export function getBrandDNA(brandId: string): BrandDNA | null {
  return BRAND_DNA_MAP[brandId] ?? null;
}
