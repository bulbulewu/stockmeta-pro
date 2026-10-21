import React from 'react';
import { FileSpreadsheet, Binary, CheckCircle2, AlertCircle } from 'lucide-react';
import { StockFile } from '../types/stock';

interface ExportBottomBarProps {
  files: StockFile[];
  selectedMarketplaceCount: number;
  onOpenEmbedModal: () => void;
  onOpenCsvModal: () => void;
  isProcessing?: boolean;
}

export const ExportBottomBar: React.FC<ExportBottomBarProps> = ({
  files,
  selectedMarketplaceCount,
  onOpenEmbedModal,
  onOpenCsvModal,
  isProcessing = false,
}) => {
  const readyCount = files.filter((f) => f.status === 'ready').length;
  const hasFiles = files.length > 0;

  return (
    <footer className="h-14 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6 shrink-0 select-none z-20">
      {/* Left: Summary Stats */}
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-2">
          {readyCount > 0 ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-slate-500" />
          )}
          <span className="text-slate-300 font-medium">
            <strong className="text-white">{readyCount}</strong> of {files.length} assets ready
          </span>
        </div>

        <span className="text-slate-700">•</span>

        <span className="text-slate-400">
          Targeting <strong className="text-indigo-400">{selectedMarketplaceCount}</strong> Microstock Marketplaces
        </span>
      </div>

      {/* Right: Dual Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Button 1: Embed Metadata */}
        <button
          disabled={!hasFiles || isProcessing}
          onClick={onOpenEmbedModal}
          className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white px-4 py-2 rounded-lg font-medium text-xs transition-all border border-slate-700/80 shadow-sm cursor-pointer"
        >
          <Binary className="w-4 h-4 text-cyan-400" />
          <span>Embed Metadata into Files</span>
        </button>

        {/* Button 2: Export CSVs */}
        <button
          disabled={!hasFiles || isProcessing}
          onClick={onOpenCsvModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-white" />
          <span>Export Marketplace CSVs</span>
        </button>
      </div>
    </footer>
  );
};
