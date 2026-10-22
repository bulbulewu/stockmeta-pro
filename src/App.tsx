import React, { useState, useEffect } from 'react';
import { DesktopHeader } from './components/DesktopHeader';
import { MarketplaceSidebar } from './components/MarketplaceSidebar';
import { WorkspaceDropzone } from './components/WorkspaceDropzone';
import { MetadataInspector } from './components/MetadataInspector';
import { ExportBottomBar } from './components/ExportBottomBar';
import { CsvExportModal } from './components/CsvExportModal';
import { EmbedModal } from './components/EmbedModal';
import { PlatformSettingsModal } from './components/PlatformSettingsModal';
import { RiskComplianceModal } from './components/RiskComplianceModal';
import { VerificationReportModal } from './components/VerificationReportModal';
import { SubmissionTrackerModal } from './components/SubmissionTrackerModal';
import { BulkMetadataModal } from './components/BulkMetadataModal';
import { PrivacyNoticeModal } from './components/PrivacyNoticeModal';
import { ReadmeModal } from './components/ReadmeModal';
import { AuthModal } from './components/AuthModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ActivateKeyModal } from './components/ActivateKeyModal';
import { SEOConfig, StockFile, UserProfile, SystemAuthConfig } from './types/stock';
import { ALL_MARKETPLACE_IDS, TIER_1_MARKETPLACE_IDS, TIER_2_MARKETPLACE_IDS } from './config/marketplaces';
import { generateSampleStockFiles } from './utils/sampleAssets';
import { QueueController, runBatchVisionAnalysis } from './services/visionAiService';

