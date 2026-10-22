import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileImage,
  Video,
  FileCode,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Eye,
  Layers,
  Film,
  AlertTriangle,
  RefreshCw,
  ImagePlus,
  Wand2,
  Pause,
  Play,
  XCircle,
  SlidersHorizontal,
  FileSpreadsheet,
  Folder,
  FolderPlus,
} from 'lucide-react';
import { BatchProgress, StockFile } from '../types/stock';
import { extractBaseName, getFormatFromExtension } from '../utils/assetBundler';
import { cleanBaseName, generateSeoFilename } from '../utils/epsNativeProcessor';
import { buildHighRankingTitle } from '../utils/semanticKeywordExpander';
import { runTechnicalPreflight } from '../utils/technicalPreflight';
import { detectDuplicatesInBatch } from '../utils/perceptualHash';
import { fileRegistry } from '../services/fileRegistry';

interface WorkspaceDropzoneProps {
  files: StockFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  checkedFileIds: string[];
  onToggleCheckFile: (fileId: string) => void;
  onCheckAll: () => void;
  onUncheckAll: () => void;
  onFilesAdded: (newFiles: StockFile[]) => void;
  onRunBatchAnalysis: (fileIds: string[]) => void;
  isAnalyzing: boolean;
  batchProgress?: BatchProgress;
  onUpdateFile?: (file: StockFile) => void;
  onBatchUpdateFiles?: (files: StockFile[]) => void;
  onOpenBulkModal?: () => void;
  isQueuePaused?: boolean;
  onTogglePauseQueue?: () => void;
  onCancelQueue?: () => void;
  onOpenCsvModal?: () => void;
}

