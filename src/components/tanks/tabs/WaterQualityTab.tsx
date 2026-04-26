import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  Activity,
  Droplet,
  Search,
  RefreshCw,
  AlertTriangle,
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

interface WaterQualityTabProps {
  batchAssessments: Record<string, any>;
  tankBatches: any[];
  waterQualityHistory: any[];
  waterQualityRecords: any[];
  setShowWaterQualityModal: (show: boolean) => void;
  setSelectedWqRecord: (record: any) => void;
  setShowWqDetailsModal: (show: boolean) => void;
}

export function WaterQualityTab({
  batchAssessments,
  tankBatches,
  waterQualityHistory,
  waterQualityRecords,
  setShowWaterQualityModal,
  setSelectedWqRecord,
  setShowWqDetailsModal,
}: WaterQualityTabProps) {
  const [localAssessments, setLocalAssessments] = React.useState<
    Record<string, any>
  >({});
  const [isLoadingAssessments, setIsLoadingAssessments] = React.useState(false);

  React.useEffect(() => {
    console.group('[WaterQualityTab] API Data');
    console.log('tankBatches:', tankBatches);
    console.log('batchAssessments:', batchAssessments);
    console.log('waterQualityHistory:', waterQualityHistory);
    console.log('waterQualityRecords:', waterQualityRecords);
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
          console.log('[WaterQualityTab] Normalized fetched assessments:', newAssessments);
          setLocalAssessments(newAssessments);
        } finally {
          setIsLoadingAssessments(false);
        }
      };
      fetchAssessments();
    } else {
      console.log('[WaterQualityTab] No tank batches available, skipped assessments fetch.');
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
      {/* Assessment Section */}
      {(Object.keys(localAssessments).length > 0 ||
        Object.keys(batchAssessments).length > 0 ||
        isLoadingAssessments) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {isLoadingAssessments &&
          Object.keys(localAssessments).length === 0 ? (
            <Card className="md:col-span-2 py-8 flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-[#088395] mb-2" />
              <p className="text-xs text-gray-500 font-medium">
                Analyzing water quality assessments...
              </p>
            </Card>
          ) : (
            tankBatches.map((batch) => {
              const assessmentRaw =
                localAssessments[batch.id] || batchAssessments[batch.id];
              if (!assessmentRaw) return null;

              const assessment = assessmentRaw.data || assessmentRaw;
              const status =
                assessment.status || assessment.overallStatus || "OPTIMAL";
              const isCritical = status === "CRITICAL";
              const isWarning = status === "WARNING" || status === "CAUTION";
              const params = assessment.parameters || {};
              const parameterCards = [
                { label: 'Temperature', data: params.temperature },
                { label: 'Dissolved Oxygen', data: params.dissolvedOxygen || params.do },
                { label: 'pH', data: params.pH || params.ph },
                { label: 'Ammonia', data: params.ammonia || params.totalAmmonia || params.nh3 },
                { label: 'Nitrite', data: params.nitrite || params.no2 },
                { label: 'Turbidity', data: params.turbidity },
              ];

              return (
                <Card
                  key={batch.id}
                  className={`border-l-4 ${isCritical ? "border-l-red-500" : isWarning ? "border-l-yellow-500" : "border-l-green-500"} group hover:shadow-md transition-all shadow-sm`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity
                          className={`w-4 h-4 ${isCritical ? "text-red-500" : isWarning ? "text-yellow-500" : "text-green-500"}`}
                        />
                        <div>
                          <span className="font-bold text-gray-900 block tracking-tight">
                            Batch:{" "}
                            {batch.batchNumber ||
                              batch.name ||
                              batch.id?.slice(0, 6) ||
                              "Unassigned"}
                          </span>
                          <p
                            className="text-sm text-gray-600"
                            style={{ color: "#000000", fontWeight: "bolder" }}
                          >
                            ID:{" "}
                            <span style={{ color: "#04b13d" }}>
                              {batch.id.split("-")[0]}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLoadingAssessments && (
                          <RefreshCw className="w-3 h-3 animate-spin text-gray-400" />
                        )}
                        <Badge
                          className={`${isCritical ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-green-500"} font-bold uppercase text-[9px] tracking-wider`}
                        >
                          {status}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4 font-medium leading-relaxed">
                      {typeof assessment.recommendation === "string"
                        ? assessment.recommendation
                        : typeof assessment.message === "string"
                          ? assessment.message
                          : assessment.recommendation?.text ||
                            assessment.message?.text ||
                            (isCritical || isWarning
                              ? "Action required to stabilize parameters."
                              : "Water quality is within optimal range for this batch.")}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                      {parameterCards.map(({ label, data }) => (
                        <div key={label} className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 line-clamp-1">{label}</span>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[10px] text-gray-900 truncate">{data?.value ?? 'N/A'}</span>
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              !data?.status ? 'bg-gray-300' :
                              data.status === 'OPTIMAL' ? 'bg-green-500' :
                              data.status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {assessment.alerts && assessment.alerts.length > 0 && (
                      <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-100 space-y-2">
                        {assessment.alerts.map((alert: any, idx: number) => {
                          const alertMsg =
                            typeof alert === "string"
                              ? alert
                              : alert.message ||
                                alert.parameter ||
                                "Water parameter alert";
                          return (
                            <div
                              key={idx}
                              className="flex items-start gap-2 text-[10px] text-red-700 font-bold"
                            >
                              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{alertMsg}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs mt-4 pt-4 border-t border-gray-100">
                      <div className="space-y-1">
                        <span className="text-gray-400 block font-bold uppercase text-[9px] tracking-widest">
                          Growth Impact
                        </span>
                        <span
                          className={`font-bold ${isCritical ? "text-red-600" : isWarning ? "text-amber-600" : "text-green-600"}`}
                        >
                          {assessment.growthImpact ||
                            (isCritical
                              ? "High Risk"
                              : isWarning
                                ? "Slightly Reduced"
                                : "Maximum Growth")}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-gray-400 block font-bold uppercase text-[9px] tracking-widest">
                          Action Required
                        </span>
                        <span className="font-bold text-gray-900">
                          {assessment.actionRequired ? "YES" : "NONE"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
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
                            {record.nitrate !== undefined && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  Nitrate
                                </p>
                                <p className="font-bold text-gray-900">
                                  {record.nitrate} mg/L
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-4 bg-gray-50 border-gray-200 hover:border-[#088395] hover:bg-white hover:text-[#088395] transition-all font-bold uppercase text-[10px] tracking-widest rounded-xl"
                            onClick={() => {
                              setSelectedWqRecord(record);
                              setShowWqDetailsModal(true);
                            }}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            View Full Analysis
                          </Button>
                        </div>
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
