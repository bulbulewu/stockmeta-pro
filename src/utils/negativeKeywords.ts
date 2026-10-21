import { FileFormat } from '../types/stock';

/**
 * Universal Banned Trademark, Brand & Legal Risk Keywords for Microstock.
 * Marketplaces automatically reject or strike contributor accounts containing these.
 */
export const DEFAULT_BANNED_TRADEMARKS: string[] = [
  // Big Tech & Electronics
  'apple', 'iphone', 'ipad', 'ipod', 'macbook', 'imac', 'ios', 'android', 'google',
  'samsung', 'galaxy', 'sony', 'playstation', 'xbox', 'nintendo', 'canon', 'nikon',
  'panasonic', 'fujifilm', 'leica', 'gopro', 'intel', 'microsoft', 'windows',
  // Apparel & Luxury
  'nike', 'adidas', 'puma', 'gucci', 'prada', 'chanel', 'louis vuitton', 'rolex',
  'rayban', 'versace', 'armani', 'zara', 'h&m', 'converse', 'vans', 'calvin klein',
  // Entertainment & Toys
  'disney', 'marvel', 'dc comics', 'batman', 'superman', 'spiderman', 'mickey mouse',
  'lego', 'barbie', 'pokemon', 'pikachu', 'star wars', 'harry potter', 'coca cola',
  'pepsi', 'mcdonalds', 'starbucks', 'red bull',
  // Automotive
  'ferrari', 'lamborghini', 'porsche', 'bmw', 'mercedes', 'audi', 'tesla', 'ford',
  'chevrolet', 'toyota', 'honda', 'harley davidson',
  // Subjective fillers / banned spam terms (strictly prohibited by microstock guidelines)
  'beautiful', 'amazing', 'best', 'gorgeous', 'stunning', 'nice', 'awesome', 'pretty',
  'fantastic', 'wonderful', 'perfect', 'lovely', 'breathtaking', 'magnificent',
  // AI and Stock Banned Buzzwords
  'ai generated', 'midjourney', 'stable diffusion', 'dall-e', 'dalle', 'photorealistic',
  'hyperrealistic', '8k', '4k resolution', 'unreal engine', 'octane render',
  'trending on artstation', 'masterpiece', 'award winning', 'best quality',
];

/**
 * Common English stopwords that add zero microstock search value
 */
export const STOCK_STOPWORDS: Set<string> = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any',
  'are', 'aren', 'arent', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
  'between', 'both', 'but', 'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing',
  'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having',
  'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no',
  'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than',
  'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we',
  'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'you',
  'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Strict Forbidden Keywords for Microstock.
 * Never allowed in output: file formats, timestamps, or generic spam terms.
 */
export const FORBIDDEN_MICROSTOCK_KEYWORDS: Set<string> = new Set([
  'eps',
  'eps10',
  'ai',
  'jpg',
  'jpeg',
  'png',
  'stock',
  'commercial',
  'graphic asset',
]);

/**
 * Common format-specific tags to append when SEO option is active
 */
export const FORMAT_SPECIFIC_TAGS: Record<FileFormat, string[]> = {
  svg: ['vector', 'illustration', 'graphic', 'isolated', 'scalable', 'clipart', 'design element'],
  eps: ['vector', 'illustration', 'editable vector', 'isolated', 'design element', 'icon set'],
  ai: ['vector', 'vector illustration', 'scalable', 'graphic design', 'isolated'],
  jpg: ['photography', 'high resolution', 'photo', 'clean', 'copy space'],
  jpeg: ['photography', 'high resolution', 'photo', 'clean', 'copy space'],
  png: ['transparent background', 'isolated', 'alpha channel', 'cut out', 'graphic'],
  mp4: ['video clip', 'motion graphic', 'animation', 'footage', '4k', 'loop', 'seamless loop'],
  mov: ['prores', 'transparent video', 'alpha matte', 'motion graphic', 'video clip'],
  mpg: ['video footage', 'clip', 'motion'],
  avi: ['video footage', 'clip', 'motion'],
};

