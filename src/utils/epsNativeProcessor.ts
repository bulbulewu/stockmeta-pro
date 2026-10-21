/**
 * Native EPS Preview Extractor, PostScript Text Scanner, Vector Stroke Inspector,
 * Font Stray Detector, and Binary-Safe DSC Header + XMP Embedder.
 * Zero external dependencies. Handles both ASCII EPS and DOS/Windows Binary EPS (0xC5D0D3C6).
 */

export interface SanitizedInputResult {
  coreSubject: string;
  assetType: string;
  cleanPromptText: string;
  rawStrippedTokens: string[];
}

/**
 * 1. INPUT & FILENAME SANITIZER (STRIP WORKFLOW ARTIFACTS)
 * Strips production/tool tokens (upscaled, upscayl, topaz, gigapixel, ember, midjourney, firefly, v1, v2,
 * final, copy, edited, vectorized, traced, expanded, grid, 8000x4000, 9000x4000, artboard, cmyk, rgb, dimensions).
 * Extracts clean core semantic topic and visual asset type.
 * e.g., "wild-fermentation-ember-upscaled-line-icons-set-editable.eps"
 * -> coreSubject: "Wild Fermentation", assetType: "Line Icons Set", cleanPromptText: "Wild Fermentation Line Icons Set"
 */
export function sanitizeInput(input: string): SanitizedInputResult {
  if (!input || !input.trim()) {
    return {
      coreSubject: 'Vector Illustration',
      assetType: 'Vector Illustration',
      cleanPromptText: 'Vector Illustration',
      rawStrippedTokens: [],
    };
  }

  // 1. Strip file extension
  let text = input.replace(/\.[a-zA-Z0-9]{2,5}$/i, '');

  // 2. Strip preview/thumbnail suffixes
  text = text.replace(/([_-](preview|thumb|thumbnail|small|display|web))$/i, '');

  // 3. Normalize delimiters (hyphens, underscores, dots, slashes) to spaces
  text = text.replace(/[-_./\\]+/g, ' ');

  // 4. Strip workflow and tool tokens (case-insensitive)
  const workflowPatterns = [
    /\b(upscaled?|upscayl|topaz|gigapixel|ember|midjourney|firefly)\b/gi,
    /\bv\d+\b/gi, // v1, v2, v3, etc.
    /\b(final|copy|edited|vectorized|traced|expanded|grid|artboard|cmyk|rgb)\b/gi,
    /\b(sheet|draft|export|untitled|commercial|stock|art)\b/gi,
    /\b\d{3,5}\s*[xX*×]\s*\d{3,5}\b/gi, // 8000x4000, 9000x4000, 1920x1080
    /\b\d{3,5}\s*px\b/gi, // 8000px, 4000px
    /\b\d{6,}\b/gi, // Timestamps / long numeric IDs (6+ digits)
    /\b(img|dsc|dji|photo|pic|screenshot)\b/gi, // Camera prefixes
    /\b(eps|eps10|svg|ai|jpg|jpeg|png|mp4|mov)\b/gi, // Raw format tokens
  ];

  const strippedTokens: string[] = [];
  for (const pattern of workflowPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      strippedTokens.push(...matches.map((m) => m.toLowerCase()));
    }
    text = text.replace(pattern, ' ');
  }

  // Also strip years (e.g. 1990-2035) unless immediately followed by quantity words
  text = text.replace(
    /\b(19\d\d|20\d\d)\b(?!\s*(icons?|items?|pack|elements?|sets?|symbols?|illustrations?|vectors?))/gi,
    ' '
  );

  // Clean whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // 5. Detect and extract visual asset type
  let assetType = 'Vector Illustration';
  const assetTypePatterns: Array<{ regex: RegExp; label: string }> = [
    { regex: /\b(\d{1,3}\s+)?line\s+icons?\s+sets?\b/i, label: 'Line Icons Set' },
    { regex: /\b(\d{1,3}\s+)?outline\s+icons?\s+sets?\b/i, label: 'Outline Icons Set' },
    { regex: /\b(\d{1,3}\s+)?line\s+icons?\s+packs?\b/i, label: 'Line Icons Pack' },
    { regex: /\b(\d{1,3}\s+)?icons?\s+sets?\b/i, label: 'Icons Set' },
    { regex: /\b(\d{1,3}\s+)?icons?\s+packs?\b/i, label: 'Icon Pack' },
    { regex: /\b(\d{1,3}\s+)?line\s+art\s+sets?\b/i, label: 'Line Art Set' },
    { regex: /\b(\d{1,3}\s+)?pictograms?\s+sets?\b/i, label: 'Pictogram Set' },
    { regex: /\b(\d{1,3}\s+)?symbols?\s+sets?\b/i, label: 'Symbols Set' },
    { regex: /\b(\d{1,3}\s+)?elements?\s+sets?\b/i, label: 'Elements Set' },
    { regex: /\bvector\s+illustrations?\b/i, label: 'Vector Illustration' },
    { regex: /\bvector\s+badges?\b/i, label: 'Badge Vector' },
    { regex: /\bmotion\s+graphics?\b/i, label: 'Motion Graphics' },
    { regex: /\bstock\s+photos?\b/i, label: 'Stock Photo' },
  ];

  let coreSubjectRaw = text;
  for (const { regex, label } of assetTypePatterns) {
    const m = text.match(regex);
    if (m) {
      const quantityMatch = m[0].match(/^\d{1,3}/);
      assetType = quantityMatch ? `${quantityMatch[0]} ${label}` : label;
      coreSubjectRaw = text.replace(regex, ' ').trim();
      break;
    }
  }

  // Remove dangling workflow words from core subject
  coreSubjectRaw = coreSubjectRaw
    .replace(/\b(editable|stroke|vector|illustration|set|icons?|art)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!coreSubjectRaw) {
    coreSubjectRaw = 'Design Elements';
  }

  const coreSubject = coreSubjectRaw
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const cleanPromptText = `${coreSubject} ${assetType}`.replace(/\s+/g, ' ').trim();

  return {
    coreSubject,
    assetType,
    cleanPromptText,
    rawStrippedTokens: strippedTokens,
  };
}

