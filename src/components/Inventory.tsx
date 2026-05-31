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
  Eye,
  Droplet,
} from "lucide-react";
import { User, Farm, FishInventoryBatch } from "../types";
import AllocateFishToTank from "./AllocateFishToTank";
import { apiGet } from "../api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { BatchHealthModal } from "./tanks/modals/BatchHealthModal";
import HarvestedInventoryView from "./sales/HarvestedInventoryView";
import Combobox, { type ComboboxItem } from "./Combobox";
import { getFishTypes } from "../services/fishTypesApi";
import { FEEDING_TASK_COMPLETED_EVENT } from "../services/taskApi";
import {
  createFishPurchaseOrder,
  createMedicinePurchaseOrder,
  createProcurementSupplier,
  getProcurementSuppliers,
} from "../services/procurementApi";

import {
  getFeedInventory,
  createFeed,
  createMedicine,
  getFeedByFoodType,
  getBatches,
  getBatchById,
  allocateBatch,
  deleteFeed,
  getMedicineInventory,
  getMedicineInventoryTotal,
  deleteMedicineBatch,
} from "../api/inventoryApi";

// Types

interface FeedItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  foodType?: string;
  [key: string]: unknown;
}

interface MedicineInventoryBatch {
  id: string;
  farmId: string;
  medicineName: string;
  company: string;
  batchNumber: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  expiryDate?: string;
  status?: string;
  notes?: string;
}

interface MedicineTotalItem {
  medicineName: string;
  totalQuantity: number;
  unit: string;
}

interface InventoryProps {
  user: User;
  selectedFarm: Farm | null;
}

type ResourceType = "feed" | "medicine" | "fish_batch";

// Component

