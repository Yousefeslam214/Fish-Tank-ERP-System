import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { RefreshCw, Trash2 } from 'lucide-react';
import { apiDelete } from '../../../api';
import { toast } from 'sonner';

interface FeedingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  onDeleteSuccess?: () => void;
}

export function FeedingDetailsModal({ open, onOpenChange, record, onDeleteSuccess }: FeedingDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }, [open]);

  if (!record) return null;

  const parseVal = (val: any) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace(/[^\d.]/g, '')) || 0;
    return 0;
  };

  const fed = parseVal(record.amountFed ?? record.weightFed ?? record.weightKg ?? 0);
  const recommended = parseVal(record.recommendedAmount ?? record.targetWeight ?? 0);
  const status = record.status || (fed >= (recommended || 0.1) ? 'on-target' : 'below');

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'on-target': return 'bg-[#10B981] text-white';
      case 'below': return 'bg-[#F59E0B] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await apiDelete("/tanks/feeding-records/" + record.id);
      toast.success('Feeding record deleted');
      if (onDeleteSuccess) onDeleteSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to delete: ' + (err as Error).message);
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="bg-gradient-to-r from-[#0A4D68] to-[#088395] p-6 text-white">
          <DialogHeader className="text-left">
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="text-2xl font-bold text-white">Feeding Record Details</DialogTitle>
              <Badge className={`${getStatusColor(status)} px-4 py-1 uppercase text-xs font-bold tracking-widest`}>
                {status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-white/70 text-sm font-medium">
              Recorded on {new Date(record.timestamp || record.fedAt || record.date || record.createdAt).toLocaleString(undefined, {
                dateStyle: 'full',
                timeStyle: 'short'
              })}
            </p>
          </DialogHeader>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Amount Fed</p>
              <p className="text-lg font-bold text-gray-900">{record.amountFed || `${fed} kg`}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recommended</p>
              <p className="text-lg font-bold text-gray-900">{record.recommendedAmount || `${recommended} kg`}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Achievement</p>
              <p className="text-lg font-bold text-gray-900">{record.achievement || `${recommended > 0 ? Math.round((fed / recommended) * 100) : 0}%`}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Meal</p>
              <p className="text-lg font-bold text-gray-900">{record.mealLabel || `Meal #${record.mealNumber || record.numMeals || 'N/A'}`}</p>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 p-4 rounded-xl space-y-3">
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Food Product:</span>
                <span className="text-gray-900 font-bold">
                  {typeof record.foodType === 'object' ? (record.foodType?.name || record.foodType?.brand || 'Standard Feed') : (record.foodType || record.feedType || 'N/A')}
                </span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Recorded By:</span>
                <span className="text-gray-900 font-bold">{record.fedBy || record.recordedBy || 'Operator'}</span>
             </div>
             {record.notes && (
               <div className="pt-2 border-t border-gray-200">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Notes & Observations</p>
                  <p className="text-sm text-gray-700 italic">"{record.notes}"</p>
               </div>
             )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className={`${confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-500 hover:bg-red-50 hover:text-red-600'} px-6 h-12 font-bold uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-sm`}
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {confirmDelete ? 'Confirm' : 'Delete Record'}
              </Button>
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[#E0F4F5] hover:bg-[#D1EBEB] text-[#0A4D68] px-8 h-12 font-bold uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-sm"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
