/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  error?: string;
}

/**
 * Strips HTML tags and potential script injections from plain text
 */
export function sanitizeString(input: any, maxLength = 255): string {
  if (typeof input !== 'string') return '';
  // Strip control characters, HTML tags
  const clean = input
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
  return clean.slice(0, maxLength);
}

export function validateDate(dateStr: any): ValidationResult<string> {
  if (typeof dateStr !== 'string') {
    return { isValid: false, error: 'Date must be a string' };
  }
  const match = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (!match) {
    return { isValid: false, error: 'Date must be formatted as YYYY-MM-DD' };
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return { isValid: false, error: 'Invalid calendar date' };
  }
  return { isValid: true, data: dateStr };
}

export function validateTime(timeStr: any): ValidationResult<string> {
  if (typeof timeStr !== 'string') {
    return { isValid: false, error: 'Time must be a string' };
  }
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
  if (!match) {
    return { isValid: false, error: 'Time must be formatted as HH:MM (24-hour)' };
  }
  return { isValid: true, data: timeStr };
}

export function validateHours(hours: any, fieldName = 'hours'): ValidationResult<number> {
  const num = typeof hours === 'number' ? hours : parseFloat(hours);
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  if (num < 0.1 || num > 24) {
    return { isValid: false, error: `${fieldName} must be between 0.1 and 24.0 hours` };
  }
  return { isValid: true, data: Math.round(num * 10) / 10 };
}

export function validatePriority(priority: any): ValidationResult<'urgent' | 'high' | 'medium' | 'low'> {
  const allowed = ['urgent', 'high', 'medium', 'low'];
  if (!allowed.includes(priority)) {
    return { isValid: false, error: `Priority must be one of: ${allowed.join(', ')}` };
  }
  return { isValid: true, data: priority };
}

export function validateStatus(status: any): ValidationResult<'pending' | 'in_progress' | 'completed' | 'delayed'> {
  const allowed = ['pending', 'in_progress', 'completed', 'delayed'];
  if (!allowed.includes(status)) {
    return { isValid: false, error: `Status must be one of: ${allowed.join(', ')}` };
  }
  return { isValid: true, data: status };
}

export function validateTaskInput(body: any): ValidationResult<{
  title: string;
  description: string;
  assigned_to_id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  date: string;
  start_time: string;
  end_time: string;
  estimated_hours: number;
  deadline: string;
  dependencies: string[];
}> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request body' };
  }

  const title = sanitizeString(body.title, 120);
  if (!title || title.length < 3) {
    return { isValid: false, error: 'Task title must be between 3 and 120 characters' };
  }

  const description = sanitizeString(body.description || '', 1000);

  const assigned_to_id = sanitizeString(body.assigned_to_id, 50);
  if (!assigned_to_id) {
    return { isValid: false, error: 'assigned_to_id is required' };
  }

  const priorityRes = validatePriority(body.priority || 'medium');
  if (!priorityRes.isValid || !priorityRes.data) return { isValid: false, error: priorityRes.error };

  const dateRes = validateDate(body.date || new Date().toISOString().split('T')[0]);
  if (!dateRes.isValid || !dateRes.data) return { isValid: false, error: dateRes.error };

  const startTimeRes = validateTime(body.start_time || '09:00');
  if (!startTimeRes.isValid || !startTimeRes.data) return { isValid: false, error: startTimeRes.error };

  const endTimeRes = validateTime(body.end_time || '12:00');
  if (!endTimeRes.isValid || !endTimeRes.data) return { isValid: false, error: endTimeRes.error };

  const hoursRes = validateHours(body.estimated_hours ?? 3.0, 'estimated_hours');
  if (!hoursRes.isValid || hoursRes.data === undefined) return { isValid: false, error: hoursRes.error };

  const deadline = sanitizeString(body.deadline || `${dateRes.data} 17:00`, 50);

  let dependencies: string[] = [];
  if (Array.isArray(body.dependencies)) {
    dependencies = body.dependencies.map((d: any) => sanitizeString(d, 100)).filter(Boolean);
  }

  return {
    isValid: true,
    data: {
      title,
      description,
      assigned_to_id,
      priority: priorityRes.data,
      date: dateRes.data,
      start_time: startTimeRes.data,
      end_time: endTimeRes.data,
      estimated_hours: hoursRes.data,
      deadline,
      dependencies
    }
  };
}