export default function App() {
  // User Authentication & License State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string>(() => {
    try { return localStorage.getItem('stockmeta_auth_token') || ''; } catch { return ''; }
  });
  const [authConfig, setAuthConfig] = useState<SystemAuthConfig | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isActivateKeyModalOpen, setIsActivateKeyModalOpen] = useState(false);

  // Default responsive zoom: 0.88 fits 100% of all app functions on any screen
  const [appZoom, setAppZoom] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('stockmeta_app_zoom');
      return saved ? parseFloat(saved) : 0.88;
    } catch {
      return 0.88;
    }
  });

  const handleZoomIn = () => {
    setAppZoom((prev) => {
      const next = Math.min(1.2, +(prev + 0.05).toFixed(2));
      try { localStorage.setItem('stockmeta_app_zoom', String(next)); } catch {}
      return next;
    });
  };

  const handleZoomOut = () => {
    setAppZoom((prev) => {
      const next = Math.max(0.7, +(prev - 0.05).toFixed(2));
      try { localStorage.setItem('stockmeta_app_zoom', String(next)); } catch {}
      return next;
    });
  };

  const handleResetZoom = () => {
    setAppZoom(0.88);
    try { localStorage.setItem('stockmeta_app_zoom', '0.88'); } catch {}
  };

  // Fetch current user and auth settings on load
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('stockmeta_auth_token') || '';
        const res = await fetch('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
            if (data.settings?.authRequired) {
              setIsAuthModalOpen(true);
            }
          }
          if (data.settings) {
            setAuthConfig(data.settings);
          }
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      }
    };
    fetchMe();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('stockmeta_auth_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {}
    localStorage.removeItem('stockmeta_auth_token');
    setCurrentUser(null);
    setAuthToken('');
    setIsAuthModalOpen(true);
  };

  // Gemini API Key State (stored in localStorage for persistence)
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try { return localStorage.getItem('stockmeta_gemini_keys') || localStorage.getItem('stockmeta_gemini_key') || ''; } catch { return ''; }
  });

  // Provider API Keys State (stored in localStorage for persistence)
  const [apiKeysByProvider, setApiKeysByProvider] = useState<Record<string, string>>(() => {
    try {
      const gemini = localStorage.getItem('stockmeta_gemini_keys') || localStorage.getItem('stockmeta_gemini_key') || '';
      const groq = localStorage.getItem('stockmeta_groq_keys') || '';
      const openrouter = localStorage.getItem('stockmeta_openrouter_keys') || '';
      return { gemini, groq, openrouter };
    } catch {
      return { gemini: '', groq: '', openrouter: '' };
    }
  });

  const handleUpdateApiKeyByProvider = (provider: string, keys: string) => {
    setApiKeysByProvider((prev) => {
      const next = { ...prev, [provider]: keys };
      try {
        localStorage.setItem(`stockmeta_${provider}_keys`, keys);
        if (provider === 'gemini') {
          localStorage.setItem('stockmeta_gemini_key', keys);
          setGeminiApiKey(keys);
        }
      } catch {}
      return next;
    });
  };

  // Settings & Readme Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReadmeModalOpen, setIsReadmeModalOpen] = useState(false);

  // Persist API key to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('stockmeta_gemini_key', geminiApiKey);
      localStorage.setItem('stockmeta_gemini_keys', geminiApiKey);
    } catch {}
  }, [geminiApiKey]);

  // Batch Stock Files State (Restored from sessionStorage across browser refresh)
  const [files, setFiles] = useState<StockFile[]>(() => {
    try {
      const saved = sessionStorage.getItem('stockmeta_workspace_files');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedFileId, setSelectedFileId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('stockmeta_selected_file_id') || null;
    } catch {
      return null;
    }
  });
  const [checkedFileIds, setCheckedFileIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem('stockmeta_checked_file_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected Marketplaces State (Restored from localStorage across browser refresh)
  const [selectedMarketplaceIds, setSelectedMarketplaceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('stockmeta_selected_marketplaces');
      return saved ? JSON.parse(saved) : ['adobe_stock'];
    } catch {
      return ['adobe_stock'];
    }
  });

  // Persist files and selections to sessionStorage across browser refresh
  useEffect(() => {
    try {
      if (files.length > 0) {
        const lightweight = files.map((f) => ({
          ...f,
          previewUrl: f.previewUrl?.startsWith('blob:') ? undefined : f.previewUrl,
        }));
        sessionStorage.setItem('stockmeta_workspace_files', JSON.stringify(lightweight));
      } else {
        sessionStorage.removeItem('stockmeta_workspace_files');
      }
    } catch (e) {
      console.warn('Could not save workspace to sessionStorage:', e);
    }
  }, [files]);

  useEffect(() => {
    try {
      if (selectedFileId) {
        sessionStorage.setItem('stockmeta_selected_file_id', selectedFileId);
      } else {
        sessionStorage.removeItem('stockmeta_selected_file_id');
      }
    } catch {}
  }, [selectedFileId]);

  useEffect(() => {
    try {
      sessionStorage.setItem('stockmeta_checked_file_ids', JSON.stringify(checkedFileIds));
    } catch {}
  }, [checkedFileIds]);

  useEffect(() => {
    try {
      localStorage.setItem('stockmeta_selected_marketplaces', JSON.stringify(selectedMarketplaceIds));
    } catch {}
  }, [selectedMarketplaceIds]);

  // Preserve scroll position across page refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem('stockmeta_scroll_y', String(window.scrollY));
        sessionStorage.setItem('stockmeta_scroll_x', String(window.scrollX));
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    const savedY = sessionStorage.getItem('stockmeta_scroll_y');
    const savedX = sessionStorage.getItem('stockmeta_scroll_x');
    if (savedY || savedX) {
      setTimeout(() => {
        window.scrollTo(parseInt(savedX || '0'), parseInt(savedY || '0'));
      }, 80);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Vector CSV Filename Resolution Preference
  const [vectorCsvPreference, setVectorCsvPreference] = useState<'primary' | 'companion_jpg' | 'zip'>('primary');

  // SEO & AI Config State
  const [seoConfig, setSeoConfig] = useState<SEOConfig>({
    orderKeywordsByWeight: true,
    autoAppendFormatTags: true,
    negativeKeywordsFilter: true,
    customNegativeKeywords: ['watermark', 'sample', 'preview'],
    keywordTargetCount: 38,
    titleStyle: 'commercial',
    temperature: 0.2,
    selectedModel: 'Auto-Failover Pipeline',
    aiProvider: 'auto',
  });

  // Batch analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ total: number; completed: number; failed: number; estimatedSecondsRemaining?: number } | undefined>(undefined);
  const [queueController, setQueueController] = useState<QueueController | null>(null);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  // Auto-dismiss API notice after 7 seconds so it doesn't stay permanently
  useEffect(() => {
    if (!apiNotice) return;
    const timer = setTimeout(() => {
      setApiNotice(null);
    }, 7000);
    return () => clearTimeout(timer);
  }, [apiNotice]);

  // Compute dynamic active provider label for top bar
  const activeProviderLabel = (() => {
    const prov = seoConfig.aiProvider || 'auto';
    const hasGemini = Boolean(apiKeysByProvider.gemini || geminiApiKey);
    const hasGroq = Boolean(apiKeysByProvider.groq);
    const hasOpenRouter = Boolean(apiKeysByProvider.openrouter);

    if (prov === 'groq') return 'Groq Cloud (Llama 3.2 90B)';
    if (prov === 'openrouter') return 'OpenRouter (Nemotron VL)';
    if (prov === 'gemini') return 'Gemini 2.5 Flash';

    const activeList: string[] = [];
    if (hasGemini) activeList.push('Gemini');
    if (hasGroq) activeList.push('Groq');
    if (hasOpenRouter) activeList.push('OpenRouter');

    if (activeList.length > 1) {
      return `Auto-Failover (${activeList.join(' ➔ ')})`;
    }
    if (activeList.length === 1) {
      return `${activeList[0]} Vision AI`;
    }
    return 'Vision AI (Multi-Provider)';
  })();

  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const handleToggleMarketplace = (id: string) => {
    setSelectedMarketplaceIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSelectAllMarketplaces = () => {
    setSelectedMarketplaceIds(ALL_MARKETPLACE_IDS);
  };

  const handleSelectTier1 = () => {
    setSelectedMarketplaceIds(TIER_1_MARKETPLACE_IDS);
  };

  const handleSelectTier2 = () => {
    setSelectedMarketplaceIds(TIER_2_MARKETPLACE_IDS);
  };

  const handleClearMarketplaces = () => {
    setSelectedMarketplaceIds([]);
  };

  const handleUpdateSeoConfig = (patch: Partial<SEOConfig>) => {
    setSeoConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleFilesAdded = (newFiles: StockFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    if (!selectedFileId && newFiles.length > 0) {
      setSelectedFileId(newFiles[0].id);
    }
  };

  const handleToggleCheckFile = (fileId: string) => {
    setCheckedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleCheckAll = () => {
    setCheckedFileIds(files.map((f) => f.id));
  };

  const handleUncheckAll = () => {
    setCheckedFileIds([]);
  };

  const handleUpdateMetadata = (fileId: string, updated: Partial<StockFile['metadata']>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, metadata: { ...f.metadata, ...updated } } : f))
    );
  };

  const handleDuplicateToAll = (sourceFileId: string) => {
    const source = files.find((f) => f.id === sourceFileId);
    if (!source) return;

    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        metadata: {
          ...f.metadata,
          title: source.metadata.title,
          description: source.metadata.description,
          keywords: [...source.metadata.keywords],
          primaryCategory: source.metadata.primaryCategory,
          secondaryCategory: source.metadata.secondaryCategory,
          adobeCategoryId: source.metadata.adobeCategoryId,
        },
      }))
    );
  };

  // Run Batch Vision AI Analysis (100-file anti-freeze & memory-safe architecture)
  const handleRunBatchAnalysis = async (fileIdsToAnalyze: string[]) => {
    const targetFiles = files.filter((f) => fileIdsToAnalyze.includes(f.id));
    if (targetFiles.length === 0) return;

    const currentProvider = seoConfig.aiProvider || 'auto';
    const hasAnyKey = Boolean(
      (apiKeysByProvider.gemini && apiKeysByProvider.gemini.trim()) ||
      (apiKeysByProvider.groq && apiKeysByProvider.groq.trim()) ||
      (apiKeysByProvider.openrouter && apiKeysByProvider.openrouter.trim()) ||
      (geminiApiKey && geminiApiKey.trim())
    );

    // Strict check: Show clear UI warning if NO keys at all are configured
    if (!hasAnyKey) {
      const missingMsg = `⚠️ No Vision AI keys found! Please enter at least one free API key (Gemini, Groq Cloud, or OpenRouter) in the "AI Engine & SEO" sidebar.`;
      setApiNotice(missingMsg);
      alert('No API key configured!\n\nPlease enter at least one free API key for Google Gemini, Groq Cloud, or OpenRouter in the "AI Engine & SEO" sidebar tab before running analysis.');
      return;
    }

    const autoConsolidatedKeys = [
      apiKeysByProvider.gemini,
      geminiApiKey,
      apiKeysByProvider.groq,
      apiKeysByProvider.openrouter,
    ].filter((k) => k && k.trim()).join('\n');

    const activeKeys = (
      currentProvider === 'auto'
        ? autoConsolidatedKeys
        : (apiKeysByProvider[currentProvider] || (currentProvider === 'gemini' ? geminiApiKey : '') || '')
    ).trim();

    const controller = new QueueController();
    setQueueController(controller);
    setIsQueuePaused(false);
    setIsAnalyzing(true);
    setBatchProgress({
      total: targetFiles.length,
      completed: 0,
      failed: 0,
      estimatedSecondsRemaining: undefined,
    });

    // Mark status as 'queued' immediately for all target files
    setFiles((prev) =>
      prev.map((f) => (fileIdsToAnalyze.includes(f.id) ? { ...f, status: 'queued' } : f))
    );

    try {
      await runBatchVisionAnalysis({
        files: targetFiles,
        seoOptions: seoConfig,
        apiKey: activeKeys,
        apiKeys: activeKeys,
        allProvidersKeys: apiKeysByProvider,
        provider: currentProvider,
        concurrency: 3, // Worker pool = 3 files in parallel
        delayBetweenRequestsMs: 350, // Pacing delay to stay smoothly within limits
        controller,
        onFileStarted: (started) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === started.id ? { ...f, status: 'analyzing' } : f))
          );
        },
        onProgress: (completed, total, currentFile, estimatedSecondsRemaining) => {
          setBatchProgress((prev) => ({
            total,
            completed,
            failed: prev?.failed || 0,
            estimatedSecondsRemaining,
          }));
        },
        onFileCompleted: (updated) => {
          setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        },
        onFileFailed: (failed, error) => {
          setFiles((prev) => prev.map((f) => (f.id === failed.id ? failed : f)));
          setBatchProgress((prev) => prev ? { ...prev, failed: prev.failed + 1 } : undefined);
          const isTimeout = error.toLowerCase().includes('time') || error.toLowerCase().includes('network');
          const friendlyMsg = isTimeout
            ? `"${failed.name}": Cloud latency occurred, but offline Smart Semantic Engine automatically protected and completed metadata.`
            : `"${failed.name}": ${error}`;
          setApiNotice(friendlyMsg);
        },
      });
    } catch (err: any) {
      console.error('Batch error:', err);
    } finally {
      setIsAnalyzing(false);
      setQueueController(null);
      setIsQueuePaused(false);
    }
  };

  const handleTogglePauseQueue = () => {
    if (!queueController) return;
    if (queueController.isPaused) {
      queueController.resume();
      setIsQueuePaused(false);
    } else {
      queueController.pause();
      setIsQueuePaused(true);
    }
  };

  const handleCancelQueue = () => {
    if (queueController) {
      queueController.cancel();
      setFiles((prev) =>
        prev.map((f) => (f.status === 'analyzing' ? { ...f, status: 'idle' } : f))
      );
      setIsAnalyzing(false);
      setQueueController(null);
      setIsQueuePaused(false);
    }
  };

  const handleRegenerateSingle = (fileId: string) => {
    handleRunBatchAnalysis([fileId]);
  };

  const selectedFile = files.find((f) => f.id === selectedFileId) || null;

  return (
    <div
      style={{
        zoom: appZoom,
        width: `${(100 / appZoom).toFixed(4)}vw`,
        height: `${(100 / appZoom).toFixed(4)}vh`,
      } as React.CSSProperties}
      className="flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased"
    >
      {/* 1. Desktop Window Header Bar */}
      <DesktopHeader
        totalFiles={files.length}
        readyFiles={files.filter((f) => f.status === 'ready').length}
        version="Studio v3.37"
        activeProviderLabel={activeProviderLabel}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenActivateKey={() => setIsActivateKeyModalOpen(true)}
        onLogout={handleLogout}
        zoomLevel={appZoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onClearAll={() => {
          setFiles([]);
          setSelectedFileId(null);
          setCheckedFileIds([]);
          try {
            sessionStorage.removeItem('stockmeta_workspace_files');
            sessionStorage.removeItem('stockmeta_selected_file_id');
            sessionStorage.removeItem('stockmeta_checked_file_ids');
          } catch {}
        }}
      />

      {/* API Notice / Auto-Recovery Notice Banner */}
      {apiNotice && (
        <div className="bg-indigo-950/90 border-b border-indigo-700/60 text-indigo-200 px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-cyan-300">✨ Metadata Protection Notice:</span>
            <span className="text-slate-200">{apiNotice}</span>
          </div>
          <button
            onClick={() => setApiNotice(null)}
            className="text-slate-400 hover:text-white cursor-pointer ml-3 font-bold text-sm"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Main 3-Pane Workspace Shell */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: 26-Marketplace Selector & AI/SEO Settings */}
        <MarketplaceSidebar
          selectedMarketplaceIds={selectedMarketplaceIds}
          onToggleMarketplace={handleToggleMarketplace}
          onSelectAll={handleSelectAllMarketplaces}
          onSelectTier1={handleSelectTier1}
          onSelectTier2={handleSelectTier2}
          onClearMarketplaces={handleClearMarketplaces}
          seoConfig={seoConfig}
          onChangeSeoConfig={handleUpdateSeoConfig}
          vectorCsvPreference={vectorCsvPreference}
          onChangeVectorCsvPreference={setVectorCsvPreference}
          geminiApiKey={geminiApiKey}
          onChangeGeminiApiKey={setGeminiApiKey}
          apiKeysByProvider={apiKeysByProvider}
          onChangeApiKeyByProvider={handleUpdateApiKeyByProvider}
          onOpenReadme={() => setIsReadmeModalOpen(true)}
        />

        {/* Center: File Dropzone & Thumbnail Grid with Companion Badges */}
        <WorkspaceDropzone
          files={files}
          selectedFileId={selectedFileId}
          onSelectFile={setSelectedFileId}
          checkedFileIds={checkedFileIds}
          onToggleCheckFile={handleToggleCheckFile}
          onCheckAll={handleCheckAll}
          onUncheckAll={handleUncheckAll}
          onFilesAdded={handleFilesAdded}
          onRunBatchAnalysis={handleRunBatchAnalysis}
          isAnalyzing={isAnalyzing}
          batchProgress={batchProgress}
          onUpdateFile={(updated) => setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))}
          onBatchUpdateFiles={setFiles}
          onOpenBulkModal={() => setIsBulkModalOpen(true)}
          isQueuePaused={isQueuePaused}
          onTogglePauseQueue={handleTogglePauseQueue}
          onCancelQueue={handleCancelQueue}
          onOpenCsvModal={() => setIsCsvModalOpen(true)}
        />

        {/* Right: Live Metadata Inspector Panel */}
        <MetadataInspector
          selectedFile={selectedFile}
          selectedMarketplaceIds={selectedMarketplaceIds}
          onUpdateMetadata={handleUpdateMetadata}
          onRegenerateSingle={handleRegenerateSingle}
          onDuplicateToAll={handleDuplicateToAll}
          isAnalyzing={isAnalyzing}
          onOpenRiskModal={() => setIsRiskModalOpen(true)}
        />
      </div>

      {/* 3. Bottom Dual Action Export Bar */}
      <ExportBottomBar
        files={files}
        selectedMarketplaceCount={selectedMarketplaceIds.length}
        onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        isProcessing={isAnalyzing}
      />

      {/* 4. Modals */}
      <CsvExportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        files={files}
        selectedMarketplaceIds={selectedMarketplaceIds}
        vectorCsvPreference={vectorCsvPreference}
      />

      <EmbedModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        files={files}
      />

      <PlatformSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onOpenReadme={() => setIsReadmeModalOpen(true)}
        onOpenBulkModal={() => setIsBulkModalOpen(true)}
        onOpenRiskModal={() => setIsRiskModalOpen(true)}
        onOpenVerificationReport={() => setIsVerificationModalOpen(true)}
        onOpenTrackerModal={() => setIsTrackerModalOpen(true)}
        onOpenPrivacyNotice={() => setIsPrivacyModalOpen(true)}
      />

      <ReadmeModal
        isOpen={isReadmeModalOpen}
        onClose={() => setIsReadmeModalOpen(false)}
        currentUser={currentUser}
        onOpenActivateKey={() => {
          setIsReadmeModalOpen(false);
          setIsActivateKeyModalOpen(true);
        }}
        onOpenAuth={() => {
          setIsReadmeModalOpen(false);
          setIsAuthModalOpen(true);
        }}
      />

      <RiskComplianceModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        files={files}
        selectedFileId={selectedFileId}
        onSelectFile={setSelectedFileId}
        onUpdateMetadata={handleUpdateMetadata}
      />

      <VerificationReportModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        files={files}
        selectedFileId={selectedFileId}
        onSelectFile={setSelectedFileId}
      />

      <SubmissionTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        files={files}
      />

      <BulkMetadataModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        files={files}
        checkedFileIds={checkedFileIds}
        onApplyBulkChanges={(updated) => setFiles(updated)}
      />

      <PrivacyNoticeModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        authConfig={authConfig}
        onAuthSuccess={(user, token) => {
          setCurrentUser(user);
          setAuthToken(token);
        }}
      />

      <AdminPanelModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        token={authToken}
      />

      <ActivateKeyModal
        isOpen={isActivateKeyModalOpen}
        onClose={() => setIsActivateKeyModalOpen(false)}
        currentUser={currentUser}
        token={authToken}
        onOpenAuth={() => {
          setIsActivateKeyModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        onActivationSuccess={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
      />
    </div>
  );
}
