import React, { useState } from 'react';
import { X, Binary, Download, Check, ShieldCheck, FolderSync, Info, HardDrive, FileCheck, Tag, Sparkles, ExternalLink } from 'lucide-react';
import { StockFile } from '../types/stock';
import { embedMetadataIntoFiles } from '../services/fileEmbedderClient';
import { triggerFileDownload } from '../utils/universalExportManager';
import { FolderDestinationPicker } from './FolderDestinationPicker';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StockFile[];
}

/**
 * Helper to generate SEO-optimized slug filename
 */
function toSeoSlugFilename(title: string, originalName: string): string {
  const lastDot = originalName.lastIndexOf('.');
  const ext = lastDot !== -1 ? originalName.slice(lastDot).toLowerCase() : '';
  if (!title || !title.trim()) return originalName;

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 75)
    .replace(/-+$/, '');

  return slug ? `${slug}${ext}` : originalName;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose, files }) => {
  if (!isOpen) return null;

  const [overwriteOriginals, setOverwriteOriginals] = useState(false);
  const [syncEpsCompanionJpg, setSyncEpsCompanionJpg] = useState(true);
  const [renameToSeoSlug, setRenameToSeoSlug] = useState(true);
  const [includeSidecarsAndLogs, setIncludeSidecarsAndLogs] = useState(false);
  const [exportFolder, setExportFolder] = useState('/SEO_Embedded');
  const [outputFolder, setOutputFolder] = useState<string>(() => {
    try {
      return localStorage.getItem('stockmeta_custom_output_folder') || '';
    } catch {
      return '';
    }
  });
  const [savedFolderNotice, setSavedFolderNotice] = useState<string | null>(null);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [embedDone, setEmbedDone] = useState(false);
  const [lastZipBlob, setLastZipBlob] = useState<Blob | null>(null);
  const [reportResult, setReportResult] = useState<any>(null);

  const handleStartEmbedding = async () => {
    try {
      setIsEmbedding(true);
      const { zipBlob, response } = await embedMetadataIntoFiles(files, {
        overwriteOriginals,
        exportFolder,
        customOutputFolder: outputFolder.trim() || undefined,
        syncEpsCompanionJpg,
        embedExif: true,
        embedIptc: true,
        embedXmp: true,
        embedQuickTime: true,
        renameToSeoSlug,
        includeSidecarsAndLogs,
      });

      setLastZipBlob(zipBlob);
      setReportResult(response);
      setEmbedDone(true);
      if (outputFolder.trim()) {
        setSavedFolderNotice(outputFolder.trim());
      }

      const now = new Date().toISOString().split('T')[0];
      triggerFileDownload(
        zipBlob,
        `StockMeta_Pro_SEO_Embedded_Batch_${now}.zip`,
        'application/zip'
      );
    } catch (err: any) {
      alert(`Embedding error: ${err.message}`);
    } finally {
      setIsEmbedding(false);
    }
  };

  const handleDownloadAllAgain = () => {
    if (!lastZipBlob) return;
    const now = new Date().toISOString().split('T')[0];
    triggerFileDownload(
      lastZipBlob,
      `StockMeta_Pro_SEO_Embedded_Batch_${now}.zip`,
      'application/zip'
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Binary className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Direct File Metadata Embedding & SEO Renaming</h2>
              <p className="text-xs text-slate-400">
                Write Title, Description & Keywords into EXIF, IPTC, XMP & QuickTime atoms for direct upload.
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

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto custom-scrollbar">
          {/* SEO Filename Renaming Card */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white">SEO Keyword-Rich File Renaming</h3>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={renameToSeoSlug}
                  onChange={(e) => setRenameToSeoSlug(e.target.checked)}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-200 font-medium">Auto-Rename (Recommended)</span>
              </label>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Adobe Stock, Shutterstock, and Google Images heavily rank assets by filename keywords. When enabled, your files are automatically renamed to clean SEO slugs derived from their commercial titles.
            </p>

            {/* Microstock Convenience Notice */}
            <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Important Notice:</strong> Direct file metadata embedding is a convenience feature. Some agencies (or FTP ingestion channels) occasionally strip or ignore embedded tags during upload. <strong>Always export and upload the matching platform CSV</strong> alongside your files for 100% submission reliability!
              </span>
            </div>

            {/* Live Filename Transformation Preview */}
            {files.length > 0 && (
              <div className="bg-slate-950/90 border border-slate-800/80 rounded-lg p-2.5 font-mono text-[11px] space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-sans font-semibold">
                  Filename Transformation Preview:
                </div>
                {files.slice(0, 3).map((f) => {
                  const targetName = renameToSeoSlug
                    ? toSeoSlugFilename(f.metadata.title, f.name)
                    : f.name;
                  return (
                    <div key={f.id} className="flex items-center space-x-2 text-[10px] truncate">
                      <span className="text-slate-500 truncate max-w-[200px]" title={f.name}>
                        {f.name}
                      </span>
                      <span className="text-indigo-400 font-bold shrink-0">➔</span>
                      <span className="text-emerald-300 truncate font-semibold" title={targetName}>
                        {targetName}
                      </span>
                    </div>
                  );
                })}
                {files.length > 3 && (
                  <div className="text-[10px] text-slate-500 italic font-sans pt-1">
                    + {files.length - 3} more files will be renamed...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Success Status Banner with Re-Download Button */}
          {embedDone && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs">All Files Embedded & Renamed!</div>
                  <div className="text-[11px] text-emerald-300/80">
                    {files.length} files successfully written with Title, Description, and Keywords.
                  </div>
                  {outputFolder.trim() && (
                    <div className="text-[11px] text-cyan-300 flex items-center space-x-1.5 mt-1 font-mono">
                      <span>Saved directly to:</span>
                      <span className="font-semibold">{outputFolder}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {outputFolder.trim() && (
                  <button
                    onClick={() => {
                      fetch('/api/open-folder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ folderPath: outputFolder.trim() }),
                      });
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Folder</span>
                  </button>
                )}
                <button
                  onClick={handleDownloadAllAgain}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Re-Download ZIP</span>
                </button>
              </div>
            </div>
          )}

          {/* Local Computer Output Folder Picker */}
          <FolderDestinationPicker
            value={outputFolder}
            onChange={setOutputFolder}
            label="Local Output / Download Destination Folder"
            helpText="When set, all embedded files will be saved directly into this local folder on your computer in addition to downloading the ZIP archive."
            lastSavedFolder={savedFolderNotice}
          />

          {/* Target Folder Configuration */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <h3 className="font-semibold text-slate-200 flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Target Output Destination</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setOverwriteOriginals(false)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  !overwriteOriginals
                    ? 'bg-indigo-950/40 border-indigo-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-medium text-slate-200">Export to Subfolder (Safe & Recommended)</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Package all embedded files into <code className="text-cyan-400">/SEO_Embedded</code> archive
                </div>
              </label>

              <label
                onClick={() => setOverwriteOriginals(true)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  overwriteOriginals
                    ? 'bg-rose-950/40 border-rose-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-medium text-slate-200">Overwrite Originals</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Direct binary replace via ExifTool + XMP writer
                </div>
              </label>
            </div>
          </div>

          {/* Clean Stock-Ready Media Output Filter & Sidecar Toggle */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-white text-xs">Stock-Ready Clean Output</span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSidecarsAndLogs}
                  onChange={(e) => setIncludeSidecarsAndLogs(e.target.checked)}
                  className="rounded accent-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-300 font-medium">Include .XMP sidecars & .TXT report</span>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {includeSidecarsAndLogs
                ? '📦 Media files will stay in /SEO_Embedded. Sidecar .xmp files and verification log will be saved into a separate /Sidecars_and_Logs subfolder.'
                : '✨ Stock-Ready Mode (Default): Only media files (.eps, .jpg, .png, .svg, .mp4) will be placed inside /SEO_Embedded so you can Select-All and drag directly into Adobe Stock, Shutterstock, or FTP without any file clutter.'}
            </p>
          </div>

          {/* Smart Companion Vector Pairing Notice */}
          <div className="p-3.5 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-start space-x-3 text-indigo-200">
            <FolderSync className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-white">Smart Vector & Companion Preview Sync</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Both the vector (<code className="text-cyan-300">.eps/.svg</code>) and companion preview (<code className="text-cyan-300">.jpg/.png</code>) will share the exact matching SEO filename and IPTC/XMP tags, making them immediately recognized and auto-paired by Adobe Stock and Shutterstock.
              </p>
            </div>
          </div>

          {/* Tag Mappings Table */}
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Embedded Metadata Specifications
            </div>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-[11px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="py-2 px-3">Field</th>
                    <th className="py-2 px-3">Binary Headers Written</th>
                    <th className="py-2 px-3">Target Formats</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2 px-3 font-semibold text-white">Content Title</td>
                    <td className="py-2 px-3 text-cyan-400">XMP:Title, IPTC:ObjectName, Title, QuickTime:Title</td>
                    <td className="py-2 px-3 text-slate-400">EPS, SVG, JPG, PNG, MP4, MOV</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-white">Description</td>
                    <td className="py-2 px-3 text-cyan-400">XMP:Description, IPTC:Caption-Abstract, Exif:ImageDescription</td>
                    <td className="py-2 px-3 text-slate-400">EPS, SVG, JPG, PNG, MP4, MOV</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-white">Keywords</td>
                    <td className="py-2 px-3 text-cyan-400">XMP:Subject, IPTC:Keywords, Keywords, QuickTime:Keywords</td>
                    <td className="py-2 px-3 text-slate-400">All Formats (Ranked)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-semibold text-white">EPS XMP</td>
                    <td className="py-2 px-3 text-cyan-400">Native Adobe XMP Core Toolkit injection</td>
                    <td className="py-2 px-3 text-slate-400">EPS, AI</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ExifTool & Adobe XMP Writer Ready</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              disabled={isEmbedding || files.length === 0}
              onClick={handleStartEmbedding}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-medium text-xs shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              {embedDone ? (
                <>
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Download All Embedded Files (.zip)</span>
                </>
              ) : (
                <>
                  <Binary className="w-4 h-4" />
                  <span>{isEmbedding ? 'Injecting Metadata & Renaming...' : 'Embed & Download All Files (.zip)'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
