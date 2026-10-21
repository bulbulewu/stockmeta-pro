import { StockFile } from '../types/stock';

export interface BulkKeywordOptions {
  findText?: string;
  replaceText?: string;
  matchWholeWord?: boolean;
  addKeywords?: string[];
  addPosition?: 'append' | 'prepend';
  removeKeywords?: string[];
}

export interface BulkTextOptions {
  field: 'title' | 'description';
  findText: string;
  replaceText: string;
  matchWholeWord?: boolean;
}

export interface BulkPrefixSuffixOptions {
  prefix?: string;
  suffix?: string;
}

export interface BulkCategoryOptions {
  primaryCategory?: string;
  secondaryCategory?: string;
  adobeCategoryId?: number;
}

export interface BulkFlagOptions {
  editorial?: boolean;
  releasesRequired?: boolean;
  matureContent?: boolean;
  isAiGeneratedBatch?: boolean;
}

/**
 * Bulk find and replace keywords across stock files
 */
export function bulkFindAndReplaceKeywords(
  files: StockFile[],
  findText: string,
  replaceText: string,
  matchWholeWord = false
): StockFile[] {
  if (!findText.trim()) return files;
  const cleanFind = findText.trim().toLowerCase();
  const cleanReplace = replaceText.trim().toLowerCase();

  return files.map((file) => {
    const currentKeywords = file.metadata.keywords || [];
    const updatedKeywords: string[] = [];

    for (const kw of currentKeywords) {
      const lower = kw.toLowerCase();
      let matched = false;

      if (matchWholeWord) {
        if (lower === cleanFind) {
          if (cleanReplace) updatedKeywords.push(cleanReplace);
          matched = true;
        }
      } else {
        if (lower.includes(cleanFind)) {
          const replaced = lower.replaceAll(cleanFind, cleanReplace).trim();
          if (replaced) updatedKeywords.push(replaced);
          matched = true;
        }
      }

      if (!matched) {
        updatedKeywords.push(kw);
      }
    }

    // Deduplicate while preserving order
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const k of updatedKeywords) {
      const l = k.toLowerCase().trim();
      if (l && !seen.has(l)) {
        seen.add(l);
        deduped.push(k);
      }
    }

    return {
      ...file,
      metadata: {
        ...file.metadata,
        keywords: deduped,
      },
    };
  });
}

/**
 * Bulk add keywords (append or prepend) with automatic deduplication
 */
export function bulkAddKeywords(
  files: StockFile[],
  newKeywords: string[],
  position: 'append' | 'prepend' = 'append'
): StockFile[] {
  const cleanAdd = newKeywords
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  if (cleanAdd.length === 0) return files;

  return files.map((file) => {
    const existing = file.metadata.keywords || [];
    const combined = position === 'prepend' ? [...cleanAdd, ...existing] : [...existing, ...cleanAdd];

    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const k of combined) {
      const l = k.toLowerCase().trim();
      if (l && !seen.has(l)) {
        seen.add(l);
        deduped.push(k);
      }
    }

    return {
      ...file,
      metadata: {
        ...file.metadata,
        keywords: deduped,
      },
    };
  });
}

/**
 * Bulk remove specific keywords across stock files
 */
export function bulkRemoveKeywords(
  files: StockFile[],
  keywordsToRemove: string[]
): StockFile[] {
  const removeSet = new Set(keywordsToRemove.map((k) => k.toLowerCase().trim()));
  if (removeSet.size === 0) return files;

  return files.map((file) => {
    const existing = file.metadata.keywords || [];
    const filtered = existing.filter((kw) => !removeSet.has(kw.toLowerCase().trim()));

    return {
      ...file,
      metadata: {
        ...file.metadata,
        keywords: filtered,
      },
    };
  });
}

/**
 * Bulk find and replace text in Title or Description
 */
export function bulkFindAndReplaceText(
  files: StockFile[],
  field: 'title' | 'description',
  findText: string,
  replaceText: string,
  matchWholeWord = false
): StockFile[] {
  if (!findText.trim()) return files;

  const regex = matchWholeWord
    ? new RegExp(`\\b${escapeRegExp(findText.trim())}\\b`, 'gi')
    : new RegExp(escapeRegExp(findText.trim()), 'gi');

  return files.map((file) => {
    const currentVal = file.metadata[field] || '';
    const updatedVal = currentVal.replace(regex, replaceText.trim());

    return {
      ...file,
      metadata: {
        ...file.metadata,
        [field]: updatedVal,
      },
    };
  });
}

/**
 * Bulk add prefix or suffix to Titles
 */
export function bulkSetTitlePrefixSuffix(
  files: StockFile[],
  prefix = '',
  suffix = ''
): StockFile[] {
  const cleanPrefix = prefix.trim() ? `${prefix.trim()} ` : '';
  const cleanSuffix = suffix.trim() ? ` ${suffix.trim()}` : '';

  if (!cleanPrefix && !cleanSuffix) return files;

  return files.map((file) => {
    const currentTitle = file.metadata.title || '';
    const updatedTitle = `${cleanPrefix}${currentTitle}${cleanSuffix}`.trim();

    return {
      ...file,
      metadata: {
        ...file.metadata,
        title: updatedTitle,
      },
    };
  });
}

/**
 * Bulk set categories across stock files
 */
export function bulkSetCategories(
  files: StockFile[],
  categories: BulkCategoryOptions
): StockFile[] {
  return files.map((file) => ({
    ...file,
    metadata: {
      ...file.metadata,
      ...(categories.primaryCategory ? { primaryCategory: categories.primaryCategory } : {}),
      ...(categories.secondaryCategory ? { secondaryCategory: categories.secondaryCategory } : {}),
      ...(categories.adobeCategoryId !== undefined ? { adobeCategoryId: categories.adobeCategoryId } : {}),
    },
  }));
}

/**
 * Bulk set compliance flags (editorial, releases, AI generated)
 */
export function bulkSetFlags(
  files: StockFile[],
  flags: BulkFlagOptions
): StockFile[] {
  return files.map((file) => ({
    ...file,
    metadata: {
      ...file.metadata,
      ...(flags.editorial !== undefined ? { editorial: flags.editorial } : {}),
      ...(flags.releasesRequired !== undefined ? { releasesRequired: flags.releasesRequired } : {}),
      ...(flags.matureContent !== undefined ? { matureContent: flags.matureContent } : {}),
    },
  }));
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
