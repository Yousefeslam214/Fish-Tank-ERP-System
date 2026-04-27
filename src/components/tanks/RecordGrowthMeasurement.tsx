import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Scale,
  CheckCircle,
  Activity
} from 'lucide-react';
import { getTranslation, Language } from '../../i18n/translations';
import { apiPut, apiPost } from '../../api';
import { toast } from 'sonner';

interface RecordGrowthMeasurementProps {
  open: boolean;
  onClose: () => void;
  batch: {
    id: string;
    batchNumber: string;
    tankName: string;
    tankId?: string;
    fishType: string;
    daysInCulture: number;
    lastWeight?: number;
    lastMeasurementDate?: Date;
    currentCount: number;
  };
  language?: Language;
  onSuccess?: (data: any) => void;
  measurement?: any; // To support editing
}

export default function RecordGrowthMeasurement({
  open,
  onClose,
  batch,
  language = 'en',
  onSuccess,
  measurement
}: RecordGrowthMeasurementProps) {
  const t = (key: string) => getTranslation(language, key);
  const isRTL = language === 'ar';

  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const [formData, setFormData] = useState({
    measuredAt: new Date().toISOString().split('T')[0],
    sampleSize: 30,
    minWeight: 0,
    maxWeight: 0,
    notes: ''
  });

  // Load measurement data if editing
  useEffect(() => {
    if (open && measurement) {
      setFormData({
        measuredAt: new Date(measurement.measuredAt || measurement.date || measurement.timestamp).toISOString().split('T')[0],
        sampleSize: measurement.sampleSize || 30,
        minWeight: measurement.minWeightGrams || measurement.minWeight || 0,
        maxWeight: measurement.maxWeightGrams || measurement.maxWeight || 0,
        notes: measurement.notes || ''
      });
    } else if (open && !measurement) {
      setFormData({
        measuredAt: new Date().toISOString().split('T')[0],
        sampleSize: 30,
        minWeight: 0,
        maxWeight: 0,
        notes: ''
      });
    }
  }, [open, measurement]);

  // Derived calculations (Frontend only calculates these)
  const averageWeight = (formData.minWeight + formData.maxWeight) / 2;
  const totalSampleWeight = Math.round(averageWeight * formData.sampleSize);

  const handleSubmit = async () => {
    if (totalSampleWeight <= 0) {
      toast.error('Total sample weight must be greater than 0');
      return;
    }

    if (formData.minWeight <= 0 || formData.maxWeight <= 0) {
      toast.error('Please enter min and max weight for the sample');
      return;
    }

    const payload = {
      measuredAt: new Date(formData.measuredAt + 'T12:00:00').toISOString(),
      daysInCulture: Math.max(1, Number(batch.daysInCulture) || 1),
      sampleSize: Number(formData.sampleSize) || 0,
      totalSampleWeightGrams: totalSampleWeight,
      averageWeightGrams: parseFloat(averageWeight.toFixed(2)),
      minWeightGrams: Number(formData.minWeight) || 0,
      maxWeightGrams: Number(formData.maxWeight) || 0,
      estimatedFishCount: Math.max(1, Number(batch.currentCount) || 1),
      stdDeviationGrams: 0,
      coefficientOfVariation: 0,
      averageLengthCm: 0,
      isEstimate: false,
      notes: formData.notes || ''
    };

    console.log('Sending growth measurement:', payload);

    try {
      let response;
      if (measurement?.id) {
        response = await apiPut(`/tanks/growth/${measurement.id}`, payload);
        toast.success('Growth record updated');
      } else {
        response = await apiPost(`/tanks/growth/${batch.id}`, payload);
      }

      console.log('Growth measurement response:', response);

      setSuccessData(response);
      setShowSuccess(true);
      if (onSuccess) onSuccess(response);
    } catch (err) {
      console.error('Failed to save growth:', err);
      toast.error('Failed to save growth');
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setSuccessData(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open && !showSuccess} onOpenChange={onClose}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`}>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {t('growthMeasurement.title')}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {batch.batchNumber} - {batch.tankName}
            </p>
          </DialogHeader>

          <div className="space-y-6">
            <Card className="bg-[#E0F4F5] border-[#088395]">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {t('growthMeasurement.currentBatchInfo')}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {batch.lastWeight && (
                    <div>
                      <span className="text-gray-600">{t('growthMeasurement.lastWeight')}:</span>
                      <span className="font-medium ml-2">{batch.lastWeight}g</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">{t('growthMeasurement.currentCount')}:</span>
                    <span className="font-medium ml-2">{batch.currentCount} {t('growthMeasurement.fish')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                {t('growthMeasurement.samplingDetails')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('growthMeasurement.measurementDate')} *</Label>
                  <Input
                    type="date"
                    value={formData.measuredAt}
                    onChange={(e) => setFormData({ ...formData, measuredAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t('growthMeasurement.numberOfFishSampled')} *</Label>
                  <Input
                    type="number"
                    value={formData.sampleSize}
                    onChange={(e) => setFormData({ ...formData, sampleSize: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                {t('growthMeasurement.weightMeasurements')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('growthMeasurement.smallestFish')}</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formData.minWeight}
                    onChange={(e) => setFormData({ ...formData, minWeight: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>{t('growthMeasurement.largestFish')}</Label>
                  <Input
                    type="number"
                    step="1"
                    value={formData.maxWeight}
                    onChange={(e) => setFormData({ ...formData, maxWeight: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {formData.minWeight > 0 && formData.maxWeight > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <span className="text-gray-600">Calculated Average Weight: </span>
                  <span className="font-bold text-blue-800">{averageWeight.toFixed(1)}g</span>
                  <span className="text-gray-500 ml-3">Total Sample: {totalSampleWeight.toLocaleString()}g</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                {t('growthMeasurement.cancel')}
              </Button>
              <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]" onClick={handleSubmit}>
                <Scale className="w-4 h-4 mr-2" />
                {t('growthMeasurement.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-[#10B981]">
              <CheckCircle className="w-6 h-6" />
              {t('growthMeasurement.success')}
            </DialogTitle>
          </DialogHeader>

          {successData && (
            <div className="space-y-6">
              <Card className="bg-[#F0FDF4] border-[#10B981]">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {t('growthMeasurement.performanceSummary')}
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-gray-600">{t('growthMeasurement.averageWeight')}</span>
                        <span className="font-bold text-lg">
                          {(successData.averageWeightGrams || successData.averageWeight || 0).toFixed(1)}g
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600">{t('growthMeasurement.weightGain')}</span>
                        <span className="font-bold text-lg text-[#10B981]">
                          +{(successData.weightGainGrams || successData.weightGain || 0).toFixed(1)}g
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600">SGR</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {(successData.sgr || 0).toFixed(2)}%
                          </span>
                          {successData.sgrRating && (
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {successData.sgrRating}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-600">FCR</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">
                            {(successData.fcr || 0).toFixed(2)}
                          </span>
                          {successData.fcrRating && (
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {successData.fcrRating}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleSuccessClose}>
                  {t('growthMeasurement.close')}
                </Button>
                <Button className="flex-1 bg-[#088395] hover:bg-[#0A4D68]" onClick={handleSuccessClose}>
                  {t('growthMeasurement.viewGrowthChart')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
