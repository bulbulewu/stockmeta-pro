import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  inspectVectorStrokes,
  detectUnoutlinedFonts,
  embedEpsMetadata,
} from '../utils/epsNativeProcessor';
import {
  validateKeywords,
  generateNicheKeywords,
  buildHighRankingTitle,
} from '../utils/semanticKeywordExpander';
import { runTechnicalPreflight } from '../utils/technicalPreflight';
import { StockFile } from '../types/stock';

describe('Requirement 1: Input & Filename Sanitizer (Strip Workflow Artifacts)', () => {
  it('sanitizes "wild-fermentation-ember-upscaled-line-icons-set-editable.eps" to core subject and asset type', () => {
    const raw = 'wild-fermentation-ember-upscaled-line-icons-set-editable.eps';
    const sanitized = sanitizeInput(raw);

    expect(sanitized.coreSubject).toBe('Wild Fermentation');
    expect(sanitized.assetType).toBe('Line Icons Set');
    expect(sanitized.cleanPromptText).toBe('Wild Fermentation Line Icons Set');
    expect(sanitized.rawStrippedTokens).toContain('ember');
    expect(sanitized.rawStrippedTokens).toContain('upscaled');
  });

  it('sanitizes "administrative-assistant-v1-upscaled-line-icons-set.eps" to "Administrative Assistant" and "Line Icons Set"', () => {
    const raw = 'administrative-assistant-v1-upscaled-line-icons-set.eps';
    const sanitized = sanitizeInput(raw);

    expect(sanitized.coreSubject).toBe('Administrative Assistant');
    expect(sanitized.assetType).toBe('Line Icons Set');
    expect(sanitized.cleanPromptText).toBe('Administrative Assistant Line Icons Set');
    expect(sanitized.rawStrippedTokens).toContain('v1');
    expect(sanitized.rawStrippedTokens).toContain('upscaled');
  });

  it('strips AI and workflow tool tokens (topaz, gigapixel, midjourney, firefly, v1, v2, 8000x4000, cmyk)', () => {
    const raw = '8000x4000_topaz_gigapixel_midjourney_firefly_artboard_cmyk_cybersecurity_v2_final_copy.eps';
    const sanitized = sanitizeInput(raw);

    expect(sanitized.coreSubject).toBe('Cybersecurity');
    expect(sanitized.rawStrippedTokens).toContain('topaz');
    expect(sanitized.rawStrippedTokens).toContain('gigapixel');
    expect(sanitized.rawStrippedTokens).toContain('midjourney');
    expect(sanitized.rawStrippedTokens).toContain('firefly');
    expect(sanitized.rawStrippedTokens).toContain('8000x4000');
    expect(sanitized.rawStrippedTokens).toContain('cmyk');
  });

  it('preserves quantities (e.g. 28 icons) while stripping dates and timestamps', () => {
    const raw = '20261021_affogato_coffee_dessert_28_icons_set_upscayl_expanded.eps';
    const sanitized = sanitizeInput(raw);

    expect(sanitized.coreSubject).toBe('Affogato Coffee Dessert');
    expect(sanitized.assetType).toBe('28 Icons Set');
  });
});

describe('Requirement 2: Remove Algorithmic Word-Pair Permutations & Generic Noun Concatenation', () => {
  it('does NOT generate inverted word pairs (no WordB WordA spam)', () => {
    const keywords = generateNicheKeywords('wild fermentation line icons set', 'eps', []);

    // If 'wild fermentation' is present, 'fermentation wild' must NOT be present
    if (keywords.includes('wild fermentation')) {
      expect(keywords).not.toContain('fermentation wild');
    }

    // Verify zero word-order inversions exist anywhere in the array
    const pairs = keywords.filter((k) => k.split(/\s+/).length === 2);
    const fingerprints = new Set<string>();
    for (const p of pairs) {
      const sorted = p.split(/\s+/).sort().join('|');
      expect(fingerprints.has(sorted)).toBe(false);
      fingerprints.add(sorted);
    }
  });

  it('does NOT append generic corporate noun prefixes (no "wild security", "wild navigation", "wild equipment")', () => {
    const keywords = generateNicheKeywords('wild fermentation line icons set', 'eps', []);

    expect(keywords).not.toContain('wild equipment');
    expect(keywords).not.toContain('wild service');
    expect(keywords).not.toContain('wild concept');
    expect(keywords).not.toContain('wild security');
    expect(keywords).not.toContain('wild safety');
    expect(keywords).not.toContain('wild protection');
    expect(keywords).not.toContain('wild navigation');
    expect(keywords).not.toContain('fermentation security');
    expect(keywords).not.toContain('fermentation navigation');
  });

  it('generates contextually accurate niche keywords for fermentation', () => {
    const keywords = generateNicheKeywords('wild fermentation line icons set', 'eps', []);

    expect(keywords.length).toBe(45);
    expect(keywords).toContain('wild fermentation');
    expect(keywords).toContain('kombucha');
    expect(keywords).toContain('sourdough');
    expect(keywords).toContain('probiotic');
    expect(keywords).toContain('pickling');
  });
});

