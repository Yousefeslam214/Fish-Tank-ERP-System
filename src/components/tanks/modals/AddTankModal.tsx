import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { RefreshCw, Plus } from 'lucide-react';

interface AddTankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { name: string; capacity: number; volume: number; location: string }) => Promise<void>;
}

export function AddTankModal({
  open,
  onOpenChange,
  onConfirm
}: AddTankModalProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState(5000);
  const [volume, setVolume] = useState(50);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onConfirm({ name, capacity, volume, location });
      setName('');
      setLocation('');
      setCapacity(5000);
      setVolume(50);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Tank</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tank-name">Tank Name *</Label>
            <Input
              id="tank-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tank A-05"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tank-location">Location *</Label>
            <Input
              id="tank-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Section A"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tank-capacity">Capacity (kg) *</Label>
              <Input
                id="tank-capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tank-volume">Volume (m³) *</Label>
              <Input
                id="tank-volume"
                type="number"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                required
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-[#088395] hover:bg-[#0A4D68]" disabled={isSaving}>
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Tank
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
