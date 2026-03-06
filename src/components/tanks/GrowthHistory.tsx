import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Users, Scale } from 'lucide-react';
import { getTranslation, Language } from '../../i18n/translations';
import RecordGrowthMeasurement from './RecordGrowthMeasurement';

interface GrowthMeasurement {
  id: string;
  measuredAt: Date;
  daysInCulture: number;
  sampleSize: number;
  averageWeightGrams: number;
  sgr?: number;
  fcr?: number;
  sgrRating?: string;
  fcrRating?: string;
  overallRating?: string;
}

interface GrowthHistoryProps {
  batch: {
    id: string;
    batchNumber: string;
    tankName: string;
    fishType: string;
    stockedDate: Date;
    initialCount: number;
    currentCount: number;
    initialWeight: number;
  };
  measurements: GrowthMeasurement[];
  language?: Language;
  onMeasurementAdded?: () => void;
}

export default function GrowthHistory({ 
  batch, 
  measurements,
  language = 'en',
  onMeasurementAdded 
}: GrowthHistoryProps) {
  const t = (key: string) => getTranslation(language, key);
  const isRTL = language === 'ar';
  const [showRecordModal, setShowRecordModal] = useState(false);

  const daysInCulture = Math.floor(
    (new Date().getTime() - batch.stockedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const lastMeasurement = measurements.length > 0 
    ? measurements[measurements.length - 1] 
    : null;

  const getRatingColor = (rating?: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'bg-[#10B981] text-white';
      case 'GOOD': return 'bg-[#3B82F6] text-white';
      case 'ACCEPTABLE': return 'bg-[#F59E0B] text-white';
      case 'POOR': return 'bg-[#EF4444] text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRatingIcon = (rating?: string) => {
    switch (rating) {
      case 'EXCELLENT': return '🟢';
      case 'GOOD': return '🟡';
      case 'ACCEPTABLE': return '🟠';
      case 'POOR': return '🔴';
      default: return '';
    }
  };

  // Prepare chart data
  const chartData = [
    {
      day: 0,
      weight: batch.initialWeight,
      sgr: 0
    },
    ...measurements.map(m => ({
      day: m.daysInCulture,
      weight: m.averageWeightGrams,
      sgr: m.sgr || 0
    }))
  ];

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            {t('growthMeasurement.growthHistory')} - {batch.batchNumber}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {batch.fishType} • {daysInCulture} {t('growthMeasurement.days')} {t('growthMeasurement.daysInCulture')}
          </p>
        </div>
        <Button 
          className="bg-[#088395] hover:bg-[#0A4D68]"
          onClick={() => setShowRecordModal(true)}
        >
          <Scale className="w-4 h-4 mr-2" />
          {t('growthMeasurement.recordNew')}
        </Button>
      </div>

      {/* Growth Chart */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Growth Progression Chart
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="day" 
                label={{ value: 'Days in Culture', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                yAxisId="left"
                label={{ value: 'Weight (g)', angle: -90, position: 'insideLeft' }} 
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                label={{ value: 'SGR (%/day)', angle: 90, position: 'insideRight' }} 
              />
              <Tooltip />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="weight" 
                stroke="#0A4D68" 
                strokeWidth={3}
                name="Average Weight (g)"
                dot={{ r: 5 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="sgr" 
                stroke="#10B981" 
                strokeWidth={2}
                name="SGR (%/day)"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Measurement Timeline</h3>
        
        <div className="space-y-4">
          {measurements.map((measurement, index) => (
            <Card key={measurement.id} className="bg-white shadow-sm border-l-4 border-l-[#088395]">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-[#088395]" />
                      <span className="font-semibold text-gray-900">
                        {measurement.measuredAt.toLocaleDateString()}
                      </span>
                      <Badge variant="outline">
                        {t('growthMeasurement.day')} {measurement.daysInCulture}
                      </Badge>
                      {measurement.overallRating && (
                        <Badge className={getRatingColor(measurement.overallRating)}>
                          {getRatingIcon(measurement.overallRating)} {measurement.overallRating}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-600">{t('common.weight')}</p>
                          <p className="font-semibold">{measurement.averageWeightGrams.toFixed(1)}{t('common.g')}</p>
                          {index > 0 && (
                            <p className="text-xs text-[#10B981]">
                              +{(measurement.averageWeightGrams - measurements[index - 1].averageWeightGrams).toFixed(1)}g
                            </p>
                          )}
                        </div>
                      </div>

                      {measurement.sgr && (
                        <div>
                          <p className="text-xs text-gray-600">SGR</p>
                          <Badge className={getRatingColor(measurement.sgrRating)}>
                            {measurement.sgr.toFixed(2)}%/{t('common.day')}
                          </Badge>
                        </div>
                      )}

                      {measurement.fcr && (
                        <div>
                          <p className="text-xs text-gray-600">FCR</p>
                          <Badge className={getRatingColor(measurement.fcrRating)}>
                            {measurement.fcr.toFixed(2)}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-600">{t('growthMeasurement.sample')}</p>
                          <p className="font-semibold">{measurement.sampleSize} {t('growthMeasurement.fish')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button size="sm" variant="outline">
                    {t('growthMeasurement.viewDetails')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Initial Stocking */}
          <Card className="bg-gray-50 border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="font-semibold text-gray-900">
                    {batch.stockedDate.toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="ml-2">
                    {t('growthMeasurement.stocked')}
                  </Badge>
                </div>
              </div>
              <div className="ml-8 mt-2 text-sm text-gray-600">
                {t('growthMeasurement.initial')}: {batch.initialWeight}g • {batch.initialCount} {t('growthMeasurement.fish')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record Growth Modal */}
      <RecordGrowthMeasurement
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        batch={{
          id: batch.id,
          batchNumber: batch.batchNumber,
          tankName: batch.tankName,
          fishType: batch.fishType,
          daysInCulture,
          lastWeight: lastMeasurement?.averageWeightGrams || batch.initialWeight,
          lastMeasurementDate: lastMeasurement?.measuredAt,
          currentCount: batch.currentCount
        }}
        language={language}
        onSuccess={() => {
          setShowRecordModal(false);
          if (onMeasurementAdded) {
            onMeasurementAdded();
          }
        }}
      />
    </div>
  );
}
