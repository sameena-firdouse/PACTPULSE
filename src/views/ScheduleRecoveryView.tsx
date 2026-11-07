import React, { useState } from 'react';
import { Task, User, AIRecoveryProposal, ScheduleProposal } from '../types.js';
import { recoverSchedule, approveProposal, rejectProposal } from '../api.js';
import {
  LifeBuoy,
  AlertTriangle,
  Clock,
  ArrowRight,
  CheckCircle2,
  Users,
  Database,
  Sparkles,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScheduleRecoveryViewProps {
  tasks: Task[];
  users: User[];
  proposals: ScheduleProposal[];
  onRefreshData: () => void;
}

export const ScheduleRecoveryView: React.FC<ScheduleRecoveryViewProps> = ({
  tasks,
  users,
  proposals,
  onRefreshData
}) => {
  const employees = users.filter((u) => u.role === 'employee');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || 'emp-alex');
  const [interruptionReason, setInterruptionReason] = useState<string>(
    'I have an unexpected urgent client meeting for two hours.'
  );
  const [durationHours, setDurationHours] = useState<number>(2.0);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);
  const [recoveryResult, setRecoveryResult] = useState<AIRecoveryProposal | null>(null);
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId) || employees[0];

  const handleRunRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecovering(true);
    setFeedback(null);

    try {
      const res = await recoverSchedule({
        employee_id: selectedEmployeeId,
        reason: interruptionReason.trim(),
        duration_hours: Number(durationHours)
      });
      setRecoveryResult(res.recovery);
      setCreatedProposalId(res.proposalId);
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Recovery simulation failed');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleApprove = async () => {
    if (!createdProposalId) return;
    try {
      await approveProposal(createdProposalId);
      confetti({ particleCount: 80, spread: 70 });
      setFeedback('Recovery schedule approved! Tasks have been reassigned and time-shifted, and outcome recorded in Hindsight.');
      setCreatedProposalId(null);
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!createdProposalId) return;
    try {
      await rejectProposal(createdProposalId);
      setFeedback('Proposed recovery rejected.');
      setCreatedProposalId(null);
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to reject');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Emergency Schedule Recovery Agent
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Smart Rescheduling for Unexpected Interruptions
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            When urgent emergencies or surprise meetings disrupt the workday, PactPulse AI identifies affected deliverables, checks peer workload capacity, and creates a side-by-side recovery schedule.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Interruption Trigger Form */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-bold text-white">Simulate Unexpected Interruption Event</h3>
        </div>

        <form onSubmit={handleRunRecovery} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Affected Employee
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.title.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Interruption Notice / Reason
            </label>
            <input
              type="text"
              value={interruptionReason}
              onChange={(e) => setInterruptionReason(e.target.value)}
              placeholder="e.g. I have an unexpected urgent client meeting for two hours."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Lost Duration (Hours)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="8"
                value={durationHours}
                onChange={(e) => setDurationHours(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
                required
              />
              <button
                type="submit"
                disabled={isRecovering}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all whitespace-nowrap disabled:opacity-50"
              >
                {isRecovering ? 'Computing...' : 'Run Recovery'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Side-by-Side Schedule Comparison (Original vs Proposed) */}
      {recoveryResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Recovery Overview Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Recovery Solution Formulated
                  </span>
                  <span className="text-xs text-slate-400">
                    Impacted: {recoveryResult.affectedEmployeeName} ({recoveryResult.durationHours}h)
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  {recoveryResult.interruptionSummary}
                </h3>
              </div>

              {createdProposalId && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Apply Schedule</span>
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              <strong>Rationale: </strong>{recoveryResult.rationale}
            </p>

            {recoveryResult.hindsightInfluence && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  <strong>Hindsight Precedent: </strong>{recoveryResult.hindsightInfluence}
                </span>
              </div>
            )}
          </div>

          {/* Side-by-Side Schedules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Schedule */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Original Pre-Interruption Schedule
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">Baseline</span>
              </div>

              <div className="space-y-3">
                {recoveryResult.originalSchedule.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{t.title}</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {t.startTime} - {t.endTime}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <Users className="w-3 h-3 text-slate-500" />
                      <span>Assigned to: {t.assigneeName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proposed Recovery Schedule */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-4 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Proposed AI Recovery Schedule
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">Optimized</span>
              </div>

              <div className="space-y-3">
                {recoveryResult.proposedSchedule.map((t, idx) => {
                  const isReassigned = t.action === 'reassigned';
                  const isShifted = t.action === 'time_shifted';
                  const isDelayed = t.action === 'delayed';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                        isReassigned
                          ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                          : isShifted
                          ? 'bg-sky-950/40 border-sky-500/30 text-sky-200'
                          : isDelayed
                          ? 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{t.title}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isReassigned
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : isShifted
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : isDelayed
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {t.action.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-white text-[11px] font-semibold">
                            {t.startTime} - {t.endTime}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          Assignee: <strong className="text-slate-200">{t.assigneeName}</strong>
                        </span>
                        <span className="text-slate-400 italic">{t.notes}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
