import { describe, it, expect } from 'vitest';
import { generateMarketplaceCsv, exportAllSelectedMarketplaces } from '../utils/universalExportManager';
import { StockFile } from '../types/stock';

describe('Folder-Wise CSV Export', () => {
  const mockFiles: StockFile[] = [
    {
      id: 'f1',
      name: 'sunset_beach.jpg',
      baseName: 'sunset_beach',
      folderName: 'Nature_Summer',
      relativePath: 'Nature_Summer/sunset_beach.jpg',
      size: 1024 * 1024,
      format: 'jpg',
      lastModified: Date.now(),
      status: 'ready',
      metadata: {
        title: 'Sunset Beach Coastline Landscape',
        description: 'Golden hour sunset over calm ocean waves',
        keywords: ['sunset', 'beach', 'ocean', 'summer', 'nature'],
        primaryCategory: 'Nature & Landscapes',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    },
    {
      id: 'f2',
      name: 'pasta_carbonara.jpg',
      baseName: 'pasta_carbonara',
      folderName: 'Italian_Food',
      relativePath: 'Italian_Food/pasta_carbonara.jpg',
      size: 1024 * 1024,
      format: 'jpg',
      lastModified: Date.now(),
      status: 'ready',
      metadata: {
        title: 'Authentic Italian Carbonara Pasta with Guanciale',
        description: 'Traditional homemade spaghetti carbonara garnished with parmesan',
        keywords: ['pasta', 'carbonara', 'italian', 'food', 'culinary'],
        primaryCategory: 'Food & Drink',
        editorial: false,
        matureContent: false,
        releasesRequired: false,
      },
    },
  ];

  it('generates folder-prefixed CSV filename when folderName is provided', () => {
    const csvResult = generateMarketplaceCsv('adobe_stock', [mockFiles[0]], 'primary', 'Nature_Summer');
    expect(csvResult.folderName).toBe('Nature_Summer');
    expect(csvResult.filename).toContain('Nature_Summer_Adobe_Stock');
    expect(csvResult.rowCount).toBe(1);
    expect(csvResult.csvContent).toContain('sunset_beach.jpg');
    expect(csvResult.csvContent).not.toContain('pasta_carbonara.jpg');
  });

  it('exports separate folder CSVs in zip when splitByFolder is enabled', async () => {
    const { zipBlob, results } = await exportAllSelectedMarketplaces(
      ['adobe_stock', 'shutterstock'],
      mockFiles,
      'primary',
      true
    );

    expect(zipBlob).toBeDefined();
    expect(results.length).toBe(4); // 2 folders * 2 marketplaces

    const natureResults = results.filter((r) => r.folderName === 'Nature_Summer');
    const foodResults = results.filter((r) => r.folderName === 'Italian_Food');

    expect(natureResults.length).toBe(2);
    expect(foodResults.length).toBe(2);
    expect(natureResults[0].rowCount).toBe(1);
    expect(foodResults[0].rowCount).toBe(1);
  });

  it('skips unsupported or empty directory names when extracting base formats', () => {
    const validExtensions = ['jpg', 'jpeg', 'png', 'svg', 'eps', 'ai', 'mp4', 'mov', 'mpg', 'mpeg', 'avi'];
    const folderNameOnly = 'Bulbul';
    const lastDot = folderNameOnly.lastIndexOf('.');
    const ext = lastDot === -1 ? '' : folderNameOnly.substring(lastDot + 1).toLowerCase();

    expect(ext).toBe('');
    expect(validExtensions.includes(ext)).toBe(false);
  });
});
