import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Server, Key, AlertTriangle, ExternalLink } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">Privacy, Security & Data Terms</h3>
              <p className="text-xs text-slate-400">
                Transparent information regarding your assets, API keys, and AI model terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
          {/* Card 1: Local-First Guarantee */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <Server className="w-4 h-4" />
              <span>100% Local Processing on Your Machine</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              StockMeta Pro runs as a desktop-native application hosted strictly on{' '}
              <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">localhost:3000</code>.
              There is <strong>no proprietary cloud backend</strong>, no analytics trackers, and no third-party servers
              storing your creative media.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 pt-1">
              <li>
                <strong className="text-slate-200">ExifTool Embedding:</strong> IPTC, XMP-dc, and EXIF tags are written directly into your files (or designated copy folders) on your local hard drive.
              </li>
              <li>
                <strong className="text-slate-200">FFmpeg & Sharp:</strong> Video transcoding, audio probing, frame extraction, and vector rendering are executed by local system binaries.
              </li>
              <li>
                <strong className="text-slate-200">Perceptual dHash:</strong> Duplicate visual hashing happens entirely inside your local browser memory.
              </li>
            </ul>
          </div>

          {/* Card 2: Google AI Studio Terms */}
          <div className="bg-amber-950/20 p-4 rounded-xl border border-amber-800/40 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Google AI Studio (Gemini Free-Tier) Terms</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When using a <strong>free Gemini API key</strong> from Google AI Studio, please be aware of Google's API Terms of Service:
            </p>
            <p className="text-slate-400 leading-relaxed">
              Under Google's free tier, prompts and preview images submitted to the Gemini API may be processed and reviewed by human reviewers to train and improve Google products.
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-amber-800/30 text-amber-200">
              <p className="font-medium mb-1">💡 Professional Contributor Best Practice:</p>
              <p className="text-slate-300">
                If you are analyzing under-NDA commercial work, unreleased client shoots, or sensitive copyrighted material, consider using a <strong>Google Cloud Vertex AI</strong> or paid project key where Google commits to zero-data-logging and no model training on customer data.
              </p>
            </div>
          </div>

          {/* Card 3: Downscaled Thumbnails Only */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
              <EyeOff className="w-4 h-4" />
              <span>Never Uploads Full-Resolution Originals</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              StockMeta Pro never sends full-size 50-megapixel RAW photos, 4K ProRes videos, or vector source archives over the wire. Before consulting the vision AI, images are downscaled to an efficient <strong>1024–1536px long edge</strong>, and video inputs are sampled into 6–8 lightweight still frames.
            </p>
          </div>

          {/* Card 4: BYOK Security */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
              <Key className="w-4 h-4" />
              <span>Bring Your Own Key (BYOK) Security</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Your API key is saved exclusively in your personal browser's{' '}
              <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">localStorage</code>.
              It is never transmitted to us or written into repository files. You can clear or rotate your key at any moment with 1 click in the AI Engine settings.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <a
            href="https://ai.google.dev/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Read Google AI Terms of Service</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};
