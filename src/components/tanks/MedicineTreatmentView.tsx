import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  History,
  Loader2,
  Pill,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet, apiPost } from "../../api";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { User } from "../../types";
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

interface MedicineTreatmentViewProps {
  tankId: string;
  tankName: string;
  preSelectedMedicineId?: string;
  onSuccess?: () => void;
  user: User;
}

export function MedicineTreatmentView({
  tankId,
  tankName,
  preSelectedMedicineId,
  onSuccess,
  user,
}: MedicineTreatmentViewProps) {
  const [medicineTypes, setMedicineTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState(
    preSelectedMedicineId || "",
  );
  const [quantityUsed, setQuantityUsed] = useState("");
  const [notes, setNotes] = useState("");
  const [appliedAt, setAppliedAt] = useState(getCurrentDateTimeLocal());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingStock, setRemainingStock] = useState<number | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await apiGet<any>(
        `/inventory/medicine/tank/${tankId}/history`,
      );
      const data = Array.isArray(res) ? res : (res?.data ?? []);
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [tankId]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet<any>("/inventory/medicine-types");
        const data = res?.data ?? res;
        const items = Array.isArray(data)
          ? data
              .map((entry: any) => {
                const id = String(entry?.id || entry?._id || "").trim();
                const name = String(entry?.name || "").trim();
                if (!id || !name) return null;
                return { id, name };
              })
              .filter(Boolean)
          : [];
        setMedicineTypes(items);
      } catch {
        setMedicineTypes([]);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (preSelectedMedicineId && !selectedMedicineId) {
      setSelectedMedicineId(preSelectedMedicineId);
    }
  }, [preSelectedMedicineId, selectedMedicineId]);

  useEffect(() => {
    const checkStock = async () => {
      if (!selectedMedicineId) {
        setRemainingStock(null);
        return;
      }
      try {
        const res = await apiGet<any>("/inventory/medicine");
        const data = res?.data ?? res;
        const items = Array.isArray(data) ? data : [];
        let totalMl = 0;
        for (const entry of items) {
          const typeId = String(
            entry?.medicineTypeId || entry?.medicineType?.id || "",
          ).trim();
          if (typeId === selectedMedicineId) {
            const entryTotalMl =
              Number(entry?.totalMl ?? 0) ||
              Number(entry?.quantity ?? entry?.currentQuantity ?? 0) *
                Number(entry?.mlPerUnit ?? 0);
            totalMl += entryTotalMl;
          }
        }
        setRemainingStock(totalMl);
      } catch {
        setRemainingStock(null);
      }
    };
    void checkStock();
  }, [selectedMedicineId]);

  const handleSubmit = async () => {
    if (!selectedMedicineId) {
      toast.error("Select a medicine type.");
      return;
    }
    if (!appliedAt) {
      toast.error("Applied At is required.");
      return;
    }
    const qty = Number(quantityUsed);
    if (!qty || qty <= 0) {
      toast.error("Enter a valid quantity.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        medicineTypeId: selectedMedicineId,
        tankId,
        quantityUsed: qty,
      };
      if (notes.trim()) payload.notes = notes.trim();
      if (appliedAt) payload.appliedAt = new Date(appliedAt).toISOString();

      const response = await apiPost<any>("/inventory/medicine/apply", payload);

      toast.success("Treatment applied.");
      setQuantityUsed("");
      setNotes("");
      setAppliedAt(getCurrentDateTimeLocal());
      onSuccess?.();
      await fetchApplications();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to apply treatment.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  const isTechnician = user.role === "technician";
  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Pill className="h-5 w-5 text-[#088395]" />
            Apply Treatment — {tankName}
          </CardTitle>
          <p className="text-sm text-slate-500">
            Select a medicine and enter the quantity to apply to this tank.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="treatment-medicine">Medicine</Label>
              <Select
                value={selectedMedicineId}
                onValueChange={setSelectedMedicineId}
              >
                <SelectTrigger id="treatment-medicine">
                  <SelectValue placeholder="-- اختر الدواء --" />
                </SelectTrigger>
                <SelectContent>
                  {medicineTypes.map((med) => (
                    <SelectItem key={med.id} value={med.id}>
                      {med.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment-quantity">
                Quantity (ml)
                {remainingStock !== null && selectedMedicineId && (
                  <span className="ml-2 text-xs text-slate-500">
                    Available: {remainingStock} ml remaining
                  </span>
                )}
              </Label>
              <Input
                id="treatment-quantity"
                type="number"
                min="0.001"
                step="0.1"
                value={quantityUsed}
                onChange={(e) => setQuantityUsed(e.target.value)}
                placeholder="Enter amount in ml"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatment-applied-at">Applied At *</Label>
              <Input
                id="treatment-applied-at"
                type="datetime-local"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="treatment-notes">Notes (optional)</Label>
              <Input
                id="treatment-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Treatment notes..."
              />
            </div>
          </div>

          <div className="flex gap-2">
            {isTechnician && (
              <Button
                className="bg-[#088395] hover:bg-[#0A4D68]"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  !selectedMedicineId ||
                  !quantityUsed ||
                  !appliedAt
                }
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Applying..." : "Apply Treatment"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="h-5 w-5 text-[#088395]" />
            Treatment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : applications.length === 0 ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
              <Pill className="mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm text-slate-500">
                No treatment applications yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...applications]
                .sort((a, b) => {
                  const dateA = new Date(
                    a.appliedAt || a.createdAt || 0,
                  ).getTime();
                  const dateB = new Date(
                    b.appliedAt || b.createdAt || 0,
                  ).getTime();
                  return dateB - dateA;
                })
                .map((app, idx) => {
                  const appDate = app.appliedAt || app.createdAt;
                  const qty = app.quantityUsed ?? app.quantity ?? 0;
                  const medName =
                    app.medicineInventory?.medicine ||
                    app.medicineInventory?.medicineType?.name ||
                    app.medicineName ||
                    app.medicineType?.name ||
                    app.medicineTypeName ||
                    "—";
                  const rowKey = app.id || `app_${idx}`;
                  return (
                    <div
                      key={rowKey}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-[#B9E0E7]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3FBFC]">
                          <Pill className="h-5 w-5 text-[#088395]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {medName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {appDate
                              ? new Date(appDate).toLocaleString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </p>
                          {app.notes && (
                            <p className="mt-0.5 text-xs text-slate-400 italic">
                              {app.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#088395] text-white text-sm px-3 py-1">
                          {qty} ml
                        </Badge>
                        {app.newStatus && (
                          <Badge
                            variant="outline"
                            className="border-amber-200 text-amber-700"
                          >
                            {app.newStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={fetchApplications}
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
