import { MarketplaceConfig, StockFile } from '../types/stock';
import rawConfig from '../../platforms.config.json';
import { validateKeywords } from '../utils/semanticKeywordExpander';

/**
 * Standard Adobe Stock Category ID Mapping (1 to 21)
 */
export const ADOBE_CATEGORIES: Record<number, string> = {
  1: 'Animals',
  2: 'Buildings and Architecture',
  3: 'Business',
  4: 'Drinks',
  5: 'Environment',
  6: 'States of Mind',
  7: 'Food',
  8: 'Graphic Resources',
  9: 'Hobbies and Leisure',
  10: 'Industry',
  11: 'Landscapes',
  12: 'Lifestyle',
  13: 'People',
  14: 'Plants and Flowers',
  15: 'Culture and Religion',
  16: 'Science',
  17: 'Social Issues',
  18: 'Sports',
  19: 'Technology',
  20: 'Transport',
  21: 'Travel',
};

/**
 * Default Category list for general UI selection
 */
export const GENERAL_CATEGORIES = [
  'Abstract & Backgrounds',
  'Animals & Wildlife',
  'Architecture & Buildings',
  'Business & Finance',
  'Education & Learning',
  'Food & Drink',
  'Graphic Resources & Vectors',
  'Health & Medical',
  'Holidays & Celebrations',
  'Illustrations & Icons',
  'Industrial & Infrastructure',
  'Nature & Landscapes',
  'People & Lifestyle',
  'Science & Technology',
  'Sports & Fitness',
  'Transportation & Automotive',
  'Travel & Destinations',
  'Video & Motion Graphics',
];

/**
 * Clean and truncate string helper
 */
export function cleanText(str: string, maxLength?: number): string {
  if (!str) return '';
  const cleaned = str.replace(/[\r\n\t]+/g, ' ').trim();
  if (maxLength && cleaned.length > maxLength) {
    return cleaned.slice(0, maxLength).trim();
  }
  return cleaned;
}

/**
 * Format keywords array with validation and max count limit
 */
export function formatKeywords(keywords: string[], maxCount: number, delimiter: string = ', '): string {
  const validated = validateKeywords(keywords || [], { maxCount });
  const slice = validated.slice(0, maxCount);
  return slice.map((k) => k.trim()).filter(Boolean).join(delimiter);
}

// Custom row mapper functions per platform
const ROW_MAPPERS: Record<string, (file: StockFile, config: MarketplaceConfig) => Record<string, string | number>> = {
  adobe_stock: (file, config) => ({
    Filename: file.name,
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    Category: file.metadata.adobeCategoryId || 8,
    Releases: (file.metadata.containsPeople || file.metadata.containsRecognizableProperty || file.metadata.releasesRequired) ? 'Yes' : '',
  }),

  shutterstock: (file, config) => {
    const isVector = file.format === 'svg' || file.format === 'eps' || file.format === 'ai';
    const categories = [file.metadata.primaryCategory, file.metadata.secondaryCategory]
      .filter(Boolean)
      .join(', ');
    return {
      Filename: file.name,
      Description: cleanText(file.metadata.description || file.metadata.title, config.descriptionLimits.maxChars || 200),
      Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
      Categories: categories || 'Abstract, Backgrounds/Textures',
      Editorial: file.metadata.editorial || file.metadata.isEditorialSuspected ? 'yes' : 'no',
      'Mature content': file.metadata.matureContent ? 'yes' : 'no',
      Illustration: isVector ? 'yes' : 'no',
    };
  },

  freepik: (file, config) => ({
    'File name': file.name,
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    Prompt: file.metadata.promptUsed || (file.metadata.modelUsed ? `Generated with ${file.metadata.modelUsed}` : ''),
    Model: file.metadata.modelUsed || '',
  }),

  vecteezy: (file, config) => ({
    Filename: file.name,
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Description: cleanText(file.metadata.description, config.descriptionLimits.maxChars || 400),
    Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    License: 'Standard',
  }),

  getty_istock: (file, config) => ({
    'file name': file.name,
    'created date': new Date(file.lastModified || Date.now()).toISOString().split('T')[0],
    description: cleanText(file.metadata.description, config.descriptionLimits.maxChars || 500),
    country: 'Global',
    'brief code': '',
    title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
  }),

  pond5: (file, config) => ({
    OriginalFilename: file.name,
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Description: cleanText(file.metadata.description, config.descriptionLimits.maxChars || 500),
    Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    Copyright: 'Standard Contributor',
    Price: '',
  }),

  alamy: (file, config) => {
    const allKeywords = file.metadata.keywords || [];
    const essential = allKeywords.slice(0, 10).join(', ');
    const additional = allKeywords.slice(10, config.keywordLimits.maxCount).join(', ');
    return {
      'File Name': file.name,
      'Caption / Title': cleanText(file.metadata.title, config.titleLimits.maxChars),
      'Essential Keywords': essential,
      'Additional Keywords': additional,
      Licensing: file.metadata.editorial || file.metadata.isEditorialSuspected ? 'Editorial' : 'Royalty Free',
    };
  },

  depositphotos: (file, config) => ({
    'File name': file.name,
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Description: cleanText(file.metadata.description, config.descriptionLimits.maxChars || 250),
    Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    Categories: file.metadata.primaryCategory || 'General',
  }),

  '123rf': (file, config) => ({
    Filename: file.name,
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    Categories: file.metadata.primaryCategory || 'Graphic & Vector',
  }),

  dreamstime: (file, config) => ({
    Filename: file.name,
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Description: cleanText(file.metadata.description, config.descriptionLimits.maxChars || 300),
    'Category 1': file.metadata.primaryCategory || 'Illustrations',
    'Category 2': file.metadata.secondaryCategory || 'Design',
    'Category 3': 'Backgrounds',
    Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
  }),

  motion_array: (file, config) => ({
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Description: cleanText(file.metadata.description, config.descriptionLimits.maxChars || 350),
    Tags: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    Category: file.metadata.primaryCategory || 'Motion Graphics',
    'Software / Version': 'Universal MP4/H.264',
  }),

  storyblocks: (file, config) => ({
    Filename: file.name,
    Title: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Description: cleanText(file.metadata.description, config.descriptionLimits.maxChars || 400),
    Keywords: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    'Asset Type': file.format === 'mp4' || file.format === 'mov' || file.format === 'mpg' || file.format === 'avi' ? 'Video' : 'Image',
  }),

  envato: (file, config) => ({
    'File Name': file.name,
    Name: cleanText(file.metadata.title, config.titleLimits.maxChars),
    Description: cleanText(file.metadata.description, config.descriptionLimits.maxChars || 500),
    Tags: formatKeywords(file.metadata.keywords, config.keywordLimits.maxCount, ','),
    Category: file.metadata.primaryCategory || 'Graphic Templates',
    'Files Included': file.name,
  }),
};

