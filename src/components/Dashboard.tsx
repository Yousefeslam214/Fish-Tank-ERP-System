// ============================================================
// Dashboard.tsx  –  Hazem Yasser
// ============================================================
// WHY useEffect + fetch?
//   The dashboard must show live data the moment it loads. We
//   call GET /api/v1/dashboard inside a useEffect so React first
//   renders the skeleton/loading UI and then hydrates it with
//   real numbers when the API responds. This avoids a blank
//   screen AND keeps the UI responsive while waiting.
//
// WHY keep mockFarms for the farm-selector?
//   The /dashboard endpoint does not return a list of all farms
//   the user belongs to – that requires a separate /farms route
//   which is not yet part of Hazem's task scope. The farm dropdown
//   is therefore still backed by mockFarms so the rest of the app
//   (tank management, etc.) can still receive a selectedFarm prop.
// ============================================================

import { useState, useEffect, useRef } from "react";
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
import { Progress } from "./ui/progress";
import {
  Fish,
  Scale,
  Wheat,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Wifi,
  WifiOff,
  Thermometer,
  Zap,
  Activity,
} from "lucide-react";
import { User, Farm } from "../types";
import { mockFarms } from "../mockData";
import { apiGet } from "../api";
import {
  subscribeToTankSensorStream,
  SensorReadingEvent,
} from "../services/iotApi";

// ── Types that mirror the actual /api/v1/dashboard response shape ──
interface DashboardFishSummary {
  totalActiveFish: string | number; // API returns string "12,500" with comma!
  totalBiomassKg: number;
  biomassCapacityPercentage?: number;
  activeTanks?: number;
  totalTanks?: number;
}
interface DashboardFeedStock {
  totalStockKg: number;
  estimatedDaysRemaining?: number;
  feedStockRemainingLabel?: string;
}
interface DashboardPredictedRevenue {
  totalProjectedRevenue: number;
  nextHarvestRevenue?: number;
  nearestHarvestDate?: string;
  nextHarvestDateFormatted?: string;
}
interface DashboardUpcomingHarvest {
  tankName: string;
  estimatedWeight?: number;
  projectedRevenue?: number;
  earliestHarvestDate?: string;
  batches?: { fishType?: string; daysToHarvest?: number; status?: string }[];
}
interface DashboardWaterAlert {
  tankName?: string;
  parameter?: string;
  value?: string | number;
  status?: string;
}
interface DashboardData {
  fishSummary?: DashboardFishSummary;
  feedStock?: DashboardFeedStock;
  predictedRevenue?: DashboardPredictedRevenue;
  upcomingHarvests?: DashboardUpcomingHarvest[];
  waterQualityAlerts?: DashboardWaterAlert[];
}

interface DashboardProps {
  user: User;
  selectedFarm: Farm | null;
}

// ── Sensor threshold helpers ──
type StatusLevel = "optimal" | "acceptable" | "warning" | "critical";

const getTemperatureStatus = (temp: number): StatusLevel => {
  if (temp >= 22 && temp <= 28) return "optimal";
  if ((temp >= 18 && temp < 22) || (temp > 28 && temp <= 30))
    return "acceptable";
  if ((temp >= 15 && temp < 18) || (temp > 30 && temp <= 32)) return "warning";
  return "critical";
};
const getPhStatus = (ph: number): StatusLevel => {
  if (ph >= 7.0 && ph <= 8.0) return "optimal";
  if ((ph >= 6.5 && ph < 7.0) || (ph > 8.0 && ph <= 8.5)) return "acceptable";
  if ((ph >= 6.0 && ph < 6.5) || (ph > 8.5 && ph <= 9.0)) return "warning";
  return "critical";
};
const getTurbidityStatus = (ntu: number): StatusLevel => {
  if (ntu <= 25) return "optimal";
  if (ntu <= 50) return "acceptable";
  if (ntu <= 150) return "warning";
  return "critical";
};

function SensorBadge({ status }: { status: StatusLevel }) {
  return (
    <Badge
      className={`text-[10px] font-bold px-2 py-0.5 w-fit ${
        status === "optimal"
          ? "bg-[#10B981] text-white"
          : status === "acceptable"
            ? "bg-[#3B82F6] text-white"
            : status === "warning"
              ? "bg-[#F59E0B] text-white"
              : "bg-red-600 text-white"
      }`}
    >
      {status.toUpperCase()}
    </Badge>
  );
}

