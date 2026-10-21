import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  UserX,
  PlusCircle,
  Download,
  Upload,
  Settings,
  Search,
  X,
  Key,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Ban,
  Sparkles,
  Mail,
  BookOpen,
  Lock,
} from 'lucide-react';
import { UserProfile, SystemAuthConfig, LicenseKeyItem } from '../types/stock';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'licenses' | 'settings' | 'backup' | 'guide'>('licenses');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [licenses, setLicenses] = useState<LicenseKeyItem[]>([]);
  const [settings, setSettings] = useState<SystemAuthConfig>({
    authRequired: true,
    defaultTrialDays: 7,
    defaultDailyLimit: 50,
    requireAdminApproval: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'suspended' | 'pending'>('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [customDays, setCustomDays] = useState('30');
  const [customQuota, setCustomQuota] = useState('50');
  const [newPasswordUser, setNewPasswordUser] = useState<UserProfile | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  // License Generator State
  const [genEmail, setGenEmail] = useState('');
  const [genDays, setGenDays] = useState('30');
  const [genQuota, setGenQuota] = useState('50');
  const [genNotes, setGenNotes] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [latestCreatedKey, setLatestCreatedKey] = useState<LicenseKeyItem | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedCustomerMsg, setCopiedCustomerMsg] = useState(false);
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenseFilter, setLicenseFilter] = useState<'all' | 'active' | 'used' | 'revoked'>('all');

  const fetchUsersAndSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLicenses = async () => {
    try {
      const res = await fetch('/api/admin/licenses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses || []);
      }
    } catch (err) {
      console.error('Failed to load license keys:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsersAndSettings();
      fetchLicenses();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- User Handlers ---
  const handleQuickExtend = async (userId: string, days: number) => {
    try {
      const res = await fetch(`/api/admin/user/${userId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ days }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Extended user access by ${days} days!` });
        fetchUsersAndSettings();
      }
    } catch {}
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`/api/admin/user/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `User status changed to ${nextStatus}.` });
        fetchUsersAndSettings();
      }
    } catch {}
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}"?`)) return;
    try {
      const res = await fetch(`/api/admin/user/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `User ${username} deleted.` });
        fetchUsersAndSettings();
      }
    } catch {}
  };

  const handleSaveCustomAccess = async (userId: string) => {
    try {
      const days = parseInt(customDays);
      const quota = parseInt(customQuota);
      if (days > 0) {
        await fetch(`/api/admin/user/${userId}/extend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ days }),
        });
      }
      if (!isNaN(quota)) {
        await fetch(`/api/admin/user/${userId}/quota`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ dailyLimit: quota }),
        });
      }
      setMessage({ type: 'success', text: 'User access parameters updated.' });
      setEditingUser(null);
      fetchUsersAndSettings();
    } catch {}
  };

  const handleResetPassword = async (userId: string) => {
    if (!tempPassword || tempPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    try {
      const res = await fetch(`/api/admin/user/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPassword: tempPassword }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setNewPasswordUser(null);
        setTempPassword('');
      }
    } catch {}
  };

  // --- License Generator Handlers ---
  const handleGenerateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = genEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid user email address.' });
      return;
    }
    const daysNum = parseInt(genDays) || 30;
    const quotaNum = parseInt(genQuota);

    setGenLoading(true);
    try {
      const res = await fetch('/api/admin/licenses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedEmail: cleanEmail,
          days: daysNum,
          dailyLimit: quotaNum > 0 ? quotaNum : undefined,
          notes: genNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate license key.');
      }
      setLatestCreatedKey(data.license);
      setMessage({
        type: 'success',
        text: `License key ${data.license.key} successfully generated for ${data.license.assignedEmail}!`,
      });
      fetchLicenses();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error generating license key' });
    } finally {
      setGenLoading(false);
    }
  };

  const handleRevokeLicense = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/licenses/${id}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'License key revoked.' });
        fetchLicenses();
      }
    } catch {}
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license key record?')) return;
    try {
      const res = await fetch(`/api/admin/licenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'License key record deleted.' });
        fetchLicenses();
      }
    } catch {}
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleCopyCustomerMessage = (lic: LicenseKeyItem) => {
    const msg = `🎉 Your StockMeta Pro License Key is ready!

🔑 License Key: ${lic.key}
⏱️ Access Period: ${lic.days} Days
📧 Assigned Account: ${lic.assignedEmail}

How to activate:
1. Visit: https://stockmeta-pro.onrender.com/
2. Log in or create an account with email: ${lic.assignedEmail}
3. Click "🔑 Activate Key" in the top bar
4. Paste your key and click Activate!`;
    navigator.clipboard.writeText(msg);
    setCopiedCustomerMsg(true);
    setTimeout(() => setCopiedCustomerMsg(false), 2500);
  };

  // --- Settings & Backup Handlers ---
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'System policy settings updated successfully!' });
      }
    } catch {}
  };

  const handleDownloadBackup = () => {
    window.open('/api/admin/export-users', '_blank');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await fetch('/api/admin/import-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ backupJson: text }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ type: 'success', text: `Restored ${data.importedCount} users successfully!` });
          fetchUsersAndSettings();
          fetchLicenses();
        } else {
          setMessage({ type: 'error', text: data.error || 'Failed to restore backup' });
        }
      } catch {
        setMessage({ type: 'error', text: 'Invalid JSON backup file.' });
      }
    };
    reader.readAsText(file);
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Licenses
  const filteredLicenses = licenses.filter((lic) => {
    const matchesSearch =
      lic.key.toLowerCase().includes(licenseSearch.toLowerCase()) ||
      lic.assignedEmail.toLowerCase().includes(licenseSearch.toLowerCase()) ||
      (lic.usedByUsername && lic.usedByUsername.toLowerCase().includes(licenseSearch.toLowerCase()));
    const matchesStatus = licenseFilter === 'all' || lic.status === licenseFilter;
    return matchesSearch && matchesStatus;
  });

  const totalUsersCount = users.filter((u) => u.role !== 'admin').length;
  const activeCount = users.filter((u) => u.status === 'active' && u.role !== 'admin').length;
  const expiredCount = users.filter((u) => u.status === 'expired' && u.role !== 'admin').length;
  const activeLicensesCount = licenses.filter((l) => l.status === 'active').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Administrator Control Panel
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  StockMeta Pro Master
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate user license keys, manage subscription periods & system access policies
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                fetchUsersAndSettings();
                fetchLicenses();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {message && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between transition-all ${
              message.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800'
                : 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-semibold gap-6">
          <button
            onClick={() => setActiveTab('licenses')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'licenses'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>🔑 License Keys Generator ({licenses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Registered Users ({totalUsersCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Default Policy Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'backup'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Backup & Restore</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'guide'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>📘 Admin Guide</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= TAB 1: LICENSE KEY GENERATOR ================= */}
          {activeTab === 'licenses' && (
            <div className="space-y-6">
              {/* Generator Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/20 border border-slate-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        Generate Unique User License Key
                      </h3>
                      <p className="text-xs text-slate-400">
                        Input the user's email ID and period in days. The key can only be activated by that specific user.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    {activeLicensesCount} Active Unclaimed Keys
                  </span>
                </div>

                {/* Generator Form */}
                <form onSubmit={handleGenerateLicense} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1. User Email ID */}
                    <div className="md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>User Email ID *</span>
                        {users.length > 1 && (
                          <span className="text-[10px] text-slate-400">Or pick registered</span>
                        )}
                      </label>
                      <div className="space-y-1.5">
                        <div className="relative">
                          <input
                            type="email"
                            value={genEmail}
                            onChange={(e) => setGenEmail(e.target.value)}
                            placeholder="e.g. user@gmail.com"
                            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            required
                          />
                          <Mail className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                        </div>
                        {/* Quick pick from registered users */}
                        {users.filter((u) => u.role !== 'admin').length > 0 && (
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                            {users
                              .filter((u) => u.role !== 'admin')
                              .slice(0, 5)
                              .map((u) => (
                                <button
                                  type="button"
                                  key={u.id}
                                  onClick={() => setGenEmail(u.email)}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
                                >
                                  {u.email}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Access Period (Days) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Access Period (Number of Days) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="3650"
                        value={genDays}
                        onChange={(e) => setGenDays(e.target.value)}
                        placeholder="30"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {['7', '30', '60', '90', '180', '365'].map((d) => (
                          <button
                            type="button"
                            key={d}
                            onClick={() => setGenDays(d)}
                            className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                              genDays === d
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {d === '365' ? '1yr' : `${d}d`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Daily Limit (Files/Day) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Daily AI Limit (Files / Day)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10000"
                        value={genQuota}
                        onChange={(e) => setGenQuota(e.target.value)}
                        placeholder="50 (0 = unlimited)"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                      {/* Quota Presets */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {[
                          { val: '50', label: '50/d' },
                          { val: '100', label: '100/d' },
                          { val: '250', label: '250/d' },
                          { val: '0', label: 'Unlimited' },
                        ].map((q) => (
                          <button
                            type="button"
                            key={q.val}
                            onClick={() => setGenQuota(q.val)}
                            className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                              genQuota === q.val
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {q.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Notes & Submit Row */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        value={genNotes}
                        onChange={(e) => setGenNotes(e.target.value)}
                        placeholder="Optional Note / Memo (e.g. Paid via bKash / Order #1042)"
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={genLoading || !genEmail.trim()}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {genLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          <span>Generate License Key</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Celebratory Banner for Newly Created Key */}
                {latestCreatedKey && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>New License Key Created Successfully!</span>
                      </div>
                      <button
                        onClick={() => setLatestCreatedKey(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/80 p-3 rounded-lg border border-emerald-500/30">
                      <div className="font-mono text-base font-bold text-white tracking-widest px-3 py-1 bg-slate-900 rounded border border-slate-700">
                        {latestCreatedKey.key}
                      </div>
                      <div className="text-xs text-slate-300">
                        Bound to: <span className="font-mono text-emerald-300">{latestCreatedKey.assignedEmail}</span> ({latestCreatedKey.days} Days)
                      </div>
                      <div className="sm:ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyKey(latestCreatedKey.key, latestCreatedKey.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {copiedKeyId === latestCreatedKey.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKeyId === latestCreatedKey.id ? 'Copied Key!' : 'Copy Key'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyCustomerMessage(latestCreatedKey)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {copiedCustomerMsg ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                          <span>{copiedCustomerMsg ? 'Message Copied!' : 'Copy Message for Client'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* License Keys Table */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">All Generated License Keys</h3>
                    <span className="text-xs text-slate-400 font-mono">({licenses.length})</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-64">
                      <input
                        type="text"
                        value={licenseSearch}
                        onChange={(e) => setLicenseSearch(e.target.value)}
                        placeholder="Search key or email..."
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      {(['all', 'active', 'used', 'revoked'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setLicenseFilter(st)}
                          className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                            licenseFilter === st
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="py-3 px-4">License Key</th>
                        <th className="py-3 px-4">Assigned User Email</th>
                        <th className="py-3 px-4">Period</th>
                        <th className="py-3 px-4">Daily Limit</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created Date</th>
                        <th className="py-3 px-4">Activation Details</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLicenses.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-500">
                            No license keys match your filter. Generate one above!
                          </td>
                        </tr>
                      ) : (
                        filteredLicenses.map((lic) => (
                          <tr key={lic.id} className="hover:bg-slate-900/40 transition-colors">
                            {/* Key */}
                            <td className="py-3 px-4 font-mono font-bold text-white tracking-wider">
                              <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {lic.key}
                              </span>
                            </td>

                            {/* Assigned Email */}
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {lic.assignedEmail}
                              {lic.notes && (
                                <div className="text-[10px] text-slate-500 font-sans mt-0.5 truncate max-w-xs">
                                  {lic.notes}
                                </div>
                              )}
                            </td>

                            {/* Period */}
                            <td className="py-3 px-4 font-semibold text-emerald-400">
                              {lic.days} Days
                            </td>

                            {/* Daily Limit */}
                            <td className="py-3 px-4 font-mono text-slate-400">
                              {lic.dailyLimit ? `${lic.dailyLimit}/day` : 'Default'}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  lic.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : lic.status === 'used'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {lic.status === 'active' ? 'Active / Unused' : lic.status}
                              </span>
                            </td>

                            {/* Created Date */}
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(lic.createdAt).toLocaleDateString()}
                            </td>

                            {/* Activation Details */}
                            <td className="py-3 px-4 text-[11px] text-slate-400">
                              {lic.status === 'used' ? (
                                <div>
                                  <span className="text-white font-medium">{lic.usedByUsername || 'User'}</span>
                                  <div className="text-[10px] text-slate-500">
                                    {lic.usedAt ? new Date(lic.usedAt).toLocaleDateString() : ''}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {/* Copy Key */}
                              <button
                                onClick={() => handleCopyKey(lic.key, lic.id)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                                title="Copy Key"
                              >
                                {copiedKeyId === lic.id ? (
                                  <Check className="w-3 h-3 text-emerald-400 inline" />
                                ) : (
                                  <Copy className="w-3 h-3 inline" />
                                )}
                              </button>

                              {/* Copy Client Message */}
                              <button
                                onClick={() => handleCopyCustomerMessage(lic)}
                                className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] transition-colors cursor-pointer"
                                title="Copy Ready-to-Send Message"
                              >
                                <Mail className="w-3 h-3 inline" />
                              </button>

                              {/* Revoke */}
                              {lic.status === 'active' && (
                                <button
                                  onClick={() => handleRevokeLicense(lic.id)}
                                  className="px-2 py-1 rounded bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 text-[11px] transition-colors cursor-pointer"
                                  title="Revoke License Key"
                                >
                                  <Ban className="w-3 h-3 inline" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteLicense(lic.id)}
                                className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3 h-3 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: REGISTERED USERS ================= */}
          {activeTab === 'users' && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Registered</div>
                  <div className="text-2xl font-bold text-white mt-1">{totalUsersCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-emerald-400 uppercase font-semibold">Active Licenses</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-rose-400 uppercase font-semibold">Expired Accounts</div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">{expiredCount}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[11px] text-cyan-400 uppercase font-semibold">License Keys</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-1">{licenses.length}</div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by username or email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-slate-700"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  {(['all', 'active', 'expired', 'suspended', 'pending'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                        statusFilter === st
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Access Period</th>
                      <th className="py-3 px-4">Daily Quota</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Quick Extend</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          No users match your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isAdmin = u.role === 'admin';
                        return (
                          <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                            {/* User details */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{u.username}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                            </td>

                            {/* Role */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  isAdmin
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : u.status === 'expired'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>

                            {/* Expiration */}
                            <td className="py-3 px-4">
                              {isAdmin ? (
                                <span className="text-emerald-400 font-mono text-[11px]">Lifetime</span>
                              ) : (
                                <div>
                                  <div className="font-mono text-slate-200">
                                    {new Date(u.expiresAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {u.status === 'active' ? `${u.daysLeft} days remaining` : 'Expired'}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Quota */}
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {isAdmin
                                ? 'Unlimited'
                                : `${u.usedToday} / ${u.dailyLimit === 0 ? '∞' : u.dailyLimit} today`}
                            </td>

                            {/* Created Date */}
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            {/* Quick Extend */}
                            <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                              {!isAdmin && (
                                <>
                                  <button
                                    onClick={() => handleQuickExtend(u.id, 7)}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                                    title="Add 7 Days"
                                  >
                                    +7d
                                  </button>
                                  <button
                                    onClick={() => handleQuickExtend(u.id, 30)}
                                    className="px-2 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] transition-colors cursor-pointer"
                                    title="Add 30 Days"
                                  >
                                    +30d
                                  </button>
                                  <button
                                    onClick={() => handleQuickExtend(u.id, 90)}
                                    className="px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[11px] transition-colors cursor-pointer"
                                    title="Add 90 Days"
                                  >
                                    +90d
                                  </button>
                                </>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {!isAdmin && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingUser(u);
                                      setCustomQuota(String(u.dailyLimit));
                                    }}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                                    title="Edit Access & Quota"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      setNewPasswordUser(u);
                                      setTempPassword('');
                                    }}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
                                    title="Reset Password"
                                  >
                                    Reset Pwd
                                  </button>
                                  <button
                                    onClick={() => handleToggleStatus(u.id, u.status)}
                                    className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                                      u.status === 'suspended'
                                        ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white'
                                        : 'bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white'
                                    }`}
                                    title={u.status === 'suspended' ? 'Activate User' : 'Suspend User'}
                                  >
                                    {u.status === 'suspended' ? <UserCheck className="w-3 h-3 inline" /> : <UserX className="w-3 h-3 inline" />}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] transition-colors cursor-pointer"
                                    title="Delete User"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ================= TAB 3: DEFAULT POLICY SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="max-w-xl space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
                Default Access & Registration Policy
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-white block">
                      Enforce User Login
                    </label>
                    <p className="text-[11px] text-slate-400">
                      When enabled, visitors must log in to use AI metadata generation
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.authRequired}
                    onChange={(e) => setSettings({ ...settings, authRequired: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    Default Signup Access Period (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.defaultTrialDays}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultTrialDays: parseInt(e.target.value) || 7 })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Free period automatically assigned to new users upon registering an account.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    Default Daily Quota Limit (Files per Day)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={settings.defaultDailyLimit}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultDailyLimit: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Max files a regular user can process in a single calendar day (0 = unlimited).
                  </p>
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleSaveSettings}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg"
                  >
                    Save System Policies
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 4: BACKUP & RESTORE ================= */}
          {activeTab === 'backup' && (
            <div className="max-w-xl space-y-6 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
                Database Backup & Safe Restore
              </h3>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-400" /> Export JSON Backup
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Download the complete user accounts, hashed credentials, policies, and license keys database to your PC.
                  </p>
                  <button
                    onClick={handleDownloadBackup}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors mt-2"
                  >
                    Download Backup File (.json)
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-indigo-400" /> Restore from JSON Backup
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Import and merge users & license keys from a previously downloaded backup JSON file.
                  </p>
                  <label className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors mt-2">
                    Choose Backup File & Restore
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: ADMIN OPERATIONS GUIDE ================= */}
          {activeTab === 'guide' && (
            <div className="max-w-4xl space-y-6">
              <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2">
                <div className="flex items-center space-x-2.5 text-amber-300 font-bold text-sm">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span>Confidential Master Administrator Operations Manual</span>
                </div>
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  This operations guide is accessible only inside the Administrator Control Panel. Use these instructions to manage customer licenses, grant access periods, enforce daily quotas, and securely maintain the user database.
                </p>
              </div>

              {/* Step 1: Generating License Keys */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Key className="w-4 h-4" /> 1. How to Generate Unique License Keys for Customers
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
                  <li>Go to the <strong>"🔑 License Keys Generator"</strong> tab.</li>
                  <li>In <strong>"User Email ID"</strong>, input the customer's registered email address (or click their email in the registered users list).</li>
                  <li>In <strong>"Access Period"</strong>, select or enter the number of days (e.g. 30, 90, 365).</li>
                  <li>In <strong>"Daily AI Limit"</strong>, set the daily processing cap (e.g. 50 files/day, or enter 0 for unlimited).</li>
                  <li>In <strong>"Optional Note"</strong>, add order details (e.g. "Order #1029 / Paid via bKash").</li>
                  <li>Click <strong>"Generate License Key"</strong>. The system produces a cryptographically secure key formatted like <code className="text-amber-300 font-mono">SM-30D-XXXX-XXXX</code>.</li>
                  <li>Click <strong>"Copy Message for Client"</strong> to copy the pre-written instructions and send them directly to the buyer via WhatsApp or email!</li>
                </ol>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  🔒 <strong>Strict Email Binding:</strong> The generated key is permanently bound to the customer's email. If another user attempts to activate it with a different email, activation will be rejected.
                </div>
              </div>

              {/* Step 2: How Users Activate Keys */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> 2. How Customers Activate Their Account
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When a customer receives their key:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400">
                  <li>They log in at <a href="https://stockmeta-pro.onrender.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-mono">https://stockmeta-pro.onrender.com/</a> using their registered email.</li>
                  <li>They click the green <strong>"🔑 Activate Key"</strong> button in the top navigation bar.</li>
                  <li>They paste the license key and click <strong>"Activate Key"</strong>.</li>
                  <li>The system adds the allotted days to their account, resets expired accounts to active, and logs the activation timestamp in your admin dashboard.</li>
                </ol>
              </div>

              {/* Step 3: Managing Users */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                  <Users className="w-4 h-4" /> 3. Managing User Accounts & Access
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Inside the <strong>"Registered Users"</strong> tab:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400">
                  <li><strong>Quick Extend (+7d, +30d, +90d):</strong> One-click extension of any user's expiration date.</li>
                  <li><strong>Edit:</strong> Manually change expiration date or daily processing quota.</li>
                  <li><strong>Reset Password:</strong> Set a new temporary password for users who forget their credentials.</li>
                  <li><strong>Suspend / Activate:</strong> Toggle user access instantly without deleting their account.</li>
                  <li><strong>Delete:</strong> Permanently remove an account.</li>
                </ul>
              </div>

              {/* Step 4: Policy & Database Backups */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Download className="w-4 h-4" /> 4. Global System Policies & Database Backups
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-400">
                  <li><strong>Default Policy Settings:</strong> Set whether login is strictly enforced, and set the default free trial period granted upon signup.</li>
                  <li><strong>Export JSON Backup:</strong> Regularly download the complete encrypted database backup (<code className="text-white">users.json</code> containing all accounts, credentials, and keys) to your PC.</li>
                  <li><strong>Restore Backup:</strong> In case of server migration, upload your backup file to restore all users and keys in 1 second.</li>
                </ul>
              </div>

              {/* Admin Contact Reference */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-white font-semibold">Registered Admin Contact:</span> Bulbul (Email: <a href="mailto:bulbulworka1@gmail.com" className="text-indigo-300 font-mono">bulbulworka1@gmail.com</a> | Phone: <a href="tel:01617086747" className="text-emerald-400 font-mono">01617086747</a>)
                </div>
                <div className="font-mono text-slate-500">StockMeta Pro v3.36</div>
              </div>
            </div>
          )}
        </div>

        {/* Edit User Modal Sub-dialog */}
        {editingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
              <h4 className="text-sm font-bold text-white">
                Edit Access for {editingUser.username}
              </h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Add Access Days (from today or current expiry)
                </label>
                <input
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Daily Processing Limit (Files/Day, 0 = unlimited)
                </label>
                <input
                  type="number"
                  value={customQuota}
                  onChange={(e) => setCustomQuota(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveCustomAccess(editingUser.id)}
                  className="px-4 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Sub-dialog */}
        {newPasswordUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
              <h4 className="text-sm font-bold text-white">
                Reset Password for {newPasswordUser.username}
              </h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  New Temporary Password (min 6 characters)
                </label>
                <input
                  type="text"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setNewPasswordUser(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResetPassword(newPasswordUser.id)}
                  className="px-4 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
