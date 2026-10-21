import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Download,
  Upload,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  ContributorStats,
  MarketplaceSubmissionRecord,
  RejectionReasonCategory,
  StockFile,
  SubmissionStatus,
} from '../types/stock';
import {
  submissionStore,
  REJECTION_CATEGORIES,
  RejectionCategoryStats,
} from '../utils/submissionStore';
import { MARKETPLACES } from '../config/marketplaces';

interface SubmissionTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StockFile[];
}

export const SubmissionTrackerModal: React.FC<SubmissionTrackerModalProps> = ({
  isOpen,
  onClose,
  files,
}) => {
  const [records, setRecords] = useState<MarketplaceSubmissionRecord[]>([]);
  const [stats, setStats] = useState<ContributorStats>({
    totalPrepared: 0,
    totalSubmitted: 0,
    totalAccepted: 0,
    totalRejected: 0,
    acceptanceRate: 0,
    totalEarningsUsd: 0,
    totalDownloads: 0,
  });
  const [rejections, setRejections] = useState<RejectionCategoryStats[]>([]);

  // Add new submission form state
  const [selectedAssetId, setSelectedAssetId] = useState<string>(files[0]?.id || '');
  const [selectedMarketplaceId, setSelectedMarketplaceId] = useState<string>('adobe');
  const [newStatus, setNewStatus] = useState<SubmissionStatus>('submitted');
  const [rejectionCat, setRejectionCat] = useState<RejectionReasonCategory>('technical_quality');
  const [rejectionNote, setRejectionNote] = useState('');
  const [earnings, setEarnings] = useState<string>('0');
  const [downloads, setDownloads] = useState<string>('0');

  const refreshData = () => {
    setRecords(submissionStore.getAll());
    setStats(submissionStore.computeStats());
    setRejections(submissionStore.getRejectionBreakdown());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = files.find((f) => f.id === selectedAssetId) || { name: 'Manual Asset Entry', id: selectedAssetId };
    const marketplace = MARKETPLACES[selectedMarketplaceId] || { name: selectedMarketplaceId, id: selectedMarketplaceId };

    submissionStore.addOrUpdate({
      assetId: asset.id,
      assetName: asset.name,
      marketplaceId: marketplace.id,
      marketplaceName: marketplace.name,
      status: newStatus,
      submissionDate: new Date().toISOString().slice(0, 10),
      rejectionCategory: newStatus === 'rejected' ? rejectionCat : undefined,
      rejectionNotes: newStatus === 'rejected' ? rejectionNote : undefined,
      earningsUsd: parseFloat(earnings) || 0,
      downloadsCount: parseInt(downloads, 10) || 0,
    });

    refreshData();
  };

  const handleDelete = (id: string) => {
    submissionStore.delete(id);
    refreshData();
  };

  const handleExportBackup = () => {
    const json = submissionStore.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stockmeta_submissions_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && submissionStore.importBackupJson(content)) {
        refreshData();
        alert('Submissions imported successfully!');
      } else {
        alert('Invalid submissions backup JSON format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Stock Contributor Submission & Performance Tracking
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Feature 4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Track submitted assets, acceptance rates, rejection root causes, and sales revenue
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportBackup}
              className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              title="Export JSON backup of your records"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <label className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real Data Notice */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-[11px]">
              <strong>Strictly User-Recorded Performance Data:</strong> Zero synthetic or fake numbers. All statistics
              reflect verified user entries and marketplace results.
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">{records.length} Submissions Logged</span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {/* Top KPI Cards Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] uppercase font-mono text-slate-500">Prepared</div>
              <div className="text-xl font-bold font-mono text-slate-200 mt-0.5">{stats.totalPrepared}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <div className="text-[10px] uppercase font-mono text-blue-400">Submitted</div>
              <div className="text-xl font-bold font-mono text-blue-300 mt-0.5">{stats.totalSubmitted}</div>
            </div>
            <div className="bg-slate-950/60 border border-emerald-900/40 p-3 rounded-xl">
              <div className="text-[10px] uppercase font-mono text-emerald-400">Accepted</div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">{stats.totalAccepted}</div>
            </div>
            <div className="bg-slate-950/60 border border-rose-900/40 p-3 rounded-xl">
              <div className="text-[10px] uppercase font-mono text-rose-400">Rejected</div>
              <div className="text-xl font-bold font-mono text-rose-300 mt-0.5">{stats.totalRejected}</div>
            </div>
            <div className="bg-slate-950/60 border border-indigo-900/40 p-3 rounded-xl">
              <div className="text-[10px] uppercase font-mono text-indigo-400">Acceptance Rate</div>
              <div className="text-xl font-bold font-mono text-indigo-300 mt-0.5">{stats.acceptanceRate}%</div>
            </div>
            <div className="bg-slate-950/60 border border-amber-900/40 p-3 rounded-xl">
              <div className="text-[10px] uppercase font-mono text-amber-400">Recorded Earnings</div>
              <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">${stats.totalEarningsUsd}</div>
            </div>
          </div>

          {/* Rejection Root Cause Breakdown */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Rejection Root Cause Classifier
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Feedback Learning Loop</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {rejections.map((r) => (
                <div key={r.category} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-[11px] font-medium truncate">{r.label}</span>
                    <span className="font-mono font-bold text-rose-400 ml-1">{r.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Record Logger Form */}
          <form onSubmit={handleAddSubmission} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" />
              Log New Marketplace Submission or Outcome
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Asset</label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  {files.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Marketplace</label>
                <select
                  value={selectedMarketplaceId}
                  onChange={(e) => setSelectedMarketplaceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  {Object.values(MARKETPLACES).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as SubmissionStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="prepared">Prepared (Ready)</option>
                  <option value="submitted">Submitted (In Review)</option>
                  <option value="accepted">Accepted (Online)</option>
                  <option value="rejected">Rejected</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>

              {newStatus === 'rejected' ? (
                <div>
                  <label className="block text-[10px] uppercase font-mono text-rose-400 mb-1">Rejection Category</label>
                  <select
                    value={rejectionCat}
                    onChange={(e) => setRejectionCat(e.target.value as RejectionReasonCategory)}
                    className="w-full bg-slate-900 border border-rose-700/60 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    {REJECTION_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Earnings ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={earnings}
                      onChange={(e) => setEarnings(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">Downloads</label>
                    <input
                      type="number"
                      value={downloads}
                      onChange={(e) => setDownloads(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Log Record
              </button>
            </div>
          </form>

          {/* Submissions History Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Logged Submissions History ({records.length})</span>
            </div>

            {records.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No submissions logged yet. Use the form above to record submissions to Adobe Stock, Shutterstock, etc.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 text-xs">
                {records.map((r) => (
                  <div key={r.id} className="p-3 flex items-center justify-between hover:bg-slate-900/30 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-200">{r.assetName}</span>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-1.5 py-0.5 rounded">
                          {r.marketplaceName}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Date: {r.submissionDate || 'N/A'}{' '}
                        {r.rejectionCategory && (
                          <span className="text-rose-400 font-mono ml-2">Reason: {r.rejectionCategory}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          r.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : r.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : r.status === 'submitted'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.status}
                      </span>

                      {r.earningsUsd && r.earningsUsd > 0 ? (
                        <span className="text-xs font-mono text-emerald-400 font-bold">${r.earningsUsd}</span>
                      ) : null}

                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
