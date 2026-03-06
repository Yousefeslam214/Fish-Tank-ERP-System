import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  ShoppingCart,
  Pill,
  Wrench,
  Fuel,
  Fish,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { User, Farm, FishInventoryBatch } from "../types";
import { mockInventory } from "../mockData";
import AllocateFishToTank from "./AllocateFishToTank";

import {
  getFeedInventory,
  createFeed,
  getFeedByFoodType,
  getBatches,
  getBatchById,
  quarantineBatch,
  healthCheckBatch,
  allocateBatch,
} from "../api/inventoryApi";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FeedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  foodType?: string;
  [key: string]: unknown;
}

interface InventoryProps {
  user: User;
  selectedFarm: Farm | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Inventory({ user, selectedFarm }: InventoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Fish batches — API-driven
  const [fishBatches, setFishBatches] = useState<FishInventoryBatch[]>([]);

  // Allocation modal
  const [selectedBatch, setSelectedBatch] = useState<FishInventoryBatch | null>(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);

  // Feed inventory — API-driven
  const [feedInventory, setFeedInventory] = useState<FeedItem[]>([]);

  // ── Data loaders ─────────────────────────────────────────────────────────────

  // GET /api/v1/inventory/batches
  const loadBatches = async () => {
    try {
      const res = await getBatches();
      // Handle both { data: [...] } and plain [...] response shapes
      const batches = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setFishBatches(batches);
    } catch (error) {
      console.error("Error loading batches", error);
      setFishBatches([]);
    }
  };

  // GET /api/v1/inventory/feed
  const loadFeed = async () => {
    try {
      const res = await getFeedInventory();
      // Handle both { data: [...] } and plain [...] response shapes
      const feed = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setFeedInventory(feed);
    } catch (error) {
      console.error("Error loading feed inventory", error);
      setFeedInventory([]);
    }
  };

  useEffect(() => {
    loadBatches();
    loadFeed();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  // GET /api/v1/inventory/batches/:id
  const fetchBatch = async (id: string) => {
    try {
      const res = await getBatchById(id);
      console.log(res.data);
    } catch (error) {
      console.error("Error fetching batch", error);
    }
  };

  // PATCH /api/v1/inventory/batches/:id/allocate
  const handleAllocate = async (
    batchId: string,
    tankId: string,
    quantity: number,
    stockingDate: string,
    notes?: string
  ) => {
    try {
      await allocateBatch(batchId, { tankId, quantity, stockingDate, notes });
      await loadBatches();
    } catch (error) {
      console.error("Allocation failed", error);
    } finally {
      setShowAllocateModal(false);
      setSelectedBatch(null);
    }
  };

  // PATCH /api/v1/inventory/batches/:id/quarantine
  const handleQuarantine = async (id: string) => {
    try {
      await quarantineBatch(id);
      await loadBatches();
    } catch (error) {
      console.error("Quarantine failed", error);
    }
  };

  // PATCH /api/v1/inventory/batches/:id/health-check
  const handleHealthCheck = async (id: string) => {
    try {
      await healthCheckBatch(id, { status: "PASSED" });
      await loadBatches();
    } catch (error) {
      console.error("Health check failed", error);
    }
  };

  // POST /api/v1/inventory/feed
  const handleAddFeed = async () => {
    try {
      await createFeed({ name: "Tilapia Feed", quantity: 100, unit: "kg" });
      await loadFeed();
    } catch (error) {
      console.error("Add feed failed", error);
    }
  };

  // GET /api/v1/inventory/feed/food-type/:foodId
  const filterFeed = async (foodId: string) => {
    try {
      const res = await getFeedByFoodType(foodId);
      const feed = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];
      setFeedInventory(feed);
    } catch (error) {
      console.error("Feed filter failed", error);
      setFeedInventory([]);
    }
  };

  // ── Mock-inventory helpers ────────────────────────────────────────────────────

  const inventory = selectedFarm
    ? mockInventory.filter((item) => item.farmId === selectedFarm.id)
    : mockInventory;

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const filteredFishBatches = selectedFarm
    ? fishBatches.filter((batch) => batch.farmId === selectedFarm.id)
    : fishBatches;

  const lowStockItems = inventory.filter(
    (item) => item.quantity <= item.reorderLevel
  );

  const expiringItems = inventory.filter((item) => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (new Date(item.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  });

  // ── Badge / icon helpers ──────────────────────────────────────────────────────

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READY_TO_STOCK":
        return (
          <Badge className="bg-green-100 text-green-800" variant="outline">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready to Stock
          </Badge>
        );
      case "QUARANTINE":
        return (
          <Badge className="bg-yellow-100 text-yellow-800" variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Quarantine
          </Badge>
        );
      case "DEPLETED":
        return (
          <Badge className="bg-gray-100 text-gray-800" variant="outline">
            <XCircle className="w-3 h-3 mr-1" />
            Depleted
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHealthCheckBadge = (status: string) => {
    switch (status) {
      case "PASSED":
        return (
          <Badge className="bg-green-100 text-green-800" variant="outline">
            <CheckCircle className="w-3 h-3 mr-1" />
            Passed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-800" variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-100 text-red-800" variant="outline">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feed":
        return ShoppingCart;
      case "medicine":
        return Pill;
      case "tool":
        return Wrench;
      case "fuel":
        return Fuel;
      default:
        return Package;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feed":
        return "bg-blue-100 text-blue-800";
      case "medicine":
        return "bg-green-100 text-green-800";
      case "tool":
        return "bg-purple-100 text-purple-800";
      case "fuel":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStockLevel = (item: (typeof inventory)[0]) => {
    const percentage = (item.quantity / (item.reorderLevel * 2)) * 100;
    return Math.min(percentage, 100);
  };

  const getStockStatus = (item: (typeof inventory)[0]) => {
    if (item.quantity <= item.reorderLevel * 0.5) return "critical";
    if (item.quantity <= item.reorderLevel) return "low";
    return "good";
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    return Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your stock levels</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Feed Consumption Forecast - Farm-wide */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-yellow-700" />
            Feed Consumption Forecast - All Tanks
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Farm-wide feed stock analysis and predictions
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-xs text-gray-600 mb-1">Current Feed Stock</p>
              <p className="text-2xl font-bold text-gray-900">2,850 kg</p>
              <p className="text-xs text-gray-500 mt-1">Across all tanks</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-xs text-gray-600 mb-1">
                Predicted Need (30 days)
              </p>
              <p className="text-2xl font-bold text-gray-900">3,200 kg</p>
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Insufficient stock
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-xs text-gray-600 mb-1">Stockout Date</p>
              <p className="text-2xl font-bold text-red-600">March 8</p>
              <p className="text-xs text-gray-500 mt-1">20 days remaining</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Recommendation
            </h4>
            <div className="text-sm space-y-1">
              <p className="text-blue-800">
                Order <span className="font-bold">850 kg</span> of feed (with
                20% safety buffer)
              </p>
              <p className="text-blue-700">
                Order By: <span className="font-bold">Feb 18, 2026</span> to
                avoid stockout
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Based on current consumption rates across all active tanks
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg border text-sm">
              <p className="text-gray-600 mb-1">Daily Consumption Rate</p>
              <p className="font-semibold">~107 kg/day</p>
            </div>
            <div className="bg-white p-3 rounded-lg border text-sm">
              <p className="text-gray-600 mb-1">Average FCR (All Tanks)</p>
              <p className="font-semibold">1.48</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lowStockItems.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {lowStockItems.length} item(s) below reorder level
              </p>
              <div className="mt-2 space-y-1">
                {lowStockItems.slice(0, 3).map((item) => (
                  <p key={item.id} className="text-xs text-gray-600">
                    • {item.name} ({item.quantity} {item.unit})
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {expiringItems.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {expiringItems.length} item(s) expiring within 90 days
              </p>
              <div className="mt-2 space-y-1">
                {expiringItems.slice(0, 3).map((item) => (
                  <p key={item.id} className="text-xs text-gray-600">
                    • {item.name} ({getDaysUntilExpiry(item.expiryDate)} days)
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="fish-stock" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fish-stock">
            <Fish className="w-4 h-4 mr-2" />
            Fish Stock
          </TabsTrigger>
          <TabsTrigger value="supplies">
            <Package className="w-4 h-4 mr-2" />
            Supplies
          </TabsTrigger>
        </TabsList>

        {/* Fish Stock Tab */}
        <TabsContent value="fish-stock" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Fish Inventory Batches</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Manage fish from purchase orders to tank stocking
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredFishBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Fish className="w-5 h-5 text-[#0A4D68]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-medium">
                              {batch.species}
                            </p>
                            {getStatusBadge(batch.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">PO:</span>{" "}
                              <span className="font-medium">
                                {batch.purchaseOrderId}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Delivered:</span>{" "}
                              <span className="font-medium">
                                {new Date(
                                  batch.deliveryDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Avg Weight:</span>{" "}
                              <span className="font-medium">
                                {batch.averageWeight}g
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                Health Check:
                              </span>{" "}
                              {getHealthCheckBadge(batch.healthCheckStatus)}
                            </div>
                          </div>
                          {batch.notes && (
                            <p className="text-xs text-gray-600 mt-2 italic">
                              {batch.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {batch.quantity.toLocaleString()} fish
                        </p>
                        <p className="text-xs text-gray-600">
                          of {batch.initialQuantity.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {batch.status !== "DEPLETED" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Available</span>
                          <span className="text-gray-900 font-medium">
                            {Math.round(
                              (batch.quantity / batch.initialQuantity) * 100
                            )}
                            %
                          </span>
                        </div>
                        <Progress
                          value={(batch.quantity / batch.initialQuantity) * 100}
                          className="[&>div]:bg-[#0A4D68]"
                        />
                      </div>
                    )}

                    {/* Batch Action Buttons */}
                    <div className="mt-3 pt-3 border-t flex gap-2">
                      {/* Quarantine — PATCH /api/v1/inventory/batches/:id/quarantine */}
                      {batch.status !== "QUARANTINE" &&
                        batch.status !== "DEPLETED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                            onClick={() => handleQuarantine(batch.id)}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Quarantine
                          </Button>
                        )}

                      {/* Health Check — PATCH /api/v1/inventory/batches/:id/health-check */}
                      {batch.healthCheckStatus === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-green-400 text-green-700 hover:bg-green-50"
                          onClick={() => handleHealthCheck(batch.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Health Check
                        </Button>
                      )}

                      {/* Allocate — PATCH /api/v1/inventory/batches/:id/allocate */}
                      {batch.status === "READY_TO_STOCK" &&
                        batch.quantity > 0 && (
                          <Button
                            size="sm"
                            className="flex-1 bg-[#0A4D68] hover:bg-[#083d52]"
                            onClick={() => {
                              setSelectedBatch(batch);
                              setShowAllocateModal(true);
                            }}
                          >
                            <Fish className="w-4 h-4 mr-2" />
                            Allocate to Tank
                          </Button>
                        )}
                    </div>
                  </div>
                ))}

                {filteredFishBatches.length === 0 && (
                  <div className="text-center py-12">
                    <Fish className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No fish inventory found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Purchase orders will appear here
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Supplies Tab */}
        <TabsContent value="supplies" className="mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{inventory.length}</div>
                <p className="text-xs text-gray-600 mt-1">In inventory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">
                  $
                  {inventory
                    .reduce(
                      (sum, item) => sum + item.quantity * item.costPerUnit,
                      0
                    )
                    .toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Current stock value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Low Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-orange-600">
                  {lowStockItems.length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Need reordering</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-red-600">
                  {expiringItems.length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Within 90 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterType === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterType === "feed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("feed")}
                  >
                    Feed
                  </Button>
                  <Button
                    variant={filterType === "medicine" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("medicine")}
                  >
                    Medicine
                  </Button>
                  <Button
                    variant={filterType === "tool" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("tool")}
                  >
                    Tools
                  </Button>
                  <Button
                    variant={filterType === "fuel" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterType("fuel")}
                  >
                    Fuel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredInventory.map((item) => {
                  const Icon = getTypeIcon(item.type);
                  const stockLevel = getStockLevel(item);
                  const stockStatus = getStockStatus(item);
                  const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);

                  return (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm">{item.name}</p>
                              <Badge
                                className={getTypeColor(item.type)}
                                variant="outline"
                              >
                                {item.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              Supplier: {item.supplier}
                            </p>
                            {item.expiryDate && (
                              <p
                                className={`text-xs mt-1 ${
                                  daysUntilExpiry && daysUntilExpiry <= 30
                                    ? "text-red-600"
                                    : daysUntilExpiry && daysUntilExpiry <= 90
                                      ? "text-orange-600"
                                      : "text-gray-600"
                                }`}
                              >
                                Expires:{" "}
                                {new Date(item.expiryDate).toLocaleDateString()}{" "}
                                ({daysUntilExpiry} days)
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">
                            {item.quantity} {item.unit}
                          </p>
                          <p className="text-xs text-gray-600">
                            $
                            {(item.quantity * item.costPerUnit).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Stock Level</span>
                          <span
                            className={`${
                              stockStatus === "critical"
                                ? "text-red-600"
                                : stockStatus === "low"
                                  ? "text-orange-600"
                                  : "text-green-600"
                            }`}
                          >
                            {stockStatus === "critical"
                              ? "Critical"
                              : stockStatus === "low"
                                ? "Low Stock"
                                : "Good"}
                          </span>
                        </div>
                        <Progress
                          value={stockLevel}
                          className={
                            stockStatus === "critical"
                              ? "[&>div]:bg-red-600"
                              : stockStatus === "low"
                                ? "[&>div]:bg-orange-600"
                                : "[&>div]:bg-green-600"
                          }
                        />
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>
                            Reorder at: {item.reorderLevel} {item.unit}
                          </span>
                          <span>
                            ${item.costPerUnit} per {item.unit}
                          </span>
                        </div>
                      </div>

                      {stockStatus !== "good" && (
                        <div className="mt-3 pt-3 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Reorder from {item.supplier}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredInventory.length === 0 && (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No items found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Allocate Fish to Tank Modal */}
      {selectedBatch && (
        <AllocateFishToTank
          batch={selectedBatch}
          isOpen={showAllocateModal}
          onClose={() => {
            setShowAllocateModal(false);
            setSelectedBatch(null);
          }}
          onAllocate={handleAllocate}
          farmId={selectedBatch.farmId}
        />
      )}
    </div>
  );
}
