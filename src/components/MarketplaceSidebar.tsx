import React, { useState } from 'react';
import {
  Globe,
  Sliders,
  Sparkles,
  ShieldAlert,
  Search,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  Info,
  Tag,
  Cpu,
  Key,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BookOpen,
  Upload,
  FileText,
} from 'lucide-react';
import { MARKETPLACES, TIER_1_MARKETPLACE_IDS, TIER_2_MARKETPLACE_IDS } from '../config/marketplaces';
import { SEOConfig } from '../types/stock';

interface MarketplaceSidebarProps {
  selectedMarketplaceIds: string[];
  onToggleMarketplace: (id: string) => void;
  onSelectAll: () => void;
  onSelectTier1: () => void;
  onSelectTier2: () => void;
  onClearMarketplaces: () => void;
  seoConfig: SEOConfig;
  onChangeSeoConfig: (config: Partial<SEOConfig>) => void;
  vectorCsvPreference: 'primary' | 'companion_jpg' | 'zip';
  onChangeVectorCsvPreference: (pref: 'primary' | 'companion_jpg' | 'zip') => void;
  geminiApiKey: string;
  onChangeGeminiApiKey: (key: string) => void;
  apiKeysByProvider?: Record<string, string>;
  onChangeApiKeyByProvider?: (provider: string, keys: string) => void;
  onOpenReadme?: () => void;
}

