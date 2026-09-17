import { Client } from '@libsql/client';
import crypto from 'crypto';
import { Response } from 'express';

export interface TaskLogItem {
  time: string;
  message: string;
  isError?: boolean;
}

export interface TaskRecord {
  id: string;
  task_type: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total_items: number;
  processed_items: number;
  success_count: number;
  failure_count: number;
  current_step: string;
  logs: TaskLogItem[];
  error?: string | null;
  params: any;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

interface ActiveTaskInstance extends TaskRecord {
  abortRequested: boolean;
  subscribers: Array<(data: string) => void>;
  dirty: boolean;
}

export class TaskManager {
  private db: Client;
  private activeTasks: Map<string, ActiveTaskInstance> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private onTaskUpdateCallback?: (type: string) => void;

  constructor(db: Client, onTaskUpdate?: (type: string) => void) {
    this.db = db;
    this.onTaskUpdateCallback = onTaskUpdate;

    // Start background sync timer to periodically flush dirty task state to DB (every 1.5s)
    this.syncTimer = setInterval(() => {
      this.flushDirtyTasks();
    }, 1500);
  }

  public async initDatabase() {
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS background_tasks (
        id TEXT PRIMARY KEY,
        task_type TEXT NOT NULL,
        title TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        total_items INTEGER DEFAULT 0,
        processed_items INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        current_step TEXT,
        logs TEXT,
        error TEXT,
        params TEXT,
        created_by TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      );
    `);

    // Clean up any stale in-progress tasks from prior server restarts
    try {
      await this.db.execute(`
        UPDATE background_tasks 
        SET status = 'failed', 
            error = 'Task was interrupted because server restarted', 
            completed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE status = 'processing' OR status = 'pending'
      `);
    } catch (e: any) {
      console.warn('[TaskManager] Could not reset stale tasks:', e.message);
    }
  }

  public async createTask(options: {
    task_type: string;
    title: string;
    total_items?: number;
    params?: any;
    created_by?: string;
  }): Promise<ActiveTaskInstance> {
    const taskId = `task_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();

    const instance: ActiveTaskInstance = {
      id: taskId,
      task_type: options.task_type,
      title: options.title,
      status: 'processing',
      progress: 0,
      total_items: options.total_items || 0,
      processed_items: 0,
      success_count: 0,
      failure_count: 0,
      current_step: 'Task initialized',
      logs: [
        {
          time: nowIso,
          message: `[INIT] ${options.title} started on server.`
        }
      ],
      error: null,
      params: options.params || {},
      created_by: options.created_by || 'admin',
      created_at: nowIso,
      updated_at: nowIso,
      completed_at: null,
      abortRequested: false,
      subscribers: [],
      dirty: false
    };

    this.activeTasks.set(taskId, instance);

    await this.db.execute({
      sql: `INSERT INTO background_tasks (
              id, task_type, title, status, progress, total_items, processed_items,
              success_count, failure_count, current_step, logs, params, created_by,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        instance.id,
        instance.task_type,
        instance.title,
        instance.status,
        instance.progress,
        instance.total_items,
        instance.processed_items,
        instance.success_count,
        instance.failure_count,
        instance.current_step,
        JSON.stringify(instance.logs),
        JSON.stringify(instance.params),
        instance.created_by,
        instance.created_at,
        instance.updated_at
      ]
    });

    if (this.onTaskUpdateCallback) {
      this.onTaskUpdateCallback('TASK_UPDATE');
    }

    return instance;
  }

  public sendLog(
    taskId: string,
    message: string,
    progress?: number,
    isDone = false,
    isError = false
  ) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    const time = new Date().toISOString();
    task.logs.push({ time, message, isError });
    task.current_step = message;
    if (progress !== undefined) {
      task.progress = Math.min(100, Math.max(task.progress, progress));
    }
    task.updated_at = time;
    task.dirty = true;

    const payload = JSON.stringify({
      taskId,
      message,
      progress: task.progress,
      isDone,
      isError,
      status: task.status,
      successCount: task.success_count,
      failureCount: task.failure_count,
      processedItems: task.processed_items,
      totalItems: task.total_items
    });

    task.subscribers.forEach(sub => {
      try {
        sub(`data: ${payload}\n\n`);
      } catch (e) {}
    });

    if (isDone) {
      this.flushTask(task);
    }
  }

  public updateCounts(
    taskId: string,
    counts: {
      totalItems?: number;
      processedItems?: number;
      successCount?: number;
      failureCount?: number;
      currentStep?: string;
      progress?: number;
    }
  ) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    if (counts.totalItems !== undefined) task.total_items = counts.totalItems;
    if (counts.processedItems !== undefined) task.processed_items = counts.processedItems;
    if (counts.successCount !== undefined) task.success_count = counts.successCount;
    if (counts.failureCount !== undefined) task.failure_count = counts.failureCount;
    if (counts.currentStep !== undefined) task.current_step = counts.currentStep;
    if (counts.progress !== undefined) task.progress = Math.min(100, Math.max(task.progress, counts.progress));

    task.updated_at = new Date().toISOString();
    task.dirty = true;
  }

  public async completeTask(taskId: string, summaryMessage?: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.progress = 100;
    task.completed_at = new Date().toISOString();
    task.updated_at = task.completed_at;

    const msg = summaryMessage || `Task completed successfully. (${task.success_count} succeeded, ${task.failure_count} failed)`;
    this.sendLog(taskId, msg, 100, true, false);

    await this.flushTask(task);

    // Close any active subscriber streams
    task.subscribers.forEach(sub => {
      try {
        sub(`data: ${JSON.stringify({ taskId, isDone: true, status: 'completed' })}\n\n`);
      } catch (e) {}
    });
    task.subscribers = [];

    // Remove from in-memory active tasks after 5 minutes
    setTimeout(() => {
      this.activeTasks.delete(taskId);
    }, 5 * 60 * 1000);

    if (this.onTaskUpdateCallback) {
      this.onTaskUpdateCallback('TASK_UPDATE');
    }
  }

  public async failTask(taskId: string, errorMessage: string) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.error = errorMessage;
    task.completed_at = new Date().toISOString();
    task.updated_at = task.completed_at;

    this.sendLog(taskId, `[ERROR] ${errorMessage}`, task.progress, true, true);

    await this.flushTask(task);

    task.subscribers.forEach(sub => {
      try {
        sub(`data: ${JSON.stringify({ taskId, isDone: true, isError: true, error: errorMessage, status: 'failed' })}\n\n`);
      } catch (e) {}
    });
    task.subscribers = [];

    setTimeout(() => {
      this.activeTasks.delete(taskId);
    }, 5 * 60 * 1000);

    if (this.onTaskUpdateCallback) {
      this.onTaskUpdateCallback('TASK_UPDATE');
    }
  }

  public cancelTask(taskId: string) {
    const task = this.activeTasks.get(taskId);
    if (task) {
      task.abortRequested = true;
      task.status = 'cancelled';
      task.completed_at = new Date().toISOString();
      task.updated_at = task.completed_at;
      this.sendLog(taskId, '[CANCELLED] Task cancellation requested by user.', task.progress, true, true);
      this.flushTask(task);
      if (this.onTaskUpdateCallback) {
        this.onTaskUpdateCallback('TASK_UPDATE');
      }
    }
  }

  public isAbortRequested(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    return task ? task.abortRequested : false;
  }

  public attachSubscriber(taskId: string, res: Response) {
    const task = this.activeTasks.get(taskId);
    if (!task) {
      res.status(404).json({ error: 'Active task not found or has concluded.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // 1. Send immediate catch-up data with full task state and existing logs
    const initPayload = JSON.stringify({
      type: 'INIT',
      taskId: task.id,
      title: task.title,
      task_type: task.task_type,
      status: task.status,
      progress: task.progress,
      total_items: task.total_items,
      processed_items: task.processed_items,
      success_count: task.success_count,
      failure_count: task.failure_count,
      logs: task.logs.map(l => l.message)
    });
    res.write(`data: ${initPayload}\n\n`);

    // 2. Add listener to live stream
    const subscriberFn = (data: string) => {
      try {
        res.write(data);
      } catch (e) {}
    };

    task.subscribers.push(subscriberFn);

    // 3. When client disconnects/closes tab, remove subscriber, DO NOT CANCEL TASK
    res.on('close', () => {
      const idx = task.subscribers.indexOf(subscriberFn);
      if (idx !== -1) {
        task.subscribers.splice(idx, 1);
      }
    });
  }

  public async getActiveTasks(): Promise<TaskRecord[]> {
    const list: TaskRecord[] = [];
    for (const [, task] of this.activeTasks.entries()) {
      if (task.status === 'processing' || task.status === 'pending') {
        list.push(this.sanitize(task));
      }
    }

    // Also check database if memory had empty
    if (list.length === 0) {
      const dbRes = await this.db.execute(`
        SELECT * FROM background_tasks 
        WHERE status = 'processing' OR status = 'pending'
        ORDER BY created_at DESC
      `);
      for (const row of dbRes.rows) {
        list.push(this.mapDbRowToTask(row));
      }
    }

    return list;
  }

  public async getRecentTasks(limit = 25): Promise<TaskRecord[]> {
    const dbRes = await this.db.execute({
      sql: `SELECT * FROM background_tasks ORDER BY created_at DESC LIMIT ?`,
      args: [limit]
    });

    return dbRes.rows.map(row => this.mapDbRowToTask(row));
  }

  public async getTask(taskId: string): Promise<TaskRecord | null> {
    const mem = this.activeTasks.get(taskId);
    if (mem) {
      return this.sanitize(mem);
    }

    const dbRes = await this.db.execute({
      sql: `SELECT * FROM background_tasks WHERE id = ?`,
      args: [taskId]
    });

    if (dbRes.rows.length === 0) return null;
    return this.mapDbRowToTask(dbRes.rows[0]);
  }

  private async flushDirtyTasks() {
    for (const [, task] of this.activeTasks.entries()) {
      if (task.dirty) {
        task.dirty = false;
        await this.flushTask(task);
      }
    }
  }

  private async flushTask(task: ActiveTaskInstance) {
    try {
      await this.db.execute({
        sql: `UPDATE background_tasks SET
                status = ?,
                progress = ?,
                total_items = ?,
                processed_items = ?,
                success_count = ?,
                failure_count = ?,
                current_step = ?,
                logs = ?,
                error = ?,
                updated_at = ?,
                completed_at = ?
              WHERE id = ?`,
        args: [
          task.status,
          task.progress,
          task.total_items,
          task.processed_items,
          task.success_count,
          task.failure_count,
          task.current_step,
          JSON.stringify(task.logs),
          task.error || null,
          task.updated_at,
          task.completed_at || null,
          task.id
        ]
      });
    } catch (e: any) {
      console.warn(`[TaskManager] Failed to flush task ${task.id} to DB:`, e.message);
    }
  }

  public destroy() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private sanitize(task: ActiveTaskInstance): TaskRecord {
    const { subscribers, dirty, abortRequested, ...clean } = task;
    return clean;
  }

  private mapDbRowToTask(row: any): TaskRecord {
    let parsedLogs: TaskLogItem[] = [];
    let parsedParams: any = {};
    try {
      parsedLogs = JSON.parse(row.logs || '[]');
    } catch (e) {}
    try {
      parsedParams = JSON.parse(row.params || '{}');
    } catch (e) {}

    return {
      id: row.id,
      task_type: row.task_type,
      title: row.title,
      status: row.status,
      progress: row.progress,
      total_items: row.total_items,
      processed_items: row.processed_items,
      success_count: row.success_count,
      failure_count: row.failure_count,
      current_step: row.current_step,
      logs: parsedLogs,
      error: row.error,
      params: parsedParams,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      completed_at: row.completed_at
    };
  }
}
