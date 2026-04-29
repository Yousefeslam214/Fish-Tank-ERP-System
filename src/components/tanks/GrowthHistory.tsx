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
    tankId?: string;
    fishType: string;
    stockedDate: Date;
    initialCount: number;
    currentCount: number;
    initialWeight: number;
    lastWeight?: number;
    lastMeasurementDate?: Date;
  };
  measurements: GrowthMeasurement[];
  language?: Language;
  onMeasurementAdded?: () => void;
  onViewDetails?: (measurement: GrowthMeasurement) => void;
}

const toFiniteNumber = (value: any): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  if (value && typeof value === 'object' && 'value' in value) {
    return toFiniteNumber((value as { value?: unknown }).value);
  }
  return undefined;
};

const toValidDate = (value: any): Date => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

export default function GrowthHistory({
  batch,
  measurements,
  language = 'en',
  onMeasurementAdded,
  onViewDetails
}: GrowthHistoryProps) {
  const t = (key: string) => getTranslation(language, key);
  const isRTL = language === 'ar';
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<GrowthMeasurement | null>(null);

  const normalizedMeasurements = measurements.map((measurement) => ({
    ...measurement,
    measuredAt: toValidDate(
      (measurement as any).measuredAt ??
      (measurement as any).measurementDate ??
      (measurement as any).date ??
      (measurement as any).timestamp ??
      (measurement as any).createdAt,
    ),
    daysInCulture:
      toFiniteNumber(
        (measurement as any).daysInCulture ??
        (measurement as any).dayInCulture ??
        (measurement as any).day,
      ) ?? 0,
    sampleSize:
      toFiniteNumber(
        (measurement as any).sampleSize ??
        (measurement as any).sampleCount ??
        (measurement as any).numberOfFishSampled ??
        (measurement as any).count,
      ) ?? 0,
    averageWeightGrams:
      toFiniteNumber(
        (measurement as any).averageWeightGrams ??
        (measurement as any).averageWeight ??
        (measurement as any).avgWeight ??
        (measurement as any).weightGrams ??
        (measurement as any).weight,
      ) ?? 0,
    sgr: toFiniteNumber((measurement as any).sgr),
    fcr: toFiniteNumber((measurement as any).fcr),
    sgrRating: (measurement as any).sgrRating ?? (measurement as any).sgr?.rating,
    fcrRating: (measurement as any).fcrRating ?? (measurement as any).fcr?.rating,
    overallRating:
      (measurement as any).overallRating ??
      (measurement as any).rating ??
      (measurement as any).overall?.rating,
  })) as GrowthMeasurement[];

  const daysInCulture = Math.floor(
    (new Date().getTime() - batch.stockedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const lastMeasurement = normalizedMeasurements.length > 0
    ? normalizedMeasurements[0]
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

  // Prepare chart data - ensure sorted by day ascending for correct visualization
  const chartData = [
    {
      day: 0,
      weight: batch.initialWeight,
      sgr: undefined
    },
    ...normalizedMeasurements.map(m => ({
      day: m.daysInCulture,
      weight: m.averageWeightGrams,
      sgr: m.sgr
    }))
  ].sort((a, b) => a.day - b.day);

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
          {normalizedMeasurements.map((measurement, index) => (
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
                        </div>
                      </div>

                      {measurement.sgr !== undefined && (
                        <div>
                          <p className="text-xs text-gray-600">SGR</p>
                          <Badge className={getRatingColor(measurement.sgrRating)}>
                            {measurement.sgr.toFixed(2)}%/{t('common.day')}
                          </Badge>
                        </div>
                      )}

                      {measurement.fcr !== undefined && (
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
        onClose={() => {
          setShowRecordModal(false);
          setEditingMeasurement(null);
        }}
        measurement={editingMeasurement}
        batch={{
          id: batch.id,
          batchNumber: batch.batchNumber,
          tankName: batch.tankName,
          tankId: batch.tankId,
          fishType: batch.fishType,
          daysInCulture,
          lastWeight: lastMeasurement?.averageWeightGrams || batch.lastWeight || batch.initialWeight,
          lastMeasurementDate: lastMeasurement?.measuredAt || batch.lastMeasurementDate,
          currentCount: batch.currentCount
        }}
        language={language}
        onSuccess={() => {
          setShowRecordModal(false);
          setEditingMeasurement(null);
          if (onMeasurementAdded) {
            onMeasurementAdded();
          }
        }}
      />
    </div>
  );
}
