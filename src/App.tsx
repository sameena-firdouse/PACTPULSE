import React, { useState, useEffect } from 'react';
import { User, Task, ScheduleProposal, DailyReviewRecord, HindsightStatus } from './types.js';
import {
  fetchUsers,
  fetchTasks,
  fetchProposals,
  fetchDailyReviews,
  fetchSystemStatus,
  createTask,
  updateTask,
  reportTaskDelay,
  approveProposal,
  rejectProposal,
  resetDemoData
} from './api.js';

import { Header } from './components/Header.js';
import { Sidebar, TabKey } from './components/Sidebar.js';
import { TaskModal } from './components/TaskModal.js';
import { DelayModal } from './components/DelayModal.js';
import { HindsightSettingsModal } from './components/HindsightSettingsModal.js';
import { HackathonDemoModal } from './components/HackathonDemoModal.js';

import { OverviewView } from './views/OverviewView.js';
import { TeamScheduleView } from './views/TeamScheduleView.js';
import { MyScheduleView } from './views/MyScheduleView.js';
import { AIAgentView } from './views/AIAgentView.js';
import { ScheduleRecoveryView } from './views/ScheduleRecoveryView.js';
import { HindsightMemoryView } from './views/HindsightMemoryView.js';
import { DailyReviewView } from './views/DailyReviewView.js';
import { AIInsightsView } from './views/AIInsightsView.js';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proposals, setProposals] = useState<ScheduleProposal[]>([]);
  const [reviews, setReviews] = useState<DailyReviewRecord[]>([]);
  const [hindsightStatus, setHindsightStatus] = useState<HindsightStatus | null>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [selectedDelayTask, setSelectedDelayTask] = useState<Task | null>(null);
  const [isHindsightModalOpen, setIsHindsightModalOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [usersData, tasksData, proposalsData, reviewsData, statusData] = await Promise.all([
        fetchUsers(),
        fetchTasks(),
        fetchProposals(),
        fetchDailyReviews(),
        fetchSystemStatus()
      ]);

      setUsers(usersData);
      if (!currentUser && usersData.length > 0) {
        // Default to Sarah Johnson (Employer) or Alex Morgan
        setCurrentUser(usersData[0]);
      }
      setTasks(tasksData);
      setProposals(proposalsData);
      setReviews(reviewsData);
      setHindsightStatus(statusData.hindsight);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    // If switching to an employee, guide them naturally or keep tab
    if (user.role === 'employee' && activeTab === 'overview') {
      setActiveTab('my-schedule');
    } else if (user.role === 'employer' && activeTab === 'my-schedule') {
      setActiveTab('overview');
    }
  };

  const handleCreateOrUpdateTask = async (taskData: Partial<Task>) => {
    if (taskData.id) {
      await updateTask(taskData.id, taskData);
    } else {
      await createTask(taskData);
    }
    await loadData();
  };

  const handleOpenDelayModal = (task: Task) => {
    setSelectedDelayTask(task);
    setIsDelayModalOpen(true);
  };

  const handleSubmitDelay = async (data: { delay_reason: string; actual_hours: number; blockers?: string }) => {
    if (!selectedDelayTask) throw new Error('No task selected');
    const res = await reportTaskDelay(selectedDelayTask.id, data);
    await loadData();
    return res;
  };

  const handleApproveProposal = async (id: string) => {
    await approveProposal(id);
    await loadData();
  };

  const handleRejectProposal = async (id: string) => {
    await rejectProposal(id);
    await loadData();
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset database to initial pristine hackathon demo state?')) return;
    setIsResetting(true);
    try {
      await resetDemoData();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleRequestReschedule = (task: Task) => {
    setActiveTab('schedule-recovery');
  };

  const pendingProposalsCount = proposals.filter((p) => p.status === 'pending').length;
  const delayedTasksCount = tasks.filter((t) => t.status === 'delayed' && t.assigned_to_id === currentUser?.id).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 rounded-full bg-indigo-500 animate-ping" />
        </div>
        <div className="font-mono text-sm tracking-widest text-indigo-300 uppercase">
          Initializing PactPulse AI Engine...
        </div>
        <p className="text-xs text-slate-500">Connecting SQLite & Vectorize Hindsight memory bank</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Global Header */}
      <Header
        currentUser={currentUser}
        users={users}
        onSelectUser={handleSelectUser}
        hindsightStatus={hindsightStatus}
        onOpenHindsightSettings={() => setIsHindsightModalOpen(true)}
        onStartDemoTour={() => setIsDemoTourOpen(true)}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Main Workspace with Sidebar & View Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          pendingProposalsCount={pendingProposalsCount}
          delayedTasksCount={delayedTasksCount}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {activeTab === 'overview' && (
            <OverviewView
              tasks={tasks}
              users={users}
              proposals={proposals}
              hindsightStatus={hindsightStatus}
              onNavigate={setActiveTab}
              onApproveProposal={handleApproveProposal}
              onRejectProposal={handleRejectProposal}
            />
          )}

          {activeTab === 'team-schedule' && (
            <TeamScheduleView
              tasks={tasks}
              users={users}
              onOpenTaskModal={(task) => {
                setEditingTask(task || null);
                setIsTaskModalOpen(true);
              }}
              onUpdateTaskStatus={async (id, status) => {
                await updateTask(id, { status });
                await loadData();
              }}
            />
          )}

          {activeTab === 'my-schedule' && (
            <MyScheduleView
              currentUser={currentUser}
              tasks={tasks}
              onOpenDelayModal={handleOpenDelayModal}
              onUpdateTask={async (id, updates) => {
                await updateTask(id, updates);
                await loadData();
              }}
              onRequestReschedule={handleRequestReschedule}
            />
          )}

          {activeTab === 'ai-agent' && (
            <AIAgentView
              tasks={tasks}
              users={users}
              proposals={proposals}
              onRefreshData={loadData}
            />
          )}

          {activeTab === 'schedule-recovery' && (
            <ScheduleRecoveryView
              tasks={tasks}
              users={users}
              proposals={proposals}
              onRefreshData={loadData}
            />
          )}

          {activeTab === 'hindsight-memory' && (
            <HindsightMemoryView
              status={hindsightStatus}
              onOpenSettings={() => setIsHindsightModalOpen(true)}
            />
          )}

          {activeTab === 'daily-review' && (
            <DailyReviewView
              tasks={tasks}
              users={users}
              proposals={proposals}
              onRefreshData={loadData}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'ai-insights' && (
            <AIInsightsView
              tasks={tasks}
              users={users}
              reviews={reviews}
              hindsightStatus={hindsightStatus}
            />
          )}
        </main>
      </div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        users={users}
        initialTask={editingTask}
      />

      {/* Delay & Blocker Report Modal (triggers real Hindsight retain) */}
      <DelayModal
        isOpen={isDelayModalOpen}
        onClose={() => {
          setIsDelayModalOpen(false);
          setSelectedDelayTask(null);
        }}
        task={selectedDelayTask}
        onSubmitDelay={handleSubmitDelay}
      />

      {/* Vectorize Hindsight Settings Modal */}
      <HindsightSettingsModal
        isOpen={isHindsightModalOpen}
        onClose={() => setIsHindsightModalOpen(false)}
        status={hindsightStatus}
        onRefreshStatus={loadData}
      />

      {/* 60-Second Hackathon Walkthrough Tour */}
      <HackathonDemoModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        users={users}
        onRefreshData={loadData}
      />
    </div>
  );
}
