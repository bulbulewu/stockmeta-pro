import JSZip from 'jszip';
import { MARKETPLACES } from '../config/marketplaces';
import { StockFile } from '../types/stock';

export interface ExportCsvResult {
  marketplaceId: string;
  marketplaceName: string;
  filename: string;
  csvContent: string;
  rowCount: number;
  delimiter: string;
  headers: string[];
  previewRows: Record<string, string | number>[];
  folderName?: string;
  subfolder?: string;
}

/**
 * Escapes CSV cell values according to RFC 4180
 */
export function escapeCsvCell(val: string | number | undefined | null, delimiter: string = ','): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  // If the cell contains quotes, delimiters, newlines, or carriage returns, wrap in quotes and escape internal quotes
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Resolve filename based on marketplace convention and companion preferences
 */
export function resolveExportFilename(
  file: StockFile,
  marketplaceId: string,
  vectorPreference: 'primary' | 'companion_jpg' | 'zip' = 'primary'
): string {
  // Prioritize SEO filename so CSV and exported files match 100%
  const activeFilename = file.seoFilename || file.metadata?.seoFilename || file.name;
  const isVector = file.format === 'eps' || file.format === 'svg' || file.format === 'ai';

  const lastDot = activeFilename.lastIndexOf('.');
  const baseSlug = lastDot !== -1 ? activeFilename.slice(0, lastDot) : file.baseName;

  if (!isVector) return activeFilename;

  if (vectorPreference === 'companion_jpg') {
    return `${baseSlug}.jpg`;
  } else if (vectorPreference === 'zip') {
    return `${baseSlug}.zip`;
  }
  return activeFilename;
}

/**
 * Generate CSV string for a single marketplace
 */
export function generateMarketplaceCsv(
  marketplaceId: string,
  files: StockFile[],
  vectorPreference: 'primary' | 'companion_jpg' | 'zip' = 'primary',
  folderName?: string
): ExportCsvResult {
  const config = MARKETPLACES[marketplaceId];
  if (!config) {
    throw new Error(`Marketplace configuration not found for id: ${marketplaceId}`);
  }

  const delimiter = config.delimiter || ',';
  const headers = config.csvHeaders;
  const previewRows: Record<string, string | number>[] = [];

  // Generate rows
  const rowLines: string[] = [];

  // Header line
  rowLines.push(headers.map((h) => escapeCsvCell(h, delimiter)).join(delimiter));

  files.forEach((file) => {
    // Resolve filename for the marketplace
    const resolvedName = resolveExportFilename(file, marketplaceId, vectorPreference);
    const virtualFile: StockFile = {
      ...file,
      name: resolvedName,
    };

    const rowData = config.rowMapper(virtualFile);
    previewRows.push(rowData);

    const rowCells = headers.map((header) => {
      const cellVal = rowData[header];
      return escapeCsvCell(cellVal, delimiter);
    });

    rowLines.push(rowCells.join(delimiter));
  });

  const now = new Date().toISOString().split('T')[0];
  const safeMarketplaceName = config.name.replace(/[^a-zA-Z0-9]/g, '_');
  const safePrefix = folderName ? `${folderName.replace(/[^a-zA-Z0-9_-]/g, '_')}_` : '';
  const filename = `${safePrefix}${safeMarketplaceName}_Metadata_${now}.csv`;
  const csvContent = rowLines.join('\r\n');

  return {
    marketplaceId,
    marketplaceName: config.name,
    filename,
    csvContent,
    rowCount: files.length,
    delimiter,
    headers,
    previewRows,
    folderName,
    subfolder: folderName,
  };
}

/**
 * Universal Export Manager:
 * Takes the active batch of analyzed files, processes each selected marketplace,
 * and packages them into a clean ZIP archive with individual CSV files.
 * Supports splitting by folder if multiple folders are ingested.
 */
export async function exportAllSelectedMarketplaces(
  selectedMarketplaceIds: string[],
  files: StockFile[],
  vectorPreference: 'primary' | 'companion_jpg' | 'zip' = 'primary',
  splitByFolder: boolean = false
): Promise<{ zipBlob: Blob; results: ExportCsvResult[] }> {
  const zip = new JSZip();
  const results: ExportCsvResult[] = [];

  const distinctFolders = Array.from(new Set(files.map((f) => f.folderName).filter(Boolean) as string[]));

  if (splitByFolder && distinctFolders.length > 0) {
    // Group files by folder
    const folderGroups: Record<string, StockFile[]> = {};
    for (const f of files) {
      const groupKey = f.folderName || 'Unfiled';
      if (!folderGroups[groupKey]) folderGroups[groupKey] = [];
      folderGroups[groupKey].push(f);
    }

    for (const [folderName, groupFiles] of Object.entries(folderGroups)) {
      const folderZip = zip.folder(folderName);
      for (const mId of selectedMarketplaceIds) {
        if (!MARKETPLACES[mId]) continue;
        const res = generateMarketplaceCsv(mId, groupFiles, vectorPreference, folderName);
        results.push(res);
        if (folderZip) {
          folderZip.file(res.filename, res.csvContent);
        } else {
          zip.file(`${folderName}/${res.filename}`, res.csvContent);
        }
      }
    }
  } else {
    for (const mId of selectedMarketplaceIds) {
      if (!MARKETPLACES[mId]) continue;
      const res = generateMarketplaceCsv(mId, files, vectorPreference);
      results.push(res);
      zip.file(res.filename, res.csvContent);
    }
  }

  // Also include a master Readme in the ZIP
  const readmeContent = `StockMeta Pro - Universal Microstock Metadata Export
Generated on: ${new Date().toLocaleString()}
Total Files: ${files.length}
Marketplaces Exported: ${selectedMarketplaceIds.length}
Folder Split: ${splitByFolder ? 'Enabled (folder-wise individual CSVs)' : 'Disabled (unified master CSVs)'}

Included CSV Files:
${results.map((r) => `- ${r.subfolder ? `${r.subfolder}/` : ''}${r.filename} (${r.marketplaceName}, ${r.rowCount} records, delimiter: '${r.delimiter}')`).join('\n')}

Upload Instructions:
1. Adobe Stock: Upload your assets via FTP or Web portal, then upload Adobe_Stock_Metadata_*.csv in the CSV Upload section.
2. Shutterstock: Use Shutterstock CSV Upload tool or ensure companion .jpg preview matches .eps.
3. Freepik: Note that Freepik uses Semicolon (;) delimited CSV per their requirement.
4. Vecteezy & Pond5: Drop the generated CSV directly into contributor batch metadata view.
`;

  zip.file('README_StockMeta_Upload_Guide.txt', readmeContent);

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { zipBlob, results };
}

/**
 * Download a single string as a file
 */
export function triggerFileDownload(content: string | Blob, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
