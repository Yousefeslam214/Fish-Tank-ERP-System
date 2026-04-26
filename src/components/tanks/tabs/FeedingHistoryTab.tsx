import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Fish, Search } from "lucide-react";

interface FeedingHistoryTabProps {
  tankFeedingCalculation: any;
  feedingHistory: any[];
  feedingRecords: any[];
  setShowFeedingModal: (show: boolean) => void;
  setSelectedFeedingRecord: (record: any) => void;
  setShowFeedingDetailsModal: (show: boolean) => void;
  user: any;
  tankBatches: any[];
}

type FeedingStatus = "on-target" | "below" | "critical" | "above";

export function FeedingHistoryTab({
  tankFeedingCalculation,
  feedingHistory,
  feedingRecords,
  setShowFeedingModal,
  setSelectedFeedingRecord,
  setShowFeedingDetailsModal,
  user,
  tankBatches,
}: FeedingHistoryTabProps) {
  const normalizeStatus = (status: string = ""): FeedingStatus => {
    const normalized = status
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (normalized.includes("critical")) return "critical";
    if (normalized.includes("above") || normalized.includes("over")) return "above";
    if (
      normalized.includes("on target") ||
      normalized === "ok" ||
      normalized === "optimal"
    ) {
      return "on-target";
    }
    return "below";
  };

  const getStatusLabel = (status: string = "") => {
    switch (normalizeStatus(status)) {
      case "on-target":
        return "✅ On target";
      case "critical":
        return "❌ Critical";
      case "above":
        return "ℹ️ Above recommendation";
      default:
        return "⚠️ Below recommendation";
    }
  };

  const getStatusColor = (status: string) => {
    switch (normalizeStatus(status)) {
      case "on-target":
        return "bg-[#10B981] text-white";
      case "below":
        return "bg-[#F59E0B] text-white";
      case "critical":
        return "bg-[#EF4444] text-white";
      case "above":
        return "bg-[#3B82F6] text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const parseVal = (val: any) => {
    if (typeof val === "number") return val;
    if (typeof val === "string")
      return parseFloat(val.replace(/[^\d.-]/g, "")) || 0;
    return 0;
  };

  const formatKg = (val: number) => {
    if (!Number.isFinite(val)) return "0";
    const rounded = Math.round(val * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
  };

  const calcAchievementPercent = (
    fed: number,
    recommended: number,
    fallbackAchievement?: string,
  ) => {
    if (recommended > 0) {
      const roundedFed = Math.round(fed * 10) / 10;
      const roundedRecommended = Math.round(recommended * 10) / 10;
      if (Math.abs(roundedFed - roundedRecommended) <= 0.1) return 100;
      return Math.round((fed / recommended) * 100);
    }
    return fallbackAchievement
      ? parseInt(fallbackAchievement.replace(/[^\d]/g, "")) || 0
      : 0;
  };

  const dailyTarget = parseVal(
    tankFeedingCalculation?.recommendedAmount ||
      tankFeedingCalculation?.totalRecommended ||
      "0",
  );

  React.useEffect(() => {
    console.log("Feeding History Records:", feedingRecords);
  }, [feedingRecords]);

  return (
    <div className="space-y-4 pt-4">
    

  

      <div className="space-y-4">
        <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Feeding History Records</h3>
 <Button
            size="sm"
            className="bg-[#088395] hover:bg-[#0A4D68]"
            onClick={() => setShowFeedingModal(true)}
          >
            <Fish className="w-4 h-4 mr-2" />
            Record Feeding
          </Button>
          </div>
        <div className="space-y-3">
          {feedingRecords.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No feeding records found.
            </p>
          ) : (
            [...feedingRecords]
              .sort((a, b) => {
                const dateA = new Date(
                  a.timestamp || a.fedAt || a.date || a.createdAt || 0,
                ).getTime();
                const dateB = new Date(
                  b.timestamp || b.fedAt || b.date || b.createdAt || 0,
                ).getTime();
                return dateB - dateA;
              })
              .map((record, idx) => {
                const fed = parseVal(
                  record.amountFed ?? record.weightFed ?? record.weightKg ?? 0,
                );
                const recommended = parseVal(
                  record.recommendedAmount ?? record.targetWeight ?? 0,
                );
                const status = normalizeStatus(
                  record.status ||
                    (fed >= (recommended || 0.1) ? "on-target" : "below"),
                );
                const achievementVal = calcAchievementPercent(
                  fed,
                  recommended,
                  record.achievement,
                );
                const rowKey =
                  record.id ||
                  `${record.timestamp || record.createdAt || record.fedAt || "record"}_${idx}`;

                return (
                  <Card
                    key={rowKey}
                    className="bg-white shadow-sm hover:shadow-md transition-all group overflow-hidden border-l-4 border-l-[#10B981]"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                              <Fish className="w-5 h-5 text-[#10B981]" />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 text-lg tracking-tight">
                                {record.formattedDate ||
                                  `${new Date(record.timestamp || record.fedAt || record.createdAt).toLocaleDateString()} at ${record.time || new Date(record.timestamp || record.fedAt || record.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                              </span>
                              <Badge
                                className={`${getStatusColor(status)} font-bold px-3 py-1 uppercase text-[10px] tracking-widest border-none shadow-sm`}
                              >
                                {(record.statusLabel || status).toUpperCase()}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Amount Fed
                              </p>
                              <p className="font-bold text-gray-900">
                                {record.amountFed || `${formatKg(fed)} kg`}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Recommended
                              </p>
                              <p className="font-bold text-gray-900">
                                {record.recommendedAmount ||
                                  `${formatKg(recommended)} kg`}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Achievement
                              </p>
                              <p
                                className={`font-bold ${achievementVal >= 90 && achievementVal <= 110 ? "text-green-600" : "text-yellow-600"}`}
                              >
                                {`${achievementVal}%`}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                Food Type
                              </p>
                              <p
                                className="font-bold text-gray-900 truncate max-w-[150px]"
                                title={
                                  typeof record.foodType === "object"
                                    ? record.foodType?.name ||
                                      record.foodType?.brand
                                    : record.foodType || record.feedType
                                }
                              >
                                {typeof record.foodType === "object"
                                  ? record.foodType?.name ||
                                    record.foodType?.brand ||
                                    "Standard Feed"
                                  : record.foodType || record.feedType || "N/A"}
                              </p>
                            </div>
                            {record.taskId && (
                              <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                  Linked Task
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer font-mono text-[10px]"
                                >
                                  {record.taskId.split("-")[0]}
                                </Badge>
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
                              setSelectedFeedingRecord(record);
                              setShowFeedingDetailsModal(true);
                            }}
                          >
                            <Search className="w-4 h-4 mr-2" />
                            View Record
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