export default function Inventory({ user, selectedFarm }: InventoryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Fish batches - API-driven
  const [fishBatches, setFishBatches] = useState<FishInventoryBatch[]>([]);

  // Allocation modal
  const [selectedBatch, setSelectedBatch] = useState<FishInventoryBatch | null>(
    null,
  );
  const [showAllocateModal, setShowAllocateModal] = useState(false);

  // Feed inventory - API-driven
  const [feedInventory, setFeedInventory] = useState<FeedItem[]>([]);
  const [medicineInventory, setMedicineInventory] = useState<
    MedicineInventoryBatch[]
  >([]);
  const [medicineTotals, setMedicineTotals] = useState<MedicineTotalItem[]>([]);

  // Tanks for allocation
  const [tanks, setTanks] = useState<any[]>([]);
  const [isTanksLoading, setIsTanksLoading] = useState(false);

  // Food Types + Add Resources
  const [foodTypes, setFoodTypes] = useState<any[]>([]);
  const [isAddResourcesOpen, setIsAddResourcesOpen] = useState(false);
  const [newResourceData, setNewResourceData] = useState({
    resourceType: "feed" as ResourceType,
    feedItemId: "",
    medicineItemId: "",
    fishBatchItemId: "",
    quantityKg: "",
    receiveDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });
  const [fishTypeOptions, setFishTypeOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Health modal state
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [healthModalMode, setHealthModalMode] = useState<
    "health" | "quarantine"
  >("health");
  const [batchForHealth, setBatchForHealth] = useState<any>(null);
  const [selectedMedicineBatch, setSelectedMedicineBatch] =
    useState<MedicineInventoryBatch | null>(null);
  const [isMedicineDetailsOpen, setIsMedicineDetailsOpen] = useState(false);
  const [isMedicineDeleting, setIsMedicineDeleting] = useState(false);

  // Data loaders

  const toNumber = (value: unknown, fallback = 0): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const getAlertThreshold = (entry: any, fallback = 0): number => {
    const threshold = toNumber(
      entry?.alertThreshold ??
        entry?.alertthreshold ??
        entry?.reorderLevel ??
        entry?.minimumStock ??
        entry?.minStockLevel ??
        entry?.threshold ??
        entry?.lowStockThreshold ??
        entry?.foodType?.alertThreshold ??
        entry?.foodType?.alertthreshold ??
        entry?.foodType?.reorderLevel ??
        entry?.foodType?.minimumStock ??
        entry?.foodType?.minStockLevel ??
        entry?.foodType?.threshold ??
        entry?.foodType?.lowStockThreshold,
      Number.NaN,
    );

    if (Number.isFinite(threshold) && threshold > 0) {
      return threshold;
    }

    const fallbackNumber = toNumber(fallback, 0);
    return fallbackNumber > 0 ? fallbackNumber : 0;
  };

  const getArrayPayload = (value: any): any[] => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.results)) return value.results;
    if (Array.isArray(value?.batches)) return value.batches;
    if (Array.isArray(value?.fishBatches)) return value.fishBatches;
    if (Array.isArray(value?.totals)) return value.totals;
    return [];
  };

  const resolveFeedExpiryDate = (entry: any): string | undefined => {
    const candidates = [
      entry?.expiryDate,
      entry?.expirationDate,
      entry?.expiresAt,
      entry?.expireDate,
      entry?.expiry,
      entry?.expiry_date,
      entry?.expiration_date,
      entry?.expiryAt,
      entry?.expiration,
      entry?.bestBefore,
      entry?.bestBeforeDate,
      entry?.foodType?.expiryDate,
      entry?.foodType?.expirationDate,
      entry?.foodType?.expiresAt,
    ];

    let selectedValue: string | undefined;
    let selectedTimestamp = Number.NEGATIVE_INFINITY;

    for (const candidate of candidates) {
      const raw =
        candidate instanceof Date
          ? candidate.toISOString()
          : String(candidate ?? "").trim();
      if (!raw) {
        continue;
      }

      const timestamp = new Date(raw).getTime();
      if (!Number.isFinite(timestamp)) {
        continue;
      }

      // Keep the farthest valid expiry date when multiple backend fields exist.
      if (timestamp > selectedTimestamp) {
        selectedTimestamp = timestamp;
        selectedValue = raw;
      }
    }

    return selectedValue;
  };

  const isReadyToAllocateStatus = (status: unknown): boolean => {
    const normalized = String(status || "").toUpperCase();
    return (
      normalized === "READY_TO_STOCK" ||
      normalized === "READY" ||
      normalized === "AVAILABLE"
    );
  };

  const normalizeFishBatch = (batch: any): FishInventoryBatch => {
    const currentQuantity = toNumber(
      batch?.quantity ?? batch?.currentQuantity ?? batch?.currentQty,
      0,
    );
    const initialQuantity = toNumber(
      batch?.initialQuantity ?? batch?.initialCount,
      currentQuantity,
    );
    const averageWeight = toNumber(
      batch?.averageWeight ??
        batch?.avgWeight ??
        batch?.initialWeightGrams ??
        batch?.initialAverageWeight,
      0,
    );

    return {
      id: String(batch?.id || batch?._id || ""),
      farmId: String(batch?.farmId || batch?.farm || selectedFarm?.id || ""),
      purchaseOrderId: String(batch?.purchaseOrderId || ""),
      species: String(
        batch?.species ||
          batch?.fishTypeName ||
          batch?.fishType?.name ||
          "Unknown Batch",
      ),
      quantity: currentQuantity,
      initialQuantity,
      averageWeight,
      status: String(
        batch?.status || "",
      ).toUpperCase() as FishInventoryBatch["status"],
      healthCheckStatus: String(
        batch?.healthCheckStatus || batch?.healthStatus || "PENDING",
      ).toUpperCase() as FishInventoryBatch["healthCheckStatus"],
      healthCheckDate: batch?.healthCheckDate || batch?.healthCheckAt,
      deliveryDate:
        batch?.deliveryDate || batch?.receivedDate || new Date().toISOString(),
      quarantinePeriodDays: toNumber(batch?.quarantinePeriodDays, 0),
      notes: batch?.notes || "",
      fishTypeName: batch?.fishTypeName,
    } as FishInventoryBatch & { fishTypeName?: string };
  };

  const resolveMedicineDisplayName = (
    entry: any,
    fallbackId?: string,
  ): string => {
    const rawName = String(
      entry?.medicineName ||
        entry?.medicine?.name ||
        entry?.name ||
        entry?.itemName ||
        entry?.productName ||
        entry?.tradeName ||
        "",
    ).trim();
    const isUnknownName = !rawName || /^unknown(\s+medicine)?$/i.test(rawName);
    if (!isUnknownName) return rawName;

    const company = String(
      entry?.company ||
        entry?.manufacturer ||
        entry?.supplier ||
        entry?.brand ||
        entry?.medicine?.company ||
        "",
    ).trim();
    if (company && company !== "-") {
      return `${company} Medicine`;
    }

    const id = String(entry?.id || entry?._id || fallbackId || "").trim();
    if (id) {
      return `Medicine ${id.slice(0, 8)}`;
    }

    return "Unnamed Medicine";
  };

  const normalizeMedicineBatch = (
    entry: any,
  ): MedicineInventoryBatch | null => {
    const id = entry?.id || entry?._id;
    if (!id) return null;

    return {
      id: String(id),
      farmId: String(entry?.farmId || entry?.farm || selectedFarm?.id || ""),
      medicineName: resolveMedicineDisplayName(entry, String(id)),
      company: String(
        entry?.company ||
          entry?.manufacturer ||
          entry?.supplier ||
          entry?.brand ||
          entry?.medicine?.company ||
          entry?.medicine?.manufacturer ||
          "-",
      ),
      batchNumber: String(
        entry?.batchNumber ||
          entry?.batch ||
          entry?.lotNumber ||
          entry?.code ||
          "-",
      ),
      quantity: toNumber(
        entry?.quantity ??
          entry?.currentQuantity ??
          entry?.availableQuantity ??
          entry?.stock ??
          entry?.quantityKg,
        0,
      ),
      unit: String(entry?.unit || entry?.quantityUnit || "unit"),
      reorderLevel: toNumber(
        entry?.reorderLevel ??
          entry?.minimumStock ??
          entry?.minStockLevel ??
          10,
        10,
      ),
      expiryDate:
        entry?.expiryDate || entry?.expirationDate || entry?.expiresAt,
      status: String(entry?.status || "").toUpperCase() || undefined,
      notes: entry?.notes || entry?.description || "",
    };
  };

  const getMedicineBatchStatus = (batch: MedicineInventoryBatch): string => {
    if (batch.expiryDate && new Date(batch.expiryDate).getTime() < Date.now()) {
      return "EXPIRED";
    }
    if (batch.quantity <= 0) return "OUT_OF_STOCK";
    if (batch.quantity <= batch.reorderLevel) return "LOW_STOCK";
    return batch.status || "IN_STOCK";
  };

  const medicineStatusBadgeClass = (status: string): string => {
    const normalized = status.toUpperCase();
    if (normalized === "EXPIRED" || normalized === "OUT_OF_STOCK") {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (normalized === "LOW_STOCK") {
      return "bg-orange-100 text-orange-800 border-orange-200";
    }
    return "bg-green-100 text-green-800 border-green-200";
  };

  // GET /api/v1/inventory/batches
  const loadBatches = async () => {
    try {
      const res = await getBatches();
      const batches = getArrayPayload(res).map(normalizeFishBatch);
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
      const feed = getArrayPayload(res);


      setFeedInventory(feed);
    } catch (error) {
      console.error("Error loading feed inventory", error);
      setFeedInventory([]);
    }
  };

  const loadMedicine = async () => {
    try {
      const res = await getMedicineInventory();
      const normalized = getArrayPayload(res)
        .map(normalizeMedicineBatch)
        .filter((item): item is MedicineInventoryBatch => item !== null);
      const filtered = selectedFarm
        ? normalized.filter(
            (item) => !item.farmId || item.farmId === selectedFarm.id,
          )
        : normalized;
      setMedicineInventory(filtered);
    } catch (error) {
      console.error("Error loading medicine inventory", error);
      setMedicineInventory([]);
    }
  };

  const loadMedicineTotals = async () => {
    try {
      const res = await getMedicineInventoryTotal();
      const rows = getArrayPayload(res);
      if (rows.length > 0) {
        setMedicineTotals(
          rows.map((row: any) => ({
            medicineName: String(
              row?.medicineName ||
                row?.name ||
                row?.medicine?.name ||
                "Medicine",
            ),
            totalQuantity: toNumber(
              row?.totalQuantity ?? row?.quantity ?? row?.total ?? row?.stock,
              0,
            ),
            unit: String(row?.unit || row?.quantityUnit || "unit"),
          })),
        );
        return;
      }

      const scalar =
        typeof res === "number"
          ? res
          : typeof res?.data === "number"
            ? res.data
            : Number.NaN;

      if (Number.isFinite(scalar)) {
        setMedicineTotals([
          {
            medicineName: "All Medicines",
            totalQuantity: scalar,
            unit: "unit",
          },
        ]);
      } else {
        setMedicineTotals([]);
      }
    } catch (error) {
      console.error("Error loading medicine totals", error);
      setMedicineTotals([]);
    }
  };

  // GET /api/v1/aquaculture/food-types
  const loadFoodTypes = async () => {
    try {
      const res = await apiGet<any>("/aquaculture/food-types");
      const data = getArrayPayload(res?.data ?? res);
      setFoodTypes(data);
    } catch (error) {
      console.error("Error loading food types", error);
      setFoodTypes([]);
    }
  };

  const loadFishTypeOptions = async () => {
    try {
      const fishTypes = await getFishTypes();
      setFishTypeOptions(
        fishTypes
          .map((entry) => ({
            id: String(entry?.id || entry?._id || ""),
            name: String(entry?.name || entry?.species || "Unknown Fish Type"),
          }))
          .filter((entry) => entry.id),
      );
    } catch (error) {
      console.error("Error loading fish type options", error);
      setFishTypeOptions([]);
    }
  };

  // GET /api/v1/tanks
  const loadTanks = async () => {
    setIsTanksLoading(true);
    try {
      const res = await apiGet<any>("/tanks");
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res?.results)
              ? res.results
              : [];

      const normalized = rawList
        .map((tank: any) => {
          const id = tank?.id || tank?._id;
          if (!id) return null;
          return {
            id: String(id),
            name: String(tank?.name || `Tank ${String(id).slice(0, 6)}`),
            farmId: String(tank?.farmId || selectedFarm?.id || ""),
            status: String(tank?.status || "UNKNOWN").toUpperCase(),
            biomass: Number(tank?.biomass?.actual ?? tank?.biomass ?? 0),
            capacity: Number(
              tank?.biomass?.capacity ??
                tank?.capacity ??
                tank?.biomassLimit ??
                0,
            ),
          };
        })
        .filter(Boolean);

      setTanks(normalized);
    } catch (error) {
      console.error("Error loading tanks", error);
    } finally {
      setIsTanksLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
    loadFeed();
    loadMedicine();
    loadMedicineTotals();
    loadTanks();
    loadFoodTypes();
    loadFishTypeOptions();
  }, []);

  useEffect(() => {
    const handleFeedingTaskCompleted = () => {
      void loadFeed();
    };

    window.addEventListener(
      FEEDING_TASK_COMPLETED_EVENT,
      handleFeedingTaskCompleted,
    );
    return () => {
      window.removeEventListener(
        FEEDING_TASK_COMPLETED_EVENT,
        handleFeedingTaskCompleted,
      );
    };
  }, []);

  useEffect(() => {
    if (!isAddResourcesOpen) return;
    void loadFoodTypes();
    void loadFeed();
    void loadMedicine();
    void loadFishTypeOptions();
  }, [isAddResourcesOpen]);

  // Handlers

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
    avgWeight: number,
    stockingDate: string,
    notes?: string,
  ) => {
    void stockingDate;
    void notes;
    try {
      // Backend allocate route expects: { tankId, quantity, avgWeight }.
      await allocateBatch(batchId, {
        tankId,
        quantity,
        avgWeight: toNumber(avgWeight, 0),
      });
      await loadBatches();
      toast.success("Batch allocated to tank successfully");
    } catch (error) {
      console.error("Allocation failed", error);
      toast.error("Failed to allocate batch to tank");
    } finally {
      setShowAllocateModal(false);
      setSelectedBatch(null);
    }
  };

  // health modal handlers
  const handleQuarantine = (batch: any) => {
    setBatchForHealth(batch);
    setHealthModalMode("quarantine");
    setHealthModalOpen(true);
  };

  const handleHealthCheck = (batch: any) => {
    setBatchForHealth(batch);
    setHealthModalMode("health");
    setHealthModalOpen(true);
  };

  const resetAddResourcesForm = () => {
    setNewResourceData({
      resourceType: "feed",
      feedItemId: "",
      medicineItemId: "",
      fishBatchItemId: "",
      quantityKg: "",
      receiveDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
    });
  };

  const ensureMutationSucceeded = (response: any) => {
    if (!response || typeof response !== "object") {
      return;
    }

    const hasSuccessFlag = Object.prototype.hasOwnProperty.call(
      response,
      "success",
    );
    if (hasSuccessFlag && response.success === false) {
      const message =
        typeof response.message === "string" &&
        response.message.trim().length > 0
          ? response.message
          : "Request failed";
      throw new Error(message);
    }
  };

  const parseApiErrorMessage = (error: unknown): string => {
    if (error instanceof Error && error.message.trim()) {
      const marker = "]:";
      const markerIndex = error.message.indexOf(marker);
      if (
        markerIndex >= 0 &&
        markerIndex + marker.length < error.message.length
      ) {
        return error.message.slice(markerIndex + marker.length).trim();
      }
      return error.message;
    }
    return "Failed to add resource. Please check your input and try again.";
  };

  const isMissingEntityIdError = (value: unknown): boolean => {
    const message = typeof value === "string" ? value : String(value ?? "");
    return /cannot read properties of undefined \(reading 'id'\)/i.test(
      message,
    );
  };

  const resolveUnitCost = (...values: Array<unknown>): number => {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return 1;
  };

  const ensureSupplierForResource = async (
    resourceType: ResourceType,
  ): Promise<string> => {
    const requiredItemTypes =
      resourceType === "feed"
        ? ["FEED", "FOOD"]
        : resourceType === "medicine"
          ? ["MEDICINE"]
          : ["FISH", "FINGERLINGS"];
    const primaryItemType = requiredItemTypes[0];
    const fallbackName =
      resourceType === "feed"
        ? "Inventory Feed Supplier"
        : resourceType === "medicine"
          ? "Inventory Medicine Supplier"
          : "Inventory Fish Supplier";

    const suppliers = await getProcurementSuppliers();
    const existing = suppliers.find((supplier) =>
      (Array.isArray(supplier.items) ? supplier.items : []).some((item) =>
        requiredItemTypes.includes(String(item).toUpperCase()),
      ),
    );
    if (existing?.id) {
      return existing.id;
    }

    const created = await createProcurementSupplier({
      name: fallbackName,
      items: [primaryItemType],
      address: selectedFarm?.name
        ? `Auto-generated for ${selectedFarm.name}`
        : "Auto-generated from Inventory",
    });

    if (!created?.id) {
      const refreshed = await getProcurementSuppliers();
      const fallbackSupplier = refreshed.find((supplier) =>
        (Array.isArray(supplier.items) ? supplier.items : []).some((item) =>
          requiredItemTypes.includes(String(item).toUpperCase()),
        ),
      );
      if (fallbackSupplier?.id) {
        return fallbackSupplier.id;
      }
      throw new Error("Unable to resolve procurement supplier");
    }

    return created.id;
  };

  const handleAddResourceSubmit = async () => {
    const expectsFishCount = newResourceData.resourceType === "fish_batch";
    const expectsUnits = newResourceData.resourceType === "medicine";
    const expectsDiscreteQuantity = expectsFishCount || expectsUnits;
    const quantity = Number(newResourceData.quantityKg);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error(
        expectsFishCount
          ? "Please enter a valid fish count"
          : expectsUnits
            ? "Please enter a valid units quantity"
            : "Please enter a valid quantity in Kg",
      );
      return;
    }

    if (expectsDiscreteQuantity && !Number.isInteger(quantity)) {
      toast.error(
        expectsFishCount
          ? "Fish batch quantity must be a whole number"
          : "Medicine quantity must be a whole number",
      );
      return;
    }

    if (!newResourceData.receiveDate) {
      toast.error("Please choose the receive date");
      return;
    }

    if (
      newResourceData.resourceType === "feed" &&
      !newResourceData.expiryDate
    ) {
      toast.error("Please choose the expiry date for feed");
      return;
    }

    if (
      newResourceData.expiryDate &&
      new Date(newResourceData.expiryDate).getTime() <
        new Date(newResourceData.receiveDate).getTime()
    ) {
      toast.error("Expiry date cannot be earlier than receive date");
      return;
    }

    const receivedDateValue = newResourceData.receiveDate;
    const expiryDateValue = newResourceData.expiryDate || undefined;
    const expiryIsoValue = expiryDateValue
      ? `${expiryDateValue}T00:00:00.000Z`
      : undefined;

    try {
      let response: any;
      const resourceType = newResourceData.resourceType;

      if (resourceType === "feed") {
        const selectedFeedOptionId = String(
          newResourceData.feedItemId || "",
        ).trim();
        if (!selectedFeedOptionId) {
          toast.error("Please select a feed item");
          return;
        }

        const selectedFoodType = foodTypes.find(
          (entry) =>
            String(entry?.id || entry?._id || "").trim() ===
            selectedFeedOptionId,
        );
        const selectedFeedInventoryItem = feedInventory.find((entry: any) => {
          const entryId = String(entry?.id || entry?._id || "").trim();
          const rawFoodType =
            entry?.foodTypeId ||
            entry?.foodType ||
            entry?.foodId ||
            entry?.foodType_id;
          const foodTypeIdFromEntry = String(
            typeof rawFoodType === "object"
              ? rawFoodType?.id || rawFoodType?._id || ""
              : rawFoodType || "",
          ).trim();
          return (
            entryId === selectedFeedOptionId ||
            foodTypeIdFromEntry === selectedFeedOptionId
          );
        });

        const selectedFoodTypeMeta = (selectedFoodType ??
          selectedFeedInventoryItem ??
          {}) as Record<string, unknown>;
        const nestedFoodType = selectedFeedInventoryItem?.foodType;
        const resolvedFoodTypeId = String(
          selectedFoodTypeMeta?.id ||
            selectedFoodTypeMeta?._id ||
            selectedFoodTypeMeta?.foodTypeId ||
            selectedFoodTypeMeta?.foodType_id ||
            (typeof nestedFoodType === "object"
              ? nestedFoodType?.id || nestedFoodType?._id
              : "") ||
            selectedFeedOptionId,
        ).trim();
        const feedUnitCost = resolveUnitCost(
          selectedFoodTypeMeta?.unitCost,
          selectedFoodTypeMeta?.costPerKg,
          selectedFoodTypeMeta?.pricePerKg,
          selectedFoodTypeMeta?.purchasePrice,
        );
        const feedTotalCost = Number((quantity * feedUnitCost).toFixed(2));
        const feedSupplier = String(
          selectedFoodTypeMeta?.supplier ||
            selectedFoodTypeMeta?.manufacturer ||
            selectedFoodTypeMeta?.company ||
            "PO Supplier",
        );

        const buildFeedPayload = (
          withNestedFoodType: boolean,
        ): Record<string, unknown> => {
          const payload: Record<string, unknown> = {
            foodTypeId: resolvedFoodTypeId,
            quantityKg: quantity,
            quantity,
            initialQuantityKg: quantity,
            receivedDate: receivedDateValue,
            receiveDate: receivedDateValue,
            deliveryDate: receivedDateValue,
            packagingUnit: "KG",
            unitsReceived: Math.max(1, Math.ceil(quantity)),
            costPerKg: feedUnitCost,
            costPerUnit: feedUnitCost,
            totalCost: feedTotalCost,
            name: String(
              selectedFoodTypeMeta?.name ||
                selectedFoodTypeMeta?.foodName ||
                "Unknown Feed",
            ),
            supplier: feedSupplier,
            manufacturer: feedSupplier,
          };
          if (withNestedFoodType) {
            payload.foodType = { id: resolvedFoodTypeId };
          }
          if (expiryDateValue) {
            payload.expiryDate = expiryDateValue;
            payload.expirationDate = expiryDateValue;
            payload.expiresAt = expiryIsoValue;
          }
          return payload;
        };

        response = await createFeed(buildFeedPayload(false));
        if (
          response &&
          typeof response === "object" &&
          response.success === false &&
          isMissingEntityIdError(response.message)
        ) {
          // Some backend deployments expect nested `foodType.id` instead of only `foodTypeId`.
          response = await createFeed(buildFeedPayload(true));
        }
      } else if (resourceType === "medicine") {
        const selectedMedicineId = String(
          newResourceData.medicineItemId || "",
        ).trim();
        if (!selectedMedicineId) {
          toast.error("Please select a medicine item");
          return;
        }

        const selectedMedicineItem = medicineInventory.find(
          (entry) =>
            Boolean(entry) &&
            String((entry as MedicineInventoryBatch).id || "").trim() ===
              selectedMedicineId,
        );
        if (!selectedMedicineItem) {
          toast.error("Please select a medicine item");
          return;
        }

        const medicineQuantity = Math.max(1, Math.round(quantity));
        const supplierId = await ensureSupplierForResource("medicine");
        const selectedMedicineMeta =
          selectedMedicineItem as MedicineInventoryBatch &
            Record<string, unknown>;
        const medicineName = resolveMedicineDisplayName(
          selectedMedicineItem,
          selectedMedicineId,
        );
        const medicineCompany =
          String(selectedMedicineItem.company || "").trim() ||
          "Unknown Company";
        const medicineFishTypeId = String(
          selectedMedicineMeta?.fishTypeId ||
            (selectedMedicineMeta?.fishType as any)?.id ||
            fishTypeOptions[0]?.id ||
            "",
        ).trim();
        const medicineUnitCost = resolveUnitCost(
          selectedMedicineMeta?.unitCost,
          selectedMedicineMeta?.costPerUnit,
          selectedMedicineMeta?.purchasePrice,
        );
        await createMedicinePurchaseOrder({
          supplierId,
          items: [
            {
              medicine: medicineName,
              company: medicineCompany,
              fishTypeIds: medicineFishTypeId ? [medicineFishTypeId] : [],
              quantity: medicineQuantity,
              unitCost: medicineUnitCost,
            },
          ],
        });

        const medicineTotalCost = Number(
          (medicineUnitCost * medicineQuantity).toFixed(2),
        );
        const payload: Record<string, unknown> = {
          medicine: medicineName,
          company: medicineCompany,
          quantity: medicineQuantity,
          initialQuantity: medicineQuantity,
          costPerUnit: medicineUnitCost,
          totalCost: medicineTotalCost,
          unitsReceived: medicineQuantity,
          receivedDate: receivedDateValue,
          packagingUnit: "unit",
        };
        if (expiryDateValue) {
          payload.expiryDate = expiryDateValue;
        }
        response = await createMedicine(payload);
      } else if (resourceType === "fish_batch") {
        const selectedFishType = fishTypeOptions.find(
          (entry) =>
            String(entry.id) === String(newResourceData.fishBatchItemId || ""),
        );
        if (!selectedFishType) {
          toast.error("Please select a fish batch item");
          return;
        }

        const batchQuantity = Math.max(1, Math.round(quantity));
        const supplierId = await ensureSupplierForResource("fish_batch");
        const fishUnitCost = 1;
        await createFishPurchaseOrder({
          supplierId,
          items: [
            {
              fishTypeId: selectedFishType.id,
              quantity: batchQuantity,
              totalCost: batchQuantity * fishUnitCost,
            },
          ],
        });

        // Backend currently supports GET (not POST) on /inventory/batches.
        // Fish add-resource flow should create a procurement fish order only.
        response = { success: true };
      } else {
        toast.error("Unsupported resource type selected");
        return;
      }

      ensureMutationSucceeded(response);

      toast.success(
        resourceType === "fish_batch"
          ? "Fish purchase order created successfully"
          : "Resource added successfully",
      );
      setIsAddResourcesOpen(false);
      resetAddResourcesForm();
      await Promise.all([
        loadFeed(),
        loadMedicine(),
        loadMedicineTotals(),
        loadBatches(),
      ]);
    } catch (error) {
      console.error("Add resource failed", error);
      toast.error(parseApiErrorMessage(error));
    }
  };

  // DELETE /api/v1/inventory/feed/:id
  const handleDeleteFeed = async (id: string) => {
    if (
      !window.confirm("Are you sure you want to delete this inventory record?")
    ) {
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

  const openMedicineDetails = (batch: MedicineInventoryBatch) => {
    setSelectedMedicineBatch(batch);
    setIsMedicineDetailsOpen(true);
  };

  const handleDeleteMedicine = async (batch: MedicineInventoryBatch) => {
    if (
      !window.confirm(
        `Delete batch ${batch.batchNumber} for ${batch.medicineName}?`,
      )
    ) {
      return;
    }

    try {
      setIsMedicineDeleting(true);
      await deleteMedicineBatch(batch.id);
      toast.success("Medicine batch deleted");

      if (selectedMedicineBatch?.id === batch.id) {
        setIsMedicineDetailsOpen(false);
        setSelectedMedicineBatch(null);
      }

      await Promise.all([loadMedicine(), loadMedicineTotals()]);
    } catch (error) {
      console.error("Medicine batch deletion failed", error);
      toast.error("Failed to delete medicine batch");
    } finally {
      setIsMedicineDeleting(false);
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

  // Badge and icon helpers

  const getStatusBadge = (status: string) => {
    const normalized = String(status || "").toUpperCase();
    switch (normalized) {
      case "READY_TO_STOCK":
      case "READY":
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
        return <Badge variant="outline">{normalized || "UNKNOWN"}</Badge>;
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

  const mapApiStockStatusToUi = (
    status: unknown,
  ): "good" | "low" | "critical" | null => {
    const normalized = String(status || "").toUpperCase();
    if (!normalized) return null;

    if (
      ["OUT_OF_STOCK", "CONSUMED", "DEPLETED", "EXPIRED", "FAILED"].includes(
        normalized,
      )
    ) {
      return "critical";
    }
    if (["LOW_STOCK", "LOW", "WARNING"].includes(normalized)) {
      return "low";
    }
    if (
      ["IN_STOCK", "AVAILABLE", "READY", "ACTIVE", "GOOD", "PASSED"].includes(
        normalized,
      )
    ) {
      return "good";
    }
    return null;
  };

  const getStockStatus = (item: any) => {
    const apiStatus = mapApiStockStatusToUi(item.status);
    if (apiStatus) return apiStatus;

    const reorderLevel = toNumber(item.reorderLevel, 0);
    const quantity = toNumber(item.quantity, 0);
    if (reorderLevel > 0) {
      if (quantity <= reorderLevel * 0.5) return "critical";
      if (quantity <= reorderLevel) return "low";
    }
    return quantity <= 0 ? "critical" : "good";
  };

  const getStockStatusBadge = (status: "good" | "low" | "critical") => {
    if (status === "critical") {
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-200"
        >
          Critical
        </Badge>
      );
    }
    if (status === "low") {
      return (
        <Badge
          variant="outline"
          className="bg-orange-100 text-orange-800 border-orange-200"
        >
          Low
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-green-100 text-green-800 border-green-200"
      >
        Healthy
      </Badge>
    );
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const expiryTimestamp = new Date(expiryDate).getTime();
    if (!Number.isFinite(expiryTimestamp)) return null;
    return Math.ceil((expiryTimestamp - Date.now()) / (1000 * 60 * 60 * 24));
  };

  // API inventory helpers

  const filteredFishBatches = selectedFarm
    ? fishBatches.filter((batch: any) => batch.farmId === selectedFarm.id)
    : fishBatches;
  const fishStockBatches = filteredFishBatches.filter(
    (batch: any) => String(batch?.status || "").toUpperCase() !== "QUARANTINE",
  );
  const readyToAllocateBatches = filteredFishBatches.filter(
    (batch: any) =>
      isReadyToAllocateStatus(batch.status) && (batch.quantity ?? 0) > 0,
  );

  const feedStockInventory = feedInventory.map((f: any) => {
    // Find food type object from foodTypes list
    // Handle various ID field names returned by different backend versions
    const fid = f.foodTypeId || f.foodType || f.foodId || f.foodType_id;
    const foodTypeId = typeof fid === "object" ? fid?.id || fid?._id : fid;

    const ft = foodTypes.find((t) => (t.id || t._id) === foodTypeId);

    const name =
      f.name ||
      (ft
        ? `${ft.name} ${f.manufacturer ? `(${f.manufacturer})` : ""}`
        : "Unknown Feed");
    const arabicName = f.arabicName || ft?.arabicName;
    const unit = f.unit || ft?.unit || "kg";
    const quantity =
      typeof f.quantityKg === "number"
        ? f.quantityKg
        : typeof f.quantity === "number"
          ? f.quantity
          : 0;
    const costPerUnit =
      f.costPerKg || f.unitCost || f.costPerUnit || ft?.costPerUnit || 0;
    const foodTypeThreshold = getAlertThreshold(ft, 100);

    return {
      ...f,
      type: "feed",
      name,
      arabicName,
      quantity,
      initialQuantity: toNumber(
        f.initialQuantityKg ?? f.initialQuantity ?? quantity,
        quantity,
      ),
      unit,
      reorderLevel: getAlertThreshold(f, foodTypeThreshold),
      costPerUnit: costPerUnit,
      supplier: f.manufacturer || f.supplier || ft?.supplier || "Main Supplier",
      expiryDate: resolveFeedExpiryDate(f),
      status: f.status || "IN_STOCK",
      batchNumber: f.batchNumber || "-",
    };
  });

  const finalFilteredInventory = feedStockInventory.filter((item: any) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const expiringItems = feedStockInventory.filter((item: any) => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
    return (
      daysUntilExpiry !== null && daysUntilExpiry <= 90 && daysUntilExpiry > 0
    );
  });

  const lowFeedStockCount = feedStockInventory.filter(
    (item: any) => getStockStatus(item) !== "good",
  ).length;
  const totalMedicineStock = medicineInventory.reduce(
    (sum, batch) => sum + (batch.quantity || 0),
    0,
  );
  const expiredMedicineCount = medicineInventory.filter(
    (batch) => getMedicineBatchStatus(batch) === "EXPIRED",
  ).length;
  const lowMedicineStockCount = medicineInventory.filter(
    (batch) => getMedicineBatchStatus(batch) === "LOW_STOCK",
  ).length;

  const dedupeComboboxItems = (
    items: Array<ComboboxItem | null>,
  ): ComboboxItem[] => {
    const seen = new Set<string>();
    return items.filter((item): item is ComboboxItem => {
      if (!item || !item.value) return false;
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
  };

  const addResourceFeedItems: ComboboxItem[] = dedupeComboboxItems([
    ...foodTypes.map((foodType) => {
      const id = String(foodType?.id || foodType?._id || "").trim();
      if (!id) return null;
      const name = String(foodType?.name || "Unknown Feed");
      return {
        value: id,
        label: name,
        sub: `ID: ${id.slice(0, 8)}`,
      };
    }),
    ...feedInventory.map((entry: any) => {
      const rawFoodType =
        entry?.foodTypeId ||
        entry?.foodType ||
        entry?.foodId ||
        entry?.foodType_id;
      const foodTypeId = String(
        typeof rawFoodType === "object"
          ? rawFoodType?.id || rawFoodType?._id || ""
          : rawFoodType || "",
      ).trim();
      const entryId = String(entry?.id || entry?._id || "").trim();
      const optionId = foodTypeId || entryId;
      if (!optionId) return null;
      const label = String(
        entry?.name ||
          (typeof rawFoodType === "object" ? rawFoodType?.name : "") ||
          `Feed ${optionId.slice(0, 8)}`,
      );
      const supplier = String(
        entry?.supplier || entry?.manufacturer || "",
      ).trim();
      return {
        value: optionId,
        label,
        sub: supplier
          ? `${supplier} - ID: ${optionId.slice(0, 8)}`
          : `ID: ${optionId.slice(0, 8)}`,
      };
    }),
  ]);

  const addResourceMedicineItems: ComboboxItem[] = medicineInventory
    .map((medicineItem) => {
      const id = String(medicineItem.id || "").trim();
      if (!id) return null;
      return {
        value: id,
        label: resolveMedicineDisplayName(medicineItem, id),
        sub: `${medicineItem.company || "Unknown Company"} - ID: ${id.slice(0, 8)}`,
      };
    })
    .filter((item): item is ComboboxItem => item !== null);

  const addResourceFishBatchItems: ComboboxItem[] = fishTypeOptions.map(
    (fishType) => ({
      value: fishType.id,
      label: fishType.name,
      sub: `ID: ${fishType.id.slice(0, 8)}`,
    }),
  );

  const addResourceItemOptions: ComboboxItem[] =
    newResourceData.resourceType === "feed"
      ? addResourceFeedItems
      : newResourceData.resourceType === "medicine"
        ? addResourceMedicineItems
        : addResourceFishBatchItems;

  const addResourceItemLabel =
    newResourceData.resourceType === "feed"
      ? "Feed Item"
      : newResourceData.resourceType === "medicine"
        ? "Medicine Item"
        : "Fish Batch Item";

  const addResourceItemPlaceholder =
    newResourceData.resourceType === "feed"
      ? "Search or select feed item..."
      : newResourceData.resourceType === "medicine"
        ? "Search or select medicine item..."
        : "Search or select fish batch item...";

  const addResourceEmptyText =
    newResourceData.resourceType === "feed"
      ? "No feed items available."
      : newResourceData.resourceType === "medicine"
        ? "No medicine items available from API."
        : "No fish batch items available from API.";

  const addResourceSelectedItemValue =
    newResourceData.resourceType === "feed"
      ? newResourceData.feedItemId
      : newResourceData.resourceType === "medicine"
        ? newResourceData.medicineItemId
        : newResourceData.fishBatchItemId;

  const handleAddResourceItemChange = (item: ComboboxItem | null) => {
    const selectedId = item?.value ?? "";

    setNewResourceData((previous) => {
      if (previous.resourceType === "feed") {
        return { ...previous, feedItemId: selectedId };
      }
      if (previous.resourceType === "medicine") {
        return { ...previous, medicineItemId: selectedId };
      }
      return { ...previous, fishBatchItemId: selectedId };
    });
  };

  const addResourceQuantityLabel =
    newResourceData.resourceType === "fish_batch"
      ? "Quantity (Fish Count)"
      : newResourceData.resourceType === "medicine"
        ? "Quantity (Units)"
        : "Quantity (Kg)";
  const addResourceQuantityStep =
    newResourceData.resourceType === "feed" ? "0.01" : "1";
  const addResourceQuantityPlaceholder =
    newResourceData.resourceType === "fish_batch"
      ? "100"
      : newResourceData.resourceType === "medicine"
        ? "1"
        : "1";

  // Render
  const currentFarm = selectedFarm;
  console.log(
    "🔍 user.role:",
    user.role,
    "| is warehouse:",
    user.role === "warehouse",
  ); // 👈 add here
  return (
    <>
      {" "}
      <div className="bg-[#0A4D68] px-6 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="h-6 w-6" />
            <span className="text-xl font-semibold">Inventory Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">{currentFarm?.name}</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#088395] font-semibold">
              {user.name
                .split(" ")
                .map((segment) => segment[0])
                .join("")
                .toUpperCase()}
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="mt-1 text-md text-black-600">
              Track and manage your stock levels
            </p>
          </div>

          {user.role === "warehouse" && (
            <Button
              onClick={() => setIsAddResourcesOpen(true)}
              className="bg-[#088395] hover:bg-[#0A4D68]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Resources
            </Button>
          )}
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="fish-stock" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="fish-stock">
              <Fish className="w-4 h-4 mr-2" />
              Fish Stock
            </TabsTrigger>
            <TabsTrigger value="allocate">
              <Plus className="w-4 h-4 mr-2" />
              Allocate to Tank
            </TabsTrigger>
            <TabsTrigger value="feed-stock">
              <Package className="w-4 h-4 mr-2" />
              Feed Stock
            </TabsTrigger>
            <TabsTrigger value="harvested-fish">
              <Fish className="w-4 h-4 mr-2" />
              Harvested Fish
            </TabsTrigger>
            <TabsTrigger value="medicine">
              <Pill className="w-4 h-4 mr-2" />
              Medicine
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
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-gray-400 hover:text-[#0A4D68]"
                  onClick={loadBatches}
                >
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {fishStockBatches.map((batch) => (
                        <tr
                          key={batch.id}
                          className="hover:bg-[#f8fafc] transition-colors group"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg group-hover:bg-blue-100 transition-colors">
                                <Fish className="w-4 h-4 text-[#0A4D68]" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">
                                  {batch.fishTypeName ||
                                    batch.species ||
                                    "Unknown Batch"}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono">
                                  ID: {batch.id?.split("-")[0] ?? batch.id}
                                </div>
                                {batch.purchaseOrderId && (
                                  <div className="text-[10px] text-gray-500 mt-1">
                                    PO: {batch.purchaseOrderId.substring(0, 8)}
                                    ...
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {getStatusBadge(batch.status)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-gray-900">
                                {(batch.quantity ?? 0).toLocaleString()} fish
                              </div>
                              <div className="text-[10px] text-gray-500">
                                of{" "}
                                {(batch.initialQuantity ?? 0).toLocaleString()}{" "}
                                stocked
                              </div>
                              <Progress
                                value={
                                  ((batch.quantity ?? 0) /
                                    (batch.initialQuantity || 1)) *
                                  100
                                }
                                className="h-1 w-24 [&>div]:bg-[#0A4D68]"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {fishStockBatches.length === 0 && (
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

          {/* Allocate to Tank Tab */}
          <TabsContent value="allocate" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Allocate Fish to Tank</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose any ready batch and allocate it directly to a tank
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-gray-400 hover:text-[#0A4D68]"
                  onClick={loadBatches}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {readyToAllocateBatches.length === 0 && (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-gray-50">
                    <Fish className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No batches are ready to stock right now.
                    </p>
                  </div>
                )}

                {readyToAllocateBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-[#0A4D68]">
                        {batch.fishTypeName || batch.species || "Fish Batch"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Batch ID: {batch.id?.split("-")[0] ?? batch.id}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                        <span>
                          Qty:{" "}
                          <span className="font-medium">
                            {(batch.quantity ?? 0).toLocaleString()} fish
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(batch.status)}
                      <Button
                        className="bg-[#0A4D68] hover:bg-[#083d52]"
                        onClick={() => {
                          setSelectedBatch(batch);
                          setShowAllocateModal(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Allocate to Tank
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feed Stock Tab */}
          <TabsContent value="feed-stock" className="mt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Feed Batches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {feedStockInventory.length}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Feed records in inventory
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Low Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl text-orange-600 font-bold">
                    {lowFeedStockCount}
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
                    {
                      expiringItems.filter((i: any) => {
                        const days = getDaysUntilExpiry(i.expiryDate);
                        return days !== null && days <= 90;
                      }).length
                    }
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
                      placeholder="Search feed stock..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {finalFilteredInventory.map((item: any) => {
                    const Icon = getTypeIcon("feed");
                    const daysUntilExpiry = getDaysUntilExpiry(item.expiryDate);
                    const itemName = item.name;
                    const stockStatus = getStockStatus(item);
                    const quantity = toNumber(item.quantity, 0);
                    const initialQuantity = toNumber(
                      item.initialQuantity ?? item.quantity,
                      quantity,
                    );
                    const reorderLevel = toNumber(item.reorderLevel, 0);
                    const stockLevelPercent =
                      initialQuantity > 0
                        ? Math.min(100, (quantity / initialQuantity) * 100)
                        : 0;
                    const stockProgressClass =
                      stockStatus === "critical"
                        ? "h-1.5 mt-2 [&>div]:bg-red-500"
                        : stockStatus === "low"
                          ? "h-1.5 mt-2 [&>div]:bg-orange-500"
                          : "h-1.5 mt-2 [&>div]:bg-emerald-500";

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
                                <p className="font-semibold text-[#0A4D68]">
                                  {itemName}
                                </p>
                              </div>
                              <p className="text-xs text-gray-600">
                                {item.supplier
                                  ? `Supplier: ${item.supplier}`
                                  : "Stock available in storage"}
                              </p>
                              <p className="text-xs text-gray-700 mt-1">
                                Stock level:{" "}
                                <span className="font-semibold">
                                  {quantity.toLocaleString()} {item.unit}
                                </span>
                              </p>
                              {reorderLevel > 0 && (
                                <p className="text-xs text-gray-600">
                                  Reorder level: {reorderLevel.toLocaleString()}{" "}
                                  {item.unit}
                                </p>
                              )}
                              <Progress
                                value={stockLevelPercent}
                                className={stockProgressClass}
                              />
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
                                  {new Date(
                                    item.expiryDate,
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2 text-right">
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {finalFilteredInventory.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No feed stock found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Try adjusting your search or add a new feed resource
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="harvested-fish" className="mt-4">
            <HarvestedInventoryView user={user} selectedFarm={selectedFarm} />
          </TabsContent>

          <TabsContent value="medicine" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Medicine Batches</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {medicineInventory.length}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Active inventory rows
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Quantity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalMedicineStock.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Across all medicine batches
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Low Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {lowMedicineStockCount}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Needs refill soon
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Expired</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {expiredMedicineCount}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Do not use</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Medicine Inventory List</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Table view with quantity status and batch-level controls
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-gray-400 hover:text-[#0A4D68]"
                  onClick={() => {
                    loadMedicine();
                    loadMedicineTotals();
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {medicineInventory.length === 0 ? (
                  <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
                    <Pill className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No medicine inventory found for this farm.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Once medicine stock is received, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-[#f8fafc] text-[#64748b] font-bold uppercase text-[10px] tracking-widest border-b border-[#e2e8f0]">
                        <tr>
                          <th className="px-4 py-3">Medicine</th>
                          <th className="px-4 py-3">Company</th>
                          <th className="px-4 py-3">Quantity</th>
                          <th className="px-4 py-3">Expiry Date</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9]">
                        {medicineInventory.map((batch) => {
                          const status = getMedicineBatchStatus(batch);
                          return (
                            <tr
                              key={batch.id}
                              className="hover:bg-[#f8fafc] transition-colors"
                            >
                              <td className="px-4 py-3 font-semibold text-[#0A4D68]">
                                {batch.medicineName}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {batch.company || "-"}
                              </td>
                              <td className="px-4 py-3">
                                {batch.quantity.toLocaleString()} {batch.unit}
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {batch.expiryDate
                                  ? new Date(
                                      batch.expiryDate,
                                    ).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant="outline"
                                  className={medicineStatusBadgeClass(status)}
                                >
                                  {status.replace(/_/g, " ")}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openMedicineDetails(batch)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Details
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteMedicine(batch)}
                                    disabled={isMedicineDeleting}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
        {/* Add Resources Modal */}
        <Dialog
          open={isAddResourcesOpen}
          onOpenChange={(open: boolean) => {
            setIsAddResourcesOpen(open);
            if (!open) {
              resetAddResourcesForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#0A4D68]">
                <Plus className="w-5 h-5" />
                Add resources
              </DialogTitle>
              <DialogDescription className="sr-only">
                Add inventory resources and select resource type, item,
                quantity, receive date, and expiry date.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="resourceType">Resource Type</Label>
                <Select
                  value={newResourceData.resourceType}
                  onValueChange={(value: ResourceType) => {
                    setNewResourceData((previous) => ({
                      ...previous,
                      resourceType: value,
                      feedItemId: "",
                      medicineItemId: "",
                      fishBatchItemId: "",
                    }));
                  }}
                >
                  <SelectTrigger id="resourceType">
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feed">Feed</SelectItem>
                    <SelectItem value="medicine">Medicine</SelectItem>
                    <SelectItem value="fish_batch">Fish Batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Combobox
                items={addResourceItemOptions}
                value={addResourceSelectedItemValue || null}
                onChange={handleAddResourceItemChange}
                label={addResourceItemLabel}
                placeholder={addResourceItemPlaceholder}
                searchPlaceholder="Search by name or ID..."
                emptyText={addResourceEmptyText}
              />
              <p className="text-xs text-gray-500">
                {addResourceItemOptions.length > 0
                  ? `${addResourceItemOptions.length} item(s) available`
                  : addResourceEmptyText}
              </p>

              <div className="grid gap-2">
                <Label htmlFor="quantityKg">{addResourceQuantityLabel}</Label>
                <Input
                  id="quantityKg"
                  type="number"
                  min="1"
                  step={addResourceQuantityStep}
                  placeholder={addResourceQuantityPlaceholder}
                  value={newResourceData.quantityKg}
                  onChange={(event) =>
                    setNewResourceData((previous) => ({
                      ...previous,
                      quantityKg: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="receiveDate">Receive Date</Label>
                <Input
                  id="receiveDate"
                  type="date"
                  value={newResourceData.receiveDate}
                  onChange={(event) =>
                    setNewResourceData((previous) => ({
                      ...previous,
                      receiveDate: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newResourceData.expiryDate}
                  onChange={(event) =>
                    setNewResourceData((previous) => ({
                      ...previous,
                      expiryDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddResourceSubmit}
                className="bg-[#0A4D68] hover:bg-[#083d52]"
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isMedicineDetailsOpen}
          onOpenChange={(open: boolean) => {
            setIsMedicineDetailsOpen(open);
            if (!open) {
              setSelectedMedicineBatch(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[540px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#0A4D68]">
                <Pill className="w-5 h-5" />
                Medicine Details
              </DialogTitle>
            </DialogHeader>

            {selectedMedicineBatch && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Medicine</p>
                    <p className="font-semibold">
                      {selectedMedicineBatch.medicineName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="font-medium">
                      {selectedMedicineBatch.company || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Batch</p>
                    <p className="font-mono text-xs">
                      {selectedMedicineBatch.batchNumber || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <Badge
                      variant="outline"
                      className={medicineStatusBadgeClass(
                        getMedicineBatchStatus(selectedMedicineBatch),
                      )}
                    >
                      {getMedicineBatchStatus(selectedMedicineBatch).replace(
                        /_/g,
                        " ",
                      )}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Current Quantity</p>
                    <p className="font-semibold">
                      {selectedMedicineBatch.quantity.toLocaleString()}{" "}
                      {selectedMedicineBatch.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expiry Date</p>
                    <p className="font-medium">
                      {selectedMedicineBatch.expiryDate
                        ? new Date(
                            selectedMedicineBatch.expiryDate,
                          ).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Health Check & Quarantine Modal - Inventory Batch version */}
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
    </>
  );
}
