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
  const isTecnhician = user?.role === "technician";
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Feeding History Records
          </h3>
          {isTecnhician && (
            <Button
              size="sm"
              className="bg-[#088395] hover:bg-[#0A4D68]"
              onClick={() => setShowFeedingModal(true)}
            >
              <Fish className="w-4 h-4 mr-2" />
              Record Feeding
            </Button>
          )}
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
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`${record.status?.toUpperCase() === "COMPLETED" ? "bg-[#10B981]" : "bg-[#F59E0B]"} font-bold px-2 py-0.5 uppercase text-[9px] tracking-widest border-none shadow-sm text-white`}
                                >
                                  {record.status || "PENDING"}
                                </Badge>
                              </div>
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
