import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Activity, Cpu, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { listIotDevices, SensorReadingEvent, subscribeToTankSensorStream } from '../../../services/iotApi';

interface SensorTabProps {
  tank: any;
}

const SENSOR_READING_STALE_MS = 5 * 60 * 1000;

export function SensorTab({ tank }: SensorTabProps) {
  const tankId = String(tank?.id || '');
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [registeredDeviceIds, setRegisteredDeviceIds] = useState<string[]>([]);
  const [streamConnected, setStreamConnected] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [lastReading, setLastReading] = useState<SensorReadingEvent | null>(null);

  const loadRegisteredDevices = useCallback(async () => {
    if (!tankId) {
      setRegisteredDeviceIds([]);
      return;
    }

    setLoadingDevices(true);
    setDevicesError(null);

    try {
      const devices = await listIotDevices();
      const deviceIds = devices
        .filter((entry) => String(entry.tank_id) === tankId)
        .map((entry) => entry.device_id);
      setRegisteredDeviceIds(deviceIds);
    } catch (error) {
      setRegisteredDeviceIds([]);
      setDevicesError((error as Error).message || 'Failed to load sensor registration.');
    } finally {
      setLoadingDevices(false);
    }
  }, [tankId]);

  useEffect(() => {
    void loadRegisteredDevices();
  }, [loadRegisteredDevices]);

  const hasRegisteredSensor = registeredDeviceIds.length > 0;
  const hasFreshReading = useMemo(() => {
    if (!lastReading?.timestamp) return false;
    const readingTime = new Date(lastReading.timestamp).getTime();
    return Number.isFinite(readingTime) && Date.now() - readingTime <= SENSOR_READING_STALE_MS;
  }, [lastReading]);
  const isSensorLive = hasRegisteredSensor && streamConnected && hasFreshReading;

  useEffect(() => {
    setStreamConnected(false);
    setStreamError(null);
    setLastReading(null);

    if (!tankId || !hasRegisteredSensor) {
      return;
    }

    const unsubscribe = subscribeToTankSensorStream({
      tankId,
      onSensorReading: (reading) => {
        setLastReading(reading);
        setStreamError(null);
      },
      onConnectionStatusChange: (isConnected) => {
        setStreamConnected(isConnected);
      },
      onError: () => {
        setStreamConnected(false);
        setStreamError('Sensor stream is unavailable right now.');
      },
    });

    return () => {
      unsubscribe();
    };
  }, [tankId, hasRegisteredSensor]);

  const statusLabel = isSensorLive
    ? 'Live sensor connected'
    : hasRegisteredSensor
      ? 'Sensor registered but not streaming data'
      : 'No sensor registered';
  const statusClass = isSensorLive
    ? 'bg-green-100 text-green-800 border-green-200'
    : hasRegisteredSensor
      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
      : 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[#0A4D68]" />
            Sensor Status
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => void loadRegisteredDevices()} disabled={loadingDevices}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loadingDevices ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-3 bg-gray-50">
            <p className="text-sm text-gray-600">
              Tank: <span className="font-medium text-gray-900">{tank?.name || 'Unknown tank'}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">ID: {tankId || '-'}</p>
          </div>

          <Badge variant="outline" className={statusClass}>
            {isSensorLive ? <Wifi className="h-3.5 w-3.5 mr-1" /> : <WifiOff className="h-3.5 w-3.5 mr-1" />}
            {statusLabel}
          </Badge>

          {devicesError && <p className="text-sm text-red-600">{devicesError}</p>}
          {streamError && <p className="text-sm text-red-600">{streamError}</p>}

          <div className="space-y-2">
            <p className="text-sm font-medium">Registered Devices</p>
            {registeredDeviceIds.length === 0 ? (
              <p className="text-sm text-gray-500">No devices are currently linked to this tank.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {registeredDeviceIds.map((deviceId) => (
                  <Badge key={deviceId} variant="secondary" className="font-mono text-xs">
                    {deviceId}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-[#0A4D68]" />
              Latest Reading
            </p>
            {lastReading ? (
              <div className="text-sm space-y-1">
                <p>
                  Temperature: <span className="font-semibold">{lastReading.temperature} C</span>
                </p>
                <p>
                  Turbidity: <span className="font-semibold">{lastReading.turbidity_ntu} NTU</span>
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(lastReading.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {hasRegisteredSensor
                  ? 'Waiting for the first live reading from the registered sensor.'
                  : 'Register a sensor to start receiving live readings.'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
