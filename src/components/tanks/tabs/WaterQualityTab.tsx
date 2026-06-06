import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Activity,
  Droplet,
  Cpu,
  Wifi,
  WifiOff,
  Thermometer,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  ReferenceLine,
} from "recharts";
import { apiGet } from "../../../api";
import {
  subscribeToTankSensorStream,
  SensorReadingEvent,
} from "../../../services/iotApi";
import { User } from "../../../types";

interface WaterQualityTabProps {
  user: User;
  batchAssessments: Record<string, any>;
  tankBatches: any[];
  waterQualityHistory: any[];
  waterQualityRecords: any[];
  setShowWaterQualityModal: (show: boolean) => void;
  setSelectedWqRecord: (record: any) => void;
  setShowWqDetailsModal: (show: boolean) => void;
  tank?: any;
}

// ── Threshold helpers ──────────────────────────────────────────────────────────

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

// Dissolved oxygen (mg/L) — higher is better. Mirrors the chart's 5 (warning)
// and 3 (danger) reference lines.
const getDoStatus = (mgL: number): StatusLevel => {
  if (mgL >= 6) return "optimal";
  if (mgL >= 5) return "acceptable";
  if (mgL >= 3) return "warning";
  return "critical";
};

// Total Ammonia Nitrogen (TAN / NH3, mg/L) — lower is better.
const getAmmoniaStatus = (mgL: number): StatusLevel => {
  if (mgL <= 0.02) return "optimal";
  if (mgL <= 0.05) return "acceptable";
  if (mgL <= 0.1) return "warning";
  return "critical";
};

// Nitrite (NO2, mg/L) — lower is better.
const getNitriteStatus = (mgL: number): StatusLevel => {
  if (mgL < 0.1) return "optimal";
  if (mgL <= 0.3) return "acceptable";
  if (mgL <= 1.0) return "warning";
  return "critical";
};

// Maps a status level to a hex color (applied via inline style so it can't be
// purged by Tailwind, unlike arbitrary `text-[#...]` classes).
const statusHex = (status: StatusLevel): string => {
  switch (status) {
    case "optimal":
      return "#10B981"; // green
    case "acceptable":
      return "#3B82F6"; // blue
    case "warning":
      return "#F59E0B"; // yellow / amber
    case "critical":
      return "#EF4444"; // red
  }
};

