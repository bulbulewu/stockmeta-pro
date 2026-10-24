import React from 'react';
import { Layers, Trash2, Key } from 'lucide-react';
import { UserProfile } from '../types/stock';

interface DesktopHeaderProps {
  totalFiles: number;
  readyFiles: number;
  version?: string;
  activeProviderLabel?: string;
  onLoadSamples?: () => void;
  onClearAll: () => void;
  onOpenSettings?: () => void;
  onOpenRiskModal?: () => void;
  onOpenVerificationReport?: () => void;
  onOpenTrackerModal?: () => void;
  onOpenBulkModal?: () => void;
  onOpenPrivacyNotice?: () => void;
  onOpenReadme?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenAdmin?: () => void;
  onOpenActivateKey?: () => void;
  onLogout?: () => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  activeTheme?: string;
  onChangeTheme?: (theme: string) => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  totalFiles,
  readyFiles,
  version = 'Studio v3.37',
  activeProviderLabel,
  onLoadSamples,
  onClearAll,
  onOpenSettings,
  onOpenRiskModal,
  onOpenVerificationReport,
  onOpenTrackerModal,
  onOpenBulkModal,
  onOpenPrivacyNotice,
  onOpenReadme,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onOpenActivateKey,
  onLogout,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  activeTheme = 'dark_studio',
  onChangeTheme,
}) => {
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}
  };

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 select-none shrink-0 z-20">
      {/* Left: Window controls and Brand */}
      <div className="flex items-center space-x-4">
        {/* macOS style window controls */}
        <div className="flex items-center space-x-2">
          <div
            onClick={() => {
              if (totalFiles > 0 && confirm('Clear all files and reset workspace?')) {
                onClearAll();
              }
            }}
            title="🔴 Red Ball: Clear Workspace & Reset Queue"
            className="w-3 h-3 rounded-full bg-rose-500/80 hover:bg-rose-500 border border-rose-600/50 cursor-pointer transition-colors shadow-sm"
          />
          <div
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
            }}
            title="🟡 Yellow Ball: Open Settings & Providers"
            className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 border border-amber-600/50 cursor-pointer transition-colors shadow-sm"
          />
          <div
            onClick={toggleFullscreen}
            title="🟢 Green Ball: Toggle Fullscreen Mode"
            className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 border border-emerald-600/50 cursor-pointer transition-colors shadow-sm"
          />
        </div>

        <div className="h-4 w-px bg-slate-800" />

        {/* App Title & Badge */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
            StockMeta Pro
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {version}
            </span>
          </span>
        </div>
      </div>

      {/* Center: Batch status pill */}
      <div className="flex items-center space-x-2 text-xs">
        <div className="bg-slate-950/80 border border-slate-800 rounded-full px-3 py-1 flex items-center space-x-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Batch Queue:</span>
          <strong className="text-white">{totalFiles} Files</strong>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-medium">{readyFiles} Ready</span>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-full px-3 py-1 flex items-center space-x-1.5 text-slate-400">
          <span className="text-[10px]">26+ Marketplaces</span>
          <span className="text-slate-600">•</span>
          <span className="text-[10px] text-cyan-400 font-medium">⚡ {activeProviderLabel || 'Multi-Provider Vision AI'}</span>
        </div>

        {/* Quick Zoom Controls */}
        <div className="flex items-center space-x-1 bg-slate-950/80 border border-slate-800 rounded-full px-2 py-0.5 text-xs text-slate-300">
          <button
            onClick={onZoomOut}
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            title="Zoom Out (Fit more on screen)"
          >
            -
          </button>
          <button
            onClick={onResetZoom}
            className="text-[10px] font-mono px-1 text-slate-300 hover:text-indigo-400 cursor-pointer"
            title="Reset Zoom to 88%"
          >
            {Math.round((zoomLevel || 0.88) * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
            title="Zoom In (Bigger text)"
          >
            +
          </button>
        </div>
      </div>

      {/* Right: Quick actions & Settings */}
      <div className="flex items-center space-x-2">
        {/* Return to Media Toolkit Pro Button (Synchronized with Active Theme & SSO) */}
        <a
          href={`https://midea-upscaler-pro.onrender.com/?theme=${activeTheme}${currentUser ? `&sso_user=${encodeURIComponent(currentUser.email || currentUser.username)}&sso_token=sso` : ''}`}
          className="flex items-center space-x-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-950/70 hover:bg-indigo-900/90 px-3 py-1.5 rounded-md transition-colors cursor-pointer border border-indigo-500/40 shadow-sm font-semibold select-none"
          title="Return to Media Toolkit Pro — 4K Video, Image Upscaler & Microstock Suite"
        >
          <span>🎬</span>
          <span>Media Toolkit Pro</span>
        </a>

        {/* Unified Theme Switcher Dropdown (Synchronized with Media Toolkit Pro) */}
        <div className="relative group">
          <button
            className="flex items-center space-x-1.5 text-xs text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-slate-700 shadow-sm font-medium"
            title="Switch Studio Theme (Synchronized with Media Toolkit Pro)"
          >
            <span>🎨</span>
            <span className="capitalize">{activeTheme ? activeTheme.replace('_', ' ') : 'Dark Studio'}</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-40 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-1 hidden group-hover:block z-50">
            <button
              type="button"
              onClick={() => onChangeTheme && onChangeTheme('dark_studio')}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-slate-800 transition-colors ${activeTheme === 'dark_studio' ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}
            >
              <span>🌙</span>
              <span>Dark Studio</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme && onChangeTheme('obsidian_oled')}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-slate-800 transition-colors ${activeTheme === 'obsidian_oled' ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}
            >
              <span>🖤</span>
              <span>Obsidian OLED</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme && onChangeTheme('cyber_neon')}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-slate-800 transition-colors ${activeTheme === 'cyber_neon' ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}
            >
              <span>⚡</span>
              <span>Cyber Neon</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeTheme && onChangeTheme('titanium_light')}
              className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-slate-800 transition-colors ${activeTheme === 'titanium_light' ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}
            >
              <span>☀️</span>
              <span>Titanium Light</span>
            </button>
          </div>
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 text-xs text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 px-3 py-1.5 rounded-md transition-colors cursor-pointer border border-slate-700 shadow-sm font-medium"
            title="Open Platform Settings, Bulk Tools, IP Risk, Verify, Submissions & Documentation"
          >
            <span>⚙️ Settings</span>
          </button>
        )}

        {/* User / Auth / Admin Controls */}
        {currentUser ? (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            {currentUser.role === 'admin' ? (
              <button
                onClick={onOpenAdmin}
                className="flex items-center space-x-1.5 text-xs text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900/80 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-amber-600/50 shadow-sm"
                title="Open Admin License & Users Panel"
              >
                <span>👑 Admin Panel</span>
              </button>
            ) : (
              <div className="flex items-center space-x-1.5 text-xs bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                <span className="font-semibold text-white">{currentUser.username}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    currentUser.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {currentUser.status === 'active' ? `🟢 ${currentUser.daysLeft}d left` : '🔴 Expired'}
                </span>
                {currentUser.dailyLimit > 0 && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({currentUser.usedToday}/{currentUser.dailyLimit})
                  </span>
                )}
              </div>
            )}

            {/* Activate Key Button */}
            <button
              onClick={onOpenActivateKey}
              className="flex items-center space-x-1 text-xs text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/80 px-2 py-1.5 rounded-md transition-colors cursor-pointer border border-emerald-600/50 shadow-sm"
              title="Activate or Extend Subscription with License Key"
            >
              <Key className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold">Activate Key</span>
            </button>

            <button
              onClick={onLogout}
              className="text-[11px] text-slate-400 hover:text-rose-400 px-1.5 py-1 transition-colors cursor-pointer"
              title="Logout"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <button
              onClick={onOpenActivateKey}
              className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/60 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-emerald-600/40"
              title="Activate Account with License Key"
            >
              <Key className="w-3 h-3 text-emerald-400" />
              <span className="font-medium">Activate Key</span>
            </button>
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-md transition-colors cursor-pointer shadow-sm shadow-indigo-600/30"
            >
              <span>Sign In / Register</span>
            </button>
          </div>
        )}

        {totalFiles > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
            title="Clear all files from workspace"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </header>
  );
};
