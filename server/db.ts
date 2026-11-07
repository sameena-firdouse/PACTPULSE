import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';

// Ensure data folder exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pactpulse.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high performance & reliability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK(role IN ('employer', 'employee')),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    avatar TEXT NOT NULL,
    max_hours_per_day REAL DEFAULT 8.0,
    created_at TEXT NOT NULL,
    business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main',
    password_hash TEXT,
    salt TEXT,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TEXT
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    assigned_to_id TEXT NOT NULL,
    created_by_id TEXT NOT NULL,
    priority TEXT NOT NULL CHECK(priority IN ('urgent', 'high', 'medium', 'low')),
    status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'delayed')),
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    estimated_hours REAL NOT NULL,
    actual_hours REAL,
    deadline TEXT NOT NULL,
    dependencies TEXT, -- JSON array of task IDs or descriptions
    blockers TEXT,
    delay_reason TEXT,
    hindsight_synced INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main',
    FOREIGN KEY(assigned_to_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS schedule_proposals (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'daily_optimization' | 'emergency_recovery' | 'tomorrow_schedule'
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
    affected_date TEXT NOT NULL,
    trigger_event TEXT,
    original_schedule TEXT NOT NULL, -- JSON
    proposed_schedule TEXT NOT NULL, -- JSON
    rationale TEXT NOT NULL,
    hindsight_memories TEXT, -- JSON array of memories used
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    resolved_by TEXT,
    business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main'
  );

  CREATE TABLE IF NOT EXISTS hindsight_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('retain', 'recall', 'reflect', 'status')),
    bank_id TEXT NOT NULL,
    query_or_content TEXT NOT NULL,
    payload TEXT, -- JSON
    api_response TEXT, -- JSON or error string
    status TEXT NOT NULL CHECK(status IN ('success', 'error', 'unconfigured', 'fallback')),
    latency_ms INTEGER DEFAULT 0,
    business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main',
    employee_id TEXT
  );

  CREATE TABLE IF NOT EXISTS daily_reviews (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    total_tasks INTEGER NOT NULL,
    completed_tasks INTEGER NOT NULL,
    delayed_tasks INTEGER NOT NULL,
    planned_hours REAL NOT NULL,
    actual_hours REAL NOT NULL,
    hours_variance REAL NOT NULL,
    learnings TEXT NOT NULL, -- JSON array of strings
    hindsight_retained_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main'
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    business_id TEXT NOT NULL,
    role TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS security_audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT,
    business_id TEXT,
    role TEXT,
    ip TEXT,
    endpoint TEXT,
    status TEXT NOT NULL,
    details TEXT
  );
