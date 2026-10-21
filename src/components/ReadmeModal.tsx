import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Key,
  Phone,
  Mail,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Download,
  ExternalLink,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  FileCheck,
} from 'lucide-react';
import { UserProfile } from '../types/stock';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onOpenActivateKey?: () => void;
  onOpenAuth?: () => void;
}

type FontSize = 'normal' | 'large' | 'xlarge' | 'huge';
type Language = 'bn' | 'en' | 'split';

export const ReadmeModal: React.FC<ReadmeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenActivateKey,
  onOpenAuth,
}) => {
  const [fontSize, setFontSize] = useState<FontSize>('large');
  const [language, setLanguage] = useState<Language>('bn');
  const [adminMode, setAdminMode] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = currentUser?.role === 'admin';

  // Typography scaling for high readability
  const fontClasses = {
    normal: {
      body: 'text-sm md:text-base leading-relaxed',
      subhead: 'text-lg md:text-xl font-bold',
      heading: 'text-xl md:text-2xl font-extrabold',
      title: 'text-2xl md:text-3xl font-black',
    },
    large: {
      body: 'text-base md:text-lg leading-relaxed',
      subhead: 'text-xl md:text-2xl font-bold',
      heading: 'text-2xl md:text-3xl font-extrabold',
      title: 'text-3xl md:text-4xl font-black',
    },
    xlarge: {
      body: 'text-lg md:text-xl leading-loose',
      subhead: 'text-2xl md:text-3xl font-bold',
      heading: 'text-3xl md:text-4xl font-extrabold',
      title: 'text-4xl md:text-5xl font-black',
    },
    huge: {
      body: 'text-xl md:text-2xl leading-loose',
      subhead: 'text-3xl md:text-4xl font-bold',
      heading: 'text-4xl md:text-5xl font-extrabold',
      title: 'text-5xl md:text-6xl font-black',
    },
  }[fontSize];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col overflow-hidden text-slate-100 animate-in fade-in duration-200">
      {/* Top Header & Accessibility Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xl z-20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-white flex items-center space-x-2">
              <span>StockMeta Pro Studio — Documentation & Manual</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                v3.36
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {language === 'bn'
                ? 'সম্পূর্ণ ব্যবহার নির্দেশিকা, লাইসেন্স অ্যাক্টিভেশন ও সাপোর্ট — সহজে পড়ার জন্য ফন্ট বড়-ছোট করার সুবিধা'
                : 'Complete user guide, license activation tutorial & admin contact information'}
            </p>
          </div>
        </div>

        {/* Right Controls: Font Size, Language Switcher, Admin Toggle (Admin only), Close */}
        <div className="flex items-center space-x-3">
          {/* Admin Manual Toggle (STRICTLY for Admin users only) */}
          {isAdmin && (
            <button
              onClick={() => setAdminMode(!adminMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                adminMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                  : 'bg-amber-950/60 text-amber-300 border-amber-700/60 hover:bg-amber-900/80'
              }`}
              title="Toggle Administrator Operations Manual"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{adminMode ? '👑 Viewing Admin Manual' : '👑 Show Admin Manual'}</span>
            </button>
          )}

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                language === 'bn'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="বাংলা সংস্করণ পড়ুন"
            >
              <span>🇧🇩 বাংলা</span>
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Read in English"
            >
              <span>🇬🇧 English</span>
            </button>
            <button
              onClick={() => setLanguage('split')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                language === 'split'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side by Side"
            >
              <span>↔️ Both</span>
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1">
            <span className="text-[11px] text-slate-400 px-1 font-medium">Text:</span>
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                fontSize === 'normal' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
              }`}
              title="Normal text size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                fontSize === 'large' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Large text size"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-0.5 rounded text-xs font-extrabold transition-all cursor-pointer ${
                fontSize === 'xlarge' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Extra Large (Senior-Friendly)"
            >
              A++
            </button>
            <button
              onClick={() => setFontSize('huge')}
              className={`px-2 py-0.5 rounded text-xs font-black transition-all cursor-pointer ${
                fontSize === 'huge' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="Huge / Super Zoom"
            >
              A+++
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            title="Close Documentation (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-10 max-w-7xl mx-auto w-full">
        {/* ============================================================== */}
        {/* ADMIN OPERATION MANUAL (Visible ONLY to Admin)                 */}
        {/* ============================================================== */}
        {isAdmin && adminMode ? (
          <AdminOperationsManual fontClasses={fontClasses} language={language} />
        ) : (
          <>
            {/* ============================================================== */}
            {/* HERO BANNER: Contact Admin & Quick Key Activation              */}
            {/* ============================================================== */}
            <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold tracking-wide uppercase">
                    <Sparkles className="w-3.5 h-3.5" /> Microstock AI Metadata Automation Studio
                  </span>
                  <h2 className={`${fontClasses.title} text-white tracking-tight`}>
                    StockMeta Pro Studio <span className="text-emerald-400">v3.36</span>
                  </h2>
                  <p className={`${fontClasses.body} text-slate-300 max-w-3xl`}>
                    {language === 'bn'
                      ? 'মাইক্রোস্টক কন্ট্রিবিউটর ও ভেক্টর ডিজাইনারদের জন্য ১০০% স্বয়ংক্রিয় এআই মেটাডাটা জেনারেটর, হাই-র‍্যাংকিং এসইও অপটিমাইজার এবং ৪-লেয়ার সরাসরি ফাইল এম্বেডার।'
                      : 'Complete microstock metadata automation suite with commercial title generation, 45 high-converting keywords, binary-safe EPS embedder, and multi-agency CSV exporter.'}
                  </p>
                </div>

                {/* Direct Contact Card */}
                <div className="bg-slate-950/90 border border-slate-700/80 p-5 rounded-2xl shadow-xl space-y-3 shrink-0 md:min-w-[320px]">
                  <div className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Admin Contact & License Help</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Phone / WhatsApp:</span>
                      <a
                        href="tel:01617086747"
                        className="font-mono font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        01617086747
                      </a>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Admin Email:</span>
                      <a
                        href="mailto:bulbulworka1@gmail.com"
                        className="font-mono font-bold text-indigo-300 hover:text-indigo-200 transition-colors"
                      >
                        bulbulworka1@gmail.com
                      </a>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-1 flex items-center gap-2">
                    {onOpenActivateKey && (
                      <button
                        onClick={onOpenActivateKey}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Activate Key Now</span>
                      </button>
                    )}
                    {!currentUser && onOpenAuth && (
                      <button
                        onClick={onOpenAuth}
                        className="py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                      >
                        Login
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* CONTENT SECTIONS BASED ON LANGUAGE                             */}
            {/* ============================================================== */}
            {language === 'bn' && (
              <UserBanglaContent
                fontClasses={fontClasses}
                onOpenActivateKey={onOpenActivateKey}
                onOpenAuth={onOpenAuth}
                currentUser={currentUser}
              />
            )}
            {language === 'en' && (
              <UserEnglishContent
                fontClasses={fontClasses}
                onOpenActivateKey={onOpenActivateKey}
                onOpenAuth={onOpenAuth}
                currentUser={currentUser}
              />
            )}
            {language === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="border-r border-slate-800 pr-6 space-y-10">
                  <div className="flex items-center space-x-2 pb-3 border-b border-emerald-500/30 text-emerald-400 font-bold text-lg">
                    <span>🇧🇩 বাংলা সংস্করণ (Bangla)</span>
                  </div>
                  <UserBanglaContent
                    fontClasses={fontClasses}
                    onOpenActivateKey={onOpenActivateKey}
                    onOpenAuth={onOpenAuth}
                    currentUser={currentUser}
                  />
                </div>
                <div className="space-y-10">
                  <div className="flex items-center space-x-2 pb-3 border-b border-indigo-500/30 text-indigo-400 font-bold text-lg">
                    <span>🇬🇧 English Version</span>
                  </div>
                  <UserEnglishContent
                    fontClasses={fontClasses}
                    onOpenActivateKey={onOpenActivateKey}
                    onOpenAuth={onOpenAuth}
                    currentUser={currentUser}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Bottom Return Bar */}
        <div className="pt-8 border-t border-slate-800 flex justify-center pb-12">
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-950/50 text-base transition-all cursor-pointer flex items-center space-x-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>পড় শেষ হয়েছে / Return to App</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* USER BANGLA CONTENT                                                        */
/* -------------------------------------------------------------------------- */
const UserBanglaContent: React.FC<{
  fontClasses: any;
  onOpenActivateKey?: () => void;
  onOpenAuth?: () => void;
  currentUser?: UserProfile | null;
}> = ({ fontClasses, onOpenActivateKey, onOpenAuth, currentUser }) => {
  return (
    <div className="space-y-10">
      {/* ১. সম্পূর্ণ ধাপে ধাপে ব্যবহার নির্দেশিকা */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 text-emerald-400 border-b border-slate-800 pb-4">
          <BookOpen className="w-7 h-7 shrink-0" />
          <h3 className={`${fontClasses.heading} text-white`}>
            ১. ধাপে ধাপে সফটওয়্যার ব্যবহারের সম্পূর্ণ নিয়ম (Step-by-Step Guide)
          </h3>
        </div>

        <div className="space-y-6">
          {/* ধাপ ১: অ্যাকাউন্ট তৈরি ও লগইন */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              ১
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                অ্যাকাউন্ট তৈরি (Registration) ও লগইন করুন
              </h4>
              <p className={fontClasses.body}>
                স্ক্রিনের ওপরের ডানদিকের <strong>"Sign In / Register"</strong> বাটনে ক্লিক করুন। আপনার নাম, নিজস্ব ইমেইল এড্রেস ও পাসওয়ার্ড দিয়ে ২ সেকেন্ডে রেজিস্ট্রেশন সম্পন্ন করুন।
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                💡 <strong>কেন রেজিস্ট্রেশন জরুরি?</strong> আপনার তৈরি করা সমস্ত কি-ওয়ার্ড, লাইসেন্সের মেয়াদ এবং ব্রাউজার সেটিংস আপনার অ্যাকাউন্টে সুরক্ষিতভাবে সংরক্ষিত থাকে।
              </div>
            </div>
          </div>

          {/* ধাপ ২: লাইসেন্স কি সংগ্রহ ও অ্যাক্টিভেশন */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              ২
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-emerald-400`}>
                অ্যাডমিনের কাছ থেকে লাইসেন্স কি নিন ও অ্যাক্টিভ করুন (License Activation)
              </h4>
              <p className={fontClasses.body}>
                সফটওয়্যারটির সম্পূর্ণ অ্যাক্সেস বা মেয়াদ বাড়াতে অ্যাডমিনের সাথে যোগাযোগ করে আপনার ইউনিক লাইসেন্স কি (যেমন: <code className="text-amber-400 font-mono">SM-30D-XXXX-XXXX</code>) সংগ্রহ করুন।
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>অ্যাডমিন যোগাযোগ মাধ্যম (Direct Admin Contact):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">📞 মোবাইল / হোয়াটসঅ্যাপ:</span>
                    <a href="tel:01617086747" className="font-mono text-emerald-400 font-bold text-sm">
                      01617086747
                    </a>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">✉️ অ্যাডমিন ইমেইল:</span>
                    <a href="mailto:bulbulworka1@gmail.com" className="font-mono text-indigo-300 font-bold text-sm">
                      bulbulworka1@gmail.com
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-300">
                    <strong>কীভাবে কি ইনপুট দিয়ে অ্যাক্টিভ করবেন?</strong>
                  </p>
                  <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 mt-1">
                    <li>স্ক্রিনের ওপরে থাকা সবুজ রঙের <strong>"🔑 Activate Key"</strong> বাটনে ক্লিক করুন।</li>
                    <li>অ্যাডমিনের পাঠানো লাইসেন্স কি-টি বক্সে পেস্ট করুন।</li>
                    <li><strong>"Activate Key"</strong> বাটনে চাপ দিন — সাথে সাথে আপনার অ্যাকাউন্টে নির্ধারিত দিন যুক্ত হয়ে যাবে এবং লাইসেন্স সক্রিয় হবে!</li>
                  </ol>
                  {onOpenActivateKey && (
                    <button
                      type="button"
                      onClick={onOpenActivateKey}
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>এখনই লাইসেন্স কি অ্যাক্টিভেশন উইন্ডো খুলুন</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ধাপ ৩: নিজস্ব ফ্রি এআই কি (API Key) সেট করা */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              ৩
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                আপনার নিজস্ব ফ্রি API Key যুক্ত করুন (Gemini ও Groq)
              </h4>
              <p className={fontClasses.body}>
                প্রতিটি ব্যবহারকারী তার <strong>নিজস্ব ফ্রি এআই কি</strong> ব্যবহার করবেন। এতে আপনার কাজ ১০০% প্রাইভেট থাকে এবং কোনো শেয়ার্ড কোটা বা স্পিডের সীমাবদ্ধতা থাকে না।
              </p>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <p className="text-indigo-300 font-semibold">ফ্রি API Key পাওয়ার সহজ লিংক:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>
                    <strong>Google Gemini Free Key:</strong>{' '}
                    <a
                      href="https://aistudio.google.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline font-mono"
                    >
                      aistudio.google.com/api-keys
                    </a>{' '}
                    (সম্পূর্ণ ফ্রি, কোনো ক্রেডিট কার্ড লাগে না)
                  </li>
                  <li>
                    <strong>Groq Vision Key:</strong>{' '}
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline font-mono"
                    >
                      console.groq.com/keys
                    </a>{' '}
                    (সুপার ফাস্ট ফ্রি ভিশন এআই)
                  </li>
                </ul>
                <p className="text-slate-400 mt-2">
                  ডানপাশের <strong>"AI Engine & SEO"</strong> ট্যাবে গিয়ে আপনার কি-টি পেস্ট করে দিন। আপনি চাইলে কমা দিয়ে একাধিক কি-ও রাখতে পারেন!
                </p>
              </div>
            </div>
          </div>

          {/* ধাপ ৪: ভেক্টর ও ইমেজ ফাইল আপলোড */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              ৪
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                ফাইল ড্রপ করুন (EPS, SVG, JPG, PNG)
              </h4>
              <p className={fontClasses.body}>
                আপনার ফোল্ডার থেকে ১টি থেকে ১০০টি পর্যন্ত <code className="text-cyan-400">.eps</code>, <code className="text-cyan-400">.svg</code>, <code className="text-cyan-400">.jpg</code> বা <code className="text-cyan-400">.png</code> ফাইল মাউস দিয়ে টেনে এনে স্ক্রিনের মাঝখানের বক্সে ছেড়ে দিন। কোনো সহায়ক JPG ফাইল ছাড়াই এটি সরাসরি EPS ফাইল থেকে প্রিভিউ পড়ে নেয়।
              </p>
            </div>
          </div>

          {/* ধাপ ৫: এক ক্লিকে এআই মেটাডাটা তৈরি */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              ৫
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                "Generate All with AI" বাটনে ক্লিক করুন
              </h4>
              <p className={fontClasses.body}>
                বেগুনি বাটনে চাপ দিন। এআই স্বয়ংক্রিয়ভাবে প্রতিটি ফাইলের জন্য তৈরি করবে:
              </p>
              <ul className="list-disc list-inside text-xs md:text-sm text-slate-300 space-y-1">
                <li><strong>বাণিজ্যিক টাইটেল (Title):</strong> ৭০ থেকে ১০০ অক্ষরের মধ্যে মূল টপিক এবং স্টক বিক্রির স্ট্যান্ডার্ড ফরম্যাট।</li>
                <li><strong>নিখুঁত ডেসক্রিপশন (Description):</strong> ব্যাকরণগতভাবে সঠিক ইংরেজি বিবরণ (কোনো ডুপ্লিকেট শব্দ ছাড়া)।</li>
                <li><strong>৪৫টি হাই-র‍্যাংকিং কি-ওয়ার্ড:</strong> ৩০টি স্পেসিফিক ভিজ্যুয়াল ট্যাগ + ১৫টি আন্তর্জাতিক স্টক ভেক্টর ট্যাগ।</li>
              </ul>
            </div>
          </div>

          {/* ধাপ ৬: সরাসরি ফাইলে এম্বেড বা CSV ডাউনলোড */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              ৬
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                সরাসরি EPS/JPG ফাইলে সেভ করুন অথবা CSV এক্সপোর্ট করুন
              </h4>
              <p className={fontClasses.body}>
                স্ক্রিনের নিচের বার থেকে:
              </p>
              <ul className="list-disc list-inside text-xs md:text-sm text-slate-300 space-y-1">
                <li><strong>Embed Metadata:</strong> ইলাস্ট্রেটর না খুলেই সরাসরি আপনার মূল EPS ফাইলের XMP ও IPTC ট্যাগে মেটাডাটা রাইট হবে (মূল ভেক্টর সম্পূর্ণ অক্ষত থাকবে)।</li>
                <li><strong>Export CSV:</strong> Adobe Stock, Shutterstock, Freepik, Vecteezy-র জন্য এক ক্লিকে রেডি স্প্রেডশিট ডাউনলোড করুন।</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ২. ব্রাউজার রিফ্রেশ প্রটেকশন */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
        <div className="flex items-center space-x-3 text-cyan-400 border-b border-slate-800 pb-3">
          <RefreshCw className="w-6 h-6 shrink-0" />
          <h3 className={`${fontClasses.heading} text-white`}>
            ২. অটো-সেভ ও ব্রাউজার রিফ্রেশ প্রটেকশন
          </h3>
        </div>
        <p className={fontClasses.body}>
          কাজ করার সময় ভুলবশত ব্রাউজার রিলোড বা রিফ্রেশ হয়ে গেলে ভয় পাওয়ার কোনো কারণ নেই! আপনার সিলেক্ট করা ফাইল, তৈরি হওয়া মেটাডাটা ও স্ক্রিনের সঠিক পজিশন ব্রাউজারের মেমোরিতে সংরক্ষিত থাকবে এবং রিলোডের পর ঠিক আগের জায়গায় স্বয়ংক্রিয়ভাবে ফিরে আসবে।
        </p>
      </section>

      {/* ৩. সাধারণ প্রশ্ন ও সমাধান (FAQ) */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 text-amber-400 border-b border-slate-800 pb-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <h3 className={`${fontClasses.heading} text-white`}>
            ৩. সাধারণ প্রশ্ন ও সমাধান (FAQ)
          </h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h5 className={`${fontClasses.subhead} text-amber-300`}>প্রশ্ন: আমার লাইসেন্স কি শেষ হয়ে গেলে কী হবে?</h5>
            <p className={`${fontClasses.body} text-slate-300 mt-1`}>
              উত্তর: আপনার অ্যাকাউন্ট মেয়াদোত্তীর্ণ (Expired) দেখাবে। আপনি অ্যাডমিনের সাথে যোগাযোগ করে (ইমেইল: <code className="text-white">bulbulworka1@gmail.com</code> / ফোন: <code className="text-emerald-400">01617086747</code>) নতুন লাইসেন্স কি নিয়ে পুনরায় সক্রিয় করতে পারবেন।
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h5 className={`${fontClasses.subhead} text-amber-300`}>প্রশ্ন: কি-তে "Quota Exceeded (HTTP 429)" দেখালে কী করব?</h5>
            <p className={`${fontClasses.body} text-slate-300 mt-1`}>
              উত্তর: ড্রপজোনের উপরে <strong>"Retry Failed"</strong> চাপুন অথবা AI Engine সেকশনে অতিরিক্ত ২/৩টি ফ্রি জেমিনি বা গ্রক কি যুক্ত করে রাখুন। একটির লিমিট শেষ হলে সফটওয়্যার নিজে থেকেই পরবর্তী কি-তে চলে যাবে।
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h5 className={`${fontClasses.subhead} text-amber-300`}>প্রশ্ন: আমার আসল ভেক্টর EPS ফাইলের কোয়ালিটি নষ্ট হবে কি?</h5>
            <p className={`${fontClasses.body} text-slate-300 mt-1`}>
              উত্তর: কোনোভাবেই না। সফটওয়্যারটি বাইনারি-সেফ মেথডে শুধুমাত্র হেডার ট্যাগে মেটাডাটা লেখে। মূল ভেক্টর বা আর্টওয়ার্ক ১০০% অপরিবর্তিত থাকে।
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* USER ENGLISH CONTENT                                                       */
/* -------------------------------------------------------------------------- */
const UserEnglishContent: React.FC<{
  fontClasses: any;
  onOpenActivateKey?: () => void;
  onOpenAuth?: () => void;
  currentUser?: UserProfile | null;
}> = ({ fontClasses, onOpenActivateKey, onOpenAuth, currentUser }) => {
  return (
    <div className="space-y-10">
      {/* 1. Step-by-Step Instructions */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 text-emerald-400 border-b border-slate-800 pb-4">
          <BookOpen className="w-7 h-7 shrink-0" />
          <h3 className={`${fontClasses.heading} text-white`}>
            1. Step-by-Step Complete User Guide
          </h3>
        </div>

        <div className="space-y-6">
          {/* Step 1: Account Registration & Login */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              1
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                Create Your Account & Sign In
              </h4>
              <p className={fontClasses.body}>
                Click the <strong>"Sign In / Register"</strong> button in the top navigation bar. Enter your desired username, registered email address, and a secure password.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                💡 <strong>Why register?</strong> Your license key, access period, saved metadata, and workspace settings are securely linked to your account.
              </div>
            </div>
          </div>

          {/* Step 2: License Key Activation */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              2
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-emerald-400`}>
                Obtain Your License Key & Activate Access
              </h4>
              <p className={fontClasses.body}>
                To unlock full access or extend your subscription period, contact the Administrator to receive your unique license key (formatted like <code className="text-amber-400 font-mono">SM-30D-XXXX-XXXX</code>).
              </p>
              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>Direct Administrator Contact:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">📞 Phone / WhatsApp:</span>
                    <a href="tel:01617086747" className="font-mono text-emerald-400 font-bold text-sm">
                      01617086747
                    </a>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block mb-0.5">✉️ Admin Email:</span>
                    <a href="mailto:bulbulworka1@gmail.com" className="font-mono text-indigo-300 font-bold text-sm">
                      bulbulworka1@gmail.com
                    </a>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-300 font-semibold">
                    How to Activate Your License Key:
                  </p>
                  <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 mt-1">
                    <li>Click the green <strong>"🔑 Activate Key"</strong> button in the top navigation bar.</li>
                    <li>Paste your unique license key into the input field.</li>
                    <li>Click <strong>"Activate Key"</strong>. The period is instantly added to your account and your status turns Active!</li>
                  </ol>
                  {onOpenActivateKey && (
                    <button
                      type="button"
                      onClick={onOpenActivateKey}
                      className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Open License Key Activation Window</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Setup User Free API Keys */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              3
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                Enter Your Own Free AI API Keys (Gemini & Groq)
              </h4>
              <p className={fontClasses.body}>
                Each user inputs their <strong>own free API keys</strong>. This guarantees 100% data privacy and avoids shared rate-limiting or quota exhaustion.
              </p>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <p className="text-indigo-300 font-semibold">Where to Get Free API Keys:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>
                    <strong>Google Gemini Free API Key:</strong>{' '}
                    <a
                      href="https://aistudio.google.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline font-mono"
                    >
                      aistudio.google.com/api-keys
                    </a>{' '}
                    (100% Free, no credit card required)
                  </li>
                  <li>
                    <strong>Groq Vision Free API Key:</strong>{' '}
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline font-mono"
                    >
                      console.groq.com/keys
                    </a>{' '}
                    (High-speed vision AI model)
                  </li>
                </ul>
                <p className="text-slate-400 mt-2">
                  Navigate to the right sidebar under <strong>"AI Engine & SEO"</strong> and paste your key. You can also add multiple keys separated by commas for automated pool rotation!
                </p>
              </div>
            </div>
          </div>

          {/* Step 4: Drop Files */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              4
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                Drop 1 to 100 Files (EPS, SVG, JPG, PNG)
              </h4>
              <p className={fontClasses.body}>
                Drag & drop your files directly into the center dropzone. The built-in in-memory rasterizer extracts thumbnails directly from standalone EPS binary headers without needing companion JPG files.
              </p>
            </div>
          </div>

          {/* Step 5: Generate AI Metadata */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              5
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                Click "Generate All with AI"
              </h4>
              <p className={fontClasses.body}>
                Watch the live batch progress bar as AI analyzes each thumbnail to produce:
              </p>
              <ul className="list-disc list-inside text-xs md:text-sm text-slate-300 space-y-1">
                <li><strong>Commercial Title:</strong> 70 to 100 characters, specific niche context words, zero duplicate words.</li>
                <li><strong>Clean Description:</strong> Grammatically sound English description designed for buyer searches.</li>
                <li><strong>45 High-Converting Keywords:</strong> 30 dynamic niche visual tags + 15 standard stock style tags.</li>
              </ul>
            </div>
          </div>

          {/* Step 6: Embed or Export CSV */}
          <div className="flex items-start space-x-4">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-base">
              6
            </div>
            <div className="space-y-2 flex-1">
              <h4 className={`${fontClasses.subhead} text-white`}>
                Embed Directly into EPS/JPG or Export CSV
              </h4>
              <p className={fontClasses.body}>
                Choose from the bottom bar actions:
              </p>
              <ul className="list-disc list-inside text-xs md:text-sm text-slate-300 space-y-1">
                <li><strong>Embed Metadata:</strong> Direct binary-safe 4-layer embedding into EPS (XMP, DSC, IPTC, TIFF) and JPG Exif without opening Illustrator.</li>
                <li><strong>Export CSV:</strong> Download pre-formatted spreadsheets customized for Adobe Stock, Shutterstock, Freepik, and Vecteezy.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Workspace State Preservation */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-4">
        <div className="flex items-center space-x-3 text-cyan-400 border-b border-slate-800 pb-3">
          <RefreshCw className="w-6 h-6 shrink-0" />
          <h3 className={`${fontClasses.heading} text-white`}>
            2. Anti-Loss Auto-Save & Refresh Protection
          </h3>
        </div>
        <p className={fontClasses.body}>
          If you accidentally refresh or reload your browser, your entire workspace session—including all loaded files, generated titles, keywords, and scroll position—is automatically restored from session storage. You will never lose your progress!
        </p>
      </section>

      {/* 3. FAQ */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <div className="flex items-center space-x-3 text-amber-400 border-b border-slate-800 pb-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <h3 className={`${fontClasses.heading} text-white`}>
            3. Troubleshooting & Frequently Asked Questions
          </h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h5 className={`${fontClasses.subhead} text-amber-300`}>What happens when my license period expires?</h5>
            <p className={`${fontClasses.body} text-slate-300 mt-1`}>
              Your account status will display "Expired". Contact Admin (Email: <code className="text-white">bulbulworka1@gmail.com</code> / Phone: <code className="text-emerald-400">01617086747</code>) to renew your subscription and enter your new license key.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h5 className={`${fontClasses.subhead} text-amber-300`}>What should I do if I get HTTP 429 Rate Limit error?</h5>
            <p className={`${fontClasses.body} text-slate-300 mt-1`}>
              Click <strong>"Retry Failed"</strong> above the dropzone, or add 2–3 free Gemini or Groq API keys in the AI Engine sidebar to enable automated key pool rotation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <h5 className={`${fontClasses.subhead} text-amber-300`}>Does embedding damage my original vector art?</h5>
            <p className={`${fontClasses.body} text-slate-300 mt-1`}>
              No. The embedder operates strictly in binary-safe mode, updating only metadata tags in the file header without modifying the underlying PostScript vectors or vector curves.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* ADMIN OPERATIONS MANUAL (Strictly Hidden from Normal Users)                */
/* -------------------------------------------------------------------------- */
const AdminOperationsManual: React.FC<{ fontClasses: any; language: Language }> = ({
  fontClasses,
  language,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/50 space-y-3">
        <div className="flex items-center space-x-3 text-amber-300">
          <Shield className="w-8 h-8 shrink-0" />
          <div>
            <h3 className={`${fontClasses.heading} text-white`}>
              👑 Master Administrator Operations Manual
            </h3>
            <p className="text-xs text-amber-300/80">
              CONFIDENTIAL — Visible ONLY to Master Admin. Contains internal user management & license generation procedures.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Admin Credentials */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className={`${fontClasses.subhead} text-amber-400 flex items-center gap-2`}>
          <Lock className="w-5 h-5" /> 1. Master Admin Login & Access
        </h4>
        <div className="text-xs md:text-sm text-slate-300 space-y-2">
          <p>
            Master Admin credentials are initialized automatically on system launch:
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
            <div>Username: <span className="text-white font-bold">admin</span></div>
            <div>Password: <span className="text-emerald-400 font-bold">Admin@StockMeta2026</span></div>
            <div>Email: <span className="text-indigo-300">admin@stockmeta.pro</span></div>
          </div>
          <p className="text-slate-400 text-xs">
            Admin has lifetime unlimited processing quota (0 limit) and can open the <strong>"👑 Admin Panel"</strong> button from the top navigation bar.
          </p>
        </div>
      </div>

      {/* Section 2: Generating Unique License Keys */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h4 className={`${fontClasses.subhead} text-emerald-400 flex items-center gap-2`}>
          <Key className="w-5 h-5" /> 2. Generating Unique License Keys for Users
        </h4>
        <div className="text-xs md:text-sm text-slate-300 space-y-3">
          <p>
            To generate a new subscription license key for a customer:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 text-xs md:text-sm">
            <li>Open <strong>"👑 Admin Panel"</strong> and select the <strong>"🔑 License Keys Generator"</strong> tab.</li>
            <li>
              <strong>User Email ID:</strong> Enter the user's exact registered email address (e.g. <code className="text-cyan-400">customer@gmail.com</code>). You can also click any registered user's email badge to auto-fill it.
            </li>
            <li>
              <strong>Access Period:</strong> Enter the number of days (e.g. 30, 90, 365) or click preset buttons (<code className="text-emerald-400">30d</code>, <code className="text-emerald-400">90d</code>, <code className="text-emerald-400">1yr</code>).
            </li>
            <li>
              <strong>Daily Quota:</strong> Set maximum files per day (default is 50, or enter 0 for unlimited).
            </li>
            <li>
              <strong>Notes:</strong> Add order memo (e.g. "bKash TrxID #10294 / Month 1").
            </li>
            <li>
              Click <strong>"Generate License Key"</strong>. The system produces a cryptographically secure key: <code className="text-amber-400 font-mono">SM-[DAYS]D-XXXX-XXXX</code>.
            </li>
            <li>
              Click <strong>"Copy Message for Client"</strong> to copy the pre-written instructions and send them directly to the buyer via WhatsApp or email!
            </li>
          </ol>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
            🔒 <strong>Strict Email Binding:</strong> A key generated for <code className="text-white">userA@gmail.com</code> CANNOT be activated by <code className="text-white">userB@gmail.com</code>. This completely prevents key piracy or unauthorized sharing.
          </div>
        </div>
      </div>

      {/* Section 3: Managing Users */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className={`${fontClasses.subhead} text-indigo-400 flex items-center gap-2`}>
          <UserCheck className="w-5 h-5" /> 3. Managing User Accounts & Access
        </h4>
        <div className="text-xs md:text-sm text-slate-300 space-y-2">
          <p>Inside the <strong>"Registered Users"</strong> tab, you have full control over all user accounts:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
            <li><strong>Quick Extend:</strong> Click <code className="text-emerald-400">+7d</code>, <code className="text-emerald-400">+30d</code>, or <code className="text-emerald-400">+90d</code> to immediately add access days to any user.</li>
            <li><strong>Edit Access:</strong> Customise expiration date or change daily file quota.</li>
            <li><strong>Suspend / Activate:</strong> One-click toggle to suspend abusive accounts or re-activate expired users.</li>
            <li><strong>Reset Password:</strong> Set a new temporary password for any user who forgot their credentials.</li>
            <li><strong>Delete:</strong> Permanently remove an account.</li>
          </ul>
        </div>
      </div>

      {/* Section 4: System Policies & Backup */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h4 className={`${fontClasses.subhead} text-cyan-400 flex items-center gap-2`}>
          <Download className="w-5 h-5" /> 4. System Policies & Database Backups
        </h4>
        <div className="text-xs md:text-sm text-slate-300 space-y-2">
          <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs">
            <li><strong>Enforce Login:</strong> Toggle whether visitors must log in to use AI metadata generation.</li>
            <li><strong>Default Trial Period:</strong> Set initial access days granted to brand new signups (default: 7 days).</li>
            <li><strong>Export Backup:</strong> Click "Download Backup File (.json)" to download all user accounts, hashed credentials, and license keys to your computer.</li>
            <li><strong>Restore Backup:</strong> Choose any previous JSON backup to restore all users and license keys instantly.</li>
          </ul>
        </div>
      </div>

      {/* Admin Hotline Box */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
        <div>
          <span className="text-white font-semibold">Admin Contact Registered:</span> Bulbul (Email: <span className="text-indigo-300">bulbulworka1@gmail.com</span> | Phone: <span className="text-emerald-400">01617086747</span>)
        </div>
        <div className="font-mono text-slate-500">StockMeta Pro v3.36</div>
      </div>
    </div>
  );
};
