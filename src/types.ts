export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employer' | 'employee';
  title: string;
  department: string;
  avatar: string;
  max_hours_per_day: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to_id: string;
  created_by_id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  date: string;
  start_time: string | null;
  end_time: string | null;
  estimated_hours: number;
  actual_hours: number | null;
  deadline: string;
  dependencies: string; // JSON string array
  blockers: string | null;
  delay_reason: string | null;
  hindsight_synced: number;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
  assigned_to_avatar?: string;
  assigned_to_title?: string;
}

export interface ScheduleProposal {
  id: string;
  type: 'daily_optimization' | 'emergency_recovery' | 'tomorrow_schedule';
  title: string;
  summary: string;
  status: 'pending' | 'approved' | 'rejected';
  affected_date: string;
  trigger_event: string | null;
  original_schedule: string;
  proposed_schedule: string;
  rationale: string;
  hindsight_memories: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface HindsightLog {
  id: string;
  timestamp: string;
  operation: 'retain' | 'recall' | 'reflect' | 'status';
  bank_id: string;
  query_or_content: string;
  payload: string | null;
  api_response: string | null;
  status: 'success' | 'error' | 'unconfigured' | 'fallback';
  latency_ms: number;
}

export interface DailyReviewRecord {
  id: string;
  date: string;
  total_tasks: number;
  completed_tasks: number;
  delayed_tasks: number;
  planned_hours: number;
  actual_hours: number;
  hours_variance: number;
  learnings: string; // JSON string array
  hindsight_retained_count: number;
  created_at: string;
}

export interface HindsightStatus {
  isConfigured: boolean;
  isConnected: boolean;
  baseUrl: string;
  bankId: string;
  maskedKey: string;
  errorMessage?: string;
  statusCode?: number;
  lastChecked: string;
}

export interface VerificationStepResult {
  step: number;
  name: string;
  endpoint: string;
  method: string;
  payload?: any;
  status: 'passed' | 'failed';
  statusCode?: number;
  response?: any;
  error?: string;
  latencyMs: number;
}

export interface HindsightVerificationReport {
  timestamp: string;
  bankId: string;
  baseUrl: string;
  apiKeyConfigured: boolean;
  overallSuccess: boolean;
  steps: VerificationStepResult[];
  recalledMemories: Array<{ text: string; type?: string; score?: number; metadata?: any }>;
  summary: string;
}

export interface AIScheduleAnalysis {
  overloadedEmployees: Array<{
    employeeId: string;
    employeeName: string;
    totalHours: number;
    maxHours: number;
    overloadReason: string;
  }>;
  riskTasks: Array<{
    taskId: string;
    taskTitle: string;
    riskScore: number;
    reason: string;
    hindsightInfluence?: string;
  }>;
  overlapConflicts: Array<{
    employeeName: string;
    conflictingTasks: string[];
    timeRange: string;
  }>;
  recommendedAdjustments: Array<{
    taskId: string;
    taskTitle: string;
    currentAssigneeId: string;
    suggestedAssigneeId: string;
    currentStartTime?: string;
    suggestedStartTime?: string;
    currentEndTime?: string;
    suggestedEndTime?: string;
    estimatedHoursAdjustment?: number;
    rationale: string;
    hindsightMemoryUsed?: string;
  }>;
  executiveSummary: string;
}

export interface AIRecoveryProposal {
  interruptionSummary: string;
  affectedEmployeeName: string;
  durationHours: number;
  originalSchedule: Array<{
    taskId: string;
    title: string;
    assigneeName: string;
    startTime: string;
    endTime: string;
  }>;
  proposedSchedule: Array<{
    taskId: string;
    title: string;
    assigneeName: string;
    startTime: string;
    endTime: string;
    action: 'delayed' | 'reassigned' | 'time_shifted' | 'unchanged';
    notes: string;
  }>;
  reassignments: Array<{
    taskTitle: string;
    fromEmployee: string;
    toEmployee: string;
    reason: string;
  }>;
  rationale: string;
  hindsightInfluence: string;
}
