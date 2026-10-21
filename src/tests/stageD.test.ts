import { describe, it, expect } from 'vitest';
import {
  bulkAddKeywords,
  bulkFindAndReplaceKeywords,
  bulkFindAndReplaceText,
  bulkRemoveKeywords,
  bulkSetCategories,
  bulkSetFlags,
  bulkSetTitlePrefixSuffix,
} from '../utils/bulkMetadataUtils';
import { QueueController } from '../services/visionAiService';
import { StockFile } from '../types/stock';

function createMockFile(id: string, name: string, title: string, keywords: string[]): StockFile {
  return {
    id,
    name,
    baseName: name.replace(/\.[^/.]+$/, ''),
    size: 2048000,
    format: 'jpg',
    lastModified: Date.now(),
    previewUrl: 'data:image/jpeg;base64,mock',
    status: 'ready',
    metadata: {
      title,
      description: 'Initial description for ' + name,
      keywords,
      primaryCategory: 'Nature',
      secondaryCategory: 'Outdoors',
      adobeCategoryId: 11,
      editorial: false,
      releasesRequired: false,
    },
  };
}

describe('Stage D — Bulk Metadata Tools & Queue Controller', () => {
  it('bulkFindAndReplaceKeywords correctly finds and replaces keywords across files', () => {
    const files = [
      createMockFile('f1', 'a.jpg', 'Man working', ['man', 'office', 'computer']),
      createMockFile('f2', 'b.jpg', 'Modern man', ['man', 'technology', 'success']),
    ];

    const updated = bulkFindAndReplaceKeywords(files, 'man', 'businessman', true);

    expect(updated[0].metadata.keywords).toEqual(['businessman', 'office', 'computer']);
    expect(updated[1].metadata.keywords).toEqual(['businessman', 'technology', 'success']);
  });

  it('bulkFindAndReplaceKeywords deletes keyword if replacement is empty', () => {
    const files = [
      createMockFile('f1', 'a.jpg', 'Sample Image', ['watermark', 'landscape', 'mountain']),
    ];

    const updated = bulkFindAndReplaceKeywords(files, 'watermark', '', true);
    expect(updated[0].metadata.keywords).toEqual(['landscape', 'mountain']);
  });

  it('bulkAddKeywords prepends or appends keywords with deduplication', () => {
    const files = [
      createMockFile('f1', 'a.jpg', 'Autumn Leaf', ['nature', 'forest']),
    ];

    // Prepend (top priority weight)
    const prepended = bulkAddKeywords(files, ['autumn', 'fall', 'nature'], 'prepend');
    expect(prepended[0].metadata.keywords[0]).toBe('autumn');
    expect(prepended[0].metadata.keywords[1]).toBe('fall');
    expect(prepended[0].metadata.keywords).toEqual(['autumn', 'fall', 'nature', 'forest']);

    // Append
    const appended = bulkAddKeywords(files, ['isolated', 'forest'], 'append');
    expect(appended[0].metadata.keywords).toEqual(['nature', 'forest', 'isolated']);
  });

  it('bulkRemoveKeywords removes specific blacklist/negative keywords', () => {
    const files = [
      createMockFile('f1', 'a.jpg', 'Graphic', ['sample', 'preview', 'vector', 'clean']),
    ];

    const updated = bulkRemoveKeywords(files, ['sample', 'preview']);
    expect(updated[0].metadata.keywords).toEqual(['vector', 'clean']);
  });

  it('bulkFindAndReplaceText updates Title and Description cleanly', () => {
    const files = [
      createMockFile('f1', 'a.jpg', 'Calendar 2025 Layout Template', ['calendar']),
      createMockFile('f2', 'b.jpg', 'Diary 2025 Planner Graphic', ['diary']),
    ];

    const updated = bulkFindAndReplaceText(files, 'title', '2025', '2026');
    expect(updated[0].metadata.title).toBe('Calendar 2026 Layout Template');
    expect(updated[1].metadata.title).toBe('Diary 2026 Planner Graphic');
  });

  it('bulkSetTitlePrefixSuffix adds series prefixes and suffixes', () => {
    const files = [
      createMockFile('f1', 'a.jpg', 'Minimalist Icon Pack', ['icons']),
    ];

    const updated = bulkSetTitlePrefixSuffix(files, 'Set of', '- Isolated on White');
    expect(updated[0].metadata.title).toBe('Set of Minimalist Icon Pack - Isolated on White');
  });

  it('bulkSetCategories updates categories and Adobe category ID', () => {
    const files = [
      createMockFile('f1', 'a.jpg', 'Corporate Finance', ['finance']),
    ];

    const updated = bulkSetCategories(files, {
      primaryCategory: 'Business & Finance',
      secondaryCategory: 'Economics',
      adobeCategoryId: 3,
    });

    expect(updated[0].metadata.primaryCategory).toBe('Business & Finance');
    expect(updated[0].metadata.secondaryCategory).toBe('Economics');
    expect(updated[0].metadata.adobeCategoryId).toBe(3);
  });

  it('bulkSetFlags updates editorial and release requirement flags', () => {
    const files = [
      createMockFile('f1', 'a.jpg', 'Street Demonstration', ['crowd']),
    ];

    const updated = bulkSetFlags(files, {
      editorial: true,
      releasesRequired: false,
    });

    expect(updated[0].metadata.editorial).toBe(true);
    expect(updated[0].metadata.releasesRequired).toBe(false);
  });

  it('QueueController correctly handles pause, resume, and cancel states', async () => {
    const controller = new QueueController();

    expect(controller.isPaused).toBe(false);
    expect(controller.isCancelled).toBe(false);

    controller.pause();
    expect(controller.isPaused).toBe(true);

    let unblocked = false;
    const waitPromise = controller.waitIfPaused().then(() => {
      unblocked = true;
    });

    expect(unblocked).toBe(false);

    controller.resume();
    await waitPromise;
    expect(unblocked).toBe(true);
    expect(controller.isPaused).toBe(false);

    controller.cancel();
    expect(controller.isCancelled).toBe(true);
  });
});
