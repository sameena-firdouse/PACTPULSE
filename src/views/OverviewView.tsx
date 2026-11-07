import React from 'react';
import { Task, User, ScheduleProposal, HindsightStatus } from '../types.js';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';

interface OverviewViewProps {
  tasks: Task[];
  users: User[];
  proposals: ScheduleProposal[];
  hindsightStatus: HindsightStatus | null;
  onNavigate: (tab: any) => void;
  onApproveProposal: (id: string) => Promise<void>;
  onRejectProposal: (id: string) => Promise<void>;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  tasks,
  users,
  proposals,
  hindsightStatus,
  onNavigate,
  onApproveProposal,
  onRejectProposal
}) => {
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === today);

  const employees = users.filter((u) => u.role === 'employee');
  const completedToday = todayTasks.filter((t) => t.status === 'completed').length;
  const pendingToday = todayTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const delayedToday = todayTasks.filter((t) => t.status === 'delayed').length;

  // Calculate employee workloads
  const employeeWorkload: Array<{
    user: User;
    hours: number;
    maxHours: number;
    isOverloaded: boolean;
    taskCount: number;
  }> = employees.map((emp) => {
    const empTasks = todayTasks.filter((t) => t.assigned_to_id === emp.id);
    const hours = empTasks.reduce((sum, t) => sum + (t.actual_hours || t.estimated_hours || 0), 0);
    return {
      user: emp,
      hours: Number(hours.toFixed(1)),
      maxHours: emp.max_hours_per_day,
      isOverloaded: hours > emp.max_hours_per_day,
      taskCount: empTasks.length
    };
  });

  const overloadedCount = employeeWorkload.filter((w) => w.isOverloaded).length;
  const pendingProposals = proposals.filter((p) => p.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Workforce Intelligence Dashboard
            </span>
            <span className="text-xs text-slate-400 font-mono">Date: {today}</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Workforce Scheduling & Recovery Center
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            PactPulse AI analyzes previous workday bottlenecks and uses Vectorize Hindsight long-term memory to protect future schedules against recurring delays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('ai-agent')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run AI Schedule Check</span>
          </button>
          <button
            onClick={() => onNavigate('schedule-recovery')}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Emergency Recovery</span>
          </button>
          <button
            onClick={() => onNavigate('daily-review')}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Daily Review</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Employees */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Staff</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{employees.length}</div>
          <div className="text-[11px] text-slate-500">4 active employees</div>
        </div>

        {/* Tasks Assigned Today */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Today's Tasks</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{todayTasks.length}</div>
          <div className="text-[11px] text-slate-500">Scheduled for today</div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{completedToday}</div>
          <div className="text-[11px] text-emerald-500/80 font-medium">
            {todayTasks.length ? Math.round((completedToday / todayTasks.length) * 100) : 0}% completion
          </div>
        </div>

        {/* Pending / In Progress */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Pending / In-Flight</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">{pendingToday}</div>
          <div className="text-[11px] text-slate-500">Currently active</div>
        </div>

        {/* Delayed Tasks */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Delayed Tasks</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{delayedToday}</div>
          <div className="text-[11px] text-amber-500/80">Retained to Hindsight</div>
        </div>

        {/* Overloaded Staff */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Overloaded Staff</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{overloadedCount}</div>
          <div className="text-[11px] text-rose-500/80">
            {overloadedCount > 0 ? 'Exceeding 8h limit' : 'Workload balanced'}
          </div>
        </div>
      </div>

      {/* Pending Schedule Proposals Requiring Approval */}
      {pendingProposals.length > 0 && (
        <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">
                Pending AI Schedule Proposals ({pendingProposals.length} Requiring Employer Approval)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Human-in-the-Loop Safe
            </span>
          </div>

          <div className="space-y-3">
            {pendingProposals.map((prop) => (
              <div
                key={prop.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="text-xs font-bold text-purple-300">{prop.title}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{prop.summary}</p>
                  <div className="text-[11px] text-slate-400 italic">
                    Rationale: {prop.rationale}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onRejectProposal(prop.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400 text-xs font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => onApproveProposal(prop.id)}
                    className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Apply</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Workload Distribution & High-Risk Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Workload Comparison */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Today's Employee Workload Balance</h3>
              <p className="text-xs text-slate-400">Assigned hours compared against standard 8.0h threshold</p>
            </div>
            <button
              onClick={() => onNavigate('team-schedule')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              View Schedule <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {employeeWorkload.map((w) => {
              const pct = Math.min(100, Math.round((w.hours / w.maxHours) * 100));
              return (
                <div key={w.user.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={w.user.avatar}
                        alt={w.user.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-200">{w.user.name}</span>
                      <span className="text-[11px] text-slate-500">({w.taskCount} tasks)</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`font-bold ${w.isOverloaded ? 'text-rose-400' : 'text-slate-300'}`}>
                        {w.hours}h
                      </span>
                      <span className="text-slate-600">/ {w.maxHours}h</span>
                      {w.isOverloaded && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-sans font-bold">
                          OVERLOAD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        w.isOverloaded
                          ? 'bg-rose-500'
                          : pct > 80
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hindsight Memory-Informed Insights */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Hindsight Long-Term Memory Radar</h3>
                <p className="text-xs text-slate-400">Previous workday experiences influencing current scheduling</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('hindsight-memory')}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
            >
              Explore Bank <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300">
                  External Client Approval Bottleneck
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  +2.0h Drift
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Recalled from yesterday: Alex Morgan's website wireframe review task incurred a 2-hour delay due to pending stakeholder review. The agent flags website review tasks for automatic 1.5h protection buffers.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-300">
                  VPC Cloud Replication Predictability
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  0% Drift
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Priya Sharma's database replication tasks completed exactly on time when VPC peering was pre-cleared. The AI maintains standard time estimates for backend replication.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-indigo-300">
                  Cascading Handoff Delays
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Risk Alert
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                When design tokens are delayed past 13:00, dependent QA and frontend implementation tasks experience downstream scheduling conflicts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
