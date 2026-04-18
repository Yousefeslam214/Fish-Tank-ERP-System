import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { CheckCircle, Fish, AlertCircle } from 'lucide-react';
import { FishInventoryBatch } from '../types';
import { mockTanks } from '../mockData';

interface AllocateFishToTankProps {
  batch: FishInventoryBatch;
  isOpen: boolean;
  onClose: () => void;
  onAllocate: (
    batchId: string,
    tankId: string,
    quantity: number,
    avgWeight: number,
    stockingDate: string,
    notes?: string
  ) => void;
  farmId: string;
  availableTanks?: any[];
}

interface FormErrors {
  tank?: string;
  quantity?: string;
  avgWeight?: string;
  stockingDate?: string;
  notes?: string;
}

const ALLOCATABLE_STATUSES = new Set(['ACTIVE', 'READY', 'EMPTY']);
const MAX_NOTES_LENGTH = 500;

export default function AllocateFishToTank({
  batch,
  isOpen,
  onClose,
  onAllocate,
  farmId,
  availableTanks = [],
}: AllocateFishToTankProps) {
  const todayDate = new Date().toISOString().split('T')[0];

  const [selectedTankId, setSelectedTankId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [avgWeight, setAvgWeight] = useState<string>(String(batch.averageWeight ?? 0));
  const [stockingDate, setStockingDate] = useState<string>(todayDate);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setAvgWeight(String(batch.averageWeight ?? 0));
  }, [batch.id, batch.averageWeight]);

  const normalizeTank = (tank: any) => {
    const id = tank?.id || tank?._id;
    if (!id) return null;

    return {
      id: String(id),
      name: String(tank?.name || `Tank ${String(id).slice(0, 6)}`),
      farmId: String(tank?.farmId || ''),
      status: String(tank?.status || 'UNKNOWN').toUpperCase(),
      biomass: Number(tank?.biomass?.actual ?? tank?.biomass ?? 0),
      capacity: Number(tank?.biomass?.capacity ?? tank?.capacity ?? tank?.biomassLimit ?? 0),
    };
  };

  const tanks = useMemo(() => {
    const source = availableTanks.length > 0 ? availableTanks : mockTanks;
    const normalized = source.map(normalizeTank).filter(Boolean) as Array<{
      id: string;
      name: string;
      farmId: string;
      status: string;
      biomass: number;
      capacity: number;
    }>;

    return normalized.filter((tank) => {
      const farmMatch = !farmId || tank.farmId === farmId;
      const statusMatch = ALLOCATABLE_STATUSES.has(tank.status);
      return farmMatch && statusMatch;
    });
  }, [availableTanks, farmId]);

  const selectedTank = tanks.find((tank) => tank.id === selectedTankId);

  const getCapacityPercentage = (tank: { biomass: number; capacity: number }) => {
    return Math.round(((tank.biomass || 0) / (tank.capacity || 1)) * 100);
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (tanks.length === 0) {
      newErrors.tank = 'No allocatable tanks available';
    }

    if (!selectedTankId) {
      newErrors.tank = 'Please select a tank';
    } else if (!tanks.some((tank) => tank.id === selectedTankId)) {
      newErrors.tank = 'Selected tank is not valid';
    }

    const parsedQuantity = Number(quantity);
    if (!quantity || Number.isNaN(parsedQuantity)) {
      newErrors.quantity = 'Please enter a valid quantity';
    } else if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      newErrors.quantity = 'Quantity must be a whole number greater than zero';
    } else if (parsedQuantity > batch.quantity) {
      newErrors.quantity = `Quantity cannot exceed ${batch.quantity.toLocaleString()} fish`;
    }

    const parsedAvgWeight = Number(avgWeight);
    if (avgWeight === '' || Number.isNaN(parsedAvgWeight)) {
      newErrors.avgWeight = 'Please enter average weight';
    } else if (parsedAvgWeight < 0) {
      newErrors.avgWeight = 'Average weight cannot be negative';
    } else if (parsedAvgWeight > 10000) {
      newErrors.avgWeight = 'Average weight is too high';
    }

    if (!stockingDate) {
      newErrors.stockingDate = 'Please select a stocking date';
    } else if (stockingDate > todayDate) {
      newErrors.stockingDate = 'Stocking date cannot be in the future';
    }

    if (notes.length > MAX_NOTES_LENGTH) {
      newErrors.notes = `Notes cannot exceed ${MAX_NOTES_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    onAllocate(
      batch.id,
      selectedTankId,
      Number(quantity),
      Number(avgWeight),
      stockingDate,
      notes.trim() || undefined
    );

    handleClose();
  };

  const handleClose = () => {
    setSelectedTankId('');
    setQuantity('');
    setAvgWeight(String(batch.averageWeight ?? 0));
    setStockingDate(todayDate);
    setNotes('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl p-0 h-[90vh] max-h-[90vh] overflow-hidden gap-0"
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        <div className="h-full flex flex-col" style={{ minHeight: 0 }}>
          <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Fish className="w-6 h-6 text-[#0A4D68]" />
              Allocate Fish to Tank
            </DialogTitle>
          </DialogHeader>

          <div className="allocate-modal-scroll px-6 py-4 space-y-6 pb-8" style={{ flex: 1, minHeight: 0 }}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Fish className="w-5 h-5 text-[#0A4D68]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-bold text-gray-700">Inventory Batch</p>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {batch.id.split('-')[0]}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">Species</p>
                      <p className="font-medium">{batch.species}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Available</p>
                      <p className="font-medium">{batch.quantity.toLocaleString()} fish</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Avg Weight</p>
                      <p className="font-medium">{avgWeight || '0'} g</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Health Check</p>
                      <Badge className="bg-green-100 text-green-800" variant="outline">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        PASSED
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tank">
                Select Tank <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedTankId} onValueChange={setSelectedTankId}>
                <SelectTrigger id="tank" className={errors.tank ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Choose a tank..." />
                </SelectTrigger>
                <SelectContent>
                  {tanks.map((tank) => {
                    const capacityPercent = getCapacityPercentage(tank);
                    const isNearCapacity = capacityPercent >= 80;

                    return (
                      <SelectItem key={tank.id} value={tank.id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{tank.name}</span>
                          <span className={`text-xs ${isNearCapacity ? 'text-orange-600' : 'text-gray-600'}`}>
                            {capacityPercent}% capacity
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                  {tanks.length === 0 && (
                    <SelectItem value="__no_tanks__" disabled>
                      No available tanks for allocation
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.tank && <p className="text-xs text-red-600">{errors.tank}</p>}
              {tanks.length === 0 && (
                <p className="text-xs text-orange-600">
                  No allocatable tanks found. Tank must be in ACTIVE, READY, or EMPTY status.
                </p>
              )}

              {selectedTank && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current Capacity:</span>
                    <span className={getCapacityPercentage(selectedTank) >= 80 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                      {(selectedTank.biomass || 0).toLocaleString()}/
                      {(selectedTank.capacity || 0).toLocaleString()} kg ({getCapacityPercentage(selectedTank)}%)
                      {getCapacityPercentage(selectedTank) < 80 ? ' - Safe' : ' - Near limit'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="avgWeight">
                Avg Weight (g) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="avgWeight"
                type="number"
                value={avgWeight}
                onChange={(e) => {
                  setAvgWeight(e.target.value);
                  if (errors.avgWeight) {
                    setErrors({ ...errors, avgWeight: undefined });
                  }
                }}
                placeholder="Enter average weight in grams"
                className={errors.avgWeight ? 'border-red-500' : ''}
                min="0"
                step="0.01"
              />
              {errors.avgWeight && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.avgWeight}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity to Stock <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    if (errors.quantity) {
                      setErrors({ ...errors, quantity: undefined });
                    }
                  }}
                  placeholder="Enter number of fish"
                  className={errors.quantity ? 'border-red-500' : ''}
                  min="1"
                  step="1"
                  max={batch.quantity}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">fish</span>
              </div>
              {errors.quantity && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.quantity}
                </p>
              )}
              {quantity && !errors.quantity && Number(quantity) > 0 && (
                <p className="text-xs text-gray-600">
                  Remaining in inventory: <span className="font-medium">{(batch.quantity - Number(quantity)).toLocaleString()} fish</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockingDate">
                Stocking Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stockingDate"
                type="date"
                value={stockingDate}
                onChange={(e) => {
                  setStockingDate(e.target.value);
                  if (errors.stockingDate) {
                    setErrors({ ...errors, stockingDate: undefined });
                  }
                }}
                max={todayDate}
                className={errors.stockingDate ? 'border-red-500' : ''}
              />
              <p className="text-xs text-gray-500">Default: Today</p>
              {errors.stockingDate && <p className="text-xs text-red-600">{errors.stockingDate}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  if (errors.notes) {
                    setErrors({ ...errors, notes: undefined });
                  }
                }}
                placeholder="Add any additional notes..."
                rows={3}
                className={errors.notes ? 'border-red-500' : ''}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{notes.length}/{MAX_NOTES_LENGTH}</p>
                {errors.notes && <p className="text-xs text-red-600">{errors.notes}</p>}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t px-6 py-4 bg-background flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-[#0A4D68] hover:bg-[#083d52]">
              <Fish className="w-4 h-4 mr-2" />
              Stock Tank
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
