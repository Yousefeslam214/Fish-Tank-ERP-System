import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Book, CheckCircle2, Heart, RefreshCw, Search, ShieldCheck, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, Farm } from '../types';
import { getHealthLibraryTemplates, getHealthTemplateByKey, resolveHealthReportTemplate } from '../services/healthKnowledgeBase';
import { fetchAllTankHealthOverviews, TankHealthOverview } from '../services/tankHealthOverview';
import { RobotHealthReport } from './health/RobotHealthReport';
import { formatHealthStatus, getHealthStatusColor } from '../services/healthCheckApi';
import { toast } from 'sonner';

interface HealthLibraryProps {
  user: User;
  selectedFarm: Farm | null;
}

const formatDate = (value?: string) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getBatchLabel = (batch: any) =>
  batch?.batchNumber ? `Batch ${batch.batchNumber}` : `Batch ${String(batch?.id || '').slice(0, 8)}`;

export default function HealthLibrary({ user: _user, selectedFarm }: HealthLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
  const [selectedActiveTankId, setSelectedActiveTankId] = useState<string>('');
  const [selectedRecoveredTankId, setSelectedRecoveredTankId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [overviews, setOverviews] = useState<TankHealthOverview[]>([]);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const result = await fetchAllTankHealthOverviews();
      setOverviews(result.overviews);
    } catch (error) {
      toast.error(`Failed to load health library: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHealthData();
  }, []);

  const filteredOverviews = useMemo(() => {
    if (!selectedFarm) return overviews;
    return overviews.filter((overview) => {
      const farmId = overview.tank?.farmId || overview.tank?.farm?.id || overview.tank?.farm?.farmId;
      return !farmId || farmId === selectedFarm.id;
    });
  }, [overviews, selectedFarm]);

  const templates = useMemo(() => getHealthLibraryTemplates(), []);

  const filteredTemplates = useMemo(
    () =>
      templates.filter((template) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          template.title.toLowerCase().includes(query) ||
          template.aliases.some((alias) => alias.includes(query)) ||
          template.symptoms.some((symptom) => symptom.toLowerCase().includes(query))
        );
      }),
    [searchQuery, templates],
  );

  useEffect(() => {
    const fallbackKey = filteredTemplates[0]?.key || templates[0]?.key || '';
    setSelectedTemplateKey((previous) =>
      previous && filteredTemplates.some((template) => template.key === previous)
        ? previous
        : fallbackKey,
    );
  }, [filteredTemplates, templates]);

  const activeOverviews = useMemo(
    () => filteredOverviews.filter((overview) => overview.requiresAttention),
    [filteredOverviews],
  );
  const recoveredOverviews = useMemo(
    () => filteredOverviews.filter((overview) => overview.isRecovered),
    [filteredOverviews],
  );

  useEffect(() => {
    const fallbackTankId = activeOverviews[0]?.tank.id || '';
    setSelectedActiveTankId((previous) =>
      previous && activeOverviews.some((overview) => overview.tank.id === previous)
        ? previous
        : fallbackTankId,
    );
  }, [activeOverviews]);

  useEffect(() => {
    const fallbackTankId = recoveredOverviews[0]?.tank.id || '';
    setSelectedRecoveredTankId((previous) =>
      previous && recoveredOverviews.some((overview) => overview.tank.id === previous)
        ? previous
        : fallbackTankId,
    );
  }, [recoveredOverviews]);

  const selectedTemplate = getHealthTemplateByKey(selectedTemplateKey);
  const selectedActiveOverview = activeOverviews.find((overview) => overview.tank.id === selectedActiveTankId) || activeOverviews[0] || null;
  const selectedRecoveredOverview = recoveredOverviews.find((overview) => overview.tank.id === selectedRecoveredTankId) || recoveredOverviews[0] || null;
  const selectedActiveRecord = selectedActiveOverview?.latestActiveRecord || selectedActiveOverview?.latestRecord || null;
  const selectedRecoveredRecord = selectedRecoveredOverview?.latestHealthyRecord || selectedRecoveredOverview?.latestRecord || null;
  const selectedActiveTemplate = resolveHealthReportTemplate(selectedActiveRecord?.bacterialType);
  const selectedRecoveredTemplate = resolveHealthReportTemplate(
    selectedRecoveredOverview?.latestActiveRecord?.bacterialType || selectedRecoveredRecord?.bacterialType,
  );
  const totalReports = filteredOverviews.reduce((sum, overview) => sum + overview.healthChecks.length, 0);
  const monitoredBatches = filteredOverviews.reduce((sum, overview) => sum + overview.batches.length, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl">Health Library</h1>
          <p className="text-gray-600">
            Static disease protocols, live active cases, and recovered tanks with recorded dates.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadHealthData()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Active Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOverviews.length}</div>
            <p className="mt-1 text-xs text-gray-600">Tanks needing action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recovered Tanks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recoveredOverviews.length}</div>
            <p className="mt-1 text-xs text-gray-600">Treatment completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Saved Reports</CardTitle>
            <Stethoscope className="h-4 w-4 text-[#088395]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReports}</div>
            <p className="mt-1 text-xs text-gray-600">Across monitored tanks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Monitored Batches</CardTitle>
            <Heart className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitoredBatches}</div>
            <p className="mt-1 text-xs text-gray-600">With tank health context</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="library" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-white lg:w-auto">
          <TabsTrigger value="library">
            <Book className="mr-2 h-4 w-4" />
            Disease Library
          </TabsTrigger>
          <TabsTrigger value="active">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Active Cases
          </TabsTrigger>
          <TabsTrigger value="recovered">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Recovered Tanks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search disease name, alias, or symptom..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.key}
                      onClick={() => setSelectedTemplateKey(template.key)}
                      className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                        selectedTemplateKey === template.key
                          ? 'border-[#088395] bg-white shadow-sm'
                          : 'border-transparent bg-white/70 hover:border-slate-200'
                      }`}
                    >
                      <p className="font-semibold text-slate-900">{template.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{template.symptoms.length} key signs</p>
                    </button>
                  ))}
                </div>
                <RobotHealthReport
                  template={selectedTemplate}
                  healthStatus={selectedTemplate.defaultHealthStatus}
                  title="Fixed Health Protocol"
                  compact={false}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {activeOverviews.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                  No active health alerts right now.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                  <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                    {activeOverviews.map((overview) => (
                      <button
                        key={overview.tank.id}
                        onClick={() => setSelectedActiveTankId(overview.tank.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                          selectedActiveOverview?.tank.id === overview.tank.id
                            ? 'border-[#088395] bg-white shadow-sm'
                            : 'border-transparent bg-white/70 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{overview.tank.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{overview.currentDiseaseLabel}</p>
                          </div>
                          {overview.latestRecord && (
                            <Badge variant="outline" className={getHealthStatusColor(overview.latestRecord.healthStatus)}>
                              {formatHealthStatus(overview.latestRecord.healthStatus)}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {overview.batchOverviews.filter((batch) => batch.requiresAttention).length} affected batch
                          {overview.batchOverviews.filter((batch) => batch.requiresAttention).length === 1 ? '' : 'es'}
                        </p>
                      </button>
                    ))}
                  </div>

                  {selectedActiveOverview && selectedActiveRecord ? (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{selectedActiveOverview.tank.name}</CardTitle>
                          <p className="text-sm text-slate-500">
                            Latest alert on {formatDate(selectedActiveRecord.checkedAt)}
                          </p>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest disease</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedActiveRecord.bacterialType}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Affected batches</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {selectedActiveOverview.batchOverviews.filter((batch) => batch.requiresAttention).map((batch) => getBatchLabel(batch.batch)).join(', ') || 'N/A'}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved reports</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedActiveOverview.healthChecks.length}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <RobotHealthReport
                        template={selectedActiveTemplate}
                        healthStatus={selectedActiveRecord.healthStatus}
                        confidencePercent={selectedActiveRecord.bacterialLoadPercentage ?? null}
                        checkedAt={selectedActiveRecord.checkedAt}
                        batchLabel={getBatchLabel(selectedActiveOverview.batchOverviews.find((batch) => batch.latestRecord?.id === selectedActiveRecord.id)?.batch)}
                        topPredictionLabel={selectedActiveRecord.bacterialType}
                        title="Current Tank Health Alert"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recovered" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              {recoveredOverviews.length === 0 ? (
                <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
                  No recovered tanks recorded yet.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                  <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-3">
                    {recoveredOverviews.map((overview) => (
                      <button
                        key={overview.tank.id}
                        onClick={() => setSelectedRecoveredTankId(overview.tank.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                          selectedRecoveredOverview?.tank.id === overview.tank.id
                            ? 'border-emerald-500 bg-white shadow-sm'
                            : 'border-transparent bg-white/70 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{overview.tank.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Recovered from {overview.latestActiveRecord?.bacterialType || overview.currentDiseaseLabel}
                            </p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700">
                            Recovered
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">{formatDate(overview.recoveredAt)}</p>
                      </button>
                    ))}
                  </div>

                  {selectedRecoveredOverview && selectedRecoveredRecord ? (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Recovered Tank Record</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tank</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedRecoveredOverview.tank.name}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recovered from</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{selectedRecoveredOverview.latestActiveRecord?.bacterialType || selectedRecoveredOverview.currentDiseaseLabel}</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recovery date</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(selectedRecoveredOverview.recoveredAt)}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <RobotHealthReport
                        template={selectedRecoveredTemplate}
                        healthStatus={selectedRecoveredRecord.healthStatus}
                        confidencePercent={selectedRecoveredRecord.bacterialLoadPercentage ?? null}
                        checkedAt={selectedRecoveredRecord.checkedAt}
                        batchLabel={getBatchLabel(selectedRecoveredOverview.batchOverviews.find((batch) => batch.latestRecord?.id === selectedRecoveredRecord.id)?.batch)}
                        topPredictionLabel={selectedRecoveredOverview.latestActiveRecord?.bacterialType || selectedRecoveredRecord.bacterialType}
                        title="Recovered Tank Report"
                      />
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
