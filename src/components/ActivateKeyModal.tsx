import React, { useState } from 'react';
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Clipboard,
  ShieldCheck,
  Calendar,
  LogIn,
} from 'lucide-react';
import { UserProfile } from '../types/stock';

interface ActivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  token: string;
  onActivationSuccess: (updatedUser: UserProfile, daysAdded: number) => void;
  onOpenAuth?: () => void;
}

export const ActivateKeyModal: React.FC<ActivateKeyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  token,
  onActivationSuccess,
  onOpenAuth,
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    daysAdded: number;
    newExpiresAt: string;
    key: string;
  } | null>(null);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLicenseKey(text.trim().toUpperCase());
      }
    } catch {}
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const cleanKey = licenseKey.trim().toUpperCase();
    if (!cleanKey) {
      setError('Please enter your license key.');
      return;
    }

    if (!currentUser || !token) {
      setError('You must be logged in to activate a license key.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/activate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key: cleanKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate license key.');
      }

      setSuccessInfo({
        daysAdded: data.daysAdded,
        newExpiresAt: data.newExpiresAt,
        key: cleanKey,
      });
      setLicenseKey('');
      if (data.user) {
        onActivationSuccess(data.user, data.daysAdded);
      }
    } catch (err: any) {
      setError(err.message || 'Error activating license key.');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setError(null);
    setSuccessInfo(null);
    setLicenseKey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Activate License Key
              </h2>
              <p className="text-xs text-slate-400">
                Unlock or extend your full access period
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* If user is not logged in */}
          {!currentUser ? (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-amber-200">Login Required</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Please log in or register your account before activating your license key.
                </p>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    handleModalClose();
                    onOpenAuth();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Log In / Register Now
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Current Account Card */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold uppercase">
                    {currentUser.username.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{currentUser.username}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{currentUser.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                      currentUser.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {currentUser.status === 'active'
                      ? `${currentUser.daysLeft} days active`
                      : 'Expired'}
                  </span>
                </div>
              </div>

              {/* Success Message Banner */}
              {successInfo && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>License Activated Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-200">
                    <span className="font-semibold">+{successInfo.daysAdded} Days</span> have been added to your account!
                  </p>
                  <div className="text-[11px] text-emerald-300/80 font-mono bg-emerald-950/70 p-2 rounded border border-emerald-500/20 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Valid until: {new Date(successInfo.newExpiresAt).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Enter License Key</span>
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-normal transition-colors"
                    >
                      <Clipboard className="w-3 h-3" />
                      Paste from clipboard
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      placeholder="e.g. SM-30D-A8B9-C1D2"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wider uppercase placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    💡 License keys generated for your email address will immediately extend your access.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    {successInfo ? 'Done' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !licenseKey.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Activate Key</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
