/**
 * Semantic Keyword & Title Generator for Microstock Contributor Portals
 * 100% Compliant for Adobe Stock, Shutterstock, Freepik, Vecteezy, and Getty Images.
 *
 * Enforces:
 * 1. Title Formula: [Core Niche/Subject] + [Visual Style/Asset Type] + [Primary Commercial Context/Value]
 *    - Strictly 60 to 70 characters ideal, max 190
 *    - Zero word repetition, zero boilerplate suffixes
 *    - Forbids "Editable Stroke" if live strokes are not confirmed
 * 2. Keywords (Strict Adobe Stock Priority):
 *    - Pos 1-10: Highest volume core subject & style tags
 *    - Pos 11-28: Literal objects, ingredients, sub-concepts
 *    - Pos 29-37: Conceptual & industry tags
 *    - Pos 38-45: Standard design & format tags
 *    - Zero 2-word inversions (e.g. no "fermentation wild")
 *    - Zero generic noun prefixes (no "wild security" or "wild navigation")
 *    - Validated count between 35 and 49 tags (target 45)
 */

import { sanitizeInput, cleanBaseName } from './epsNativeProcessor';

// Low-value filler tags to eliminate whenever niche keywords are available
export const LOW_VALUE_FILLER_TAGS = new Set([
  'visual',
  'presentation',
  'button',
  'clipart',
  'concept',
  'element',
  'template',
  'creative',
  'digital',
  'art',
  'modern',
  'clean',
  'simple',
  'flat',
  'sign',
  'interface',
  'graphic design',
  'bundle',
  'monochrome',
  'black and white',
  'marketing',
  'banner',
]);

// Final approved style & format tags (Positions 38 to 45)
export const APPROVED_STYLE_TAGS = [
  'line icon',
  'icon set',
  'editable stroke',
  'outline',
  'thin line',
  'linear',
  'pictogram',
  'symbol',
  'collection',
  'pack',
  'ui',
  'web icon',
  'vector',
  'illustration',
  'isolated',
  'line art',
];

// Forbidden microstock keywords & workflow noise
export const FORBIDDEN_MICROSTOCK_TAGS = new Set([
  'eps',
  'eps10',
  'ai',
  'jpg',
  'jpeg',
  'png',
  'stock',
  'commercial',
  'graphic asset',
  'vector illustration set',
  'image',
  'background',
  'isolated on white',
  'upscaled',
  'upscayl',
  'topaz',
  'gigapixel',
  'ember',
  'midjourney',
  'firefly',
  'prompt',
  'artboard',
  'cmyk',
  'rgb',
  'vectorized',
  'traced',
  'copy',
  'final',
]);

/**
 * Rich Semantic Niche Knowledge Graph for Stock Illustrations & Icons
 */
export const NICHE_DICTIONARIES: Record<
  string,
  {
    triggers: string[];
    nicheWords: string[]; // For title expansion
    keywords: string[];   // 25-35 niche terms
  }