describe('Requirement 4: Accurate "Editable Stroke" vs "Outline" Detection for EPS/SVG', () => {
  it('detects live strokes in EPS using setlinewidth and stroke operators', () => {
    const liveStrokeEps = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 100 100
%%EndSetup
2 setlinewidth
10 10 moveto 90 90 lineto stroke
showpage
%%EOF`;

    const analysis = inspectVectorStrokes(liveStrokeEps, 'eps');
    expect(analysis.hasLiveStroke).toBe(true);
    expect(analysis.recommendedStylePhrase).toBe('Editable Stroke');

    const title = buildHighRankingTitle('wild fermentation', 'eps', [], analysis.hasLiveStroke);
    expect(title).toContain('Editable Stroke');
  });

  it('detects expanded compound fills (no live stroke) in EPS and forbids "Editable Stroke"', () => {
    const expandedEps = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 100 100
%%EndSetup
newpath
10 10 moveto 20 10 lineto 20 20 lineto 10 20 lineto closepath
eofill
showpage
%%EOF`;

    const analysis = inspectVectorStrokes(expandedEps, 'eps');
    expect(analysis.hasLiveStroke).toBe(false);
    expect(analysis.isExpandedFill).toBe(true);
    expect(analysis.recommendedStylePhrase).toBe('Outline');

    const title = buildHighRankingTitle('wild fermentation', 'eps', [], analysis.hasLiveStroke);
    expect(title).not.toContain('Editable Stroke');
    expect(title).toContain('Outline');

    const keywords = validateKeywords(['wild fermentation', 'editable stroke', 'line art'], {
      hasLiveStroke: analysis.hasLiveStroke,
    });
    expect(keywords).not.toContain('editable stroke');
    expect(keywords).toContain('outline');
  });

  it('detects live strokes vs expanded fills in SVG', () => {
    const liveSvg = `<svg viewBox="0 0 100 100"><path stroke="#000" stroke-width="2" d="M10 10 L90 90" /></svg>`;
    const liveAnalysis = inspectVectorStrokes(liveSvg, 'svg');
    expect(liveAnalysis.hasLiveStroke).toBe(true);

    const expandedSvg = `<svg viewBox="0 0 100 100"><path fill="#000" d="M10 10 H20 V20 H10 Z" /></svg>`;
    const expandedAnalysis = inspectVectorStrokes(expandedSvg, 'svg');
    expect(expandedAnalysis.hasLiveStroke).toBe(false);
    expect(expandedAnalysis.recommendedStylePhrase).toBe('Outline');
  });
});

