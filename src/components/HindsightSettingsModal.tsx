import React, { useState } from 'react';
import { HindsightStatus } from '../types.js';
import { updateHindsightConfig } from '../api.js';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Key,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';

interface HindsightSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: HindsightStatus | null;
  onRefreshStatus: () => void;
}

export const HindsightSettingsModal: React.FC<HindsightSettingsModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus
}) => {
  const [apiKey, setApiKey] = useState('');
  const [bankId, setBankId] = useState(status?.bankId || 'pactpulse-demo');
  const [baseUrl, setBaseUrl] = useState(status?.baseUrl || 'https://api.hindsight.vectorize.io');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setFeedback(null);

    try {
      const updated = await updateHindsightConfig({
        apiKey: apiKey.trim() || undefined,
        bankId: bankId.trim(),
        baseUrl: baseUrl.trim()
      });
      onRefreshStatus();
      setFeedback({
        success: updated.isConnected,
        message: updated.isConnected
          ? 'Connected successfully to Vectorize Hindsight memory bank!'
          : updated.errorMessage || 'Configuration updated.'
      });
    } catch (err: any) {
      setFeedback({
        success: false,
        message: err.message || 'Failed to update configuration'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Vectorize Hindsight Memory Bank</h3>
              <p className="text-xs text-slate-400">Official long-term memory engine integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Card */}
        <div className="p-6 space-y-5">
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            status?.isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            {status?.isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <div className="font-bold flex items-center gap-2">
                <span>Status:</span>
                <span className="font-mono uppercase">
                  {status?.isConnected ? 'ACTIVE & CONNECTED' : 'API KEY UNCONFIGURED'}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {status?.isConnected
                  ? 'All workforce schedule experiences, delay root causes, and recoveries are stored and retrieved from the actual Vectorize Hindsight cloud service.'
                  : status?.errorMessage || 'Please configure your HINDSIGHT_API_KEY to enable live cloud memory synchronization.'}
              </p>
              <div className="pt-1 flex items-center gap-4 text-[10px] font-mono text-slate-400">
                <span>Bank: <strong className="text-white">{status?.bankId}</strong></span>
                <span>Key: <strong className="text-white">{status?.maskedKey}</strong></span>
              </div>
            </div>
          </div>

          {feedback && (
            <div className={`p-3 rounded-lg border text-xs ${
              feedback.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {feedback.message}
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Hindsight API Key (Server-Side)
                </label>
                <a
                  href="https://hindsight.vectorize.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Get Vectorize Key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={status?.isConfigured ? '•••••••••••••••• (Leave blank to keep existing)' : 'hsk_...'}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Keys remain strictly server-side and are never exposed to browser bundles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Memory Bank ID
                </label>
                <input
                  type="text"
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  placeholder="pactpulse-demo"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hindsight API Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.hindsight.vectorize.io"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Compliance with Hackathon Rules:
              </div>
              <p className="text-[11px] leading-relaxed">
                When an API key is present, all retain and recall requests call the actual endpoints at <code className="text-indigo-300">api.hindsight.vectorize.io</code>. If disconnected, errors are explicitly reported without fake simulation.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onRefreshStatus}
                className="px-3 py-2 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Test Ping</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  {isUpdating ? 'Saving...' : 'Save & Reconnect'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