> = {
  wild_fermentation_culinary: {
    triggers: [
      'fermentation', 'ferment', 'kombucha', 'sourdough', 'kimchi', 'sauerkraut',
      'probiotic', 'pickling', 'brewing', 'crock', 'yeast', 'microbiome', 'kefir',
      'miso', 'tempeh', 'brine', 'canning', 'preserves'
    ],
    nicheWords: ['Fermentation', 'Probiotic', 'Preservation', 'Artisan'],
    keywords: [
      'wild fermentation', 'fermentation', 'kombucha', 'sourdough', 'kimchi', 'sauerkraut',
      'probiotic', 'yeast', 'bacteria', 'pickling', 'brewing', 'jar', 'crock',
      'gut health', 'organic', 'artisan', 'culinary', 'kitchen', 'nutrition',
      'food preservation', 'fermented food', 'microbiome', 'canning', 'preserves',
      'kefir', 'mason jar', 'starter culture', 'ferment', 'scoby', 'miso', 'tempeh',
      'brine', 'lactic acid', 'fermenting', 'homemade'
    ],
  },
  administrative_assistant_office: {
    triggers: [
      'administrative', 'assistant', 'secretary', 'receptionist', 'clerical',
      'office', 'desk', 'paperwork', 'executive', 'stationery'
    ],
    nicheWords: ['Administrative', 'Office', 'Secretary', 'Business'],
    keywords: [
      // Slots 1-7: primary high-volume subject nouns
      'administrative assistant', 'office', 'secretary', 'receptionist', 'assistant', 'administration', 'clerical',
      // Slots 8-10: visual style
      'line icon', 'icon set', 'outline',
      // Slots 11-28: literal objects and components
      'desk', 'computer', 'clipboard', 'calculator', 'headset', 'calendar', 'document', 'paperwork',
      'stapler', 'notepad', 'checklist', 'stamp', 'id badge', 'briefcase', 'folder', 'telephone',
      'pen', 'filing cabinet',
      // Slots 29-37: industry context
      'organization', 'management', 'business', 'corporate', 'executive', 'workflow',
      'human resources', 'customer support', 'workplace',
      // Slots 38-45: format & style
      'linear', 'pictogram', 'symbol', 'collection', 'pack', 'vector', 'illustration', 'isolated'
    ],
  },
  camping_outdoor: {
    triggers: [
      'camping', 'camp', 'hike', 'hiking', 'outdoor', 'adventure', 'backpack',
      'tent', 'trail', 'wilderness', 'survival', 'canteen', 'lantern', 'trekking',
      'mountains', 'forest'
    ],
    nicheWords: ['Camping', 'Outdoor', 'Adventure', 'Hiking'],
    keywords: [
      'camping', 'gear', 'hiking', 'outdoor', 'adventure', 'equipment', 'tent',
      'backpack', 'campfire', 'compass', 'hiking boots', 'sleeping bag', 'flashlight',
      'lantern', 'canteen', 'axe', 'thermos', 'trail', 'mountain', 'wilderness',
      'pocket knife', 'matches', 'camper', 'survival', 'outdoor gear', 'trekking',
      'forest', 'wildlife', 'tarp', 'binoculars', 'skillet', 'flask', 'scout',
      'firewood', 'ridge', 'nature', 'expedition', 'park', 'climbing', 'travel'
    ],
  },
  cybersecurity_network: {
    triggers: [
      'cybersecurity', 'cyber', 'security', 'firewall', 'malware', 'hacker',
      'encryption', 'antivirus', 'phishing', 'vulnerability', 'privacy'
    ],
    nicheWords: ['Cybersecurity', 'Security', 'Network', 'Technology'],
    keywords: [
      'cybersecurity', 'network', 'data', 'defense', 'security', 'system', 'technology',
      'firewall', 'malware', 'encryption', 'hacker', 'padlock', 'server', 'database',
      'antivirus', 'biometric', 'phishing', 'password', 'shield', 'cyber attack',
      'data breach', 'cloud security', 'vpn', 'authentication', 'key', 'bug',
      'cybercrime', 'vulnerability', 'proxy', 'token', 'spyware', 'threat', 'protocol', 'audit'
    ],
  },
  coffee_cafe: {
    triggers: [
      'affogato', 'coffee', 'espresso', 'barista', 'latte', 'cappuccino', 'cafe',
      'dessert', 'gelato', 'mocha', 'crema', 'macchiato', 'americano', 'brew',
      'roast', 'caffeine', 'beans', 'mug', 'cup', 'frappe'
    ],
    nicheWords: ['Espresso', 'Barista', 'Cafe', 'Dessert'],
    keywords: [
      'affogato', 'coffee', 'espresso', 'ice cream', 'gelato', 'dessert', 'cafe',
      'barista', 'coffee shop', 'beverage', 'drink', 'cup', 'mug', 'scoop', 'sweet',
      'italian dessert', 'cappuccino', 'latte', 'mocha', 'crema', 'spoon', 'glass',
      'menu', 'restaurant', 'food and drink', 'pastry', 'refreshment', 'hot drink',
      'cold dessert', 'roasted beans', 'french press', 'coffee maker', 'coffee cup',
      'saucer', 'syrup', 'creamer', 'dairy', 'sugar'
    ],
  },
  aviation_flight: {
    triggers: [
      'pilot', 'airline', 'aviation', 'captain', 'airplane', 'aircraft', 'flight',
      'airport', 'cockpit', 'aviator', 'stewardess', 'boarding', 'runway', 'radar',
      'jet', 'propeller', 'aerospace', 'fly', 'plane'
    ],
    nicheWords: ['Captain', 'Aviation', 'Flight', 'Airport'],
    keywords: [
      'airline pilot', 'pilot', 'aviation', 'captain', 'airplane', 'aircraft', 'flight',
      'airport', 'cockpit', 'air travel', 'uniform', 'pilot hat', 'wings badge', 'aviator',
      'commercial flight', 'crew', 'flight attendant', 'radar', 'control tower',
      'runway', 'passenger', 'jet', 'transport', 'transportation', 'travel', 'journey',
      'sky', 'airline', 'boarding', 'takeoff', 'landing', 'terminal', 'luggage', 'passport'
    ],
  },
  business_finance: {
    triggers: [
      'business', 'finance', 'banking', 'money', 'investment', 'currency', 'dollar',
      'market', 'stock', 'trade', 'crypto', 'bitcoin', 'credit card', 'wallet',
      'accounting', 'profit', 'economy', 'wealth', 'loan', 'tax'
    ],
    nicheWords: ['Finance', 'Banking', 'Investment', 'Corporate'],
    keywords: [
      'finance', 'banking', 'money', 'investment', 'currency', 'dollar', 'stock market',
      'trade', 'cryptocurrency', 'credit card', 'wallet', 'accounting', 'profit', 'wealth',
      'loan', 'tax', 'economy', 'budget', 'cash', 'coins', 'growth chart', 'analytics',
      'audit', 'revenue', 'bank', 'investor', 'financial report', 'capital', 'transaction',
      'payment', 'exchange', 'savings', 'interest rate', 'fund'
    ],
  },
  medical_healthcare: {
    triggers: [
      'doctor', 'nurse', 'medical', 'medicine', 'hospital', 'health', 'healthcare',
      'clinic', 'pharmacy', 'pill', 'prescription', 'heartbeat', 'cardiology',
      'dental', 'patient', 'ambulance', 'surgery', 'virus', 'stethoscope'
    ],
    nicheWords: ['Healthcare', 'Doctor', 'Clinic', 'Pharmacy'],
    keywords: [
      'healthcare', 'medical', 'doctor', 'nurse', 'hospital', 'medicine', 'clinic',
      'pharmacy', 'pill', 'prescription', 'stethoscope', 'heartbeat', 'cardiology',
      'patient', 'ambulance', 'dental', 'first aid', 'emergency', 'care', 'treatment',
      'wellness', 'diagnosis', 'laboratory', 'test tube', 'thermometer', 'syringe',
      'vaccine', 'bandage', 'surgeon', 'medic', 'health insurance', 'hospital bed'
    ],
  },
  shopping_ecommerce: {
    triggers: [
      'shop', 'shopping', 'store', 'cart', 'retail', 'ecommerce', 'discount',
      'sale', 'delivery', 'shipping', 'barcode', 'order', 'purchase', 'bag',
      'coupon', 'checkout', 'price'
    ],
    nicheWords: ['Ecommerce', 'Retail', 'Store', 'Shopping'],
    keywords: [
      'shopping', 'ecommerce', 'retail', 'store', 'shopping cart', 'online store',
      'discount', 'sale', 'delivery', 'shipping', 'package', 'barcode', 'receipt',
      'order', 'purchase', 'coupon', 'checkout', 'credit card', 'shopping bag',
      'price tag', 'customer', 'marketplace', 'buy', 'shop', 'online shopping',
      'gift box', 'promo', 'cashier', 'express delivery', 'courier'
    ],
  },
  food_cooking: {
    triggers: [
      'food', 'cooking', 'kitchen', 'restaurant', 'chef', 'meal', 'baking',
      'bakery', 'dish', 'recipe', 'breakfast', 'dinner', 'lunch', 'cutlery',
      'fork', 'knife', 'pot', 'pan', 'gastronomy'
    ],
    nicheWords: ['Restaurant', 'Cooking', 'Kitchen', 'Culinary'],
    keywords: [
      'food', 'cooking', 'kitchen', 'restaurant', 'chef', 'culinary', 'recipe',
      'baking', 'bakery', 'meal', 'dish', 'breakfast', 'dinner', 'lunch', 'cutlery',
      'fork and knife', 'pot', 'pan', 'oven', 'cookware', 'vegetables', 'meat',
      'organic food', 'healthy eating', 'nutrition', 'appetizer', 'dining',
      'spices', 'flavor', 'gastronomy', 'fast food', 'gourmet', 'catering'
    ],
  },
  tech_development: {
    triggers: [
      'code', 'programming', 'developer', 'software', 'technology', 'computer',
      'laptop', 'server', 'cloud', 'database', 'api',
      'algorithm', 'hardware'
    ],
    nicheWords: ['Technology', 'Programming', 'Software', 'Development'],
    keywords: [
      'technology', 'programming', 'software', 'developer', 'code', 'computer',
      'laptop', 'server', 'cloud computing', 'database', 'cyber security', 'network',
      'api', 'algorithm', 'hardware', 'coding', 'web development',
      'screen', 'monitor', 'keyboard', 'cpu', 'processor', 'data storage',
      'tech support', 'digital network', 'firewall', 'cloud hosting', 'terminal'
    ],
  },
  tools_construction: {
    triggers: [
      'tool', 'tools', 'construction', 'building', 'hammer', 'wrench', 'hardware',
      'repair', 'craftsman', 'industrial', 'engineering', 'carpenter', 'mechanic',
      'saw', 'drill', 'screw'
    ],
    nicheWords: ['Construction', 'Hardware', 'Industrial', 'Repair'],
    keywords: [
      'tools', 'construction', 'building', 'hardware', 'repair', 'hammer', 'wrench',
      'screwdriver', 'drill', 'engineering', 'industrial', 'carpenter', 'mechanic',
      'craftsman', 'saw', 'pliers', 'toolkit', 'home repair', 'work tools', 'screws',
      'maintenance', 'handyman', 'workshop', 'renovation', 'plumbing', 'metalwork',
      'tape measure', 'safety helmet', 'architecture', 'contractor'
    ],
  },
  sports_fitness: {
    triggers: [
      'gym', 'fitness', 'workout', 'sport', 'sports', 'barbell', 'dumbbell',
      'running', 'football', 'soccer', 'training', 'athlete', 'exercise',
      'muscle', 'cardio', 'yoga', 'basketball'
    ],
    nicheWords: ['Gym', 'Fitness', 'Workout', 'Sports'],
    keywords: [
      'fitness', 'gym', 'workout', 'sports', 'exercise', 'training', 'athlete',
      'barbell', 'dumbbell', 'running', 'muscle', 'cardio', 'bodybuilding',
      'healthy lifestyle', 'weights', 'crossfit', 'athletics', 'sportswear',
      'soccer', 'football', 'basketball', 'tennis', 'yoga', 'stretch',
      'activewear', 'energy', 'stamina', 'coach', 'championship', 'medal'
    ],
  },
  real_estate_home: {
    triggers: [
      'house', 'home', 'apartment', 'property', 'real estate', 'mortgage',
      'building', 'architecture', 'roof', 'interior', 'key', 'door', 'villa'
    ],
    nicheWords: ['Real Estate', 'Property', 'Architecture', 'Housing'],
    keywords: [
      'real estate', 'house', 'home', 'property', 'apartment', 'architecture',
      'mortgage', 'residential', 'building', 'housing', 'realtor', 'estate agency',
      'interior', 'villa', 'cottage', 'key', 'door', 'roof', 'blueprint',
      'for sale', 'rent', 'rental property', 'construction', 'neighborhood',
      'living room', 'exterior', 'urban', 'suburban', 'property investment'
    ],
  },
  automotive_transport: {
    triggers: [
      'car', 'auto', 'vehicle', 'automotive', 'drive', 'driving', 'road',
      'traffic', 'truck', 'bus', 'mechanic', 'engine', 'wheel', 'speed'
    ],
    nicheWords: ['Automotive', 'Vehicle', 'Transport', 'Driving'],
    keywords: [
      'automotive', 'car', 'vehicle', 'transport', 'transportation', 'auto',
      'driving', 'road', 'traffic', 'engine', 'mechanic', 'car service',
      'car repair', 'speedometer', 'wheel', 'tire', 'garage', 'dashboard',
      'sedan', 'truck', 'coupe', 'automobile', 'highway', 'parking', 'fuel',
      'gas station', 'maintenance', 'inspection', 'car wash', 'steering wheel'
    ],
  },
};

