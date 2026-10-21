import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  Tag,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { StockFile, ComplianceRiskItem, RiskLevel } from '../types/stock';
import { COMPLIANCE_LEGAL_DISCLAIMER, evaluateComplianceRisks } from '../services/complianceRiskService';

interface RiskComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: StockFile[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onUpdateMetadata: (fileId: string, updated: Partial<StockFile['metadata']>) => void;
}

export const RiskComplianceModal: React.FC<RiskComplianceModalProps> = ({
  isOpen,
  onClose,
  files,
  selectedFileId,
  onSelectFile,
  onUpdateMetadata,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<RiskLevel | 'ALL'>('ALL');

  if (!isOpen) return null;

  const currentFile = files.find((f) => f.id === selectedFileId) || files[0];
  const riskReport = currentFile ? (currentFile.riskReport || evaluateComplianceRisks(currentFile)) : null;

  // Handler for 1-click remediation
  const handleApplyRemediation = (item: ComplianceRiskItem) => {
    if (!currentFile) return;

    if (item.remediationAction === 'remove_terms' && item.detectedTerms) {
      const termsToRemove = new Set(item.detectedTerms.map((t) => t.toLowerCase()));
      const cleanedKeywords = currentFile.metadata.keywords.filter(
        (kw) => !termsToRemove.has(kw.toLowerCase())
      );

      let cleanedTitle = currentFile.metadata.title;
      let cleanedDesc = currentFile.metadata.description;

      for (const term of item.detectedTerms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        cleanedTitle = cleanedTitle.replace(regex, '').replace(/\s{2,}/g, ' ').trim();
        cleanedDesc = cleanedDesc.replace(regex, '').replace(/\s{2,}/g, ' ').trim();
      }

      onUpdateMetadata(currentFile.id, {
        title: cleanedTitle,
        description: cleanedDesc,
        keywords: cleanedKeywords,
      });
    } else if (item.remediationAction === 'mark_editorial') {
      onUpdateMetadata(currentFile.id, {
        editorial: true,
      });
    } else if (item.remediationAction === 'flag_release_required') {
      onUpdateMetadata(currentFile.id, {
        releasesRequired: true,
      });
    }
  };

  const filteredItems = riskReport
    ? filterSeverity === 'ALL'
      ? riskReport.items
      : riskReport.items.filter((i) => i.severity === filterSeverity)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                AI Content, Copyright & Trademark Risk Checker
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Feature 1
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pre-submission IP compliance screening for Adobe Stock, Shutterstock, Getty & major agencies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Disclaimer Pill */}
        <div className="bg-slate-950/70 border-b border-slate-800/80 px-4 py-2 flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-[11px] leading-relaxed">{COMPLIANCE_LEGAL_DISCLAIMER}</span>
        </div>

        {/* Content Body: Left File List + Right Analysis */}
        <div className="flex flex-1 min-h-0">
          {/* File Selector Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/50 p-3 overflow-y-auto space-y-1.5">
            <div className="text-[11px] font-mono uppercase text-slate-500 px-2 mb-1">Assets in Queue</div>
            {files.map((file) => {
              const report = file.riskReport || evaluateComplianceRisks(file);
              const isSelected = file.id === currentFile?.id;

              return (
                <button
                  key={file.id}
                  onClick={() => onSelectFile(file.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                      : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{file.format}</div>
                  </div>
                  <div>
                    {report.overallRisk === 'high_risk' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                        CRITICAL
                      </span>
                    ) : report.overallRisk === 'caution' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                        CAUTION
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        PASS
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed Risk Report */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {currentFile && riskReport ? (
              <>
                {/* Status Card */}
                <div
                  className={`p-4 rounded-xl border flex items-start justify-between ${
                    riskReport.overallRisk === 'high_risk'
                      ? 'bg-rose-950/30 border-rose-800/50 text-rose-200'
                      : riskReport.overallRisk === 'caution'
                      ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                      : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {riskReport.overallRisk === 'high_risk' ? (
                      <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    ) : riskReport.overallRisk === 'caution' ? (
                      <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">
                        {riskReport.overallRisk === 'high_risk'
                          ? 'Commercial Submission At Risk'
                          : riskReport.overallRisk === 'caution'
                          ? 'Advisory Items Requiring Review'
                          : 'Asset Cleared for Submission'}
                      </h3>
                      <p className="text-xs opacity-90 mt-0.5">{riskReport.summary}</p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center space-x-1 text-xs">
                    {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setFilterSeverity(sev)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                          filterSeverity === sev
                            ? 'bg-slate-800 text-white font-bold border border-slate-700'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List of Risk Findings */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Detected Findings ({filteredItems.length})</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Target: {currentFile.name}
                    </span>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/50 text-xs">
                      No compliance risks found for the selected filter.
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                item.severity === 'CRITICAL'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : item.severity === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {item.severity}
                            </span>
                            <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {item.isFactVsUncertainty.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-800/40">
                              {Math.round(item.confidence * 100)}% conf
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>

                        {/* Detected Terms Chips */}
                        {item.detectedTerms && item.detectedTerms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.detectedTerms.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-rose-950/40 border border-rose-800/40 text-rose-300 px-2 py-0.5 rounded-full font-mono flex items-center gap-1"
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 1-Click Remediation Buttons */}
                        {item.remediationAction && (
                          <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                            <span className="text-[11px] text-slate-500">Recommended Safe Action:</span>
                            {item.remediationAction === 'remove_terms' && (
                              <button
                                onClick={() => handleApplyRemediation(item)}
                                className="flex items-center space-x-1.5 text-xs bg-rose-600 hover:bg-rose-500 text-white px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
                              >
                                <span>Strip Trademarked Terms</span>
                              </button>
                            )}
                            {item.remediationAction === 'mark_editorial' && (
                              <button
                                onClick={() => handleApplyRemediation(item)}
                                className="flex items-center space-x-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
                              >
                                <span>Switch to Editorial License</span>
                              </button>
                            )}
                            {item.remediationAction === 'flag_release_required' && (
                              <button
                                onClick={() => handleApplyRemediation(item)}
                                className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
                              >
                                <span>Flag Release Required</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500">Select an asset to view compliance analysis.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
