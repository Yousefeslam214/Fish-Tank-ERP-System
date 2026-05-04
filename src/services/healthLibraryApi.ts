import { apiDelete, apiGet, apiPatch, apiPost } from '../api';
import {
  getHealthLibraryTemplates,
  HealthReportTemplate,
  resolveHealthReportTemplate,
} from './healthKnowledgeBase';

export interface HealthLibraryRange {
  min: number;
  max: number;
}

export interface HealthLibraryRiskLevel {
  level: string;
  range: HealthLibraryRange;
  status: string;
  risk: string;
  recommendations: string[];
}

export interface HealthLibraryRule {
  threshold: number;
  operator: '>=' | '>' | '<=' | '<' | '=' | '==';
  status: string;
  message?: string;
  actions?: string[];
}

export interface HealthLibraryConfiguration {
  id?: string;
  _id?: string;
  condition_id?: string;
  conditionId?: string;
  condition?: string;
  name?: string;
  description?: string;
  configuration?: Record<string, unknown>;
  diseaseKey?: string;
  medicineName?: string;
  summary?: string;
  symptoms?: string[];
  treatmentProtocol?: string[];
  feedingGuidance?: string[];
  recoveryChecklist?: string[];
  preventiveMeasures?: string[];
  quarantineAdvice?: string;
  levels?: HealthLibraryRiskLevel[];
  healthy_rule?: HealthLibraryRule;
  unhealthy_rule?: HealthLibraryRule;
  improvement_tips?: Record<string, string[]>;
  createdAt?: string;
  updatedAt?: string;
  savedLocally?: boolean;
  [key: string]: unknown;
}

export interface HealthLibraryRecommendation {
  conditionId: string;
  level?: string;
  range?: HealthLibraryRange;
  status: string;
  risk?: string;
  message?: string;
  medicineName?: string;
  summary?: string;
  symptoms?: string[];
  feedingGuidance?: string[];
  recoveryChecklist?: string[];
  preventiveMeasures?: string[];
  quarantineAdvice?: string;
  recommendations: string[];
}

export const DEFAULT_CONDITION_ID = 'fish_risk_levels';
const LOCAL_HEALTH_LIBRARY_KEY = 'fishfarm360.healthLibraryConfigurations';

export const DISEASE_LIBRARY_TEMPLATE_KEYS = [
  'columnaris',
  'bacterial-gill-disease',
  'streptococcosis',
  'aeromonas',
] as const;

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, any>) : {};

const unwrapPayload = <T>(payload: unknown): T => {
  const record = asRecord(payload);
  return (record.data ?? record.result ?? record.item ?? payload) as T;
};

const unwrapArray = <T>(payload: unknown): T[] => {
  const unwrapped = unwrapPayload<any>(payload);
  if (Array.isArray(unwrapped)) return unwrapped as T[];

  const record = asRecord(unwrapped);
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.records)) return record.records as T[];
  if (Array.isArray(record.configurations)) return record.configurations as T[];
  if (Array.isArray(record.healthLibraries)) return record.healthLibraries as T[];
  if (Array.isArray(record.results)) return record.results as T[];

  for (const key of ['data', 'result', 'payload']) {
    if (record[key] && record[key] !== payload) {
      const nested = unwrapArray<T>(record[key]);
      if (nested.length > 0) return nested;
    }
  }

  return [];
};

export const getHealthLibraryConfigId = (config: HealthLibraryConfiguration) =>
  String(config.id || config._id || '');

export const getHealthLibraryConditionId = (config: HealthLibraryConfiguration) =>
  String(config.condition_id || config.conditionId || config.condition || '').trim();

const normalizeApiConfiguration = (
  config: HealthLibraryConfiguration = {},
): HealthLibraryConfiguration => {
  const nestedConfig = asRecord(config.configuration);
  const conditionId = getHealthLibraryConditionId(config);

  return {
    ...config,
    ...nestedConfig,
    id: config.id,
    _id: config._id,
    condition_id: conditionId,
    conditionId,
    condition: conditionId,
    name: String(config.name || nestedConfig.name || ''),
    description: String(config.description || nestedConfig.description || ''),
    configuration: nestedConfig,
  } as HealthLibraryConfiguration;
};

