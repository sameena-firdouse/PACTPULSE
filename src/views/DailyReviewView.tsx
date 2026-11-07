import React, { useState, useEffect } from 'react';
import { Task, User, DailyReviewRecord, ScheduleProposal } from '../types.js';
import { runDailyReview, generateTomorrowSchedule, fetchDailyReviews, approveProposal } from '../api.js';
import {
  BarChart3,
  Sparkles,
  Database,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BrainCircuit,
  Calendar,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyReviewViewProps {
  tasks: Task[];
  users: User[];
  proposals: ScheduleProposal[];
  onRefreshData: () => void;
  onNavigate: (tab: any) => void;
}

export const DailyReviewView: React.FC<DailyReviewViewProps> = ({
  tasks,
  users,
  proposals,
  onRefreshData,
  onNavigate
}) => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [reviews, setReviews] = useState<DailyReviewRecord[]>([]);
  const [isLearning, setIsLearning] = useState(false);
  const [isGeneratingTomorrow, setIsGeneratingTomorrow] = useState(false);
  const [learnResult, setLearnResult] = useState<any>(null);
  const [tomorrowPlanResult, setTomorrowPlanResult] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      const data = await fetchDailyReviews();
      setReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const todayTasks = tasks.filter((t) => t.date === today);
  const totalPlanned = todayTasks.reduce((sum, t) => sum + t.estimated_hours, 0);
  const totalActual = todayTasks.reduce((sum, t) => sum + (t.actual_hours || t.estimated_hours), 0);
  const variance = Number((totalActual - totalPlanned).toFixed(1));

  // Button 1: "Learn from Today's Work"
  const handleLearnFromToday = async () => {
    setIsLearning(true);
    setFeedback(null);

    try {
      const res = await runDailyReview(today);
      setLearnResult(res);
      setFeedback(`Analyzed workday! Retained ${res.retainedCount} core experiences into Vectorize Hindsight.`);
      confetti({ particleCount: 70, spread: 60 });
      loadReviews();
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Daily review failed');
    } finally {
      setIsLearning(false);
    }
  };

  // Button 2: "Generate Tomorrow's Smarter Schedule"
  const handleGenerateTomorrow = async () => {
    setIsGeneratingTomorrow(true);
    setFeedback(null);

    try {
      const res = await generateTomorrowSchedule();
      setTomorrowPlanResult(res);
      setFeedback(`Generated tomorrow's schedule (${tomorrow}) applying Hindsight memory protective buffers!`);
      confetti({ particleCount: 90, spread: 80 });
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to generate tomorrow schedule');
    } finally {
      setIsGeneratingTomorrow(false);
    }
  };

  const handleApproveTomorrowProposal = async (proposalId: string) => {
    try {
      await approveProposal(proposalId);
      confetti({ particleCount: 100, spread: 80 });
      setFeedback('Tomorrow\'s protected schedule approved and saved to team plan!');
      setTomorrowPlanResult(null);
      onRefreshData();
    } catch (err: any) {
      setFeedback(err.message || 'Failed to approve');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/70 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              End-of-Day Learning & Schedule Compounding
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            "How can we make tomorrow's work schedule better based on what happened today?"
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            PactPulse AI measures planned versus actual durations, extracts root-cause lessons into Hindsight, and uses those memories to create safer next-day schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Button 1: Learn from Today's Work */}
          <button
            onClick={handleLearnFromToday}
            disabled={isLearning}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <BrainCircuit className={`w-4 h-4 ${isLearning ? 'animate-spin' : ''}`} />
            <span>{isLearning ? 'Learning...' : "Learn from Today's Work"}</span>
          </button>

          {/* Button 2: Generate Tomorrow's Smarter Schedule */}
          <button
            onClick={handleGenerateTomorrow}
            disabled={isGeneratingTomorrow}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingTomorrow ? 'animate-spin' : ''}`} />
            <span>{isGeneratingTomorrow ? 'Generating...' : "Generate Tomorrow's Smarter Schedule"}</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Planned vs Actual Duration Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs font-semibold">Planned Hours</div>
          <div className="text-2xl font-bold text-white font-mono">{totalPlanned}h</div>
          <div className="text-[11px] text-slate-500">Initial scheduling estimate</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs font-semibold">Actual Time Spent</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono">{totalActual}h</div>
          <div className="text-[11px] text-slate-500">Recorded by team</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs font-semibold">Duration Variance</div>
          <div className={`text-2xl font-bold font-mono ${variance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {variance > 0 ? `+${variance}h` : `${variance}h`}
          </div>
          <div className="text-[11px] text-slate-500">
            {variance > 0 ? 'Drift due to delay bottlenecks' : 'On-time delivery'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400 text-xs font-semibold">Hindsight Memory Ingestion</div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {reviews.reduce((sum, r) => sum + (r.hindsight_retained_count || 0), 0) + (learnResult?.retainedCount || 0)}
          </div>
          <div className="text-[11px] text-slate-500">Experiences retained</div>
        </div>
      </div>

      {/* Tomorrow's Generated Smarter Schedule Proposal */}
      {tomorrowPlanResult && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Hindsight Optimization Applied
                </span>
                <span className="text-xs text-slate-400">Date: {tomorrow}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {tomorrowPlanResult.tomorrowPlan?.proposalTitle || "Tomorrow's Protected Schedule"}
              </h3>
            </div>

            {tomorrowPlanResult.proposalId && (
              <button
                onClick={() => handleApproveTomorrowProposal(tomorrowPlanResult.proposalId)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Tomorrow's Plan</span>
              </button>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {tomorrowPlanResult.tomorrowPlan?.summary}
          </p>

          {/* Improvements Applied */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Protective Safeguards Injected:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tomorrowPlanResult.tomorrowPlan?.improvementsApplied?.map((imp: string, i: number) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{imp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hindsight Citations */}
          {tomorrowPlanResult.tomorrowPlan?.hindsightCitations?.length > 0 && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                Hindsight Memory Precedents Cited:
              </div>
              {tomorrowPlanResult.tomorrowPlan.hindsightCitations.map((cit: string, idx: number) => (
                <div key={idx} className="font-mono text-[11px] text-slate-300 italic">
                  ↳ "{cit}"
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workday Historical Learning Log */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Historical Daily Reviews & Lessons Retained</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {reviews.length} workdays logged
          </span>
        </div>

        <div className="space-y-3">
          {reviews.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No daily reviews logged yet. Click "Learn from Today's Work" above.
            </div>
          ) : (
            reviews.map((rev) => {
              const learnings = rev.learnings ? JSON.parse(rev.learnings) : [];
              return (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">Date: {rev.date}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300">
                        {rev.total_tasks} tasks ({rev.completed_tasks} completed, {rev.delayed_tasks} delayed)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-slate-400">Planned: {rev.planned_hours}h</span>
                      <span className="text-indigo-400">Actual: {rev.actual_hours}h</span>
                      <span className={rev.hours_variance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                        Variance: {rev.hours_variance > 0 ? `+${rev.hours_variance}h` : `${rev.hours_variance}h`}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-400">Lessons Learned:</div>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-300">
                      {learnings.map((l: string, idx: number) => (
                        <li key={idx} className="leading-relaxed">{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
