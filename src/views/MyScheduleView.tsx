import React, { useState } from 'react';
import { Task, User } from '../types.js';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  AlertCircle,
  HelpCircle,
  Link2,
  ArrowRight,
  Sparkles,
  Database
} from 'lucide-react';

interface MyScheduleViewProps {
  currentUser: User | null;
  tasks: Task[];
  onOpenDelayModal: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onRequestReschedule: (task: Task) => void;
}

export const MyScheduleView: React.FC<MyScheduleViewProps> = ({
  currentUser,
  tasks,
  onOpenDelayModal,
  onUpdateTask,
  onRequestReschedule
}) => {
  const today = new Date().toISOString().split('T')[0];

  // If employer is viewing, show either the first employee or all, but let them toggle
  const effectiveUserId = currentUser?.role === 'employer' ? 'emp-alex' : (currentUser?.id || 'emp-alex');
  const myTasks = tasks.filter((t) => t.assigned_to_id === effectiveUserId && t.date === today);

  const completedCount = myTasks.filter((t) => t.status === 'completed').length;
  const totalHoursPlanned = myTasks.reduce((sum, t) => sum + t.estimated_hours, 0);

  const handleMarkCompleted = async (task: Task) => {
    const hours = prompt(`Enter actual hours spent on "${task.title}":`, String(task.estimated_hours));
    if (hours === null) return;
    const numHours = parseFloat(hours) || task.estimated_hours;

    await onUpdateTask(task.id, {
      status: 'completed',
      actual_hours: numHours
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Profile & Daily Status */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{currentUser?.name}'s Daily Schedule</h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Personal View
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentUser?.title} • {currentUser?.department}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs">
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-bold">Today's Date</div>
            <div className="font-mono text-white font-semibold">{today}</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-bold">Planned Hours</div>
            <div className="font-mono text-indigo-400 font-semibold">{totalHoursPlanned}h / 8.0h</div>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-bold">Progress</div>
            <div className="font-mono text-emerald-400 font-semibold">
              {completedCount} / {myTasks.length} Completed
            </div>
          </div>
        </div>
      </div>

      {/* Task Agenda List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Today's Assigned Agenda ({myTasks.length} Tasks)
          </h3>
          <span className="text-xs text-slate-400">
            Report delays immediately to trigger Vectorize Hindsight learning
          </span>
        </div>

        {myTasks.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No tasks assigned for today</div>
            <p className="text-xs text-slate-500">You are all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTasks.map((t) => {
              const dependencies = t.dependencies ? JSON.parse(t.dependencies) : [];
              const isCompleted = t.status === 'completed';
              const isDelayed = t.status === 'delayed';

              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    isCompleted
                      ? 'bg-slate-900/60 border-slate-800/80 opacity-80'
                      : isDelayed
                      ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-900 border-slate-800 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                        {t.start_time || '09:00'} - {t.end_time || '12:00'}
                      </div>
                      <h4 className={`text-base font-bold ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {t.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        t.priority === 'urgent'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          : t.priority === 'high'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-slate-500/10 text-slate-300 border-slate-500/30'
                      }`}>
                        {t.priority}
                      </span>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : isDelayed
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {t.description || 'No description provided.'}
                  </p>

                  {/* Metadata Bar */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono pt-1">
                    <div>
                      Est: <strong className="text-slate-200">{t.estimated_hours}h</strong>
                    </div>
                    {t.actual_hours && (
                      <div>
                        Actual Spent: <strong className="text-amber-300">{t.actual_hours}h</strong>
                      </div>
                    )}
                    <div>
                      Deadline: <strong className="text-slate-200">{t.deadline}</strong>
                    </div>
                    {dependencies.length > 0 && (
                      <div className="flex items-center gap-1 font-sans text-[11px] text-slate-400">
                        <Link2 className="w-3 h-3 text-slate-500" />
                        <span>Dependencies: {dependencies.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Delay Reason Card */}
                  {t.delay_reason && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-amber-400" />
                        Reported Delay (Synced to Hindsight Memory Bank):
                      </div>
                      <p className="text-[11px] text-amber-300/90 leading-tight">
                        {t.delay_reason}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-500">
                      Need schedule changes? Click Report Delay or Request Rescheduling.
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCompleted && (
                        <>
                          <button
                            onClick={() => onOpenDelayModal(t)}
                            className="px-3 py-1.5 rounded-xl border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 text-xs font-semibold transition-all flex items-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Report Delay / Blocker</span>
                          </button>

                          <button
                            onClick={() => onRequestReschedule(t)}
                            className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all"
                          >
                            Request Reschedule
                          </button>

                          <button
                            onClick={() => handleMarkCompleted(t)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Task Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