/**
 * Backward-compatible helper returning cleaned lowercase descriptive words
 */
export function cleanBaseName(filename: string): string {
  if (!filename) return 'vector illustration';

  let base = filename.replace(/\.[^/.]+$/, '');
  base = base.replace(/([_-](preview|thumb|thumbnail|small|display|web))$/i, '');
  base = base.replace(/[-_]+/g, ' ');
  base = base.replace(/\b\d{6,}\b/g, ' ');
  base = base.replace(/\b(19\d\d|20\d\d)\b(?!\s*(icons?|items?|pack|elements?|sets?|symbols?|illustrations?|vectors?))/gi, ' ');
  base = base.replace(/\b(img|dsc|dji|photo|pic|screenshot)\b/gi, ' ');
  base = base.replace(/\b\d{3,5}\s*[xX*×]\s*\d{3,5}\b/gi, ' ');
  base = base.replace(/\b(upscaled?|upscayl|topaz|gigapixel|ember|midjourney|firefly|sheet|final|copy|edited|vectorized|traced|expanded|grid|artboard|cmyk|rgb|preview|thumb|thumbnail|v\d+|export|untitled|vector|eps|eps10|jpg|jpeg|png|commercial|stock|art)\b/gi, ' ');
  base = base.replace(/\s+/g, ' ').trim().toLowerCase();

  return base || 'vector illustration';
}

/**
 * Generate SEO-optimized filename slug:
 * Lowercase, hyphen-separated slug (a-z0-9- only) derived from top 6-8 most important words
 * plus the original extension.
 */
export function generateSeoFilename(title: string, originalFilename: string): string {
  const lastDot = originalFilename.lastIndexOf('.');
  const ext = lastDot !== -1 ? originalFilename.slice(lastDot).toLowerCase() : '.eps';

  if (!title || !title.trim()) {
    const clean = cleanBaseName(originalFilename).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return `${clean || 'vector-illustration'}${ext}`;
  }

  // Pick top 6-8 descriptive words from title
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !/^(and|or|for|with|in|on|at|to|a|an|the|of|by)$/i.test(w))
    .slice(0, 8);

  const slug = words.join('-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return `${slug || 'vector-illustration'}${ext}`;
}

