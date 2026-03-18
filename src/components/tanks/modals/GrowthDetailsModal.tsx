import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { RefreshCw, Trash2 } from 'lucide-react';
import { apiDelete } from '../../../api';
import { toast } from 'sonner';

interface GrowthDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  onDeleteSuccess?: () => void;
  onEdit?: (record: any) => void;
}

export function GrowthDetailsModal({ open, onOpenChange, record, onDeleteSuccess, onEdit }: GrowthDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }, [open]);

  if (!record) return null;

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await apiDelete("/tanks/growth/" + record.id);
      toast.success('Growth record deleted');
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
              <DialogTitle className="text-2xl font-bold text-white">Growth Measurement Details</DialogTitle>
              <Badge className="bg-[#10B981] text-white px-4 py-1 uppercase text-xs font-bold tracking-widest">
                RECORDED
              </Badge>
            </div>
            <p className="text-white/70 text-sm font-medium">
              Measured on {new Date(record.measuredAt || record.date || record.timestamp || record.createdAt).toLocaleString(undefined, {
                dateStyle: 'full',
                timeStyle: 'short'
              })}
            </p>
          </DialogHeader>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Avg Weight</p>
              <p className="text-lg font-bold text-gray-900">{record.averageWeightGrams?.toFixed(1) || record.weightGrams || record.weight || 0}g</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sample Size</p>
              <p className="text-lg font-bold text-gray-900">{record.sampleSize || 0} fish</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Growth (SGR)</p>
              <p className="text-lg font-bold text-gray-900">{record.sgr?.toFixed(2) || 'N/A'}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">FCR</p>
              <p className="text-lg font-bold text-gray-900">{record.fcr?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 p-4 rounded-xl space-y-3">
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Min/Max Weight:</span>
                <span className="text-gray-900 font-bold">
                  {record.minWeightGrams || record.minWeight || 0}g - {record.maxWeightGrams || record.maxWeight || 0}g
                </span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Avg Length:</span>
                <span className="text-gray-900 font-bold">{record.averageLengthCm || record.length || 'N/A'} cm</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Measured By:</span>
                <span className="text-gray-900 font-bold">{record.measuredBy || 'Operator'}</span>
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
                className={`${confirmDelete ? "bg-red-600 text-white hover:bg-red-700" : "text-red-500 hover:bg-red-50 hover:text-red-600"} px-6 h-12 font-bold uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-sm`}
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
