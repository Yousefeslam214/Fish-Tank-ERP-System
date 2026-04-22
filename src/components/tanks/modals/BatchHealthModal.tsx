import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { HeartPulse, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { apiPatch } from '../../../api';
import { toast } from 'sonner';

interface BatchHealthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: any;
  mode: 'health' | 'quarantine';
  onSuccess?: () => void;
}

export function BatchHealthModal({ open, onOpenChange, batch, mode, onSuccess }: BatchHealthModalProps) {
  const [status, setStatus] = useState<string>(mode === 'health' ? 'HEALTHY' : 'QUARANTINE_REQUESTED');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!batch?.id) return;

    setIsSaving(true);
    try {
      const endpoint = mode === 'health'
        ? `/inventory/batches/${batch.id}/health-check`
        : `/inventory/batches/${batch.id}/quarantine`;

      const payload = mode === 'health'
        ? { status, notes, timestamp: new Date().toISOString() }
        : { reason: notes, status: 'QUARANTINED', timestamp: new Date().toISOString() };

      await apiPatch(endpoint, payload);

      toast.success(mode === 'health' ? 'Health check recorded' : 'Batch moved to quarantine');
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to update: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'health' ? (
              <>
                <HeartPulse className="w-5 h-5 text-rose-500" />
                Record Health Check
              </>
            ) : (
              <>
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                Move to Quarantine
              </>
            )}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            Batch #{batch?.batchNumber || batch?.id?.substring(0, 8)}
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {mode === 'health' && (
            <div className="grid gap-2">
              <Label htmlFor="status">Condition Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HEALTHY">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Healthy / Normal</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="RECOVERING">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                      <span>Recovering</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ISSUE_DETECTED">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span>Issue Detected</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SICK">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span>Sick / Needs Treatment</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">{mode === 'health' ? 'Observations & Notes' : 'Reason for Quarantine'}</Label>
            <Textarea
              id="notes"
              placeholder={mode === 'health' ? "e.g. Activity level good, no visible spots..." : "e.g. Suspected parasite infection, separating for observation..."}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-24"
            />
          </div>

          {mode === 'quarantine' && (
            <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg">
              <p className="text-xs text-orange-800">
                <strong>Warning:</strong> Quarantining a batch marks it as requiring isolation. Feeding and monitoring protocols may be adjusted automatically.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className={mode === 'health' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-orange-600 hover:bg-orange-700'}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'health' ? 'Record Check' : 'Confirm Quarantine'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
