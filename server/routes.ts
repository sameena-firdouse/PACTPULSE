import { Router } from 'express';
import { db, resetDatabase, Task, User, ScheduleProposal } from './db.js';
import {
  retainExperience,
  recallMemories,
  reflectMemories,
  getHindsightStatus,
  updateHindsightConfig,
  getHindsightLogs,
  createOrUseBank,
  runHindsightVerification,
} from './hindsight.js';
import {
  analyzeSchedule,
  recoverEmergencyInterruption,
  learnFromWorkday,
  generateTomorrowSchedule,
} from './gemini.js';
import crypto from 'crypto';

export const apiRouter = Router();

// --------------------------------------------------
// STATUS & HEALTH
// --------------------------------------------------
apiRouter.get('/status', async (req, res) => {
  try {
    const hindsightStatus = await getHindsightStatus();
    const taskCount = (db.prepare('SELECT COUNT(*) as c FROM tasks').get() as any).c;
    const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;
    const proposalCount = (db.prepare("SELECT COUNT(*) as c FROM schedule_proposals WHERE status = 'pending'").get() as any).c;

    res.json({
      ok: true,
      app: 'PactPulse AI',
      timestamp: new Date().toISOString(),
      counts: {
        tasks: taskCount,
        users: userCount,
        pendingProposals: proposalCount
      },
      gemini: {
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: 'gemini-3.8-flash'
      },
      hindsight: hindsightStatus
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// --------------------------------------------------
// USERS
// --------------------------------------------------
apiRouter.get('/users', (req, res) => {
  try {
    const users = db.prepare('SELECT * FROM users ORDER BY role DESC, name ASC').all();
    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// TASKS
// --------------------------------------------------
apiRouter.get('/tasks', (req, res) => {
  try {
    const { date, assigned_to_id, status } = req.query;
    let query = `
      SELECT tasks.*, users.name as assigned_to_name, users.avatar as assigned_to_avatar, users.title as assigned_to_title
      FROM tasks
      JOIN users ON tasks.assigned_to_id = users.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ` AND tasks.date = ?`;
      params.push(date);
    }
    if (assigned_to_id) {
      query += ` AND tasks.assigned_to_id = ?`;
      params.push(assigned_to_id);
    }
    if (status) {
      query += ` AND tasks.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY tasks.date ASC, tasks.start_time ASC, tasks.priority DESC`;

    const tasks = db.prepare(query).all(...params);
    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/tasks', async (req, res) => {
  try {
    const {
      title,
      description,
      assigned_to_id,
      created_by_id = 'emp-sarah',
      priority = 'medium',
      date = new Date().toISOString().split('T')[0],
      start_time = '09:00',
      end_time = '12:00',
      estimated_hours = 3.0,
      deadline = `${date} 17:00`,
      dependencies = []
    } = req.body;

    if (!title || !assigned_to_id) {
      return res.status(400).json({ error: 'Title and assigned_to_id are required' });
    }

    const taskId = `task-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO tasks (
        id, title, description, assigned_to_id, created_by_id, priority, status,
        date, start_time, end_time, estimated_hours, actual_hours, deadline,
        dependencies, blockers, delay_reason, hindsight_synced, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      taskId,
      title,
      description || '',
      assigned_to_id,
      created_by_id,
      priority,
      'pending',
      date,
      start_time,
      end_time,
      Number(estimated_hours),
      null,
      deadline,
      JSON.stringify(dependencies),
      null,
      null,
      0,
      now,
      now
    );

    const createdTask = db.prepare(`
      SELECT tasks.*, users.name as assigned_to_name, users.avatar as assigned_to_avatar
      FROM tasks
      JOIN users ON tasks.assigned_to_id = users.id
      WHERE tasks.id = ?
    `).get(taskId);

    res.status(201).json({ task: createdTask });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.patch('/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = req.body;
    const allowed = [
      'title', 'description', 'assigned_to_id', 'priority', 'status',
      'date', 'start_time', 'end_time', 'estimated_hours', 'actual_hours',
      'deadline', 'dependencies', 'blockers', 'delay_reason'
    ];

    const clauses: string[] = [];
    const params: any[] = [];

    for (const key of allowed) {
      if (updates[key] !== undefined) {
        clauses.push(`${key} = ?`);
        params.push(key === 'dependencies' && Array.isArray(updates[key]) ? JSON.stringify(updates[key]) : updates[key]);
      }
    }

    if (clauses.length === 0) {
      return res.json({ task: existing });
    }

    clauses.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    db.prepare(`UPDATE tasks SET ${clauses.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare(`
      SELECT tasks.*, users.name as assigned_to_name, users.avatar as assigned_to_avatar
      FROM tasks
      JOIN users ON tasks.assigned_to_id = users.id
      WHERE tasks.id = ?
    `).get(id);

    res.json({ task: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Employee reports a delay on their task -> immediately triggers real Hindsight retain
apiRouter.post('/tasks/:id/report-delay', async (req, res) => {
  try {
    const { id } = req.params;
    const { delay_reason, actual_hours, blockers } = req.body;

    const task = db.prepare(`
      SELECT tasks.*, users.name as assigned_to_name
      FROM tasks
      JOIN users ON tasks.assigned_to_id = users.id
      WHERE tasks.id = ?
    `).get(id) as any;

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const now = new Date().toISOString();
    const actual = actual_hours ? Number(actual_hours) : (task.estimated_hours + 2.0);

    // Update task
    db.prepare(`
      UPDATE tasks
      SET status = 'delayed',
          delay_reason = ?,
          actual_hours = ?,
          blockers = ?,
          hindsight_synced = 1,
          updated_at = ?
      WHERE id = ?
    `).run(delay_reason, actual, blockers || null, now, id);

    // Real Hindsight Memory Retain Call
    const hindsightContent = `Workforce Experience: Task "${task.title}" assigned to ${task.assigned_to_name} took ${actual} hours instead of estimated ${task.estimated_hours} hours. Reason for delay: ${delay_reason}. Blockers reported: ${blockers || 'None'}.`;

    const retainResult = await retainExperience(
      hindsightContent,
      {
        taskId: task.id,
        taskTitle: task.title,
        employeeId: task.assigned_to_id,
        employeeName: task.assigned_to_name,
        estimatedHours: task.estimated_hours,
        actualHours: actual,
        delayHours: actual - task.estimated_hours,
        category: 'task_delay'
      },
      'workforce_delay_report'
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

    res.json({
      success: true,
      task: updatedTask,
      hindsight: retainResult,
      message: retainResult.success
        ? 'Task delay recorded and successfully retained in Hindsight long-term memory bank.'
        : `Task delay recorded in database. Hindsight status: ${retainResult.error || 'Pending key'}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// AI SCHEDULING AGENT
// --------------------------------------------------
apiRouter.post('/ai/analyze-schedule', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const tasks = (db.prepare(`SELECT * FROM tasks WHERE date = ?`).all(today) as unknown) as Task[];
    const employees = (db.prepare(`SELECT * FROM users WHERE role = 'employee'`).all() as unknown) as User[];

    // Retrieve previous experiences from Hindsight
    const recallResult = await recallMemories('workforce delay reasons estimation bottlenecks approvals', {
      preferObservations: true
    });

    const memories = recallResult.memories || [];
    const analysis = await analyzeSchedule(tasks, employees, memories);

    // Create a schedule proposal if adjustments recommended
    let proposalId: string | null = null;
    if (analysis.recommendedAdjustments.length > 0) {
      proposalId = `prop-${crypto.randomUUID().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO schedule_proposals (
          id, type, title, summary, status, affected_date, trigger_event,
          original_schedule, proposed_schedule, rationale, hindsight_memories, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        proposalId,
        'daily_optimization',
        `AI Schedule Optimization (${today})`,
        analysis.executiveSummary,
        'pending',
        today,
        'Proactive AI schedule review detected workload imbalances and high-risk tasks.',
        JSON.stringify(tasks),
        JSON.stringify(analysis.recommendedAdjustments),
        analysis.executiveSummary,
        JSON.stringify(memories),
        new Date().toISOString()
      );
    }

    res.json({
      analysis,
      recalledMemories: memories,
      hindsightStatus: recallResult.success ? 'real_api' : 'fallback',
      hindsightError: recallResult.error,
      proposalId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// SCHEDULE RECOVERY (EMERGENCY INTERRUPTION)
// --------------------------------------------------
apiRouter.post('/ai/recover-schedule', async (req, res) => {
  try {
    const {
      employee_id = 'emp-alex',
      reason = 'Unexpected urgent client meeting for 2 hours',
      duration_hours = 2.0,
      date = new Date().toISOString().split('T')[0]
    } = req.body;

    const tasks = (db.prepare(`SELECT * FROM tasks WHERE date = ?`).all(date) as unknown) as Task[];
    const employees = (db.prepare(`SELECT * FROM users WHERE role = 'employee'`).all() as unknown) as User[];

    // Recall from Hindsight for similar past interruptions
    const recallResult = await recallMemories(`interruption recovery reassignment ${reason}`, {
      preferObservations: true
    });

    const memories = recallResult.memories || [];
    const recoveryProposal = await recoverEmergencyInterruption(
      employee_id,
      reason,
      Number(duration_hours),
      date,
      tasks,
      employees,
      memories
    );

    // Store as a formal proposal requiring employer approval
    const proposalId = `prop-${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO schedule_proposals (
        id, type, title, summary, status, affected_date, trigger_event,
        original_schedule, proposed_schedule, rationale, hindsight_memories, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      proposalId,
      'emergency_recovery',
      `Emergency Schedule Recovery: ${recoveryProposal.affectedEmployeeName}`,
      recoveryProposal.interruptionSummary,
      'pending',
      date,
      reason,
      JSON.stringify(recoveryProposal.originalSchedule),
      JSON.stringify(recoveryProposal.proposedSchedule),
      recoveryProposal.rationale,
      JSON.stringify(memories),
      new Date().toISOString()
    );

    res.json({
      proposalId,
      recovery: recoveryProposal,
      recalledMemories: memories,
      hindsightStatus: recallResult.success ? 'real_api' : 'fallback',
      hindsightError: recallResult.error
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// PROPOSALS (APPROVAL & REJECTION)
// --------------------------------------------------
apiRouter.get('/proposals', (req, res) => {
  try {
    const proposals = db.prepare('SELECT * FROM schedule_proposals ORDER BY created_at DESC').all();
    res.json({ proposals });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/proposals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const proposal = db.prepare('SELECT * FROM schedule_proposals WHERE id = ?').get(id) as ScheduleProposal | undefined;
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const proposedItems = JSON.parse(proposal.proposed_schedule || '[]');

    // Apply changes to database tasks
    for (const item of proposedItems) {
      if (!item.taskId) continue;

      const updates: string[] = [];
      const params: any[] = [];

      if (item.suggestedAssigneeId) {
        updates.push('assigned_to_id = ?');
        params.push(item.suggestedAssigneeId);
      } else if (item.action === 'reassigned' && item.assigneeName) {
        const u = db.prepare('SELECT id FROM users WHERE name = ?').get(item.assigneeName) as any;
        if (u) {
          updates.push('assigned_to_id = ?');
          params.push(u.id);
        }
      }

      if (item.suggestedStartTime || item.startTime) {
        updates.push('start_time = ?');
        params.push(item.suggestedStartTime || item.startTime);
      }
      if (item.suggestedEndTime || item.endTime) {
        updates.push('end_time = ?');
        params.push(item.suggestedEndTime || item.endTime);
      }

      if (updates.length > 0) {
        updates.push('updated_at = ?');
        params.push(new Date().toISOString());
        params.push(item.taskId);
        db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      }
    }

    // Mark proposal approved
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE schedule_proposals
      SET status = 'approved', resolved_at = ?, resolved_by = 'emp-sarah'
      WHERE id = ?
    `).run(now, id);

    // Retain approval outcome to Hindsight!
    const outcomeExperience = `Schedule Adjustment Approved: Employer approved proposal "${proposal.title}". Trigger: ${proposal.trigger_event || 'Workload balancing'}. Rationale: ${proposal.rationale}`;
    await retainExperience(outcomeExperience, {
      proposalId: proposal.id,
      proposalType: proposal.type,
      decision: 'approved'
    }, 'schedule_adjustment_outcome');

    res.json({
      success: true,
      message: 'Schedule proposal approved, tasks updated, and outcome retained in Hindsight.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/proposals/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE schedule_proposals
      SET status = 'rejected', resolved_at = ?, resolved_by = 'emp-sarah'
      WHERE id = ?
    `).run(now, id);

    res.json({ success: true, message: 'Proposal rejected.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// DAILY REVIEW: "Learn from Today's Work"
// --------------------------------------------------
apiRouter.post('/ai/daily-review', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.body;
    const tasks = (db.prepare(`SELECT * FROM tasks WHERE date = ?`).all(date) as unknown) as Task[];
    const employees = (db.prepare(`SELECT * FROM users WHERE role = 'employee'`).all() as unknown) as User[];

    const review = await learnFromWorkday(date, tasks, employees);

    // Retain each key experience into Hindsight
    let retainedCount = 0;
    const retainResults = [];

    for (const exp of review.hindsightExperiencesToRetain) {
      const resRetain = await retainExperience(
        exp.content,
        { ...exp.metadata, date },
        'daily_review_learning'
      );
      if (resRetain.success) retainedCount++;
      retainResults.push(resRetain);
    }

    // Upsert daily_reviews
    const reviewId = `rev-${date}`;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const delayedTasks = tasks.filter(t => t.status === 'delayed').length;

    db.prepare(`
      INSERT INTO daily_reviews (
        id, date, total_tasks, completed_tasks, delayed_tasks, planned_hours,
        actual_hours, hours_variance, learnings, hindsight_retained_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        total_tasks = excluded.total_tasks,
        completed_tasks = excluded.completed_tasks,
        delayed_tasks = excluded.delayed_tasks,
        planned_hours = excluded.planned_hours,
        actual_hours = excluded.actual_hours,
        hours_variance = excluded.hours_variance,
        learnings = excluded.learnings,
        hindsight_retained_count = excluded.hindsight_retained_count
    `).run(
      reviewId,
      date,
      tasks.length,
      completedTasks,
      delayedTasks,
      review.plannedHours,
      review.actualHours,
      review.hoursVariance,
      JSON.stringify(review.keyLearnings),
      retainedCount,
      new Date().toISOString()
    );

    res.json({
      success: true,
      review,
      retainedCount,
      retainResults
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// TOMORROW'S SMARTER SCHEDULE: "Generate Tomorrow's Smarter Schedule"
// --------------------------------------------------
apiRouter.post('/ai/generate-tomorrow', async (req, res) => {
  try {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const tomorrowTasks = (db.prepare(`SELECT * FROM tasks WHERE date = ?`).all(tomorrow) as unknown) as Task[];
    const employees = (db.prepare(`SELECT * FROM users WHERE role = 'employee'`).all() as unknown) as User[];

    // Recall relevant past experiences from Hindsight (e.g. website design approval delays)
    const recallResult = await recallMemories('website redesign approvals delay hours buffer dependency', {
      preferObservations: true
    });

    const memories = recallResult.memories || [];
    const tomorrowPlan = await generateTomorrowSchedule(tomorrow, tomorrowTasks, employees, memories);

    // Create a schedule proposal
    const proposalId = `prop-${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO schedule_proposals (
        id, type, title, summary, status, affected_date, trigger_event,
        original_schedule, proposed_schedule, rationale, hindsight_memories, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      proposalId,
      'tomorrow_schedule',
      tomorrowPlan.proposalTitle,
      tomorrowPlan.summary,
      'pending',
      tomorrow,
      'Hindsight memory informed next-day schedule generation.',
      JSON.stringify(tomorrowTasks),
      JSON.stringify(tomorrowPlan.optimizedTasks),
      tomorrowPlan.improvementsApplied.join('; '),
      JSON.stringify(memories),
      new Date().toISOString()
    );

    res.json({
      success: true,
      proposalId,
      tomorrowPlan,
      recalledMemories: memories,
      hindsightStatus: recallResult.success ? 'real_api' : 'fallback',
      hindsightError: recallResult.error
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// HINDSIGHT EXPLORER & CONFIGURATION
// --------------------------------------------------
apiRouter.get('/hindsight/status', async (req, res) => {
  try {
    const status = await getHindsightStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/hindsight/config', async (req, res) => {
  try {
    const { apiKey, baseUrl, bankId } = req.body;
    const newStatus = await updateHindsightConfig({ apiKey, baseUrl, bankId });
    res.json(newStatus);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/hindsight/logs', (req, res) => {
  try {
    const logs = getHindsightLogs(50);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/hindsight/retain', async (req, res) => {
  try {
    const { content, metadata, context } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const result = await retainExperience(content, metadata, context);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/hindsight/recall', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const result = await recallMemories(query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/hindsight/reflect', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const result = await reflectMemories(query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/hindsight/bank/create-or-use', async (req, res) => {
  try {
    const { bankId = 'pactpulse-demo' } = req.body;
    const result = await createOrUseBank(bankId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/hindsight/verify-integration', async (req, res) => {
  try {
    const { bankId = 'pactpulse-demo' } = req.body;
    const report = await runHindsightVerification(bankId);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// REVIEWS & INSIGHTS
// --------------------------------------------------
apiRouter.get('/reviews', (req, res) => {
  try {
    const reviews = db.prepare('SELECT * FROM daily_reviews ORDER BY date DESC').all();
    res.json({ reviews });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --------------------------------------------------
// HACKATHON DEMO RUNNER & RESET
// --------------------------------------------------
apiRouter.post('/demo/reset', (req, res) => {
  try {
    resetDatabase();
    res.json({ success: true, message: 'Database reset to initial demo state.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
