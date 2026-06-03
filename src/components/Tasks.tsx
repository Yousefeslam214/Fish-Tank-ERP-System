import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock3,
  ListChecks,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { User } from "../types";
import {
  deleteTask,
  getFarmTasks,
  getMyTasks,
  isFeedingTask,
  notifyFeedingTaskCompleted,
  TaskItem,
  TaskStatus,
  updateTaskStatus,
} from "../services/taskApi";

interface TasksProps {
  user: User;
}

const STATUSES: TaskStatus[] = ["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"];

const STATUS_BADGE_CLASS: Record<TaskStatus, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-amber-800",
  DONE: "bg-green-600 text-white border-green-600",
  CANCELLED: "bg-red-100 text-white border-red-700",
};

const formatDateTime = (value?: string): string => {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
};

export default function Tasks({ user }: TasksProps) {
  const canViewFarmTasks = user.role === "admin" || user.role === "manager";
  const canCancelTask = canViewFarmTasks;

  const [scope, setScope] = useState<"mine" | "farm">(
    canViewFarmTasks ? "farm" : "mine",
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
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
      const data =
        scope === "mine"
          ? await getMyTasks()
          : await getFarmTasks(
              statusFilter === "ALL" ? undefined : statusFilter,
            );
      setTasks(data);
    } catch (err) {
      setError((err as Error).message);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [scope, statusFilter]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    if (statusFilter === "ALL") return tasks;
    return tasks.filter((task) => task.status === statusFilter);
  }, [statusFilter, tasks]);

  const summary = useMemo(() => {
    const counts: Record<"total" | TaskStatus, number> = {
      total: filteredTasks.length,
      OPEN: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      CANCELLED: 0,
    };

    filteredTasks.forEach((task) => {
      counts[task.status] += 1;
    });

    return counts;
  }, [filteredTasks]);

  const handleUpdateStatus = async (task: TaskItem, status: TaskStatus) => {
    setTaskBusy(task.id, true);
    try {
      await updateTaskStatus(task.id, status);
      if (status === "DONE" && isFeedingTask(task)) {
        notifyFeedingTaskCompleted(task.id);
      }
      toast.success(`Task moved to ${status}`);
      await loadTasks();
    } catch (err) {
      toast.error(`Failed to update task: ${(err as Error).message}`);
    } finally {
      setTaskBusy(task.id, false);
    }
  };

  const handleDeleteTask = async (task: TaskItem) => {
    setTaskBusy(task.id, true);
    try {
      await deleteTask(task.id);
      toast.success("Task cancelled");
      await loadTasks();
    } catch (err) {
      toast.error(`Failed to cancel task: ${(err as Error).message}`);
    } finally {
      setTaskBusy(task.id, false);
    }
  };
  const isWorker = user.role.toLowerCase() === "worker";
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-sm text-gray-600">
            Track and complete operational tasks assigned from alerts and
            workflows.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void loadTasks()}
          disabled={loading}
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-center">
          {canViewFarmTasks && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={scope === "farm" ? "default" : "outline"}
                onClick={() => setScope("farm")}
              >
                Farm Tasks
              </Button>
              <Button
                size="sm"
                variant={scope === "mine" ? "default" : "outline"}
                onClick={() => setScope("mine")}
              >
                My Tasks
              </Button>
            </div>
          )}

          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "ALL" | TaskStatus)
            }
          >
            <option value="ALL">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {summary.total}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Open</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-blue-700">
            {summary.OPEN}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-700">
            {summary.IN_PROGRESS}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Done</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-700">
            {summary.DONE}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {scope === "farm" ? "Farm Task Queue" : "My Assigned Tasks"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && (
            <div className="text-sm text-gray-600">Loading tasks...</div>
          )}

          {!loading && error && (
            <div className="text-sm text-red-700">
              Failed to load tasks: {error}
            </div>
          )}

          {!loading && !error && filteredTasks.length === 0 && (
            <div className="py-10 text-center text-gray-500">
              <ListChecks className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p>No tasks found for the selected filter.</p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredTasks.map((task) => {
              const isBusy = !!busyTaskIds[task.id];
              const canStart = task.status === "OPEN";
              const canComplete =
                task.status === "OPEN" || task.status === "IN_PROGRESS";
              const canCancel =
                canCancelTask &&
                task.status !== "DONE" &&
                task.status !== "CANCELLED";

              return (
                <div key={task.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {task.title.replace("Feed Tank ", "Feed Tank : ")}
                      </p>
                      <Badge
                        className={STATUS_BADGE_CLASS[task.status]}
                        variant="outline"
                      >
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">ID: {task.id}</p>
                  </div>

                  <p className="text-sm text-gray-700">
                    {task.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                    <p>Assigned To: {task.assignedToUserId || "N/A"}</p>
                    <p>Due: {formatDateTime(task.dueAt)}</p>
                    <p>Created: {formatDateTime(task.createdAt)}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canStart && isWorker && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() =>
                          void handleUpdateStatus(task, "IN_PROGRESS")
                        }
                      >
                        <Clock3 className="w-3 h-3 mr-1" />
                        Start
                      </Button>
                    )}

                    {canComplete && isWorker && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        onClick={() => void handleUpdateStatus(task, "DONE")}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Mark Done
                      </Button>
                    )}

                    {canCancel && isWorker && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        disabled={isBusy}
                        onClick={() => void handleDeleteTask(task)}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