export default function Dashboard({ user, selectedFarm }: DashboardProps) {
  const [currentFarm, setCurrentFarm] = useState<Farm>(
    selectedFarm || mockFarms[0],
  );

  // Update currentFarm if selectedFarm changes from props
  useEffect(() => {
    if (selectedFarm) {
      setCurrentFarm(selectedFarm);
    }
  }, [selectedFarm]);

  // ── API state ──
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [tanks, setTanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // ── Sensor stream state ──
  // ── Sensor stream state ──
  const [liveReadings, setLiveReadings] = useState<
    Record<
      string,
      { reading: SensorReadingEvent; tank: any; connected: boolean }
    >
  >({});
  const disconnectTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  // ── Fetch dashboard data ──
  const fetchDashboard = async (isManual = false) => {
    if (isManual) setLoading(true);
    setError(null);
    try {
      const [dashRes, tanksRes] = await Promise.all([
        apiGet<{ success: boolean; data: DashboardData }>("/dashboard"),
        apiGet<{ success: boolean; data: any[] } | any[]>("/tanks"),
      ]);
      setDashData(dashRes.data);
      const tanksData = Array.isArray(tanksRes) ? tanksRes : tanksRes.data;
      setTanks(tanksData);
      setLastRefreshed(new Date());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dashRes, tanksRes] = await Promise.all([
          apiGet<{ success: boolean; data: DashboardData }>("/dashboard"),
          apiGet<{ success: boolean; data: any[] } | any[]>("/tanks"),
        ]);
        if (!cancelled) {
          setDashData(dashRes.data);
          const tanksData = Array.isArray(tanksRes) ? tanksRes : tanksRes.data;
          setTanks(tanksData);
          setLastRefreshed(new Date());
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [currentFarm.id]);

  // ── Sensor stream subscription ──
  useEffect(() => {
    if (tanks.length === 0) return;

    const cleanups: (() => void)[] = [];

    tanks.forEach((tank) => {
      const tankId = String(tank?.id || "");
      if (!tankId) return;

      console.log(
        "[Dashboard Stream] subscribing to tankId:",
        tankId,
        tank.name,
      );

      const resetDisconnectTimer = () => {
        if (disconnectTimersRef.current[tankId])
          clearTimeout(disconnectTimersRef.current[tankId]);
        disconnectTimersRef.current[tankId] = setTimeout(() => {
          setLiveReadings((prev) =>
            prev[tankId]
              ? { ...prev, [tankId]: { ...prev[tankId], connected: false } }
              : prev,
          );
        }, 5_000);
      };

      const unsubscribe = subscribeToTankSensorStream({
        tankId,
        onSensorReading: (reading) => {
          console.log(
            "[Dashboard Stream] got reading from:",
            tank.name,
            reading,
          );
          setLiveReadings((prev) => ({
            ...prev,
            [tankId]: { reading, tank, connected: true },
          }));
          resetDisconnectTimer();
        },
        onConnectionStatusChange: (isConnected) => {
          setLiveReadings((prev) =>
            prev[tankId]
              ? {
                  ...prev,
                  [tankId]: { ...prev[tankId], connected: isConnected },
                }
              : prev,
          );
          if (isConnected) resetDisconnectTimer();
        },
        onError: () => {
          setLiveReadings((prev) =>
            prev[tankId]
              ? { ...prev, [tankId]: { ...prev[tankId], connected: false } }
              : prev,
          );
        },
      });

      cleanups.push(unsubscribe);
    });

    return () => {
      cleanups.forEach((fn) => fn());
      Object.values(disconnectTimersRef.current).forEach(clearTimeout);
    };
  }, [tanks.length]);

  // ── Resolve safe display values from the real API shape ──
  const rawFish = dashData?.fishSummary?.totalActiveFish ?? 0;
  const totalFish =
    typeof rawFish === "string"
      ? parseInt(rawFish.replace(/,/g, ""), 10)
      : rawFish;
  const totalBiomass = dashData?.fishSummary?.totalBiomassKg ?? 0;
  const biomassCapacityPct =
    dashData?.fishSummary?.biomassCapacityPercentage ?? 0;
  const feedStock = dashData?.feedStock?.totalStockKg ?? 0;
  const feedDaysRemaining = dashData?.feedStock?.estimatedDaysRemaining ?? 0;
  const predictedRevenue =
    dashData?.predictedRevenue?.totalProjectedRevenue ?? 0;
  const nextHarvestDateFormatted =
    dashData?.predictedRevenue?.nextHarvestDateFormatted ?? "TBD";

  const upcomingHarvests = dashData?.upcomingHarvests ?? [];
  const waterAlerts = dashData?.waterQualityAlerts ?? [];
  const nextHarvestStatus = upcomingHarvests[0]?.batches?.[0]?.status;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-[#EF4444] text-white";
      case "warning":
        return "bg-[#F59E0B] text-white";
      case "optimal":
        return "bg-[#10B981] text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "critical":
        return "🔴";
      case "warning":
        return "🟡";
      case "optimal":
        return "🟢";
      default:
        return "⚪";
    }
  };

  // ── Skeleton card used while loading ──
  const SkeletonCard = () => (
    <Card className="bg-white shadow-sm animate-pulse">
      <CardContent className="p-6">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* ── Top Navigation Bar ── */}
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fish className="w-6 h-6" />
            <span className="text-xl font-semibold">Fish Farm 360</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
              <span className="text-sm font-medium">{currentFarm.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-300 capitalize">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#088395] flex items-center justify-center font-semibold">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Page Title + Refresh ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-black-500">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboard(true)}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Failed to load dashboard data
              </p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── KPI Cards ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Active Fish */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Total Active Fish
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalFish.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Across {dashData?.fishSummary?.activeTanks ?? 0} tanks
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#E0F4F5] flex items-center justify-center">
                    <Fish className="w-6 h-6 text-[#088395]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Biomass */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Total Biomass</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {totalBiomass.toLocaleString()} kg
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#E0F4F5] flex items-center justify-center">
                    <Scale className="w-6 h-6 text-[#088395]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feed Stock */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Feed Stock</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {feedStock.toLocaleString()} kg
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Current inventory
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#FEF3C7] flex items-center justify-center">
                    <Wheat className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Tanks */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Tanks</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {dashData?.fishSummary?.totalTanks ?? tanks.length}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {dashData?.fishSummary?.activeTanks ?? 0} active tanks
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Second Row – Sensor Measurements + Upcoming Harvests ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Sensor Measurements Cards */}
          {Object.keys(liveReadings).length === 0 ? (
            <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Cpu className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Sensor Measurements
                    </h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      No active streams
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="grid grid-cols-3 gap-2 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-gray-100 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Cpu className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">
                      Waiting for sensor data…
                    </p>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Stream will connect automatically
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {Object.values(liveReadings)
                .sort((a, b) => Number(b.connected) - Number(a.connected))
                .map(({ reading, tank, connected }) => (
                  <Card
                    key={tank.id}
                    className="bg-white border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900">
                              Sensor Measurements
                            </h4>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                              Active link: {tank?.name || "Tank"}
                            </p>
                          </div>
                        </div>
                        {connected ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-semibold text-emerald-700">
                              🟢 Live
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 rounded-full border border-red-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span className="text-[10px] font-semibold text-red-600">
                              🔴 Offline
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Temperature */}
                        <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              Temp
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-gray-900">
                              {reading.temperature.toFixed(1)}
                            </span>
                            <span className="text-xs font-semibold text-orange-400">
                              °C
                            </span>
                          </div>
                          {connected && (
                            <SensorBadge
                              status={getTemperatureStatus(reading.temperature)}
                            />
                          )}
                        </div>

                        {/* pH */}
                        <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 text-green-500" />
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              pH Level
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-gray-900">
                              {reading.ph.toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-green-500">
                              —
                            </span>
                          </div>
                          {connected && (
                            <SensorBadge status={getPhStatus(reading.ph)} />
                          )}
                        </div>

                        {/* Turbidity */}
                        <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              Turbidity
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-gray-900">
                              {reading.turbidity_ntu.toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-blue-400 font-mono">
                              ntu
                            </span>
                          </div>
                          {connected && (
                            <SensorBadge
                              status={getTurbidityStatus(reading.turbidity_ntu)}
                            />
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        {connected ? (
                          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                            <Wifi className="w-3 h-3 text-emerald-500" />
                            Stream sync active
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-semibold">
                            <WifiOff className="w-3 h-3 text-red-500" />
                            Stream sync inactive
                          </div>
                        )}
                        <span
                          className={`text-[10px] font-semibold ${connected ? "text-black-400" : "text-red-400"}`}
                        >
                          Last updated{" "}
                          {new Date(reading.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}

          {/* Upcoming Harvests */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Harvests</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : upcomingHarvests.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No harvest dates scheduled yet
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingHarvests.map((harvest, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="font-medium text-sm">
                            {harvest.tankName}
                          </p>
                          {harvest.estimatedWeight && (
                            <p className="text-xs text-gray-600">
                              {harvest.estimatedWeight.toLocaleString()} kg est.
                            </p>
                          )}
                        </div>
                        {harvest.batches?.[0] && (
                          <Badge
                            className={`${
                              harvest.batches[0].status === "READY"
                                ? "bg-green-600"
                                : "bg-[#088395]"
                            } text-white text-xs flex items-center gap-1`}
                          >
                            {harvest.batches[0].status === "READY" ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {harvest.batches[0].status}
                          </Badge>
                        )}
                      </div>
                      {harvest.batches?.map((b, bi) => (
                        <p key={bi} className="text-xs text-gray-500">
                          {b.fishType}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