/**
 * XML escape helper
 */
export function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 4. ACCURATE "EDITABLE STROKE" vs. "OUTLINE" DETECTION FOR EPS/SVG
 * Inspects raw vector content:
 * - In EPS: checks for stroke operators (setlinewidth / @ / S / stroke) vs compound fills (f / eofill / b / mo li cv fills).
 * - In SVG: checks for stroke attributes (stroke="..." and stroke-width="...") vs filled paths without stroke.
 */
export interface VectorStrokeAnalysis {
  hasLiveStroke: boolean;
  isExpandedFill: boolean;
  recommendedStylePhrase: 'Editable Stroke' | 'Outline' | 'Line Art';
  reason: string;
}

export function inspectVectorStrokes(content: Buffer | string, format: string = 'eps'): VectorStrokeAnalysis {
  const text = typeof content === 'string' ? content : content.toString('binary');
  const fmt = (format || '').toLowerCase().replace(/^\./, '');

  if (fmt === 'svg' || text.includes('<svg')) {
    const hasStrokeAttr = /stroke\s*=\s*["'](?!none|transparent)[^"']+["']/i.test(text);
    const hasStrokeWidth = /stroke-width\s*=\s*["'][^"']+["']/i.test(text);
    const hasStrokeStyle = /style\s*=\s*["'][^"']*stroke\s*:\s*(?!none|transparent)[^;"']+/i.test(text);

    const hasLiveStroke = (hasStrokeAttr && hasStrokeWidth) || hasStrokeStyle;
    return {
      hasLiveStroke,
      isExpandedFill: !hasLiveStroke,
      recommendedStylePhrase: hasLiveStroke ? 'Editable Stroke' : 'Outline',
      reason: hasLiveStroke
        ? 'SVG contains live stroke attributes (stroke / stroke-width)'
        : 'SVG paths are expanded fills (no active stroke attributes)',
    };
  }

  // EPS / PostScript inspection:
  let artworkSection = text;
  const privateDataIdx = text.indexOf('%AI9_PrivateDataBegin');
  if (privateDataIdx !== -1) {
    artworkSection = text.substring(0, privateDataIdx);
  }
  const endSetupIdx = artworkSection.indexOf('%%EndSetup');
  if (endSetupIdx !== -1) {
    artworkSection = artworkSection.substring(endSetupIdx);
  }

  const hasSetLineWidth = /\bsetlinewidth\b|\b\d+(\.\d+)?\s+w\b/i.test(artworkSection);
  const hasStrokeExec = /\b(stroke|S)\b|(\s@\s)/.test(artworkSection);
  const hasFillOps = /\b(eofill|f|F|b\*?|B\*?)\b/.test(artworkSection);

  const hasLiveStroke = hasSetLineWidth && hasStrokeExec;

  return {
    hasLiveStroke,
    isExpandedFill: !hasLiveStroke && hasFillOps,
    recommendedStylePhrase: hasLiveStroke ? 'Editable Stroke' : 'Outline',
    reason: hasLiveStroke
      ? 'EPS uses PostScript live stroke operators (setlinewidth / S / @)'
      : 'EPS paths are expanded compound fills (f / eofill / filled outlines)',
  };
}

/**
 * 5. FONT / STRAY TEXT DETECTOR FOR EPS
 * Checks %%DocumentNeededFonts, %%DocumentFonts, and <xmpTPg:Fonts>
 * for unoutlined live fonts (e.g. ArialMT, Arial-BoldMT, Helvetica).
 */
