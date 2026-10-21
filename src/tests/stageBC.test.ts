import { describe, it, expect } from 'vitest';
import { StockFile } from '../types/stock';
import { runTechnicalPreflight } from '../utils/technicalPreflight';
import {
  getHammingDistance,
  getSimilarityPercentage,
  groupDuplicatesInBatch,
  detectDuplicatesInBatch,
} from '../utils/perceptualHash';
import { generateXmpSidecarXml } from '../utils/xmpSidecarGenerator';

describe('Stage C — Technical Pre-Flight Quality Engine', () => {
  it('flags images under 4.0 Megapixels with JPEG_LOW_RES warning', () => {
    const lowResFile: StockFile = {
      id: 'pf1',
      name: 'low_res_sample.jpg',
      baseName: 'low_res_sample',
      format: 'jpg',
      size: 400000,
      dimensions: { width: 1200, height: 800 }, // 0.96 MP (< 4.0 MP)
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: {
        title: 'Low resolution photo test',
        description: 'Test description',
        keywords: ['test', 'photo'],
        primaryCategory: 'Nature',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const issues = runTechnicalPreflight(lowResFile, [lowResFile]);
    expect(issues.some((i) => i.code === 'JPEG_LOW_RES')).toBe(true);
    expect(issues.find((i) => i.code === 'JPEG_LOW_RES')?.severity).toBe('warning');
  });

  it('detects missing companion JPEG for EPS vector files', () => {
    const epsWithoutCompanion: StockFile = {
      id: 'pf2',
      name: 'isolated_icon.eps',
      baseName: 'isolated_icon',
      format: 'eps',
      size: 850000,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: {
        title: 'Isolated Modern Business Icon Vector',
        description: 'Vector illustration of finance symbol.',
        keywords: ['business', 'icon', 'vector'],
        primaryCategory: 'Graphic Resources',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    // When no companion JPG is in batch:
    const issues = runTechnicalPreflight(epsWithoutCompanion, [epsWithoutCompanion]);
    expect(issues.some((i) => i.code === 'VECTOR_MISSING_JPG')).toBe(true);

    // When companion JPG is present:
    const companionJpg: StockFile = {
      id: 'pf2_comp',
      name: 'isolated_icon.jpg',
      baseName: 'isolated_icon',
      format: 'jpg',
      size: 1200000,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      metadata: { ...epsWithoutCompanion.metadata },
    };

    const issuesWithCompanion = runTechnicalPreflight(epsWithoutCompanion, [epsWithoutCompanion, companionJpg]);
    expect(issuesWithCompanion.some((i) => i.code === 'VECTOR_MISSING_JPG')).toBe(false);
  });

  it('warns about legacy video containers (MPG, AVI) and non-standard durations', () => {
    const legacyVideo: StockFile = {
      id: 'pf3',
      name: 'old_footage.avi',
      baseName: 'old_footage',
      format: 'avi',
      size: 50000000,
      lastModified: Date.now(),
      previewUrl: '',
      status: 'ready',
      videoSpecs: {
        duration: 2.5, // under 5 seconds
        width: 1280,
        height: 720, // Sub-Full HD
        fps: 29.97,
        codec: 'mjpeg',
        hasAudio: true,
      },
      metadata: {
        title: 'Legacy Video Clip Sample',
        description: 'Short video test clip.',
        keywords: ['video', 'legacy'],
        primaryCategory: 'Video',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    };

    const issues = runTechnicalPreflight(legacyVideo, [legacyVideo]);
    expect(issues.some((i) => i.code === 'VIDEO_LEGACY_CONTAINER')).toBe(true);
    expect(issues.some((i) => i.code === 'VIDEO_DURATION')).toBe(true);
    expect(issues.some((i) => i.code === 'VIDEO_SUB_HD')).toBe(true);
  });
});

describe('Stage C — Perceptual Hash (dHash) & Duplicate Clustering', () => {
  it('calculates Hamming distance and similarity percentage accurately', () => {
    const hashA = '1111000011110000111100001111000011110000111100001111000011110000';
    const hashB = '1111000011110000111100001111000011110000111100001111000011110000'; // Identical
    const hashC = '1111000011110000111100001111000011110000111100001111000011111111'; // 4 bits diff

    expect(getHammingDistance(hashA, hashB)).toBe(0);
    expect(getSimilarityPercentage(hashA, hashB)).toBe(100);

    expect(getHammingDistance(hashA, hashC)).toBe(4);
    expect(getSimilarityPercentage(hashA, hashC)).toBe(94);
  });

  it('groups duplicate clusters and identifies near-duplicate series shots', () => {
    const baseHash = '1010101010101010101010101010101010101010101010101010101010101010';
    const nearHash = '1010101010101010101010101010101010101010101010101010101010101011'; // 1 bit diff
    const differentHash = '0000000000000000000000000000000000000000000000000000000000000000';

    const batch: StockFile[] = [
      {
        id: 'dup1',
        name: 'shot_take_1.jpg',
        baseName: 'shot_take_1',
        format: 'jpg',
        size: 3000000,
        perceptualHash: baseHash,
        lastModified: Date.now(),
        previewUrl: '',
        status: 'ready',
        metadata: { title: 'Take 1', description: 'Desc', keywords: ['shot'], primaryCategory: 'Nature', editorial: false, matureContent: false, releasesRequired: false },
      },
      {
        id: 'dup2',
        name: 'shot_take_2.jpg',
        baseName: 'shot_take_2',
        format: 'jpg',
        size: 3100000,
        perceptualHash: nearHash,
        lastModified: Date.now(),
        previewUrl: '',
        status: 'ready',
        metadata: { title: 'Take 2', description: 'Desc', keywords: ['shot'], primaryCategory: 'Nature', editorial: false, matureContent: false, releasesRequired: false },
      },
      {
        id: 'unique1',
        name: 'completely_different.jpg',
        baseName: 'completely_different',
        format: 'jpg',
        size: 2500000,
        perceptualHash: differentHash,
        lastModified: Date.now(),
        previewUrl: '',
        status: 'ready',
        metadata: { title: 'Unique', description: 'Desc', keywords: ['unique'], primaryCategory: 'Nature', editorial: false, matureContent: false, releasesRequired: false },
      },
    ];

    const clusters = groupDuplicatesInBatch(batch, 4);
    expect(clusters.length).toBe(1);
    expect(clusters[0].primaryFile.name).toBe('shot_take_1.jpg');
    expect(clusters[0].duplicates[0].file.name).toBe('shot_take_2.jpg');
    expect(clusters[0].duplicates[0].similarity).toBeGreaterThanOrEqual(98);
  });
});

describe('Stage B — Advanced Embedding & Sidecar Generation', () => {
  it('generates fully populated XMP sidecar with Dublin Core tags', () => {
    const sidecar = generateXmpSidecarXml({
      title: 'Mountain Sunrise Panorama',
      description: 'Vibrant golden hour sun over alpine ridge with copy space.',
      keywords: ['mountain', 'sunrise', 'alpine', 'landscape', 'golden hour'],
      category: 'Landscapes',
      isAiGenerated: false,
    });

    expect(sidecar).toContain('<dc:title>');
    expect(sidecar).toContain('Mountain Sunrise Panorama');
    expect(sidecar).toContain('<dc:description>');
    expect(sidecar).toContain('<rdf:Bag>');
    expect(sidecar).toContain('<rdf:li>mountain</rdf:li>');
    expect(sidecar).toContain('<photoshop:Category>Landscapes</photoshop:Category>');
    expect(sidecar).toContain('<xmp:CreatorTool>StockMeta Pro Studio v2.7' || 'v2.8');
  });
});
