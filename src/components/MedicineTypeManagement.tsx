import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent } from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Pill,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Loader2,
  BellRing,
  Clock,
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
import { User, Farm } from "../types";
import { apiGet, apiPost, apiPut, apiDelete } from "../api";
import { toast } from "sonner";

interface MedicineTypeManagementProps {
  user: User;
  selectedFarm: Farm | null;
}

export default function MedicineTypeManagement({
  user: _user,
  selectedFarm: _selectedFarm,
}: MedicineTypeManagementProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [medicineTypes, setMedicineTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    arabicName: "",
    description: "",
    category: "",
    storageInstructions: "",
    withdrawalPeriodDays: 0,
    lowStockThreshold: 10,
    isActive: true,
    notes: "",
  });

  const fetchMedicineTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<any>("/inventory/medicine-types");
      const rawData = res.data || res || [];
      const normalizedData = Array.isArray(rawData)
        ? rawData.map((item: any) => ({
            ...item,
            id: item.id || item._id,
          }))
        : [];
      setMedicineTypes(normalizedData);
    } catch (err) {
      console.error("Failed to fetch medicine types:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedicineTypes();
  }, [fetchMedicineTypes]);

  const handleEdit = (medicineType: any) => {
    setFormData({
      ...medicineType,
      description: medicineType.description || "",
      category: medicineType.category || "",
      storageInstructions: medicineType.storageInstructions || "",
      withdrawalPeriodDays: medicineType.withdrawalPeriodDays || 0,
      lowStockThreshold: medicineType.lowStockThreshold || 10,
      notes: medicineType.notes || "",
      isActive: medicineType.isActive ?? true,
    });
    setEditingId(medicineType.id);
    setShowCreateModal(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiDelete(`/inventory/medicine-types/${deleteConfirmId}`);
      toast.success("Medicine type deleted");
      fetchMedicineTypes();
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
        await apiPut(`/inventory/medicine-types/${editingId}`, submissionData);
      } else {
        await apiPost("/inventory/medicine-types", submissionData);
      }
      toast.success("Medicine type added successfully");
      fetchMedicineTypes();
    } catch (err) {
      console.warn("API Error - Switching to Mock Data:", err);
      const mockItem = {
        ...formData,
        id: editingId || Math.random().toString(36).substr(2, 9),
      };
      if (editingId) {
        setMedicineTypes((prev) =>
          prev.map((item) => (item.id === editingId ? mockItem : item)),
        );
      } else {
        setMedicineTypes((prev) => [...prev, mockItem]);
      }
      toast.info("تمت الإضافة محلياً");
    } finally {
      setSaving(false);
      setShowCreateModal(false);
      setEditingId(null);
      setFormData({
        name: "",
        arabicName: "",
        description: "",
        category: "",
        storageInstructions: "",
        withdrawalPeriodDays: 0,
        lowStockThreshold: 10,
        isActive: true,
        notes: "",
      });
    }
  };
  const isTechnician = _user.role.toLowerCase() === "technician";
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="bg-[#0A4D68] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-6 h-6" />
            <span className="text-xl font-semibold">
              Medicine Type Management
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Medicine Catalogue</h2>
            <p className="text-sm text-gray-500">
              Manage medicine classification and inventory alert levels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchMedicineTypes()}
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
                <Plus className="w-4 h-4 mr-2" /> Add Medicine Type
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center">
              <Loader2 className="animate-spin text-[#088395]" />
            </div>
          ) : medicineTypes.length === 0 ? (
            <div className="col-span-full py-20 bg-white border border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400">
              <Plus className="w-10 h-10 mb-4 opacity-20" />
              <p>No medicine types registered yet.</p>
              <Button variant="link" onClick={() => setShowCreateModal(true)}>
                Add your first medicine type
              </Button>
            </div>
          ) : (
            medicineTypes.map((medicineType) => (
              <Card
                key={medicineType.id}
                className="bg-white shadow-sm border-t-4 border-[#088395]"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        {medicineType.name}
                      </CardTitle>
                      <p className="text-xs text-gray-400">
                        {medicineType.arabicName}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-[#088395]/10 text-[#088395] border-none flex gap-1 items-center"
                    >
                      <BellRing className="w-3 h-3" />
                      {medicineType.lowStockThreshold || 10}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {medicineType.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {medicineType.category}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className="text-[10px] flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      {medicineType.withdrawalPeriodDays || 0} days
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] flex items-center gap-1"
                    >
                      <BellRing className="w-3 h-3" />
                      {medicineType.lowStockThreshold || 10}
                    </Badge>
                  </div>
                  {medicineType.description && (
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {medicineType.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(medicineType)}
                    >
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => setDeleteConfirmId(medicineType.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
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
                Classification & Safety
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input
                    placeholder="e.g. Antibiotic"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#088395]" />
                    Withdrawal Period (Days)
                  </Label>
                  <Input
                    type="number"
                    value={formData.withdrawalPeriodDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        withdrawalPeriodDays: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Short description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Storage Instructions</Label>
                  <Textarea
                    placeholder="Storage instructions"
                    value={formData.storageInstructions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        storageInstructions: e.target.value,
                      })
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
                    Low Stock Threshold
                  </Label>
                  <Input
                    type="number"
                    step="1"
                    placeholder="e.g. 10"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lowStockThreshold: parseFloat(e.target.value) || 0,
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
                Additional Notes
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Internal notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
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
            This action will remove the medicine type from the catalogue
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
