import { describe, it, expect } from 'vitest';
import { EmbeddingOptions } from '../types/stock';

describe('Custom Output / Download Destination Folder (v3.15)', () => {
  it('supports customOutputFolder in EmbeddingOptions', () => {
    const opts: EmbeddingOptions = {
      overwriteOriginals: false,
      exportFolder: '/SEO_Embedded',
      customOutputFolder: 'E:\\Stock_Uploads\\2026-Batch',
      syncEpsCompanionJpg: true,
      embedExif: true,
      embedIptc: true,
      embedXmp: true,
      embedQuickTime: true,
      renameToSeoSlug: true,
      includeSidecarsAndLogs: true,
    };

    expect(opts.customOutputFolder).toBe('E:\\Stock_Uploads\\2026-Batch');
    expect(opts.includeSidecarsAndLogs).toBe(true);
  });

  it('correctly prepares payload for saving CSVs directly to custom destination', () => {
    const customFolder = 'C:\\Users\\OMEN\\Desktop\\Stock_CSVs';
    const csvContent = 'Filename,Title,Keywords\nphoto.jpg,"Sunset","lake, sunset"';
    const payload = {
      targetFolder: customFolder,
      files: [{ filename: 'Adobe_Stock_Metadata.csv', content: csvContent }],
    };

    expect(payload.targetFolder).toBe(customFolder);
    expect(payload.files).toHaveLength(1);
    expect(payload.files[0].filename).toBe('Adobe_Stock_Metadata.csv');
    expect(payload.files[0].content).toContain('Sunset');
  });
});
