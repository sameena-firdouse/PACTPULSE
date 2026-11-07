import React from 'react';
import { User } from '../types.js';
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  Sparkles,
  LifeBuoy,
  Database,
  BarChart3,
  Lightbulb,
  ShieldAlert,
  ChevronRight,
  Clock
} from 'lucide-react';

export type TabKey =
  | 'overview'
  | 'team-schedule'
  | 'my-schedule'
  | 'ai-agent'
  | 'schedule-recovery'
  | 'hindsight-memory'
  | 'daily-review'
  | 'ai-insights';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  currentUser: User | null;
  pendingProposalsCount: number;
  delayedTasksCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  pendingProposalsCount,
  delayedTasksCount
}) => {
  const isEmployer = currentUser?.role === 'employer';

  const navItems: Array<{
    key: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
    description: string;
    employerOnly?: boolean;
  }> = [
    {
      key: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Workforce pulse & metrics'
    },
    {
      key: 'team-schedule',
      label: 'Team Schedule',
      icon: CalendarDays,
      description: 'Full team timeline & gantt'
    },
    {
      key: 'my-schedule',
      label: 'My Schedule',
      icon: UserCheck,
      badge: delayedTasksCount > 0 ? `${delayedTasksCount} delayed` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      description: 'Personal daily agenda & reporting'
    },
    {
      key: 'ai-agent',
      label: 'AI Scheduling Agent',
      icon: Sparkles,
      badge: pendingProposalsCount > 0 ? pendingProposalsCount : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      description: 'Gemini reasoning & workload balancer'
    },
    {
      key: 'schedule-recovery',
      label: 'Schedule Recovery',
      icon: LifeBuoy,
      description: 'Emergency 2h client interruption'
    },
    {
      key: 'hindsight-memory',
      label: 'Hindsight Memory',
      icon: Database,
      badge: 'Vectorize',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-mono',
      description: 'Retain & recall long-term bank'
    },
    {
      key: 'daily-review',
      label: 'Daily Review',
      icon: BarChart3,
      description: 'Learn today & build tomorrow'
    },
    {
      key: 'ai-insights',
      label: 'AI Insights',
      icon: Lightbulb,
      description: 'Delay root causes & patterns'
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between shrink-0 select-none">
      <div className="p-4 space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 px-3 pb-1 tracking-wider">
            Workforce Engine
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-purple-600/90 text-white font-medium shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight">{item.label}</div>
                    <div
                      className={`text-[10px] truncate leading-tight ${
                        isActive ? 'text-indigo-100/80' : 'text-slate-500'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0 ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hackathon Theme Banner */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-950 border border-indigo-500/20 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-300 font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Hackathon Theme
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed italic">
            "AI Agents That Learn Using Hindsight"
          </p>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-indigo-400" />
            Remembers previous delays to buffer future schedules.
          </div>
        </div>
      </div>

      {/* Active User Footer Card */}
      {currentUser && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-indigo-500/30"
              />
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser.title}</div>
              </div>
            </div>
            <span
              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                currentUser.role === 'employer'
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};
