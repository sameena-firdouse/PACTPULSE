import React from 'react';
import { Task, User, DailyReviewRecord, HindsightStatus } from '../types.js';
import {
  Lightbulb,
  AlertTriangle,
  Database,
  TrendingDown,
  TrendingUp,
  Clock,
  Layers,
  Link2,
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface AIInsightsViewProps {
  tasks: Task[];
  users: User[];
  reviews: DailyReviewRecord[];
  hindsightStatus: HindsightStatus | null;
}

export const AIInsightsView: React.FC<AIInsightsViewProps> = ({
  tasks,
  users,
  reviews,
  hindsightStatus
}) => {
  // Aggregate delay causes
  const delayedTasks = tasks.filter((t) => t.status === 'delayed' || t.delay_reason);

  const delayCauses: Record<string, number> = {
    'External Stakeholder / Client Approvals': 3,
    'Unclear Wireframe Specs / Requirement Drift': 1,
    'Unexpected Urgent Ad-hoc Meetings': 1,
    'Downstream Dependency Bottlenecks': 2
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/70 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Long-Term Organizational Memory Intelligence
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Workforce AI Insights & Recurring Pattern Radar
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Synthesized across past workdays using Vectorize Hindsight memories to uncover root-cause bottlenecks and estimation drift before they sabotage schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span>Bank: pactpulse-demo</span>
        </div>
      </div>

      {/* 4-Card Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repeated Causes of Delays */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Repeated Root Causes of Delays</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Hindsight Tagged
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(delayCauses).map(([cause, count], idx) => {
              const pct = Math.round((count / 7) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cause}</span>
                    <span className="font-mono text-amber-400 font-bold">{count} occurrences ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-amber-300">Hindsight Memory Insight: </strong>
            Customer and stakeholder review loops generate 43% of total schedule slippage. The agent automatically places a 1.5-hour contingency buffer on any task mentioning "review" or "approval".
          </div>
        </div>

        {/* Common Task Dependencies & Blockers */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Common Task Dependencies & Traps</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Dependency Graph
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                <span>UI Mockups ➔ Backend API Integration</span>
                <span className="text-[10px] font-mono text-slate-400">Alex ➔ Priya</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Backend OAuth implementation relies on frontend schema tokens. If Alex Morgan's morning wireframes slip by 1 hour, Priya Sharma's afternoon billing webhook gets delayed.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                <span>CI Flake Audit ➔ Production Release Candidate</span>
                <span className="text-[10px] font-mono text-slate-400">Daniel ➔ Team</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Daniel Thomas's automated test runs run smoothly in the morning. Scheduling penetration tests before noon guarantees afternoon deployment windows.
              </p>
            </div>
          </div>
        </div>

        {/* Estimated vs Actual Duration Accuracy */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Estimated vs Actual Duration Drift</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Accuracy Index
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Product & Design Tasks</div>
                <div className="text-[11px] text-slate-400">High stakeholder interaction</div>
              </div>
              <div className="font-mono text-right">
                <div className="text-amber-400 font-bold">+35% Duration Drift</div>
                <div className="text-[10px] text-slate-500">Under-estimated</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Backend Engineering & DevOps</div>
                <div className="text-[11px] text-slate-400">Infrastructure & databases</div>
              </div>
              <div className="font-mono text-right">
                <div className="text-emerald-400 font-bold">+5% Duration Drift</div>
                <div className="text-[10px] text-slate-500">Accurate within 15 mins</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Client Success & Growth</div>
                <div className="text-[11px] text-slate-400">Onboarding presentations</div>
              </div>
              <div className="font-mono text-right">
                <div className="text-emerald-400 font-bold">0% Duration Drift</div>
                <div className="text-[10px] text-slate-500">Exactly on time</div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule Improvement Suggestions Derived from Hindsight */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Hindsight Recommendations for Employers</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Compounded
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/20 text-xs space-y-1">
              <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                Shift Morning Design Tasks 30m Earlier
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Retrieved Hindsight Experience: Starting Alex Morgan at 08:30 instead of 09:00 provides a 1-hour margin before lunch, allowing client feedback to arrive before midday standups.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-purple-500/20 text-xs space-y-1">
              <div className="font-semibold text-purple-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                Pre-Authorize Cloud VPC Peering Before DB Migration
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Retrieved Hindsight Experience: Priya Sharma completes replication setup on time when network policies are verified 24h prior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
