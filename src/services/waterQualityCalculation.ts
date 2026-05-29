export type QualityStatus = 'OPTIMAL' | 'GOOD' | 'WARNING' | 'CRITICAL';

const RANGES = {
    ph: {
        min_optimal: 7.0,
        max_optimal: 8.0,
        min_good: 6.5,
        max_good: 8.5,
        min_warning: 6.0,
        max_warning: 9.0,
    },
    temperature: {
        min_optimal: 22.0,
        max_optimal: 28.0,
        min_good: 18.0,
        max_good: 30.0,
        min_warning: 15.0,
        max_warning: 32.0,
    },
    do: {
        min_optimal: 6.0,
        max_optimal: 100,
        min_good: 5.0,
        max_good: 100,
        min_warning: 3.0,
        max_warning: 100,
    },
    nh3: {
        min_optimal: -1,
        max_optimal: 0.02,
        min_good: -1,
        max_good: 0.05,
        min_warning: -1,
        max_warning: 0.10,
    },
    no2: {
        min_optimal: -1,
        max_optimal: 0.1,
        min_good: -1,
        max_good: 0.3,
        min_warning: -1,
        max_warning: 1.0,
    },
    turbidity: {
        min_optimal: 0,
        max_optimal: 25,
        min_good: 0,
        max_good: 50,
        min_warning: 0,
        max_warning: 150,
    }
};

export const calculateParamStatus = (param: string, value: number): QualityStatus => {
    const p = param.toLowerCase();
    const range = (RANGES as any)[p];
    if (!range) return 'OPTIMAL';

    if (value >= range.min_optimal && value <= range.max_optimal) return 'OPTIMAL';
    if (value >= range.min_good && value <= range.max_good) return 'GOOD';
    if (value >= range.min_warning && value <= range.max_warning) return 'WARNING';
    return 'CRITICAL';
};

export const getOverallStatus = (params: Record<string, number>): QualityStatus => {
    let worstStatus: QualityStatus = 'OPTIMAL';
    const statusValues: Record<QualityStatus, number> = {
        'OPTIMAL': 0,
        'GOOD': 1,
        'WARNING': 2,
        'CRITICAL': 3
    };

    for (const [param, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const status = calculateParamStatus(param, value);
        if (statusValues[status] > statusValues[worstStatus]) {
            worstStatus = status;
        }
    }

    return worstStatus;
};
