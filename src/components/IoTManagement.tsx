import { useState, useEffect } from "react";
import { User, Farm, Tank } from "../types";
import { apiGet } from "../api";
import {
  registerIotDevice,
  listIotDevices,
  unregisterIotDevice,
  subscribeToTankSensorStream,
  DeviceRegistration,
  SensorReadingEvent,
} from "../services/iotApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import {
  Activity,
  Cpu,
  Database,
  RefreshCw,
  Trash2,
  Thermometer,
  Droplets,
  Link,
  ShieldCheck,
} from "lucide-react";

interface Props {
  user: User;
  selectedFarm: Farm | null;
}

const SPECIFIC_DEVICE_ID = "44:1D:64:F8:05:F4";

export default function IoTManagement({ user, selectedFarm }: Props) {
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [registrations, setRegistrations] = useState<DeviceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTankId, setSelectedTankId] = useState<string>("");
  const [deviceIdInput, setDeviceIdInput] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [liveReading, setLiveReading] = useState<SensorReadingEvent | null>(
    null
  );
  const [streamConnected, setStreamConnected] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedFarm]);

  // Subscribe to live stream for selected tank
  useEffect(() => {
    if (!selectedTankId) {
      setLiveReading(null);
      setStreamConnected(false);
      return;
    }

    const unsubsribe = subscribeToTankSensorStream({
      tankId: selectedTankId,
      onSensorReading: (evt) => setLiveReading(evt),
      onConnectionStatusChange: (status) => setStreamConnected(status),
      onError: (err) => console.error("SSE Error:", err),
    });

    return () => unsubsribe();
  }, [selectedTankId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tanksRes, regs] = await Promise.all([
        apiGet<Tank[] | { data: Tank[] }>("/tanks"),
        listIotDevices(),
      ]);
      const tanksData = Array.isArray(tanksRes) ? tanksRes : tanksRes.data;
      setTanks(tanksData || []);
      setRegistrations(regs);
    } catch (err) {
      console.error("Failed to fetch IoT data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTankId) {
      alert("Please select a tank first.");
      return;
    }
    if (!deviceIdInput) {
      alert("Please enter a device ID.");
      return;
    }
    setIsRegistering(true);
    try {
      await registerIotDevice({
        device_id: deviceIdInput,
        tank_id: selectedTankId,
      });
      setDeviceIdInput("");
      await fetchData();
      alert("Device registered successfully!");
    } catch (err) {
      alert("Failed to register device: " + (err as Error).message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async (deviceId: string) => {
    if (!confirm("Are you sure you want to unregister this device?")) return;
    try {
      await unregisterIotDevice(deviceId);
      await fetchData();
    } catch (err) {
      alert("Failed to unregister: " + (err as Error).message);
    }
  };

  const tanksWithDevices = tanks.filter((t) =>
    registrations.some((r) => r.tank_id === t.id)
  );

  const selectedTank = tanks.find((t) => t.id === selectedTankId);
  const selectedTankRegs = registrations.filter(
    (r) => r.tank_id === selectedTankId
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-blue-600" />
            IoT Management
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your farm's sensors and real-time monitoring
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchData()}
          disabled={loading}
          className="rounded-xl border-gray-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration Section */}
        <Card className="lg:col-span-1 shadow-sm border-none rounded-2xl overflow-hidden ring-1 ring-gray-200">
          <CardHeader className="bg-white border-b border-gray-50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-500" />
              Assign New Device
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Tank</label>
                <Select value={selectedTankId} onValueChange={setSelectedTankId}>
                  <SelectTrigger className="rounded-xl bg-gray-50 border-gray-100">
                    <SelectValue placeholder="Chose a tank" />
                  </SelectTrigger>
                  <SelectContent>
                    {tanks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Device ID (MAC)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="FF:FF:FF:FF:FF:FF"
                      value={deviceIdInput}
                      onChange={(e) => setDeviceIdInput(e.target.value)}
                      className="rounded-xl bg-gray-50 border-gray-100 font-mono text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 transition-all font-semibold h-12 text-white shadow-lg"
                  disabled={isRegistering}
                >
                  {isRegistering ? (
                    <RefreshCw className="animate-spin mr-2" />
                  ) : (
                    <ShieldCheck className="mr-2 w-5 h-5" />
                  )}
                  Register Device
                </Button>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Suggested Device</p>
                    <p className="text-sm font-mono mt-1 text-blue-900">{SPECIFIC_DEVICE_ID}</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setDeviceIdInput(SPECIFIC_DEVICE_ID)}
                    className="bg-white text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm border border-blue-100"
                  >
                    Select
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Live Monitoring & Assigned Devices */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTankId && (
            <Card className="shadow-lg border-none rounded-2xl overflow-hidden ring-1 ring-gray-200">
              <CardHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500 font-bold" />
                  Live Monitoring: {selectedTank?.name}
                </CardTitle>
                <Badge
                  variant={streamConnected ? "outline" : "secondary"}
                  className={`rounded-full px-4 py-1 flex items-center gap-2 ${streamConnected ? "bg-emerald-100 text-emerald-700 animate-pulse border-emerald-200" : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${streamConnected ? "bg-emerald-500" : "bg-gray-400"}`} />
                  {streamConnected ? "Live" : "Connecting..."}
                </Badge>
              </CardHeader>
              <CardContent className="p-8">
                
              </CardContent>
            </Card>
          )}

          {/* Tanks with Devices Table */}
          <Card className="shadow-sm border-none rounded-2xl overflow-hidden ring-1 ring-gray-200">
            <CardHeader className="bg-white border-b border-gray-50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Database className="w-5 h-5 text-gray-400" />
                Active Device Mappings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Tank Name</th>
                      <th className="px-6 py-4">Device ID</th>
                      <th className="px-6 py-4">Assigned At</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tanksWithDevices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          <Cpu className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p className="text-sm font-medium">No devices currently assigned</p>
                        </td>
                      </tr>
                    ) : (
                      tanksWithDevices.map((tank) => {
                        const reg = registrations.find(
                          (r) => r.tank_id === tank.id
                        );
                        return (
                          <tr
                            key={tank.id}
                            className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                            onClick={() => setSelectedTankId(tank.id)}
                          >
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{tank.name}</div>
                              <div className="text-xs text-gray-500">Capacity: {tank.capacity}L</div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className="bg-white border text-blue-600 font-mono border-blue-100 rounded-lg">
                                {reg?.device_id}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {reg?.registered_at ? new Date(reg.registered_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  handleUnregister(reg?.device_id || "");
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
