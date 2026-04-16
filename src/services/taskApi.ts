import { apiDelete, apiGet, apiPatch, apiPost } from '../api';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface TaskItem {
  id: string;
  farmId: string;
  assignedToUserId: string;
  createdByUserId?: string;
  templateId: string;
  title: string;
  description: string;
  status: TaskStatus;
  notificationId?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TaskCreatePayload {
  taskType: 'CHANGE_TANK_WATER' | 'CLEAN_TANK' | 'FEED_FISH' | 'MEASURE_GROWTH' | 'WATER_QUALITY_CHECK' | 'HARVEST_TANK' | 'OTHER';
  assignedToUserId?: string;
  tankId: string;
  data?: Record<string, any>;
  title: string;
  description?: string;
  dueAt?: string;
}

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const readPayload = (payload: unknown): unknown => {
  if (!payload || typeof payload !== 'object') return payload;
  const rec = payload as Record<string, unknown>;
  return rec.data ?? rec.items ?? rec.tasks ?? rec.results ?? payload;
};

const normalizeTask = (entry: unknown): TaskItem | null => {
  if (!entry || typeof entry !== 'object') return null;
  const rec = entry as Record<string, unknown>;

  const id = String(rec.id ?? '').trim();
  if (!id) return null;

  const status = String(rec.status ?? 'OPEN').toUpperCase() as TaskStatus;
  const createdAt = String(rec.createdAt ?? new Date().toISOString());

  return {
    id,
    farmId: String(rec.farmId ?? ''),
    assignedToUserId: String(rec.assignedToUserId ?? ''),
    createdByUserId: rec.createdByUserId ? String(rec.createdByUserId) : undefined,
    templateId: String(rec.templateId ?? ''),
    title: String(rec.title ?? 'Untitled Task'),
    description: String(rec.description ?? ''),
    status,
    notificationId: rec.notificationId ? String(rec.notificationId) : undefined,
    dueAt: rec.dueAt ? String(rec.dueAt) : undefined,
    completedAt: rec.completedAt ? String(rec.completedAt) : undefined,
    createdAt,
  };
};

const normalizeTaskList = (payload: unknown): TaskItem[] => {
  const list = toArray(readPayload(payload));
  return list
    .map(normalizeTask)
    .filter((task): task is TaskItem => Boolean(task));
};

export const getMyTasks = async (): Promise<TaskItem[]> => {
  const payload = await apiGet<unknown>('/tasks/mine');
  return normalizeTaskList(payload);
};

export const getFarmTasks = async (status?: TaskStatus): Promise<TaskItem[]> => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const payload = await apiGet<unknown>(`/tasks${query}`);
  return normalizeTaskList(payload);
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<TaskItem | null> => {
  const payload = await apiPatch<unknown>(`/tasks/${taskId}/status`, { status });
  return normalizeTask(readPayload(payload));
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await apiDelete(`/tasks/${taskId}`);
};

export const createTask = async (payload: TaskCreatePayload): Promise<TaskItem | null> => {
  const response = await apiPost('/tasks', payload);
  return normalizeTask(readPayload(response));
};
