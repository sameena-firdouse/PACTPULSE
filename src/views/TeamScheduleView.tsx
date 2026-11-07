import React, { useState } from 'react';
import { Task, User } from '../types.js';
import {
  Calendar,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Filter,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Link2
} from 'lucide-react';

interface TeamScheduleViewProps {
  tasks: Task[];
  users: User[];
  onOpenTaskModal: (task?: Task) => void;
  onUpdateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
}

export const TeamScheduleView: React.FC<TeamScheduleViewProps> = ({
  tasks,
  users,
  onOpenTaskModal,
  onUpdateTaskStatus
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const employees = users.filter((u) => u.role === 'employee');

  const filteredTasks = tasks.filter((t) => {
    if (t.date !== selectedDate) return false;
    if (selectedEmployeeId !== 'all' && t.assigned_to_id !== selectedEmployeeId) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    return true;
  });

  const priorityColors: Record<Task['priority'], string> = {
    urgent: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    high: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    medium: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    low: 'bg-slate-500/10 text-slate-300 border-slate-500/30'
  };

  const statusColors: Record<Task['status'], string> = {
    completed: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    in_progress: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    delayed: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    pending: 'bg-slate-500/10 text-slate-300 border-slate-500/30'
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Date Switches & Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Date Selector Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedDate(yesterdayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedDate === yesterdayStr
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Yesterday ({yesterdayStr.slice(5)})
          </button>
          <button
            onClick={() => setSelectedDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedDate === todayStr
                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Today ({todayStr.slice(5)})
          </button>
          <button
            onClick={() => setSelectedDate(tomorrowStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedDate === tomorrowStr
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Tomorrow ({tomorrowStr.slice(5)})
          </button>
        </div>

        {/* Filters and New Task CTA */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Employee Filter */}
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Employees ({employees.length})</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assign Task Button */}
          <button
            onClick={() => onOpenTaskModal()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Task List / Timeline Cards */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <Calendar className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No tasks scheduled for {selectedDate}</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Assign New Task" above to add assignments or adjust filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((t) => {
              const assignee = users.find((u) => u.id === t.assigned_to_id);
              const dependencies = t.dependencies ? JSON.parse(t.dependencies) : [];

              return (
                <div
                  key={t.id}
                  onClick={() => onOpenTaskModal(t)}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer space-y-3.5 group shadow-sm hover:shadow-md"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        priorityColors[t.priority]
                      }`}
                    >
                      {t.priority}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                        statusColors[t.status]
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {t.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {t.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Time Window & Duration */}
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.start_time || '09:00'} - {t.end_time || '12:00'}</span>
                    </div>
                    <div>
                      <span>Est: <strong className="text-slate-200">{t.estimated_hours}h</strong></span>
                      {t.actual_hours && (
                        <span className="text-amber-400 ml-1.5 font-bold">
                          (Act: {t.actual_hours}h)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delay Reason or Blockers Banner */}
                  {(t.delay_reason || t.blockers) && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200 space-y-1">
                      <div className="font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        {t.status === 'delayed' ? 'Delay Experience:' : 'Active Blocker:'}
                      </div>
                      <p className="text-[10px] text-amber-300/90 leading-tight">
                        {t.delay_reason || t.blockers}
                      </p>
                    </div>
                  )}

                  {/* Dependencies */}
                  {dependencies.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Link2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">Depends on: {dependencies.join(', ')}</span>
                    </div>
                  )}

                  {/* Assignee Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <img
                        src={assignee?.avatar || t.assigned_to_avatar}
                        alt={assignee?.name || t.assigned_to_name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs font-medium text-slate-300">
                        {assignee?.name || t.assigned_to_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Due: {t.deadline.split(' ')[1] || '17:00'}
                    </span>
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