function SensorBadge({ status }: { status: StatusLevel }) {
  return (
    <Badge
      className={`
        text-[10px] font-bold px-2 py-0.5 w-fit
        ${
          status === "optimal"
            ? "bg-[#10B981] text-white"
            : status === "acceptable"
              ? "bg-[#3B82F6] text-white"
              : status === "warning"
                ? "bg-[#F59E0B] text-white blink"
                : "bg-red-600 text-white critical-blink"
        }
      `}
    >
      {status.toUpperCase()}
    </Badge>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export function WaterQualityTab({
  user,
  batchAssessments,
  tankBatches,
  waterQualityHistory,
  waterQualityRecords,
  setShowWaterQualityModal,
  setSelectedWqRecord,
  setShowWqDetailsModal,
  tank,
}: WaterQualityTabProps) {
  const [localAssessments, setLocalAssessments] = React.useState<
    Record<string, any>
  >({});
  const [isLoadingAssessments, setIsLoadingAssessments] = React.useState(false);
  const [liveReading, setLiveReading] =
    React.useState<SensorReadingEvent | null>(null);
  const [streamConnected, setStreamConnected] = React.useState(false);
  const disconnectTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastReadingRef = React.useRef<SensorReadingEvent | null>(null);

  React.useEffect(() => {
    const tankId = String(tank?.id || "");
    if (!tankId) return;

    const resetDisconnectTimer = () => {
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = setTimeout(() => {
        console.log("[Stream] watchdog fired → marking disconnected");
        setStreamConnected(false);
      }, 5_000);
    };

    const unsubscribe = subscribeToTankSensorStream({
      tankId,
      onSensorReading: (reading) => {
        setLiveReading(reading);
        setStreamConnected(true);
        resetDisconnectTimer();
      },
      onConnectionStatusChange: (isConnected) => {
        console.log("[Stream] onConnectionStatusChange:", isConnected);
        setStreamConnected(isConnected);
        if (isConnected) resetDisconnectTimer();
      },
      onError: () => {
        console.log("[Stream] onError → marking disconnected");
        setStreamConnected(false);
      },
    });

    return () => {
      unsubscribe();
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
    };
  }, [tank?.id]);
  React.useEffect(() => {
    console.group("[WaterQualityTab] API Data");
    console.log("tankBatches:", tankBatches);
    console.log("batchAssessments:", batchAssessments);
    console.log("waterQualityHistory:", waterQualityHistory);
    console.log("waterQualityRecords:", waterQualityRecords);
    console.groupEnd();
  }, [tankBatches, batchAssessments, waterQualityHistory, waterQualityRecords]);

  React.useEffect(() => {
    if (tankBatches.length > 0) {
      const fetchAssessments = async () => {
        setIsLoadingAssessments(true);
        try {
          const results = await Promise.all(
            tankBatches.map(async (batch) => {
              try {
                const res = await apiGet<any>(
                  `/tanks/water-quality/batch/${batch.id}/assessment`,
                );
                return { id: batch.id, data: res.data ?? res };
              } catch (err) {
                console.error(
                  `Failed to fetch assessment for batch ${batch.id}:`,
                  err,
                );
                return { id: batch.id, data: null };
              }
            }),
          );
          const newAssessments: Record<string, any> = {};
          results.forEach((r) => {
            if (r.data) newAssessments[r.id] = r.data;
          });
          setLocalAssessments(newAssessments);
        } finally {
          setIsLoadingAssessments(false);
        }
      };
      fetchAssessments();
    }
  }, [tankBatches]);

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case "optimal":
        return "bg-[#10B981] text-white";
      case "acceptable":
        return "bg-[#3B82F6] text-white";
      case "warning":
        return "bg-[#F59E0B] text-white";
      case "critical":
        return "bg-[#EF4444] text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Returns the hex color for a single reading, or undefined when the value is
  // missing/unparseable (so the text falls back to its default color).
  const valueColor = (
    value: number | string | null | undefined,
    statusFn: (n: number) => StatusLevel,
  ): string | undefined => {
    if (value === null || value === undefined || value === "") return undefined;
    // parseFloat tolerates trailing units/spaces (e.g. "50 NTU" -> 50)
    const n = typeof value === "number" ? value : parseFloat(String(value));
    if (Number.isNaN(n)) return undefined;
    return statusHex(statusFn(n));
  };

  const isTechnician = user.role.toLowerCase() === "technician";
  return (
    <div className="space-y-4 pt-4">
      {/* Real-Time Sensor Feed Card */}

      {liveReading && (
        <Card className="bg-white border border-gray-100 shadow-sm overflow-hidden">
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

              {/* 2. Live / Offline badge */}
              {streamConnected ? (
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

            {/* Metrics — unchanged */}
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
                    {liveReading.temperature.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-orange-400">
                    °C
                  </span>
                </div>
                {streamConnected && (
                  <SensorBadge
                    status={getTemperatureStatus(liveReading!.temperature)}
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
                    {liveReading.ph.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-green-500">
                    —
                  </span>
                </div>
                {streamConnected && (
                  <SensorBadge status={getPhStatus(liveReading.ph)} />
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
                    {liveReading.turbidity_ntu.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-blue-400 font-mono">
                    ntu
                  </span>
                </div>
                {streamConnected && (
                  <SensorBadge
                    status={getTurbidityStatus(liveReading.turbidity_ntu)}
                  />
                )}
              </div>
            </div>

            {/* 3. Footer — green when connected, red when not */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              {streamConnected ? (
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
                className={`text-[10px] font-semibold ${streamConnected ? "text-black-400" : "text-red-400"}`}
              >
                last Updated{" "}
                {new Date(liveReading.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Water Quality Trends - Last 30 Days</CardTitle>
          {isTechnician && (
            <Button
              size="sm"
              className="bg-[#088395] hover:bg-[#0A4D68]"
              onClick={() => setShowWaterQualityModal(true)}
            >
              <Droplet className="w-4 h-4 mr-2" />
              Record New Reading
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={waterQualityHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" style={{ fontSize: "12px" }} />
              <YAxis yAxisId="left" style={{ fontSize: "12px" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                style={{ fontSize: "12px" }}
              />
              <Tooltip />
              <ReferenceLine
                yAxisId="left"
                y={3}
                label={{
                  position: "right",
                  value: "Danger (DO)",
                  fill: "#EF4444",
                  fontSize: 10,
                }}
                stroke="#EF4444"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                yAxisId="left"
                y={5}
                label={{
                  position: "right",
                  value: "Warning (DO)",
                  fill: "#F59E0B",
                  fontSize: 10,
                }}
                stroke="#F59E0B"
                strokeDasharray="3 3"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="temp"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ r: 4, fill: "#F59E0B", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
                name="Temp (°C)"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="do"
                stroke="#088395"
                strokeWidth={3}
                dot={{ r: 4, fill: "#088395", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
                name="DO (mg/L)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ph"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
                name="pH"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="nh3"
                stroke="#EF4444"
                strokeWidth={3}
                dot={{ r: 4, fill: "#EF4444", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
                name="NH₃ (mg/L)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="no2"
                stroke="#A855F7"
                strokeWidth={3}
                dot={{ r: 4, fill: "#A855F7", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
                name="NO₂ (mg/L)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ntu"
                stroke="#8B4513"
                strokeWidth={3}
                dot={{ r: 4, fill: "#8B4513", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
                name="Turbidity (NTU)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      {/* History Records */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Measurement History</h3>
        <div className="space-y-3">
          {waterQualityRecords.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No water quality records found.
            </p>
          ) : (
            [...waterQualityRecords]
              .sort(
                (a, b) =>
                  new Date(b.measuredAt || b.createdAt).getTime() -
                  new Date(a.measuredAt || a.createdAt).getTime(),
              )
              .map((record) => {
                const status =
                  record.overallStatus || record.status || "unknown";

                // resolve each field once so we can both display and color it
                const recTemp = record.temperature ?? record.temp;
                const recPh = record.pH ?? record.ph;
                const recNtu = record.turbidity ?? record.ntu;
                const recDo = record.dissolvedOxygen ?? record.do;
                const recAmmonia =
                  record.totalAmmonia ?? record.ammonia ?? record.nh3;
                const recNitrite = record.nitrite;

                return (
                  <Card
                    key={record.id}
                    className="bg-white shadow-sm hover:shadow-md transition-all group overflow-hidden border-gray-100"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          {/* Row: date + overall status badge */}
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <Droplet className="w-5 h-5 text-[#088395]" />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 text-lg tracking-tight">
                                {new Date(
                                  record.measuredAt || record.createdAt,
                                ).toLocaleString(undefined, {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <Badge
                                className={`${getStatusColor(status)} font-bold px-3 py-1 uppercase text-[10px] tracking-widest border-none shadow-sm`}
                              >
                                {status.toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          {/* Metric grid */}
                          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pt-2">
                            {/* Temperature */}
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Temperature
                              </p>
                              <p
                                className="font-bold text-gray-900"
                                style={{
                                  color: valueColor(
                                    recTemp,
                                    getTemperatureStatus,
                                  ),
                                }}
                              >
                                {recTemp ?? "–"}°C
                              </p>
                            </div>

                            {/* DO */}
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                DO
                              </p>
                              <p
                                className="font-bold text-gray-900"
                                style={{
                                  color: valueColor(recDo, getDoStatus),
                                }}
                              >
                                {recDo ?? "–"} mg/L
                              </p>
                            </div>

                            {/* pH */}
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                pH
                              </p>
                              <p
                                className="font-bold text-gray-900"
                                style={{
                                  color: valueColor(recPh, getPhStatus),
                                }}
                              >
                                {recPh ?? "–"}
                              </p>
                            </div>

                            {/* Ammonia */}
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Ammonia
                              </p>
                              <p
                                className="font-bold text-gray-900"
                                style={{
                                  color: valueColor(
                                    recAmmonia,
                                    getAmmoniaStatus,
                                  ),
                                }}
                              >
                                {recAmmonia ?? "–"} mg/L
                              </p>
                            </div>

                            {/* Nitrite */}
                            {recNitrite !== undefined && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  Nitrite
                                </p>
                                <p
                                  className="font-bold text-gray-900"
                                  style={{
                                    color: valueColor(
                                      recNitrite,
                                      getNitriteStatus,
                                    ),
                                  }}
                                >
                                  {recNitrite} mg/L
                                </p>
                              </div>
                            )}

                            {/* Turbidity */}
                            {recNtu != null && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  Turbidity
                                </p>
                                <p
                                  className="font-bold text-gray-900"
                                  style={{
                                    color: valueColor(
                                      recNtu,
                                      getTurbidityStatus,
                                    ),
                                  }}
                                >
                                  {recNtu} NTU
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
