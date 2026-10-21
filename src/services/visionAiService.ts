import { CanonicalAssetAnalysis, SEOConfig, StockFile, StockMetadata } from '../types/stock';
import { FORMAT_SPECIFIC_TAGS, sanitizeKeywords } from '../utils/negativeKeywords';
import { cleanBaseName, sanitizeInput, generateSeoFilename } from '../utils/epsNativeProcessor';
import {
  buildHighRankingTitle,
  generateNicheKeywords,
  sanitizeAndBalanceKeywords,
  validateKeywords,
  deduplicateTitleWords,
  cleanSubjectForDescription,
} from '../utils/semanticKeywordExpander';
import { canonicalAssetService } from './canonicalAssetService';
import { evaluateComplianceRisks } from './complianceRiskService';
import { fileRegistry } from './fileRegistry';

/**
 * Queue Controller allowing users to Pause, Resume, or Cancel batch vision processing
 */
export class QueueController {
  private _isPaused = false;
  private _isCancelled = false;
  private _listeners: Array<() => void> = [];

  get isPaused(): boolean {
    return this._isPaused;
  }

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  pause(): void {
    this._isPaused = true;
  }

  resume(): void {
    this._isPaused = false;
    const callbacks = [...this._listeners];
    this._listeners = [];
    callbacks.forEach((cb) => cb());
  }

  cancel(): void {
    this._isCancelled = true;
    this.resume();
  }

  async waitIfPaused(): Promise<void> {
    if (!this._isPaused) return;
    await new Promise<void>((resolve) => {
      this._listeners.push(resolve);
    });
  }
}

export interface BatchAnalysisOptions {
  files: StockFile[];
  seoOptions: SEOConfig;
  apiKey?: string;
  apiKeys?: string;
  allProvidersKeys?: Record<string, string>;
  provider?: string;
  concurrency?: number; // Worker pool (default = 3)
  controller?: QueueController;
  delayBetweenRequestsMs?: number; // Pacing delay between requests (default = 350ms)
  onProgress?: (
    completed: number,
    total: number,
    currentFile?: StockFile,
    estimatedSecondsRemaining?: number
  ) => void;
  onFileStarted?: (file: StockFile) => void;
  onFileCompleted?: (file: StockFile) => void;
  onFileFailed?: (file: StockFile, error: string) => void;
}

/**
 * Generates high-converting, compliant microstock metadata using high-ranking title formula
 * and 70% subject/niche specific keywords (never 95% generic style fillers)
 */
export function createFallbackMetadata(file: StockFile, seoOptions: SEOConfig): StockMetadata {
  const sanitized = sanitizeInput(file.name);
  const cleanSubject = cleanSubjectForDescription(cleanBaseName(file.name));
  const extractedTerms = file.extractedEpsText || [];
  const hasLiveStroke = file.hasLiveStroke !== false;

  // Formula: [Core Niche/Subject] + [Visual Style/Asset Type] + [Primary Commercial Context/Value]
  const title = buildHighRankingTitle(sanitized.cleanPromptText, file.format, extractedTerms, hasLiveStroke);
  const seoFilename = generateSeoFilename(title, file.name);

  // Strictly 40 to 45 keywords: validated, stroke-aware, zero inversions, zero prefixing
  const rawKeywords = generateNicheKeywords(sanitized.cleanPromptText, file.format, extractedTerms, hasLiveStroke);
  const keywords = validateKeywords(rawKeywords, {
    minCount: 35,
    maxCount: 45,
    targetCount: 45,
    hasLiveStroke,
  });

  // Clean natural description (120-180 characters)
  const stylePhrase = hasLiveStroke ? 'editable stroke' : 'crisp outlines';
  const description = `Vector illustration set featuring ${cleanSubject || 'design elements'} line icons with ${stylePhrase}. Designed for commercial branding, user interfaces, mobile applications, and web graphics.`.slice(0, 180);

  return {
    title,
    description,
    keywords,
    primaryCategory:
      file.format === 'eps' || file.format === 'svg' || file.format === 'ai'
        ? 'Graphic Resources & Vectors'
        : file.format === 'mp4' || file.format === 'mov'
        ? 'Video & Motion Graphics'
        : 'Nature & Landscapes',
    secondaryCategory: 'Abstract & Backgrounds',
    adobeCategoryId: file.format === 'eps' || file.format === 'svg' || file.format === 'ai' ? 8 : 11,
    editorial: false,
    matureContent: false,
    releasesRequired: false,
    seoFilename,
    extractedEpsText: file.extractedEpsText,
    hasLiveStroke,
    isExpandedFill: !hasLiveStroke,
    detectedFonts: file.detectedFonts,
    fontWarning: file.fontWarning,
    promptUsed: file.name,
    modelUsed: 'Smart Niche Semantic Engine (Fallback)',
  };
}

