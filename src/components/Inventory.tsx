import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
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
  Trash2,
  RefreshCw,
} from "lucide-react";
import { User, Farm, FishInventoryBatch } from "../types";
import { mockInventory } from "../mockData";
import AllocateFishToTank from "./AllocateFishToTank";
import { apiGet, apiPost } from "../api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { BatchHealthModal } from "./tanks/modals/BatchHealthModal";

import {
  getFeedInventory,
  createFeed,
  getFeedByFoodType,
  getBatches,
  getBatchById,
  quarantineBatch,
  healthCheckBatch,
  allocateBatch,
  deleteFeed,
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

  // Tanks for allocation
  const [tanks, setTanks] = useState<any[]>([]);
  const [isTanksLoading, setIsTanksLoading] = useState(false);

  // Food Types for Add Feed
  const [foodTypes, setFoodTypes] = useState<any[]>([]);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [newFeedData, setNewFeedData] = useState({
    foodTypeId: "",
    quantityKg: "",
    unit: "kg",
    unitCost: "",
    supplier: "",
    storageLocationId: "",
    receivedDate: new Date().toISOString().split("T")[0],
  });

  // Health modal state
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthModalMode, setHealthModalMode] = useState<'health' | 'quarantine'>('health');
  const [batchForHealth, setBatchForHealth] = useState<any>(null);

  // ── Data loaders ─────────────────────────────────────────────────────────────

  // GET /api/v1/inventory/batches
  const loadBatches = async () => {
    try {
      const res = await getBatches();
      const batches = Array.isArray(res) 
        ? res 
        : (res?.data || res?.batches || res?.fishBatches || []);
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
      const feed = Array.isArray(res)
        ? res
        : Array.isArray(res.data)
          ? res.data
          : [];
      setFeedInventory(feed);
    } catch (error) {
      console.error("Error loading feed inventory", error);
      setFeedInventory([]);
    }
  };

  // GET /api/v1/aquaculture/food-types
  const loadFoodTypes = async () => {
    try {
      const res = await apiGet<any>("/aquaculture/food-types");
      const data = res.data || res || [];
      setFoodTypes(data);
    } catch (error) {
      console.error("Error loading food types", error);
    }
  };

  // GET /api/v1/tanks
  const loadTanks = async () => {
    setIsTanksLoading(true);
    try {
      const res = await apiGet<any>("/tanks");
      const data = res.data || res || [];
      setTanks(data);
    } catch (error) {
      console.error("Error loading tanks", error);
    } finally {
      setIsTanksLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
    loadFeed();
    loadTanks();
    loadFoodTypes();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  // GET /api/v1/inventory/batches/:id
  const fetchBatch = async (id: string) => {
    try {
      const res = await getBatchById(id);
      console.log(res);
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

  // health modal handlers
  const handleQuarantine = (batch: any) => {
    setBatchForHealth(batch);
    setHealthModalMode('quarantine');
    setHealthModalOpen(true);
  };

  const handleHealthCheck = (batch: any) => {
    setBatchForHealth(batch);
    setHealthModalMode('health');
    setHealthModalOpen(true);
  };

  // POST /api/v1/inventory/feed
  const handleAddFeed = async () => {
    try {
      if (!newFeedData.foodTypeId || !newFeedData.quantityKg) {
        toast.error("Please select a food type and enter quantity");
        return;
      }

      await createFeed({
        foodTypeId: newFeedData.foodTypeId,
        quantityKg: Number(newFeedData.quantityKg),
        costPerKg: Number(newFeedData.unitCost) || 0,
        receivedDate: new Date(newFeedData.receivedDate).toISOString(),
        storageLocation: newFeedData.storageLocationId || "Main Storage",
        manufacturer: newFeedData.supplier,
        packagingUnit: "Bag",
        unitsReceived: 1
      });

      toast.success("Feed stock added successfully");
      
      // Reset and close
      setIsAddFeedOpen(false);
      setNewFeedData({
        foodTypeId: "",
        quantityKg: "",
        unit: "kg",
        unitCost: "",
        supplier: "",
        storageLocationId: "",
        receivedDate: new Date().toISOString().split("T")[0],
      });

      // Refetch
      await loadFeed();
    } catch (error) {
      console.error("Add feed failed", error);
      toast.error("Failed to add feed. Please check your inputs.");
    }
  };

  // DELETE /api/v1/inventory/feed/:id
  const handleDeleteFeed = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this inventory record?")) {
      return;
    }
    try {
      await deleteFeed(id);
      toast.success("Feed record deleted");
      await loadFeed();
    } catch (error) {
      console.error("Delete feed failed", error);
      toast.error("Failed to delete record.");
    }
  };

  // GET /api/v1/inventory/feed/food-type/:foodId
  const filterFeed = async (foodId: string) => {
    try {
      const res = await getFeedByFoodType(foodId);
      const feed = Array.isArray(res)
        ? res
        : Array.isArray(res.data)
          ? res.data
          : [];
      setFeedInventory(feed);
    } catch (error) {
      console.error("Feed filter failed", error);
      setFeedInventory([]);
    }
  };

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
      case "IN_STOCK":
        return (
          <Badge className="bg-blue-100 text-blue-800" variant="outline">
            <Package className="w-3 h-3 mr-1" />
            In Stock
          </Badge>
        );
      case "AVAILABLE":
        return (
          <Badge className="bg-blue-100 text-blue-800" variant="outline">
            <Package className="w-3 h-3 mr-1" />
            Available
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

  const getStockLevel = (item: any) => {
    const reorderLevel = item.reorderLevel || 500;
    const percentage = ((item.quantity || 0) / (reorderLevel * 2)) * 100;
    return Math.min(percentage, 100);
  };

  const getStockStatus = (item: any) => {
    const reorderLevel = item.reorderLevel || 500;
    const quantity = item.quantity || 0;
    if (quantity <= reorderLevel * 0.5) return "critical";
    if (quantity <= reorderLevel) return "low";
    return "good";
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    return Math.ceil(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
  };

  // ── Mock-inventory helpers ────────────────────────────────────────────────────

  const inventory = selectedFarm
    ? mockInventory.filter((item: any) => item.farmId === selectedFarm.id)
    : mockInventory;

  const filteredFishBatches = selectedFarm
    ? fishBatches.filter((batch: any) => batch.farmId === selectedFarm.id)
    : fishBatches;

  // Combine real feed with other mock supplies
  const combinedInventory = [
    ...feedInventory.map((f: any) => {
      // Find food type object from foodTypes list
      // Handle various ID field names returned by different backend versions
      const foodTypeId = f.foodTypeId || f.foodId || f.foodType_id || f.foodType ||
                         (typeof f.foodType === 'string' ? f.foodType : f.foodType?.id || f.foodType?._id);
      
      const ft = foodTypes.find(t => (t.id || t._id) === foodTypeId);
      
      const name = f.name || (ft ? `${ft.name} ${f.manufacturer ? `(${f.manufacturer})` : ''}` : 'Unknown Feed');
      const arabicName = f.arabicName || ft?.arabicName;
      const unit = f.unit || (ft?.unit || 'kg');
      const quantity = typeof f.quantityKg === 'number' ? f.quantityKg : (typeof f.quantity === 'number' ? f.quantity : 0);
      const costPerUnit = f.costPerKg || f.unitCost || f.costPerUnit || ft?.costPerUnit || 0;
      
      return {
        ...f,
        type: 'feed',
        name,
        arabicName,
        quantity,
        unit,
        reorderLevel: f.reorderLevel || ft?.reorderLevel || 100,
        costPerUnit: costPerUnit,
        supplier: f.manufacturer || f.supplier || ft?.supplier || 'Main Supplier'
      };
    }),
    ...inventory.filter((i: any) => i.type !== 'feed')
  ];

  const finalFilteredInventory = combinedInventory.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const lowStockItems = combinedInventory.filter(
    (item: any) => (item.quantity || 0) <= (item.reorderLevel || 100)
  );

  const expiringItems = combinedInventory.filter((item: any) => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    return daysUntilExpiry !== null && daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  });

  const totalFeedStock = feedInventory.reduce((sum: number, f: any) => {
    const qty = typeof f.quantityKg === 'number' ? f.quantityKg : (typeof f.quantity === 'number' ? f.quantity : 0);
    return sum + qty;
  }, 0);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Track and manage your stock levels</p>
        </div>
        <Button onClick={() => setIsAddFeedOpen(true)} className="bg-[#0A4D68] hover:bg-[#083d52]">
          <Plus className="w-4 h-4 mr-2" />
          Add Feed Stock
        </Button>
      </div>
      
      {/* Feed Stock Summary per Type (Task 3.2) */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {(() => {
          const feedStockByType = foodTypes.map(ft => {
            const total = feedInventory
              .filter(f => (f.foodTypeId || f.foodId || f.foodType_id) === (ft.id || ft._id))
              .reduce((sum, f) => sum + (Number(f.quantityKg) || Number(f.quantity) || 0), 0);
            return { ...ft, total };
          });
          
          return feedStockByType.map(ft => (
            <Card key={ft.id || ft._id} className="min-w-[200px] border-l-4 border-l-[#0A4D68]">
              <CardContent className="p-4">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{ft.name || 'Unknown Type'}</p>
                <div className="flex items-baseline gap-1">
                  <h4 className="text-xl font-black text-gray-900">{ft.total.toLocaleString()}</h4>
                  <span className="text-[10px] text-gray-500 font-medium">kg</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span className="text-gray-500">Value: {(ft.total * (ft.costPerUnit || 0)).toLocaleString()} EGP</span>
                  <Badge className={`${ft.total < 500 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} border-none text-[8px]`}>
                    {ft.total < 500 ? 'REORDER' : 'OK'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ));
        })()}
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
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <p className="text-xs text-gray-600 mb-1 font-medium uppercase tracking-wider">Current Feed Stock</p>
              <p className="text-2xl font-bold text-[#0A4D68]">{totalFeedStock.toLocaleString()} kg</p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Live from inventory
              </p>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Fish Inventory Batches</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Manage fish from purchase orders to tank stocking
                </p>
              </div>
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-[#0A4D68]" onClick={loadBatches}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#f8fafc] text-[#64748b] font-bold uppercase text-[10px] tracking-widest border-b border-[#e2e8f0]">
                    <tr>
                      <th className="px-4 py-4">Batch Identity</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Quantity</th>
                      <th className="px-4 py-4">Average Weight</th>
                      <th className="px-4 py-4">Health Status</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f5f9]">
                    {filteredFishBatches.map((batch) => (
                      <tr key={batch.id} className="hover:bg-[#f8fafc] transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <Fish className="w-4 h-4 text-[#0A4D68]" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{batch.fishTypeName || batch.species || 'Unknown Batch'}</div>
                              <div className="text-[10px] text-gray-400 font-mono">ID: {batch.id}</div>
                              {batch.purchaseOrderId && (
                                <div className="text-[10px] text-gray-500 mt-1">PO: {batch.purchaseOrderId.substring(0, 8)}...</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(batch.status)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="font-bold text-gray-900">{(batch.quantity ?? 0).toLocaleString()} fish</div>
                            <div className="text-[10px] text-gray-500">of {(batch.initialQuantity ?? 0).toLocaleString()} stocked</div>
                            <Progress
                              value={((batch.quantity ?? 0) / (batch.initialQuantity || 1)) * 100}
                              className="h-1 w-24 [&>div]:bg-[#0A4D68]"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-700">
                          {batch.averageWeight || 0}g
                        </td>
                        <td className="px-4 py-4">
                          {getHealthCheckBadge(batch.healthCheckStatus)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {batch.status !== "QUARANTINE" && batch.status !== "DEPLETED" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                onClick={() => handleQuarantine(batch)}
                                title="Quarantine"
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                            )}
                            {batch.healthCheckStatus === "PENDING" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleHealthCheck(batch)}
                                title="Health Check"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {batch.status === "READY_TO_STOCK" && batch.quantity > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[#0A4D68] hover:bg-blue-50"
                                onClick={() => {
                                  setSelectedBatch(batch);
                                  setShowAllocateModal(true);
                                }}
                                title="Allocate to Tank"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

                {filteredFishBatches.length === 0 && (
                  <div className="text-center py-12">
                    <Fish className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No fish inventory found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Purchase orders will appear here
                    </p>
                  </div>
                )}
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
                <div className="text-2xl font-bold">{combinedInventory.length}</div>
                <p className="text-xs text-gray-600 mt-1">In inventory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {combinedInventory
                    .reduce(
                      (sum, item: any) => sum + (item.quantity || 0) * (item.costPerUnit || 0),
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
                <div className="text-2xl text-orange-600 font-bold">
                  {combinedInventory.filter((i: any) => (i.quantity || 0) <= (i.reorderLevel || 100)).length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Need reordering</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Expiring Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl text-red-600 font-bold">
                  {combinedInventory.filter((i: any) => {
                    const days = getDaysUntilExpiry(i.expiryDate);
                    return days !== null && days <= 90;
                  }).length}
                </div>
                <p className="text-xs text-gray-600 mt-1">Within 90 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 relative w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search supplies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <Button
                      variant={filterType === "all" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => setFilterType("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={filterType === "feed" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => setFilterType("feed")}
                    >
                      Feed
                    </Button>
                    <Button
                      variant={filterType === "medicine" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => setFilterType("medicine")}
                    >
                      Medicine
                    </Button>
                  </div>
                  
                  <div className="h-6 w-px bg-gray-200 hidden md:block" />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-gray-400 hover:text-[#0A4D68]"
                    onClick={() => {
                      loadFeed();
                      loadFoodTypes();
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    size="sm"
                    className="bg-[#0A4D68] hover:bg-[#083d52] h-9"
                    onClick={() => setIsAddFeedOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stock
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {finalFilteredInventory.map((item: any) => {
                  const Icon = getTypeIcon(item.type || 'feed');
                  const stockLevel = getStockLevel(item);
                  const stockStatus = getStockStatus(item);
                  const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
                  const itemName = item.name;

                  return (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-gray-100 p-2 rounded-lg">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-[#0A4D68]">{itemName}</p>
                              {item.arabicName && (
                                <p className="text-xs text-gray-400 font-medium">{item.arabicName}</p>
                              )}
                              <Badge
                                className={getTypeColor(item.type || 'feed')}
                                variant="outline"
                              >
                                {item.type || 'Feed'}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600">
                              {item.supplier ? `Supplier: ${item.supplier}` : 'Stock available in storage'}
                            </p>
                            {item.expiryDate && (
                              <p
                                className={`text-xs mt-1 ${daysUntilExpiry && daysUntilExpiry <= 30
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
                        <div className="text-right flex flex-col items-end gap-2 text-right">
                          <div>
                            <p className="text-sm font-bold">
                              {item.quantity.toLocaleString()} {item.unit}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                              Current Stock
                            </p>
                          </div>
                          {item.type === 'feed' && (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="w-7 h-7 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleDeleteFeed(item.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Stock Level</span>
                          <span
                            className={`${stockStatus === "critical"
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

              {finalFilteredInventory.length === 0 && (
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
          isOpen={showAllocateModal}
          onClose={() => {
            setShowAllocateModal(false);
            setSelectedBatch(null);
          }}
          batch={selectedBatch!}
          onAllocate={handleAllocate}
          farmId={selectedFarm?.id || ""}
          availableTanks={tanks}
        />
      )}
      {/* Add Feed Stock Modal */}
      <Dialog open={isAddFeedOpen} onOpenChange={setIsAddFeedOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#0A4D68]">
              <Plus className="w-5 h-5" />
              Add Feed Stock
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="foodType">Food Type</Label>
              <Select
                value={newFeedData.foodTypeId}
                onValueChange={(val: string) => setNewFeedData({ ...newFeedData, foodTypeId: val })}
              >
                <SelectTrigger id="foodType">
                  <SelectValue placeholder="Select a food product" />
                </SelectTrigger>
                <SelectContent>
                  {foodTypes.map(ft => (
                    <SelectItem key={ft.id} value={ft.id}>
                      {ft.name} {ft.brand ? `(${ft.brand})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={newFeedData.quantityKg}
                  onChange={(e) => setNewFeedData({ ...newFeedData, quantityKg: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitCost">Unit Cost (EGP/kg)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  placeholder="0.00"
                  value={newFeedData.unitCost}
                  onChange={(e) => setNewFeedData({ ...newFeedData, unitCost: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="supplier">Supplier / Brand</Label>
              <Input
                id="supplier"
                placeholder="e.g. NewHope, Skretting..."
                value={newFeedData.supplier}
                onChange={(e) => setNewFeedData({ ...newFeedData, supplier: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Received Date</Label>
              <Input
                id="date"
                type="date"
                value={newFeedData.receivedDate}
                onChange={(e) => setNewFeedData({ ...newFeedData, receivedDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFeedOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFeed} className="bg-[#0A4D68] hover:bg-[#083d52]">
              Add to Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Health Check & Quarantine Modal — Inventory Batch version */}
      {batchForHealth && (
        <BatchHealthModal
          open={healthModalOpen}
          onOpenChange={setHealthModalOpen}
          batch={batchForHealth}
          mode={healthModalMode}
          onSuccess={loadBatches}
        />
      )}
    </div>
  );
}
