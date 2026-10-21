import {
  CanonicalAssetAnalysis,
  StockFile,
  AdaptedMarketplaceMetadata,
  MarketplaceConfig,
  SEOConfig,
} from '../types/stock';
import { MARKETPLACES } from '../config/marketplaces';

/**
 * In-memory & localStorage cache for Stage A Canonical Asset Analyses
 */
const CANONICAL_CACHE_KEY = 'stockmeta_canonical_cache_v2.7';

class CanonicalAssetService {
  private cache: Map<string, CanonicalAssetAnalysis> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(CANONICAL_CACHE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        for (const [k, v] of Object.entries(parsed)) {
          this.cache.set(k, v as CanonicalAssetAnalysis);
        }
      }
    } catch {}
  }

  private saveToStorage() {
    try {
      const obj: Record<string, CanonicalAssetAnalysis> = {};
      this.cache.forEach((v, k) => {
        obj[k] = v;
      });
      localStorage.setItem(CANONICAL_CACHE_KEY, JSON.stringify(obj));
    } catch {}
  }

  /**
   * Compute a simple fast deterministic hash for an asset based on name, size, and preview snippet
   */
  public computeAssetHash(file: StockFile): string {
    const seed = `${file.name}_${file.size}_${file.format}_${(file.thumbnailBase64 || file.previewUrl || '').slice(0, 100)}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `sha256_${Math.abs(hash).toString(16)}_${file.name.replace(/[^a-z0-9]/gi, '_')}`;
  }

  public getCachedAnalysis(hash: string): CanonicalAssetAnalysis | undefined {
    return this.cache.get(hash);
  }

  public setCachedAnalysis(hash: string, analysis: CanonicalAssetAnalysis): void {
    this.cache.set(hash, analysis);
    this.saveToStorage();
  }

  public clearCache(): void {
    this.cache.clear();
    try {
      localStorage.removeItem(CANONICAL_CACHE_KEY);
    } catch {}
  }
}

export const canonicalAssetService = new CanonicalAssetService();

/**
 * Adapt a Canonical Asset Analysis (Stage A) into destination-specific Marketplace Metadata (Stage B)
 * Runs deterministically in 0ms with zero additional Gemini API consumption.
 */
export function adaptCanonicalToMarketplace(
  canonical: CanonicalAssetAnalysis,
  marketplaceConfig: MarketplaceConfig,
  seoConfig?: SEOConfig
): AdaptedMarketplaceMetadata {
  const issues: string[] = [];
  let status: 'passed' | 'warning' | 'error' = 'passed';

  // 1. Title adaptation
  let title = canonical.masterTitle.trim();
  const titleLimits = marketplaceConfig.titleLimits;

  if (title.length > titleLimits.maxChars) {
    // Truncate cleanly at word boundary
    const truncated = title.slice(0, titleLimits.maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    title = lastSpace > 20 ? truncated.slice(0, lastSpace).trim() : truncated.trim();
    issues.push(`Title trimmed to fit ${marketplaceConfig.name} max ${titleLimits.maxChars} chars.`);
  }

  if (title.length < titleLimits.minChars) {
    status = 'warning';
    issues.push(`Title (${title.length} chars) is shorter than ${marketplaceConfig.name} recommended min (${titleLimits.minChars} chars).`);
  }

  // 2. Description adaptation
  let description = canonical.masterDescription.trim();
  const descLimits = marketplaceConfig.descriptionLimits;

  if (description.length > descLimits.maxChars) {
    const truncatedDesc = description.slice(0, descLimits.maxChars);
    const lastPeriod = truncatedDesc.lastIndexOf('.');
    description = lastPeriod > 40 ? truncatedDesc.slice(0, lastPeriod + 1) : truncatedDesc;
    issues.push(`Description trimmed to fit ${marketplaceConfig.name} max ${descLimits.maxChars} chars.`);
  }

  if (description.length < descLimits.minChars) {
    issues.push(`Description is shorter than ${marketplaceConfig.name} minimum (${descLimits.minChars} chars).`);
  }

  // 3. Keywords adaptation & ordering
  let keywords = [...canonical.masterKeywords];
  const kwLimits = marketplaceConfig.keywordLimits;

  // Handle AI disclosure requirement if active
  let aiDisclosureApplied = false;
  if (seoConfig?.isAiGeneratedBatch && marketplaceConfig.aiDisclosure?.required) {
    aiDisclosureApplied = true;
    const aiTags = ['Generative AI', 'AI Generated'];
    for (const tag of aiTags) {
      if (!keywords.map((k) => k.toLowerCase()).includes(tag.toLowerCase())) {
        keywords.unshift(tag); // Place at top for visibility
      }
    }
  }

  // Cap to marketplace limit
  if (keywords.length > kwLimits.maxCount) {
    keywords = keywords.slice(0, kwLimits.maxCount);
  }

  if (keywords.length < kwLimits.minCount) {
    status = 'warning';
    issues.push(`Keyword count (${keywords.length}) below ${marketplaceConfig.name} minimum (${kwLimits.minCount}).`);
  }

  // Freepik uses semicolon, others use comma
  const delimiter = marketplaceConfig.delimiter || ',';
  const formattedKeywords = keywords.join(delimiter === ';' ? '; ' : ', ');

  return {
    marketplaceId: marketplaceConfig.id,
    marketplaceName: marketplaceConfig.name,
    title,
    description,
    keywords,
    formattedKeywords,
    delimiter,
    category: canonical.primarySubject,
    aiDisclosureApplied,
    status,
    issues,
  };
}

/**
 * Adapt a StockFile for all selected marketplaces using its canonical analysis
 */
export function adaptFileToMarketplaces(
  file: StockFile,
  marketplaceIds: string[],
  seoConfig?: SEOConfig
): AdaptedMarketplaceMetadata[] {
  // If file does not have canonical analysis yet, synthesize one from current metadata
  const canonical: CanonicalAssetAnalysis = file.canonicalAnalysis || {
    assetHash: file.contentHash || `hash_${file.id}`,
    primarySubject: file.metadata.primaryCategory || 'Commercial Stock Asset',
    secondarySubjects: file.metadata.secondaryCategory ? [file.metadata.secondaryCategory] : [],
    settingAndBackground: 'Studio / Natural Setting',
    moodAndConcept: 'Commercial Concept',
    compositionAndLighting: 'Professional Studio Lighting',
    dominantColors: file.metadata.dominantColors || ['Blue', 'White'],
    orientation: file.metadata.orientation || 'horizontal',
    contentType: (file.metadata.contentType as any) || 'photo',
    peopleCount: file.metadata.containsPeople ? 1 : 0,
    visibleTextOrLabels: [],
    masterTitle: file.metadata.title,
    masterDescription: file.metadata.description,
    masterKeywords: file.metadata.keywords,
    timestamp: Date.now(),
  };

  const adaptedList: AdaptedMarketplaceMetadata[] = [];

  for (const mId of marketplaceIds) {
    const config = MARKETPLACES[mId];
    if (config) {
      adaptedList.push(adaptCanonicalToMarketplace(canonical, config, seoConfig));
    }
  }

  return adaptedList;
}
