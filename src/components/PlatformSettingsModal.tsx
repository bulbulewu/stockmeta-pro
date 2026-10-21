import React, { useState } from 'react';
import {
  X,
  Sliders,
  Check,
  RotateCcw,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
  FileText,
  Save,
  BookOpen,
} from 'lucide-react';
import rawConfig from '../../platforms.config.json';
import { MARKETPLACES, buildMarketplaces } from '../config/marketplaces';

interface PlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onOpenReadme?: () => void;
}

export const PlatformSettingsModal: React.FC<PlatformSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  onOpenReadme,
}) => {
  if (!isOpen) return null;

  const [activePlatformKey, setActivePlatformKey] = useState<string>('adobe_stock');
  const [platformsData, setPlatformsData] = useState<Record<string, any>>(() => {
    try {
      const stored = localStorage.getItem('stockmeta_platforms_config');
      if (stored) return JSON.parse(stored);
    } catch {}
    return JSON.parse(JSON.stringify((rawConfig as any).platforms));
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const currentPlatform = platformsData[activePlatformKey] || platformsData.adobe_stock;

  const handleUpdateCurrentField = (path: string[], value: any) => {
    setPlatformsData((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));
      let cur = copy[activePlatformKey];
      for (let i = 0; i < path.length - 1; i++) {
        if (!cur[path[i]]) cur[path[i]] = {};
        cur = cur[path[i]];
      }
      cur[path[path.length - 1]] = value;
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem('stockmeta_platforms_config', JSON.stringify(platformsData));
      buildMarketplaces(platformsData);
      setHasUnsavedChanges(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
      onSaved?.();
    } catch (err: any) {
      alert(`Could not save settings: ${err.message}`);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Reset all marketplace limits and configurations to default?')) {
      const defaults = JSON.parse(JSON.stringify((rawConfig as any).platforms));
      setPlatformsData(defaults);
      localStorage.removeItem('stockmeta_platforms_config');
      buildMarketplaces(defaults);
      setHasUnsavedChanges(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
      onSaved?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Microstock Platform Limits & Configuration</span>
                <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded">
                  platforms.config.json
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tune exact character limits, keyword counts, delimiters, and AI-disclosure policies per agency without touching code.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenReadme && (
              <button
                onClick={onOpenReadme}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                title="Open Full-Screen User Manual & Readme (Bangla & English)"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>📖 Readme / ব্যবহার নির্দেশিকা</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Platform List + Right Form Fields */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Platform Tabs */}
          <div className="w-60 border-r border-slate-800 bg-slate-950/50 p-2 overflow-y-auto custom-scrollbar space-y-1">
            {onOpenReadme && (
              <button
                onClick={onOpenReadme}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-300 border border-amber-500/40 hover:border-amber-400 mb-2 cursor-pointer shadow-sm"
                title="Open Complete Software Readme & User Manual (Bangla & English)"
              >
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">📖 Readme Manual (EN/বাংলা)</span>
              </button>
            )}

            <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">
              13 Target Agencies
            </div>
            {Object.keys(platformsData).map((key) => {
              const p = platformsData[key];
              const isActive = key === activePlatformKey;
              return (
                <button
                  key={key}
                  onClick={() => setActivePlatformKey(key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">{p.name || key}</span>
                  <span className={`text-[10px] px-1 rounded font-mono ${isActive ? 'bg-indigo-700 text-white' : 'text-slate-500'}`}>
                    {p.delimiter === ';' ? ';' : ','}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Active Platform Configuration Editor */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs text-slate-200">
            {/* Header info bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">{currentPlatform.name}</h3>
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Last Verified:</span>
                  <input
                    type="date"
                    value={currentPlatform.lastVerified || ''}
                    onChange={(e) => handleUpdateCurrentField(['lastVerified'], e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400">CSV Delimiter:</span>
                <select
                  value={currentPlatform.delimiter || ','}
                  onChange={(e) => handleUpdateCurrentField(['delimiter'], e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-cyan-300 font-mono"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                </select>
              </div>
            </div>

            {/* Title Limits */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>Title Length Constraints (Characters)</span>
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Min Length</label>
                  <input
                    type="number"
                    value={currentPlatform.titleLimits?.minChars ?? 10}
                    onChange={(e) => handleUpdateCurrentField(['titleLimits', 'minChars'], parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Hard Max Limit</label>
                  <input
                    type="number"
                    value={currentPlatform.titleLimits?.maxChars ?? 200}
                    onChange={(e) => handleUpdateCurrentField(['titleLimits', 'maxChars'], parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Min Words</label>
                  <input
                    type="number"
                    value={currentPlatform.titleLimits?.minWords ?? 5}
                    onChange={(e) => handleUpdateCurrentField(['titleLimits', 'minWords'], parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Keyword Limits */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="font-semibold text-slate-200 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Keyword Count Limits</span>
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Minimum Keywords Required</label>
                  <input
                    type="number"
                    value={currentPlatform.keywordLimits?.minCount ?? 5}
                    onChange={(e) => handleUpdateCurrentField(['keywordLimits', 'minCount'], parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Maximum Allowed Keywords</label>
                  <input
                    type="number"
                    value={currentPlatform.keywordLimits?.maxCount ?? 50}
                    onChange={(e) => handleUpdateCurrentField(['keywordLimits', 'maxCount'], parseInt(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* AI Disclosure Policy */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-200 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>AI-Generated Disclosure Requirement</span>
                </h4>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(currentPlatform.aiDisclosure?.required)}
                    onChange={(e) => handleUpdateCurrentField(['aiDisclosure', 'required'], e.target.checked)}
                    className="rounded accent-indigo-500"
                  />
                  <span className="text-xs text-slate-300">Mandatory Disclosure</span>
                </label>
              </div>

              <textarea
                rows={2}
                value={currentPlatform.aiDisclosure?.instructions || ''}
                onChange={(e) => handleUpdateCurrentField(['aiDisclosure', 'instructions'], e.target.value)}
                placeholder="Contributor guidelines instructions for AI disclosure..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Special Platform Notes */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 block">Platform Special Notes & Rules</label>
              <input
                type="text"
                value={currentPlatform.specialNotes || ''}
                onChange={(e) => handleUpdateCurrentField(['specialNotes'], e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <button
            onClick={handleResetToDefault}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>

          <div className="flex items-center space-x-3">
            {saveToast && (
              <span className="text-emerald-400 text-xs flex items-center space-x-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Configuration saved successfully!</span>
              </span>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleSaveSettings}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg font-medium text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