export function detectUnoutlinedFonts(content: Buffer | string): string[] {
  const text = typeof content === 'string' ? content : content.toString('binary');
  const detectedFonts: string[] = [];
  const seenFonts = new Set<string>();

  const addFont = (f: string) => {
    const clean = f.trim().replace(/[(),;]/g, '');
    if (
      clean &&
      clean.length > 1 &&
      !seenFonts.has(clean.toLowerCase()) &&
      !/^(atend|none|standard|fonts|documentfonts|documentneededfonts)$/i.test(clean)
    ) {
      seenFonts.add(clean.toLowerCase());
      detectedFonts.push(clean);
    }
  };

  const neededFontsRegex = /%%(?:DocumentNeededFonts|DocumentFonts):\s*([^\r\n]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = neededFontsRegex.exec(text)) !== null) {
    const fontLine = match[1];
    if (!fontLine.toLowerCase().includes('(atend)')) {
      fontLine.split(/\s+/).forEach(addFont);
    }
  }

  const contRegex = /%%\+\s*font\s*([^\r\n]+)/gi;
  while ((match = contRegex.exec(text)) !== null) {
    match[1].split(/\s+/).forEach(addFont);
  }

  const xmpFontMatch = text.match(/<xmpTPg:Fonts>([\s\S]*?)<\/xmpTPg:Fonts>/i);
  if (xmpFontMatch) {
    const fontLiRegex = /<rdf:li[^>]*>([^<]+)<\/rdf:li>/gi;
    let liMatch: RegExpExecArray | null;
    while ((liMatch = fontLiRegex.exec(xmpFontMatch[1])) !== null) {
      addFont(liMatch[1]);
    }
  }

  const stFontRegex = /stFnt:fontName=["']([^"']+)["']/gi;
  while ((match = stFontRegex.exec(text)) !== null) {
    addFont(match[1]);
  }

  return detectedFonts;
}

export interface EpsExtractedData {
  thumbnailBase64?: string;
  extractedText: string[];
  hasXmp: boolean;
  isBinaryEps: boolean;
  width?: number;
  height?: number;
  hasLiveStroke: boolean;
  isExpandedFill: boolean;
  detectedFonts: string[];
}

/**
 * Extracts embedded XMP JPEG preview thumbnail, PostScript artwork text strings,
 * vector stroke status, and unoutlined fonts from EPS.
 */