/**
 * Concurrency worker queue with exponential backoff, rate-limit handling, and Pause/Resume/Cancel support
 */
export async function runBatchVisionAnalysis(options: BatchAnalysisOptions): Promise<StockFile[]> {
  const {
    files,
    seoOptions,
    apiKey,
    concurrency = 3,
    controller,
    delayBetweenRequestsMs = 350,
    onProgress,
    onFileStarted,
    onFileCompleted,
    onFileFailed,
  } = options;

  const total = files.length;
  let completedCount = 0;
  const startTime = Date.now();
  const results: StockFile[] = [...files];

  async function processFile(file: StockFile): Promise<StockFile> {
    // Step 1: Ensure visual thumbnail/preview exists and is an image (not raw video)
    let previewToUse = file.thumbnailBase64 || file.previewUrl;
    const isRawVideo = previewToUse && previewToUse.startsWith('data:video/');

    // For EPS / vector files, first check if a companion .jpg or .png exists in the batch
    if ((file.format === 'eps' || file.format === 'ai') && (!previewToUse || isRawVideo)) {
      const baseNameNoExt = file.name.replace(/\.[^/.]+$/, '').toLowerCase();
      const companion = files.find(f => {
        if (f.id === file.id) return false;
        const otherBase = f.name.replace(/\.[^/.]+$/, '').toLowerCase();
        const otherFmt = (f.format || '').toLowerCase();
        return otherBase === baseNameNoExt && (otherFmt === 'jpg' || otherFmt === 'jpeg' || otherFmt === 'png') && (f.thumbnailBase64 || f.previewUrl);
      });
      if (companion && (companion.thumbnailBase64 || companion.previewUrl)) {
        previewToUse = companion.thumbnailBase64 || companion.previewUrl;
      }
    }

    if (!previewToUse || isRawVideo) {
      try {
        let base64Payload = file.thumbnailBase64 || file.previewUrl || '';
        if (!base64Payload || isRawVideo) {
          const registeredB64 = await fileRegistry.getAsBase64(file.id);
          if (registeredB64) {
            base64Payload = registeredB64;
          }
        }

        if (base64Payload) {
          const abortCtrl = new AbortController();
          const timeoutId = setTimeout(() => abortCtrl.abort(), 12000);

          const extractRes = await fetch('/api/extract-preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: abortCtrl.signal,
            body: JSON.stringify({
              filename: file.name,
              format: file.format,
              base64Data: base64Payload,
            }),
          });
          clearTimeout(timeoutId);

          if (extractRes.ok) {
            const extractData = await extractRes.json();
            if (extractData.previewBase64) {
              previewToUse = extractData.previewBase64;
              file.thumbnailBase64 = previewToUse;
              file.previewUrl = previewToUse;
            }
          }
        }
      } catch (err) {
        console.warn('In-memory preview extraction note:', err);
      }
    }

    const contentHash = file.contentHash || canonicalAssetService.computeAssetHash(file);
    const cachedCanonical = canonicalAssetService.getCachedAnalysis(contentHash);

    if (cachedCanonical) {
      const cachedFile: StockFile = {
        ...file,
        status: 'ready',
        contentHash,
        canonicalAnalysis: cachedCanonical,
        previewUrl: previewToUse || file.previewUrl,
        thumbnailBase64: previewToUse || file.thumbnailBase64,
        metadata: {
          ...file.metadata,
          title: cachedCanonical.masterTitle,
          description: cachedCanonical.masterDescription,
          keywords: cachedCanonical.masterKeywords,
          primaryCategory: cachedCanonical.primarySubject,
          secondaryCategory: cachedCanonical.secondarySubjects?.[0],
          orientation: cachedCanonical.orientation,
          dominantColors: cachedCanonical.dominantColors,
          contentType: cachedCanonical.contentType as any,
          modelUsed: `${seoOptions.selectedModel || 'gemini-2.5-flash'} (cached analysis)`,
        },
      };
      cachedFile.riskReport = evaluateComplianceRisks(cachedFile);
      return cachedFile;
    }

    // Rate-limiting delay: Gemini Free Tier has 15 RPM limit -> enforce 4-second delay between requests
    const isGeminiFree = (seoOptions.aiProvider === 'gemini' || !seoOptions.aiProvider || seoOptions.aiProvider === 'auto');
    const effectiveDelay = delayBetweenRequestsMs !== undefined && delayBetweenRequestsMs !== 350
      ? delayBetweenRequestsMs
      : (isGeminiFree ? 4000 : 500);

    if (effectiveDelay > 0) {
      await new Promise((r) => setTimeout(r, effectiveDelay));
    }

    // Step 2: Call metadata generator API with 60s timeout for vision models and auto-rotation
    try {
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 60000);

      // Ensure base64 is never a raw browser blob URL
      let safeImageBase64 = previewToUse;
      if (safeImageBase64 && safeImageBase64.startsWith('blob:')) {
        try {
          const blob = await fetch(safeImageBase64).then((r) => r.blob());
          safeImageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string) || '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(blob);
          });
        } catch {
          safeImageBase64 = '';
        }
      }

      const authToken = typeof window !== 'undefined' ? localStorage.getItem('stockmeta_auth_token') || '' : '';
      const metaRes = await fetch('/api/generate-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          imageBase64: safeImageBase64,
          multiFramesBase64: file.videoFramesBase64 || [],
          fileName: file.name,
          format: file.format,
          extractedEpsText: file.extractedEpsText || [],
          hasCompanionVector: file.format === 'eps' || file.format === 'svg' || file.format === 'ai',
          hasCompanionVideo: file.format === 'mp4' || file.format === 'mov' || file.format === 'mpg' || file.format === 'avi',
          apiKey: apiKey || Object.values(options.allProvidersKeys || {}).find(k => k && k.trim()) || '',
          apiKeys: options.apiKeys || apiKey || Object.values(options.allProvidersKeys || {}).find(k => k && k.trim()) || '',
          allProvidersKeys: options.allProvidersKeys,
          provider: seoOptions.aiProvider || options.provider || 'gemini',
          model: seoOptions.selectedModel || (seoOptions.aiProvider === 'groq' ? 'openai/gpt-oss-20b' : seoOptions.aiProvider === 'openrouter' ? 'nvidia/nemotron-3.5-super-vl:free' : 'gemini-2.5-flash'),
          seoOptions: {
            targetKeywordsCount: seoOptions.keywordTargetCount,
            negativeKeywordsFilter: seoOptions.negativeKeywordsFilter,
            customNegativeKeywords: seoOptions.customNegativeKeywords,
            autoAppendFormatTags: seoOptions.autoAppendFormatTags,
            orderKeywordsByWeight: seoOptions.orderKeywordsByWeight,
            titleStyle: seoOptions.titleStyle,
            customSystemPrompt: seoOptions.customSystemPrompt,
            userHints: seoOptions.userHints,
            locationDate: seoOptions.locationDate,
            isAiGeneratedBatch: seoOptions.isAiGeneratedBatch,
          },
        }),
      });
      clearTimeout(timeoutId);

      if (!metaRes.ok) {
        let errMessage = `API error HTTP ${metaRes.status}`;
        try {
          const errJson = await metaRes.json();
          if (errJson.error) errMessage = errJson.error;
        } catch {}
        throw new Error(errMessage);
      }

      const meta = await metaRes.json();

      const cleanTitle = deduplicateTitleWords(meta.title || file.metadata.title);
      const balancedKeywords = sanitizeAndBalanceKeywords(
        meta.keywords || file.metadata.keywords,
        cleanBaseName(file.name),
        file.format
      );

      const canonicalAnalysis: CanonicalAssetAnalysis = {
        assetHash: contentHash,
        primarySubject: meta.categories?.[0] || file.metadata.primaryCategory || 'Commercial Stock Asset',
        secondarySubjects: meta.categories?.[1] ? [meta.categories[1]] : [],
        settingAndBackground: 'Natural / Studio Environment',
        moodAndConcept: cleanTitle || file.name,
        compositionAndLighting: 'Professional Studio Lighting',
        dominantColors: meta.dominantColors || ['Blue', 'Neutral'],
        orientation: meta.orientation || 'horizontal',
        contentType: meta.contentType || (file.format === 'svg' || file.format === 'eps' ? 'vector' : 'photo'),
        peopleCount: meta.containsPeople ? 1 : 0,
        visibleTextOrLabels: [],
        masterTitle: cleanTitle,
        masterDescription: meta.description || file.metadata.description,
        masterKeywords: balancedKeywords,
        timestamp: Date.now(),
      };

      // Save to canonical cache
      canonicalAssetService.setCachedAnalysis(contentHash, canonicalAnalysis);

      const finalSeoFilename = meta.seo_filename || generateSeoFilename(cleanTitle, file.name);

      const readyFile: StockFile = {
        ...file,
        status: 'ready',
        contentHash,
        canonicalAnalysis,
        seoFilename: finalSeoFilename,
        extractedEpsText: file.extractedEpsText,
        hasLiveStroke: typeof meta.hasLiveStroke === 'boolean' ? meta.hasLiveStroke : file.hasLiveStroke,
        isExpandedFill: typeof meta.isExpandedFill === 'boolean' ? meta.isExpandedFill : file.isExpandedFill,
        detectedFonts: meta.detectedFonts || file.detectedFonts,
        fontWarning: meta.fontWarning || file.fontWarning,
        previewUrl: previewToUse || file.previewUrl,
        thumbnailBase64: previewToUse || file.thumbnailBase64,
        metadata: {
          title: cleanTitle,
          description: meta.description || file.metadata.description,
          keywords: balancedKeywords,
          primaryCategory: meta.categories?.[0] || file.metadata.primaryCategory,
          secondaryCategory: meta.categories?.[1] || file.metadata.secondaryCategory,
          adobeCategoryId: meta.adobeCategoryId || file.metadata.adobeCategoryId,
          editorial: meta.isEditorialSuspected || file.metadata.editorial,
          matureContent: file.metadata.matureContent,
          releasesRequired: meta.containsPeople || meta.containsRecognizableProperty || file.metadata.releasesRequired,
          containsPeople: meta.containsPeople,
          containsBrandOrLogo: meta.containsBrandOrLogo,
          containsRecognizableProperty: meta.containsRecognizableProperty,
          isEditorialSuspected: meta.isEditorialSuspected,
          orientation: meta.orientation,
          dominantColors: meta.dominantColors,
          contentType: meta.contentType,
          confidence: meta.confidence,
          seoFilename: finalSeoFilename,
          extractedEpsText: file.extractedEpsText,
          hasLiveStroke: typeof meta.hasLiveStroke === 'boolean' ? meta.hasLiveStroke : file.hasLiveStroke,
          isExpandedFill: typeof meta.isExpandedFill === 'boolean' ? meta.isExpandedFill : file.isExpandedFill,
          detectedFonts: meta.detectedFonts || file.detectedFonts,
          fontWarning: meta.fontWarning || file.fontWarning,
          promptUsed: file.name,
          modelUsed: meta.modelUsed || seoOptions.selectedModel || 'gemini-2.5-flash',
        },
      };

      readyFile.riskReport = evaluateComplianceRisks(readyFile);
      return readyFile;
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('abort'));
      let friendlyError = isTimeout
        ? 'Request timed out after 60 seconds (slow network or provider load)'
        : (err.message || 'API request failed');

      if (friendlyError === 'Failed to fetch' || friendlyError.includes('Failed to fetch')) {
        friendlyError = 'Could not reach local server at http://localhost:3000. Ensure the launcher console is running.';
      }

      console.error(`[Vision AI Error for ${file.name}]:`, friendlyError);
      onFileFailed?.(file, friendlyError);

      // Guarantee completion with smart niche semantic fallback so batch never hangs
      const fallbackMeta = createFallbackMetadata(file, seoOptions);
      fallbackMeta.modelUsed = `Smart Niche Semantic Engine (API notice: ${friendlyError})`;

      const fallbackFile: StockFile = {
        ...file,
        status: 'ready',
        contentHash,
        errorMessage: friendlyError,
        seoFilename: fallbackMeta.seoFilename,
        extractedEpsText: file.extractedEpsText,
        hasLiveStroke: fallbackMeta.hasLiveStroke,
        isExpandedFill: fallbackMeta.isExpandedFill,
        detectedFonts: fallbackMeta.detectedFonts,
        fontWarning: fallbackMeta.fontWarning,
        previewUrl: previewToUse || file.previewUrl,
        thumbnailBase64: previewToUse || file.thumbnailBase64,
        metadata: fallbackMeta,
      };
      fallbackFile.riskReport = evaluateComplianceRisks(fallbackFile);
      return fallbackFile;
    }
  }

  // Work queue with controller check
  let currentIndex = 0;
  const workers: Promise<void>[] = [];
  const maxConcurrency = Math.min(concurrency, Math.max(1, files.length));

  for (let i = 0; i < maxConcurrency; i++) {
    workers.push(
      (async () => {
        while (currentIndex < files.length) {
          // Check if queue has been cancelled
          if (controller?.isCancelled) {
            break;
          }

          // Check if queue is paused and wait if needed
          if (controller) {
            await controller.waitIfPaused();
            if (controller.isCancelled) break;
          }

          const fileIndex = currentIndex++;
          const targetFile = files[fileIndex];

          // Non-blocking UI thread yielding so browser can render at 60 FPS
          await new Promise((r) => setTimeout(r, 20));

          onFileStarted?.(targetFile);

          try {
            const updated = await processFile(targetFile);
            results[fileIndex] = updated;
            completedCount++;

            const elapsedMs = Date.now() - startTime;
            const avgMsPerFile = elapsedMs / Math.max(1, completedCount);
            const remaining = total - completedCount;
            const estimatedSecondsRemaining = Math.max(0, Math.round((remaining * avgMsPerFile) / 1000));

            onFileCompleted?.(updated);
            onProgress?.(completedCount, total, updated, estimatedSecondsRemaining);
          } catch (err: any) {
            const fallbackMeta = createFallbackMetadata(targetFile, seoOptions);
            const resolvedFile: StockFile = {
              ...targetFile,
              status: 'error',
              errorMessage: err.message || 'Processing failed',
              metadata: fallbackMeta,
            };
            results[fileIndex] = resolvedFile;
            completedCount++;

            const elapsedMs = Date.now() - startTime;
            const avgMsPerFile = elapsedMs / Math.max(1, completedCount);
            const remaining = total - completedCount;
            const estimatedSecondsRemaining = Math.max(0, Math.round((remaining * avgMsPerFile) / 1000));

            onFileFailed?.(resolvedFile, err.message || 'Processing error');
            onProgress?.(completedCount, total, resolvedFile, estimatedSecondsRemaining);
          }
        }
      })()
    );
  }

  await Promise.all(workers);
  return results;
}