export const WorkspaceDropzone: React.FC<WorkspaceDropzoneProps> = ({
  files,
  selectedFileId,
  onSelectFile,
  checkedFileIds,
  onToggleCheckFile,
  onCheckAll,
  onUncheckAll,
  onFilesAdded,
  onRunBatchAnalysis,
  isAnalyzing,
  batchProgress,
  onUpdateFile,
  onBatchUpdateFiles,
  onOpenBulkModal,
  isQueuePaused,
  onTogglePauseQueue,
  onCancelQueue,
  onOpenCsvModal,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formatFilter, setFormatFilter] = useState<'all' | 'vector' | 'raster' | 'video'>('all');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [preflightFilter, setPreflightFilter] = useState<'all' | 'duplicates' | 'issues'>('all');
  const [isDetectingDuplicates, setIsDetectingDuplicates] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Collect unique folder names present in the current batch
  const availableFolders = Array.from(
    new Set(files.map((f) => f.folderName).filter(Boolean))
  ) as string[];

  // Filter files by format tab, folder group, & pre-flight status
  const filteredFiles = files.filter((f) => {
    if (formatFilter === 'vector' && !(f.format === 'svg' || f.format === 'eps' || f.format === 'ai')) return false;
    if (formatFilter === 'raster' && !(f.format === 'jpg' || f.format === 'jpeg' || f.format === 'png')) return false;
    if (formatFilter === 'video' && !(f.format === 'mp4' || f.format === 'mov' || f.format === 'mpg' || f.format === 'avi')) return false;

    if (folderFilter !== 'all' && (f.folderName || 'Uncategorized') !== folderFilter) return false;

    if (preflightFilter === 'duplicates' && !f.isNearDuplicate) return false;
    if (preflightFilter === 'issues') {
      const issues = runTechnicalPreflight(f, files);
      if (issues.length === 0) return false;
    }
    return true;
  });

  const handleScanDuplicates = async () => {
    setIsDetectingDuplicates(true);
    try {
      const updated = await detectDuplicatesInBatch(files);
      const duplicateCount = updated.filter((f) => f.isNearDuplicate).length;
      if (onBatchUpdateFiles) {
        onBatchUpdateFiles(updated);
      }
      setActionToast(
        duplicateCount > 0
          ? `Perceptual dHash Scan: ${duplicateCount} near-duplicate(s) flagged.`
          : 'Perceptual dHash Scan: No near-duplicates detected in batch!'
      );
      setTimeout(() => setActionToast(null), 3500);
    } catch {
      setActionToast('Duplicate scan encountered an error.');
    } finally {
      setIsDetectingDuplicates(false);
    }
  };

  const handleGenerateCompanionJpg = async (file: StockFile) => {
    try {
      const res = await fetch('/api/generate-companion-jpg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          format: file.format,
          base64Data: file.thumbnailBase64 || file.previewUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const companionFile: StockFile = {
          id: `file-comp-${Date.now()}`,
          name: data.companionFilename,
          baseName: file.baseName,
          size: data.size || 1024000,
          format: 'jpg',
          lastModified: Date.now(),
          previewUrl: data.companionBase64,
          thumbnailBase64: data.companionBase64,
          dimensions: { width: data.width, height: data.height },
          status: 'ready',
          metadata: { ...file.metadata },
        };
        onFilesAdded([companionFile]);
        setActionToast(`Created companion: ${data.companionFilename}`);
        setTimeout(() => setActionToast(null), 3000);
      }
    } catch {
      alert('Could not generate companion JPEG');
    }
  };

  const handleConvertVideo = async (file: StockFile) => {
    try {
      const res = await fetch('/api/convert-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          base64Data: file.thumbnailBase64 || file.previewUrl,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const convertedFile: StockFile = {
          ...file,
          id: `file-mp4-${Date.now()}`,
          name: data.newFilename,
          format: 'mp4',
          previewUrl: data.base64Data,
          videoSpecs: data.specs,
          status: 'ready',
        };
        if (onUpdateFile) {
          onUpdateFile(convertedFile);
        }
        setActionToast(`Transcoded ${file.name} to MP4 (H.264)!`);
        setTimeout(() => setActionToast(null), 3000);
      }
    } catch {
      alert('Could not convert video');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const extractFilesFromDataTransfer = async (dataTransfer: DataTransfer): Promise<File[]> => {
    const collectedFiles: File[] = [];

    const readDirectory = async (dirEntry: any, pathPrefix: string = ''): Promise<void> => {
      const dirReader = dirEntry.createReader();
      const readEntriesBatch = (): Promise<any[]> => {
        return new Promise((resolve) => {
          dirReader.readEntries(resolve, () => resolve([]));
        });
      };

      let entries: any[] = [];
      let batch: any[];
      do {
        batch = await readEntriesBatch();
        if (batch && batch.length > 0) {
          entries = entries.concat(batch);
        }
      } while (batch && batch.length > 0);

      for (const entry of entries) {
        if (entry.isFile) {
          await new Promise<void>((resolve) => {
            entry.file(
              (f: File) => {
                const relativePath = pathPrefix ? `${pathPrefix}/${f.name}` : `${dirEntry.name}/${f.name}`;
                try {
                  Object.defineProperty(f, 'webkitRelativePath', {
                    value: relativePath,
                    writable: false,
                  });
                } catch {}
                collectedFiles.push(f);
                resolve();
              },
              () => resolve()
            );
          });
        } else if (entry.isDirectory) {
          const nextPrefix = pathPrefix ? `${pathPrefix}/${entry.name}` : `${dirEntry.name}/${entry.name}`;
          await readDirectory(entry, nextPrefix);
        }
      }
    };

    const items = dataTransfer.items;
    if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind !== 'file') continue;
        const entry = item.webkitGetAsEntry();
        if (!entry) continue;

        if (entry.isFile) {
          const file = item.getAsFile();
          if (file) collectedFiles.push(file);
        } else if (entry.isDirectory) {
          await readDirectory(entry);
        }
      }
    } else if (dataTransfer.files) {
      for (let i = 0; i < dataTransfer.files.length; i++) {
        collectedFiles.push(dataTransfer.files[i]);
      }
    }

    return collectedFiles;
  };

  const processDroppedFiles = async (fileList: FileList | File[]) => {
    const newStockFiles: StockFile[] = [];
    const validExtensions = ['jpg', 'jpeg', 'png', 'svg', 'eps', 'ai', 'mp4', 'mov', 'mpg', 'mpeg', 'avi'];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = extractBaseName(file.name).ext.toLowerCase();

      // Skip directories, non-media files, or hidden system files (.DS_Store, Thumbs.db)
      if (!ext || !validExtensions.includes(ext) || file.name.startsWith('.')) {
        continue;
      }

      const relPath = (file as any).webkitRelativePath || '';
      let folderName: string | undefined = undefined;
      if (relPath && relPath.includes('/')) {
        folderName = relPath.split('/')[0];
      }
      const fmt = getFormatFromExtension(ext);
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Register native File handle for on-demand lazy reading (prevents 600 MB+ RAM bloating)
      fileRegistry.set(fileId, file);

      let preview = '';
      let extractedEpsText: string[] = [];
      let epsLiveStroke: boolean | undefined = undefined;
      let epsExpandedFill: boolean | undefined = undefined;
      let epsDetectedFonts: string[] | undefined = undefined;
      let epsFontWarning: string | undefined = undefined;

      // For EPS files: extract ONLY the lightweight ~4 KB thumbnail from XMP without holding 6 MB in memory
      if (fmt === 'eps') {
        const epsData = await fileRegistry.extractEpsThumbnailAndText(file);
        if (epsData.thumbnailBase64) {
          preview = epsData.thumbnailBase64;
        }
        if (epsData.extractedText.length > 0) {
          extractedEpsText = epsData.extractedText;
        }
        epsLiveStroke = epsData.hasLiveStroke;
        epsExpandedFill = epsData.isExpandedFill;
        epsDetectedFonts = epsData.detectedFonts;
        if (epsDetectedFonts && epsDetectedFonts.length > 0) {
          epsFontWarning = `Warning: Live unoutlined font (${epsDetectedFonts.join(', ')}) detected in EPS header. Convert text to outlines in Illustrator to prevent microstock rejection.`;
        }
      } else if (fmt === 'mp4' || fmt === 'mov' || fmt === 'mpg' || fmt === 'avi') {
        // Fast, native browser keyframe extraction via HTML5 Video
        try {
          const videoThumb = await fileRegistry.extractVideoKeyframe(file);
          if (videoThumb) {
            preview = videoThumb;
          } else {
            preview = URL.createObjectURL(file);
          }
        } catch {
          try { preview = URL.createObjectURL(file); } catch { preview = ''; }
        }
      } else if (fmt === 'svg' || fmt === 'jpg' || fmt === 'jpeg' || fmt === 'png') {
        // Create browser blob URL (0 bytes heap RAM overhead)
        try {
          preview = URL.createObjectURL(file);
        } catch {
          preview = '';
        }
      }

      const sanitizedBase = cleanBaseName(file.name);
      const initialTitle = buildHighRankingTitle(sanitizedBase, fmt, extractedEpsText, epsLiveStroke ?? true);
      const seoFilename = generateSeoFilename(initialTitle, file.name);

      newStockFiles.push({
        id: fileId,
        name: file.name,
        baseName: sanitizedBase,
        folderName,
        relativePath: relPath || undefined,
        seoFilename,
        extractedEpsText,
        hasLiveStroke: epsLiveStroke,
        isExpandedFill: epsExpandedFill,
        detectedFonts: epsDetectedFonts,
        fontWarning: epsFontWarning,
        size: file.size,
        format: fmt,
        lastModified: file.lastModified,
        previewUrl: preview,
        thumbnailBase64: preview,
        status: 'idle',
        metadata: {
          title: initialTitle,
          description: '',
          keywords: [],
          primaryCategory: fmt === 'eps' || fmt === 'svg' ? 'Graphic Resources & Vectors' : 'Nature & Landscapes',
          editorial: false,
          matureContent: false,
          releasesRequired: false,
          seoFilename,
          extractedEpsText,
          hasLiveStroke: epsLiveStroke,
          isExpandedFill: epsExpandedFill,
          detectedFonts: epsDetectedFonts,
          fontWarning: epsFontWarning,
        },
      });

      // Non-blocking yield to browser event loop every 5 files to maintain 60 FPS
      if (i % 5 === 0) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    onFilesAdded(newStockFiles);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const filesToProcess = await extractFilesFromDataTransfer(e.dataTransfer);
    if (filesToProcess.length > 0) {
      await processDroppedFiles(filesToProcess);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processDroppedFiles(e.target.files);
    }
  };

  const allChecked = files.length > 0 && checkedFileIds.length === files.length;

  return (
    <main
      className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        multiple
        accept=".jpg,.jpeg,.png,.svg,.eps,.ai,.mp4,.mov,.mpg,.mpeg,.avi"
        className="hidden"
      />

      {/* Hidden folder input */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFileInputChange}
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
      />

      {/* Workspace Top Toolbar */}
      <div className="h-11 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 text-xs">
        {/* Left: Selection, Upload Buttons, and Format Filters */}
        <div className="flex items-center space-x-3">
          <button
            onClick={allChecked ? onUncheckAll : onCheckAll}
            className="flex items-center space-x-1.5 text-slate-300 hover:text-white font-medium cursor-pointer"
          >
            {allChecked ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Select All ({files.length})</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          {/* Upload Shortcut Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[11px] font-medium border border-slate-700/80 transition-colors cursor-pointer"
              title="Add individual media files"
            >
              <span>+ Files</span>
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center space-x-1 px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 hover:text-white rounded text-[11px] font-medium border border-amber-700/60 transition-colors cursor-pointer"
              title="Upload entire folder or multiple folders"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Folder(s)</span>
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Format Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
            {(['all', 'vector', 'raster', 'video'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFormatFilter(tab)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                  formatFilter === tab
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Pre-Flight & Duplicate Filters */}
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
            <button
              onClick={() => setPreflightFilter('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                preflightFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Quality
            </button>
            <button
              onClick={() => setPreflightFilter('issues')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                preflightFilter === 'issues'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Issues</span>
              <span className="text-[9px] font-mono bg-slate-900 px-1 rounded text-amber-400">
                {files.filter((f) => runTechnicalPreflight(f, files).length > 0).length}
              </span>
            </button>
            <button
              onClick={() => setPreflightFilter('duplicates')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                preflightFilter === 'duplicates'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Duplicates</span>
              <span className="text-[9px] font-mono bg-slate-900 px-1 rounded text-rose-400">
                {files.filter((f) => f.isNearDuplicate).length}
              </span>
            </button>
          </div>

          {/* Batch AI Trigger (Brought to left side of Scan Duplicates) */}
          <button
            disabled={isAnalyzing || files.length === 0}
            onClick={() => onRunBatchAnalysis(checkedFileIds.length > 0 ? checkedFileIds : files.map((f) => f.id))}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white px-3 py-1 rounded-md text-[11px] font-medium shadow-sm transition-all cursor-pointer"
            title="Run Multi-Provider Vision AI analysis on assets"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>
              {isAnalyzing
                ? `Analyzing (${batchProgress?.completed || 0}/${batchProgress?.total || files.length})...`
                : checkedFileIds.length > 0
                ? `Analyze Selected (${checkedFileIds.length})`
                : `Analyze All (${files.length})`}
            </span>
          </button>

          {/* Perceptual Hash Duplicate Scan Trigger */}
          <button
            onClick={handleScanDuplicates}
            disabled={isDetectingDuplicates || files.length === 0}
            className="flex items-center space-x-1 text-[11px] bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white px-2.5 py-1 rounded-md border border-slate-700 transition-colors cursor-pointer"
            title="Compute 8x8 dHash and flag near-duplicate series shots"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${isDetectingDuplicates ? 'animate-spin' : ''}`} />
            <span>Scan Duplicates</span>
          </button>

          {/* Bulk Metadata Editor Trigger */}
          {onOpenBulkModal && (
            <button
              onClick={onOpenBulkModal}
              disabled={files.length === 0}
              className="flex items-center space-x-1 text-[11px] bg-indigo-950/60 hover:bg-indigo-900/60 disabled:opacity-50 text-indigo-300 hover:text-white px-2.5 py-1 rounded-md border border-indigo-800/80 transition-colors cursor-pointer"
              title="Batch edit keywords, titles, descriptions, categories"
            >
              <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
              <span>
                {checkedFileIds.length > 0 ? `Bulk Edit (${checkedFileIds.length})` : 'Bulk Edit'}
              </span>
            </button>
          )}

          {/* Retry Failed Files Button */}
          {files.some((f) => f.status === 'error') && (
            <button
              onClick={() => onRunBatchAnalysis(files.filter((f) => f.status === 'error').map((f) => f.id))}
              disabled={isAnalyzing}
              className="flex items-center space-x-1 text-[11px] bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 hover:text-white px-2.5 py-1 rounded-md border border-rose-800/80 transition-colors cursor-pointer"
              title="Re-run AI generation for failed files"
            >
              <RefreshCw className="w-3 h-3 text-rose-400" />
              <span>
                Retry Failed ({files.filter((f) => f.status === 'error').length})
              </span>
            </button>
          )}

          {/* One-click Export Adobe Stock CSV Button for Completed Files */}
          {onOpenCsvModal && files.some((f) => f.status === 'ready' || f.status === 'embedded') && (
            <button
              onClick={onOpenCsvModal}
              className="flex items-center space-x-1 text-[11px] bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 hover:text-white px-2.5 py-1 rounded-md border border-emerald-800/80 transition-colors cursor-pointer"
              title="Export Adobe Stock CSV for completed files"
            >
              <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
              <span>
                Export CSV ({files.filter((f) => f.status === 'ready' || f.status === 'embedded').length})
              </span>
            </button>
          )}
        </div>

        {/* Right: View Switcher */}
        <div className="flex items-center space-x-3">
          {/* Grid / List Switch */}
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Folder Groups Sub-Bar (Active when folder-wise files exist) */}
      {availableFolders.length > 0 && (
        <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 flex items-center space-x-2 text-xs overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center space-x-1 shrink-0">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Folder Groups:</span>
          </span>
          <button
            onClick={() => setFolderFilter('all')}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
              folderFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All Folders ({files.length})
          </button>
          {availableFolders.map((fName) => {
            const count = files.filter((f) => (f.folderName || 'Uncategorized') === fName).length;
            const isAct = folderFilter === fName;
            return (
              <button
                key={fName}
                onClick={() => setFolderFilter(fName)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                  isAct
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                📁 {fName} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Action Toast Notification */}
      {actionToast && (
        <div className="bg-indigo-950/80 border-b border-indigo-700/60 text-indigo-200 px-4 py-1.5 text-xs flex items-center justify-between shrink-0">
          <span className="font-medium">{actionToast}</span>
          <button onClick={() => setActionToast(null)} className="text-indigo-400 hover:text-white cursor-pointer ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Progress banner during batch analysis */}
      {isAnalyzing && batchProgress && (
        <div className="bg-indigo-950/80 border-b border-indigo-500/50 px-4 py-2 flex items-center justify-between text-xs text-indigo-200 shrink-0">
          <div className="flex items-center space-x-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isQueuePaused ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400 animate-ping'}`} />
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-100">
                {isQueuePaused ? '⏸️ Queue Paused:' : 'Processing AI Queue:'}
              </span>
              <span className="text-cyan-300 font-semibold font-mono">
                {batchProgress.completed} / {batchProgress.total} files ({Math.round(batchProgress.total > 0 ? (batchProgress.completed / batchProgress.total) * 100 : 0)}%)
              </span>
              {batchProgress.estimatedSecondsRemaining !== undefined && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-300 font-mono">
                    Estimated time remaining: {batchProgress.estimatedSecondsRemaining}s
                  </span>
                </>
              )}
              <span className="text-slate-500">•</span>
              <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-indigo-800/60 text-indigo-300">
                Worker Pool = 3 (Safe Paced)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Progress Bar */}
            <div className="w-48 bg-slate-900 border border-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isQueuePaused
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400'
                }`}
                style={{
                  width: `${batchProgress.total > 0 ? (batchProgress.completed / batchProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="text-[11px] font-mono text-cyan-400 min-w-[34px] text-right">
              {Math.round(batchProgress.total > 0 ? (batchProgress.completed / batchProgress.total) * 100 : 0)}%
            </span>

            {/* Pause / Resume button */}
            {onTogglePauseQueue && (
              <button
                onClick={onTogglePauseQueue}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer"
                title={isQueuePaused ? 'Resume AI queue processing' : 'Pause queue after active request'}
              >
                {isQueuePaused ? (
                  <>
                    <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Pause</span>
                  </>
                )}
              </button>
            )}

            {/* Cancel button */}
            {onCancelQueue && (
              <button
                onClick={onCancelQueue}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-[11px] font-medium border border-rose-800/60 transition-colors cursor-pointer"
                title="Cancel remaining batch queue"
              >
                <XCircle className="w-3 h-3 text-rose-400" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Center Cards Grid / Empty State */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {files.length === 0 ? (
          /* Empty Drag & Drop Zone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`h-full min-h-[360px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-950/20 text-indigo-300'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-400'
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-indigo-400 shadow-xl">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-base font-semibold text-slate-200 mb-1">
              Drop batch stock files here or browse
            </h3>
            <p className="text-xs text-slate-500 max-w-md mb-4">
              Supports <strong className="text-slate-300">JPG, PNG, SVG, EPS, AI, MP4, MOV, MPG, AVI</strong>.
              Automatic companion pairing detects vectors and matching <code className="text-indigo-400">.jpg</code> previews into unified design bundles!
            </p>

            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono">EPS / AI + JPG</span>
              <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono">SVG Vector</span>
              <span className="bg-slate-900 px-2 py-1 rounded border border-slate-800 font-mono">4K MP4 / MOV / AVI</span>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const isSelected = selectedFileId === file.id;
              const isChecked = checkedFileIds.includes(file.id);

              return (
                <div
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`group relative rounded-xl border bg-slate-900/90 overflow-hidden flex flex-col transition-all cursor-pointer shadow-md ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-indigo-500/10'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header & Checkbox */}
                  <div className="absolute top-2 left-2 z-10 flex items-center space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCheckFile(file.id);
                      }}
                      className="w-5 h-5 rounded bg-slate-950/80 backdrop-blur-sm border border-slate-700/80 flex items-center justify-center text-white hover:border-indigo-400 transition-colors"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>
                  </div>

                  {/* Format & Status Badges */}
                  <div className="absolute top-2 right-2 z-10 flex items-center space-x-1">
                    {/* Format Badge */}
                    <span className="text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-slate-950/90 backdrop-blur-sm text-cyan-300 border border-slate-700/80">
                      {file.format}
                    </span>

                    {/* Status badge */}
                    {file.status === 'ready' && (
                      <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-800/80">
                        <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                        Completed
                      </span>
                    )}
                    {file.status === 'analyzing' && (
                      <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-800/80 animate-pulse">
                        <Clock className="w-2.5 h-2.5 mr-1 animate-spin" />
                        AI Generating
                      </span>
                    )}
                    {file.status === 'extracting' && (
                      <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800/80 animate-pulse">
                        <Clock className="w-2.5 h-2.5 mr-1 animate-spin" />
                        Extracting Preview
                      </span>
                    )}
                    {file.status === 'embedding' && (
                      <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/90 text-indigo-300 border border-indigo-800/80 animate-pulse">
                        <Clock className="w-2.5 h-2.5 mr-1 animate-spin" />
                        Embedding EPS
                      </span>
                    )}
                    {file.status === 'queued' && (
                      <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        Queued
                      </span>
                    )}
                    {file.status === 'error' && (
                      <span className="flex items-center text-[10px] px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800/80" title={file.errorMessage}>
                        <AlertCircle className="w-2.5 h-2.5 mr-1" />
                        Failed
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Container */}
                  <div className="h-44 bg-slate-950 flex items-center justify-center overflow-hidden relative">
                    {file.previewUrl ? (
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-102 transition-transform duration-200"
                      />
                    ) : file.format === 'mp4' || file.format === 'mov' || file.format === 'mpg' || file.format === 'avi' ? (
                      <div className="flex flex-col items-center justify-center text-slate-600">
                        <Film className="w-10 h-10 mb-1 text-indigo-400/60" />
                        <span className="text-[11px]">Video Asset</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600">
                        <FileImage className="w-10 h-10 mb-1" />
                        <span className="text-[11px]">{file.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Pre-Flight & Duplicate Alerts */}
                  {(() => {
                    const issues = runTechnicalPreflight(file, files);
                    const isVectorMissingJpg = issues.some((i) => i.code === 'VECTOR_MISSING_JPG');
                    const isLegacyVideo = issues.some((i) => i.code === 'VIDEO_LEGACY_CONTAINER');
                    const isLowRes = issues.some((i) => i.code === 'JPEG_LOW_RES');
                    const liveFontIssue = issues.find((i) => i.code === 'EPS_LIVE_FONT');
                    const strokeMismatchIssue = issues.find((i) => i.code === 'EXPANDED_STROKE_MISMATCH');
                    const isDuplicate = file.isNearDuplicate;

                    if (!isVectorMissingJpg && !isLegacyVideo && !isLowRes && !isDuplicate && !liveFontIssue && !strokeMismatchIssue) return null;

                    return (
                      <div className="px-2.5 py-1.5 bg-slate-950 border-t border-slate-800 space-y-1 text-[10px]">
                        {liveFontIssue && (
                          <div className="text-amber-300 font-mono font-medium flex items-center gap-1 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-500/40">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate" title={liveFontIssue.message}>Live Font Detected (Outline required)</span>
                          </div>
                        )}
                        {strokeMismatchIssue && (
                          <div className="text-cyan-300 font-mono font-medium flex items-center gap-1 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            <AlertTriangle className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate" title={strokeMismatchIssue.message}>Expanded Fills (Use Outline)</span>
                          </div>
                        )}
                        {isDuplicate && (
                          <div className="text-rose-400 font-mono font-medium flex items-center justify-between">
                            <span className="flex items-center gap-1 truncate">
                              <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="truncate">{file.duplicateOfName ? `Dup: ${file.duplicateOfName}` : 'Near Duplicate'}</span>
                            </span>
                          </div>
                        )}
                        {isLowRes && (
                          <div className="text-amber-400 font-mono font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>Low Res (&lt;4 MP minimum)</span>
                          </div>
                        )}
                        {isVectorMissingJpg && (
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-cyan-400 font-mono">No Companion JPG</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateCompanionJpg(file);
                              }}
                              className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Generate matching companion preview JPEG"
                            >
                              <ImagePlus className="w-2.5 h-2.5" />
                              <span>+ Create JPG</span>
                            </button>
                          </div>
                        )}
                        {isLegacyVideo && (
                          <div className="flex items-center justify-between pt-0.5">
                            <span className="text-amber-400 font-mono">{file.format.toUpperCase()} (Legacy)</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConvertVideo(file);
                              }}
                              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                              title="Convert to MP4 (H.264)"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Convert MP4</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Card Metadata Footer */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800/80 flex-1 flex flex-col justify-between">
                    <div>
                      {file.folderName && (
                        <div className="flex items-center space-x-1 mb-1 text-[10px] text-amber-300 font-mono">
                          <Folder className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[140px] bg-amber-950/50 px-1 py-0.5 rounded border border-amber-800/50">
                            {file.folderName}
                          </span>
                        </div>
                      )}
                      <p className="text-xs font-medium text-slate-200 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {file.metadata.title || 'Untitled asset (click to edit)'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] text-slate-500">
                      <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className="text-indigo-400 font-mono font-medium">
                        {file.metadata.keywords.length} tags
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3 w-8"></th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Format</th>
                  <th className="py-2.5 px-3">Title Preview</th>
                  <th className="py-2.5 px-3">Keywords</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileId === file.id;
                  const isChecked = checkedFileIds.includes(file.id);

                  return (
                    <tr
                      key={file.id}
                      onClick={() => onSelectFile(file.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-950/40 text-slate-100'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onToggleCheckFile(file.id)}
                          className="text-slate-500 hover:text-white"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-200 truncate max-w-[220px]">
                        <div className="flex items-center space-x-1.5 truncate">
                          {file.folderName && (
                            <span className="inline-flex items-center space-x-1 text-[9px] font-mono text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60 shrink-0">
                              <Folder className="w-2.5 h-2.5 text-amber-400" />
                              <span>{file.folderName}</span>
                            </span>
                          )}
                          <span className="truncate" title={file.name}>{file.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono uppercase text-[10px] text-cyan-400">
                        {file.format}
                      </td>
                      <td className="py-2 px-3 truncate max-w-[320px] text-slate-400">
                        {file.metadata.title || '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-indigo-300">
                        {file.metadata.keywords.length} tags
                      </td>
                      <td className="py-2 px-3">
                        {file.status === 'ready' && (
                          <span className="text-emerald-400 font-medium text-[11px] flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                            Completed
                          </span>
                        )}
                        {file.status === 'analyzing' && (
                          <span className="text-amber-400 font-medium text-[11px] animate-pulse flex items-center">
                            <Clock className="w-3 h-3 mr-1 animate-spin text-amber-400" />
                            AI Generating
                          </span>
                        )}
                        {file.status === 'extracting' && (
                          <span className="text-cyan-400 font-medium text-[11px] animate-pulse flex items-center">
                            <Clock className="w-3 h-3 mr-1 animate-spin text-cyan-400" />
                            Extracting Preview
                          </span>
                        )}
                        {file.status === 'embedding' && (
                          <span className="text-indigo-400 font-medium text-[11px] animate-pulse flex items-center">
                            <Clock className="w-3 h-3 mr-1 animate-spin text-indigo-400" />
                            Embedding EPS
                          </span>
                        )}
                        {file.status === 'queued' && (
                          <span className="text-slate-400 text-[11px]">Queued</span>
                        )}
                        {file.status === 'error' && (
                          <span className="text-rose-400 font-medium text-[11px] flex items-center" title={file.errorMessage}>
                            <AlertCircle className="w-3 h-3 mr-1 text-rose-400" />
                            Failed
                          </span>
                        )}
                        {file.status === 'idle' && (
                          <span className="text-slate-500 text-[11px]">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drop zone overlay indicator */}
      {isDragOver && (
        <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-sm border-4 border-dashed border-indigo-400 z-50 flex flex-col items-center justify-center text-white pointer-events-none">
          <UploadCloud className="w-16 h-16 mb-2 animate-bounce text-cyan-300" />
          <h2 className="text-xl font-bold">Release to ingest batch assets</h2>
          <p className="text-sm text-indigo-200 mt-1">
            Auto-pairing companions (.eps + .jpg) and vector preview extraction
          </p>
        </div>
      )}
    </main>
  );
};
