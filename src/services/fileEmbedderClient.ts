import JSZip from 'jszip';
import { EmbeddingOptions, StockFile } from '../types/stock';
import { generateXmpSidecarXml } from '../utils/xmpSidecarGenerator';
import { fileRegistry } from './fileRegistry';

export interface EmbedBatchResponse {
  success: boolean;
  count: number;
  results: Array<{
    filename: string;
    format: string;
    success: boolean;
    base64Data?: string;
    tagsWritten?: string[];
  }>;
}

/**
 * Sends files to server for binary ExifTool embedding in memory-safe chunks
 * and bundles them into a downloadable ZIP without RAM spikes.
 */
export async function embedMetadataIntoFiles(
  files: StockFile[],
  options: EmbeddingOptions
): Promise<{ success: boolean; zipBlob: Blob; response: EmbedBatchResponse }> {
  const combinedResults: any[] = [];
  let totalProcessed = 0;

  const zip = new JSZip();
  const folderName = options.exportFolder.replace(/^\//, '') || 'SEO_Embedded';
  const zipFolder = zip.folder(folderName) || zip;

  // Adaptive chunking: Large media (> 8 MB, videos) get their own single-file batch
  // to avoid browser JSON/V8 memory limits, while smaller vector/raster assets are batched together.
  const chunks: StockFile[][] = [];
  let currentChunk: StockFile[] = [];
  let currentChunkBytes = 0;

  for (const f of files) {
    const isLarge = (f.size || 0) > 8 * 1024 * 1024 || f.format === 'mp4' || f.format === 'mov';
    if (isLarge) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentChunkBytes = 0;
      }
      chunks.push([f]);
    } else {
      currentChunk.push(f);
      currentChunkBytes += f.size || 0;
      if (currentChunk.length >= 10 || currentChunkBytes >= 15 * 1024 * 1024) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentChunkBytes = 0;
      }
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  for (const chunk of chunks) {
    const payloadFiles = await Promise.all(
      chunk.map(async (f) => {
        let content = '';

        // 1. Fast, native C++ FileReader Base64 conversion from in-memory file handle
        if (fileRegistry.has(f.id)) {
          const b64 = await fileRegistry.getAsBase64(f.id);
          if (b64) content = b64;
        } else if (f.previewUrl && f.previewUrl.startsWith('blob:')) {
          // Resolve blob URL to base64 if registry was cleared
          try {
            const blob = await fetch(f.previewUrl).then((r) => r.blob());
            content = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string) || '');
              reader.onerror = () => resolve('');
              reader.readAsDataURL(blob);
            });
          } catch {}
        } else if (f.thumbnailBase64 && !f.thumbnailBase64.startsWith('blob:')) {
          content = f.thumbnailBase64;
        }

        return {
          filename: f.name,
          folderName: f.folderName,
          format: f.format,
          base64Content: content,
          metadata: {
            title: f.metadata.title,
            description: f.metadata.description,
            keywords: f.metadata.keywords,
            seoFilename: f.seoFilename || f.metadata.seoFilename,
          },
        };
      })
    );

    const validPayloadFiles = payloadFiles.filter((p) => p.base64Content && p.base64Content.length > 0);
    if (validPayloadFiles.length === 0) continue;

    let res: Response;
    try {
      res = await fetch('/api/embed-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: validPayloadFiles,
          options: {
            overwriteOriginals: options.overwriteOriginals,
            exportFolder: options.exportFolder || '/SEO_Embedded',
            customOutputFolder: options.customOutputFolder,
            syncEpsCompanionJpg: options.syncEpsCompanionJpg,
            renameToSeoSlug: options.renameToSeoSlug ?? true,
            includeSidecarsAndLogs: options.includeSidecarsAndLogs,
          },
        }),
      });
    } catch (networkErr: any) {
      throw new Error(
        `Could not connect to StockMeta Pro desktop server at http://localhost:3000. Please ensure the app server console is running. (${networkErr.message})`
      );
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${res.status}`);
    }

    const data: EmbedBatchResponse = await res.json();
    totalProcessed += data.count || chunk.length;

    for (const item of (data.results as any[])) {
      combinedResults.push(item);
      if (item.base64Data) {
        const cleanBase64 = item.base64Data.replace(/^data:[^;]+;base64,/, '');
        const targetZip = item.folderName ? (zipFolder.folder(item.folderName) || zipFolder) : zipFolder;
        targetZip.file(item.filename, cleanBase64, { base64: true });
      }
    }

    // Non-blocking UI yield between embedding chunks
    await new Promise((r) => setTimeout(r, 20));
  }

  // Pure Media Guarantee: Only media files (.eps, .jpg, .png, etc.) stay in /SEO_Embedded.
  // Sidecar .xmp files and verification report are moved to a separate /Sidecars_and_Logs subfolder
  // ONLY if the user explicitly enabled includeSidecarsAndLogs.
  if (options.includeSidecarsAndLogs) {
    const sidecarsFolder = zip.folder('Sidecars_and_Logs') || zip;

    for (const f of files) {
      const xmpXml = generateXmpSidecarXml({
        title: f.metadata.title,
        description: f.metadata.description,
        keywords: f.metadata.keywords,
        category: f.metadata.primaryCategory,
      });
      const baseSlug = f.seoFilename ? f.seoFilename.replace(/\.[^/.]+$/, '') : f.baseName;
      const xmpName = `${baseSlug}.xmp`;
      sidecarsFolder.file(xmpName, xmpXml);
    }

    const report = `StockMeta Pro - Embedded Metadata Verification Report
Timestamp: ${new Date().toLocaleString()}
Files Processed: ${totalProcessed}
Output Target: ${options.exportFolder}

Embedded Fields:
- Title (Mapped to: Title, XMP-dc:Title, IPTC:ObjectName, QuickTime:Title)
- Description (Mapped to: Description, XMP-dc:Description, IPTC:Caption-Abstract, Exif:ImageDescription, QuickTime:Description)
- Keywords (Mapped to: Keywords, XMP-dc:Subject, IPTC:Keywords, QuickTime:Keywords)

Status Per File:
${combinedResults.map((r) => `✓ ${r.filename} (${r.tagsWritten?.length || 0} tag groups injected)`).join('\n')}
`;
    sidecarsFolder.file('EMBEDDING_VERIFICATION_REPORT.txt', report);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return {
    success: true,
    zipBlob,
    response: {
      success: true,
      count: totalProcessed,
      results: combinedResults,
    },
  };
}
