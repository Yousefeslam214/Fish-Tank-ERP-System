import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Users, UserPlus, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  assignUserToTank,
  getFarmUsers,
  getTankAssignedUserIds,
  TankAssignableUser,
  unassignUserFromTank,
} from '../../../services/tankAssignmentApi';

interface TankAssignmentsTabProps {
  tank: any;
  user: any;
}

const isWorkerRole = (role: string) => {
  const normalized = String(role || '').trim().toUpperCase();
  return normalized === 'WORKER';
};

export function TankAssignmentsTab({ tank, user }: TankAssignmentsTabProps) {
  const farmId = tank?.farmId || user?.farmId || '';
  const storageKey = `tank-assignments:${farmId || 'global'}`;

  const [farmUsers, setFarmUsers] = useState<TankAssignableUser[]>([]);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readLocalAssignments = useCallback((): string[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Record<string, string[]>;
      return Array.isArray(parsed?.[tank.id]) ? parsed[tank.id] : [];
    } catch {
      return [];
    }
  }, [storageKey, tank.id]);

  const saveLocalAssignments = useCallback(
    (ids: string[]) => {
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? (JSON.parse(raw) as Record<string, string[]>) : {};
        parsed[tank.id] = ids;
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      } catch {
        // ignore local storage failures
      }
    },
    [storageKey, tank.id],
  );

  const loadData = useCallback(async () => {
    if (!tank?.id) return;
    if (!farmId) {
      setError('Farm ID is missing for this tank');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [usersResult, assignedResult] = await Promise.allSettled([
        getFarmUsers(farmId),
        getTankAssignedUserIds(tank.id),
      ]);

      if (usersResult.status === 'fulfilled') {
        setFarmUsers(usersResult.value);
      } else {
        setFarmUsers([]);
      }

      if (assignedResult.status === 'fulfilled') {
        setAssignedUserIds(assignedResult.value);
        saveLocalAssignments(assignedResult.value);
      } else {
        const local = readLocalAssignments();
        setAssignedUserIds(local);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [farmId, readLocalAssignments, saveLocalAssignments, tank?.id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const availableUsers = useMemo(
    () =>
      farmUsers.filter(
        (item) => !assignedUserIds.includes(item.id) && isWorkerRole(item.role),
      ),
    [farmUsers, assignedUserIds],
  );

  const assignedUsers = useMemo(
    () =>
      assignedUserIds
        .map(
          (id) =>
            farmUsers.find((u) => u.id === id) || {
              id,
              name: `User ${id.slice(0, 6)}`,
              role: 'UNKNOWN',
            },
        )
        .filter((member) => isWorkerRole(member.role) || member.role === 'UNKNOWN'),
    [assignedUserIds, farmUsers],
  );

  const handleAssign = async () => {
    if (!selectedAssignee) return;
    setBusy(true);
    try {
      await assignUserToTank(tank.id, selectedAssignee);
      const refreshed = await getTankAssignedUserIds(tank.id).catch(() => [...assignedUserIds, selectedAssignee]);
      const unique = Array.from(new Set(refreshed));
      setAssignedUserIds(unique);
      saveLocalAssignments(unique);
      setSelectedAssignee('');
      toast.success('Worker assigned successfully');
    } catch (err) {
      toast.error(`Failed to assign worker: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleUnassign = async (userId: string) => {
    setBusy(true);
    try {
      await unassignUserFromTank(tank.id, userId);
      const refreshed = await getTankAssignedUserIds(tank.id).catch(() =>
        assignedUserIds.filter((id) => id !== userId),
      );
      const unique = Array.from(new Set(refreshed));
      setAssignedUserIds(unique);
      saveLocalAssignments(unique);
      toast.success('Worker unassigned successfully');
    } catch (err) {
      toast.error(`Failed to unassign worker: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-[#0A4D68]" />
            Assigned Workers
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              Tank: <span className="font-medium text-gray-900">{tank?.name}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">ID: {tank?.id}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <p className="text-sm font-medium mb-2">Current Team</p>
            <div className="flex flex-wrap gap-2">
              {assignedUsers.length === 0 && (
                <p className="text-sm text-gray-500">No workers assigned yet.</p>
              )}
              {assignedUsers.map((member) => (
                <Badge key={member.id} variant="outline" className="flex items-center gap-2 pr-1">
                  <span>{member.name}</span>
                  <span className="text-[10px] text-gray-500">{member.role}</span>
                  <button
                    type="button"
                    onClick={() => void handleUnassign(member.id)}
                    disabled={busy}
                    className="rounded hover:bg-red-50 text-red-500 disabled:opacity-50"
                    aria-label={`Unassign ${member.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Assign New Worker</p>
            <div className="flex flex-col gap-2 md:flex-row">
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="md:max-w-md">
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => void handleAssign()} disabled={!selectedAssignee || busy}>
                <UserPlus className="mr-1 h-4 w-4" />
                Assign Worker
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
