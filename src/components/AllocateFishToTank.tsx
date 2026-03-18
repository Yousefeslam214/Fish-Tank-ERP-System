import { useState } from 'react';
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
import { FishInventoryBatch, Tank } from '../types';
import { mockTanks } from '../mockData';

interface AllocateFishToTankProps {
  batch: FishInventoryBatch;
  isOpen: boolean;
  onClose: () => void;
  onAllocate: (
    batchId: string,
    tankId: string,
    quantity: number,
    stockingDate: string,
    notes?: string
  ) => void;
  farmId: string;
  availableTanks?: any[];
}
export default function AllocateFishToTank({
  batch,
  isOpen,
  onClose,
  onAllocate,
  farmId,
  availableTanks = [],
}: AllocateFishToTankProps) {
  const [selectedTankId, setSelectedTankId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [stockingDate, setStockingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<{
    tank?: string;
    quantity?: string;
  }>({});

  // Get available tanks for this farm (status ACTIVE or READY)
  const tanksToDisplay = availableTanks.length > 0 ? availableTanks : mockTanks;
  const tanks = tanksToDisplay.filter(
    (tank) => tank.farmId === farmId && (tank.status === 'ACTIVE' || tank.status === 'READY')
  );

  // Get selected tank details
  const selectedTank = availableTanks.find((t) => t.id === selectedTankId);

  // Calculate capacity percentage
  const getCapacityPercentage = (tank: any) => {
    return Math.round(((tank.biomass || 0) / (tank.capacity || 1)) * 100);
  };

  // Calculate estimated biomass after stocking
  const getEstimatedBiomassAfterStocking = () => {
    if (!selectedTank || !quantity || isNaN(Number(quantity))) return 0;
    const quantityNum = Number(quantity);
    const estimatedBiomass =
      (quantityNum * batch.averageWeight) / 1000; // Convert grams to kg
    return (selectedTank.biomass || 0) + estimatedBiomass;
  };

  // Validate form
  const validateForm = () => {
    const newErrors: { tank?: string; quantity?: string } = {};

    if (!selectedTankId) {
      newErrors.tank = 'Please select a tank';
    }

    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    } else if (Number(quantity) > batch.quantity) {
      newErrors.quantity = `Quantity cannot exceed ${batch.quantity.toLocaleString()} fish`;
    }

    if (selectedTank) {
      const estimatedBiomass = getEstimatedBiomassAfterStocking();
      if (estimatedBiomass > selectedTank.capacity) {
        newErrors.quantity = `This will exceed tank capacity (${selectedTank.capacity} kg)`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (validateForm()) {
      onAllocate(
        batch.id,
        selectedTankId,
        Number(quantity),
        stockingDate,
        notes || undefined
      );
      handleClose();
    }
  };

  // Handle close
  const handleClose = () => {
    setSelectedTankId('');
    setQuantity('');
    setStockingDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Fish className="w-6 h-6 text-[#0A4D68]" />
            Allocate Fish to Tank
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Inventory Batch Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Fish className="w-5 h-5 text-[#0A4D68]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">
                  📦 Inventory Batch
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Species</p>
                    <p className="font-medium">{batch.species}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Available</p>
                    <p className="font-medium">
                      {batch.quantity.toLocaleString()} fish
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Avg Weight</p>
                    <p className="font-medium">{batch.averageWeight}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Health Check</p>
                    <Badge
                      className="bg-green-100 text-green-800"
                      variant="outline"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      PASSED
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tank Selection */}
          <div className="space-y-2">
            <Label htmlFor="tank">
              Select Tank <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedTankId} onValueChange={setSelectedTankId}>
              <SelectTrigger
                id="tank"
                className={errors.tank ? 'border-red-500' : ''}
              >
                <SelectValue placeholder="Choose a tank..." />
              </SelectTrigger>
              <SelectContent>
                {availableTanks.map((tank) => {
                  const capacityPercent = getCapacityPercentage(tank);
                  const isNearCapacity = capacityPercent >= 80;

                  return (
                    <SelectItem key={tank.id} value={tank.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{tank.name}</span>
                        <span
                          className={`text-xs ${
                            isNearCapacity
                              ? 'text-orange-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {capacityPercent}% capacity
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.tank && (
              <p className="text-xs text-red-600">{errors.tank}</p>
            )}

            {/* Tank Capacity Display */}
            {selectedTank && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current Capacity:</span>
                  <span
                    className={
                      getCapacityPercentage(selectedTank) >= 80
                        ? 'text-orange-600 font-medium'
                        : 'text-green-600 font-medium'
                    }
                  >
                    {(selectedTank.biomass || 0).toLocaleString()}/
                    {(selectedTank.capacity || 0).toLocaleString()} kg (
                    {getCapacityPercentage(selectedTank)}%)
                    {getCapacityPercentage(selectedTank) < 80 ? ' ✅' : ' ⚠️'}
                  </span>
                </div>
                {quantity && !isNaN(Number(quantity)) && Number(quantity) > 0 && (
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                    <span className="text-gray-600">After Stocking:</span>
                    <span
                      className={
                        getEstimatedBiomassAfterStocking() >
                        selectedTank.capacity
                          ? 'text-red-600 font-medium'
                          : 'text-blue-600 font-medium'
                      }
                    >
                      ~{getEstimatedBiomassAfterStocking().toFixed(0)} kg (
                      {Math.round(
                        (getEstimatedBiomassAfterStocking() /
                          selectedTank.capacity) *
                          100
                      )}
                      %)
                      {getEstimatedBiomassAfterStocking() <=
                      selectedTank.capacity
                        ? ' ✅'
                        : ' ❌'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantity Input */}
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
                  // Clear error when user starts typing
                  if (errors.quantity) {
                    setErrors({ ...errors, quantity: undefined });
                  }
                }}
                placeholder="Enter number of fish"
                className={errors.quantity ? 'border-red-500' : ''}
                min="1"
                max={batch.quantity}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                fish
              </span>
            </div>
            {errors.quantity && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.quantity}
              </p>
            )}
            {quantity && !errors.quantity && Number(quantity) > 0 && (
              <p className="text-xs text-gray-600">
                Remaining in inventory:{' '}
                <span className="font-medium">
                  {(batch.quantity - Number(quantity)).toLocaleString()} fish
                </span>
              </p>
            )}
          </div>

          {/* Stocking Date */}
          <div className="space-y-2">
            <Label htmlFor="stockingDate">
              Stocking Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stockingDate"
              type="date"
              value={stockingDate}
              onChange={(e) => setStockingDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500">Default: Today</p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-[#0A4D68] hover:bg-[#083d52]"
            >
              <Fish className="w-4 h-4 mr-2" />
              Stock Tank
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
