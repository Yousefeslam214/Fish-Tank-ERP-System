import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { apiPost, apiPatch } from '../../../api';
import { toast } from 'sonner';
import { User } from '../../../types';

interface WaterQualityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tank: any;
  user: User;
  initialRecord?: any;
  batchId?: string;
  tankBatches?: any[];
  onSuccess?: (record: any) => void;
}

export function WaterQualityModal({ open, onOpenChange, tank, user, initialRecord, batchId, tankBatches = [], onSuccess }: WaterQualityModalProps) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [temp, setTemp] = useState<number | string>('');
  const [doValue, setDoValue] = useState<number | string>('');
  const [phValue, setPhValue] = useState<number | string>('');
  const [totalAmmonia, setTotalAmmonia] = useState<number | string>('');
  const [nitrite, setNitrite] = useState<number | string>('');
  const [nitrate, setNitrate] = useState<number | string>('');

  const [salinity, setSalinity] = useState('');
  const [alkalinity, setAlkalinity] = useState('');
  const [hardness, setHardness] = useState('');
  const [turbidity, setTurbidity] = useState('');
  const [co2, setCo2] = useState('');
  const [notes, setNotes] = useState('');
  const [actionTaken, setActionTaken] = useState(false);
  const [measuredBy, setMeasuredBy] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialRecord) {
        setTemp(initialRecord.temperature ?? initialRecord.temp ?? 28.5);
        setDoValue(initialRecord.dissolvedOxygen ?? initialRecord.do ?? 4.2);
        setPhValue(initialRecord.pH ?? initialRecord.ph ?? 7.8);
        setTotalAmmonia(initialRecord.totalAmmonia ?? initialRecord.ammonia ?? 0.15);
        setNitrite(initialRecord.nitrite ?? initialRecord.no2 ?? 0.08);
        setNitrate(initialRecord.nitrate ?? initialRecord.no3 ?? 20);
        setSalinity(initialRecord.salinity?.toString() ?? '');
        setAlkalinity(initialRecord.alkalinity?.toString() ?? '');
        setHardness(initialRecord.hardness?.toString() ?? '');
        setTurbidity(initialRecord.turbidity?.toString() ?? '');
        setCo2(initialRecord.co2?.toString() ?? '');
        setNotes(initialRecord.actionNotes ?? initialRecord.notes ?? '');
        setActionTaken(initialRecord.actionTaken ?? (initialRecord.actionNotes ? true : false));
        setMeasuredBy(initialRecord.measuredBy ?? (user?.name || ''));
      } else {
        setTemp('');
        setDoValue('');
        setPhValue('');
        setTotalAmmonia('');
        setNitrite('');
        setNitrate('');
        setSalinity('');
        setAlkalinity('');
        setHardness('');
        setTurbidity('');
        setCo2('');
        setNotes('');
        setActionTaken(false);
        setMeasuredBy(user?.name || '');
      }

      // Initialize selected batch
      if (initialRecord?.batchId) {
        setSelectedBatchId(initialRecord.batchId.toString());
      } else if (batchId) {
        setSelectedBatchId(batchId.toString());
      } else if (tankBatches && tankBatches.length > 0) {
        setSelectedBatchId(tankBatches[0].id.toString());
      } else {
        setSelectedBatchId('');
      }
    }
  }, [open, initialRecord, user?.name, batchId, tankBatches]);

  const getStatus = (param: string, value: number) => {
    if (param === 'temp') {
      if (value >= 26 && value <= 30) return { status: 'optimal', color: 'bg-green-100 text-green-800' };
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (param === 'do') {
      if (value >= 5) return { status: 'optimal', color: 'bg-green-100 text-green-800' };
      if (value >= 4) return { status: 'acceptable', color: 'bg-yellow-100 text-yellow-800' };
      return { status: 'critical', color: 'bg-red-100 text-red-800' };
    }
    if (param === 'ph') {
      if (value >= 7 && value <= 8.5) return { status: 'optimal', color: 'bg-green-100 text-green-800' };
      return { status: 'warning', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { status: 'good', color: 'bg-gray-100 text-gray-800' };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const numTemp = typeof temp === 'string' ? parseFloat(temp) : temp;
      const numDo = typeof doValue === 'string' ? parseFloat(doValue) : doValue;
      const numPh = typeof phValue === 'string' ? parseFloat(phValue) : phValue;
      const numAmmonia = typeof totalAmmonia === 'string' ? parseFloat(totalAmmonia) : totalAmmonia;
      const numNitrite = typeof nitrite === 'string' ? parseFloat(nitrite) : nitrite;
      const numNitrate = typeof nitrate === 'string' ? parseFloat(nitrate) : nitrate;

      if (isNaN(numTemp as number) || isNaN(numDo as number) || isNaN(numPh as number) || isNaN(numAmmonia as number)) {
        toast.error('Please fill in all required measurement fields with valid numbers.');
        setIsSaving(false);
        return;
      }

      const overallStatus = (numDo < 5 || numAmmonia > 0.5) ? 'WARNING' : 'OPTIMAL';

      if (initialRecord?.id) {
        const updatePayload = {
          temperature: numTemp,
          dissolvedOxygen: numDo,
          pH: numPh,
          totalAmmonia: numAmmonia,
          nitrite: numNitrite || 0,
          nitrate: numNitrate || 0,
          salinity: salinity ? parseFloat(salinity.toString()) : 0,
          alkalinity: alkalinity ? parseFloat(alkalinity.toString()) : 0,
          hardness: hardness ? parseFloat(hardness.toString()) : 0,
          turbidity: turbidity ? parseFloat(turbidity.toString()) : 0,
          co2: co2 ? parseFloat(co2.toString()) : 0,
          overallStatus: overallStatus,
          actionTaken: actionTaken,
          actionNotes: notes || ''
        };
        await apiPatch(`/tanks/water-quality/${initialRecord.id}`, updatePayload);
        toast.success('Water quality record updated');
        if (onSuccess) onSuccess(updatePayload);
      } else {
        const payload: any = {
          temperature: numTemp,
          dissolvedOxygen: numDo,
          pH: numPh,
          totalAmmonia: numAmmonia,
          nitrite: numNitrite || 0,
          nitrate: numNitrate || 0,
          salinity: salinity ? parseFloat(salinity.toString()) : 0,
          alkalinity: alkalinity ? parseFloat(alkalinity.toString()) : 0,
          hardness: hardness ? parseFloat(hardness.toString()) : 0,
          turbidity: turbidity ? parseFloat(turbidity.toString()) : 0,
          co2: co2 ? parseFloat(co2.toString()) : 0,
          measuredAt: new Date().toISOString(),
          overallStatus: overallStatus,
          measuredBy: measuredBy || user?.name || ''
        };
        if (!selectedBatchId) {
          throw new Error('Please select a batch to record water quality for.');
        }
        const res = await apiPost<any>(`/tanks/water-quality/${selectedBatchId}`, payload);
        toast.success('Water quality record saved');
        if (onSuccess) onSuccess(res?.data || res || payload);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to save: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialRecord ? 'Edit' : 'Record'} Water Quality - {tank?.name}</DialogTitle>
          <p className="text-sm text-gray-600">
            {initialRecord ? `Editing record from ${new Date(initialRecord.measuredAt || initialRecord.createdAt).toLocaleString()}` : 'Last Reading: 4 hours ago'}
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {tankBatches.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3 text-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-bold">No Active Batches Found</p>
                <p>You cannot record water quality for a tank without active batches. Please stock the tank first.</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <Label className="text-sm font-bold text-gray-700 mb-2 block">Target Batch *</Label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger className="bg-white border-gray-200 h-11">
                  <SelectValue placeholder="Identify batch" />
                </SelectTrigger>
                <SelectContent>
                  {tankBatches.map(b => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      Batch {b.batchNumber || b.id.toString().substring(0, 8)} ({(b.counts?.current ?? b.currentCount ?? 0).toLocaleString()} fish)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Required Measurements *</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Temperature *</Label>
                <Input type="number" value={temp} onChange={(e) => setTemp(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">°C</p>
                {temp !== '' && (
                  <div className={`text-xs px-2 py-1 rounded ${getStatus('temp', typeof temp === 'string' ? parseFloat(temp) : temp).color}`}>
                    {parseFloat(temp.toString()) >= 26 && parseFloat(temp.toString()) <= 30 ? '✅' : '🟡'} {getStatus('temp', typeof temp === 'string' ? parseFloat(temp) : temp).status.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Dissolved Oxygen *</Label>
                <Input type="number" value={doValue} onChange={(e) => setDoValue(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">mg/L</p>
                {doValue !== '' && (
                  <div className={`text-xs px-2 py-1 rounded ${getStatus('do', typeof doValue === 'string' ? parseFloat(doValue) : doValue).color}`}>
                    {parseFloat(doValue.toString()) >= 5 ? '✅' : parseFloat(doValue.toString()) >= 4 ? '🟡' : '🔴'} {getStatus('do', typeof doValue === 'string' ? parseFloat(doValue) : doValue).status.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">pH *</Label>
                <Input type="number" value={phValue} onChange={(e) => setPhValue(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">-</p>
                {phValue !== '' && (
                  <div className={`text-xs px-2 py-1 rounded ${getStatus('ph', typeof phValue === 'string' ? parseFloat(phValue) : phValue).color}`}>
                    {parseFloat(phValue.toString()) >= 7 && parseFloat(phValue.toString()) <= 8.5 ? '✅' : '🟡'} {getStatus('ph', typeof phValue === 'string' ? parseFloat(phValue) : phValue).status.toUpperCase()}
                  </div>
                )}
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Total Ammonia (TAN) *</Label>
                <Input type="number" value={totalAmmonia} onChange={(e) => setTotalAmmonia(e.target.value)} step={0.01} />
                <p className="text-xs text-gray-600">mg/L</p>
                {totalAmmonia !== '' && (
                  <div className={`text-xs px-2 py-1 rounded ${parseFloat(totalAmmonia.toString()) < 0.5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {parseFloat(totalAmmonia.toString()) < 0.5 ? '✅ SAFE' : '🔴 HIGH'}
                  </div>
                )}
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Nitrite (NO₂) *</Label>
                <Input type="number" value={nitrite} onChange={(e) => setNitrite(e.target.value)} step={0.01} />
                <p className="text-xs text-gray-600">mg/L</p>
                {nitrite !== '' && (
                  <div className={`text-xs px-2 py-1 rounded ${parseFloat(nitrite.toString()) < 0.2 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {parseFloat(nitrite.toString()) < 0.2 ? '✅ SAFE' : '🟡 ELEVATED'}
                  </div>
                )}
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Nitrate (NO₃) *</Label>
                <Input type="number" value={nitrate} onChange={(e) => setNitrate(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">mg/L</p>
                {nitrate !== '' && (
                  <div className={`text-xs px-2 py-1 rounded ${parseFloat(nitrate.toString()) < 50 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {parseFloat(nitrate.toString()) < 50 ? '✅ SAFE' : '🟡 HIGH'}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs">
              <p><strong>Note:</strong> Toxic Ammonia (NH₃), DO Saturation %, and CO₂ Content will be calculated automatically by the system based on temperature, pH, and TAN values.</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Optional Measurements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">Salinity</Label>
                <Input type="number" placeholder="Optional" value={salinity} onChange={(e) => setSalinity(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">ppt</p>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">Alkalinity</Label>
                <Input type="number" placeholder="Optional" value={alkalinity} onChange={(e) => setAlkalinity(e.target.value)} step={1} />
                <p className="text-xs text-gray-600">mg/L CaCO₃</p>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">Hardness</Label>
                <Input type="number" placeholder="Optional" value={hardness} onChange={(e) => setHardness(e.target.value)} step={1} />
                <p className="text-xs text-gray-600">mg/L CaCO₃</p>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">Turbidity</Label>
                <Input type="number" placeholder="Optional" value={turbidity} onChange={(e) => setTurbidity(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">NTU</p>
              </div>

              <div className="border rounded-lg p-3 space-y-2">
                <Label className="text-sm">CO₂ (Direct)</Label>
                <Input type="number" placeholder="Optional" value={co2} onChange={(e) => setCo2(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">mg/L</p>
              </div>
            </div>
          </div>

          <div>
            <Label>Measured By</Label>
            <Input
              value={measuredBy}
              onChange={(e) => setMeasuredBy(e.target.value)}
              placeholder="e.g. Ahmed Mohamed"
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold text-blue-900">Corrective Action Taken</Label>
              <p className="text-xs text-blue-600">Toggle on if you performed a water change, added chemicals, etc.</p>
            </div>
            <Switch checked={actionTaken} onCheckedChange={setActionTaken} />
          </div>

          <div>
            <Label>Action Notes {actionTaken && '*'}</Label>
            <Textarea
              placeholder={actionTaken ? "What exactly did you do? (required when action taken)" : "Any additional observations? (optional)"}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={actionTaken && !notes ? "border-amber-300 bg-amber-50" : ""}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]" disabled={isSaving || tankBatches.length === 0} onClick={handleSave}>
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : (initialRecord ? <Save className="w-4 h-4 mr-2" /> : '💾')}
              {initialRecord ? 'Update Reading' : 'Save Water Quality Reading'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