export const MarketplaceSidebar: React.FC<MarketplaceSidebarProps> = ({
  selectedMarketplaceIds,
  onToggleMarketplace,
  onSelectAll,
  onSelectTier1,
  onSelectTier2,
  onClearMarketplaces,
  seoConfig,
  onChangeSeoConfig,
  vectorCsvPreference,
  onChangeVectorCsvPreference,
  geminiApiKey,
  onChangeGeminiApiKey,
  apiKeysByProvider,
  onChangeApiKeyByProvider,
  onOpenReadme,
}) => {
  const [activeTab, setActiveTab] = useState<'marketplaces' | 'seo'>('marketplaces');
  const [searchQuery, setSearchQuery] = useState('');
  const [newNegativeTag, setNewNegativeTag] = useState('');
  const [keyValidationStatus, setKeyValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [keyValidationMessage, setKeyValidationMessage] = useState('');
  const [showAutoImporter, setShowAutoImporter] = useState(false);
  const [autoImportText, setAutoImportText] = useState('');
  const [autoImportSummary, setAutoImportSummary] = useState<string | null>(null);

  // Minimize / Maximize (Collapse / Expand) state for option cards
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('stockmeta_sidebar_collapsed_cards');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleCard = (cardId: string) => {
    setCollapsedCards((prev) => {
      const updated = { ...prev, [cardId]: !prev[cardId] };
      try {
        localStorage.setItem('stockmeta_sidebar_collapsed_cards', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const collapseAllCards = () => {
    const all = { keys: true, engine: true, seo: true, hints: true, blacklist: true };
    setCollapsedCards(all);
    try {
      localStorage.setItem('stockmeta_sidebar_collapsed_cards', JSON.stringify(all));
    } catch {}
  };

  const expandAllCards = () => {
    const all = { keys: false, engine: false, seo: false, hints: false, blacklist: false };
    setCollapsedCards(all);
    try {
      localStorage.setItem('stockmeta_sidebar_collapsed_cards', JSON.stringify(all));
    } catch {}
  };

  const currentProvider = (seoConfig.aiProvider || 'gemini') as 'gemini' | 'groq' | 'openrouter' | 'auto';
  const currentKeys = (apiKeysByProvider && apiKeysByProvider[currentProvider] !== undefined)
    ? apiKeysByProvider[currentProvider]
    : (currentProvider === 'gemini' ? geminiApiKey : '');

  const parsedKeyList = currentKeys
    .split(/[\r\n,;]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 5);

  const handleRunAutoImport = (textToParse: string) => {
    if (!textToParse.trim()) return;
    const tokens = textToParse
      .split(/[\r\n,\s;]+/)
      .map((t) => t.trim().replace(/^['"]|['"]$/g, ''))
      .filter((t) => t.length > 5);

    const detectedGemini: string[] = [];
    const detectedGroq: string[] = [];
    const detectedOpenrouter: string[] = [];

    const existingGemini = (apiKeysByProvider?.gemini || geminiApiKey || '')
      .split(/[\r\n,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5);
    const existingGroq = (apiKeysByProvider?.groq || '')
      .split(/[\r\n,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5);
    const existingOpenrouter = (apiKeysByProvider?.openrouter || '')
      .split(/[\r\n,;]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 5);

    for (const token of tokens) {
      if (token.startsWith('gsk_')) {
        if (!detectedGroq.includes(token) && !existingGroq.includes(token)) detectedGroq.push(token);
      } else if (token.startsWith('sk-or-')) {
        if (!detectedOpenrouter.includes(token) && !existingOpenrouter.includes(token)) detectedOpenrouter.push(token);
      } else if (token.startsWith('AIzaSy') || token.startsWith('AQ.')) {
        if (!detectedGemini.includes(token) && !existingGemini.includes(token)) detectedGemini.push(token);
      } else if (token.length >= 35 && token.length <= 45 && !token.includes('_')) {
        if (!detectedGemini.includes(token) && !existingGemini.includes(token)) detectedGemini.push(token);
      }
    }

    const mergedGemini = [...existingGemini, ...detectedGemini].join('\n');
    const mergedGroq = [...existingGroq, ...detectedGroq].join('\n');
    const mergedOpenrouter = [...existingOpenrouter, ...detectedOpenrouter].join('\n');

    if (onChangeApiKeyByProvider) {
      onChangeApiKeyByProvider('gemini', mergedGemini);
      onChangeApiKeyByProvider('groq', mergedGroq);
      onChangeApiKeyByProvider('openrouter', mergedOpenrouter);
    }
    onChangeGeminiApiKey(mergedGemini);

    setAutoImportSummary(
      `✅ Success! Auto-detected: ${detectedGemini.length} Gemini, ${detectedGroq.length} Groq, ${detectedOpenrouter.length} OpenRouter keys!`
    );
    setAutoImportText('');
    setKeyValidationStatus('idle');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleRunAutoImport(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const allMarketplaces = Object.values(MARKETPLACES);
  const filteredMarketplaces = allMarketplaces.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNegativeTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newNegativeTag.trim()) {
      e.preventDefault();
      const tag = newNegativeTag.trim().toLowerCase();
      if (!seoConfig.customNegativeKeywords.includes(tag)) {
        onChangeSeoConfig({
          customNegativeKeywords: [...seoConfig.customNegativeKeywords, tag],
        });
      }
      setNewNegativeTag('');
    }
  };

  const handleRemoveNegativeTag = (tag: string) => {
    onChangeSeoConfig({
      customNegativeKeywords: seoConfig.customNegativeKeywords.filter((t) => t !== tag),
    });
  };

  const handleKeyPoolChange = (value: string) => {
    if (onChangeApiKeyByProvider) {
      onChangeApiKeyByProvider(currentProvider, value);
    }
    if (currentProvider === 'gemini') {
      onChangeGeminiApiKey(value);
    }
    setKeyValidationStatus('idle');
  };

  const handleSelectProvider = (prov: 'gemini' | 'groq' | 'openrouter' | 'auto') => {
    let nextModel = 'gemini-2.5-flash';
    if (prov === 'groq') nextModel = 'openai/gpt-oss-20b';
    if (prov === 'openrouter') nextModel = 'nvidia/nemotron-3.5-super-vl:free';
    if (prov === 'auto') nextModel = 'Multi-Provider Auto-Fallback';

    onChangeSeoConfig({
      aiProvider: prov,
      selectedModel: nextModel,
    });
    setKeyValidationStatus('idle');
  };

  const handleValidateKey = async () => {
    setKeyValidationStatus('validating');
    setKeyValidationMessage('');
    try {
      const payload: any = {
        provider: currentProvider,
        apiKeys: currentKeys.trim(),
        allProvidersKeys: apiKeysByProvider,
      };

      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.valid) {
        setKeyValidationStatus('valid');
        setKeyValidationMessage(data.summary || 'All keys in pool validated and ready!');
      } else {
        setKeyValidationStatus('invalid');
        setKeyValidationMessage(data.summary || data.error || 'Key validation failed');
      }
    } catch (err: any) {
      setKeyValidationStatus('invalid');
      setKeyValidationMessage('Could not connect to server to validate keys');
    }
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-full overflow-hidden select-none">
      {/* Top Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 shrink-0">
        <button
          onClick={() => setActiveTab('marketplaces')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'marketplaces'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>Marketplaces ({selectedMarketplaceIds.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'seo'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Engine & SEO</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 custom-scrollbar text-xs">
        {activeTab === 'marketplaces' ? (
          <div className="space-y-3">
            {/* Search and Quick Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter 26 platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-1 text-[11px]">
                <button
                  onClick={onSelectAll}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-center transition-colors font-medium cursor-pointer"
                >
                  All (26)
                </button>
                <button
                  onClick={onSelectTier1}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-center transition-colors font-medium cursor-pointer"
                >
                  Tier 1
                </button>
                <button
                  onClick={onSelectTier2}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-center transition-colors font-medium cursor-pointer"
                >
                  Tier 2
                </button>
                <button
                  onClick={onClearMarketplaces}
                  className="py-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded text-center transition-colors font-medium cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Vector CSV Filename Resolution Preference */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300 font-medium text-[11px]">
                <span>Vector CSV Target Filename:</span>
              </div>
              <select
                value={vectorCsvPreference}
                onChange={(e) => onChangeVectorCsvPreference(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="primary">Reference Primary Vector (.eps/.svg)</option>
                <option value="companion_jpg">Reference Companion Preview (.jpg)</option>
                <option value="zip">Reference Vector Archive (.zip)</option>
              </select>
            </div>

            {/* Marketplace List */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-1 py-1">
                Target Marketplaces ({selectedMarketplaceIds.length} checked)
              </div>

              {filteredMarketplaces.map((m) => {
                const isSelected = selectedMarketplaceIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => onToggleMarketplace(m.id)}
                    className={`flex items-start space-x-2.5 p-2 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/40 text-slate-100'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="pt-0.5">
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs truncate">{m.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                            m.tier === 1
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          T{m.tier}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span>Max {m.keywordLimits.maxCount} tags</span>
                        <span>•</span>
                        <span>{m.delimiter === ';' ? 'Semicolon (;)' : 'Comma (,)'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* SEO and AI Config Tab */
          <div className="space-y-4">
            {/* AI PROVIDER SELECTOR */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Provider</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                  100% FREE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectProvider('gemini')}
                  className={`py-1.5 px-1 text-[11px] rounded font-medium transition-colors cursor-pointer text-center ${
                    currentProvider === 'gemini'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectProvider('groq')}
                  className={`py-1.5 px-1 text-[11px] rounded font-medium transition-colors cursor-pointer text-center ${
                    currentProvider === 'groq'
                      ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  Groq Cloud
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectProvider('openrouter')}
                  className={`py-1.5 px-1 text-[11px] rounded font-medium transition-colors cursor-pointer text-center ${
                    currentProvider === 'openrouter'
                      ? 'bg-purple-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  OpenRouter
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectProvider('auto')}
                  className={`py-1.5 px-1 text-[11px] rounded font-medium transition-colors cursor-pointer text-center flex items-center justify-center space-x-1 ${
                    currentProvider === 'auto'
                      ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                      : 'bg-slate-900 text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
                  }`}
                  title="Automatically failover across all providers"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Auto-Fallback</span>
                </button>
              </div>
            </div>

            {/* Options Minimize / Maximize Toolbar */}
            <div className="flex items-center justify-between text-[11px] px-1 pt-1 pb-0.5 text-slate-400">
              <span className="font-semibold text-slate-300">Settings & Rules</span>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={collapseAllCards}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-[10px] bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800"
                  title="Minimize (Collapse) all option sections"
                >
                  Minimize All
                </button>
                <button
                  type="button"
                  onClick={expandAllCards}
                  className="hover:text-cyan-300 transition-colors cursor-pointer text-[10px] bg-slate-900 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-800"
                  title="Maximize (Expand) all option sections"
                >
                  Maximize All
                </button>
              </div>
            </div>

            {/* MULTI-KEY POOL WITH AUTO-ROTATION */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2.5 transition-all">
              <div
                onClick={() => toggleCard('keys')}
                className="flex items-center justify-between cursor-pointer select-none group"
              >
                <div className="flex items-center space-x-1.5 text-slate-200 font-medium">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span className="capitalize">
                    {currentProvider === 'auto' ? 'Multi-Provider Key Manager' : `${currentProvider} API Key Pool`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {currentProvider !== 'auto' && (
                    <span className="text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.5 rounded font-mono">
                      {parsedKeyList.length} {parsedKeyList.length === 1 ? 'Key' : 'Keys'}
                    </span>
                  )}
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 group-hover:text-cyan-300 transition-colors cursor-pointer"
                    title={collapsedCards.keys ? 'Maximize (Expand)' : 'Minimize (Collapse)'}
                  >
                    {collapsedCards.keys ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {!collapsedCards.keys && (
                <>

              {currentProvider === 'auto' ? (
                /* Auto-Fallback: Multi-Provider Inputs */
                <div className="space-y-3">
                  {/* Smart Auto-Detect Button & Importer Drawer */}
                  <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-300 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Smart Multi-Key Auto-Importer</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAutoImporter(!showAutoImporter)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-200 underline font-semibold cursor-pointer"
                      >
                        {showAutoImporter ? 'Hide Importer' : 'Paste / Upload All Keys'}
                      </button>
                    </div>

                    {showAutoImporter && (
                      <div className="space-y-2 pt-1 border-t border-indigo-900/60 animate-in fade-in">
                        <p className="text-[10px] text-slate-300 leading-snug">
                          Paste any mixed keys below or upload a <code className="text-amber-300">.txt</code> file. The app automatically routes them:
                          <span className="block text-slate-400 mt-0.5">
                            • <code className="text-indigo-300">AIzaSy... / AQ....</code> ➔ Gemini
                            <br />
                            • <code className="text-cyan-300">gsk_...</code> ➔ Groq
                            <br />
                            • <code className="text-purple-300">sk-or-...</code> ➔ OpenRouter
                          </span>
                        </p>

                        <div className="flex items-center space-x-2">
                          <label className="flex-1 py-1 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-[10px] text-slate-300 font-medium flex items-center justify-center space-x-1.5 cursor-pointer transition-colors">
                            <Upload className="w-3 h-3 text-indigo-400" />
                            <span>Upload .txt File</span>
                            <input
                              type="file"
                              accept=".txt,.env,.json"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>

                        <textarea
                          rows={3}
                          value={autoImportText}
                          onChange={(e) => setAutoImportText(e.target.value)}
                          placeholder="Paste all your API keys here (all providers mixed together is fine)..."
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:border-indigo-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleRunAutoImport(autoImportText)}
                          disabled={!autoImportText.trim()}
                          className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold rounded transition-colors cursor-pointer flex items-center justify-center space-x-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Auto-Detect & Distribute All Keys</span>
                        </button>
                      </div>
                    )}

                    {autoImportSummary && (
                      <div className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 p-1.5 rounded flex items-center justify-between">
                        <span>{autoImportSummary}</span>
                        <button
                          type="button"
                          onClick={() => setAutoImportSummary(null)}
                          className="text-slate-400 hover:text-white text-xs ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-indigo-300 font-semibold flex items-center space-x-1">
                        <span>1. Google Gemini Key(s):</span>
                        <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1 rounded font-mono">
                          {(apiKeysByProvider?.gemini || geminiApiKey || '').split(/[\r\n,;]+/).filter((k) => k.trim().length > 5).length} key(s)
                        </span>
                      </span>
                      <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Get Key →</a>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Paste Gemini API key(s) (AIzaSy... or AQ....)..."
                      value={apiKeysByProvider?.gemini || geminiApiKey || ''}
                      onChange={(e) => {
                        onChangeApiKeyByProvider?.('gemini', e.target.value);
                        onChangeGeminiApiKey(e.target.value);
                        setKeyValidationStatus('idle');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-cyan-300 font-semibold flex items-center space-x-1">
                        <span>2. Groq Cloud Key(s):</span>
                        <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1 rounded font-mono">
                          {(apiKeysByProvider?.groq || '').split(/[\r\n,;]+/).filter((k) => k.trim().length > 5).length} key(s)
                        </span>
                      </span>
                      <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Get Key →</a>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Paste Groq keys (starts with gsk_...)..."
                      value={apiKeysByProvider?.groq || ''}
                      onChange={(e) => {
                        onChangeApiKeyByProvider?.('groq', e.target.value);
                        setKeyValidationStatus('idle');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-purple-300 font-semibold flex items-center space-x-1">
                        <span>3. OpenRouter Key(s):</span>
                        <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1 rounded font-mono">
                          {(apiKeysByProvider?.openrouter || '').split(/[\r\n,;]+/).filter((k) => k.trim().length > 5).length} key(s)
                        </span>
                      </span>
                      <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Get Key →</a>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Paste OpenRouter keys (starts with sk-or-...)..."
                      value={apiKeysByProvider?.openrouter || ''}
                      onChange={(e) => {
                        onChangeApiKeyByProvider?.('openrouter', e.target.value);
                        setKeyValidationStatus('idle');
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                    <span className="text-emerald-400">
                      ⚡ Cross-failover: Gemini ➔ Groq ➔ OpenRouter
                    </span>
                    <button
                      onClick={handleValidateKey}
                      disabled={keyValidationStatus === 'validating'}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded font-medium transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      {keyValidationStatus === 'validating' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Test All Pools</span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Single Provider Key Pool */
                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    placeholder={`Paste one or more ${currentProvider.toUpperCase()} keys (one per line or separated by commas)...`}
                    value={currentKeys}
                    onChange={(e) => handleKeyPoolChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-mono resize-none transition-colors"
                  />

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">
                      🔄 <strong className="text-emerald-400 font-semibold">Auto-Rotation Active:</strong> Auto-shifts on 429 quota
                    </span>
                    <button
                      onClick={handleValidateKey}
                      disabled={!currentKeys.trim() || keyValidationStatus === 'validating'}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] rounded font-medium transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      {keyValidationStatus === 'validating' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Test Pool</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Validation Status */}
              {keyValidationStatus === 'valid' && (
                <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-1.5 rounded">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{keyValidationMessage}</span>
                </div>
              )}
              {keyValidationStatus === 'invalid' && (
                <div className="flex items-center space-x-1.5 text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/40 p-1.5 rounded">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{keyValidationMessage}</span>
                </div>
              )}

              {/* Get API Key Links for Active Provider */}
              {currentProvider === 'gemini' && (
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors pt-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Get free Google Gemini API keys →</span>
                </a>
              )}
              {currentProvider === 'groq' && (
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors pt-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Get free Groq Cloud API key →</span>
                </a>
              )}
              {currentProvider === 'openrouter' && (
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-[11px] text-purple-400 hover:text-purple-300 transition-colors pt-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Get free OpenRouter API key →</span>
                </a>
              )}
                </>
              )}
            </div>

            {/* AI Model Configuration */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3 transition-all">
              <div
                onClick={() => toggleCard('engine')}
                className="flex items-center justify-between cursor-pointer select-none group"
              >
                <div className="flex items-center space-x-2 text-slate-200 font-medium">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>AI Vision Engine</span>
                </div>
                <div className="flex items-center space-x-2">
                  {collapsedCards.engine && (
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {seoConfig.titleStyle || 'Commercial'} • {seoConfig.keywordTargetCount || 46} tags
                    </span>
                  )}
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 group-hover:text-cyan-300 transition-colors cursor-pointer"
                    title={collapsedCards.engine ? 'Maximize (Expand)' : 'Minimize (Collapse)'}
                  >
                    {collapsedCards.engine ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {!collapsedCards.engine && (
                <>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Active Model ({currentProvider.toUpperCase()})
                    </label>
                    {currentProvider === 'gemini' && (
                      <select
                        value={seoConfig.selectedModel || 'gemini-2.5-flash'}
                        onChange={(e) => onChangeSeoConfig({ selectedModel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                      >
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended - High Quota)</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash (Standard)</option>
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Fast)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro (High Detail)</option>
                      </select>
                    )}

                    {currentProvider === 'groq' && (
                      <select
                        value={seoConfig.selectedModel || 'openai/gpt-oss-20b'}
                        onChange={(e) => onChangeSeoConfig({ selectedModel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                      >
                        <option value="openai/gpt-oss-20b">openai/gpt-oss-20b (Ultra-Fast Free - Active)</option>
                        <option value="qwen/qwen3.8-27b">qwen/qwen3.8-27b (High Accuracy Free - Active)</option>
                        <option value="openai/gpt-oss-120b">openai/gpt-oss-120b (High Quality - Active)</option>
                      </select>
                    )}

                    {currentProvider === 'openrouter' && (
                      <select
                        value={seoConfig.selectedModel || 'nvidia/nemotron-3.5-super-vl:free'}
                        onChange={(e) => onChangeSeoConfig({ selectedModel: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                      >
                        <option value="nvidia/nemotron-3.5-super-vl:free">nvidia/nemotron-3.5-super-vl:free (Vision Language Free - Active)</option>
                        <option value="minimax/minimax-m3.1-flash:free">minimax/minimax-m3.1-flash:free (Fast Multimodal Free)</option>
                        <option value="google/gemma-4-26b-a4b-it:free">google/gemma-4-26b-a4b-it:free (Free)</option>
                      </select>
                    )}

                    {currentProvider === 'auto' && (
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 font-sans flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Auto-Failover Pipeline: Gemini 2.5 ➔ Groq ➔ OpenRouter VL</span>
                      </div>
                    )}
                  </div>

                  {/* Title Style */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Title Style</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['commercial', 'descriptive', 'editorial'] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => onChangeSeoConfig({ titleStyle: style })}
                          className={`py-1 text-[11px] capitalize rounded font-medium transition-colors cursor-pointer ${
                            seoConfig.titleStyle === style
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Keyword Count Target Slider */}
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-400">Target Keyword Count</span>
                      <span className="font-mono text-cyan-400 font-semibold">
                        {seoConfig.keywordTargetCount} tags
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="49"
                      value={seoConfig.keywordTargetCount}
                      onChange={(e) =>
                        onChangeSeoConfig({ keywordTargetCount: parseInt(e.target.value) })
                      }
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                      <span>10 (Niche)</span>
                      <span>35 (Optimal)</span>
                      <span>49 (Max Adobe)</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* SEO Optimization Rules */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-3 transition-all">
              <div
                onClick={() => toggleCard('seo')}
                className="flex items-center justify-between cursor-pointer select-none group"
              >
                <div className="flex items-center space-x-2 text-slate-200 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>SEO Ranking Rules</span>
                </div>
                <div className="flex items-center space-x-2">
                  {collapsedCards.seo && (
                    <span className="text-[10px] text-amber-300 font-mono">
                      {[seoConfig.orderKeywordsByWeight, seoConfig.autoAppendFormatTags, seoConfig.isAiGeneratedBatch].filter(Boolean).length} Active
                    </span>
                  )}
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 group-hover:text-cyan-300 transition-colors cursor-pointer"
                    title={collapsedCards.seo ? 'Maximize (Expand)' : 'Minimize (Collapse)'}
                  >
                    {collapsedCards.seo ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {!collapsedCards.seo && (
                <>
                  {/* Weight Ordering */}
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seoConfig.orderKeywordsByWeight}
                      onChange={(e) =>
                        onChangeSeoConfig({ orderKeywordsByWeight: e.target.checked })
                      }
                      className="rounded mt-0.5 accent-indigo-500"
                    />
                    <div>
                      <span className="text-slate-200 font-medium block">
                        Order by search weight (Adobe Top 10)
                      </span>
                      <span className="text-slate-500 text-[10px] block leading-tight">
                        Strictly rank the 10 most relevant commercial nouns first.
                      </span>
                    </div>
                  </label>

                  {/* Auto Format Tags */}
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={seoConfig.autoAppendFormatTags}
                      onChange={(e) =>
                        onChangeSeoConfig({ autoAppendFormatTags: e.target.checked })
                      }
                      className="rounded mt-0.5 accent-indigo-500"
                    />
                    <div>
                      <span className="text-slate-200 font-medium block">
                        Auto-append format tags
                      </span>
                      <span className="text-slate-500 text-[10px] block leading-tight">
                        Appends "vector, eps10, scalable" for vectors, "loop, 4k" for videos.
                      </span>
                    </div>
                  </label>

                  {/* AI-Generated Content Batch Toggle */}
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(seoConfig.isAiGeneratedBatch)}
                      onChange={(e) =>
                        onChangeSeoConfig({ isAiGeneratedBatch: e.target.checked })
                      }
                      className="rounded mt-0.5 accent-cyan-500"
                    />
                    <div>
                      <span className="text-slate-200 font-medium block">
                        AI-Generated Content Batch
                      </span>
                      <span className="text-slate-500 text-[10px] block leading-tight">
                        Automatically applies disclosure tags, prompt fields, and AI illustration categories across platforms.
                      </span>
                    </div>
                  </label>
                </>
              )}
            </div>

            {/* User Series Hints & Location Context */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2.5 transition-all">
              <div
                onClick={() => toggleCard('hints')}
                className="flex items-center justify-between cursor-pointer select-none group"
              >
                <div className="flex items-center space-x-2 text-slate-200 font-medium">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Series Hints & Location Context</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 group-hover:text-cyan-300 transition-colors cursor-pointer"
                    title={collapsedCards.hints ? 'Maximize (Expand)' : 'Minimize (Collapse)'}
                  >
                    {collapsedCards.hints ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {!collapsedCards.hints && (
                <>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Optional Series Theme / Concept</label>
                    <input
                      type="text"
                      placeholder="e.g. series about remote work in Tokyo"
                      value={seoConfig.userHints || ''}
                      onChange={(e) => onChangeSeoConfig({ userHints: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Location & Date (for Alamy / Editorial)</label>
                    <input
                      type="text"
                      placeholder="e.g. New York, USA - October 2026"
                      value={seoConfig.locationDate || ''}
                      onChange={(e) => onChangeSeoConfig({ locationDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Custom Negative Keywords */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2 transition-all">
              <div
                onClick={() => toggleCard('blacklist')}
                className="flex items-center justify-between cursor-pointer select-none group"
              >
                <div className="flex items-center space-x-2 text-slate-200 font-medium">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Custom Blacklist Words</span>
                </div>
                <div className="flex items-center space-x-2">
                  {collapsedCards.blacklist && seoConfig.customNegativeKeywords.length > 0 && (
                    <span className="text-[10px] text-rose-300 font-mono">
                      {seoConfig.customNegativeKeywords.length} words
                    </span>
                  )}
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 group-hover:text-cyan-300 transition-colors cursor-pointer"
                    title={collapsedCards.blacklist ? 'Maximize (Expand)' : 'Minimize (Collapse)'}
                  >
                    {collapsedCards.blacklist ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {!collapsedCards.blacklist && (
                <>
                  <input
                    type="text"
                    placeholder="Type word and press Enter..."
                    value={newNegativeTag}
                    onChange={(e) => setNewNegativeTag(e.target.value)}
                    onKeyDown={handleAddNegativeTag}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                  />

                  {seoConfig.customNegativeKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {seoConfig.customNegativeKeywords.map((tag) => (
                        <span
                          key={tag}
                          className="bg-rose-950/40 border border-rose-800/50 text-rose-300 text-[10px] px-2 py-0.5 rounded-full flex items-center space-x-1"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => handleRemoveNegativeTag(tag)}
                            className="hover:text-rose-100 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
