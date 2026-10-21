import React, { useState } from 'react';
import { X, Layers, Search, PlusCircle, Trash2, Tag, FileText, CheckCircle, SlidersHorizontal } from 'lucide-react';
import { StockFile } from '../types/stock';
import {
  bulkAddKeywords,
  bulkFindAndReplaceKeywords,
  bulkFindAndReplaceText,
  bulkRemoveKeywords,
  bulkSetCategories,
  bulkSetFlags,
  bulkSetTitlePrefixSuffix,
} from '../utils/bulkMetadataUtils';

interface BulkMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StockFile[];
  checkedFileIds: string[];
  onApplyBulkChanges: (updatedFiles: StockFile[]) => void;
}

export const BulkMetadataModal: React.FC<BulkMetadataModalProps> = ({
  isOpen,
  onClose,
  files,
  checkedFileIds,
  onApplyBulkChanges,
}) => {
  const [activeTab, setActiveTab] = useState<'keywords' | 'text' | 'categories'>('keywords');
  const [applyScope, setApplyScope] = useState<'selected' | 'all'>('selected');

  // Keywords State
  const [kwMode, setKwMode] = useState<'replace' | 'add' | 'remove'>('replace');
  const [kwFind, setKwFind] = useState('');
  const [kwReplace, setKwReplace] = useState('');
  const [kwWholeWord, setKwWholeWord] = useState(true);
  const [kwAddText, setKwAddText] = useState('');
  const [kwAddPosition, setKwAddPosition] = useState<'append' | 'prepend'>('append');
  const [kwRemoveText, setKwRemoveText] = useState('');

  // Title & Description State
  const [textMode, setTextMode] = useState<'replace' | 'prefix_suffix'>('replace');
  const [textField, setTextField] = useState<'title' | 'description'>('title');
  const [textFind, setTextFind] = useState('');
  const [textReplace, setTextReplace] = useState('');
  const [textWholeWord, setTextWholeWord] = useState(false);
  const [textPrefix, setTextPrefix] = useState('');
  const [textSuffix, setTextSuffix] = useState('');

  // Categories & Flags State
  const [primaryCat, setPrimaryCat] = useState('');
  const [secondaryCat, setSecondaryCat] = useState('');
  const [adobeCatId, setAdobeCatId] = useState<number | undefined>(undefined);
  const [flagEditorial, setFlagEditorial] = useState<'unchanged' | 'true' | 'false'>('unchanged');
  const [flagReleases, setFlagReleases] = useState<'unchanged' | 'true' | 'false'>('unchanged');

  if (!isOpen) return null;

  const targetFileIds =
    applyScope === 'selected' && checkedFileIds.length > 0
      ? checkedFileIds
      : files.map((f) => f.id);

  const targetCount = targetFileIds.length;

  const handleApply = () => {
    let affectedFiles = files.filter((f) => targetFileIds.includes(f.id));
    const unaffectedFiles = files.filter((f) => !targetFileIds.includes(f.id));

    if (activeTab === 'keywords') {
      if (kwMode === 'replace') {
        affectedFiles = bulkFindAndReplaceKeywords(affectedFiles, kwFind, kwReplace, kwWholeWord);
      } else if (kwMode === 'add') {
        const toAdd = kwAddText.split(',').map((s) => s.trim()).filter(Boolean);
        affectedFiles = bulkAddKeywords(affectedFiles, toAdd, kwAddPosition);
      } else if (kwMode === 'remove') {
        const toRemove = kwRemoveText.split(',').map((s) => s.trim()).filter(Boolean);
        affectedFiles = bulkRemoveKeywords(affectedFiles, toRemove);
      }
    } else if (activeTab === 'text') {
      if (textMode === 'replace') {
        affectedFiles = bulkFindAndReplaceText(affectedFiles, textField, textFind, textReplace, textWholeWord);
      } else {
        affectedFiles = bulkSetTitlePrefixSuffix(affectedFiles, textPrefix, textSuffix);
      }
    } else if (activeTab === 'categories') {
      if (primaryCat || secondaryCat || adobeCatId !== undefined) {
        affectedFiles = bulkSetCategories(affectedFiles, {
          primaryCategory: primaryCat || undefined,
          secondaryCategory: secondaryCat || undefined,
          adobeCategoryId: adobeCatId,
        });
      }
      if (flagEditorial !== 'unchanged' || flagReleases !== 'unchanged') {
        affectedFiles = bulkSetFlags(affectedFiles, {
          editorial: flagEditorial === 'unchanged' ? undefined : flagEditorial === 'true',
          releasesRequired: flagReleases === 'unchanged' ? undefined : flagReleases === 'true',
        });
      }
    }

    // Merge in order
    const updatedMap = new Map(affectedFiles.map((f) => [f.id, f]));
    const finalFiles = files.map((f) => updatedMap.get(f.id) || f);

    onApplyBulkChanges(finalFiles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Bulk Metadata Editor</h3>
              <p className="text-xs text-slate-400">
                Batch modify keywords, titles, descriptions, and compliance flags
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Selector */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Apply Changes To:</span>
          <div className="flex items-center space-x-2 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setApplyScope('selected')}
              className={`px-3 py-1 rounded-md transition-colors ${
                applyScope === 'selected'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Selected Files ({checkedFileIds.length})
            </button>
            <button
              onClick={() => setApplyScope('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                applyScope === 'all'
                  ? 'bg-indigo-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Files ({files.length})
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-6">
          <button
            onClick={() => setActiveTab('keywords')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'keywords'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Keywords</span>
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Title & Description</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center space-x-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Categories & Flags</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {activeTab === 'keywords' && (
            <div className="space-y-4">
              <div className="flex space-x-2 text-xs">
                <button
                  onClick={() => setKwMode('replace')}
                  className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center space-x-1.5 transition-colors ${
                    kwMode === 'replace'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find & Replace</span>
                </button>
                <button
                  onClick={() => setKwMode('add')}
                  className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center space-x-1.5 transition-colors ${
                    kwMode === 'add'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Keywords</span>
                </button>
                <button
                  onClick={() => setKwMode('remove')}
                  className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center space-x-1.5 transition-colors ${
                    kwMode === 'remove'
                      ? 'bg-rose-600/20 border-rose-500 text-rose-300 font-medium'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Keywords</span>
                </button>
              </div>

              {kwMode === 'replace' && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Find Keyword / Phrase:</label>
                    <input
                      type="text"
                      value={kwFind}
                      onChange={(e) => setKwFind(e.target.value)}
                      placeholder="e.g. businessman"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Replace With:</label>
                    <input
                      type="text"
                      value={kwReplace}
                      onChange={(e) => setKwReplace(e.target.value)}
                      placeholder="e.g. entrepreneur (leave empty to delete term)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={kwWholeWord}
                      onChange={(e) => setKwWholeWord(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Match whole keyword only (exact match)</span>
                  </label>
                </div>
              )}

              {kwMode === 'add' && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Keywords to Add (comma separated):</label>
                    <input
                      type="text"
                      value={kwAddText}
                      onChange={(e) => setKwAddText(e.target.value)}
                      placeholder="e.g. autumn, seasonal, 2026, thanksgiving"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-300">
                    <span className="text-slate-400">Position:</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="kwPos"
                        checked={kwAddPosition === 'append'}
                        onChange={() => setKwAddPosition('append')}
                        className="text-indigo-600"
                      />
                      <span>Append (End)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="kwPos"
                        checked={kwAddPosition === 'prepend'}
                        onChange={() => setKwAddPosition('prepend')}
                        className="text-indigo-600"
                      />
                      <span>Prepend (Top weight)</span>
                    </label>
                  </div>
                </div>
              )}

              {kwMode === 'remove' && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Keywords to Delete (comma separated):</label>
                    <input
                      type="text"
                      value={kwRemoveText}
                      onChange={(e) => setKwRemoveText(e.target.value)}
                      placeholder="e.g. sample, watermark, generic"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex space-x-2 text-xs">
                <button
                  onClick={() => setTextMode('replace')}
                  className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center space-x-1.5 transition-colors ${
                    textMode === 'replace'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find & Replace Text</span>
                </button>
                <button
                  onClick={() => setTextMode('prefix_suffix')}
                  className={`flex-1 py-1.5 rounded-lg border flex items-center justify-center space-x-1.5 transition-colors ${
                    textMode === 'prefix_suffix'
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-medium'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Title Prefix & Suffix</span>
                </button>
              </div>

              {textMode === 'replace' && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  <div className="flex items-center space-x-4 text-xs text-slate-300">
                    <span className="text-slate-400">Target Field:</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="textField"
                        checked={textField === 'title'}
                        onChange={() => setTextField('title')}
                        className="text-indigo-600"
                      />
                      <span>Title</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="textField"
                        checked={textField === 'description'}
                        onChange={() => setTextField('description')}
                        className="text-indigo-600"
                      />
                      <span>Description</span>
                    </label>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Find String:</label>
                    <input
                      type="text"
                      value={textFind}
                      onChange={(e) => setTextFind(e.target.value)}
                      placeholder="e.g. 2025"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Replace With:</label>
                    <input
                      type="text"
                      value={textReplace}
                      onChange={(e) => setTextReplace(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {textMode === 'prefix_suffix' && (
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Add Prefix (Start of Title):</label>
                    <input
                      type="text"
                      value={textPrefix}
                      onChange={(e) => setTextPrefix(e.target.value)}
                      placeholder="e.g. Set of"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Add Suffix (End of Title):</label>
                    <input
                      type="text"
                      value={textSuffix}
                      onChange={(e) => setTextSuffix(e.target.value)}
                      placeholder="e.g. - Isolated on White"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Primary Category:</label>
                  <input
                    type="text"
                    value={primaryCat}
                    onChange={(e) => setPrimaryCat(e.target.value)}
                    placeholder="e.g. Business & Finance"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Secondary Category:</label>
                  <input
                    type="text"
                    value={secondaryCat}
                    onChange={(e) => setSecondaryCat(e.target.value)}
                    placeholder="e.g. Technology"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Adobe Category ID (1-21):</label>
                <input
                  type="number"
                  min="1"
                  max="21"
                  value={adobeCatId ?? ''}
                  onChange={(e) => setAdobeCatId(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 3 (Business), 8 (Graphic Resources)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Editorial Status:</label>
                  <select
                    value={flagEditorial}
                    onChange={(e) => setFlagEditorial(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="unchanged">Keep Unchanged</option>
                    <option value="true">Mark as Editorial</option>
                    <option value="false">Mark as Commercial (Non-Editorial)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Model / Property Release:</label>
                  <select
                    value={flagReleases}
                    onChange={(e) => setFlagReleases(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="unchanged">Keep Unchanged</option>
                    <option value="true">Release Required (People / Property)</option>
                    <option value="false">No Release Required</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Affects <strong className="text-white">{targetCount}</strong> of {files.length} file(s)
          </span>
          <div className="flex space-x-2.5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={targetCount === 0}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Apply to {targetCount} File(s)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
