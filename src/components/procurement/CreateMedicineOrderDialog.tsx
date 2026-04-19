import type { Dispatch, SetStateAction } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, XCircle } from 'lucide-react';
import { formatCurrencyEgp, formatNameWithId } from '../../services/procurementUi';

export interface MedicineOrderFormItem {
  medicine: string;
  company: string;
  fishTypeIds: string[];
  quantity: number;
  unitCost: number;
}

interface SupplierOption {
  id: string;
  name: string;
}

interface FishTypeOption {
  id: string;
  name: string;
}

interface CreateMedicineOrderDialogProps {
  open: boolean;
  submitting: boolean;
  supplierId: string;
  suppliers: SupplierOption[];
  items: MedicineOrderFormItem[];
  fishTypes: FishTypeOption[];
  totalCost: number;
  onOpenChange: (open: boolean) => void;
  onSupplierChange: (value: string) => void;
  onItemsChange: Dispatch<SetStateAction<MedicineOrderFormItem[]>>;
  onAddItem: () => void;
  onCreate: () => void | Promise<void>;
}

export function CreateMedicineOrderDialog({
  open,
  submitting,
  supplierId,
  suppliers,
  items,
  fishTypes,
  totalCost,
  onOpenChange,
  onSupplierChange,
  onItemsChange,
  onAddItem,
  onCreate,
}: CreateMedicineOrderDialogProps) {
  const updateItem = (index: number, patch: Partial<MedicineOrderFormItem>) => {
    onItemsChange((previous) =>
      previous.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)),
    );
  };

  const removeItem = (index: number) => {
    onItemsChange((previous) =>
      previous.length === 1 ? previous : previous.filter((_, entryIndex) => entryIndex !== index),
    );
  };

  const toggleFishType = (index: number, fishTypeId: string) => {
    onItemsChange((previous) =>
      previous.map((entry, entryIndex) => {
        if (entryIndex !== index) {
          return entry;
        }

        const isSelected = entry.fishTypeIds.includes(fishTypeId);
        return {
          ...entry,
          fishTypeIds: isSelected
            ? entry.fishTypeIds.filter((entryFishTypeId) => entryFishTypeId !== fishTypeId)
            : [...entry.fishTypeIds, fishTypeId],
        };
      }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Medicine Purchase Order</DialogTitle>
          <DialogDescription>
            Configure medicine line items with manufacturer, fish type applicability, and calculated totals.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Supplier *</Label>
            <Select value={supplierId} onValueChange={onSupplierChange}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {formatNameWithId(supplier.name, supplier.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-xl p-4 space-y-4 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-gray-700">Order Items</h4>
              <Button size="sm" variant="outline" onClick={onAddItem}>
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div key={`medicine-item-form-${index}`} className="rounded-xl border bg-white p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-700">Line Item {index + 1}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 px-3 text-gray-500 hover:text-red-600"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5 space-y-1.5">
                      <Label className="text-sm">Medicine Name *</Label>
                      <Input
                        className="h-10"
                        placeholder="Ex: Oxytetracycline"
                        value={item.medicine}
                        onChange={(event) => updateItem(index, { medicine: event.target.value })}
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-sm">Company / Manufacturer *</Label>
                      <Input
                        className="h-10"
                        placeholder="Ex: AquaVet"
                        value={item.company}
                        onChange={(event) => updateItem(index, { company: event.target.value })}
                      />
                    </div>

                    <div className="md:col-span-3 space-y-1.5">
                      <Label className="text-sm">Quantity *</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-10"
                        value={item.quantity || ''}
                        onChange={(event) => updateItem(index, { quantity: Number(event.target.value) || 0 })}
                      />
                    </div>

                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="text-sm">Unit Cost (EGP) *</Label>
                      <Input
                        type="number"
                        min="0"
                        className="h-10"
                        value={item.unitCost || ''}
                        onChange={(event) => updateItem(index, { unitCost: Number(event.target.value) || 0 })}
                      />
                    </div>

                    <div className="md:col-span-8 rounded-md border bg-slate-50 px-3 py-2 flex items-center justify-between">
                      <span className="text-sm text-gray-600">Line Total</span>
                      <span className="text-sm font-semibold text-[#0A4D68]">
                        {formatCurrencyEgp(item.quantity * item.unitCost)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Applicable Fish Types *</Label>
                      <span className="text-xs text-gray-500">{item.fishTypeIds.length} selected</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 rounded-md border bg-slate-50 p-3 max-h-40 overflow-y-auto">
                      {fishTypes.map((fishType) => (
                        <label
                          key={`${index}-medicine-fish-${fishType.id}`}
                          className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-100"
                        >
                          <input
                            type="checkbox"
                            checked={item.fishTypeIds.includes(fishType.id)}
                            onChange={() => toggleFishType(index, fishType.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="leading-tight">{formatNameWithId(fishType.name, fishType.id)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Grand Total:</span>
              <span className="text-[#0A4D68]">{formatCurrencyEgp(totalCost)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 h-10" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 bg-[#088395] hover:bg-[#0A4D68]"
              onClick={() => void onCreate()}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Purchase Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
