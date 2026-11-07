import React from 'react';
import { User, HindsightStatus } from '../types.js';
import {
  Sparkles,
  Database,
  BrainCircuit,
  RotateCcw,
  PlayCircle,
  Settings2,
  CheckCircle2,
  AlertTriangle,
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  users: User[];
  onSelectUser: (user: User) => void;
  hindsightStatus: HindsightStatus | null;
  onOpenHindsightSettings: () => void;
  onStartDemoTour: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  users,
  onSelectUser,
  hindsightStatus,
  onOpenHindsightSettings,
  onStartDemoTour,
  onResetDemo,
  isResetting
}) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-white text-lg font-mono">
              PACT<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">PULSE</span> AI
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Hindsight v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            AI Workforce Scheduling & Recovery Agent
          </p>
        </div>
      </div>

      {/* Role / Demo Quick-Switch Bar */}
      <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-xl p-1 max-w-xl">
        <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          Demo Role:
        </span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {users.map((u) => {
            const isSelected = currentUser?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => onSelectUser(u)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? u.role === 'employer'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title={`${u.name} (${u.role === 'employer' ? 'Employer/Manager' : 'Employee'})`}
              >
                <img
                  src={u.avatar}
                  alt={u.name}
                  className="w-4 h-4 rounded-full object-cover border border-white/20"
                />
                <span className="whitespace-nowrap">{u.name.split(' ')[0]}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded ${
                  u.role === 'employer' ? 'bg-purple-900/80 text-purple-200' : 'bg-slate-800 text-slate-300'
                }`}>
                  {u.role === 'employer' ? 'Mgr' : 'Staff'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Indicators & Action Tools */}
      <div className="flex items-center gap-3">
        {/* 60s Demo Tour CTA */}
        <button
          onClick={onStartDemoTour}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlayCircle className="w-4 h-4" />
          <span className="hidden md:inline">60s Hackathon Walkthrough</span>
          <span className="md:hidden">Tour</span>
        </button>

        {/* Hindsight Status Pill */}
        <button
          onClick={onOpenHindsightSettings}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            hindsightStatus?.isConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
          title="Vectorize Hindsight Memory Bank Status (Click to configure)"
        >
          {hindsightStatus?.isConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden lg:inline">Hindsight:</span>
          <span className="font-semibold">
            {hindsightStatus?.isConnected ? 'Connected' : 'Key Ready'}
          </span>
          <Settings2 className="w-3 h-3 text-slate-400 ml-0.5" />
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetDemo}
          disabled={isResetting}
          className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all text-xs"
          title="Reset database to initial pristine demo state"
        >
          <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-rose-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
