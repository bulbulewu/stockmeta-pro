import { MARKETPLACES } from '../config/marketplaces';
import { StockFile, StockMetadata } from '../types/stock';
import { DEFAULT_BANNED_TRADEMARKS } from '../utils/negativeKeywords';

export interface ValidationIssue {
  id: string;
  marketplaceId: string;
  marketplaceName: string;
  field: 'title' | 'description' | 'keywords' | 'releases' | 'ai_disclosure';
  severity: 'error' | 'warning';
  message: string;
  currentValue: any;
  targetLimit: string | number;
  fixDescription: string;
}

export interface FileValidationReport {
  fileId: string;
  fileName: string;
  badgeStatus: 'passed' | 'warning' | 'error';
  hasErrors: boolean;
  hasWarnings: boolean;
  issues: ValidationIssue[];
  passedMarketplacesCount: number;
  totalMarketplacesCount: number;
  releasesNeeded: boolean;
  editorialSuspected: boolean;
}

/**
 * Validates a file's metadata against selected (or all) marketplace rules
 */
export function validateFileMetadata(
  file: StockFile,
  targetMarketplaceIds: string[],
  activeBannedList: string[] = DEFAULT_BANNED_TRADEMARKS
): FileValidationReport {
  const issues: ValidationIssue[] = [];
  const meta = file.metadata;
  const activeIds = targetMarketplaceIds.filter((id) => MARKETPLACES[id]);
  let passedCount = 0;

  const releasesNeeded = Boolean(
    meta.containsPeople || meta.containsRecognizableProperty || meta.releasesRequired
  );
  const editorialSuspected = Boolean(
    meta.isEditorialSuspected || meta.editorial
  );

  for (const mId of activeIds) {
    const config = MARKETPLACES[mId];
    let marketplaceHasIssue = false;

    // 1. Title Checks
    const title = meta.title || '';
    const titleLen = title.length;
    const titleWords = title.trim().split(/\s+/).filter(Boolean).length;

    if (config.titleLimits.maxChars && titleLen > config.titleLimits.maxChars) {
      marketplaceHasIssue = true;
      issues.push({
        id: `${mId}-title-max`,
        marketplaceId: mId,
        marketplaceName: config.name,
        field: 'title',
        severity: 'error',
        message: `Title is ${titleLen} chars (Max ${config.titleLimits.maxChars} for ${config.name})`,
        currentValue: titleLen,
        targetLimit: config.titleLimits.maxChars,
        fixDescription: `Truncate title to ${config.titleLimits.maxChars} chars cleanly at word boundary`,
      });
    }

    if (config.titleLimits.minWords && titleWords < config.titleLimits.minWords) {
      marketplaceHasIssue = true;
      issues.push({
        id: `${mId}-title-minwords`,
        marketplaceId: mId,
        marketplaceName: config.name,
        field: 'title',
        severity: 'warning',
        message: `Title has ${titleWords} words (Requires at least ${config.titleLimits.minWords} words)`,
        currentValue: titleWords,
        targetLimit: config.titleLimits.minWords,
        fixDescription: `Expand title with visual descriptive keywords`,
      });
    }

    // Special title characters check
    if (/[#@$%^*_+=\[\]{}|<>]/.test(title)) {
      marketplaceHasIssue = true;
      issues.push({
        id: `${mId}-title-symbols`,
        marketplaceId: mId,
        marketplaceName: config.name,
        field: 'title',
        severity: 'warning',
        message: `Title contains special characters disallowed by stock marketplaces`,
        currentValue: title,
        targetLimit: 'Plain text only',
        fixDescription: `Remove special symbols (#, @, $, %, etc.)`,
      });
    }

    // 2. Keywords Checks
    const keywords = meta.keywords || [];
    const kwCount = keywords.length;

    if (config.keywordLimits.maxCount && kwCount > config.keywordLimits.maxCount) {
      marketplaceHasIssue = true;
      issues.push({
        id: `${mId}-keywords-max`,
        marketplaceId: mId,
        marketplaceName: config.name,
        field: 'keywords',
        severity: 'error',
        message: `${kwCount} keywords exceeds ${config.name}'s maximum limit of ${config.keywordLimits.maxCount}`,
        currentValue: kwCount,
        targetLimit: config.keywordLimits.maxCount,
        fixDescription: `Slice keywords to top ${config.keywordLimits.maxCount} ranked tags`,
      });
    }

    if (config.keywordLimits.minCount && kwCount < config.keywordLimits.minCount) {
      marketplaceHasIssue = true;
      issues.push({
        id: `${mId}-keywords-min`,
        marketplaceId: mId,
        marketplaceName: config.name,
        field: 'keywords',
        severity: 'warning',
        message: `${kwCount} keywords is below ${config.name}'s minimum requirement of ${config.keywordLimits.minCount}`,
        currentValue: kwCount,
        targetLimit: config.keywordLimits.minCount,
        fixDescription: `Add high-relevance format and visual tags`,
      });
    }

    // Check for banned trademarks / buzzwords in keywords
    const bannedFound = keywords.filter((k) =>
      activeBannedList.includes(k.toLowerCase())
    );
    if (bannedFound.length > 0) {
      marketplaceHasIssue = true;
      issues.push({
        id: `${mId}-keywords-banned`,
        marketplaceId: mId,
        marketplaceName: config.name,
        field: 'keywords',
        severity: 'error',
        message: `Contains prohibited/trademarked words: ${bannedFound.join(', ')}`,
        currentValue: bannedFound,
        targetLimit: '0 banned words',
        fixDescription: `Strip all detected trademark words from tags`,
      });
    }

    // 3. Description Checks
    const desc = meta.description || '';
    if (config.descriptionLimits?.maxChars && desc.length > config.descriptionLimits.maxChars) {
      marketplaceHasIssue = true;
      issues.push({
        id: `${mId}-desc-max`,
        marketplaceId: mId,
        marketplaceName: config.name,
        field: 'description',
        severity: 'warning',
        message: `Description is ${desc.length} chars (Limit is ${config.descriptionLimits.maxChars} on ${config.name})`,
        currentValue: desc.length,
        targetLimit: config.descriptionLimits.maxChars,
        fixDescription: `Truncate description cleanly to ${config.descriptionLimits.maxChars} chars`,
      });
    }

    // 4. Release / Property checks
    if (releasesNeeded && !editorialSuspected) {
      issues.push({
        id: `${mId}-release-needed`,
        marketplaceId: mId,
        marketplaceName: config.name,
        field: 'releases',
        severity: 'warning',
        message: `Recognizable people or property detected. Model/property release required, or submit as Editorial.`,
        currentValue: 'Release missing',
        targetLimit: 'Release or Editorial',
        fixDescription: `Mark as Editorial or attach signed Model/Property release`,
      });
    }

    if (!marketplaceHasIssue) {
      passedCount++;
    }
  }

  // Deduplicate identical issues across marketplaces for cleaner UI
  const uniqueIssues = deduplicateIssues(issues);
  const hasErrors = uniqueIssues.some((i) => i.severity === 'error');
  const hasWarnings = uniqueIssues.some((i) => i.severity === 'warning');

  let badgeStatus: 'passed' | 'warning' | 'error' = 'passed';
  if (hasErrors) badgeStatus = 'error';
  else if (hasWarnings) badgeStatus = 'warning';

  return {
    fileId: file.id,
    fileName: file.name,
    badgeStatus,
    hasErrors,
    hasWarnings,
    issues: uniqueIssues,
    passedMarketplacesCount: passedCount,
    totalMarketplacesCount: activeIds.length,
    releasesNeeded,
    editorialSuspected,
  };
}

/**
 * Deduplicate issues across platforms (e.g. title too long on multiple)
 */
function deduplicateIssues(issues: ValidationIssue[]): ValidationIssue[] {
  const map = new Map<string, ValidationIssue>();

  for (const issue of issues) {
    const key = `${issue.field}-${issue.fixDescription}`;
    if (!map.has(key)) {
      map.set(key, issue);
    } else {
      const existing = map.get(key)!;
      if (!existing.marketplaceName.includes(issue.marketplaceName)) {
        existing.marketplaceName = `${existing.marketplaceName}, ${issue.marketplaceName}`;
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Truncates text cleanly at word boundary before max limit
 */
function truncateCleanly(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const sub = text.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.7) {
    return sub.slice(0, lastSpace).trim();
  }
  return sub.trim();
}

/**
 * Auto-fix a specific validation issue on a file metadata object
 */
export function autoFixIssue(
  metadata: StockMetadata,
  issue: ValidationIssue,
  activeBannedList: string[] = DEFAULT_BANNED_TRADEMARKS
): StockMetadata {
  const updated = { ...metadata };

  if (issue.field === 'title') {
    if (typeof issue.targetLimit === 'number') {
      updated.title = truncateCleanly(updated.title, issue.targetLimit);
    } else {
      // Remove disallowed special characters
      updated.title = updated.title.replace(/[#@$%^*_+=\[\]{}|<>]/g, '').replace(/\s+/g, ' ').trim();
    }
  } else if (issue.field === 'keywords') {
    if (typeof issue.targetLimit === 'number') {
      updated.keywords = updated.keywords.slice(0, issue.targetLimit);
    }
    // Remove banned trademarks
    updated.keywords = updated.keywords.filter(
      (k) => !activeBannedList.includes(k.toLowerCase())
    );
  } else if (issue.field === 'description') {
    if (typeof issue.targetLimit === 'number') {
      updated.description = truncateCleanly(updated.description, issue.targetLimit);
    }
  } else if (issue.field === 'releases') {
    updated.releasesRequired = true;
  }

  return updated;
}

/**
 * Auto-fix ALL compliance issues on a file metadata object
 */
export function autoFixAllIssues(
  metadata: StockMetadata,
  issues: ValidationIssue[],
  activeBannedList: string[] = DEFAULT_BANNED_TRADEMARKS
): StockMetadata {
  let current = { ...metadata };
  for (const issue of issues) {
    current = autoFixIssue(current, issue, activeBannedList);
  }
  return current;
}