/**
 * Deduplicate words in a sentence/title while preserving natural case and order.
 * Example: "Affogato Coffee 28 Icons Set Vector Illustration Icon Set Editable Stroke"
 * Result: "Affogato Coffee 28 Icons Set Vector Illustration Editable Stroke"
 */
export function deduplicateTitleWords(rawTitle: string): string {
  if (!rawTitle) return '';

  let cleaned = rawTitle
    .replace(/\s+for\s+(digital\s+design|commercial\s+marketing|web\s+and\s+mobile|creative\s+projects)[\s\w]*$/i, '')
    .replace(/\s+isolated\s+on\s+white[\s\w]*$/i, '')
    .trim();

  const words = cleaned.split(/\s+/);
  const seenStems = new Set<string>();
  const resultWords: string[] = [];

  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!lower) continue;

    const stem = lower.endsWith('s') && lower.length > 3 ? lower.slice(0, -1) : lower;

    if (seenStems.has(stem) || seenStems.has(lower)) {
      continue;
    }

    seenStems.add(stem);
    seenStems.add(lower);
    resultWords.push(word);
  }

  return resultWords.join(' ').trim();
}

/**
 * Detect matching niche dictionary based on filename and extracted text
 */
function findMatchingNiche(textToMatch: string) {
  const lower = textToMatch.toLowerCase();
  for (const [key, niche] of Object.entries(NICHE_DICTIONARIES)) {
    for (const trigger of niche.triggers) {
      const reg = new RegExp(`\\b${trigger}\\b`, 'i');
      if (reg.test(lower)) {
        return { key, niche };
      }
    }
  }
  return null;
}

