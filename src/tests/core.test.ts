import { describe, it, expect } from 'vitest';
import { sanitizeKeywords, normalizeSingularPlural, STOCK_STOPWORDS } from '../utils/negativeKeywords';
import { escapeCsvCell, generateMarketplaceCsv } from '../utils/universalExportManager';
import { validateFileMetadata } from '../services/marketplaceValidator';
import { StockFile } from '../types/stock';

describe('Keyword Sanitizer & Stopwords Cleaner', () => {
  it('deduplicates case-insensitively and removes punctuation', () => {
    const raw = ['Nature', 'nature', 'NATURE!', 'mountain-view', ''];
    const cleaned = sanitizeKeywords(raw, { targetCount: 10 });
    expect(cleaned).toEqual(['nature', 'mountain-view']);
  });

  it('removes stopwords like "and", "the", "in", "with"', () => {
    const raw = ['forest', 'and', 'the', 'trees', 'in', 'autumn'];
    const cleaned = sanitizeKeywords(raw, { removeStopwords: true });
    expect(cleaned).not.toContain('and');
    expect(cleaned).not.toContain('the');
    expect(cleaned).not.toContain('in');
    expect(cleaned).toContain('forest');
  });

  it('deduplicates singular/plural pairs preserving rank order', () => {
    const raw = ['car', 'cars', 'mountain', 'mountains', 'tree'];
    const cleaned = sanitizeKeywords(raw, { dedupeSingularPlural: true });
    expect(cleaned).toEqual(['car', 'mountain', 'tree']);
  });

  it('blocks trademark and forbidden spam keywords', () => {
    const raw = ['apple', 'iphone', 'nike', 'beautiful', '8k', 'landscape'];
    const cleaned = sanitizeKeywords(raw, { negativeKeywordsFilter: true });
    expect(cleaned).toEqual(['landscape']);
  });
});

describe('RFC 4180 CSV Escaping & Builder', () => {
  it('escapes cells with commas, quotes, and newlines', () => {
    expect(escapeCsvCell('Hello, World')).toBe('"Hello, World"');
    expect(escapeCsvCell('Say "Hello"')).toBe('"Say ""Hello"""');
    expect(escapeCsvCell('Line1\nLine2')).toBe('"Line1\nLine2"');
    expect(escapeCsvCell('SimpleText')).toBe('SimpleText');
  });

  it('generates semicolon-delimited CSV for Freepik', () => {
    const mockFile: StockFile = {
      id: 'f1',
      name: 'vector_art.svg',
      baseName: 'vector_art',
      format: 'svg',
      size: 10240,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: {
        title: 'Minimalist Sunset Vector Illustration',
        description: 'Clean graphic sunset landscape with copy space.',
        keywords: ['sunset', 'vector', 'illustration'],
        primaryCategory: 'Graphic Resources',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const csvResult = generateMarketplaceCsv('freepik', [mockFile]);
    expect(csvResult.delimiter).toBe(';');
    expect(csvResult.csvContent).toContain('File name;Title;Keywords;Prompt;Model');
    expect(csvResult.csvContent).toContain('vector_art.svg;Minimalist Sunset Vector Illustration;sunset,vector,illustration');
  });
});

describe('Marketplace Validator & Preflight', () => {
  it('detects title exceeding marketplace limit', () => {
    const mockFile: StockFile = {
      id: 'f2',
      name: 'test.jpg',
      baseName: 'test',
      format: 'jpg',
      size: 2000000,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: {
        title: 'A'.repeat(250),
        description: 'Valid description here',
        keywords: ['one', 'two', 'three', 'four', 'five', 'six', 'seven'],
        primaryCategory: 'Nature',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const report = validateFileMetadata(mockFile, ['adobe_stock', 'freepik']);
    expect(report.hasErrors).toBe(true);
    expect(report.badgeStatus).toBe('error');
    const titleIssues = report.issues.filter((i) => i.field === 'title');
    expect(titleIssues.length).toBeGreaterThan(0);
  });

  it('flags recognizable people/property as requiring release', () => {
    const mockFile: StockFile = {
      id: 'f3',
      name: 'portrait.jpg',
      baseName: 'portrait',
      format: 'jpg',
      size: 3000000,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: {
        title: 'Portrait of young smiling architect in office',
        description: 'Architect review plans in modern studio.',
        keywords: ['architect', 'portrait', 'smile', 'office', 'design', 'plan', 'building'],
        primaryCategory: 'People',
        containsPeople: true,
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const report = validateFileMetadata(mockFile, ['adobe_stock']);
    expect(report.releasesNeeded).toBe(true);
    expect(report.issues.some((i) => i.field === 'releases')).toBe(true);
  });
});
