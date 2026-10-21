import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Archive, Check, Info, ExternalLink, Folder } from 'lucide-react';
import { StockFile } from '../types/stock';
import { MARKETPLACES } from '../config/marketplaces';
import {
  exportAllSelectedMarketplaces,
  generateMarketplaceCsv,
  triggerFileDownload,
} from '../utils/universalExportManager';
import { FolderDestinationPicker } from './FolderDestinationPicker';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StockFile[];
  selectedMarketplaceIds: string[];
  vectorCsvPreference: 'primary' | 'companion_jpg' | 'zip';
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  files,
  selectedMarketplaceIds,
  vectorCsvPreference,
}) => {
  if (!isOpen) return null;

  const validMarketplaceIds = selectedMarketplaceIds.filter((id) => MARKETPLACES[id]);
  const [activeMarketplaceId, setActiveMarketplaceId] = useState<string>(
    validMarketplaceIds[0] || 'adobe_stock'
  );
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipDownloaded, setZipDownloaded] = useState(false);
  const [outputFolder, setOutputFolder] = useState<string>(() => {
    try {
      return localStorage.getItem('stockmeta_custom_output_folder') || '';
    } catch {
      return '';
    }
  });
  const [savedFolderNotice, setSavedFolderNotice] = useState<string | null>(null);

  const distinctFolders = Array.from(new Set(files.map((f) => f.folderName).filter(Boolean) as string[]));
  const hasMultipleFolders = distinctFolders.length > 0;
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [splitByFolder, setSplitByFolder] = useState<boolean>(true);

  // Files for preview & single export
  const previewFiles = selectedFolderFilter === 'all'
    ? files
    : files.filter((f) => f.folderName === selectedFolderFilter);

  const currentConfig = MARKETPLACES[activeMarketplaceId] || MARKETPLACES.adobe_stock;
  const currentCsvData = generateMarketplaceCsv(
    activeMarketplaceId,
    previewFiles,
    vectorCsvPreference,
    selectedFolderFilter !== 'all' ? selectedFolderFilter : undefined
  );

  const handleDownloadZip = async () => {
    try {
      setIsExportingZip(true);
      const { zipBlob, results } = await exportAllSelectedMarketplaces(
        validMarketplaceIds,
        files,
        vectorCsvPreference,
        splitByFolder && hasMultipleFolders
      );
      const now = new Date().toISOString().split('T')[0];
      const zipFilename = `StockMeta_Pro_Marketplaces_CSV_Bundle_${now}.zip`;

      // If custom output folder is set, save CSVs and ZIP directly to that disk directory
      if (outputFolder.trim()) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string) || '');
            reader.readAsDataURL(zipBlob);
          });
          const zipBase64 = await base64Promise;

          const filesToSave: Array<{ filename: string; content: string; isBase64?: boolean; subfolder?: string }> = [
            ...results.map((r) => ({ filename: r.filename, content: r.csvContent, subfolder: r.subfolder })),
            { filename: zipFilename, content: zipBase64, isBase64: true },
          ];

          await fetch('/api/save-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetFolder: outputFolder.trim(),
              files: filesToSave,
            }),
          });
          setSavedFolderNotice(outputFolder.trim());
        } catch (saveErr) {
          console.warn('Failed to save bundle to target folder:', saveErr);
        }
      }

      triggerFileDownload(
        zipBlob,
        zipFilename,
        'application/zip'
      );
      setZipDownloaded(true);
      setTimeout(() => setZipDownloaded(false), 3000);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleDownloadSingle = async () => {
    if (outputFolder.trim()) {
      try {
        await fetch('/api/save-files', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetFolder: outputFolder.trim(),
            files: [{
              filename: currentCsvData.filename,
              content: currentCsvData.csvContent,
              subfolder: currentCsvData.subfolder,
            }],
          }),
        });
        setSavedFolderNotice(outputFolder.trim());
      } catch (err) {
        console.warn('Failed to save CSV to target folder:', err);
      }
    }

    triggerFileDownload(
      currentCsvData.csvContent,
      currentCsvData.filename,
      'text/csv;charset=utf-8;'
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Universal Marketplace CSV Exporter
              </h2>
              <p className="text-xs text-slate-400">
                Generating RFC-compliant CSVs tailored to each platform's character limits & headers.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Marketplace Selector Tabs */}
        <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-2 flex items-center space-x-1.5 overflow-x-auto custom-scrollbar shrink-0">
          {validMarketplaceIds.map((mId) => {
            const m = MARKETPLACES[mId];
            const isActive = mId === activeMarketplaceId;
            return (
              <button
                key={mId}
                onClick={() => setActiveMarketplaceId(mId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {m.name}
                {m.delimiter === ';' && (
                  <span className="ml-1 text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">;</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Folder Split and Sub-Filter Bar if multiple folders exist */}
        {hasMultipleFolders && (
          <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center space-x-2 overflow-x-auto custom-scrollbar py-0.5">
              <span className="text-amber-400 font-semibold flex items-center text-[11px] shrink-0">
                <Folder className="w-3.5 h-3.5 mr-1" />
                Folder Filter:
              </span>
              <button
                onClick={() => setSelectedFolderFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedFolderFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                All Folders ({files.length})
              </button>
              {distinctFolders.map((fName) => {
                const count = files.filter((f) => f.folderName === fName).length;
                return (
                  <button
                    key={fName}
                    onClick={() => setSelectedFolderFilter(fName)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0 cursor-pointer flex items-center space-x-1 ${
                      selectedFolderFilter === fName
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>📁</span>
                    <span>{fName}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white select-none bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
              <input
                type="checkbox"
                checked={splitByFolder}
                onChange={(e) => setSplitByFolder(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
              />
              <span className="text-[11px] text-amber-300 font-medium">Split individual CSVs by folder in ZIP</span>
            </label>
          </div>
        )}

        {/* Content Body: Platform Info + CSV Table Preview */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden space-y-3">
          {/* Output / Download Folder Destination Picker */}
          <FolderDestinationPicker
            value={outputFolder}
            onChange={setOutputFolder}
            lastSavedFolder={savedFolderNotice}
            label="CSV Output & Download Destination Folder"
            helpText="CSV files will be saved directly into this computer directory in addition to browser download."
          />

          {/* Marketplace Rules Notice */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center space-x-2 text-slate-300">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>{currentConfig.name} Specs:</strong> Max {currentConfig.titleLimits.maxChars} chars title, Max {currentConfig.keywordLimits.maxCount} keywords, Delimiter: <code className="text-cyan-400 font-mono">'{currentConfig.delimiter}'</code>.
                {currentConfig.specialNotes ? ` ${currentConfig.specialNotes}` : ''}
              </span>
            </div>

            <button
              onClick={handleDownloadSingle}
              className="flex items-center space-x-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-md transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>
                Download {selectedFolderFilter !== 'all' ? `[${selectedFolderFilter}] ` : ''}{currentConfig.name} CSV
              </span>
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800/90 overflow-auto custom-scrollbar text-xs">
            <table className="w-full text-left border-collapse font-mono text-[11px]">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10 text-slate-300">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-800 text-slate-500 w-10 text-center">#</th>
                  {currentCsvData.headers.map((h) => (
                    <th key={h} className="py-2 px-3 border-r border-slate-800 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {currentCsvData.previewRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 border-r border-slate-800/60 text-slate-600 text-center select-none">
                      {idx + 1}
                    </td>
                    {currentCsvData.headers.map((header) => (
                      <td
                        key={header}
                        className="py-2 px-3 border-r border-slate-800/60 max-w-[280px] truncate"
                        title={String(row[header] || '')}
                      >
                        {String(row[header] || '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <span>
              Ready to export <strong>{validMarketplaceIds.length}</strong> marketplace CSVs for{' '}
              <strong>{previewFiles.length}</strong> assets
              {selectedFolderFilter !== 'all' ? ` in folder "${selectedFolderFilter}"` : ` (${distinctFolders.length > 0 ? `${distinctFolders.length} folders` : 'all'})`}.
            </span>
            {outputFolder.trim() && (
              <span className="text-[11px] text-cyan-400 bg-cyan-950/50 border border-cyan-800/60 px-2 py-0.5 rounded font-mono truncate max-w-[280px]" title={outputFolder}>
                📁 {outputFolder}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              disabled={isExportingZip}
              onClick={handleDownloadZip}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              {zipDownloaded ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>ZIP Downloaded!</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4" />
                  <span>
                    {isExportingZip ? 'Packaging ZIP Archive...' : 'Download All Marketplaces (.zip)'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
