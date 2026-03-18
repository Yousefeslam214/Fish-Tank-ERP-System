import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { RefreshCw, Trash2, Settings } from 'lucide-react';
import { apiDelete } from '../../../api';
import { toast } from 'sonner';

interface WaterQualityDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: any;
  onEdit?: (record: any) => void;
  onDeleteSuccess?: () => void;
}

export function WaterQualityDetailsModal({ open, onOpenChange, record, onEdit, onDeleteSuccess }: WaterQualityDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  }, [open]);

  if (!record) return null;

  const status = record.overallStatus || record.status || 'unknown';
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'optimal': return 'bg-[#10B981] text-white';
      case 'acceptable': return 'bg-[#3B82F6] text-white';
      case 'warning': return 'bg-[#F59E0B] text-white';
      case 'critical': return 'bg-[#EF4444] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const parameters = [
    { label: 'Temperature', value: `${record.temperature ?? record.temp ?? '–'}°C`, key: 'temp' },
    { label: 'Dissolved Oxygen', value: `${record.dissolvedOxygen ?? record.do ?? '–'} mg/L`, key: 'do' },
    { label: 'pH', value: record.pH ?? record.ph ?? '–', key: 'ph' },
    { label: 'Ammonia (TAN)', value: `${record.totalAmmonia ?? record.ammonia ?? record.nh3 ?? '–'} mg/L`, key: 'nh3' },
    { label: 'Nitrite (NO₂)', value: `${record.nitrite ?? record.no2 ?? '–'} mg/L`, key: 'no2' },
    { label: 'Nitrate (NO₃)', value: `${record.nitrate ?? record.no3 ?? '–'} mg/L`, key: 'no3' },
    { label: 'Salinity', value: record.salinity ? `${record.salinity} ppt` : '–', key: 'salinity' },
    { label: 'Alkalinity', value: record.alkalinity ? `${record.alkalinity} mg/L` : '–', key: 'alkalinity' },
    { label: 'Hardness', value: record.hardness ? `${record.hardness} mg/L` : '–', key: 'hardness' },
    { label: 'Turbidity', value: record.turbidity ? `${record.turbidity} NTU` : '–', key: 'turbidity' },
    { label: 'CO₂', value: record.co2 ? `${record.co2} mg/L` : '–', key: 'co2' },
  ];

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      await apiDelete(`/tanks/water-quality/${record.id}`);
      toast.success('Reading deleted successfully');
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
              <DialogTitle className="text-2xl font-bold text-white">Water Quality Details</DialogTitle>
              <Badge className={`${getStatusColor(status)} px-4 py-1 uppercase text-xs font-bold tracking-widest`}>
                {status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-white/70 text-sm font-medium">
              Recorded on {new Date(record.measuredAt || record.createdAt).toLocaleString(undefined, {
                dateStyle: 'full',
                timeStyle: 'short'
              })}
            </p>
          </DialogHeader>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            {parameters.map((param) => (
              <div key={param.key} className="space-y-1.5 group">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-[#088395] transition-colors">
                  {param.label}
                </p>
                <p className="text-lg font-bold text-gray-900 leading-none">
                  {param.value}
                </p>
              </div>
            ))}
          </div>

          {(record.measuredBy || record.notes || record.actionNotes) && (
            <div className="mt-10 pt-6 border-t border-gray-100 space-y-4">
              {record.measuredBy && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#0A4D68] font-bold text-xs">
                    {record.measuredBy.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Measured By</p>
                    <p className="text-sm font-bold text-gray-700">{record.measuredBy}</p>
                  </div>
                </div>
              )}
              {(record.notes || record.actionNotes) && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Observations & Action Notes</p>
                    {record.actionTaken && (
                      <Badge className="bg-blue-500 text-white text-[9px] px-2 py-0 uppercase font-black">Action Performed</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[#088395] leading-relaxed font-medium italic">"{record.actionNotes || record.notes}"</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className={`${confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'text-red-500 hover:bg-red-50 hover:text-red-600'} px-6 h-12 font-bold uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-sm`}
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {confirmDelete ? 'Confirm' : 'Delete Reading'}
              </Button>
              {confirmDelete && !isDeleting && (
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="border-[#088395] text-[#088395] hover:bg-[#088395]/10 px-6 h-12 font-bold uppercase text-[11px] tracking-widest rounded-xl transition-all"
                onClick={() => onEdit?.(record)}
              >
                <Settings className="w-4 h-4 mr-2" />
                Edit Reading
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="bg-[#E0F4F5] hover:bg-[#D1EBEB] text-[#0A4D68] px-8 h-12 font-bold uppercase text-[11px] tracking-widest rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
