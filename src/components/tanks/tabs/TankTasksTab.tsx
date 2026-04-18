import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { CheckCircle2, Clock3, ListChecks, PlayCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '../../../types';
import { getFarmTasks, getMyTasks, TaskItem, TaskStatus, updateTaskStatus } from '../../../services/taskApi';

interface TankTasksTabProps {
  user: User;
  tank: any;
}

type StatusFilter = 'ALL' | TaskStatus;

const STATUS_LIST: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-amber-100 text-amber-800',
  DONE: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-gray-100 text-gray-700',
};

const formatDateTime = (value?: string): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
};

const taskMatchesTank = (task: TaskItem, tank: any): boolean => {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
  const tankName = String(tank?.name ?? '').trim().toLowerCase();
  const tankIdPrefix = String(tank?.id ?? '').trim().toLowerCase().split('-')[0];

  if (tankName && text.includes(tankName)) return true;
  if (tankIdPrefix && text.includes(tankIdPrefix)) return true;
  return false;
};

export function TankTasksTab({ user, tank }: TankTasksTabProps) {
  const canViewFarmTasks = user.role === 'admin' || user.role === 'manager';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyTaskIds, setBusyTaskIds] = useState<Record<string, boolean>>({});

  const setTaskBusy = (taskId: string, busy: boolean) => {
    setBusyTaskIds((prev) => ({ ...prev, [taskId]: busy }));
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const selectedStatus = statusFilter === 'ALL' ? undefined : statusFilter;

      const sourceTasks =
        canViewFarmTasks
          ? await getFarmTasks(selectedStatus)
          : await getMyTasks();

      const statusFiltered =
        selectedStatus
          ? sourceTasks.filter((task) => task.status === selectedStatus)
          : sourceTasks;

      const scoped = statusFiltered.filter((task) => taskMatchesTank(task, tank));

      setTasks(scoped);
    } catch (err) {
      setError((err as Error).message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [canViewFarmTasks, statusFilter, tank]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const summary = useMemo(() => {
    const counts: Record<'total' | TaskStatus, number> = {
      total: tasks.length,
      OPEN: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      CANCELLED: 0,
    };

    tasks.forEach((task) => {
      counts[task.status] += 1;
    });

    return counts;
  }, [tasks]);

  const handleUpdateStatus = async (task: TaskItem, nextStatus: TaskStatus) => {
    setTaskBusy(task.id, true);
    try {
      await updateTaskStatus(task.id, nextStatus);
      toast.success(`Task moved to ${nextStatus}`);
      await loadTasks();
    } catch (err) {
      toast.error(`Failed to update task: ${(err as Error).message}`);
    } finally {
      setTaskBusy(task.id, false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-[#0A4D68]" />
            Tank Tasks
          </h3>
          <p className="text-sm text-gray-600">
            Tank: <span className="font-medium">{tank?.name || 'Unknown Tank'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[170px] h-8">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {STATUS_LIST.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8" onClick={() => void loadTasks()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-blue-700">{summary.OPEN}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-amber-700">{summary.IN_PROGRESS}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Done</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-700">{summary.DONE}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks related to this tank</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-gray-500">Loading tasks...</p>}
          {!loading && error && <p className="text-sm text-red-600">Failed to load tasks: {error}</p>}
          {!loading && !error && tasks.length === 0 && (
            <p className="text-sm text-gray-500">No tasks found for this view.</p>
          )}

          {!loading &&
            !error &&
            tasks.map((task) => {
              const canUpdate = task.assignedToUserId === user.id;

              return (
                <div key={task.id} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500">Task ID: {task.id}</p>
                    </div>
                    <Badge className={STATUS_BADGE_CLASS[task.status]} variant="outline">
                      {task.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{task.description || 'No description'}</p>

                  <div className="mb-3 grid grid-cols-1 gap-2 text-xs text-gray-600 md:grid-cols-3">
                    <p>Assigned To: {task.assignedToUserId}</p>
                    <p>Created: {formatDateTime(task.createdAt)}</p>
                    <p>Due: {formatDateTime(task.dueAt)}</p>
                  </div>

                  {canUpdate && (
                    <div className="flex items-center gap-2">
                      {task.status === 'OPEN' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleUpdateStatus(task, 'IN_PROGRESS')}
                          disabled={!!busyTaskIds[task.id]}
                        >
                          <PlayCircle className="mr-1 h-4 w-4" />
                          Start
                        </Button>
                      )}
                      {(task.status === 'OPEN' || task.status === 'IN_PROGRESS') && (
                        <Button
                          size="sm"
                          onClick={() => void handleUpdateStatus(task, 'DONE')}
                          disabled={!!busyTaskIds[task.id]}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Mark Done
                        </Button>
                      )}
                      {task.status === 'CANCELLED' && (
                        <span className="inline-flex items-center text-xs text-gray-500 gap-1">
                          <Clock3 className="h-3.5 w-3.5" />
                          Cancelled task
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
