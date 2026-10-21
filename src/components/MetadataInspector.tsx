import React, { useState } from 'react';
import {
  Sparkles,
  Tag,
  Copy,
  Check,
  AlertTriangle,
  X,
  Plus,
  Layers,
  FileText,
  Sliders,
  CheckCircle2,
  Trash2,
  GripVertical,
  Wand2,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
} from 'lucide-react';
import { StockFile } from '../types/stock';
import { ADOBE_CATEGORIES, GENERAL_CATEGORIES, MARKETPLACES } from '../config/marketplaces';
import { FORMAT_SPECIFIC_TAGS } from '../utils/negativeKeywords';
import {
  validateFileMetadata,
  autoFixIssue,
  autoFixAllIssues,
  ValidationIssue,
} from '../services/marketplaceValidator';
import { evaluateComplianceRisks } from '../services/complianceRiskService';
import { adaptFileToMarketplaces } from '../services/canonicalAssetService';

interface MetadataInspectorProps {
  selectedFile: StockFile | null;
  selectedMarketplaceIds: string[];
  onUpdateMetadata: (fileId: string, updatedMetadata: Partial<StockFile['metadata']>) => void;
  onRegenerateSingle: (fileId: string) => void;
  onDuplicateToAll: (fileId: string) => void;
  isAnalyzing: boolean;
  onOpenRiskModal?: () => void;
}