export function extractEpsMetadataAndPreview(bufferOrText: Buffer | string): EpsExtractedData {
  const isBuffer = Buffer.isBuffer(bufferOrText);
  const textContent = isBuffer
    ? bufferOrText.toString('binary')
    : bufferOrText;

  const isBinaryEps =
    isBuffer &&
    bufferOrText.length >= 30 &&
    bufferOrText[0] === 0xc5 &&
    bufferOrText[1] === 0xd0 &&
    bufferOrText[2] === 0xd3 &&
    bufferOrText[3] === 0xc6;

  let thumbnailBase64: string | undefined;
  let width: number | undefined;
  let height: number | undefined;
  let hasXmp = false;

  const xmpImgMatch = textContent.match(/<xmpGImg:image>([\s\S]*?)<\/xmpGImg:image>/i);
  if (xmpImgMatch && xmpImgMatch[1]) {
    hasXmp = true;
    const cleanRaw = xmpImgMatch[1]
      .replace(/&#xA;/g, '')
      .replace(/&#xD;/g, '')
      .replace(/[\r\n\s]+/g, '');

    if (cleanRaw.length > 50) {
      thumbnailBase64 = `data:image/jpeg;base64,${cleanRaw}`;
    }

    const wMatch = textContent.match(/<xmpGImg:width>(\d+)<\/xmpGImg:width>/i);
    if (wMatch) width = parseInt(wMatch[1], 10);

    const hMatch = textContent.match(/<xmpGImg:height>(\d+)<\/xmpGImg:height>/i);
    if (hMatch) height = parseInt(hMatch[1], 10);
  }

  if (!hasXmp && textContent.includes('<?xpacket begin=')) {
    hasXmp = true;
  }

  const cutoff = textContent.indexOf('%AI9_PrivateDataBegin');
  const psSection = cutoff !== -1 ? textContent.substring(0, cutoff) : textContent.substring(0, 600000);

  const foundWords = new Set<string>();

  const arrayTextRegex = /\(([A-Za-z0-9\s\-]{3,40})\)\s*(?:\r?\n)?\[/g;
  let match: RegExpExecArray | null;
  while ((match = arrayTextRegex.exec(psSection)) !== null) {
    const term = match[1].trim();
    if (term && !/^(true|false|def|pop|dup|dict|bind|setrgbcolor|showpage|gsave|grestore)$/i.test(term)) {
      foundWords.add(term);
    }
  }

  const showTextRegex = /\(([A-Za-z0-9\s\-]{3,40})\)\s*(?:Tj|TJ|show)\b/gi;
  while ((match = showTextRegex.exec(psSection)) !== null) {
    const term = match[1].trim();
    if (term && !/^(true|false|def|pop|dup|dict|bind)$/i.test(term)) {
      foundWords.add(term);
    }
  }

  const strokeAnalysis = inspectVectorStrokes(textContent, 'eps');
  const detectedFonts = detectUnoutlinedFonts(textContent);

  return {
    thumbnailBase64,
    extractedText: Array.from(foundWords),
    hasXmp,
    isBinaryEps,
    width,
    height,
    hasLiveStroke: strokeAnalysis.hasLiveStroke,
    isExpandedFill: strokeAnalysis.isExpandedFill,
    detectedFonts,
  };
}

export interface EpsEmbeddingResult {
  updatedBuffer: Buffer;
  success: boolean;
  method: 'in-place-padding-preserved' | 'header-recalculated' | 'ascii-expanded';
  methodUsed: 'in_place_padding' | 'header_recalculated' | 'ascii_expanded';
  originalSize: number;
  newSize: number;
  dscHeaderUpdated: boolean;
  xmpUpdated: boolean;
}

/**
 * 5. EPS / XMP / IPTC SYNCHRONIZATION & VALIDATION
 * Synchronizes:
 * 1. PostScript DSC Header: %%Title: (...) and %%Keywords: (...) cleanly
 * 2. XMP Packet (<x:xmpmeta>): <dc:title>, <dc:description>, and <dc:subject><rdf:Bag>...</rdf:Bag></dc:subject>
 * Handles both ASCII EPS and DOS Binary EPS (0xC5D0D3C6).
 */
export function embedEpsMetadata(
  buffer: Buffer,
  metadata: {
    title: string;
    description: string;
    keywords: string[];
  }
): EpsEmbeddingResult {
  const originalSize = buffer.length;
  const isBinaryEps =
    buffer.length >= 30 &&
    buffer[0] === 0xc5 &&
    buffer[1] === 0xd0 &&
    buffer[2] === 0xd3 &&
    buffer[3] === 0xc6;

  let psStart = 0;
  let psLength = buffer.length;
  let wmfStart = 0;
  let tifStart = 0;

  if (isBinaryEps) {
    psStart = buffer.readUInt32LE(4);
    psLength = buffer.readUInt32LE(8);
    wmfStart = buffer.readUInt32LE(12);
    tifStart = buffer.readUInt32LE(20);
  }

  let workBuffer = Buffer.from(buffer);
  let dscHeaderUpdated = false;
  let headerDelta = 0;

  // ----------------------------------------------------
  // STEP 1: Synchronize PostScript DSC Header (%%Title & %%Keywords)
  // ----------------------------------------------------
  try {
    const psSectionBuffer = isBinaryEps
      ? workBuffer.subarray(psStart, psStart + Math.min(psLength, 65536))
      : workBuffer.subarray(0, Math.min(workBuffer.length, 65536));

    let headerStr = psSectionBuffer.toString('binary');
    const cleanTitle = (metadata.title || '').replace(/[\r\n]+/g, ' ').trim();
    const cleanKeywords = (metadata.keywords || []).slice(0, 45).join(', ');

    const hasTitle = /%%Title:\s*[^\r\n]*/i.test(headerStr);
    const hasKeywords = /%%Keywords:\s*[^\r\n]*/i.test(headerStr);
    const endCommentsIdx = headerStr.indexOf('%%EndComments');

    if (hasTitle || hasKeywords || endCommentsIdx !== -1) {
      let modifiedHeader = headerStr;

      if (hasTitle) {
        modifiedHeader = modifiedHeader.replace(/%%Title:\s*[^\r\n]*/i, `%%Title: ${cleanTitle}`);
      } else if (endCommentsIdx !== -1) {
        modifiedHeader = modifiedHeader.replace(/(%%EndComments)/i, `%%Title: ${cleanTitle}\n$1`);
      }

      if (hasKeywords) {
        modifiedHeader = modifiedHeader.replace(/%%Keywords:\s*[^\r\n]*/i, `%%Keywords: ${cleanKeywords}`);
      } else if (endCommentsIdx !== -1) {
        modifiedHeader = modifiedHeader.replace(/(%%EndComments)/i, `%%Keywords: ${cleanKeywords}\n$1`);
      }

      if (modifiedHeader !== headerStr) {
        dscHeaderUpdated = true;
        const newHeaderBuffer = Buffer.from(modifiedHeader, 'binary');
        headerDelta = newHeaderBuffer.length - psSectionBuffer.length;

        const beforeSection = workBuffer.subarray(0, isBinaryEps ? psStart : 0);
        const remainingPs = workBuffer.subarray(isBinaryEps ? psStart + psSectionBuffer.length : psSectionBuffer.length);

        workBuffer = Buffer.concat([beforeSection, newHeaderBuffer, remainingPs]);

        if (isBinaryEps) {
          psLength += headerDelta;
          workBuffer.writeUInt32LE(psLength, 8);
          if (wmfStart > psStart) {
            wmfStart += headerDelta;
            workBuffer.writeUInt32LE(wmfStart, 12);
          }
          if (tifStart > psStart) {
            tifStart += headerDelta;
            workBuffer.writeUInt32LE(tifStart, 20);
          }
        }
      }
    }
  } catch (hdrErr) {
    console.warn('DSC header synchronization note:', hdrErr);
  }

  // ----------------------------------------------------
  // STEP 2: Synchronize Dublin Core XMP Packet (<x:xmpmeta>)
  // ----------------------------------------------------
  const binaryString = workBuffer.toString('binary');
  const packetStartStr = '<?xpacket begin=';
  const packetStartIndex = binaryString.indexOf(packetStartStr);

  if (packetStartIndex === -1) {
    return {
      updatedBuffer: workBuffer,
      success: dscHeaderUpdated,
      method: 'ascii-expanded',
      methodUsed: 'ascii_expanded',
      originalSize,
      newSize: workBuffer.length,
      dscHeaderUpdated,
      xmpUpdated: false,
    };
  }

  // Find packet end
  const endWIndex = binaryString.indexOf('<?xpacket end="w"?>', packetStartIndex);
  const endRIndex = binaryString.indexOf('<?xpacket end="r"?>', packetStartIndex);
  const packetEndIndex = endWIndex !== -1 ? endWIndex : endRIndex;
  const packetEndStr = endWIndex !== -1 ? '<?xpacket end="w"?>' : '<?xpacket end="r"?>';

  if (packetEndIndex === -1) {
    return {
      updatedBuffer: workBuffer,
      success: dscHeaderUpdated,
      method: 'ascii-expanded',
      methodUsed: 'ascii_expanded',
      originalSize,
      newSize: workBuffer.length,
      dscHeaderUpdated,
      xmpUpdated: false,
    };
  }

  const packetTotalEndIndex = packetEndIndex + packetEndStr.length;
  const origXmpByteLen = packetTotalEndIndex - packetStartIndex;
  const origXmpPacket = binaryString.substring(packetStartIndex, packetTotalEndIndex);

  // Build the new Dublin Core tags
  const xmlTitle = escapeXml(metadata.title);
  const xmlDesc = escapeXml(metadata.description || metadata.title);
  const dcKeywordsXml = metadata.keywords
    .map((k) => `         <rdf:li>${escapeXml(k)}</rdf:li>`)
    .join('\n');

  const newDcBlock = `<dc:title>
      <rdf:Alt>
         <rdf:li xml:lang="x-default">${xmlTitle}</rdf:li>
      </rdf:Alt>
   </dc:title>
   <dc:description>
      <rdf:Alt>
         <rdf:li xml:lang="x-default">${xmlDesc}</rdf:li>
      </rdf:Alt>
   </dc:description>
   <dc:subject>
      <rdf:Bag>
${dcKeywordsXml}
      </rdf:Bag>
   </dc:subject>`;

  let modifiedXmp = origXmpPacket;
  modifiedXmp = modifiedXmp.replace(/<dc:title>[\s\S]*?<\/dc:title>/gi, '');
  modifiedXmp = modifiedXmp.replace(/<dc:description>[\s\S]*?<\/dc:description>/gi, '');
  modifiedXmp = modifiedXmp.replace(/<dc:subject>[\s\S]*?<\/dc:subject>/gi, '');

  if (/<rdf:Description\b[^>]*>/i.test(modifiedXmp)) {
    modifiedXmp = modifiedXmp.replace(/(<rdf:Description\b[^>]*>)/i, `$1\n   ${newDcBlock}\n`);
  } else {
    const dcWrapper = `<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">\n   ${newDcBlock}\n   </rdf:Description>`;
    modifiedXmp = modifiedXmp.replace(/(<\/rdf:RDF>)/i, `   ${dcWrapper}\n$1`);
  }

  const metaCloseTag = '</x:xmpmeta>';
  const metaCloseIndex = modifiedXmp.indexOf(metaCloseTag);

  if (metaCloseIndex === -1) {
    return {
      updatedBuffer: workBuffer,
      success: dscHeaderUpdated,
      method: 'ascii-expanded',
      methodUsed: 'ascii_expanded',
      originalSize,
      newSize: workBuffer.length,
      dscHeaderUpdated,
      xmpUpdated: false,
    };
  }

  const newHeaderAndBody = modifiedXmp.substring(0, metaCloseIndex + metaCloseTag.length);
  const endTag = '<?xpacket end="w"?>';

  const minNewPacketLen = Buffer.byteLength(newHeaderAndBody, 'utf-8') + 1 + Buffer.byteLength(endTag, 'utf-8');

  // METHOD A: In-Place Padding Adjustment (when new XMP fits into original packet)
  // If the DSC header grew by headerDelta, the XMP whitespace padding absorbs it
  // so that the total file size remains exactly identical to originalSize!
  const targetPacketLen = origXmpByteLen - headerDelta;
  if (minNewPacketLen <= targetPacketLen) {
    const neededPaddingBytes = targetPacketLen - minNewPacketLen;
    const paddingStr = '\n' + ' '.repeat(Math.max(0, neededPaddingBytes));
    const finalizedXmpPacket = newHeaderAndBody + paddingStr + endTag;

    const newXmpBuffer = Buffer.from(finalizedXmpPacket, 'utf-8');

    // Reconstruct buffer with adjusted packet
    const beforePacket = workBuffer.subarray(0, packetStartIndex);
    const afterPacket = workBuffer.subarray(packetTotalEndIndex);
    const updatedBuffer = Buffer.concat([beforePacket, newXmpBuffer, afterPacket]);

    return {
      updatedBuffer,
      success: true,
      method: 'in-place-padding-preserved',
      methodUsed: 'in_place_padding',
      originalSize,
      newSize: updatedBuffer.length,
      dscHeaderUpdated,
      xmpUpdated: true,
    };
  }

  // METHOD B: Binary Header Recalculation (XMP grew larger than existing padding)
  const expandedPadding = '\n' + ' '.repeat(1024);
  const finalizedXmpPacket = newHeaderAndBody + expandedPadding + endTag;
  const newXmpBuffer = Buffer.from(finalizedXmpPacket, 'utf-8');

  const deltaBytes = newXmpBuffer.length - origXmpByteLen;

  const beforePacket = workBuffer.subarray(0, packetStartIndex);
  const afterPacket = workBuffer.subarray(packetTotalEndIndex);
  const updatedBuffer = Buffer.concat([beforePacket, newXmpBuffer, afterPacket]);

  if (isBinaryEps) {
    const newPsLength = psLength + deltaBytes;
    updatedBuffer.writeUInt32LE(newPsLength, 8);

    if (wmfStart > 0 && wmfStart > packetStartIndex) {
      updatedBuffer.writeUInt32LE(wmfStart + deltaBytes, 12);
    }
    if (tifStart > 0 && tifStart > packetStartIndex) {
      updatedBuffer.writeUInt32LE(tifStart + deltaBytes, 20);
    }
    updatedBuffer.writeUInt16LE(0xffff, 28);
  }

  return {
    updatedBuffer,
    success: true,
    method: isBinaryEps ? 'header-recalculated' : 'ascii-expanded',
    methodUsed: isBinaryEps ? 'header_recalculated' : 'ascii_expanded',
    originalSize,
    newSize: updatedBuffer.length,
    dscHeaderUpdated,
    xmpUpdated: true,
  };
}