/**
 * Build dynamic MARKETPLACES object from platforms.config.json or local overrides
 */
export function buildMarketplaces(customPlatformsJson?: Record<string, any>): Record<string, MarketplaceConfig> {
  const source = customPlatformsJson || (rawConfig as any).platforms;
  const result: Record<string, MarketplaceConfig> = {};

  for (const [key, p] of Object.entries(source) as [string, any][]) {
    const mapper = ROW_MAPPERS[key] || ((file: StockFile, conf: MarketplaceConfig) => ({
      Filename: file.name,
      Title: cleanText(file.metadata.title, conf.titleLimits?.maxChars || 200),
      Keywords: formatKeywords(file.metadata.keywords, conf.keywordLimits?.maxCount || 50, conf.delimiter || ','),
      Description: cleanText(file.metadata.description, conf.descriptionLimits?.maxChars || 400),
    }));

    result[key] = {
      id: p.id || key,
      name: p.name,
      tier: p.tier || 1,
      category: p.category || 'Microstock',
      lastVerified: p.lastVerified,
      delimiter: p.delimiter || ',',
      fileExtensions: p.acceptedFormats || ['.jpg', '.png'],
      acceptedFormats: p.acceptedFormats || ['.jpg', '.png'],
      titleLimits: p.titleLimits || { minChars: 10, maxChars: 200 },
      descriptionLimits: p.descriptionLimits || { minChars: 20, maxChars: 400 },
      keywordLimits: p.keywordLimits || { minCount: 5, maxCount: 50 },
      csvHeaders: p.csvHeaders || ['Filename', 'Title', 'Keywords', 'Description'],
      aiDisclosure: p.aiDisclosure,
      specialNotes: p.specialNotes,
      rowMapper: (file: StockFile) => mapper(file, result[key]),
    };
  }

  return result;
}

export const MARKETPLACES: Record<string, MarketplaceConfig> = buildMarketplaces();

export const ALL_MARKETPLACE_IDS = Object.keys(MARKETPLACES);
export const TIER_1_MARKETPLACE_IDS = Object.values(MARKETPLACES)
  .filter((m) => m.tier === 1)
  .map((m) => m.id);
export const TIER_2_MARKETPLACE_IDS = Object.values(MARKETPLACES)
  .filter((m) => m.tier === 2)
  .map((m) => m.id);
