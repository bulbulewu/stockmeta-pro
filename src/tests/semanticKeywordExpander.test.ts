import { describe, it, expect } from 'vitest';
import {
  deduplicateTitleWords,
  buildHighRankingTitle,
  generateNicheKeywords,
  sanitizeAndBalanceKeywords,
  LOW_VALUE_FILLER_TAGS,
  FORBIDDEN_MICROSTOCK_TAGS,
  APPROVED_STYLE_TAGS,
} from '../utils/semanticKeywordExpander';
import { createFallbackMetadata } from '../services/visionAiService';
import { StockFile } from '../types/stock';

describe('Title Deduplication & Boilerplate Removal', () => {
  it('removes duplicate words and boilerplate suffixes', () => {
    const raw = 'Affogato Coffee 28 Icons Set Vector Illustration Icon Set Editable Stroke for Digital Design and Commercial Marketing Projects';
    const cleaned = deduplicateTitleWords(raw);

    // No boilerplate suffix
    expect(cleaned).not.toContain('for Digital Design and Commercial Marketing Projects');

    // "Icon" and "Set" should not be duplicated
    const words = cleaned.toLowerCase().split(/\s+/);
    const iconCount = words.filter((w) => w === 'icon' || w === 'icons').length;
    const setCount = words.filter((w) => w === 'set' || w === 'sets').length;

    expect(iconCount).toBe(1);
    expect(setCount).toBe(1);
    expect(cleaned).toBe('Affogato Coffee 28 Icons Set Vector Illustration Editable Stroke');
  });

  it('builds high-ranking title formula within 70 to 150 characters for Affogato', () => {
    const title = buildHighRankingTitle('affogato coffee dessert 28 icons set', 'eps', ['AFFOGATO', '28 ICONS SET']);
    expect(title.length).toBeGreaterThanOrEqual(70);
    expect(title.length).toBeLessThanOrEqual(150);

    // Contains subject and niche words
    expect(title).toContain('Affogato');
    expect(title).toContain('Coffee');
    expect(title).toContain('Line Icons Set');
    expect(title).toContain('Editable Stroke Vector Illustration');

    // No duplicate words
    const words = title.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    expect(words.length).toBe(uniqueWords.size);
  });

  it('builds high-ranking title formula within 70 to 150 characters for Airline Pilot', () => {
    const title = buildHighRankingTitle('airline pilot captain 28 icons set', 'eps', ['AIRLINE PILOT', '28 ICONS SET']);
    expect(title.length).toBeGreaterThanOrEqual(70);
    expect(title.length).toBeLessThanOrEqual(150);

    expect(title).toContain('Airline Pilot');
    expect(title).toContain('Line Icons Set');
    expect(title).toContain('Editable Stroke Vector Illustration');

    // No duplicate words
    const words = title.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    expect(words.length).toBe(uniqueWords.size);
  });
});

describe('Keyword Distribution (70% Niche / 30% Style)', () => {
  it('generates 45 keywords for coffee/affogato with first 25–30 niche-specific terms', () => {
    const keywords = generateNicheKeywords('affogato coffee dessert 28 icons set', 'eps', ['AFFOGATO', 'ESPRESSO']);

    expect(keywords.length).toBe(45);

    // First 25 terms must contain coffee/affogato niche terms
    const first25 = keywords.slice(0, 25);
    expect(first25).toContain('affogato');
    expect(first25).toContain('coffee');
    expect(first25).toContain('espresso');
    expect(first25).toContain('gelato');
    expect(first25).toContain('dessert');
    expect(first25).toContain('cafe');
    expect(first25).toContain('barista');
    expect(first25).toContain('beverage');

    // Last 15 terms must contain approved style tags
    const last15 = keywords.slice(keywords.length - 15);
    expect(last15).toContain('line icon');
    expect(last15).toContain('icon set');
    expect(last15).toContain('editable stroke');
    expect(last15).toContain('outline');
    expect(last15).toContain('vector');
    expect(last15).toContain('illustration');

    // Forbidden and low-value tags must NOT be present
    for (const forbidden of FORBIDDEN_MICROSTOCK_TAGS) {
      expect(keywords).not.toContain(forbidden);
    }
    for (const filler of LOW_VALUE_FILLER_TAGS) {
      expect(keywords).not.toContain(filler);
    }
  });

  it('generates 45 keywords for airline pilot with aviation niche terms', () => {
    const keywords = generateNicheKeywords('airline pilot captain 28 icons set', 'eps', ['PILOT', 'AIRPLANE']);

    expect(keywords.length).toBe(45);

    // First 25 terms must contain aviation niche terms
    const first25 = keywords.slice(0, 25);
    expect(first25).toContain('airline pilot');
    expect(first25).toContain('pilot');
    expect(first25).toContain('aviation');
    expect(first25).toContain('captain');
    expect(first25).toContain('airplane');
    expect(first25).toContain('aircraft');
    expect(first25).toContain('flight');
    expect(first25).toContain('airport');
    expect(first25).toContain('cockpit');

    // Last 15 terms must be style tags
    const last15 = keywords.slice(keywords.length - 15);
    expect(last15).toContain('line icon');
    expect(last15).toContain('editable stroke');

    // Low-value fillers must NOT be present
    expect(keywords).not.toContain('visual');
    expect(keywords).not.toContain('presentation');
    expect(keywords).not.toContain('button');
    expect(keywords).not.toContain('clipart');
    expect(keywords).not.toContain('concept');
    expect(keywords).not.toContain('element');
  });

  it('sanitizes and rebalances keyword lists from external AI models', () => {
    const rawExternalKeywords = [
      'affogato',
      'coffee',
      'espresso',
      'visual',
      'presentation',
      'button',
      'clipart',
      'concept',
      'element',
      'template',
      'creative',
      'digital',
      'eps',
      'eps10',
      'stock',
      'commercial',
      'graphic asset',
      'ice cream',
      'gelato',
      'line icon',
      'icon set',
    ];

    const balanced = sanitizeAndBalanceKeywords(rawExternalKeywords, 'affogato coffee', 'eps');
    expect(balanced.length).toBe(45);

    // Fillers and forbidden words removed
    expect(balanced).not.toContain('visual');
    expect(balanced).not.toContain('presentation');
    expect(balanced).not.toContain('button');
    expect(balanced).not.toContain('clipart');
    expect(balanced).not.toContain('concept');
    expect(balanced).not.toContain('eps');
    expect(balanced).not.toContain('stock');
    expect(balanced).not.toContain('commercial');

    // Niche terms preserved and expanded
    expect(balanced).toContain('affogato');
    expect(balanced).toContain('coffee');
    expect(balanced).toContain('espresso');
    expect(balanced).toContain('ice cream');
    expect(balanced).toContain('gelato');

    // Approved style tags in the final slots
    expect(balanced).toContain('line icon');
    expect(balanced).toContain('editable stroke');
  });
});

