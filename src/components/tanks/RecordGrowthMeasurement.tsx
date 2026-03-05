import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  Scale, 
  AlertCircle, 
  CheckCircle,
  Activity,
  Ruler
} from 'lucide-react';
import { getTranslation, Language } from '../../i18n/translations';

interface RecordGrowthMeasurementProps {
  open: boolean;
  onClose: () => void;
  batch: {
    id: string;
    batchNumber: string;
    tankName: string;
    fishType: string;
    daysInCulture: number;
    lastWeight?: number;
    lastMeasurementDate?: Date;
    currentCount: number;
  };
  language?: Language;
  onSuccess?: (data: any) => void;
}

export default function RecordGrowthMeasurement({ 
  open, 
  onClose, 
  batch,
  language = 'en',
  onSuccess 
}: RecordGrowthMeasurementProps) {
  const t = (key: string) => getTranslation(language, key);
  const isRTL = language === 'ar';

  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [detailedEntry, setDetailedEntry] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  
  const [formData, setFormData] = useState({
    measuredAt: new Date().toISOString().split('T')[0],
    sampleSize: 30,
    totalSampleWeight: 0,
    minWeight: 0,
    maxWeight: 0,
    averageLength: 0,
    notes: '',
    measuredBy: 'Ahmed Mohamed',
    individualWeights: [] as number[]
  });

  // Calculate metrics
  const averageWeight = formData.sampleSize > 0 
    ? formData.totalSampleWeight / formData.sampleSize 
    : 0;

  const weightGain = batch.lastWeight 
    ? averageWeight - batch.lastWeight 
    : 0;

  const weightGainPercentage = batch.lastWeight 
    ? (weightGain / batch.lastWeight) * 100 
    : 0;

  // Calculate SGR (Specific Growth Rate)
  const daysSinceLastMeasurement = batch.lastMeasurementDate
    ? Math.floor((new Date().getTime() - batch.lastMeasurementDate.getTime()) / (1000 * 60 * 60 * 24))
    : batch.daysInCulture;

  const sgr = batch.lastWeight && daysSinceLastMeasurement > 0
    ? ((Math.log(averageWeight) - Math.log(batch.lastWeight)) / daysSinceLastMeasurement) * 100
    : 0;

  const getSGRRating = (sgrValue: number) => {
    if (sgrValue >= 2.5) return { label: t('growthMeasurement.excellent'), color: 'bg-[#10B981]', icon: '🟢' };
    if (sgrValue >= 2.0) return { label: t('growthMeasurement.good'), color: 'bg-[#3B82F6]', icon: '🟡' };
    if (sgrValue >= 1.5) return { label: t('growthMeasurement.acceptable'), color: 'bg-[#F59E0B]', icon: '🟠' };
    return { label: t('growthMeasurement.poor'), color: 'bg-[#EF4444]', icon: '🔴' };
  };

  const sgrRating = getSGRRating(sgr);

  const estimatedBiomass = (batch.currentCount * averageWeight) / 1000;

  // Calculate statistics from individual weights
  const calculateStats = () => {
    if (formData.individualWeights.length === 0) return null;
    
    const weights = formData.individualWeights;
    const sum = weights.reduce((a, b) => a + b, 0);
    const avg = sum / weights.length;
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    
    // Standard deviation
    const variance = weights.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / weights.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / avg) * 100;

    return {
      total: sum,
      average: avg,
      min,
      max,
      stdDev,
      cv
    };
  };

  const stats = calculateStats();

  // Parse bulk input
  const handleParseBulkInput = () => {
    const weights = bulkInput
      .split(/[\n,\s]+/)
      .map(w => parseFloat(w.trim()))
      .filter(w => !isNaN(w) && w > 0);

    if (weights.length > 0) {
      setFormData({
        ...formData,
        individualWeights: weights,
        sampleSize: weights.length,
        totalSampleWeight: weights.reduce((a, b) => a + b, 0),
        minWeight: Math.min(...weights),
        maxWeight: Math.max(...weights)
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.sampleSize < 10 || formData.sampleSize > 100) {
      alert('Sample size must be between 10 and 100 fish');
      return;
    }

    if (formData.totalSampleWeight <= 0) {
      alert('Total sample weight must be greater than 0');
      return;
    }

    if (!detailedEntry && (formData.minWeight <= 0 || formData.maxWeight <= 0)) {
      alert('Please enter min and max weights');
      return;
    }

    // Mock API call
    const payload = {
      measuredAt: formData.measuredAt,
      daysInCulture: batch.daysInCulture,
      sampleSize: formData.sampleSize,
      totalSampleWeightGrams: formData.totalSampleWeight,
      averageWeightGrams: averageWeight,
      minWeightGrams: detailedEntry ? stats?.min : formData.minWeight,
      maxWeightGrams: detailedEntry ? stats?.max : formData.maxWeight,
      stdDeviationGrams: stats?.stdDev,
      coefficientOfVariation: stats?.cv,
      averageLengthCm: formData.averageLength > 0 ? formData.averageLength : undefined,
      estimatedFishCount: batch.currentCount,
      estimatedBiomassKg: estimatedBiomass,
      individualWeights: detailedEntry ? formData.individualWeights : undefined,
      notes: formData.notes,
      measuredBy: formData.measuredBy
    };

    // Simulate API response
    setTimeout(() => {
      const mockResponse = {
        id: 'growth-' + Date.now(),
        ...payload,
        sgr: parseFloat(sgr.toFixed(2)),
        adg: parseFloat((weightGain / daysSinceLastMeasurement).toFixed(2)),
        weightGainGrams: parseFloat(weightGain.toFixed(2)),
        weightGainPercentage: parseFloat(weightGainPercentage.toFixed(2)),
        fcr: 1.52,
        survivalRate: 92,
        conditionFactor: 1.89,
        fcrRating: 'GOOD',
        sgrRating: sgr >= 2.0 ? 'GOOD' : sgr >= 1.5 ? 'ACCEPTABLE' : 'POOR',
        overallRating: 'GOOD',
        recommendations: [
          'Growth rate is on target - continue current feeding',
          'FCR is within acceptable range',
          'Consider sorting fish to improve uniformity'
        ]
      };

      setSuccessData(mockResponse);
      setShowSuccess(true);
      
      if (onSuccess) {
        onSuccess(mockResponse);
      }
    }, 1000);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setSuccessData(null);
    onClose();
  };

  return (
    <>
      {/* Main Form Dialog */}
      <Dialog open={open && !showSuccess} onOpenChange={onClose}>
        <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isRTL ? 'rtl' : 'ltr'}`}>
          <DialogHeader>
            <DialogTitle className="text-xl">
              {t('growthMeasurement.title')}
            </DialogTitle>
            <p className="text-sm text-gray-600 mt-1">
              {batch.batchNumber} - {batch.tankName} - {batch.fishType}
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Batch Info */}
            <Card className="bg-[#E0F4F5] border-[#088395]">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  {t('growthMeasurement.currentBatchInfo')}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('growthMeasurement.daysInCulture')}:</span>
                    <span className="font-medium ml-2">{batch.daysInCulture} {t('growthMeasurement.days')}</span>
                  </div>
                  {batch.lastWeight && (
                    <div>
                      <span className="text-gray-600">{t('growthMeasurement.lastWeight')}:</span>
                      <span className="font-medium ml-2">
                        {batch.lastWeight}g ({daysSinceLastMeasurement} {t('growthMeasurement.days')} {t('growthMeasurement.ago')})
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">{t('growthMeasurement.currentCount')}:</span>
                    <span className="font-medium ml-2">
                      {batch.currentCount} {t('growthMeasurement.fish')} ({t('common.estimated')})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sampling Details */}
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
                    onChange={(e) => setFormData({...formData, measuredAt: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label>{t('growthMeasurement.numberOfFishSampled')} *</Label>
                  <Input 
                    type="number"
                    min="10"
                    max="100"
                    value={formData.sampleSize}
                    onChange={(e) => setFormData({...formData, sampleSize: parseInt(e.target.value) || 0})}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('growthMeasurement.recommended')}</p>
                </div>
              </div>
            </div>

            {/* Weight Measurements */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                {t('growthMeasurement.weightMeasurements')}
              </h3>

              <div>
                <Label>{t('growthMeasurement.totalSampleWeight')} *</Label>
                <Input 
                  type="number"
                  step="0.1"
                  value={formData.totalSampleWeight}
                  onChange={(e) => setFormData({...formData, totalSampleWeight: parseFloat(e.target.value) || 0})}
                  disabled={detailedEntry && stats !== null}
                />
              </div>

              {/* Detailed Entry Toggle */}
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="detailedEntry"
                  checked={detailedEntry}
                  onChange={(e) => setDetailedEntry(e.target.checked)}
                  className="w-4 h-4 text-[#088395] border-gray-300 rounded focus:ring-[#088395]"
                />
                <label htmlFor="detailedEntry" className="text-sm font-medium text-gray-700">
                  {t('growthMeasurement.enableDetailedEntry')}
                </label>
              </div>

              {detailedEntry ? (
                <div className="space-y-3">
                  <div>
                    <Label>{t('growthMeasurement.bulkInput')}</Label>
                    <Textarea
                      placeholder={t('growthMeasurement.onePerLine')}
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      rows={4}
                      className="font-mono text-sm"
                    />
                    <Button 
                      size="sm" 
                      className="mt-2"
                      onClick={handleParseBulkInput}
                    >
                      {t('growthMeasurement.parseInput')}
                    </Button>
                  </div>

                  {stats && (
                    <Card className="bg-[#F0FDF4] border-[#10B981]">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-sm mb-2">Statistics</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium ml-2">{stats.total.toFixed(1)}g ✓</span>
                          </div>
                          <div>
                            <span className="text-gray-600">{t('growthMeasurement.averageWeight')}:</span>
                            <span className="font-medium ml-2">{stats.average.toFixed(1)}g</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Min:</span>
                            <span className="font-medium ml-2">{stats.min}g</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Max:</span>
                            <span className="font-medium ml-2">{stats.max}g</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Std Dev:</span>
                            <span className="font-medium ml-2">{stats.stdDev.toFixed(1)}g</span>
                          </div>
                          <div>
                            <span className="text-gray-600">CV:</span>
                            <span className="font-medium ml-2">{stats.cv.toFixed(1)}%</span>
                            {stats.cv < 15 && <span className="text-[#10B981] ml-1">({t('growthMeasurement.goodUniformity')})</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('growthMeasurement.smallestFish')} *</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={formData.minWeight}
                      onChange={(e) => setFormData({...formData, minWeight: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>{t('growthMeasurement.largestFish')} *</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      value={formData.maxWeight}
                      onChange={(e) => setFormData({...formData, maxWeight: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Length (Optional) */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                {t('growthMeasurement.lengthOptional')}
              </h3>
              <div>
                <Label>{t('growthMeasurement.averageLength')}</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="number"
                    step="0.1"
                    value={formData.averageLength}
                    onChange={(e) => setFormData({...formData, averageLength: parseFloat(e.target.value) || 0})}
                    className="max-w-xs"
                  />
                  <Ruler className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Calculations Preview */}
            {averageWeight > 0 && (
              <Card className="bg-[#FEF3C7] border-[#F59E0B]">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t('growthMeasurement.calculationsPreview')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">{t('growthMeasurement.averageWeight')}:</span>
                      <span className="font-bold ml-2 text-lg">{averageWeight.toFixed(1)}g</span>
                    </div>
                    {batch.lastWeight && (
                      <div>
                        <span className="text-gray-600">{t('growthMeasurement.weightGain')}:</span>
                        <span className="font-bold ml-2 text-lg">
                          +{weightGain.toFixed(1)}g (+{weightGainPercentage.toFixed(1)}%)
                        </span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="text-gray-600">{t('growthMeasurement.estimatedSGR')}:</span>
                      <Badge className={`${sgrRating.color} text-white ml-2`}>
                        {sgr.toFixed(2)}%/{t('common.day')} {sgrRating.icon} {sgrRating.label}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">{t('growthMeasurement.estimatedBiomass')}:</span>
                      <span className="font-bold ml-2 text-lg">{estimatedBiomass.toFixed(1)} {t('common.kg')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">
                {t('growthMeasurement.notes')}
              </h3>
              <div>
                <Label>{t('growthMeasurement.notesOptional')}</Label>
                <Textarea
                  placeholder="Fish looking healthy, good color..."
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              <div>
                <Label>{t('growthMeasurement.measuredBy')}</Label>
                <Input 
                  value={formData.measuredBy}
                  onChange={(e) => setFormData({...formData, measuredBy: e.target.value})}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onClose}
              >
                {t('growthMeasurement.cancel')}
              </Button>
              <Button 
                className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                onClick={handleSubmit}
              >
                <Scale className="w-4 h-4 mr-2" />
                {t('growthMeasurement.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className={`max-w-2xl ${isRTL ? 'rtl' : 'ltr'}`}>
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
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('growthMeasurement.averageWeight')}:</span>
                      <span className="font-bold text-lg">
                        {successData.averageWeightGrams.toFixed(1)}g 
                        {successData.weightGainPercentage > 0 && 
                          <span className="text-[#10B981] ml-2">
                            (+{successData.weightGainPercentage.toFixed(1)}%)
                          </span>
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">SGR:</span>
                      <Badge className={`${getSGRRating(successData.sgr).color} text-white`}>
                        {successData.sgr}%/{t('common.day')} {getSGRRating(successData.sgr).icon} {successData.sgrRating}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">FCR:</span>
                      <Badge className="bg-[#3B82F6] text-white">
                        {successData.fcr} 🟢 {successData.fcrRating}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('growthMeasurement.survival')}:</span>
                      <span className="font-bold">{successData.survivalRate}% ✅</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">{t('growthMeasurement.overallRating')}:</span>
                      <Badge className="bg-[#10B981] text-white text-base px-4 py-1">
                        🟢 {successData.overallRating}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {successData.recommendations && successData.recommendations.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      {t('growthMeasurement.recommendations')}
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {successData.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleSuccessClose}
                >
                  {t('growthMeasurement.close')}
                </Button>
                <Button 
                  className="flex-1 bg-[#088395] hover:bg-[#0A4D68]"
                  onClick={handleSuccessClose}
                >
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
