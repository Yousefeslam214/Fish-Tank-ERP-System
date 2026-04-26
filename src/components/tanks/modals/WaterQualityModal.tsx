import React, { useState, useEffect, useMemo } from 'react';
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
import { listIotDevices, subscribeToTankSensorStream } from '../../../services/iotApi';

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
  const [isSaving, setIsSaving] = useState(false);
  const [sensorConnected, setSensorConnected] = useState(false);
  const [sensorRegistered, setSensorRegistered] = useState(false);
  const [sensorRegistrationLoading, setSensorRegistrationLoading] = useState(false);
  const [sensorStreamConnected, setSensorStreamConnected] = useState(false);
  const [sensorLastReadingAt, setSensorLastReadingAt] = useState<string | null>(null);
  const [sensorDeviceId, setSensorDeviceId] = useState<string | null>(null);
  const [sensorStreamError, setSensorStreamError] = useState<string | null>(null);

  const resolvedTankId = useMemo(() => {
    const selectedBatch = tankBatches.find((entry) => String(entry.id) === String(selectedBatchId));
    const batchTankId =
      selectedBatch?.tankId ||
      selectedBatch?.tank?.id ||
      selectedBatch?.tank_uuid ||
      selectedBatch?.tankUUID;
    return String(batchTankId || tank?.id || '');
  }, [selectedBatchId, tankBatches, tank?.id]);

  const hasFreshReading = useMemo(() => {
    if (!sensorLastReadingAt) return false;
    const readingTime = new Date(sensorLastReadingAt).getTime();
    return Number.isFinite(readingTime) && Date.now() - readingTime <= 5 * 60 * 1000;
  }, [sensorLastReadingAt]);

  const isLiveSensorConnected = sensorRegistered && sensorConnected && sensorStreamConnected && hasFreshReading;
  const isLiveSensorMode = !Boolean(initialRecord) && isLiveSensorConnected;

  useEffect(() => {
    if (open) {
      setSensorConnected(false);
      setSensorRegistered(false);
      setSensorRegistrationLoading(false);
      setSensorStreamConnected(false);
      setSensorLastReadingAt(null);
      setSensorDeviceId(null);
      setSensorStreamError(null);

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
    } else {
      setSensorConnected(false);
      setSensorRegistered(false);
      setSensorRegistrationLoading(false);
      setSensorStreamConnected(false);
      setSensorLastReadingAt(null);
      setSensorDeviceId(null);
      setSensorStreamError(null);
    }
  }, [open, initialRecord, user?.name, batchId, tankBatches]);

  useEffect(() => {
    if (!open || !selectedBatchId || !resolvedTankId || Boolean(initialRecord)) {
      return;
    }

    let cancelled = false;
    setSensorRegistrationLoading(true);
    setSensorRegistered(false);
    setSensorConnected(false);
    setSensorStreamConnected(false);
    setSensorLastReadingAt(null);
    setSensorDeviceId(null);
    setSensorStreamError(null);

    void listIotDevices()
      .then((devices) => {
        if (cancelled) return;
        const hasRegisteredDevice = devices.some((entry) => String(entry.tank_id) === String(resolvedTankId));
        setSensorRegistered(hasRegisteredDevice);
      })
      .catch(() => {
        if (cancelled) return;
        setSensorRegistered(false);
        setSensorStreamError('Unable to verify registered sensors for this tank.');
      })
      .finally(() => {
        if (cancelled) return;
        setSensorRegistrationLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selectedBatchId, resolvedTankId, initialRecord]);

  useEffect(() => {
    if (!open || !selectedBatchId || !resolvedTankId || Boolean(initialRecord) || sensorRegistrationLoading || !sensorRegistered) {
      return;
    }

    const unsubscribe = subscribeToTankSensorStream({
      tankId: resolvedTankId,
      onSensorReading: (reading) => {
        setTemp(reading.temperature.toString());
        setTurbidity(reading.turbidity_ntu.toString());
        setSensorConnected(true);
        setSensorStreamConnected(true);
        setSensorLastReadingAt(reading.timestamp);
        setSensorDeviceId(reading.device_id);
        setSensorStreamError(null);
      },
      onConnectionStatusChange: (isConnected) => {
        setSensorStreamConnected(isConnected);
        if (!isConnected) {
          setSensorConnected(false);
        }
      },
      onError: () => {
        setSensorConnected(false);
        setSensorStreamConnected(false);
        setSensorStreamError('Live sensor stream is currently unavailable.');
      },
    });

    return () => {
      unsubscribe();
    };
  }, [open, selectedBatchId, resolvedTankId, initialRecord, sensorRegistrationLoading, sensorRegistered]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const numTemp = typeof temp === 'string' ? parseFloat(temp) : temp;
      const numDo = typeof doValue === 'string' ? parseFloat(doValue) : doValue;
      const numPh = typeof phValue === 'string' ? parseFloat(phValue) : phValue;
      const numAmmonia = typeof totalAmmonia === 'string' ? parseFloat(totalAmmonia) : totalAmmonia;
      const numNitrite = typeof nitrite === 'string' ? parseFloat(nitrite) : nitrite;
      const numNitrate = typeof nitrate === 'string' ? parseFloat(nitrate) : nitrate;
      const numTurbidity = typeof turbidity === 'string' ? parseFloat(turbidity) : turbidity;

      if (
        isNaN(numTemp as number) ||
        isNaN(numDo as number) ||
        isNaN(numPh as number) ||
        isNaN(numAmmonia as number) ||
        isNaN(numTurbidity as number)
      ) {
        toast.error('Please fill in all required measurement fields with valid numbers.');
        setIsSaving(false);
        return;
      }

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
          turbidity: numTurbidity,
          co2: co2 ? parseFloat(co2.toString()) : 0,
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
          turbidity: numTurbidity,
          co2: co2 ? parseFloat(co2.toString()) : 0,
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

          {!initialRecord && selectedBatchId && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                isLiveSensorConnected
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : sensorRegistered
                    ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      isLiveSensorConnected ? 'bg-green-500' : sensorRegistered ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="font-medium">
                    {sensorRegistrationLoading
                      ? 'Checking sensor registration'
                      : isLiveSensorConnected
                        ? 'Live sensor connected'
                        : sensorRegistered
                          ? 'Sensor registered, waiting for live reading'
                          : 'No sensor registered for this tank'}
                  </span>
                </div>
                {sensorDeviceId && (
                  <span className="text-xs font-mono">Device: {sensorDeviceId}</span>
                )}
              </div>
              <p className="mt-1 text-xs">
                {sensorLastReadingAt
                  ? `Last reading: ${new Date(sensorLastReadingAt).toLocaleString()}`
                  : sensorRegistered
                    ? sensorStreamConnected
                      ? 'Stream connected. Waiting for device data.'
                      : `No active sensor stream for tank ${resolvedTankId}`
                    : 'Register and activate a sensor to receive live readings.'}
              </p>
              {sensorStreamError && <p className="mt-1 text-xs">{sensorStreamError}</p>}
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Required Measurements *</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Temperature *</Label>
                <Input
                  type="number"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  step={0.1}
                  disabled={isLiveSensorMode}
                />
                <p className="text-xs text-gray-600">deg C</p>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Dissolved Oxygen *</Label>
                <Input type="number" value={doValue} onChange={(e) => setDoValue(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">mg/L</p>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">pH *</Label>
                <Input type="number" value={phValue} onChange={(e) => setPhValue(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">-</p>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Total Ammonia (TAN) *</Label>
                <Input type="number" value={totalAmmonia} onChange={(e) => setTotalAmmonia(e.target.value)} step={0.01} />
                <p className="text-xs text-gray-600">mg/L</p>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Nitrite (NO2) *</Label>
                <Input type="number" value={nitrite} onChange={(e) => setNitrite(e.target.value)} step={0.01} />
                <p className="text-xs text-gray-600">mg/L</p>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Nitrate (NO3) *</Label>
                <Input type="number" value={nitrate} onChange={(e) => setNitrate(e.target.value)} step={0.1} />
                <p className="text-xs text-gray-600">mg/L</p>
              </div>

              <div className="border-2 border-blue-200 rounded-lg p-3 space-y-2">
                <Label className="text-sm font-medium">Turbidity *</Label>
                <Input
                  type="number"
                  value={turbidity}
                  onChange={(e) => setTurbidity(e.target.value)}
                  step={0.1}
                  disabled={isLiveSensorMode}
                />
                <p className="text-xs text-gray-600">NTU</p>
              </div>
            </div>
          </div>

      

     

     

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]" disabled={isSaving || tankBatches.length === 0} onClick={handleSave}>
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {initialRecord ? 'Update Reading' : 'Save Water Quality Reading'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
