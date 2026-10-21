import { StockFile } from '../types/stock';

/**
 * Computes an 8x8 difference perceptual hash (dHash) from an image data URL or base64.
 * Robust against minor resizing and compression differences.
 */
export async function computeImagePerceptualHash(imageSrc: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }

        // 9x8 pixels for difference hash
        canvas.width = 9;
        canvas.height = 8;
        ctx.drawImage(img, 0, 0, 9, 8);

        const imgData = ctx.getImageData(0, 0, 9, 8).data;
        const grays: number[] = [];

        // Convert to grayscale values
        for (let i = 0; i < imgData.length; i += 4) {
          const gray = Math.round(0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2]);
          grays.push(gray);
        }

        // Compute 64-bit difference hash
        let hash = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const left = grays[row * 9 + col];
            const right = grays[row * 9 + col + 1];
            hash += left > right ? '1' : '0';
          }
        }

        resolve(hash);
      } catch {
        resolve('');
      }
    };

    img.onerror = () => resolve('');
    img.src = imageSrc;
  });
}

/**
 * Calculates Hamming distance between two binary hash strings.
 */
export function getHammingDistance(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 999;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) distance++;
  }
  return distance;
}

/**
 * Calculates visual similarity percentage from Hamming distance (0% to 100%)
 */
export function getSimilarityPercentage(hashA: string, hashB: string): number {
  const dist = getHammingDistance(hashA, hashB);
  if (dist === 999) return 0;
  const sim = Math.max(0, Math.round(((64 - dist) / 64) * 100));
  return sim;
}

export interface DuplicateCluster {
  primaryFile: StockFile;
  duplicates: Array<{ file: StockFile; similarity: number }>;
}

/**
 * Group near-duplicates across a batch of stock files into clusters
 */
export function groupDuplicatesInBatch(files: StockFile[], distanceThreshold: number = 8): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  const claimedIds = new Set<string>();

  for (let i = 0; i < files.length; i++) {
    const fileA = files[i];
    if (!fileA.perceptualHash || claimedIds.has(fileA.id)) continue;

    const duplicates: Array<{ file: StockFile; similarity: number }> = [];

    for (let j = i + 1; j < files.length; j++) {
      const fileB = files[j];
      if (!fileB.perceptualHash || claimedIds.has(fileB.id)) continue;

      const dist = getHammingDistance(fileA.perceptualHash, fileB.perceptualHash);
      if (dist <= distanceThreshold) {
        duplicates.push({
          file: fileB,
          similarity: getSimilarityPercentage(fileA.perceptualHash, fileB.perceptualHash),
        });
        claimedIds.add(fileB.id);
      }
    }

    if (duplicates.length > 0) {
      claimedIds.add(fileA.id);
      clusters.push({
        primaryFile: fileA,
        duplicates,
      });
    }
  }

  return clusters;
}

/**
 * Detects duplicates and near-duplicates across a batch of stock files
 * Flags files with Hamming distance <= threshold (default 8 out of 64 bits).
 */
export async function detectDuplicatesInBatch(
  files: StockFile[],
  distanceThreshold: number = 8
): Promise<StockFile[]> {
  const updatedFiles = [...files];

  // 1. Compute pHash for any files lacking one
  for (let i = 0; i < updatedFiles.length; i++) {
    const file = updatedFiles[i];
    if (!file.perceptualHash && (file.thumbnailBase64 || file.previewUrl)) {
      try {
        file.perceptualHash = await computeImagePerceptualHash(file.thumbnailBase64 || file.previewUrl);
      } catch {}
    }
  }

  // 2. Pairwise compare hashes
  for (let i = 0; i < updatedFiles.length; i++) {
    const fileA = updatedFiles[i];
    if (!fileA.perceptualHash) continue;

    for (let j = 0; j < i; j++) {
      const fileB = updatedFiles[j];
      if (!fileB.perceptualHash) continue;

      const dist = getHammingDistance(fileA.perceptualHash, fileB.perceptualHash);
      if (dist <= distanceThreshold) {
        const similarity = getSimilarityPercentage(fileA.perceptualHash, fileB.perceptualHash);
        fileA.isNearDuplicate = true;
        fileA.duplicateOfName = `${fileB.name} (${similarity}% match)`;
        break;
      }
    }
  }

  return updatedFiles;
}