const toApiConfigurationPayload = (data: HealthLibraryConfiguration) => {
  const conditionId = getHealthLibraryConditionId(data);
  const configuration = {
    diseaseKey: data.diseaseKey,
    medicineName: data.medicineName,
    summary: data.summary,
    symptoms: data.symptoms,
    feedingGuidance: data.feedingGuidance,
    recoveryChecklist: data.recoveryChecklist,
    preventiveMeasures: data.preventiveMeasures,
    quarantineAdvice: data.quarantineAdvice,
    levels: data.levels,
  };

  Object.keys(configuration).forEach((key) => {
    if ((configuration as Record<string, unknown>)[key] === undefined) {
      delete (configuration as Record<string, unknown>)[key];
    }
  });

  return {
    ...(conditionId ? { conditionId } : {}),
    ...(data.name ? { name: data.name } : {}),
    ...(data.description ? { description: data.description } : {}),
    configuration,
  };
};

export const getDiseaseConditionId = (template: HealthReportTemplate) =>
  `fish_${template.key.replace(/[^a-z0-9]+/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase()}`;

export const getConfigurableDiseaseLibraryTemplates = () =>
  getHealthLibraryTemplates().filter((template) =>
    DISEASE_LIBRARY_TEMPLATE_KEYS.includes(template.key as (typeof DISEASE_LIBRARY_TEMPLATE_KEYS)[number]),
  );

const normalizeCondition = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeConditionKey = (value?: string) =>
  normalizeCondition(value).replace(/\s+/g, '_');

const stripDiseasePrefix = (value: string) =>
  value.replace(/^(fish|disease|condition)_+/, '');

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const canUseLocalStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const isBackendWhitelistError = (error: unknown) => {
  const message = String((error as Error)?.message || error || '');
  return (
    message.includes('should not exist') &&
    message.includes('/tanks/health-library')
  );
};

const readLocalHealthLibraryConfigurations = (): HealthLibraryConfiguration[] => {
  if (!canUseLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_HEALTH_LIBRARY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((config) => normalizeApiConfiguration(config)).filter((config) => getHealthLibraryConditionId(config))
      : [];
  } catch {
    return [];
  }
};

const writeLocalHealthLibraryConfigurations = (configs: HealthLibraryConfiguration[]) => {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(LOCAL_HEALTH_LIBRARY_KEY, JSON.stringify(configs));
};

const upsertLocalHealthLibraryConfiguration = (
  data: HealthLibraryConfiguration,
  id?: string,
): HealthLibraryConfiguration => {
  const localConfigs = readLocalHealthLibraryConfigurations();
  const conditionId = getHealthLibraryConditionId(data);
  const normalized = normalizeApiConfiguration({
    ...data,
    id: id || getHealthLibraryConfigId(data) || `local_${conditionId || 'health'}_${Date.now()}`,
    _id: undefined,
    savedLocally: true,
  });
  const nextConfigs = [
    normalized,
    ...localConfigs.filter((config) => {
      const sameId = getHealthLibraryConfigId(config) && getHealthLibraryConfigId(config) === getHealthLibraryConfigId(normalized);
      const sameCondition = conditionId && getHealthLibraryConditionId(config) === conditionId;
      return !sameId && !sameCondition;
    }),
  ];
  writeLocalHealthLibraryConfigurations(nextConfigs);
  return normalized;
};

const removeLocalHealthLibraryConfiguration = (id: string) => {
  const localConfigs = readLocalHealthLibraryConfigurations();
  writeLocalHealthLibraryConfigurations(
    localConfigs.filter((config) => getHealthLibraryConfigId(config) !== id),
  );
};

