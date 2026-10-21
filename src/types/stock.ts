export type FileFormat = 'jpg' | 'jpeg' | 'png' | 'svg' | 'eps' | 'ai' | 'mp4' | 'mov' | 'mpg' | 'avi';

export interface StockMetadata {
  title: string;
  description: string;
  keywords: string[];
  primaryCategory: string;
  secondaryCategory?: string;
  adobeCategoryId?: number;
  editorial: boolean;
  matureContent: boolean;
  releasesRequired: boolean;
  promptUsed?: string;
  modelUsed?: string;
  // Gemini Vision Structured Attributes
  containsPeople?: boolean;
  containsBrandOrLogo?: boolean;
  containsRecognizableProperty?: boolean;
  isEditorialSuspected?: boolean;
  orientation?: 'horizontal' | 'vertical' | 'square';
  dominantColors?: string[];
  contentType?: 'photo' | 'vector' | 'illustration' | 'video' | '3d_render';
  confidence?: number;
  seoFilename?: string;
  extractedEpsText?: string[];
  hasLiveStroke?: boolean;
  isExpandedFill?: boolean;
  detectedFonts?: string[];
  fontWarning?: string;
}

export interface VideoTechnicalSpecs {
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  hasAudio?: boolean;
  audioCodec?: string;
}

export interface TechnicalPreflightIssue {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  suggestedAction?: string;
}

// ------------------ FEATURE 1: AI & IP RISK CHECKER ------------------
export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type RiskCategory =
  | 'brand_trademark'
  | 'copyright_artwork'
  | 'recognizable_person'
  | 'property_architecture'
  | 'stock_watermark'
  | 'sensitive_content'
  | 'metadata_mismatch'
  | 'editorial_suitability';

export type FactVsUncertainty =
  | 'detected_fact'
  | 'potential_risk'
  | 'uncertain_observation'
  | 'confirmed_rule'
  | 'human_review_required';

export type RemediationAction =
  | 'remove_terms'
  | 'mark_editorial'
  | 'flag_release_required'
  | 'ai_disclosure'
  | 'manual_review';

export interface ComplianceRiskItem {
  id: string;
  severity: RiskLevel;
  category: RiskCategory;
  title: string;
  detail: string;
  detectedTerms?: string[];
  confidence: number;
  isFactVsUncertainty: FactVsUncertainty;
  remediationAction?: RemediationAction;
  dismissed?: boolean;
}

export interface AssetRiskReport {
  overallRisk: 'pass' | 'caution' | 'high_risk';
  summary: string;
  items: ComplianceRiskItem[];
  legalDisclaimer: string;
  timestamp: number;
}

// ------------------ FEATURE 2: TWO-STAGE CANONICAL METADATA ------------------
export interface CanonicalAssetAnalysis {
  assetHash: string; // SHA-256
  primarySubject: string;
  secondarySubjects: string[];
  settingAndBackground: string;
  moodAndConcept: string;
  compositionAndLighting: string;
  dominantColors: string[];
  orientation: 'horizontal' | 'vertical' | 'square';
  contentType: 'photo' | 'vector' | 'illustration' | 'video' | '3d_render';
  peopleCount: number;
  ageGroup?: string;
  visibleTextOrLabels: string[];
  masterTitle: string;
  masterDescription: string;
  masterKeywords: string[]; // 40-60 terms ordered by weight
  timestamp: number;
}

export interface AdaptedMarketplaceMetadata {
  marketplaceId: string;
  marketplaceName: string;
  title: string;
  description: string;
  keywords: string[];
  formattedKeywords: string;
  delimiter: ',' | ';';
  category?: string;
  aiDisclosureApplied: boolean;
  status: 'passed' | 'warning' | 'error';
  issues: string[];
}

// ------------------ FEATURE 3: EMBEDDING VERIFICATION REPORT ------------------
export interface TagDifference {
  tagName: string; // e.g. "XMP-dc:Title", "IPTC:ObjectName"
  intendedValue: string | string[];
  embeddedValue: string | string[];
  match: boolean;
  notes?: string;
}

export interface VerificationReport {
  fileId: string;
  fileName: string;
  destinationPath: string;
  overallStatus: 'verified' | 'partially_verified' | 'failed' | 'sidecar_only';
  matchPercentage: number;
  tagsChecked: TagDifference[];
  sidecarGenerated?: boolean;
  sidecarPath?: string;
  timestamp: number;
}

// ------------------ FEATURE 4: SUBMISSION & PERFORMANCE TRACKING ------------------
export type SubmissionStatus = 'prepared' | 'submitted' | 'accepted' | 'rejected' | 'withdrawn';

export type RejectionReasonCategory =
  | 'technical_quality'
  | 'trademark_ip'
  | 'missing_release'
  | 'metadata_inaccuracy'
  | 'duplicate_similar'
  | 'editorial_noncompliance'
  | 'other';