export const MetadataInspector: React.FC<MetadataInspectorProps> = ({
  selectedFile,
  selectedMarketplaceIds,
  onUpdateMetadata,
  onRegenerateSingle,
  onDuplicateToAll,
  isAnalyzing,
  onOpenRiskModal,
}) => {
  const [newTagInput, setNewTagInput] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [fixedToast, setFixedToast] = useState<string | null>(null);
  const [draggedTagIndex, setDraggedTagIndex] = useState<number | null>(null);
  const [previewMarketplaceId, setPreviewMarketplaceId] = useState<string>('adobe');

  if (!selectedFile) {
    return (
      <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col items-center justify-center p-6 text-center select-none text-slate-500 text-xs">
        <FileText className="w-10 h-10 mb-2 opacity-30 text-indigo-400" />
        <p className="font-medium text-slate-400">No Asset Selected</p>
        <p className="mt-1 text-slate-500 max-w-[200px]">
          Select any asset from the workspace to inspect and edit microstock SEO metadata.
        </p>
      </aside>
    );
  }

  const { metadata, format, name, size } = selectedFile;
  const titleCharCount = metadata.title.length;
  const descCharCount = metadata.description.length;
  const wordsCount = metadata.title.trim().split(/\s+/).filter(Boolean).length;

  // Real-time compliance validation
  const validationReport = validateFileMetadata(selectedFile, selectedMarketplaceIds);

  const handleFixIssue = (issue: ValidationIssue) => {
    const fixed = autoFixIssue(metadata, issue);
    onUpdateMetadata(selectedFile.id, fixed);
    setFixedToast(`Fixed: ${issue.field} updated`);
    setTimeout(() => setFixedToast(null), 2500);
  };

  const handleFixAll = () => {
    const fixed = autoFixAllIssues(metadata, validationReport.issues);
    onUpdateMetadata(selectedFile.id, fixed);
    setFixedToast('All marketplace issues auto-fixed!');
    setTimeout(() => setFixedToast(null), 2500);
  };

  const handleTitleChange = (val: string) => {
    onUpdateMetadata(selectedFile.id, { title: val });
  };

  const handleDescChange = (val: string) => {
    onUpdateMetadata(selectedFile.id, { description: val });
  };

  const handleAddTags = () => {
    if (!newTagInput.trim()) return;
    const rawTokens = newTagInput
      .split(/[,;\n]+/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 1);

    const existingSet = new Set(metadata.keywords.map((k) => k.toLowerCase()));
    const newTags: string[] = [];

    rawTokens.forEach((t) => {
      if (!existingSet.has(t)) {
        existingSet.add(t);
        newTags.push(t);
      }
    });

    onUpdateMetadata(selectedFile.id, {
      keywords: [...metadata.keywords, ...newTags],
    });
    setNewTagInput('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    const updated = metadata.keywords.filter((_, i) => i !== indexToRemove);
    onUpdateMetadata(selectedFile.id, { keywords: updated });
  };

  const handleCopyKeywords = () => {
    navigator.clipboard.writeText(metadata.keywords.join(', '));
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleAppendFormatTags = () => {
    const tagsForFormat = FORMAT_SPECIFIC_TAGS[format] || [];
    const existingSet = new Set(metadata.keywords.map((k) => k.toLowerCase()));
    const toAdd = tagsForFormat.filter((t) => !existingSet.has(t));
    if (toAdd.length > 0) {
      onUpdateMetadata(selectedFile.id, {
        keywords: [...metadata.keywords, ...toAdd],
      });
    }
  };

  // Drag and drop reordering of keyword pills
  const handleDragStart = (index: number) => {
    setDraggedTagIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedTagIndex === null || draggedTagIndex === index) return;
    const reordered = [...metadata.keywords];
    const [draggedItem] = reordered.splice(draggedTagIndex, 1);
    reordered.splice(index, 0, draggedItem);
    setDraggedTagIndex(index);
    onUpdateMetadata(selectedFile.id, { keywords: reordered });
  };

  const handleDragEnd = () => {
    setDraggedTagIndex(null);
  };

  return (
    <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden select-none text-xs">
      {/* Inspector Header */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <h2 className="font-semibold text-slate-100 truncate text-xs" title={name}>
            {name}
          </h2>
        </div>

        <button
          disabled={isAnalyzing}
          onClick={() => onRegenerateSingle(selectedFile.id)}
          className="flex items-center space-x-1 text-[11px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3" />
          <span>Re-AI</span>
        </button>
      </div>

      {/* Main Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* Technical Specs Pill */}
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Format: <strong className="text-cyan-400 uppercase">{format}</strong></span>
          <span>Size: <strong className="text-slate-200">{(size / 1024 / 1024).toFixed(2)} MB</strong></span>
          <span className="text-indigo-400">{metadata.keywords.length} tags</span>
        </div>

        {/* Live Unoutlined Font Warning Badge (Requirement 5.3) */}
        {(selectedFile.fontWarning || (selectedFile.detectedFonts && selectedFile.detectedFonts.length > 0)) && (
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/70 text-amber-200 text-xs space-y-1 shadow-lg animate-pulse">
            <div className="flex items-center space-x-1.5 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Live Font Warning</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-100/90">
              {selectedFile.fontWarning || `Warning: Live unoutlined font (${selectedFile.detectedFonts?.join(', ')}) detected in EPS header. Convert text to outlines in Illustrator to prevent microstock rejection.`}
            </p>
          </div>
        )}

        {/* Feature 1: AI Content, Copyright & Trademark Risk Checker */}
        {(() => {
          const riskReport = selectedFile.riskReport || evaluateComplianceRisks(selectedFile);
          const isHighRisk = riskReport.overallRisk === 'high_risk';
          const isCaution = riskReport.overallRisk === 'caution';

          return (
            <div
              className={`p-3 rounded-xl border space-y-2 ${
                isHighRisk
                  ? 'bg-rose-950/40 border-rose-800/60'
                  : isCaution
                  ? 'bg-amber-950/40 border-amber-800/60'
                  : 'bg-emerald-950/40 border-emerald-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-medium text-slate-200">
                  <ShieldAlert
                    className={`w-4 h-4 ${
                      isHighRisk ? 'text-rose-400' : isCaution ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  />
                  <span className="text-xs font-semibold">IP & Copyright Risk</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                      isHighRisk
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isCaution
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isHighRisk ? 'CRITICAL' : isCaution ? 'CAUTION' : 'PASS'}
                  </span>
                  {onOpenRiskModal && (
                    <button
                      onClick={onOpenRiskModal}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono cursor-pointer"
                    >
                      Inspect ({riskReport.items.length})
                    </button>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-slate-300 leading-snug">
                {riskReport.summary}
              </div>

              {/* Quick Remediation Buttons */}
              {riskReport.items.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/60">
                  {riskReport.items.some((i) => i.remediationAction === 'remove_terms') && (
                    <button
                      onClick={() => {
                        const allDetected = riskReport.items.flatMap((i) => i.detectedTerms || []);
                        const setDetected = new Set(allDetected.map((t) => t.toLowerCase()));
                        const cleanedKw = metadata.keywords.filter((k) => !setDetected.has(k.toLowerCase()));
                        let clTitle = metadata.title;
                        let clDesc = metadata.description;
                        for (const term of allDetected) {
                          const reg = new RegExp(`\\b${term}\\b`, 'gi');
                          clTitle = clTitle.replace(reg, '').replace(/\\s{2,}/g, ' ').trim();
                          clDesc = clDesc.replace(reg, '').replace(/\\s{2,}/g, ' ').trim();
                        }
                        onUpdateMetadata(selectedFile.id, {
                          title: clTitle,
                          description: clDesc,
                          keywords: cleanedKw,
                        });
                        setFixedToast('Stripped brand and trademark terms');
                        setTimeout(() => setFixedToast(null), 2500);
                      }}
                      className="text-[10px] bg-rose-600/80 hover:bg-rose-500 text-white px-2 py-0.5 rounded font-medium transition-colors cursor-pointer"
                    >
                      Strip Brands
                    </button>
                  )}
                  {riskReport.items.some((i) => i.remediationAction === 'mark_editorial') && !metadata.editorial && (
                    <button
                      onClick={() => {
                        onUpdateMetadata(selectedFile.id, { editorial: true });
                        setFixedToast('Marked as Editorial License');
                        setTimeout(() => setFixedToast(null), 2500);
                      }}
                      className="text-[10px] bg-amber-600/80 hover:bg-amber-500 text-white px-2 py-0.5 rounded font-medium transition-colors cursor-pointer"
                    >
                      Make Editorial
                    </button>
                  )}
                  {riskReport.items.some((i) => i.remediationAction === 'flag_release_required') && !metadata.releasesRequired && (
                    <button
                      onClick={() => {
                        onUpdateMetadata(selectedFile.id, { releasesRequired: true });
                        setFixedToast('Release requirement flagged');
                        setTimeout(() => setFixedToast(null), 2500);
                      }}
                      className="text-[10px] bg-indigo-600/80 hover:bg-indigo-500 text-white px-2 py-0.5 rounded font-medium transition-colors cursor-pointer"
                    >
                      Flag Release
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Real-Time Marketplace Validation & Fix Helper Module */}
        <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 font-medium text-slate-200">
              {validationReport.issues.length === 0 ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : validationReport.hasErrors ? (
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-xs">
                Marketplace Compliance ({validationReport.passedMarketplacesCount}/{validationReport.totalMarketplacesCount} Passed)
              </span>
            </div>

            {validationReport.issues.length > 0 && (
              <button
                onClick={handleFixAll}
                className="flex items-center space-x-1 text-[10px] bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-2 py-0.5 rounded font-medium shadow-sm transition-all cursor-pointer"
              >
                <Wand2 className="w-2.5 h-2.5" />
                <span>Fix All</span>
              </button>
            )}
          </div>

          {fixedToast && (
            <div className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded flex items-center space-x-1 animate-in fade-in">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>{fixedToast}</span>
            </div>
          )}

          {validationReport.issues.length === 0 ? (
            <div className="text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 p-2 rounded-lg flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Compliant with all {validationReport.totalMarketplacesCount} selected agencies!</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {validationReport.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-2 rounded-lg border text-[11px] flex items-start justify-between space-x-2 ${
                    issue.severity === 'error'
                      ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                      : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-300">
                      {issue.marketplaceName} • {issue.field}
                    </div>
                    <div className="text-[10px] mt-0.5 leading-tight opacity-90">{issue.message}</div>
                  </div>

                  <button
                    onClick={() => handleFixIssue(issue)}
                    className="shrink-0 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer"
                    title={issue.fixDescription}
                  >
                    Fix
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Title Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Asset Title
            </label>
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(metadata.title);
                  setFixedToast('Title copied!');
                  setTimeout(() => setFixedToast(null), 2000);
                }}
                className="text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                title="Copy Title to clipboard"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
              <span className={wordsCount < 5 ? 'text-amber-400' : 'text-slate-500'}>
                {wordsCount} words
              </span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  titleCharCount > 200
                    ? 'bg-rose-950 text-rose-400 font-bold'
                    : titleCharCount > 100
                    ? 'bg-amber-950 text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {titleCharCount}/200 chars
              </span>
            </div>
          </div>

          <textarea
            rows={3}
            value={metadata.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Commercial, descriptive stock title..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none transition-colors"
          />
        </div>

        {/* Description Editor */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Description / Caption
            </label>
            <div className="flex items-center space-x-2 text-[10px] font-mono">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(metadata.description);
                  setFixedToast('Description copied!');
                  setTimeout(() => setFixedToast(null), 2000);
                }}
                className="text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                title="Copy Description to clipboard"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
              <span className="text-slate-500">
                {descCharCount}/200 chars (Shutterstock)
              </span>
            </div>
          </div>

          <textarea
            rows={3}
            value={metadata.description}
            onChange={(e) => handleDescChange(e.target.value)}
            placeholder="Visual details, composition, copy space, and commercial applications..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none transition-colors"
          />
        </div>

        {/* Categories Section */}
        <div className="grid grid-cols-2 gap-2">
          {/* Adobe Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Adobe Stock Category
            </label>
            <select
              value={metadata.adobeCategoryId || 8}
              onChange={(e) =>
                onUpdateMetadata(selectedFile.id, {
                  adobeCategoryId: parseInt(e.target.value),
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
            >
              {Object.entries(ADOBE_CATEGORIES).map(([id, label]) => (
                <option key={id} value={id}>
                  {id}: {label}
                </option>
              ))}
            </select>
          </div>

          {/* General Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              General Taxonomy
            </label>
            <select
              value={metadata.primaryCategory}
              onChange={(e) =>
                onUpdateMetadata(selectedFile.id, {
                  primaryCategory: e.target.value,
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
            >
              {GENERAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Keywords Manager */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Keywords ({metadata.keywords.length})
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyKeywords}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Copy all tags comma-separated"
              >
                {copiedToast ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedToast ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick Helper Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAppendFormatTags}
              className="py-1 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] text-cyan-300 rounded font-medium transition-colors cursor-pointer"
            >
              + Format Tags ({format.toUpperCase()})
            </button>
            <button
              disabled={isAnalyzing}
              onClick={async () => {
                const currentTags = metadata.keywords;
                const promptQuery = `Given this stock asset title: "${metadata.title}" and existing keywords: ${currentTags.slice(0, 15).join(', ')}, suggest 10 additional high-converting commercial stock tags that are NOT in the existing list. Reply with comma-separated list only.`;
                try {
                  const key = localStorage.getItem('stockmeta_gemini_key') || '';
                  if (!key) {
                    alert('Enter your Gemini API key in the sidebar first');
                    return;
                  }
                  const res = await fetch('/api/generate-metadata', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fileName: selectedFile.name,
                      format: selectedFile.format,
                      apiKey: key,
                      seoOptions: {
                        targetKeywordsCount: 49,
                        customSystemPrompt: promptQuery,
                      },
                    }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    const more = data.keywords || [];
                    const combined = Array.from(new Set([...currentTags, ...more])).slice(0, 50);
                    onUpdateMetadata(selectedFile.id, { keywords: combined });
                    setFixedToast('Added suggested keywords!');
                    setTimeout(() => setFixedToast(null), 2500);
                  }
                } catch {
                  alert('Could not fetch suggestions');
                }
              }}
              className="py-1 px-2 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/60 text-[10px] text-indigo-300 rounded font-medium transition-colors cursor-pointer flex items-center space-x-1"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
              <span>Suggest More</span>
            </button>
            <button
              onClick={() => onUpdateMetadata(selectedFile.id, { keywords: [] })}
              className="py-1 px-2 bg-slate-950 hover:bg-rose-950/40 border border-slate-800 text-[10px] text-slate-500 hover:text-rose-400 rounded font-medium transition-colors cursor-pointer"
            >
              Clear Tags
            </button>
          </div>

          {/* Add Tag Input */}
          <div className="flex items-center space-x-1.5">
            <input
              type="text"
              placeholder="Add tag(s)... (comma or enter)"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTags();
                }
              }}
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAddTags}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Notice on Adobe Stock first 10 tags */}
          <div className="p-2 rounded bg-indigo-950/30 border border-indigo-500/20 text-[10px] text-indigo-300 flex items-start space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Adobe Stock Rule:</strong> The first 10 keywords carry heavy search algorithm weighting.
              Drag pills below to prioritize your key commercial nouns first!
            </span>
          </div>

          {/* Keyword Pills List (Draggable) */}
          <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto p-1 custom-scrollbar">
            {metadata.keywords.map((tag, idx) => {
              const isTop10 = idx < 10;
              return (
                <div
                  key={`${tag}-${idx}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`group text-[11px] px-2 py-0.5 rounded-full flex items-center space-x-1 transition-all cursor-grab active:cursor-grabbing border ${
                    isTop10
                      ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                  title={`Position ${idx + 1} - Drag to change search rank`}
                >
                  <span className="text-[9px] font-mono text-slate-500 select-none mr-0.5">
                    {idx + 1}
                  </span>
                  <span>{tag}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTag(idx);
                    }}
                    className="text-slate-500 hover:text-rose-400 ml-1 cursor-pointer transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature 2: Marketplace-Specific Tailored Outputs */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Tailored Marketplace Metadata
            </span>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-1.5 py-0.5 rounded">
              0 API Calls • Instant
            </span>
          </div>

          {/* Platform Tab Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
            {selectedMarketplaceIds.slice(0, 6).map((mId) => {
              const conf = MARKETPLACES[mId];
              if (!conf) return null;
              const isSelected = (previewMarketplaceId || selectedMarketplaceIds[0]) === mId;
              return (
                <button
                  key={mId}
                  onClick={() => setPreviewMarketplaceId(mId)}
                  className={`px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {conf.name}
                </button>
              );
            })}
          </div>

          {/* Adapted Metadata Card */}
          {(() => {
            const activeMId = previewMarketplaceId || selectedMarketplaceIds[0] || 'adobe';
            const adaptedList = adaptFileToMarketplaces(selectedFile, [activeMId]);
            const adapted = adaptedList[0];
            if (!adapted) return null;

            return (
              <div className="space-y-2 text-xs">
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{adapted.marketplaceName} Title</span>
                    <span className="text-slate-500">{adapted.title.length} chars</span>
                  </div>
                  <div className="text-slate-200 font-sans line-clamp-2 text-[11px]">{adapted.title}</div>
                </div>

                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Keywords ({adapted.keywords.length}) [Delimiter: "{adapted.delimiter}"]</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(adapted.formattedKeywords);
                        setCopiedToast(true);
                        setTimeout(() => setCopiedToast(false), 2000);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <div className="text-slate-300 font-mono text-[10px] line-clamp-2 bg-slate-950 p-1.5 rounded">
                    {adapted.formattedKeywords}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Duplicate To All Batch Action */}
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={() => onDuplicateToAll(selectedFile.id)}
            className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Apply This Metadata to All Batch Files</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