const cleanTextList = (items?: unknown, fallback: string[] = []) => {
  const source = Array.isArray(items) ? items : fallback;
  const cleaned = source.map((item) => String(item || '').trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
};

const cloneRiskLevels = (levels: HealthLibraryRiskLevel[]) =>
  levels.map((level) => ({
    level: level.level,
    range: { min: level.range.min, max: level.range.max },
    status: level.status,
    risk: level.risk,
    recommendations: [...level.recommendations],
  }));

export const DEFAULT_RISK_LEVELS: HealthLibraryRiskLevel[] = [
  {
    level: 'low',
    range: { min: 0, max: 25 },
    status: 'آمن',
    risk: 'لا يوجد خطر واضح',
    recommendations: ['الحفاظ على النظام الحالي', 'متابعة دورية', 'تغيير المياه بانتظام'],
  },
  {
    level: 'medium',
    range: { min: 26, max: 50 },
    status: 'مقبول',
    risk: 'بداية خطر بسيط',
    recommendations: ['تحسين جودة العلف', 'مراقبة الحالة', 'تنظيف المياه باستمرار'],
  },
  {
    level: 'danger',
    range: { min: 51, max: 75 },
    status: 'خطر',
    risk: 'ممكن تتدهور الحالة',
    recommendations: ['تحسين التغذية فوراً', 'إضافة مكملات', 'متابعة يومية'],
  },
  {
    level: 'very_danger',
    range: { min: 76, max: 100 },
    status: 'خطر شديد',
    risk: 'احتمال نفوق عالي',
    recommendations: ['تدخل بيطري فوري', 'عزل الحالة', 'فحص شامل'],
  },
];

export const DISEASE_DEFAULT_LEVELS: Record<string, HealthLibraryRiskLevel[]> = {
  columnaris: [
    {
      level: 'early_columnaris',
      range: { min: 0, max: 20 },
      status: 'اشتباه مبكر',
      risk: 'علامات سطحية بسيطة وقد تنتشر مع الحرارة أو الزحام',
      recommendations: ['تقليل التعامل مع السمك', 'مراجعة الكثافة وجودة المياه', 'متابعة الجلد والفم خلال 24 ساعة'],
    },
    {
      level: 'active_columnaris',
      range: { min: 21, max: 45 },
      status: 'إصابة نشطة',
      risk: 'احتمال انتشار سريع داخل الحوض',
      recommendations: ['عزل أدوات الحوض', 'تقليل التغذية مؤقتاً', 'بدء بروتوكول علاج Columnaris الذي يحدده الأدمن'],
    },
    {
      level: 'severe_columnaris',
      range: { min: 46, max: 70 },
      status: 'خطر عالي',
      risk: 'تدهور الجلد والخياشيم ممكن يزيد النفوق',
      recommendations: ['تدخل علاجي فوري', 'رفع التهوية وتقليل الإجهاد', 'متابعة يومية للنفوق والآفات'],
    },
    {
      level: 'critical_columnaris',
      range: { min: 71, max: 100 },
      status: 'حرج',
      risk: 'انتشار شديد واحتمال نفوق عالي',
      recommendations: ['عزل الدفعة المصابة', 'إيقاف النقل أو الفرز', 'مراجعة بيطرية عاجلة وتنفيذ تعليمات العلاج كاملة'],
    },
  ],
  'bacterial-gill-disease': [
    {
      level: 'light_gill_stress',
      range: { min: 0, max: 25 },
      status: 'إجهاد خياشيم بسيط',
      risk: 'تنفس أسرع من الطبيعي مع بداية ضغط على الخياشيم',
      recommendations: ['زيادة متابعة الأكسجين', 'تنظيف الرواسب', 'مراجعة معدل التغذية'],
    },
    {
      level: 'moderate_gill_disease',
      range: { min: 26, max: 50 },
      status: 'إصابة متوسطة',
      risk: 'الخياشيم متأثرة وممكن يحصل تجمع عند التهوية',
      recommendations: ['رفع التهوية فوراً', 'تقليل التغذية', 'فحص الأمونيا والمواد العالقة'],
    },
    {
      level: 'severe_gill_disease',
      range: { min: 51, max: 75 },
      status: 'خطر تنفسي',
      risk: 'نقص أكسجين أو التهاب خياشيم قد يسبب نفوق سريع',
      recommendations: ['تشغيل دعم أكسجين إضافي', 'تغيير مياه جزئي حسب تعليمات المزرعة', 'بدء علاج الخياشيم الذي يحدده الأدمن'],
    },
    {
      level: 'critical_gill_disease',
      range: { min: 76, max: 100 },
      status: 'حرج تنفسي',
      risk: 'احتمال اختناق أو نفوق جماعي',
      recommendations: ['تدخل طارئ في التهوية', 'إيقاف التغذية مؤقتاً', 'متابعة الحوض كل عدة ساعات'],
    },
  ],
  streptococcosis: [
    {
      level: 'suspected_strep',
      range: { min: 0, max: 15 },
      status: 'اشتباه',
      risk: 'المرض خطير حتى مع نسبة منخفضة بسبب سرعة تدهوره',
      recommendations: ['مراقبة السباحة غير الطبيعية', 'تسجيل أي نفوق مفاجئ', 'تجنب نقل السمك'],
    },
    {
      level: 'moderate_strep',
      range: { min: 16, max: 35 },
      status: 'خطر مبكر',
      risk: 'بداية علامات عصبية أو ضعف عام',
      recommendations: ['إبلاغ المسؤول الصحي', 'تقليل التغذية بوضوح', 'عزل أدوات الحوض'],
    },
    {
      level: 'severe_strep',
      range: { min: 36, max: 65 },
      status: 'خطر شديد',
      risk: 'احتمال نفوق متسارع',
      recommendations: ['تدخل بيطري عاجل', 'جمع النافق مرتين يومياً', 'تنفيذ علاج Streptococcosis المكتوب من الأدمن'],
    },
    {
      level: 'critical_strep',
      range: { min: 66, max: 100 },
      status: 'حرج جداً',
      risk: 'حالة طوارئ واحتمال خسائر عالية',
      recommendations: ['عزل كامل للدفعة', 'وقف أي إجهاد أو فرز', 'متابعة مستمرة وتطبيق تعليمات العلاج فوراً'],
    },
  ],
  aeromonas: [
    {
      level: 'mild_aeromonas',
      range: { min: 0, max: 20 },
      status: 'بداية بسيطة',
      risk: 'علامات احمرار أو قرح بسيطة',
      recommendations: ['تحسين النظافة وإزالة المخلفات', 'متابعة الشهية', 'مراجعة أي إصابات جلدية'],
    },
    {
      level: 'active_aeromonas',
      range: { min: 21, max: 50 },
      status: 'إصابة نشطة',
      risk: 'انتشار القرح أو النزف ممكن يزيد',
      recommendations: ['تنظيف الحوض والأدوات', 'تقليل التغذية حسب الشهية', 'تطبيق توصيات علاج Aeromonas المكتوبة من الأدمن'],
    },
    {
      level: 'severe_aeromonas',
      range: { min: 51, max: 75 },
      status: 'خطر عالي',
      risk: 'قرح واضحة أو ضعف شديد واحتمال عدوى ثانوية',
      recommendations: ['عزل الأدوات المصابة', 'متابعة الأمونيا والأكسجين', 'بدء تدخل علاجي سريع'],
    },
    {
      level: 'critical_aeromonas',
      range: { min: 76, max: 100 },
      status: 'حرج',
      risk: 'احتمال نفوق عالي مع تدهور سريع',
      recommendations: ['تدخل بيطري فوري', 'رفع إجراءات التطهير', 'تسجيل النفوق والأعراض يومياً'],
    },
  ],
};

export const getDefaultRiskLevelsForTemplate = (template?: HealthReportTemplate) =>
  cloneRiskLevels(DISEASE_DEFAULT_LEVELS[template?.key || ''] || DEFAULT_RISK_LEVELS);

export const normalizeHealthLibraryRiskLevels = (
  levels?: HealthLibraryRiskLevel[],
  fallbackLevels = DEFAULT_RISK_LEVELS,
) => {
  const sourceLevels = Array.isArray(levels) && levels.length > 0 ? levels : fallbackLevels;
  return sourceLevels.map((level, index) => {
    const fallbackLevel = fallbackLevels[index] || createDefaultRiskLevel();
    const recommendations = cleanTextList(level.recommendations, fallbackLevel.recommendations);

    return {
      level: String(level.level || fallbackLevel.level || ''),
      range: {
        min: Number(level.range?.min ?? fallbackLevel.range.min ?? 0),
        max: Number(level.range?.max ?? fallbackLevel.range.max ?? 100),
      },
      status: String(level.status || fallbackLevel.status || ''),
      risk: String(level.risk || fallbackLevel.risk || ''),
      recommendations,
    };
  });
};

export const createDefaultRiskLevel = (): HealthLibraryRiskLevel => ({
  level: '',
  range: { min: 0, max: 100 },
  status: '',
  risk: '',
  recommendations: [''],
});

export const buildDefaultDiseaseLibraryConfiguration = (
  template: HealthReportTemplate,
): HealthLibraryConfiguration => ({
  condition_id: getDiseaseConditionId(template),
  conditionId: getDiseaseConditionId(template),
  condition: getDiseaseConditionId(template),
  name: template.title,
  description: `AI health library configuration for ${template.title}`,
  diseaseKey: template.key,
  summary: template.summary,
  symptoms: [...template.symptoms],
  feedingGuidance: [...template.feedingGuidance],
  recoveryChecklist: [...template.recoveryChecklist],
  preventiveMeasures: [...template.preventiveMeasures],
  quarantineAdvice: template.quarantineAdvice,
  levels: getDefaultRiskLevelsForTemplate(template),
});

export const getDefaultDiseaseLibraryConfigurations = () =>
  getConfigurableDiseaseLibraryTemplates().map(buildDefaultDiseaseLibraryConfiguration);

const resolveTemplateFromConfig = (config: HealthLibraryConfiguration) => {
  const conditionId = getHealthLibraryConditionId(config);
  const configKey = normalizeConditionKey(conditionId);
  const baseConfigKey = stripDiseasePrefix(configKey);
  const templates = getConfigurableDiseaseLibraryTemplates();

  return templates.find((template) => {
    const templateKey = normalizeConditionKey(template.key);
    const diseaseConditionKey = normalizeConditionKey(getDiseaseConditionId(template));
    return configKey === diseaseConditionKey || baseConfigKey === templateKey;
  }) || resolveHealthReportTemplate(`${conditionId} ${config.name || ''}`);
};

export const mergeHealthLibraryConfigurationWithDefaults = (
  config: HealthLibraryConfiguration,
): HealthLibraryConfiguration => {
  const template = resolveTemplateFromConfig(config);
  const defaults = buildDefaultDiseaseLibraryConfiguration(template);
  const fallbackLevels = getDefaultRiskLevelsForTemplate(template);

  return {
    ...defaults,
    ...config,
    condition_id: getHealthLibraryConditionId(config) || defaults.condition_id,
    name: String(config.name || defaults.name || template.title),
    medicineName: String(config.medicineName || '').trim() || undefined,
    summary: String(config.summary || defaults.summary || ''),
    symptoms: cleanTextList(config.symptoms, defaults.symptoms),
    feedingGuidance: cleanTextList(config.feedingGuidance, defaults.feedingGuidance),
    recoveryChecklist: cleanTextList(config.recoveryChecklist, defaults.recoveryChecklist),
    preventiveMeasures: cleanTextList(config.preventiveMeasures, defaults.preventiveMeasures),
    quarantineAdvice: String(config.quarantineAdvice || defaults.quarantineAdvice || ''),
    levels: normalizeHealthLibraryRiskLevels(config.levels, fallbackLevels),
  };
};

const conditionMatchesLabels = (config: HealthLibraryConfiguration, labels: string[]) => {
  const configKey = normalizeConditionKey(getHealthLibraryConditionId(config));
  const baseConfigKey = stripDiseasePrefix(configKey);
  const labelKeys = labels.map(normalizeConditionKey).filter(Boolean);

  return labelKeys.some((labelKey) => {
    const baseLabelKey = stripDiseasePrefix(labelKey);
    return (
      configKey === labelKey ||
      configKey === `fish_${labelKey}` ||
      configKey === `disease_${labelKey}` ||
      baseConfigKey === labelKey ||
      baseConfigKey === baseLabelKey ||
      (baseConfigKey.length > 3 && baseLabelKey.includes(baseConfigKey)) ||
      (baseLabelKey.length > 3 && baseConfigKey.includes(baseLabelKey))
    );
  });
};

const findConfigByConditionLabels = (
  configs: HealthLibraryConfiguration[],
  labels: string[],
) => configs.find((config) => conditionMatchesLabels(config, labels));

const findConfigByConditionKeys = (configs: HealthLibraryConfiguration[], keys: string[]) =>
  findConfigByConditionLabels(configs, keys);

export const mergeHealthLibraryConfigurationsWithDefaults = (
  configs: HealthLibraryConfiguration[],
): HealthLibraryConfiguration[] => {
  const mergedDefaults = getDefaultDiseaseLibraryConfigurations().map((defaultConfig) => {
    const matchingConfig = findConfigByConditionLabels(configs, [
      getHealthLibraryConditionId(defaultConfig),
      String(defaultConfig.name || ''),
    ]);
    return mergeHealthLibraryConfigurationWithDefaults(matchingConfig || defaultConfig);
  });

  const additionalConfigs = configs
    .filter((config) => !findConfigByConditionLabels(mergedDefaults, [getHealthLibraryConditionId(config)]))
    .map(mergeHealthLibraryConfigurationWithDefaults);

  return [...mergedDefaults, ...additionalConfigs];
};

const compareRule = (value: number, rule?: HealthLibraryRule) => {
  if (!rule || !Number.isFinite(rule.threshold)) return false;
  switch (rule.operator) {
    case '>':
      return value > rule.threshold;
    case '<':
      return value < rule.threshold;
    case '<=':
      return value <= rule.threshold;
    case '=':
    case '==':
      return value === rule.threshold;
    case '>=':
    default:
      return value >= rule.threshold;
  }
};

const flattenImprovementTips = (tips?: Record<string, string[]>) =>
  Object.values(tips || {}).flatMap((items) => (Array.isArray(items) ? items : []));

export const listHealthLibraryConfigurations = async (): Promise<HealthLibraryConfiguration[]> => {
  const localConfigs = readLocalHealthLibraryConfigurations();
  try {
    const payload = await apiGet<unknown>('/tanks/health-library');
    const apiConfigs = unwrapArray<HealthLibraryConfiguration>(payload).map(normalizeApiConfiguration);
    return [...localConfigs, ...apiConfigs];
  } catch {
    return localConfigs;
  }
};

export const getHealthLibraryConfiguration = async (id: string): Promise<HealthLibraryConfiguration> => {
  const localConfig = readLocalHealthLibraryConfigurations()
    .find((config) => getHealthLibraryConfigId(config) === id);
  if (localConfig) return localConfig;

  const payload = await apiGet<unknown>(`/tanks/health-library/${id}`);
  return normalizeApiConfiguration(unwrapPayload<HealthLibraryConfiguration>(payload));
};

export const getHealthLibraryByCondition = async (conditionId: string): Promise<HealthLibraryConfiguration> => {
  const localConfig = readLocalHealthLibraryConfigurations()
    .find((config) => getHealthLibraryConditionId(config) === conditionId);
  if (localConfig) return localConfig;

  const payload = await apiGet<unknown>(`/tanks/health-library/condition/${encodeURIComponent(conditionId)}`);
  return normalizeApiConfiguration(unwrapPayload<HealthLibraryConfiguration>(payload));
};

export const createHealthLibraryConfiguration = async (
  data: HealthLibraryConfiguration,
): Promise<HealthLibraryConfiguration> => {
  try {
    const payload = await apiPost<unknown>('/tanks/health-library', toApiConfigurationPayload(data));
    return normalizeApiConfiguration(unwrapPayload<HealthLibraryConfiguration | undefined>(payload) || data);
  } catch (error) {
    if (isBackendWhitelistError(error)) {
      return upsertLocalHealthLibraryConfiguration(data);
    }
    throw error;
  }
};

export const updateHealthLibraryConfiguration = async (
  id: string,
  data: HealthLibraryConfiguration,
): Promise<HealthLibraryConfiguration> => {
  if (id.startsWith('local_')) {
    return upsertLocalHealthLibraryConfiguration(data, id);
  }

  const { conditionId: _conditionId, ...payloadData } = toApiConfigurationPayload(data);
  try {
    const payload = await apiPatch<unknown>(`/tanks/health-library/${id}`, payloadData);
    return normalizeApiConfiguration(unwrapPayload<HealthLibraryConfiguration | undefined>(payload) || { ...data, id });
  } catch (error) {
    if (isBackendWhitelistError(error)) {
      return upsertLocalHealthLibraryConfiguration(data, id);
    }
    throw error;
  }
};

export const deleteHealthLibraryConfiguration = async (id: string): Promise<void> => {
  if (id.startsWith('local_')) {
    removeLocalHealthLibraryConfiguration(id);
    return;
  }

  await apiDelete(`/tanks/health-library/${id}`);
};

export const resolveHealthLibraryRecommendation = (
  configs: HealthLibraryConfiguration[],
  conditionLabel: string | string[],
  percent: number,
  isHealthy: boolean,
): HealthLibraryRecommendation | null => {
  const initialLabels = Array.isArray(conditionLabel) ? conditionLabel : [conditionLabel];
  const template = resolveHealthReportTemplate(initialLabels.join(' '));
  const conditionLabels = unique([
    ...initialLabels,
    template.key,
    template.title,
    ...template.aliases,
  ]).filter(Boolean);
  const mergedConfigs = mergeHealthLibraryConfigurationsWithDefaults(configs);
  const conditionConfig = findConfigByConditionLabels(mergedConfigs, conditionLabels);
  const globalRiskConfig = findConfigByConditionKeys(mergedConfigs, ['fish_risk_levels', 'animal_risk_levels']);
  const healthStatusConfig = findConfigByConditionKeys(mergedConfigs, ['fish_health_status', 'animal_health_status']);

  if (isHealthy) {
    const healthyRule = compareRule(percent, healthStatusConfig?.healthy_rule)
      ? healthStatusConfig?.healthy_rule
      : undefined;

    if (healthyRule && healthStatusConfig) {
      return {
        conditionId: getHealthLibraryConditionId(healthStatusConfig),
        status: healthyRule.status,
        message: healthyRule.message,
        recommendations: healthyRule.actions?.length
          ? healthyRule.actions
          : flattenImprovementTips(healthStatusConfig.improvement_tips),
      };
    }

    return null;
  }

  const config = conditionConfig || globalRiskConfig;
  const riskLevel = config?.levels?.find((level) => {
    const min = Number(level.range?.min ?? 0);
    const max = Number(level.range?.max ?? 100);
    return percent >= min && percent <= max;
  });

  if (riskLevel && config) {
    const recommendations = cleanTextList(riskLevel.recommendations);

    return {
      conditionId: getHealthLibraryConditionId(config),
      level: riskLevel.level,
      range: { min: Number(riskLevel.range.min), max: Number(riskLevel.range.max) },
      status: riskLevel.status,
      risk: riskLevel.risk,
      medicineName: config.medicineName,
      summary: config.summary,
      symptoms: config.symptoms,
      feedingGuidance: config.feedingGuidance,
      recoveryChecklist: config.recoveryChecklist,
      preventiveMeasures: config.preventiveMeasures,
      quarantineAdvice: config.quarantineAdvice,
      recommendations,
    };
  }

  if (healthStatusConfig) {
    const selectedRule = compareRule(percent, healthStatusConfig.unhealthy_rule)
      ? healthStatusConfig.unhealthy_rule
      : undefined;

    if (selectedRule) {
      return {
        conditionId: getHealthLibraryConditionId(healthStatusConfig),
        status: selectedRule.status,
        message: selectedRule.message,
        recommendations: selectedRule.actions?.length
          ? selectedRule.actions
          : flattenImprovementTips(healthStatusConfig.improvement_tips),
      };
    }
  }

  return null;
};
