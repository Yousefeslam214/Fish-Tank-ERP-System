import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Button } from "../../ui/button";
import {
  Fish,
  Scale,
  FileText,
  PlusCircle,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

interface BatchesTabProps {
  batchesSummary: any;
  tankBatches: any[];
  currentTank: any;
  handleViewGrowthHistory: (batch: any) => void;
  handleUpdateBatchData: (batch: any) => void;
  handleHealthCheck: (batch: any) => void;
  handleQuarantine: (batch: any) => void;
  batchGrowthAnalysis?: Record<string, any>;
}

export function BatchesTab({
  batchesSummary,
  tankBatches,
  currentTank,
  handleViewGrowthHistory,
  handleUpdateBatchData,
  handleHealthCheck,
  handleQuarantine,
  batchGrowthAnalysis = {},
}: BatchesTabProps) {
  return (
    <div className="space-y-4 pt-4">
      {/* Total Feeding Summary for All Batches */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">
            Total Tank Feeding Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            if (batchesSummary) {
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-600 mb-1">
                        Total Daily Required
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {batchesSummary.totalDailyRequired}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {batchesSummary.batchesCombined}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-600 mb-1">Fed Today</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {batchesSummary.fedToday}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {batchesSummary.achievementPercentage}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-600 mb-1">
                        Remaining Today
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {batchesSummary.remainingToday}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {batchesSummary.mealsLeft}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs text-gray-600 mb-1">
                        Feed Types Used
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {batchesSummary.feedTypesUsed}
                      </p>
                      <p
                        className="text-xs text-gray-500 mt-1 truncate"
                        title={batchesSummary.feedTypeList}
                      >
                        {batchesSummary.feedTypeList}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 bg-white p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Overall Feeding Progress
                      </span>
                      <span className="text-sm text-gray-600">
                        {batchesSummary.overallProgress}
                      </span>
                    </div>
                    {(() => {
                      const achievementStr =
                        batchesSummary.achievementPercentage || "0%";
                      const achievementValue =
                        parseFloat(achievementStr.replace(/[^0-9.]/g, "")) || 0;
                      return (
                        <Progress value={achievementValue} className="h-2" />
                      );
                    })()}
                  </div>
                </>
              );
            }

            const totalRequired = tankBatches.reduce((sum: number, b: any) => {
              const daily = parseFloat(
                b.feedingPlan?.dailyFeedingAmount || b.dailyFeedKg || "0",
              );
              return sum + (isNaN(daily) ? 0 : daily);
            }, 0);
            const fedToday = currentTank.feeding?.todayFed || 0;
            const remaining = Math.max(0, totalRequired - fedToday);
            const uniqueFeedTypes = [
              ...new Set(
                tankBatches.map(
                  (b: any) =>
                    b.feedingPlan?.assignedFeedType || b.feedType || "Unknown",
                ),
              ),
            ];

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600 mb-1">
                      Total Daily Required
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {totalRequired} kg
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tankBatches.length} batches combined
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600 mb-1">Fed Today</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {fedToday} kg
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalRequired > 0
                        ? Math.round((fedToday / totalRequired) * 100)
                        : 0}
                      % of requirement
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600 mb-1">
                      Remaining Today
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {remaining} kg
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalRequired > 0
                        ? `${Math.max(0, (currentTank.feeding?.totalMeals || 4) - (currentTank.feeding?.todayMeals || 0))} meals left`
                        : "No feeding plan"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <p className="text-xs text-gray-600 mb-1">
                      Feed Types Used
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {uniqueFeedTypes.length} types
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {uniqueFeedTypes.join(", ") || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 bg-white p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Overall Feeding Progress
                    </span>
                    <span className="text-sm text-gray-600">
                      {currentTank.feeding?.todayMeals || 0}/
                      {currentTank.feeding?.totalMeals || 4} meals completed
                    </span>
                  </div>
                  <Progress
                    value={
                      totalRequired > 0 ? (fedToday / totalRequired) * 100 : 0
                    }
                    className="h-2"
                  />
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Individual Batch Details */}
      <div className="grid grid-cols-1 gap-4">
        {tankBatches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>No batches found for this tank.</p>
            </CardContent>
          </Card>
        ) : (
          tankBatches.map((batch: any) => (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <CardTitle
                            className="text-lg"
                            style={{ fontWeight: "700" }}
                          >
                            Batch:{" "}
                            {batch.batchNumber ||
                              batch.name ||
                              batch.id?.slice(0, 6) ||
                              "Unassigned"}
                          </CardTitle>
                          <span className="text-[10px] text-gray-400 font-mono"></span>
                        </div>
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
                  
                  </div>
                  <Badge className="bg-[#10B981] text-white text-[10px]">
                    {batch.status || "ACTIVE"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Initial Count</p>
                    <p className="text-lg font-semibold">
                      {(
                        batch.counts?.initial ??
                        batch.initialCount ??
                        0
                      ).toLocaleString()}{" "}
                      fish
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Current Count</p>
                    <p className="text-lg font-semibold">
                      {(
                        batch.counts?.current ??
                        batch.currentCount ??
                        batch.count ??
                        0
                      ).toLocaleString()}{" "}
                      fish
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Initial Weight</p>
                    <p className="text-lg font-semibold">
                      {batch.weights?.initial ??
                        batch.initialAverageWeight ??
                        "0g"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">
                      Current Avg Weight
                    </p>
                    <p className="text-lg font-semibold">
                      {batch.weights?.currentAvg ??
                        batch.currentAverageWeight ??
                        batch.avgWeight ??
                        "0g"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-[#E0F4F5] p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">
                      Age (Days in Culture)
                    </p>
                    <p className="text-lg font-semibold">
                      {batch.age ?? "0 days"}
                    </p>
                  </div>
                  <div className="bg-[#E0F4F5] p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">
                      Current Biomass
                    </p>
                    <p className="text-lg font-semibold">
                      {batch.biomass ?? "0kg"}
                    </p>
                  </div>
                  <div className="bg-[#E0F4F5] p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Survival Rate</p>
                    <p className="text-lg font-semibold text-green-600">
                      {batch.survivalRate ?? "92%"}
                    </p>
                  </div>
                  <div className="bg-[#E0F4F5] p-3 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Current SGR</p>
                    <p className="text-lg font-semibold">
                      {batchGrowthAnalysis[batch.id]?.sgr?.value?.toFixed(2)
                        ? `${batchGrowthAnalysis[batch.id].sgr.value}%/day`
                        : batch.sgr || "2.1%/day"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-gray-600 mb-1">
                      Total Feed Consumed
                    </p>
                    <p className="text-lg font-semibold">
                      {batch.totalFeedConsumed ?? "450 kg"}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-gray-600 mb-1">Current FCR</p>
                    <p className="text-lg font-semibold">
                      {batchGrowthAnalysis[batch.id]?.fcr?.value?.toFixed(2) ||
                        batch.fcr ||
                        "1.52"}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-gray-600 mb-1">Feed Cost</p>
                    <p className="text-lg font-semibold">
                      {batch.costs?.feedCost ?? "6,750 EGP"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">
                      Cost Basis (Fish Purchase)
                    </p>
                    <p className="text-lg font-semibold">
                      {batch.costs?.costBasis ?? "12,000 EGP"}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Stocked Date</p>
                    <p className="text-lg font-semibold">
                      {batch.dates?.stockedDate ?? "Dec 28, 2025"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Last Sampled</p>
                  <p className="text-sm font-medium">
                    {batch.dates?.lastSampled ?? "Never"}
                  </p>
                </div>

                {/* Feeding Plan for this Batch */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Fish className="w-4 h-4" />
                    Feeding Plan for Batch{" "}
                    {batch.batchNumber || batch.id.split("-")[0]}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">
                        Assigned Feed Type
                      </p>
                      <p className="font-semibold text-sm mb-1">
                        {batch.feedingPlan?.assignedFeedType ||
                          "Grower 30% 3mm Floating"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {batch.feedingPlan?.optimalLabel ||
                          "Optimal for current weight range"}
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-2">
                        Daily Feeding Amount
                      </p>
                      <p className="font-semibold text-sm mb-1">
                        {batch.feedingPlan?.dailyFeedingAmount ||
                          "45 kg/day (2.5% body weight)"}
                      </p>
                      <p className="text-xs text-gray-600">
                        Distributed over {batch.feedingPlan?.mealsPerDay || 4}{" "}
                        meals
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">Today's Fed:</span>
                      <span className="ml-1 font-medium">
                        {batch.feedingPlan?.todayFed ?? 0} kg
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">This Week:</span>
                      <span className="ml-1 font-medium">
                        {batch.feedingPlan?.thisWeekFed ?? 0} kg
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-600">Last FCR:</span>
                      <span className="ml-1 font-medium">
                        {batch.feedingPlan?.lastFCR || "1.52"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <TooltipProvider>
                    <div className="flex-1 flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewGrowthHistory(batch)}
                      >
                        <Scale className="w-4 h-4 mr-2" />
                        View History
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-[#088395] text-[#088395] hover:bg-blue-50"
                        onClick={() => handleUpdateBatchData(batch)}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Update Samples
                      </Button>
                    </div>
                  </TooltipProvider>
                </div>

                <div className="mt-2 flex gap-2 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => handleHealthCheck(batch)}
                  >
                    <HeartPulse className="w-3.5 h-3.5 mr-1" />
                    Record Health Check
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    onClick={() => handleQuarantine(batch)}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                    Move to Quarantine
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
