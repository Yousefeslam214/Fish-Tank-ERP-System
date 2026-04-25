export const mockDashboardData = {
  success: true,
  data: {
    fishSummary: {
      totalActiveFish: "10,449",
      totalBiomassKg: 437.5,
      activeTanks: 5
    },
    feedStock: {
      totalStockKg: 20515.2
    },
    predictedRevenue: {
      totalProjectedRevenue: 1027685,
      nextHarvestDateFormatted: "Apr 25, 2026"
    },
    upcomingHarvests: [
      { tankName: "testtt", estimatedWeight: 270, batches: [{ status: "READY", fishType: "Nile Tilapia" }] }
    ],
    waterQualityAlerts: []
  }
};