export interface MarketplaceSubmissionRecord {
  id: string;
  assetId: string;
  assetName: string;
  marketplaceId: string;
  marketplaceName: string;
  status: SubmissionStatus;
  submissionDate?: string;
  decisionDate?: string;
  rejectionCategory?: RejectionReasonCategory;
  rejectionNotes?: string;
  earningsUsd?: number;
  downloadsCount?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContributorStats {
  totalPrepared: number;
  totalSubmitted: number;
  totalAccepted: number;
  totalRejected: number;
  acceptanceRate: number; // percentage
  totalEarningsUsd: number;
  totalDownloads: number;
}

export interface StockFile {
  id: string;
  name: string;
  size: number;
  format: FileFormat;
  baseName: string;
  folderName?: string; // Grouping folder name when uploaded folder-wise
  relativePath?: string; // e.g. "Charcuterie_Icons/icon1.eps"
  lastModified: number;
  contentHash?: string;
  previewUrl: string;
  thumbnailBase64?: string;
  compositeFramesBase64?: string;
  videoFramesBase64?: string[]; // 6-8 multi-frame extraction for video
  videoSpecs?: VideoTechnicalSpecs;
  dimensions?: { width: number; height: number };
  duration?: number;
  perceptualHash?: string;
  isNearDuplicate?: boolean;
  duplicateOfName?: string;
  seoFilename?: string;
  extractedEpsText?: string[];
  hasLiveStroke?: boolean;
  isExpandedFill?: boolean;
  detectedFonts?: string[];
  fontWarning?: string;
  status: 'idle' | 'queued' | 'extracting' | 'analyzing' | 'embedding' | 'ready' | 'embedded' | 'error';
  errorMessage?: string;
  metadata: StockMetadata;
  preflightIssues?: TechnicalPreflightIssue[];
  riskReport?: AssetRiskReport;
  canonicalAnalysis?: CanonicalAssetAnalysis;
  verificationReport?: VerificationReport;
  validationWarnings?: Array<{
    marketplaceId: string;
    marketplaceName: string;
    field: string;
    message: string;
    severity: 'warning' | 'error';
  }>;
  embeddedInfo?: {
    timestamp: number;
    destinationPath?: string;
    fieldsWritten: string[];
    companionSynced?: string;
    verified?: boolean;
    verificationDetails?: Record<string, any>;
  };
}

export interface MarketplaceConfig {
  id: string;
  name: string;
  tier: 1 | 2;
  category: string;
  icon?: string;
  lastVerified?: string;
  delimiter: ',' | ';';
  fileExtensions: string[];
  acceptedFormats?: string[];
  titleLimits: { minChars: number; maxChars: number; targetMin?: number; targetMax?: number; minWords?: number };
  descriptionLimits: { minChars: number; maxChars: number; minWords?: number };
  keywordLimits: { minCount: number; maxCount: number; recommendedMin?: number; recommendedMax?: number };
  csvHeaders: string[];
  aiDisclosure?: {
    required: boolean;
    instructions: string;
  };
  rowMapper: (file: StockFile) => Record<string, string | number>;
  specialNotes?: string;
}

export type AIProvider = 'gemini' | 'grok' | 'groq' | 'openrouter' | 'auto';

export interface SEOConfig {
  orderKeywordsByWeight: boolean; // First 10 tags weighted for Adobe Stock
  autoAppendFormatTags: boolean; // e.g. "vector, illustration" for svg/eps or "4k, loop" for video
  negativeKeywordsFilter: boolean; // strip trademarked & forbidden words
  customNegativeKeywords: string[];
  keywordTargetCount: number; // 5 - 50
  titleStyle: 'commercial' | 'descriptive' | 'editorial';
  temperature: number;
  selectedModel: string;
  aiProvider: AIProvider;
  customSystemPrompt?: string;
  userHints?: string; // Optional user hints (e.g., "series about remote work")
  locationDate?: string; // Optional location/date for editorial & Alamy
  isAiGeneratedBatch?: boolean; // Global toggle: batch is AI generated
}

export interface EmbeddingOptions {
  overwriteOriginals: boolean;
  exportFolder: string;
  customOutputFolder?: string;
  syncEpsCompanionJpg: boolean;
  embedExif: boolean;
  embedIptc: boolean;
  embedXmp: boolean;
  embedQuickTime: boolean;
  renameToSeoSlug?: boolean;
  includeSidecarsAndLogs?: boolean;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress?: number;
  currentFileName?: string;
  isPaused?: boolean;
  estimatedSecondsRemaining?: number;
}

// ------------------ USER AUTH & LICENSE MANAGEMENT ------------------
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended' | 'pending' | 'expired';
  expiresAt: string;
  daysLeft: number;
  dailyLimit: number;
  usedToday: number;
  totalUsed: number;
  createdAt: string;
  notes?: string;
}

export interface SystemAuthConfig {
  authRequired: boolean;
  defaultTrialDays: number;
  defaultDailyLimit: number;
  requireAdminApproval: boolean;
}

export interface LicenseKeyItem {
  id: string;
  key: string;
  assignedEmail: string;
  days: number;
  dailyLimit?: number;
  status: 'active' | 'used' | 'revoked';
  createdAt: string;
  usedAt?: string;
  usedByUserId?: string;
  usedByUsername?: string;
  notes?: string;
}