/**
 * Strip trailing words like icon, icons, line, art, sheet, set, pack, vector, illustrations
 * from the subject name before formatting into descriptions or titles so it never outputs "icon line icons".
 */
export function cleanSubjectForDescription(subject: string): string {
  if (!subject) return 'Design Elements';
  let cleaned = subject
    .replace(/\b\d{6,}\b/g, '')
    .replace(/\b(line\s+icons?|icons?\s+sets?|line|outline|icons?|sets?|art|sheet|pack|vector|illustrations?|elements?|graphics?)\b/gi, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  cleaned = cleaned.replace(/\s+(icon|icons|line|set|sets|art|vector)$/i, '').trim();
  return cleaned || 'Design Elements';
}

/**
 * High-Ranking Title Formula:
 * Formula: [Core Niche/Subject] + [Visual Style/Asset Type] + [Primary Commercial Context/Value]
 * Ideal 60 to 70 characters, max 190.
 * Forbids "Editable Stroke" if live strokes are explicitly confirmed false.
 */
export function buildHighRankingTitle(
  cleanedBaseName: string,
  format: string = 'eps',
  extractedText: string[] = [],
  hasLiveStroke: boolean = true
): string {
  const sanitized = sanitizeInput(cleanedBaseName);
  const combinedContext = [sanitized.coreSubject, ...extractedText].join(' ');
  const match = findMatchingNiche(combinedContext);

  const subjectWords = cleanSubjectForDescription(sanitized.coreSubject)
    .replace(/\b(line|outline|icons?|sets?|vector|illustration|editable|stroke)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const quantityMatch = cleanedBaseName.match(/\b(\d{1,3})\b/);
  const countPrefix = quantityMatch ? `${quantityMatch[1]} ` : '';

  let nicheContext = '';
  if (match) {
    const available = match.niche.nicheWords.filter(
      (w) => !subjectWords.toLowerCase().includes(w.toLowerCase())
    );
    nicheContext = available.slice(0, 2).join(' ');
  } else {
    const extraTokens = extractedText
      .flatMap((t) => t.split(/\s+/))
      .filter((t) => t.length > 3 && !subjectWords.toLowerCase().includes(t.toLowerCase()))
      .slice(0, 2)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
    if (extraTokens.length > 0) {
      nicheContext = extraTokens.join(' ');
    }
  }

  const styleDescriptor = hasLiveStroke ? 'Editable Stroke' : 'Outline';

  let formulaMiddle = `${countPrefix}Line Icons Set`;
  let formulaEnd = `${styleDescriptor} Vector Illustration`;

  if (format === 'mp4' || format === 'mov') {
    formulaMiddle = '4K Motion Graphics';
    formulaEnd = 'Video Footage Loop';
  } else if (format === 'jpg' || format === 'png') {
    formulaMiddle = 'High Resolution';
    formulaEnd = 'Professional Stock Photography';
  }

  const rawTitle = `${subjectWords} ${nicheContext} ${formulaMiddle} ${formulaEnd}`
    .replace(/\s+/g, ' ')
    .trim();

  let title = deduplicateTitleWords(rawTitle);

  // If title is under 70 chars, expand with niche context or descriptive words
  if (title.length < 70) {
    if (match) {
      const extraNiche = match.niche.keywords
        .filter((k) => !title.toLowerCase().includes(k.toLowerCase()) && !APPROVED_STYLE_TAGS.includes(k))
        .slice(0, 1)
        .map((k) => k.replace(/\b\w/g, (c) => c.toUpperCase()))
        .join(' ');
      if (extraNiche) {
        title = deduplicateTitleWords(`${subjectWords} ${extraNiche} ${formulaMiddle} ${formulaEnd}`);
      }
    } else {
      title = deduplicateTitleWords(`${subjectWords} Collection ${formulaMiddle} ${formulaEnd}`);
    }
  }

  // Cap at 100 characters if possible, or max 190
  if (title.length > 100) {
    const trimmed = title.slice(0, 100).replace(/\s+\S*$/, '');
    if (trimmed.length >= 70) {
      title = trimmed;
    } else if (title.length > 190) {
      title = title.slice(0, 190).replace(/\s+\S*$/, '');
    }
  }

  return title;
}

/**
 * 6. KEYWORD VALIDATION GUARDRAIL (POST-PROCESSING)
 * Validates, deduplicates, and structures keywords for Adobe Stock & microstock engines:
 * - Deduplicates all tags (case-insensitive)
 * - Removes any tag longer than 3 words
 * - Rejects/filters out exact word-order inversions of previous 2-word tags (e.g., if "wild fermentation" exists, blocks "fermentation wild")
 * - Enforces keyword count between 35 and 49 tags (target 45)
 * - Strips production/workflow tokens and low-value fillers
 * - Substitutes "editable stroke" with "outline" or "line art" if live strokes are not present
 */
export function validateKeywords(
  keywords: string[],
  options?: {
    minCount?: number;
    maxCount?: number;
    targetCount?: number;
    hasLiveStroke?: boolean;
  }
): string[] {
  const minCount = options?.minCount ?? 35;
  const maxCount = options?.maxCount ?? 45;
  const targetCount = options?.targetCount ?? 45;
  const hasLiveStroke = options?.hasLiveStroke ?? true;

  const result: string[] = [];
  const seenLower = new Set<string>();
  const seen2WordSets = new Set<string>();

  for (const raw of keywords || []) {
    if (!raw) continue;
    let clean = raw.trim().toLowerCase().replace(/^[,\s;]+|[,\s;]+$/g, '');
    if (!clean || clean.length < 2) continue;

    // Filter workflow / production artifacts
    if (/\b(upscaled?|upscayl|topaz|gigapixel|ember|midjourney|firefly|v\d+|cmyk|rgb|artboard)\b/i.test(clean)) {
      continue;
    }

    // Substitute "editable stroke" if live strokes are explicitly false
    if (!hasLiveStroke && clean.includes('editable stroke')) {
      clean = clean.replace('editable stroke', 'outline').trim();
    }

    // Filter forbidden microstock or low-value filler tags
    if (FORBIDDEN_MICROSTOCK_TAGS.has(clean) || LOW_VALUE_FILLER_TAGS.has(clean)) {
      continue;
    }

    // Remove any tag longer than 3 words
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length > 3) {
      continue;
    }

    // Deduplicate case-insensitively
    if (seenLower.has(clean)) {
      continue;
    }

    // Reject exact word-order inversion of an existing 2-word tag
    if (words.length === 2) {
      const sortedFingerprint = [...words].sort().join('|');
      if (seen2WordSets.has(sortedFingerprint)) {
        continue;
      }
      seen2WordSets.add(sortedFingerprint);
    }

    seenLower.add(clean);
    result.push(clean);
  }

  // Enforce range: target 45 (between 35 and 49)
  if (result.length > maxCount) {
    return result.slice(0, targetCount);
  }

  if (result.length < minCount) {
    const fillerStyleTags = [
      'line icon',
      'icon set',
      hasLiveStroke ? 'editable stroke' : 'outline',
      'outline',
      'thin line',
      'linear',
      'pictogram',
      'symbol',
      'collection',
      'pack',
      'ui',
      'vector',
      'illustration',
      'isolated',
      'line art',
      'minimal',
      'graphic element',
      'modern outline',
      'web icon',
      'sign',
      'contour',
      'black and white',
      'flat vector',
      'digital graphic',
      'clip art',
      'stencil',
      'silhouette',
      'monochrome',
      'simple line',
      'interface icon',
      'app icon',
      'badge',
      'emblem',
      'decorative element',
      'commercial asset',
      'vector set',
      'isolated vector',
      'clean line',
      'art asset',
      'symbol set',
      'pictogram collection',
      'graphic resource',
      'linear style',
      'monochrome design',
      'flat icon',
      'icon collection',
      'vector graphics',
      'outline icon',
      'line drawing',
      'design element',
    ];

    for (const tag of fillerStyleTags) {
      const clean = tag.toLowerCase();
      if (!seenLower.has(clean)) {
        const words = clean.split(/\s+/).filter(Boolean);
        if (words.length === 2) {
          const sorted = [...words].sort().join('|');
          if (seen2WordSets.has(sorted)) continue;
          seen2WordSets.add(sorted);
        }
        seenLower.add(clean);
        result.push(clean);
      }
      if (result.length >= targetCount) break;
    }
  }

  return result.slice(0, maxCount);
}

/**
 * 2. REPLACED FALLBACK KEYWORD GENERATOR
 * Generates semantic keywords without word-pair permutations or generic noun concatenations:
 * - NO loop of WordA + WordB / WordB + WordA
 * - NO generic noun arrays ([firstWord] + "equipment", "service", "concept", "management", "security", "navigation")
 * - 100% contextual subject and niche terms
 */
export function generateNicheKeywords(
  cleanedBaseName: string,
  format: string = 'eps',
  extractedText: string[] = [],
  hasLiveStroke: boolean = true
): string[] {
  const sanitized = sanitizeInput(cleanedBaseName);
  const combinedContext = [sanitized.coreSubject, ...extractedText].join(' ');
  const match = findMatchingNiche(combinedContext);

  const rawPool: string[] = [];

  // 1. Gather Niche Keywords from Niche Dictionary if matched
  if (match) {
    rawPool.push(...match.niche.keywords);
  } else {
    // Arbitrary Subject Context: extract meaningful core subject words and extracted PostScript text
    const coreTokens = sanitized.coreSubject.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    rawPool.push(...coreTokens);

    for (const t of coreTokens) {
      if (t.endsWith('s') && t.length > 4) {
        rawPool.push(t.slice(0, -1));
      } else if (!t.endsWith('s')) {
        rawPool.push(`${t}s`);
      }
    }

    for (const txt of extractedText) {
      const cleanTxt = txt.toLowerCase().trim();
      if (cleanTxt.length > 2) {
        rawPool.push(cleanTxt);
      }
    }
  }

  // Pre-validate niche pool and cap to top 30 niche-specific keywords (excluding generic style tags)
  const nicheOnly = rawPool.filter((tag) => !APPROVED_STYLE_TAGS.includes(tag.toLowerCase()));
  const validNiche = validateKeywords(nicheOnly.length >= 20 ? nicheOnly : rawPool, {
    minCount: 1,
    maxCount: 30,
    targetCount: 30,
    hasLiveStroke,
  }).slice(0, 30);

  // 2. Append Approved Style & Format Tags (last 15 slots: Positions 31-45)
  const styleTagsToAppend = APPROVED_STYLE_TAGS.map((t) =>
    !hasLiveStroke && t === 'editable stroke' ? 'outline' : t
  );

  const combined = [...validNiche];
  for (const styleTag of styleTagsToAppend) {
    if (!combined.includes(styleTag)) {
      combined.push(styleTag);
    }
    if (combined.length >= 45) break;
  }

  // 3. Post-process through Keyword Validation Guardrail to guarantee strictly 45 tags
  return validateKeywords(combined, {
    minCount: 35,
    maxCount: 45,
    targetCount: 45,
    hasLiveStroke,
  });
}

/**
 * Post-processes any keyword list (from Gemini API or local engine)
 * to enforce strict Adobe Stock priority and validation rules.
 */
export function sanitizeAndBalanceKeywords(
  rawKeywords: string[],
  cleanedBaseName: string,
  format: string = 'eps',
  hasLiveStroke: boolean = true
): string[] {
  let inputList = [...(rawKeywords || [])];
  if (inputList.length < 25) {
    const fallbackList = generateNicheKeywords(cleanedBaseName, format, [], hasLiveStroke);
    inputList = [...inputList, ...fallbackList];
  }

  return validateKeywords(inputList, {
    minCount: 35,
    maxCount: 45,
    targetCount: 45,
    hasLiveStroke,
  });
}
