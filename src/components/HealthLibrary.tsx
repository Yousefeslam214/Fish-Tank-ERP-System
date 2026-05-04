import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Book, CheckCircle2, Heart, Plus, RefreshCw, Save, Search, ShieldCheck, Stethoscope, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User, Farm } from '../types';
import { getHealthTemplateByKey, resolveHealthReportTemplate } from '../services/healthKnowledgeBase';
import { fetchAllTankHealthOverviews, TankHealthOverview } from '../services/tankHealthOverview';
import { RobotHealthReport } from './health/RobotHealthReport';
import { formatHealthStatus, getHealthStatusColor } from '../services/healthCheckApi';
import {
  createHealthLibraryConfiguration,
  createDefaultRiskLevel,
  DEFAULT_CONDITION_ID,
  deleteHealthLibraryConfiguration,
  getConfigurableDiseaseLibraryTemplates,
  getDefaultRiskLevelsForTemplate,
  getDiseaseConditionId,
  getHealthLibraryConditionId,
  getHealthLibraryConfigId,
  HealthLibraryConfiguration,
  HealthLibraryRiskLevel,
  listHealthLibraryConfigurations,
  mergeHealthLibraryConfigurationsWithDefaults,
  normalizeHealthLibraryRiskLevels,
  updateHealthLibraryConfiguration,
} from '../services/healthLibraryApi';
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

const normalizeTextList = (items?: string[], fallback?: string[]) => {
  const source = Array.isArray(items) && items.length > 0 ? items : fallback || [''];
  return source.map((item) => String(item || ''));
};

const compactTextList = (items: string[]) =>
  items.map((item) => item.trim()).filter(Boolean);