describe('Requirement 5: EPS / XMP / IPTC Synchronization & Live Font Detection', () => {
  it('synchronizes PostScript DSC Header and XMP Packet in EPS', () => {
    const pad = ' '.repeat(2048);
    const epsWithHeader = `%!PS-Adobe-3.0 EPSF-3.0
%%Title: Old Unoptimized Title
%%Keywords: old, keyword
%%EndComments
%%BoundingBox: 0 0 100 100
<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
   <dc:title><rdf:Alt><rdf:li xml:lang="x-default">Old</rdf:li></rdf:Alt></dc:title>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
${pad}
<?xpacket end="w"?>
%%EOF`;

    const buf = Buffer.from(epsWithHeader, 'utf-8');
    const res = embedEpsMetadata(buf, {
      title: 'Wild Fermentation Line Icons Set, Artisan Food Preservation Vector',
      description: 'Artisan wild fermentation vector icon collection with sourdough and kimchi.',
      keywords: ['wild fermentation', 'kombucha', 'sourdough', 'probiotic', 'line icon'],
    });

    expect(res.success).toBe(true);
    expect(res.dscHeaderUpdated).toBe(true);
    expect(res.xmpUpdated).toBe(true);

    const updatedText = res.updatedBuffer.toString('utf-8');
    // 1. PostScript DSC Header synchronized
    expect(updatedText).toContain('%%Title: Wild Fermentation Line Icons Set, Artisan Food Preservation Vector');
    expect(updatedText).toContain('%%Keywords: wild fermentation, kombucha, sourdough, probiotic, line icon');

    // 2. XMP Packet synchronized
    expect(updatedText).toContain('<dc:title>');
    expect(updatedText).toContain('Wild Fermentation Line Icons Set, Artisan Food Preservation Vector');
    expect(updatedText).toContain('<rdf:li>wild fermentation</rdf:li>');
    expect(updatedText).toContain('<rdf:li>kombucha</rdf:li>');
  });

  it('detects unoutlined fonts in %%DocumentNeededFonts and triggers Preflight warning badge', () => {
    const epsWithFont = `%!PS-Adobe-3.0 EPSF-3.0
%%DocumentNeededFonts: ArialMT Arial-BoldMT
%%EndComments
%%BoundingBox: 0 0 100 100
%%EOF`;

    const fonts = detectUnoutlinedFonts(epsWithFont);
    expect(fonts).toContain('ArialMT');
    expect(fonts).toContain('Arial-BoldMT');

    const testFile: StockFile = {
      id: 'font-test',
      name: 'fermentation_artisan.eps',
      format: 'eps',
      size: 100000,
      detectedFonts: fonts,
      metadata: {
        title: 'Wild Fermentation Vector',
        description: 'Wild fermentation vector.',
        keywords: ['wild fermentation'],
        primaryCategory: 'Food',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const issues = runTechnicalPreflight(testFile, [testFile]);
    const fontIssue = issues.find((i) => i.code === 'EPS_LIVE_FONT');
    expect(fontIssue).toBeDefined();
    expect(fontIssue?.message).toBe(
      'Warning: Live unoutlined font (ArialMT, Arial-BoldMT) detected in EPS header. Convert text to outlines in Illustrator to prevent microstock rejection.'
    );
  });

  it('generates contextually accurate niche keywords for administrative assistant with exact slots', () => {
    const keywords = generateNicheKeywords('administrative assistant line icons set', 'eps', []);

    expect(keywords.length).toBe(45);
    // Slots 1-7: core subject
    expect(keywords).toContain('administrative assistant');
    expect(keywords).toContain('secretary');
    expect(keywords).toContain('office');
    // Slots 8-10: visual style
    expect(keywords).toContain('line icon');
    // Slots 11-28: literal objects
    expect(keywords).toContain('desk');
    expect(keywords).toContain('computer');
    expect(keywords).toContain('clipboard');
    expect(keywords).toContain('calculator');
    // Slots 29-37: industry context
    expect(keywords).toContain('business');
    expect(keywords).toContain('corporate');
  });
});

describe('Requirement 6: Keyword Validation Guardrail (Post-Processing)', () => {
  it('deduplicates tags case-insensitively', () => {
    const input = ['Kombucha', 'kombucha', 'KOMBUCHA', 'Sourdough'];
    const validated = validateKeywords(input);

    expect(validated.filter((k) => k === 'kombucha').length).toBe(1);
    expect(validated).toContain('sourdough');
  });

  it('removes any tag longer than 3 words', () => {
    const input = [
      'wild fermentation jar', // 3 words: valid
      'super artisan organic sourdough bread crock', // 6 words: invalid
      'kombucha', // 1 word: valid
      'homemade pickled vegetables container design', // 4 words: invalid
    ];
    const validated = validateKeywords(input);

    expect(validated).toContain('wild fermentation jar');
    expect(validated).toContain('kombucha');
    expect(validated).not.toContain('super artisan organic sourdough bread crock');
    expect(validated).not.toContain('homemade pickled vegetables container design');
  });

  it('rejects exact word-order inversions of previous 2-word tags', () => {
    const input = [
      'wild fermentation',
      'fermentation wild', // exact inversion of previous tag -> reject!
      'gut health',
      'health gut', // exact inversion -> reject!
      'food preservation',
    ];
    const validated = validateKeywords(input);

    expect(validated).toContain('wild fermentation');
    expect(validated).not.toContain('fermentation wild');
    expect(validated).toContain('gut health');
    expect(validated).not.toContain('health gut');
  });

  it('ensures total keyword count is strictly between 35 and 49 (target 45)', () => {
    // Under 35 input tags
    const smallInput = ['kombucha', 'sourdough', 'kimchi', 'sauerkraut', 'probiotic'];
    const expanded = validateKeywords(smallInput, { targetCount: 45 });
    expect(expanded.length).toBe(45);

    // Over 49 input tags
    const largeInput = Array.from({ length: 60 }, (_, i) => `niche tag ${i}`);
    const capped = validateKeywords(largeInput, { targetCount: 45 });
    expect(capped.length).toBe(45);
  });
});