`);

// Run dynamic schema migrations for existing SQLite databases
function runMigrations() {
  const tableCols = (table: string): string[] => {
    try {
      const rows = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      return rows.map(r => r.name);
    } catch {
      return [];
    }
  };

  const userCols = tableCols('users');
  if (!userCols.includes('business_id')) db.exec("ALTER TABLE users ADD COLUMN business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main'");
  if (!userCols.includes('password_hash')) db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
  if (!userCols.includes('salt')) db.exec("ALTER TABLE users ADD COLUMN salt TEXT");
  if (!userCols.includes('failed_attempts')) db.exec("ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0");
  if (!userCols.includes('locked_until')) db.exec("ALTER TABLE users ADD COLUMN locked_until TEXT");

  const taskCols = tableCols('tasks');
  if (!taskCols.includes('business_id')) db.exec("ALTER TABLE tasks ADD COLUMN business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main'");

  const proposalCols = tableCols('schedule_proposals');
  if (!proposalCols.includes('business_id')) db.exec("ALTER TABLE schedule_proposals ADD COLUMN business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main'");

  const reviewCols = tableCols('daily_reviews');
  if (!reviewCols.includes('business_id')) db.exec("ALTER TABLE daily_reviews ADD COLUMN business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main'");

  const logCols = tableCols('hindsight_logs');
  if (!logCols.includes('business_id')) db.exec("ALTER TABLE hindsight_logs ADD COLUMN business_id TEXT NOT NULL DEFAULT 'biz-pactpulse-main'");
  if (!logCols.includes('employee_id')) db.exec("ALTER TABLE hindsight_logs ADD COLUMN employee_id TEXT");
}
runMigrations();

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employer' | 'employee';
  title: string;
  department: string;
  avatar: string;
  max_hours_per_day: number;
  created_at: string;
  business_id?: string;
  password_hash?: string;
  salt?: string;
  failed_attempts?: number;
  locked_until?: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to_id: string;
  created_by_id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  date: string; // YYYY-MM-DD
  start_time: string | null; // e.g. "09:00"
  end_time: string | null; // e.g. "12:00"
  estimated_hours: number;
  actual_hours: number | null;
  deadline: string;
  dependencies: string; // JSON array
  blockers: string | null;
  delay_reason: string | null;
  hindsight_synced: number;
  created_at: string;
  updated_at: string;
  assigned_to_name?: string;
  assigned_to_avatar?: string;
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

export interface DailyReview {
  id: string;
  date: string;
  total_tasks: number;
  completed_tasks: number;
  delayed_tasks: number;
  planned_hours: number;
  actual_hours: number;
  hours_variance: number;
  learnings: string;
  hindsight_retained_count: number;
  created_at: string;
}

// Seed initial demo data if empty
export function seedInitialData() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) return;

  console.log('[DB] Seeding PactPulse initial demo data...');

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, title, department, avatar, max_hours_per_day, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users: User[] = [
    {
      id: 'emp-sarah',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@pactpulse.demo',
      role: 'employer',
      title: 'VP of Operations & Workforce Lead',
      department: 'Executive Operations',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      max_hours_per_day: 8.0,
      created_at: new Date().toISOString()
    },
    {
      id: 'emp-alex',
      name: 'Alex Morgan',
      email: 'alex.morgan@pactpulse.demo',
      role: 'employee',
      title: 'Senior Product Designer',
      department: 'Product & Design',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      max_hours_per_day: 8.0,
      created_at: new Date().toISOString()
    },
    {
      id: 'emp-priya',
      name: 'Priya Sharma',
      email: 'priya.sharma@pactpulse.demo',
      role: 'employee',
      title: 'Lead Cloud & Backend Engineer',
      department: 'Engineering',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      max_hours_per_day: 8.0,
      created_at: new Date().toISOString()
    },
    {
      id: 'emp-daniel',
      name: 'Daniel Thomas',
      email: 'daniel.thomas@pactpulse.demo',
      role: 'employee',
      title: 'QA & Site Reliability Engineer',
      department: 'Engineering & QA',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      max_hours_per_day: 8.0,
      created_at: new Date().toISOString()
    },
    {
      id: 'emp-emma',
      name: 'Emma Wilson',
      email: 'emma.wilson@pactpulse.demo',
      role: 'employee',
      title: 'Client Solutions & Growth Manager',
      department: 'Client Success',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      max_hours_per_day: 8.0,
      created_at: new Date().toISOString()
    }
  ];

  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, u.role, u.title, u.department, u.avatar, u.max_hours_per_day, u.created_at);
  }

  // Insert Preloaded Tasks
  const insertTask = db.prepare(`
    INSERT INTO tasks (
      id, title, description, assigned_to_id, created_by_id, priority, status,
      date, start_time, end_time, estimated_hours, actual_hours, deadline,
      dependencies, blockers, delay_reason, hindsight_synced, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialTasks = [
    // Yesterday tasks (Historical baseline for Hindsight demonstration)
    {
      id: 'task-hist-01',
      title: 'Website Redesign Phase 1 & Client Wireframe Signoff',
      description: 'Initial homepage and navigation wireframes review with external client executive stakeholder.',
      assigned_to_id: 'emp-alex',
      created_by_id: 'emp-sarah',
      priority: 'high',
      status: 'delayed',
      date: yesterday,
      start_time: '09:00',
      end_time: '14:00',
      estimated_hours: 3.0,
      actual_hours: 5.0,
      deadline: `${yesterday} 17:00`,
      dependencies: JSON.stringify(['Design System Tokens']),
      blockers: 'External customer approval delayed by 2 hours due to pending CEO review on branding colors.',
      delay_reason: 'Customer approval took 5 hours instead of planned 3 hours due to late stakeholder feedback loop.',
      hindsight_synced: 1,
      created_at: `${yesterday}T08:00:00Z`,
      updated_at: `${yesterday}T16:30:00Z`
    },
    {
      id: 'task-hist-02',
      title: 'Database Partitioning & Read Replica Setup',
      description: 'Configure high-throughput PostgreSQL replication clusters for analytics service.',
      assigned_to_id: 'emp-priya',
      created_by_id: 'emp-sarah',
      priority: 'urgent',
      status: 'completed',
      date: yesterday,
      start_time: '10:00',
      end_time: '14:30',
      estimated_hours: 4.5,
      actual_hours: 4.5,
      deadline: `${yesterday} 18:00`,
      dependencies: JSON.stringify(['Cloud VPC peering']),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 1,
      created_at: `${yesterday}T08:00:00Z`,
      updated_at: `${yesterday}T15:00:00Z`
    },
    {
      id: 'task-hist-03',
      title: 'Cross-browser Regression Testing Matrix',
      description: 'Run automated end-to-end Cypress test suite across Safari, Chrome, and Firefox mobile.',
      assigned_to_id: 'emp-daniel',
      created_by_id: 'emp-sarah',
      priority: 'medium',
      status: 'completed',
      date: yesterday,
      start_time: '13:00',
      end_time: '16:00',
      estimated_hours: 3.0,
      actual_hours: 3.0,
      deadline: `${yesterday} 17:00`,
      dependencies: JSON.stringify([]),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 1,
      created_at: `${yesterday}T08:00:00Z`,
      updated_at: `${yesterday}T16:15:00Z`
    },

    // Today tasks (Active workforce schedule)
    {
      id: 'task-today-01',
      title: 'Client Portal Dashboard Component Library',
      description: 'Build responsive interactive charts and data table components for the client portal.',
      assigned_to_id: 'emp-alex',
      created_by_id: 'emp-sarah',
      priority: 'urgent',
      status: 'in_progress',
      date: today,
      start_time: '09:00',
      end_time: '12:30',
      estimated_hours: 3.5,
      actual_hours: 1.5,
      deadline: `${today} 16:00`,
      dependencies: JSON.stringify(['Figma Design Specs']),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T08:00:00Z`,
      updated_at: `${today}T10:00:00Z`
    },
    {
      id: 'task-today-02',
      title: 'Mobile App Navigation Prototype & User Test',
      description: 'Prepare interactive Figma prototype and conduct usability walkthrough with 2 pilot users.',
      assigned_to_id: 'emp-alex',
      created_by_id: 'emp-sarah',
      priority: 'high',
      status: 'pending',
      date: today,
      start_time: '13:30',
      end_time: '17:30',
      estimated_hours: 4.0,
      actual_hours: null,
      deadline: `${today} 18:00`,
      dependencies: JSON.stringify(['Client Portal Dashboard Component Library']),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T08:00:00Z`,
      updated_at: `${today}T08:00:00Z`
    },
    {
      id: 'task-today-03',
      title: 'OAuth 2.0 Token Refresh Pipeline Implementation',
      description: 'Implement secure background refresh token rotation and session revocation endpoint.',
      assigned_to_id: 'emp-priya',
      created_by_id: 'emp-sarah',
      priority: 'urgent',
      status: 'in_progress',
      date: today,
      start_time: '09:00',
      end_time: '13:00',
      estimated_hours: 4.0,
      actual_hours: 2.0,
      deadline: `${today} 15:00`,
      dependencies: JSON.stringify(['Redis Session Store']),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T08:00:00Z`,
      updated_at: `${today}T10:30:00Z`
    },
    {
      id: 'task-today-04',
      title: 'Stripe Billing Webhook Retry Queue',
      description: 'Implement BullMQ retry worker with exponential backoff for failed subscription webhooks.',
      assigned_to_id: 'emp-priya',
      created_by_id: 'emp-sarah',
      priority: 'high',
      status: 'pending',
      date: today,
      start_time: '14:00',
      end_time: '18:00',
      estimated_hours: 4.0,
      actual_hours: null,
      deadline: `${today} 18:30`,
      dependencies: JSON.stringify(['OAuth 2.0 Token Refresh Pipeline Implementation']),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T08:00:00Z`,
      updated_at: `${today}T08:00:00Z`
    },
    {
      id: 'task-today-05',
      title: 'Staging Environment Smoke Test & CI Flake Audit',
      description: 'Run automated smoke tests against staging cluster and stabilize flaky test suites.',
      assigned_to_id: 'emp-daniel',
      created_by_id: 'emp-sarah',
      priority: 'high',
      status: 'completed',
      date: today,
      start_time: '09:00',
      end_time: '12:00',
      estimated_hours: 3.0,
      actual_hours: 2.8,
      deadline: `${today} 13:00`,
      dependencies: JSON.stringify([]),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 1,
      created_at: `${today}T08:00:00Z`,
      updated_at: `${today}T12:00:00Z`
    },
    {
      id: 'task-today-06',
      title: 'Load Testing for Q3 Client Spike (5,000 req/sec)',
      description: 'Simulate concurrent user checkouts with k6 script and inspect CPU throttling.',
      assigned_to_id: 'emp-daniel',
      created_by_id: 'emp-sarah',
      priority: 'medium',
      status: 'pending',
      date: today,
      start_time: '13:00',
      end_time: '16:00',
      estimated_hours: 3.0,
      actual_hours: null,
      deadline: `${today} 17:30`,
      dependencies: JSON.stringify(['Staging Environment Smoke Test & CI Flake Audit']),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T08:00:00Z`,
      updated_at: `${today}T08:00:00Z`
    },
    {
      id: 'task-today-07',
      title: 'Q3 Enterprise Client Onboarding Presentation',
      description: 'Finalize custom onboarding slides and KPI review for Acme Corp kickoff call.',
      assigned_to_id: 'emp-emma',
      created_by_id: 'emp-sarah',
      priority: 'urgent',
      status: 'completed',
      date: today,
      start_time: '09:30',
      end_time: '11:30',
      estimated_hours: 2.0,
      actual_hours: 2.0,
      deadline: `${today} 12:00`,
      dependencies: JSON.stringify([]),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 1,
      created_at: `${today}T08:00:00Z`,
      updated_at: `${today}T11:45:00Z`
    },
    {
      id: 'task-today-08',
      title: 'Customer Feedback Sentiment Synthesis Report',
      description: 'Aggregate NPS survey responses and tag recurring workflow bottlenecks for product team.',
      assigned_to_id: 'emp-emma',
      created_by_id: 'emp-sarah',
      priority: 'medium',
      status: 'in_progress',
      date: today,
      start_time: '13:00',
      end_time: '15:30',
      estimated_hours: 2.5,
      actual_hours: 1.0,
      deadline: `${today} 17:00`,
      dependencies: JSON.stringify([]),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T08:00:00Z`,
      updated_at: `${today}T13:30:00Z`
    },

    // Tomorrow planned tasks
    {
      id: 'task-tomo-01',
      title: 'Website Redesign Phase 2 & Stakeholder Approval Review',
      description: 'High-fidelity mockup review for checkout flow with marketing and legal stakeholders.',
      assigned_to_id: 'emp-alex',
      created_by_id: 'emp-sarah',
      priority: 'high',
      status: 'pending',
      date: tomorrow,
      start_time: '09:00',
      end_time: '12:00',
      estimated_hours: 3.0,
      actual_hours: null,
      deadline: `${tomorrow} 15:00`,
      dependencies: JSON.stringify(['Mobile App Navigation Prototype & User Test']),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T11:00:00Z`,
      updated_at: `${today}T11:00:00Z`
    },
    {
      id: 'task-tomo-02',
      title: 'Microservice API Gateway Rate Limiting Migration',
      description: 'Migrate legacy Envoy proxy rate limits to new Redis sliding-window algorithm.',
      assigned_to_id: 'emp-priya',
      created_by_id: 'emp-sarah',
      priority: 'high',
      status: 'pending',
      date: tomorrow,
      start_time: '09:00',
      end_time: '13:00',
      estimated_hours: 4.0,
      actual_hours: null,
      deadline: `${tomorrow} 16:00`,
      dependencies: JSON.stringify(['OAuth 2.0 Token Refresh Pipeline Implementation']),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T11:00:00Z`,
      updated_at: `${today}T11:00:00Z`
    },
    {
      id: 'task-tomo-03',
      title: 'Automated Security Penetration Testing Run',
      description: 'Execute OWASP ZAP vulnerability scan against production release candidate.',
      assigned_to_id: 'emp-daniel',
      created_by_id: 'emp-sarah',
      priority: 'medium',
      status: 'pending',
      date: tomorrow,
      start_time: '10:00',
      end_time: '13:00',
      estimated_hours: 3.0,
      actual_hours: null,
      deadline: `${tomorrow} 17:00`,
      dependencies: JSON.stringify([]),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T11:00:00Z`,
      updated_at: `${today}T11:00:00Z`
    },
    {
      id: 'task-tomo-04',
      title: 'Enterprise QBR Deck Preparation',
      description: 'Draft quarterly business review deck for top 5 tier-1 accounts.',
      assigned_to_id: 'emp-emma',
      created_by_id: 'emp-sarah',
      priority: 'high',
      status: 'pending',
      date: tomorrow,
      start_time: '09:00',
      end_time: '12:30',
      estimated_hours: 3.5,
      actual_hours: null,
      deadline: `${tomorrow} 17:00`,
      dependencies: JSON.stringify([]),
      blockers: null,
      delay_reason: null,
      hindsight_synced: 0,
      created_at: `${today}T11:00:00Z`,
      updated_at: `${today}T11:00:00Z`
    }
  ];

  for (const t of initialTasks) {
    insertTask.run(
      t.id, t.title, t.description, t.assigned_to_id, t.created_by_id, t.priority,
      t.status, t.date, t.start_time, t.end_time, t.estimated_hours, t.actual_hours,
      t.deadline, t.dependencies, t.blockers, t.delay_reason, t.hindsight_synced,
      t.created_at, t.updated_at
    );
  }

  // Insert Yesterday's Daily Review
  const insertReview = db.prepare(`
    INSERT INTO daily_reviews (id, date, total_tasks, completed_tasks, delayed_tasks, planned_hours, actual_hours, hours_variance, learnings, hindsight_retained_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    'review-yesterday',
    yesterday,
    3,
    2,
    1,
    10.5,
    12.5,
    2.0,
    JSON.stringify([
      "External client approvals for website designs take 2+ hours longer than initial estimates due to executive stakeholder review loops.",
      "Database replication setup completed on time with zero blockers when VPC peering is pre-authorized.",
      "Alex Morgan was over-allocated by 2 hours due to the unexpected client delay ripple effect."
    ]),
    3,
    `${yesterday}T18:00:00Z`
  );

  console.log('[DB] PactPulse initial demo data successfully seeded.');
}

// Reset helper for hackathon demo rerun
export function resetDatabase() {
  db.exec(`
    DELETE FROM tasks;
    DELETE FROM schedule_proposals;
    DELETE FROM hindsight_logs;
    DELETE FROM daily_reviews;
    DELETE FROM users;
  `);
  seedInitialData();
}

// Initialize seed on module load
seedInitialData();