export default function HealthLibrary({ user, selectedFarm }: HealthLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
  const [selectedActiveTankId, setSelectedActiveTankId] = useState<string>('');
  const [selectedRecoveredTankId, setSelectedRecoveredTankId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [overviews, setOverviews] = useState<TankHealthOverview[]>([]);
  const [libraryConfigs, setLibraryConfigs] = useState<HealthLibraryConfiguration[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [configConditionId, setConfigConditionId] = useState(DEFAULT_CONDITION_ID);
  const [configLevels, setConfigLevels] = useState<HealthLibraryRiskLevel[]>(normalizeHealthLibraryRiskLevels());
  const [configMedicineName, setConfigMedicineName] = useState('');
  const [configSummary, setConfigSummary] = useState('');
  const [configSymptoms, setConfigSymptoms] = useState<string[]>(['']);
  const [configFeedingGuidance, setConfigFeedingGuidance] = useState<string[]>(['']);
  const [configRecoveryChecklist, setConfigRecoveryChecklist] = useState<string[]>(['']);
  const [configPreventiveMeasures, setConfigPreventiveMeasures] = useState<string[]>(['']);
  const [configQuarantineAdvice, setConfigQuarantineAdvice] = useState('');

  const isAdmin = user.role === 'admin';

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

  const loadHealthLibraryConfigs = async (preferredConditionId = configConditionId) => {
    setLoadingConfigs(true);
    try {
      const configs = mergeHealthLibraryConfigurationsWithDefaults(await listHealthLibraryConfigurations());
      setLibraryConfigs(configs);
      const targetConditionId = preferredConditionId || DEFAULT_CONDITION_ID;
      const matchingConfig = configs.find((config) => getHealthLibraryConditionId(config) === targetConditionId);

      if (matchingConfig) {
        setSelectedConfigId(getHealthLibraryConfigId(matchingConfig));
        setConfigConditionId(getHealthLibraryConditionId(matchingConfig));
        setConfigLevels(normalizeHealthLibraryRiskLevels(matchingConfig.levels, getDefaultRiskLevelsForTemplate(selectedTemplate)));
        setConfigDetails(matchingConfig, selectedTemplate);
        return;
      }

      const selectedStillExists = selectedConfigId
        ? configs.some((config) => getHealthLibraryConfigId(config) === selectedConfigId)
        : false;
      if (!selectedStillExists) {
        setSelectedConfigId('');
        setConfigConditionId(targetConditionId);
        setConfigLevels(normalizeHealthLibraryRiskLevels(undefined, getDefaultRiskLevelsForTemplate(selectedTemplate)));
        setConfigDetails(undefined, selectedTemplate);
      }
    } catch (error) {
      toast.error(`Failed to load health library configurations: ${(error as Error).message}`);
    } finally {
      setLoadingConfigs(false);
    }
  };

  useEffect(() => {
    void loadHealthData();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void loadHealthLibraryConfigs();
    }
  }, [isAdmin]);

  const filteredOverviews = useMemo(() => {
    if (!selectedFarm) return overviews;
    return overviews.filter((overview) => {
      const farmId = overview.tank?.farmId || overview.tank?.farm?.id || overview.tank?.farm?.farmId;
      return !farmId || farmId === selectedFarm.id;
    });
  }, [overviews, selectedFarm]);

  const templates = useMemo(() => getConfigurableDiseaseLibraryTemplates(), []);

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

  const selectedTemplate = getHealthTemplateByKey(selectedTemplateKey || templates[0]?.key);
  const selectedActiveOverview = activeOverviews.find((overview) => overview.tank.id === selectedActiveTankId) || activeOverviews[0] || null;
  const selectedRecoveredOverview = recoveredOverviews.find((overview) => overview.tank.id === selectedRecoveredTankId) || recoveredOverviews[0] || null;
  const selectedActiveRecord = selectedActiveOverview?.latestActiveRecord || selectedActiveOverview?.latestRecord || null;
  const selectedRecoveredRecord = selectedRecoveredOverview?.latestHealthyRecord || selectedRecoveredOverview?.latestRecord || null;
  const selectedActiveTemplate = resolveHealthReportTemplate(selectedActiveRecord?.bacterialType);
  const selectedRecoveredTemplate = resolveHealthReportTemplate(
    selectedRecoveredOverview?.latestActiveRecord?.bacterialType || selectedRecoveredRecord?.bacterialType,
  );
  const selectedTemplateConditionId = getDiseaseConditionId(selectedTemplate);
  const totalReports = filteredOverviews.reduce((sum, overview) => sum + overview.healthChecks.length, 0);
  const monitoredBatches = filteredOverviews.reduce((sum, overview) => sum + overview.batches.length, 0);
  const previewLevel = configLevels[0] || createDefaultRiskLevel();
  const previewRecommendations = compactTextList(previewLevel.recommendations || []);
  const adminPreviewRecommendation = isAdmin
    ? {
      conditionId: configConditionId,
      level: previewLevel.level,
      status: previewLevel.status || 'Draft',
      risk: previewLevel.risk,
      medicineName: configMedicineName.trim() || undefined,
      summary: configSummary.trim() || selectedTemplate.summary,
      symptoms: compactTextList(configSymptoms).length ? compactTextList(configSymptoms) : selectedTemplate.symptoms,
      feedingGuidance: compactTextList(configFeedingGuidance).length
        ? compactTextList(configFeedingGuidance)
        : selectedTemplate.feedingGuidance,
      recoveryChecklist: compactTextList(configRecoveryChecklist).length
        ? compactTextList(configRecoveryChecklist)
        : selectedTemplate.recoveryChecklist,
      preventiveMeasures: compactTextList(configPreventiveMeasures).length
        ? compactTextList(configPreventiveMeasures)
        : selectedTemplate.preventiveMeasures,
      quarantineAdvice: configQuarantineAdvice.trim() || selectedTemplate.quarantineAdvice,
      recommendations: previewRecommendations,
    }
    : null;

  const setConfigDetails = (config?: HealthLibraryConfiguration, template = selectedTemplate) => {
    setConfigMedicineName(String(config?.medicineName || ''));
    setConfigSummary(String(config?.summary || template.summary || ''));
    setConfigSymptoms(normalizeTextList(config?.symptoms, template.symptoms));
    setConfigFeedingGuidance(normalizeTextList(config?.feedingGuidance, template.feedingGuidance));
    setConfigRecoveryChecklist(normalizeTextList(config?.recoveryChecklist, template.recoveryChecklist));
    setConfigPreventiveMeasures(normalizeTextList(config?.preventiveMeasures, template.preventiveMeasures));
    setConfigQuarantineAdvice(String(config?.quarantineAdvice || template.quarantineAdvice || ''));
  };

  const startNewConfig = () => {
    setSelectedConfigId('');
    setConfigConditionId(selectedTemplateConditionId || DEFAULT_CONDITION_ID);
    setConfigLevels(normalizeHealthLibraryRiskLevels(undefined, getDefaultRiskLevelsForTemplate(selectedTemplate)));
    setConfigDetails(undefined, selectedTemplate);
  };

  const selectConfig = (config: HealthLibraryConfiguration) => {
    setSelectedConfigId(getHealthLibraryConfigId(config));
    setConfigConditionId(getHealthLibraryConditionId(config));
    setConfigLevels(normalizeHealthLibraryRiskLevels(config.levels, getDefaultRiskLevelsForTemplate(selectedTemplate)));
    setConfigDetails(config, selectedTemplate);
  };

  const handleConditionSelection = (conditionId: string) => {
    const existingConfig = libraryConfigs.find((config) => getHealthLibraryConditionId(config) === conditionId);
    if (existingConfig) {
      selectConfig(existingConfig);
      return;
    }

    setSelectedConfigId('');
    setConfigConditionId(conditionId);
    setConfigLevels(normalizeHealthLibraryRiskLevels(undefined, getDefaultRiskLevelsForTemplate(selectedTemplate)));
    setConfigDetails(undefined, selectedTemplate);
  };

  useEffect(() => {
    if (isAdmin && selectedTemplateConditionId) {
      handleConditionSelection(selectedTemplateConditionId);
    }
  }, [isAdmin, selectedTemplateConditionId, libraryConfigs]);

  const updateLevelField = (
    index: number,
    field: 'level' | 'status' | 'risk',
    value: string,
  ) => {
    setConfigLevels((levels) =>
      levels.map((level, levelIndex) =>
        levelIndex === index ? { ...level, [field]: value } : level,
      ),
    );
  };

  const updateLevelRange = (index: number, field: 'min' | 'max', value: string) => {
    const numericValue = Number(value);
    setConfigLevels((levels) =>
      levels.map((level, levelIndex) =>
        levelIndex === index
          ? {
            ...level,
            range: {
              ...level.range,
              [field]: Number.isFinite(numericValue) ? numericValue : 0,
            },
          }
          : level,
      ),
    );
  };

  const updateRecommendation = (levelIndex: number, recommendationIndex: number, value: string) => {
    setConfigLevels((levels) =>
      levels.map((level, currentLevelIndex) =>
        currentLevelIndex === levelIndex
          ? {
            ...level,
            recommendations: level.recommendations.map((recommendation, currentRecommendationIndex) =>
              currentRecommendationIndex === recommendationIndex ? value : recommendation,
            ),
          }
          : level,
      ),
    );
  };

  const addRecommendation = (levelIndex: number) => {
    setConfigLevels((levels) =>
      levels.map((level, currentLevelIndex) =>
        currentLevelIndex === levelIndex
          ? { ...level, recommendations: [...level.recommendations, ''] }
          : level,
      ),
    );
  };

  const removeRecommendation = (levelIndex: number, recommendationIndex: number) => {
    setConfigLevels((levels) =>
      levels.map((level, currentLevelIndex) =>
        currentLevelIndex === levelIndex
          ? {
            ...level,
            recommendations: level.recommendations.filter((_, currentRecommendationIndex) =>
              currentRecommendationIndex !== recommendationIndex,
            ),
          }
          : level,
      ),
    );
  };

  const addRiskLevel = () => {
    setConfigLevels((levels) => [...levels, createDefaultRiskLevel()]);
  };

  const removeRiskLevel = (index: number) => {
    setConfigLevels((levels) => levels.filter((_, levelIndex) => levelIndex !== index));
  };

  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) => {
    setter((items) => items.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((items) => [...items, '']);
  };

  const removeListItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter((items) => (items.length === 1 ? items : items.filter((_, itemIndex) => itemIndex !== index)));
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const payload: HealthLibraryConfiguration = {
        condition_id: configConditionId.trim(),
        conditionId: configConditionId.trim(),
        condition: configConditionId.trim(),
        name: selectedTemplate.title,
        description: `AI health library configuration for ${selectedTemplate.title}`,
        diseaseKey: selectedTemplate.key,
        medicineName: configMedicineName.trim() || undefined,
        summary: configSummary.trim(),
        symptoms: compactTextList(configSymptoms),
        feedingGuidance: compactTextList(configFeedingGuidance),
        recoveryChecklist: compactTextList(configRecoveryChecklist),
        preventiveMeasures: compactTextList(configPreventiveMeasures),
        quarantineAdvice: configQuarantineAdvice.trim(),
        levels: configLevels.map((level) => ({
          level: level.level.trim(),
          range: {
            min: Number(level.range.min),
            max: Number(level.range.max),
          },
          status: level.status.trim(),
          risk: level.risk.trim(),
          recommendations: level.recommendations.map((item) => item.trim()).filter(Boolean),
        })),
      };

      if (!payload.condition_id) {
        throw new Error('condition_id is required.');
      }

      if (!payload.levels?.length) {
        throw new Error('At least one risk level is required.');
      }

      const invalidLevel = payload.levels.find(
        (level) =>
          !level.level ||
          !level.status ||
          !Number.isFinite(level.range.min) ||
          !Number.isFinite(level.range.max) ||
          level.range.min > level.range.max,
      );

      if (invalidLevel) {
        throw new Error('Each level needs a name, status, valid min, and valid max.');
      }

      let savedConfig: HealthLibraryConfiguration;
      if (selectedConfigId) {
        savedConfig = await updateHealthLibraryConfiguration(selectedConfigId, payload);
        toast.success(savedConfig.savedLocally
          ? 'Configuration saved locally because the backend rejected the current DTO body.'
          : 'Health library configuration updated.');
      } else {
        savedConfig = await createHealthLibraryConfiguration(payload);
        toast.success(savedConfig.savedLocally
          ? 'Configuration saved locally because the backend rejected the current DTO body.'
          : 'Health library configuration created.');
      }

      const savedId = getHealthLibraryConfigId(savedConfig);
      if (savedId) setSelectedConfigId(savedId);
      await loadHealthLibraryConfigs(payload.condition_id);
    } catch (error) {
      toast.error(`Failed to save configuration: ${(error as Error).message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDeleteConfig = async () => {
    if (!selectedConfigId) return;
    setSavingConfig(true);
    try {
      await deleteHealthLibraryConfiguration(selectedConfigId);
      toast.success('Health library configuration deleted.');
      startNewConfig();
      await loadHealthLibraryConfigs(selectedTemplateConditionId || DEFAULT_CONDITION_ID);
    } catch (error) {
      toast.error(`Failed to delete configuration: ${(error as Error).message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl">Health Library</h1>
          <p className="text-gray-600">
            Disease protocols, editable AI level controls, active cases, and recovered tanks with recorded dates.
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
                <div className="min-w-0 space-y-4">
                  <RobotHealthReport
                    template={selectedTemplate}
                    healthStatus={selectedTemplate.defaultHealthStatus}
                    title="Fixed Health Protocol"
                    compact={false}
                    libraryRecommendation={adminPreviewRecommendation}
                    requireLibraryRecommendation={isAdmin}
                  />

                  {isAdmin && (
                    <Card className="border-[#B9E0E7] bg-white">
                      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <CardTitle className="text-lg">Level Controls for {selectedTemplate.title}</CardTitle>
                          <p className="mt-1 text-sm text-slate-500">
                            These are the exact ranges and recommendations used after AI analysis detects this disease.
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            Condition key: <span className="font-mono text-slate-700">{configConditionId}</span>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            onClick={() => void loadHealthLibraryConfigs(selectedTemplateConditionId)}
                            disabled={loadingConfigs}
                          >
                            <RefreshCw className={`mr-2 h-4 w-4 ${loadingConfigs ? 'animate-spin' : ''}`} />
                            Refresh
                          </Button>
                          <Button variant="outline" onClick={startNewConfig}>
                            Reset Defaults
                          </Button>
                          <Button
                            className="bg-[#088395] hover:bg-[#0A4D68]"
                            onClick={handleSaveConfig}
                            disabled={savingConfig}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {savingConfig ? 'Saving...' : selectedConfigId ? 'Update Levels' : 'Save Levels'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleDeleteConfig}
                            disabled={!selectedConfigId || savingConfig}
                            className="text-rose-700 hover:text-rose-800"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-2xl border border-[#D7E9EE] bg-[#F7FCFD] p-4">
                          <p className="text-sm font-semibold text-slate-900">Report content controlled by admin</p>
                          <p className="mt-1 text-xs text-slate-500">
                            These fields replace the fixed protocol text in the AI report for this disease.
                          </p>
                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-slate-600" htmlFor="library-medicine-name">
                                Medicine name
                              </label>
                              <Input
                                id="library-medicine-name"
                                value={configMedicineName}
                                onChange={(event) => setConfigMedicineName(event.target.value)}
                                placeholder="اكتب اسم الدواء"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-semibold text-slate-600" htmlFor="library-summary">
                                Diagnosis summary
                              </label>
                              <Input
                                id="library-summary"
                                value={configSummary}
                                onChange={(event) => setConfigSummary(event.target.value)}
                                placeholder="اكتب ملخص التشخيص"
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-semibold text-slate-600" htmlFor="library-quarantine">
                                Prevention and quarantine note
                              </label>
                              <Input
                                id="library-quarantine"
                                value={configQuarantineAdvice}
                                onChange={(event) => setConfigQuarantineAdvice(event.target.value)}
                                placeholder="اكتب ملاحظات الوقاية أو العزل"
                              />
                            </div>
                          </div>
                        </div>

                        {[
                          {
                            title: 'Observed signs',
                            items: configSymptoms,
                            setter: setConfigSymptoms,
                            placeholder: 'اكتب علامة مرضية',
                          },
                          {
                            title: 'Feeding guidance',
                            items: configFeedingGuidance,
                            setter: setConfigFeedingGuidance,
                            placeholder: 'اكتب إرشاد التغذية',
                          },
                          {
                            title: 'Recovery checklist',
                            items: configRecoveryChecklist,
                            setter: setConfigRecoveryChecklist,
                            placeholder: 'اكتب شرط التعافي',
                          },
                          {
                            title: 'Preventive measures',
                            items: configPreventiveMeasures,
                            setter: setConfigPreventiveMeasures,
                            placeholder: 'اكتب إجراء وقائي',
                          },
                        ].map((section) => (
                          <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                              <Button variant="outline" size="sm" onClick={() => addListItem(section.setter)}>
                                <Plus className="mr-2 h-3.5 w-3.5" />
                                Add
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {section.items.map((item, itemIndex) => (
                                <div key={`${section.title}-${itemIndex}`} className="flex gap-2">
                                  <Input
                                    value={item}
                                    onChange={(event) => updateListItem(section.setter, itemIndex, event.target.value)}
                                    placeholder={section.placeholder}
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => removeListItem(section.setter, itemIndex)}
                                    disabled={section.items.length === 1}
                                    className="shrink-0 text-rose-700 hover:text-rose-800"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        <div className="flex flex-col gap-3 rounded-2xl border border-[#D7E9EE] bg-[#F7FCFD] p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Disease percentage levels</p>
                            <p className="mt-1 text-xs text-slate-500">
                              The AI confidence percentage is matched with these ranges. The matching recommendation is shown in the AI report.
                            </p>
                          </div>
                          <Button variant="outline" onClick={addRiskLevel}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Level
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {configLevels.map((level, levelIndex) => (
                            <div key={`disease-level-${levelIndex}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">Level {levelIndex + 1}</p>
                                  <p className="text-xs text-slate-500">This is one disease-library level used directly after AI analysis.</p>
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => removeRiskLevel(levelIndex)}
                                  disabled={configLevels.length === 1}
                                  className="text-rose-700 hover:text-rose-800"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove Level
                                </Button>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-600" htmlFor={`library-level-${levelIndex}`}>
                                    Level key
                                  </label>
                                  <Input
                                    id={`library-level-${levelIndex}`}
                                    value={level.level}
                                    onChange={(event) => updateLevelField(levelIndex, 'level', event.target.value)}
                                    placeholder="low"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-600" htmlFor={`library-min-${levelIndex}`}>
                                    Min %
                                  </label>
                                  <Input
                                    id={`library-min-${levelIndex}`}
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={level.range.min}
                                    onChange={(event) => updateLevelRange(levelIndex, 'min', event.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-600" htmlFor={`library-max-${levelIndex}`}>
                                    Max %
                                  </label>
                                  <Input
                                    id={`library-max-${levelIndex}`}
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={level.range.max}
                                    onChange={(event) => updateLevelRange(levelIndex, 'max', event.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-600" htmlFor={`library-status-${levelIndex}`}>
                                    Status
                                  </label>
                                  <Input
                                    id={`library-status-${levelIndex}`}
                                    value={level.status}
                                    onChange={(event) => updateLevelField(levelIndex, 'status', event.target.value)}
                                    placeholder="آمن"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-xs font-semibold text-slate-600" htmlFor={`library-risk-${levelIndex}`}>
                                    Risk
                                  </label>
                                  <Input
                                    id={`library-risk-${levelIndex}`}
                                    value={level.risk}
                                    onChange={(event) => updateLevelField(levelIndex, 'risk', event.target.value)}
                                    placeholder="لا يوجد خطر واضح"
                                  />
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-semibold text-slate-600">Recommendations shown after AI analysis</p>
                                  <Button variant="outline" size="sm" onClick={() => addRecommendation(levelIndex)}>
                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                    Add Recommendation
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {level.recommendations.map((recommendation, recommendationIndex) => (
                                    <div key={`${levelIndex}-${recommendationIndex}`} className="flex gap-2">
                                      <Input
                                        value={recommendation}
                                        onChange={(event) =>
                                          updateRecommendation(levelIndex, recommendationIndex, event.target.value)
                                        }
                                        placeholder="اكتب التوصية هنا"
                                      />
                                      <Button
                                        variant="outline"
                                        onClick={() => removeRecommendation(levelIndex, recommendationIndex)}
                                        disabled={level.recommendations.length === 1}
                                        className="shrink-0 text-rose-700 hover:text-rose-800"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
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
