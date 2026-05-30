import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Activity,
  Droplet,
  Search,
  RefreshCw,
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

interface WaterQualityTabProps {
  batchAssessments: Record<string, any>;
  tankBatches: any[];
  waterQualityHistory: any[];
  waterQualityRecords: any[];
  setShowWaterQualityModal: (show: boolean) => void;
  setSelectedWqRecord: (record: any) => void;
  setShowWqDetailsModal: (show: boolean) => void;
  tank?: any;
}

export function WaterQualityTab({
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

  React.useEffect(() => {
    const tankId = String(tank?.id || "");
    if (!tankId) return;

    const unsubscribe = subscribeToTankSensorStream({
      tankId,
      onSensorReading: (reading) => {
        setLiveReading(reading);
      },
      onConnectionStatusChange: (isConnected) => {
        setStreamConnected(isConnected);
      },
      onError: () => {
        setStreamConnected(false);
      },
    });

    return () => unsubscribe();
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
                console.log(
                  `Water quality assessment for batch ${batch.id}:`,
                  res,
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
          console.log(
            "[WaterQualityTab] Normalized fetched assessments:",
            newAssessments,
          );
          setLocalAssessments(newAssessments);
        } finally {
          setIsLoadingAssessments(false);
        }
      };
      fetchAssessments();
    } else {
      console.log(
        "[WaterQualityTab] No tank batches available, skipped assessments fetch.",
      );
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

  return (
    <div className="space-y-4 pt-4">
      {/* Real-Time Sensor Feed Card */}
      {streamConnected && liveReading && (
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
              <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-700">
                  Live
                </span>
              </div>
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
                    {liveReading.temperature.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-orange-400">
                    °C
                  </span>
                </div>
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
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold">
                <Wifi className="w-3 h-3 text-emerald-400" />
                Stream sync active
              </div>
              <span className="text-[10px] text-gray-400 font-semibold">
                Updated {new Date(liveReading.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Water Quality Trends - Last 30 Days</CardTitle>
          <Button
            size="sm"
            className="bg-[#088395] hover:bg-[#0A4D68]"
            onClick={() => setShowWaterQualityModal(true)}
          >
            <Droplet className="w-4 h-4 mr-2" />
            Record New Reading
          </Button>
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
                return (
                  <Card
                    key={record.id}
                    className="bg-white shadow-sm hover:shadow-md transition-all group overflow-hidden border-gray-100"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
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

                          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 pt-2">
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Temperature
                              </p>
                              <p className="font-bold text-gray-900">
                                {record.temperature ?? record.temp ?? "–"}°C
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                DO
                              </p>
                              <p className="font-bold text-gray-900">
                                {record.dissolvedOxygen ?? record.do ?? "–"}{" "}
                                mg/L
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                pH
                              </p>
                              <p className="font-bold text-gray-900">
                                {record.pH ?? record.ph ?? "–"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Ammonia
                              </p>
                              <p
                                className={`font-bold ${(record.totalAmmonia ?? record.ammonia ?? 0) > 0.5 ? "text-red-600" : "text-gray-900"}`}
                              >
                                {record.totalAmmonia ??
                                  record.ammonia ??
                                  record.nh3 ??
                                  "–"}{" "}
                                mg/L
                              </p>
                            </div>
                            {record.nitrite !== undefined && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  Nitrite
                                </p>
                                <p className="font-bold text-gray-900">
                                  {record.nitrite} mg/L
                                </p>
                              </div>
                            )}
                            {(record.turbidity !== undefined ||
                              record.ntu !== undefined) && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  Turbidity
                                </p>
                                <p className="font-bold text-gray-900">
                                  {record.turbidity ?? record.ntu} NTU
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2"></div>
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
