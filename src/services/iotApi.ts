import { fetchEventSource } from '@microsoft/fetch-event-source';
import { getAccessToken } from './authSession';
import { asArray, asRecord, asString, requestJson, resolveApiBaseUrl, unwrapApiData } from './httpClient';

export interface RegisterDeviceRequest {
  device_id: string;
  tank_id: string;
}

export interface DeviceRegistration {
  device_id: string;
  tank_id: string;
  registered_at: string;
}

export interface SensorReadingEvent {
  type: 'sensor_reading';
  temperature: number;
  turbidity_ntu: number;
  ph: number;
  device_id: string;
  timestamp: string;
}

export interface ConnectedEvent {
  type: 'connected';
  tankId: string;
  connectionId?: string;
}

interface IotWrappedResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
  count?: number;
}

const normalizeDeviceRegistration = (value: unknown): DeviceRegistration | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const deviceId = asString(record.device_id);
  const tankId = asString(record.tank_id);
  const registeredAt = asString(record.registered_at);
  if (!deviceId || !tankId || !registeredAt) {
    return null;
  }

  return {
    device_id: deviceId,
    tank_id: tankId,
    registered_at: registeredAt,
  };
};

export const registerIotDevice = async (payload: RegisterDeviceRequest): Promise<DeviceRegistration> => {
  const response = await requestJson<IotWrappedResponse<unknown>>('/iot/devices/register', {
    method: 'POST',
    body: payload,
  });
  const normalized = normalizeDeviceRegistration(unwrapApiData(response));
  if (!normalized) {
    throw new Error('Malformed register device response.');
  }
  return normalized;
};

export const listIotDevices = async (): Promise<DeviceRegistration[]> => {
  const response = await requestJson<IotWrappedResponse<unknown>>('/iot/devices');
  const data = unwrapApiData<unknown>(response);
  return asArray(data)
    .map(normalizeDeviceRegistration)
    .filter((entry): entry is DeviceRegistration => entry !== null);
};

export const unregisterIotDevice = async (deviceId: string): Promise<void> => {
  await requestJson(`/iot/devices/${encodeURIComponent(deviceId)}`, {
    method: 'DELETE',
  });
};

interface SubscribeToTankSensorStreamParams {
  tankId: string;
  onConnected?: (event: ConnectedEvent) => void;
  onSensorReading?: (event: SensorReadingEvent) => void;
  onConnectionStatusChange?: (isConnected: boolean) => void;
  onError?: (error: unknown) => void;
}

const parseSensorReading = (value: unknown): SensorReadingEvent | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const temperature = Number(record.temperature);
  const turbidity = Number(record.turbidity_ntu);
  const ph = Number(record.ph);
  const deviceId = asString(record.device_id);
  const timestamp = asString(record.timestamp);
  if (!Number.isFinite(temperature) || !Number.isFinite(turbidity) || !Number.isFinite(ph) || !deviceId || !timestamp) {
    return null;
  }

  return {
    type: 'sensor_reading',
    temperature,
    turbidity_ntu: turbidity,
    ph: ph,
    device_id: deviceId,
    timestamp,
  };
};

const parseConnectedEvent = (value: unknown): ConnectedEvent | null => {
  const record = asRecord(value);
  if (!record) {
    return null;
  }

  const type = asString(record.type);
  const tankId = asString(record.tankId);
  if (type !== 'connected' || !tankId) {
    return null;
  }

  return {
    type: 'connected',
    tankId,
    connectionId: asString(record.connectionId),
  };
};

export const subscribeToTankSensorStream = ({
  tankId,
  onConnected,
  onSensorReading,
  onConnectionStatusChange,
  onError,
}: SubscribeToTankSensorStreamParams): (() => void) => {
  const token = getAccessToken();
  const controller = new AbortController();
  let mounted = true;

  void fetchEventSource(`${resolveApiBaseUrl()}/iot/stream/${encodeURIComponent(tankId)}`, {
    method: 'GET',
    signal: controller.signal,
    openWhenHidden: true,
    headers: {
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    onopen(response) {
      if (!response.ok) {
        throw new Error(`SSE connection failed with status ${response.status}`);
      }
      if (mounted) {
        onConnectionStatusChange?.(true);
      }
    },
    onmessage(message) {
      if (!mounted || !message.data) {
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(message.data);
      } catch {
        return;
      }

      const connected = parseConnectedEvent(parsed);
      if (connected) {
        onConnected?.(connected);
        onConnectionStatusChange?.(true);
        return;
      }

      const reading = parseSensorReading(parsed);
      if (reading) {
        onSensorReading?.(reading);
        onConnectionStatusChange?.(true);
      }
    },
    onerror(error) {
      if (!mounted) {
        return;
      }
      onConnectionStatusChange?.(false);
      onError?.(error);
    },
    onclose() {
      if (!mounted) {
        return;
      }
      onConnectionStatusChange?.(false);
    },
  });

  return () => {
    mounted = false;
    controller.abort();
  };
};
