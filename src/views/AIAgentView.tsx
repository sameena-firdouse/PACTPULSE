import React, { useState } from 'react';
import { Task, User, AIScheduleAnalysis, ScheduleProposal } from '../types.js';
import { analyzeSchedule, approveProposal, rejectProposal } from '../api.js';
import {
  Sparkles,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  Database,
  BrainCircuit,
  ShieldCheck,
  RefreshCw,
  Layers,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AIAgentViewProps {
  tasks: Task[];
  users: User[];
  proposals: ScheduleProposal[];
  onRefreshData: () => void;
}

export const AIAgentView: React.FC<AIAgentViewProps> = ({
  tasks,
  users,
  proposals,
  onRefreshData
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIScheduleAnalysis | null>(null);
  const [recalledMemories, setRecalledMemories] = useState<Array<{ text: string }>>([]);
  const [hindsightStatus, setHindsightStatus] = useState<string>('');
  const [createdProposalId, setCreatedProposalId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setFeedback(null);

    try {
      const res = await analyzeSchedule();
      setAnalysisResult(res.analysis);
      setRecalledMemories(res.recalledMemories || []);
      setHindsightStatus(res.hindsightStatus);
      setCreatedProposalId(res.proposalId);
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveProposal(id);
      confetti({ particleCount: 70, spread: 60 });
      setFeedback('Schedule adjustments successfully applied to team agenda and retained in Hindsight!');
      setCreatedProposalId(null);
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectProposal(id);
      setFeedback('Proposal rejected.');
      setCreatedProposalId(null);
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to reject');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Gemini Reasoning Engine + Hindsight Memory
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            AI Scheduling Agent & Bottleneck Detector
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Analyzes current employee availability, hard deadlines, and overlaps against past experiences in Vectorize Hindsight to recommend balanced, conflict-free schedules.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Analyzing Availability & Memory...' : 'Analyze Workforce Schedule'}</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Recalled Hindsight Memories Card */}
      {recalledMemories.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Recalled Hindsight Long-Term Memories ({recalledMemories.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Bank: pactpulse-demo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recalledMemories.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1"
              >
                <div className="text-[10px] font-mono text-indigo-400 font-bold">
                  Memory #{idx + 1}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed italic">
                  "{m.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysisResult ? (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-purple-400" />
              Executive Scheduling Analysis
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysisResult.executiveSummary}
            </p>
          </div>

          {/* Overloaded Employees & High-Risk Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overloaded Employees */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  Overloaded Staff Detected ({analysisResult.overloadedEmployees?.length || 0})
                </h4>
              </div>

              {(!analysisResult.overloadedEmployees || analysisResult.overloadedEmployees.length === 0) ? (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  No employees currently exceed the daily 8.0-hour limit.
                </div>
              ) : (
                <div className="space-y-2">
                  {analysisResult.overloadedEmployees.map((emp, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-rose-200">
                        <span>{emp.employeeName}</span>
                        <span className="font-mono">{emp.totalHours}h / {emp.maxHours}h</span>
                      </div>
                      <p className="text-[11px] text-rose-300/80 leading-tight">
                        {emp.overloadReason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* High-Risk Tasks */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Tasks Likely to be Delayed ({analysisResult.riskTasks?.length || 0})
                </h4>
              </div>

              {(!analysisResult.riskTasks || analysisResult.riskTasks.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  No high-risk delay patterns flagged for today.
                </div>
              ) : (
                <div className="space-y-2">
                  {analysisResult.riskTasks.map((rt, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-semibold text-amber-200">
                        <span>{rt.taskTitle}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          Risk {rt.riskScore}/10
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-300/80 leading-tight">
                        {rt.reason}
                      </p>
                      {rt.hindsightInfluence && (
                        <div className="text-[10px] font-mono text-indigo-300 pt-0.5">
                          ↳ Hindsight Influence: {rt.hindsightInfluence}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommended Schedule Adjustments */}
          {analysisResult.recommendedAdjustments && analysisResult.recommendedAdjustments.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Recommended Schedule Adjustments & Reallocations
                  </h3>
                  <p className="text-xs text-slate-400">
                    Human-in-the-Loop: Requires employer approval before applying to employee schedules
                  </p>
                </div>

                {createdProposalId && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(createdProposalId)}
                      className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 text-xs font-medium"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(createdProposalId)}
                      className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/25 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Apply Adjustments</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {analysisResult.recommendedAdjustments.map((adj, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-white">{adj.taskTitle}</span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-slate-400">
                          {adj.currentStartTime || '09:00'} - {adj.currentEndTime || '12:00'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-purple-300 font-bold">
                          {adj.suggestedStartTime || '08:30'} - {adj.suggestedEndTime || '12:00'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {adj.rationale}
                    </p>

                    {adj.hindsightMemoryUsed && (
                      <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>Hindsight Experience Cited: {adj.hindsightMemoryUsed}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <BrainCircuit className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">Ready for Workforce Schedule Reasoning</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Click "Analyze Workforce Schedule" above. Gemini will evaluate employee capacities, detect bottlenecks, cross-reference previous delay experiences in Hindsight, and formulate non-overlapping schedule optimizations.
          </p>
        </div>
      )}
    </div>
  );
};