/**
 * Stemming helper to remove duplicate singular/plural pairs (e.g. "car" vs "cars", "tree" vs "trees")
 * If singular already present, plural is skipped to preserve keyword slot economy.
 */
export function normalizeSingularPlural(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.endsWith('ies') && w.length > 4) {
    return w.slice(0, -3) + 'y';
  }
  if (w.endsWith('es') && w.length > 4 && !w.endsWith('ss')) {
    return w.slice(0, -2);
  }
  if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) {
    return w.slice(0, -1);
  }
  return w;
}

/**
 * Clean, filter negative keywords, deduplicate singular/plural, remove stopwords, and normalize tags.
 * Preserves the exact priority rank order of input keywords.
 */
export function sanitizeKeywords(
  keywords: string[],
  options?: {
    negativeKeywordsFilter?: boolean;
    bannedTermsList?: string[];
    customNegativeKeywords?: string[];
    autoAppendFormatTags?: boolean;
    format?: FileFormat;
    targetCount?: number;
    orderKeywordsByWeight?: boolean;
    dedupeSingularPlural?: boolean;
    removeStopwords?: boolean;
  }
): string[] {
  const {
    negativeKeywordsFilter = true,
    bannedTermsList,
    customNegativeKeywords = [],
    autoAppendFormatTags = false,
    format,
    targetCount = 40,
    dedupeSingularPlural = true,
    removeStopwords = true,
  } = options || {};

  // Build combined banned set in lowercase
  const bannedSet = new Set<string>();
  const activeBannedSource = bannedTermsList || DEFAULT_BANNED_TRADEMARKS;
  
  if (negativeKeywordsFilter) {
    activeBannedSource.forEach((b) => bannedSet.add(b.toLowerCase().trim()));
  }
  customNegativeKeywords.forEach((b) => {
    if (b.trim()) bannedSet.add(b.trim().toLowerCase());
  });

  const seenExact = new Set<string>();
  const seenBaseStems = new Set<string>();
  const sanitized: string[] = [];

  for (const raw of keywords) {
    if (!raw) continue;
    // Clean unwanted punctuation and special characters
    const clean = raw
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean || clean.length < 2) continue;

    // Filter pure numbers or timestamps (e.g. 20261010151843, 2026, 12345)
    if (/^\d+$/.test(clean) || /\b\d{6,}\b/.test(clean)) {
      continue;
    }

    // Filter strict forbidden microstock keywords (eps, eps10, ai, stock, commercial, etc.)
    if (FORBIDDEN_MICROSTOCK_KEYWORDS.has(clean)) {
      continue;
    }

    // Check stopwords if single token
    if (removeStopwords && STOCK_STOPWORDS.has(clean)) {
      continue;
    }

    // Check if banned or contains banned term
    let isBanned = false;
    if (bannedSet.has(clean)) {
      isBanned = true;
    } else {
      for (const banned of bannedSet) {
        if (clean === banned || clean.split(' ').includes(banned)) {
          isBanned = true;
          break;
        }
      }
    }

    if (isBanned) continue;

    // Singular / Plural deduplication check
    const baseStem = dedupeSingularPlural ? normalizeSingularPlural(clean) : clean;

    if (!seenExact.has(clean) && !seenBaseStems.has(baseStem)) {
      seenExact.add(clean);
      seenBaseStems.add(baseStem);
      sanitized.push(clean);
    }
  }

  // Auto-append format tags if requested and space permits
  if (autoAppendFormatTags && format && FORMAT_SPECIFIC_TAGS[format]) {
    for (const tag of FORMAT_SPECIFIC_TAGS[format]) {
      const lower = tag.toLowerCase().trim();
      const stem = dedupeSingularPlural ? normalizeSingularPlural(lower) : lower;
      if (!seenExact.has(lower) && !seenBaseStems.has(stem) && !bannedSet.has(lower)) {
        seenExact.add(lower);
        seenBaseStems.add(stem);
        sanitized.push(lower);
      }
    }
  }

  // Cap at target count (maximum 50 per microstock standard)
  const max = Math.min(50, Math.max(5, targetCount));
  return sanitized.slice(0, max);
}
