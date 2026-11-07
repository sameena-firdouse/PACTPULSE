import {
  User,
  Task,
  ScheduleProposal,
  HindsightLog,
  DailyReviewRecord,
  HindsightStatus,
  AIScheduleAnalysis,
  AIRecoveryProposal,
  HindsightVerificationReport
} from './types.js';

export async function fetchSystemStatus(): Promise<{
  ok: boolean;
  counts: { tasks: number; users: number; pendingProposals: number };
  gemini: { configured: boolean; model: string };
  hindsight: HindsightStatus;
}> {
  const res = await fetch('/api/status');
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users');
  const data = await res.json();
  return data.users || [];
}

export async function fetchTasks(filters?: { date?: string; assigned_to_id?: string; status?: string }): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.assigned_to_id) params.append('assigned_to_id', filters.assigned_to_id);
  if (filters?.status) params.append('status', filters.status);

  const res = await fetch(`/api/tasks?${params.toString()}`);
  const data = await res.json();
  return data.tasks || [];
}

export async function createTask(taskData: Partial<Task>): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create task');
  const data = await res.json();
  return data.task;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update task');
  const data = await res.json();
  return data.task;
}

export async function reportTaskDelay(
  id: string,
  data: { delay_reason: string; actual_hours: number; blockers?: string }
): Promise<{ success: boolean; task: Task; hindsight: any; message: string }> {
  const res = await fetch(`/api/tasks/${id}/report-delay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to report delay');
  return res.json();
}

export async function analyzeSchedule(): Promise<{
  analysis: AIScheduleAnalysis;
  recalledMemories: Array<{ text: string }>;
  hindsightStatus: string;
  hindsightError?: string;
  proposalId: string | null;
}> {
  const res = await fetch('/api/ai/analyze-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to analyze schedule');
  return res.json();
}

export async function recoverSchedule(payload: {
  employee_id: string;
  reason: string;
  duration_hours: number;
  date?: string;
}): Promise<{
  proposalId: string;
  recovery: AIRecoveryProposal;
  recalledMemories: Array<{ text: string }>;
  hindsightStatus: string;
  hindsightError?: string;
}> {
  const res = await fetch('/api/ai/recover-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to recover schedule');
  return res.json();
}

export async function fetchProposals(): Promise<ScheduleProposal[]> {
  const res = await fetch('/api/proposals');
  const data = await res.json();
  return data.proposals || [];
}

export async function approveProposal(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/proposals/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to approve proposal');
  return res.json();
}

export async function rejectProposal(id: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/proposals/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to reject proposal');
  return res.json();
}

export async function runDailyReview(date?: string): Promise<{
  success: boolean;
  review: {
    summary: string;
    hoursVariance: number;
    plannedHours: number;
    actualHours: number;
    keyLearnings: string[];
    hindsightExperiencesToRetain: any[];
  };
  retainedCount: number;
}> {
  const res = await fetch('/api/ai/daily-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date })
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to run daily review');
  return res.json();
}

export async function generateTomorrowSchedule(): Promise<{
  success: boolean;
  proposalId: string;
  tomorrowPlan: {
    proposalTitle: string;
    summary: string;
    improvementsApplied: string[];
    hindsightCitations: string[];
    optimizedTasks: any[];
  };
  recalledMemories: any[];
  hindsightStatus: string;
}> {
  const res = await fetch('/api/ai/generate-tomorrow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate tomorrow schedule');
  return res.json();
}

export async function fetchHindsightLogs(): Promise<HindsightLog[]> {
  const res = await fetch('/api/hindsight/logs');
  const data = await res.json();
  return data.logs || [];
}

export async function fetchHindsightStatus(): Promise<HindsightStatus> {
  const res = await fetch('/api/hindsight/status');
  return res.json();
}

export async function updateHindsightConfig(config: { apiKey?: string; baseUrl?: string; bankId?: string }): Promise<HindsightStatus> {
  const res = await fetch('/api/hindsight/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return res.json();
}

export async function testHindsightRetain(content: string, metadata?: any): Promise<any> {
  const res = await fetch('/api/hindsight/retain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, metadata })
  });
  return res.json();
}

export async function testHindsightRecall(query: string): Promise<any> {
  const res = await fetch('/api/hindsight/recall', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  return res.json();
}

export async function fetchDailyReviews(): Promise<DailyReviewRecord[]> {
  const res = await fetch('/api/reviews');
  const data = await res.json();
  return data.reviews || [];
}

export async function resetDemoData(): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/demo/reset', { method: 'POST' });
  return res.json();
}

export async function createOrUseBank(bankId = 'pactpulse-demo'): Promise<{
  success: boolean;
  bankId: string;
  statusCode: number;
  rawResponse?: any;
  error?: string;
  latencyMs: number;
}> {
  const res = await fetch('/api/hindsight/bank/create-or-use', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankId })
  });
  return res.json();
}

export async function runHindsightVerification(bankId = 'pactpulse-demo'): Promise<HindsightVerificationReport> {
  const res = await fetch('/api/hindsight/verify-integration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bankId })
  });
  return res.json();
}
