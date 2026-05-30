import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Fish, Scale, Droplet, Activity, AlertTriangle } from "lucide-react";
import { WaterParameter } from "../WaterParameter";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

interface OverviewTabProps {
  dashboardData: any;
  tankBatches: any[];
  currentTank: any;
  batchGrowthAnalysis: Record<string, any>;
  batchAssessments: Record<string, any>;
}

export function OverviewTab({
  dashboardData,
  tankBatches,
  currentTank,
  batchGrowthAnalysis,
  batchAssessments,
}: OverviewTabProps) {
  return (
    <div className="space-y-4 pt-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {dashboardData?.summary ? (
          dashboardData.summary.map((item: any, idx: number) => {
            const Icon =
              idx === 0
                ? Fish
                : idx === 1
                  ? Scale
                  : idx === 2
                    ? Droplet
                    : Activity;
            console.log(
              "Water Quality:",
              item.value,
              item.value?.toLowerCase() === "critical",
            );
            return (
              <Card
                key={idx}
                className={
                  item.label === "Water Quality"
                    ? item.value?.toLowerCase() === "optimal"
                      ? "bg-[#10B981] text-white"
                      : item.value?.toLowerCase() === "acceptable"
                        ? "bg-[#3B82F6] text-white"
                        : item.value?.toLowerCase() === "warning"
                          ? "bg-[#F59E0B] text-white"
                          : item.value?.toLowerCase() === "critical"
                            ? "bg-red-600 border-8 border-black text-white"
                            : ""
                    : ""
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm ${
                          item.label === "Water Quality" &&
                          [
                            "optimal",
                            "acceptable",
                            "warning",
                            "critical",
                          ].includes(item.value?.toLowerCase())
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          item.label === "Water Quality" &&
                          [
                            "optimal",
                            "acceptable",
                            "warning",
                            "critical",
                          ].includes(item.value?.toLowerCase())
                            ? "text-white"
                            : ""
                        }`}
                      >
                        {item.value}
                      </p>
                      {item.subValue && (
                        <p
                          className={`text-xs mt-1 ${
                            item.label === "Water Quality" &&
                            [
                              "optimal",
                              "acceptable",
                              "warning",
                              "critical",
                            ].includes(item.value?.toLowerCase())
                              ? "text-white"
                              : "text-gray-500"
                          }`}
                        >
                          {item.subValue}
                        </p>
                      )}
                    </div>
                    <Icon className="w-8 h-8 text-[#0A4D68] opacity-20" />
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Fish</p>
                    <p className="text-2xl font-bold">
                      {tankBatches
                        .reduce(
                          (sum: number, b: any) =>
                            sum + (b.count || b.currentCount || 0),
                          0,
                        )
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tankBatches.length} batches
                    </p>
                  </div>
                  <Fish className="w-8 h-8 text-[#0A4D68] opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Biomass</p>
                    <p className="text-2xl font-bold">
                      {currentTank.biomass} kg
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(
                        (currentTank.biomass / currentTank.capacity) * 100,
                      )}
                      % capacity
                    </p>
                  </div>
                  <Scale className="w-8 h-8 text-[#0A4D68] opacity-20" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={
                currentTank?.waterQuality?.overall?.toLowerCase() === "critical"
                  ? "bg-red-600 border-red-700"
                  : ""
              }
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-sm ${
                        currentTank?.waterQuality?.overall?.toLowerCase() ===
                        "critical"
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    >
                      Water Quality
                    </p>

                    <p
                      className={`text-2xl font-bold capitalize ${
                        currentTank?.waterQuality?.overall?.toLowerCase() ===
                        "critical"
                          ? "text-white"
                          : ""
                      }`}
                    >
                      {currentTank.waterQuality?.overall || "Unknown"}
                    </p>

                    <p
                      className={`text-xs mt-1 ${
                        currentTank?.waterQuality?.overall?.toLowerCase() ===
                        "critical"
                          ? "text-red-100"
                          : "text-gray-500"
                      }`}
                    >
                      Last:{" "}
                      {dashboardData?.waterQuality?.lastUpdated || "Recently"}
                    </p>
                  </div>

                  <Droplet
                    className={`w-8 h-8 ${
                      currentTank?.waterQuality?.overall?.toLowerCase() ===
                      "critical"
                        ? "text-white opacity-70"
                        : "text-[#0A4D68] opacity-20"
                    }`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Feed Today</p>
                    <p className="text-2xl font-bold">
                      {currentTank.feeding?.todayFed || 0} kg
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {currentTank.feeding?.todayMeals || 0}/
                      {currentTank.feeding?.totalMeals || 4} meals
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-[#0A4D68] opacity-20" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Batch Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tankBatches.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No active batches in this tank
                </p>
              ) : (
                tankBatches.map((batch: any) => {
                  const growth = batchGrowthAnalysis[batch.id]?.metrics || {};
                  const gStatus =
                    batchGrowthAnalysis[batch.id]?.overallRating || "NORMAL";
                  const wq = batchAssessments[batch.id] || {};

                  return (
                    <div
                      key={batch.id}
                      className="border-l-4 border-[#0A4D68] pl-3 py-3 bg-gray-50/50 rounded-xl border border-gray-100 mb-3 last:mb-0 hover:bg-white transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-gray-900">
                            Batch:{" "}
                            {batch.batchNumber ||
                              batch.name ||
                              batch.id?.slice(0, 6) ||
                              "Unassigned"}
                          </span>
                          <span
                            className="block text-[9px] text-gray-400 font-mono tracking-tighter"
                            style={{ color: "#000000", fontWeight: "bolder" }}
                          >
                            ID:{" "}
                            <span style={{ color: "#04b13d" }}>
                              {batch.id.split("-")[0]}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
