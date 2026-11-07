import React, { useState } from 'react';
import { Task } from '../types.js';
import { X, AlertTriangle, Database, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

interface DelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSubmitDelay: (data: { delay_reason: string; actual_hours: number; blockers?: string }) => Promise<{
    success: boolean;
    hindsight: any;
    message: string;
  }>;
}

export const DelayModal: React.FC<DelayModalProps> = ({
  isOpen,
  onClose,
  task,
  onSubmitDelay
}) => {
  const [delayReason, setDelayReason] = useState('');
  const [actualHours, setActualHours] = useState<number>(task ? task.estimated_hours + 2.0 : 5.0);
  const [blockers, setBlockers] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; hindsight?: any } | null>(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayReason.trim()) return;

    setIsSubmitting(true);
    setResult(null);

    try {
      const res = await onSubmitDelay({
        delay_reason: delayReason.trim(),
        actual_hours: Number(actualHours),
        blockers: blockers.trim() || undefined
      });
      setResult(res);
      setTimeout(() => {
        onClose();
        setResult(null);
      }, 1800);
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Failed to report delay'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-amber-500/5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report Task Delay & Blocker</h3>
              <p className="text-xs text-slate-400">Captures actual experience for Hindsight learning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Task Summary Banner */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Task: </span>
            <span className="text-white font-semibold">{task.title}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-slate-400">
            <span>Planned: <strong className="text-slate-200">{task.estimated_hours}h</strong></span>
          </div>
        </div>

        {/* Success or Error Alert */}
        {result && (
          <div className={`m-6 p-4 rounded-xl border text-xs flex items-start gap-3 ${
            result.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">{result.message}</div>
              {result.hindsight?.logId && (
                <div className="font-mono text-[10px] text-slate-400">
                  Hindsight Log: {result.hindsight.logId}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Delay Reason / What Happened? *
              </label>
              <textarea
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="e.g. Customer approval delayed by 2 hours due to pending CEO review on branding colors..."
                rows={3}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Be specific. Vectorize Hindsight extracts root cause entities to protect future schedules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Total Actual Hours Spent *
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    value={actualHours}
                    onChange={(e) => setActualHours(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                    required
                  />
                </div>
                <div className="text-[10px] text-amber-400 mt-1 font-mono">
                  Variance: +{(actualHours - task.estimated_hours).toFixed(1)}h over estimate
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Active Blocker Description (Optional)
                </label>
                <input
                  type="text"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  placeholder="e.g. Waiting on marketing signoff"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Hindsight Retain Callout */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="text-[11px] text-slate-300">
                <span className="font-semibold text-indigo-300">Real Hindsight Memory Ingestion: </span>
                This experience will be retained in bank <code className="text-indigo-200">pactpulse-workforce</code> so tomorrow's AI agent can add automatic buffers!
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !delayReason.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Retaining to Hindsight...</span>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Report Delay & Retain</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
