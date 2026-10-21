import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, RefreshCw, Check, ExternalLink } from 'lucide-react';

interface FolderDestinationPickerProps {
  value: string;
  onChange: (folder: string) => void;
  label?: string;
  helpText?: string;
  lastSavedFolder?: string | null;
}

export const FolderDestinationPicker: React.FC<FolderDestinationPickerProps> = ({
  value,
  onChange,
  label = 'Output / Download Destination Folder',
  helpText = 'Files will be saved directly into this folder on your computer in addition to browser download.',
  lastSavedFolder,
}) => {
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [systemFolders, setSystemFolders] = useState<{ desktop?: string; downloads?: string } | null>(null);

  useEffect(() => {
    fetch('/api/system-folders')
      .then((res) => res.json())
      .then((data) => setSystemFolders(data))
      .catch(() => {});
  }, []);

  const handleBrowse = async () => {
    try {
      setIsBrowsing(true);
      const res = await fetch('/api/browse-folder', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.folderPath && !data.cancelled) {
          onChange(data.folderPath);
          try {
            localStorage.setItem('stockmeta_custom_output_folder', data.folderPath);
          } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to browse folder:', err);
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleOpenFolder = async (folderToOpen: string) => {
    if (!folderToOpen) return;
    try {
      await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: folderToOpen }),
      });
    } catch (err) {
      console.error('Failed to open folder:', err);
    }
  };

  return (
    <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-200 flex items-center space-x-2">
          <Folder className="w-4 h-4 text-cyan-400" />
          <span>{label}</span>
        </label>

        {/* Quick Shortcut Buttons */}
        <div className="flex items-center space-x-1.5 text-[10px]">
          {systemFolders?.downloads && (
            <button
              type="button"
              onClick={() => {
                onChange(systemFolders.downloads!);
                try {
                  localStorage.setItem('stockmeta_custom_output_folder', systemFolders.downloads!);
                } catch {}
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
              title={systemFolders.downloads}
            >
              📥 Downloads
            </button>
          )}
          {systemFolders?.desktop && (
            <button
              type="button"
              onClick={() => {
                onChange(systemFolders.desktop!);
                try {
                  localStorage.setItem('stockmeta_custom_output_folder', systemFolders.desktop!);
                } catch {}
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors cursor-pointer"
              title={systemFolders.desktop}
            >
              🖥️ Desktop
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                try {
                  localStorage.removeItem('stockmeta_custom_output_folder');
                } catch {}
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Input + Action Buttons */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              try {
                if (e.target.value) {
                  localStorage.setItem('stockmeta_custom_output_folder', e.target.value);
                }
              } catch {}
            }}
            placeholder="Default (Browser Downloads) or custom path e.g. E:\Stock_Uploads"
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={handleBrowse}
          disabled={isBrowsing}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
          title="Browse folder on your computer"
        >
          {isBrowsing ? (
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : (
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span>{isBrowsing ? 'Browsing...' : 'Browse...'}</span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => handleOpenFolder(value)}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 rounded-lg text-xs border border-slate-800 transition-colors shrink-0 cursor-pointer"
            title="Open destination folder in Windows File Explorer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{helpText}</span>
        {lastSavedFolder && (
          <span className="flex items-center space-x-1 text-emerald-400 font-medium">
            <Check className="w-3 h-3" />
            <span className="truncate max-w-[220px]" title={lastSavedFolder}>
              Saved directly to disk
            </span>
          </span>
        )}
      </div>
    </div>
  );
};
