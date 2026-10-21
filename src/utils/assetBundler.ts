import { FileFormat, StockFile } from '../types/stock';
import { cleanBaseName, generateSeoFilename } from './epsNativeProcessor';
export { cleanBaseName, generateSeoFilename };

export interface RawUploadedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  file?: File;
  dataUrl?: string;
  path?: string;
}

export interface AssetBundle {
  id: string; // Base filename
  baseName: string;
  primaryFile: RawUploadedFile;
  companionFiles: RawUploadedFile[];
  allFormats: FileFormat[];
  previewSource?: RawUploadedFile;
  hasCompanionJpg: boolean;
  hasCompanionVector: boolean;
  hasCompanionVideo: boolean;
}

/**
 * Normalizes file base names by stripping extension and standard preview suffixes
 */
export function extractBaseName(filename: string): { baseName: string; ext: string } {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return { baseName: filename, ext: '' };

  let base = filename.substring(0, lastDot);
  const ext = filename.substring(lastDot + 1).toLowerCase();

  // Strip preview suffixes like _preview, -thumb, _thumb, -preview, _small
  base = base.replace(/([_-](preview|thumb|thumbnail|small|display|web))$/i, '');

  return { baseName: base, ext };
}

/**
 * Determines FileFormat from extension
 */
export function getFormatFromExtension(ext: string): FileFormat {
  const clean = ext.toLowerCase();
  if (clean === 'jpg' || clean === 'jpeg') return 'jpg';
  if (clean === 'png') return 'png';
  if (clean === 'svg') return 'svg';
  if (clean === 'eps') return 'eps';
  if (clean === 'ai') return 'ai';
  if (clean === 'mp4') return 'mp4';
  if (clean === 'mov') return 'mov';
  if (clean === 'mpg' || clean === 'mpeg') return 'mpg';
  if (clean === 'avi') return 'avi';
  return 'jpg';
}

/**
 * Priority order for choosing the primary file in a bundle:
 * AI/EPS/SVG (vector master) > MP4/MOV/MPG/AVI (video master) > PNG > JPG
 */
function getFormatPriority(fmt: FileFormat): number {
  switch (fmt) {
    case 'ai':
      return 11;
    case 'eps':
      return 10;
    case 'svg':
      return 9;
    case 'mp4':
      return 8;
    case 'mov':
      return 7;
    case 'avi':
      return 6;
    case 'mpg':
      return 5;
    case 'png':
      return 4;
    case 'jpg':
    case 'jpeg':
      return 3;
    default:
      return 1;
  }
}

/**
 * Group raw uploaded files into AssetBundles with automatic companion pairing
 */
export function groupFilesIntoBundles(files: RawUploadedFile[]): AssetBundle[] {
  const groups = new Map<string, RawUploadedFile[]>();

  files.forEach((file) => {
    const { baseName } = extractBaseName(file.name);
    const key = baseName.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(file);
  });

  const bundles: AssetBundle[] = [];

  groups.forEach((groupFiles, key) => {
    // Sort files by priority to find primary master
    const sorted = [...groupFiles].sort((a, b) => {
      const extA = extractBaseName(a.name).ext;
      const extB = extractBaseName(b.name).ext;
      return getFormatPriority(getFormatFromExtension(extB)) - getFormatPriority(getFormatFromExtension(extA));
    });

    const primaryFile = sorted[0];
    const companionFiles = sorted.slice(1);
    const allFormats = sorted.map((f) => getFormatFromExtension(extractBaseName(f.name).ext));

    // Look for a companion raster preview (.jpg or .png)
    const rasterPreview = sorted.find((f) => {
      const fmt = getFormatFromExtension(extractBaseName(f.name).ext);
      return fmt === 'jpg' || fmt === 'jpeg' || fmt === 'png';
    });

    const hasCompanionJpg = sorted.some((f) => {
      const fmt = getFormatFromExtension(extractBaseName(f.name).ext);
      return fmt === 'jpg' || fmt === 'jpeg';
    });

    const hasCompanionVector = sorted.some((f) => {
      const fmt = getFormatFromExtension(extractBaseName(f.name).ext);
      return fmt === 'eps' || fmt === 'svg' || fmt === 'ai';
    });

    const hasCompanionVideo = sorted.some((f) => {
      const fmt = getFormatFromExtension(extractBaseName(f.name).ext);
      return fmt === 'mp4' || fmt === 'mov' || fmt === 'mpg' || fmt === 'avi';
    });

    bundles.push({
      id: key,
      baseName: extractBaseName(primaryFile.name).baseName,
      primaryFile,
      companionFiles,
      allFormats,
      previewSource: rasterPreview || primaryFile,
      hasCompanionJpg,
      hasCompanionVector,
      hasCompanionVideo,
    });
  });

  return bundles;
}
