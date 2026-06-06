// ============================================================
// FoodTypeManagement.tsx  –  Updated by Ziad (Clean Version)
// ============================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Wheat,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  BellRing,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import Pagination from "@mui/material/Pagination";
import {
  User,
  Farm,
  BuoyancyType,
  ManufacturingProcess,
  GrowthStage,
} from "../types";
import { mockFarms } from "../mockData";
import { apiGet, apiPost, apiPut, apiDelete } from "../api";
import { toast } from "sonner";

interface FoodTypeManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function FoodTypeManagement({
  user,
  selectedFarm,
}: FoodTypeManagementProps) {
  const currentFarm = selectedFarm || mockFarms[0];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [foodTypes, setFoodTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 6;

  const [formData, setFormData] = useState({
    name: "",
    arabicName: "",
    proteinPercentage: 30,
    fatPercentage: 6,
    fiberPercentage: 4,
    moisturePercentage: 10,
    ashPercentage: 12,
    pelletSizeMm: 3,
    buoyancyType: "FLOATING" as BuoyancyType,
    manufacturingProcess: "EXTRUDED" as ManufacturingProcess,
    applicableStages: [] as GrowthStage[],
    minFishWeightGrams: 0,
    maxFishWeightGrams: 0,
    shelfLifeDays: 180,
    storageInstructions: "",
    waterStabilityMinutes: 30,
    isActive: true,
    notes: "",
    lowStockThreshold: 100,
  });

  const fetchFoodTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<any>("/aquaculture/food-types?limit=100");
      const rawData = res.data || res || [];
      const normalizedData = Array.isArray(rawData)
        ? rawData.map((item: any) => ({
            ...item,
            id: item.id || item._id,
          }))
        : [];
      setFoodTypes(normalizedData);
      setCurrentPage(0);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoodTypes();
  }, [fetchFoodTypes]);

  const foodTypePages = useMemo(() => {
    const pages = [];

    for (let i = 0; i < foodTypes.length; i += ITEMS_PER_PAGE) {
      pages.push(foodTypes.slice(i, i + ITEMS_PER_PAGE));
    }

    return pages;
  }, [foodTypes]);

  const currentFoodTypes = foodTypePages[currentPage] || [];

  const handleEdit = (foodType: any) => {
    setFormData({
      ...foodType,
      lowStockThreshold: foodType.lowStockThreshold || 100,
    });
    setEditingId(foodType.id);
    setShowCreateModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiDelete(`/aquaculture/food-types/${deleteConfirmId}`);
      toast.success("Food type deleted");
      fetchFoodTypes();
    } catch (err) {
      toast.error("Failed to delete: " + (err as Error).message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.arabicName) {
      toast.error("الاسم والاسم العربي مطلوبين");
      return;
    }

    setSaving(true);
    const { id, createdAt, updatedAt, deletedAt, ...submissionData } =
      formData as any;

    try {
      if (editingId) {
        await apiPut(`/aquaculture/food-types/${editingId}`, submissionData);
      } else {
        await apiPost("/aquaculture/food-types", submissionData);
      }
      toast.success("تم الحفظ بنجاح عبر الـ API");
      fetchFoodTypes();
    } catch (err) {
      console.warn("API Error - Switching to Mock Data:", err);
      const mockItem = {
        ...formData,
        id: editingId || Math.random().toString(36).substr(2, 9),
      };
      if (editingId) {
        setFoodTypes((prev) =>
          prev.map((item) => (item.id === editingId ? mockItem : item)),
        );
      } else {
        setFoodTypes((prev) => [...prev, mockItem]);
      }
      toast.info("تمت الإضافة محلياً");
    } finally {
      setSaving(false);
      setShowCreateModal(false);
      setEditingId(null);
      setFormData({
        name: "",
        arabicName: "",
        proteinPercentage: 30,
        fatPercentage: 6,
        fiberPercentage: 4,
        moisturePercentage: 10,
        ashPercentage: 12,
        pelletSizeMm: 3,
        buoyancyType: "FLOATING",
        manufacturingProcess: "EXTRUDED",
        applicableStages: [],
        minFishWeightGrams: 0,
        maxFishWeightGrams: 0,
        shelfLifeDays: 180,
        storageInstructions: "",
        waterStabilityMinutes: 30,
        isActive: true,
        notes: "",
        lowStockThreshold: 100,
      });
    }
  };
  const isTechnician = user.role.toLowerCase() === "technician";
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wheat className="w-6 h-6" />
            <span className="text-xl font-semibold">Food Type Management</span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Fish Feed Products</h2>
            <p className="text-sm text-gray-500">
              Manage nutritional composition and inventory alert levels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchFoodTypes()}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            {isTechnician && (
              <Button
                className="bg-[#088395] hover:bg-[#0A4D68]"
                onClick={() => {
                  setEditingId(null);
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Food Type
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center">
              <Loader2 className="animate-spin text-[#088395]" />
            </div>
          ) : foodTypes.length === 0 ? (
            <div className="col-span-full py-20 bg-white border border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400">
              <Plus className="w-10 h-10 mb-4 opacity-20" />
              <p>No feed types registered yet.</p>
              <Button variant="link" onClick={() => setShowCreateModal(true)}>
                Add your first food type
              </Button>
            </div>
          ) : (
            currentFoodTypes.map((foodType) => (
              <Card
                key={foodType.id}
                className="bg-white shadow-sm border-t-4 border-[#088395]"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{foodType.name}</CardTitle>
                      <p className="text-xs text-gray-400">
                        {foodType.arabicName}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-[#088395]/10 text-[#088395] border-none flex gap-1 items-center"
                    >
                      <BellRing className="w-3 h-3" />
                      {foodType.lowStockThreshold || 100} kg
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {foodType.proteinPercentage}% Protein
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {foodType.pelletSizeMm}mm
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {foodType.buoyancyType}
                    </Badge>
                  </div>
                  {isTechnician && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(foodType)}
                      >
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => setDeleteConfirmId(foodType.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {!loading && foodTypePages.length > 1 && (
          <div className="flex justify-center py-4">
            <Pagination
              count={foodTypePages.length}
              page={currentPage + 1}
              onChange={(_, page) => setCurrentPage(page - 1)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-6 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="English Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Arabic Name *</Label>
                  <Input
                    placeholder="الاسم بالعربي"
                    value={formData.arabicName}
                    onChange={(e) =>
                      setFormData({ ...formData, arabicName: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                Inventory Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-[#088395]" />
                    Low Stock Threshold (kg)
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 100"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lowStockThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <p className="text-[11px] text-gray-400 pb-2 italic">
                  Systems will alert when stock levels fall below this value.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">
                Composition & Size
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Protein %</Label>
                  <Input
                    type="number"
                    value={formData.proteinPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proteinPercentage: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fat %</Label>
                  <Input
                    type="number"
                    value={formData.fatPercentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fatPercentage: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pellet Size (mm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.pelletSizeMm}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pelletSizeMm: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Create Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            This action will remove the feed type from the catalogue
            permanently.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