describe('createFallbackMetadata Integration', () => {
  it('generates rich, non-generic metadata without boilerplate', () => {
    const file: StockFile = {
      id: 'test-1',
      name: '20261010151843_affogato_coffee_dessert_28_icons_set.eps',
      format: 'eps',
      size: 50000,
      metadata: {
        title: '',
        description: '',
        keywords: [],
        primaryCategory: '',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const meta = createFallbackMetadata(file, {
      selectedMarketplaces: ['adobe_stock'],
      negativeKeywordsFilter: true,
      customNegativeKeywords: [],
      autoAppendFormatTags: false,
      orderKeywordsByWeight: true,
      keywordTargetCount: 45,
      titleStyle: 'commercial',
      temperature: 0.2,
      selectedModel: 'gemini-2.5-flash',
      aiProvider: 'gemini',
    });

    expect(meta.title.length).toBeGreaterThanOrEqual(70);
    expect(meta.title.length).toBeLessThanOrEqual(150);
    expect(meta.title).not.toContain('for Digital Design and Commercial Marketing Projects');
    expect(meta.keywords.length).toBe(45);
    expect(meta.keywords).toContain('affogato');
    expect(meta.keywords).not.toContain('visual');
    expect(meta.keywords).not.toContain('clipart');
    expect(meta.keywords).not.toContain('eps');
  });

  it('never outputs "icon line icons" in description', () => {
    const file: StockFile = {
      id: 'test-desc',
      name: 'camping_gear_equipment_icons_set.eps',
      format: 'eps',
      size: 50000,
      metadata: {
        title: '',
        description: '',
        keywords: [],
        primaryCategory: '',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const meta = createFallbackMetadata(file, {
      selectedMarketplaces: ['adobe_stock'],
      negativeKeywordsFilter: true,
      customNegativeKeywords: [],
      autoAppendFormatTags: false,
      orderKeywordsByWeight: true,
      keywordTargetCount: 45,
      titleStyle: 'commercial',
      temperature: 0.2,
      selectedModel: 'gemini-2.5-flash',
      aiProvider: 'gemini',
    });

    expect(meta.description).not.toMatch(/icon\s+line\s+icons/i);
    expect(meta.description).toContain('line icons with editable stroke');
    expect(meta.description).toContain('camping gear equipment');
  });

  it('generates dynamic niche keywords for arbitrary topics not in dictionary (e.g. camping, cybersecurity)', () => {
    const campingKeywords = generateNicheKeywords('camping gear hiking outdoor', 'eps', []);
    expect(campingKeywords.length).toBe(45);
    expect(campingKeywords).toContain('camping');
    expect(campingKeywords).toContain('gear');
    expect(campingKeywords).toContain('hiking');
    expect(campingKeywords).toContain('outdoor');
    // Verifies dynamic niche generation produced domain terms
    expect(campingKeywords.some((k) => k.includes('equipment') || k.includes('adventure') || k.includes('outdoor'))).toBe(true);

    const cyberKeywords = generateNicheKeywords('cybersecurity network data defense', 'eps', []);
    expect(cyberKeywords.length).toBe(45);
    expect(cyberKeywords).toContain('cybersecurity');
    expect(cyberKeywords).toContain('network');
    expect(cyberKeywords).toContain('data');
    expect(cyberKeywords.some((k) => k.includes('security') || k.includes('system') || k.includes('technology'))).toBe(true);
  });
});
