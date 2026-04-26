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
            return (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{item.label}</p>
                      <p className="text-2xl font-bold">{item.value}</p>
                      {item.subValue && (
                        <p className="text-xs text-gray-500 mt-1">
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

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Water Quality</p>
                    <p className="text-2xl font-bold capitalize">
                      {currentTank.waterQuality?.overall || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last:{" "}
                      {dashboardData?.waterQuality?.lastUpdated || "Recently"}
                    </p>
                  </div>
                  <Droplet className="w-8 h-8 text-[#0A4D68] opacity-20" />
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

      {/* Tank Capacity & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tank Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-40 h-40 relative">
                {(() => {
                  const percentage = Math.min(
                    Math.round(
                      dashboardData?.capacity?.percentageUsed ??
                        (currentTank.biomass / currentTank.capacity) * 100,
                    ),
                    100,
                  );
                  const isOverstocked =
                    dashboardData?.capacity?.percentageUsed > 100 ||
                    currentTank.biomass > currentTank.capacity;
                  const data = [{ value: percentage }];

                  return (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                          innerRadius="70%"
                          outerRadius="100%"
                          barSize={10}
                          data={data}
                          startAngle={90}
                          endAngle={450}
                        >
                          <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            angleAxisId={0}
                            tick={false}
                          />
                          <RadialBar
                            background
                            dataKey="value"
                            cornerRadius={5}
                            fill={isOverstocked ? "#EF4444" : "#088395"}
                          />
                        </RadialBarChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className={`text-2xl font-bold ${isOverstocked ? "text-red-600" : "text-gray-900"}`}
                        >
                          {percentage}%
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase">
                          Capacity
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Load</span>
                  <span className="font-bold text-gray-900">
                    {dashboardData?.capacity?.currentLoadKg ??
                      currentTank.biomass}{" "}
                    /{" "}
                    {dashboardData?.capacity?.capacityKg ??
                      currentTank.capacity}{" "}
                    kg
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Stocking Density</span>
                  <span className="font-semibold text-gray-900">
                    {Math.round(
                      dashboardData?.capacity?.stockingDensity ??
                        currentTank.biomass / (currentTank.volume || 50),
                    )}{" "}
                    kg/m³
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Volume</span>
                  <span className="font-semibold text-gray-900">
                    {dashboardData?.tankInfo?.volume ?? currentTank.volume} m³
                  </span>
                </div>
                {(dashboardData?.capacity?.percentageUsed > 100 ||
                  currentTank.biomass > currentTank.capacity) && (
                  <div className="bg-red-50 border border-red-200 p-2 rounded-lg mt-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-tight">
                        Overstocked: +
                        {Math.round(
                          dashboardData?.capacity?.overstockPercentage?.value ||
                            ((currentTank.biomass - currentTank.capacity) /
                              currentTank.capacity) *
                              100,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

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
                        <div className="flex gap-1.5">
                          <Badge
                            className={`${gStatus === "GOOD" || gStatus === "EXCELLENT" ? "bg-[#10B981]" : "bg-amber-500"} text-white text-[9px] h-5 uppercase font-bold`}
                          >
                            {gStatus}
                          </Badge>
                          <Badge className="bg-[#0A4D68] text-white text-[9px] h-5">
                            {batch.status || "ACTIVE"}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px]">
                        <div>
                          <span className="block text-gray-400 uppercase font-bold text-[9px] mb-0.5 tracking-wider">
                            Weight / Biomass
                          </span>
                          <span className="font-bold text-gray-900">
                            {batch.weights?.currentAvg ||
                              batch.currentAverageWeight ||
                              "0g"}
                            <span className="text-gray-400 mx-1">/</span>
                            {(
                              ((batch.counts?.current || 0) *
                                parseFloat(batch.weights?.currentAvg || "0")) /
                              1000
                            ).toFixed(0)}
                            kg
                          </span>
                        </div>
                        <div>
                          <span className="block text-gray-400 uppercase font-bold text-[9px] mb-0.5 tracking-wider">
                            Growth (SGR)
                          </span>
                          <span className="font-bold text-[#10B981]">
                            {growth.sgr?.toFixed(2) || "2.10"}%
                          </span>
                        </div>
                        <div>
                          <span className="block text-gray-400 uppercase font-bold text-[9px] mb-0.5 tracking-wider">
                            Efficiency (FCR)
                          </span>
                          <span className="font-bold text-[#0A4D68]">
                            {growth.fcr?.toFixed(2) || "1.50"}
                          </span>
                        </div>
                        <div>
                          <span className="block text-gray-400 uppercase font-bold text-[9px] mb-0.5 tracking-wider">
                            WQ Status
                          </span>
                          <span
                            className={`font-bold ${wq.status === "CRITICAL" ? "text-red-600" : wq.status === "WARNING" ? "text-amber-600" : "text-green-600"}`}
                          >
                            {wq.status || "OPTIMAL"}
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
