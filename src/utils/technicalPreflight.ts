import { StockFile, TechnicalPreflightIssue } from '../types/stock';

/**
 * Technical Pre-Flight Checks for microstock assets
 * Inspects technical compliance per file format before upload & export.
 */
export function runTechnicalPreflight(file: StockFile, allFilesInBatch: StockFile[] = []): TechnicalPreflightIssue[] {
  const issues: TechnicalPreflightIssue[] = [];
  const fmt = file.format;

  // 1. JPEG Checks
  if (fmt === 'jpg' || fmt === 'jpeg') {
    if (file.dimensions) {
      const megaPixels = (file.dimensions.width * file.dimensions.height) / 1000000;
      if (megaPixels < 4.0) {
        issues.push({
          severity: 'warning',
          code: 'JPEG_LOW_RES',
          message: `Image is ${megaPixels.toFixed(1)} MP. Most major stock agencies require minimum 4.0 MP.`,
          suggestedAction: 'Upscale image or upload higher resolution original',
        });
      }
    }

    if (file.size < 500 * 1024) {
      issues.push({
        severity: 'info',
        code: 'JPEG_SMALL_FILE',
        message: 'File size is under 500 KB. High compression artifacts may cause stock rejection.',
        suggestedAction: 'Save with JPEG quality 90-100% sRGB',
      });
    }
  }

  // 2. PNG Checks
  if (fmt === 'png') {
    issues.push({
      severity: 'info',
      code: 'PNG_PHOTO_CHECK',
      message: 'PNG format detected. If this is a photo without transparency, agencies prefer high-quality JPEG.',
      suggestedAction: 'Ensure transparent background or export as JPG for photos',
    });
  }

  // 3. Vector Checks (AI, EPS, SVG)
  if (fmt === 'eps' || fmt === 'ai' || fmt === 'svg') {
    const fileBase = (file.baseName || file.name || '').toLowerCase().replace(/\.[^/.]+$/, '');
    const hasCompanionJpg = allFilesInBatch.some(
      (f) => {
        const itemBase = (f.baseName || f.name || '').toLowerCase().replace(/\.[^/.]+$/, '');
        return itemBase === fileBase && (f.format === 'jpg' || f.format === 'jpeg');
      }
    );

    if (!hasCompanionJpg && (fmt === 'eps' || fmt === 'ai')) {
      issues.push({
        severity: 'warning',
        code: 'VECTOR_MISSING_JPG',
        message: 'Missing companion .jpg preview with matching filename. Shutterstock and Adobe Stock require companion JPEG.',
        suggestedAction: 'Export and upload a matching .jpg preview alongside the vector file',
      });
    }

    // Live Unoutlined Font Warning (Requirement 4)
    if (file.detectedFonts && file.detectedFonts.length > 0) {
      issues.push({
        severity: 'warning',
        code: 'EPS_LIVE_FONT',
        message: `Warning: Live unoutlined font (${file.detectedFonts.join(', ')}) detected in EPS header. Convert text to outlines in Illustrator to prevent microstock rejection.`,
        suggestedAction: 'Select all text in Illustrator (Ctrl+A) and convert to outlines (Ctrl+Shift+O) before submission.',
      });
    }

    // Expanded vs Editable Stroke Mismatch Check (Requirement 4)
    if (file.isExpandedFill && file.metadata?.title && /editable\s*stroke/i.test(file.metadata.title)) {
      issues.push({
        severity: 'warning',
        code: 'EXPANDED_STROKE_MISMATCH',
        message: 'Expanded vector paths detected without live strokes. "Editable Stroke" should be changed to "Outline" to prevent buyer rejection.',
        suggestedAction: 'Use "Outline" or "Line Art" instead of "Editable Stroke".',
      });
    }

    if (fmt === 'svg') {
      issues.push({
        severity: 'info',
        code: 'SVG_TEXT_OUTLINE',
        message: 'SVG vectors must have all fonts and text converted to outlines/curves before submission.',
        suggestedAction: 'Ensure all type layers are converted to paths in vector editor',
      });
    }
  }

  // 4. Video Checks (MP4, MOV, MPG, AVI)
  if (fmt === 'mp4' || fmt === 'mov' || fmt === 'mpg' || fmt === 'avi') {
    if (fmt === 'mpg' || fmt === 'avi') {
      issues.push({
        severity: 'warning',
        code: 'VIDEO_LEGACY_CONTAINER',
        message: `${fmt.toUpperCase()} format has low marketplace acceptance. Transcoding to MP4 (H.264) is strongly recommended.`,
        suggestedAction: 'Convert to MP4 (H.264 / AAC) container',
      });
    }

    if (file.videoSpecs) {
      const { duration, width, height, fps, codec, hasAudio } = file.videoSpecs;

      if (duration && (duration < 5 || duration > 60)) {
        issues.push({
          severity: 'warning',
          code: 'VIDEO_DURATION',
          message: `Duration is ${duration.toFixed(1)}s. Microstock standard is 5 to 60 seconds.`,
          suggestedAction: 'Trim or extend clip to between 5 and 60 seconds',
        });
      }

      if (width && height && (width < 1920 || height < 1080)) {
        issues.push({
          severity: 'error',
          code: 'VIDEO_SUB_HD',
          message: `Resolution is ${width}x${height}. Minimum acceptable stock video resolution is Full HD (1920x1080).`,
          suggestedAction: 'Upscale or record in at least 1080p Full HD or 4K UHD',
        });
      }

      if (fps && (fps < 23.9 || fps > 60.1)) {
        issues.push({
          severity: 'warning',
          code: 'VIDEO_FPS',
          message: `Frame rate is ${fps.toFixed(2)} fps. Recommended standard frame rates are 23.98, 24, 25, 29.97, 30, or 60 fps.`,
          suggestedAction: 'Conform frame rate in video editor',
        });
      }

      if (codec && !codec.includes('h264') && !codec.includes('avc') && !codec.includes('prores')) {
        issues.push({
          severity: 'warning',
          code: 'VIDEO_CODEC',
          message: `Video codec is '${codec}'. H.264 / ProRes are preferred by all major video agencies.`,
          suggestedAction: 'Transcode to H.264 or Apple ProRes 422',
        });
      }

      if (hasAudio) {
        issues.push({
          severity: 'info',
          code: 'VIDEO_AUDIO_PRESENT',
          message: 'Audio track detected. Ensure commercial rights or remove background audio/noise.',
          suggestedAction: 'Mute track if commercial release for ambient audio is missing',
        });
      }
    }
  }

  // 5. Duplicate or near-duplicate check
  if (file.isNearDuplicate) {
    issues.push({
      severity: 'warning',
      code: 'DUPLICATE_ASSET',
      message: `Near-duplicate visual detected (shares perceptual signature with '${file.duplicateOfName || 'another asset'}').`,
      suggestedAction: 'Vary composition or exclude to avoid spam rejections',
    });
  }

  return issues;
}
