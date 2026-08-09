import type { FundamentalMetric, FundamentalSnapshot } from '@/features/fundamentals';

import type {
  QuantitativeAssessment,
  QuantitativeComponentName,
  QuantitativeDataStatus,
  QuantitativeInput,
  QuantitativeIntelligenceService,
  QuantitativeScoreComponent,
  QuantitativeSignalProvider,
  QuantitativeWeights,
  ScoreFactor,
  SignalConflict,
  SignalDirection,
} from './types';

export const DEFAULT_QUANTITATIVE_WEIGHTS: QuantitativeWeights = {
  fundamental: 0.25,
  technical: 0.25,
  momentum: 0.15,
  trend: 0.1,
  volume: 0.05,
  risk: 0.1,
  valuation: 0.05,
  quality: 0.05,
};
const names = Object.keys(DEFAULT_QUANTITATIVE_WEIGHTS) as QuantitativeComponentName[];
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const factor = (
  id: string,
  label: string,
  direction: SignalDirection,
  explanation: string,
): ScoreFactor => ({ id, label, direction, explanation });

export function normalizeQuantitativeWeights(
  supplied: Partial<QuantitativeWeights> = {},
): QuantitativeWeights {
  const merged = { ...DEFAULT_QUANTITATIVE_WEIGHTS, ...supplied };
  if (names.some((name) => !Number.isFinite(merged[name]) || merged[name] < 0))
    throw new Error('Quantitative weights must be finite and non-negative.');
  const total = names.reduce((sum, name) => sum + merged[name], 0);
  if (total <= 0) throw new Error('At least one quantitative weight must be positive.');
  return Object.fromEntries(
    names.map((name) => [name, merged[name] / total]),
  ) as QuantitativeWeights;
}

export function classifyCompositeScore(score: number) {
  if (!Number.isFinite(score) || score < 0 || score > 100)
    throw new Error('Composite score must be between 0 and 100.');
  if (score >= 90) return 'Exceptional' as const;
  if (score >= 80) return 'Strong' as const;
  if (score >= 70) return 'Constructive' as const;
  if (score >= 60) return 'Neutral' as const;
  if (score >= 50) return 'Weak' as const;
  return 'High Risk / Weak' as const;
}

const metricScore = (metric: FundamentalMetric, good: (value: number) => number): number | null =>
  finite(metric.value) ? clamp(good(metric.value)) : null;
const average = (values: (number | null)[]) => {
  const usable = values.filter(finite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
};
const fundamentalScores = (f: FundamentalSnapshot | null) => {
  if (!f) return { fundamental: null, valuation: null, quality: null };
  const m = f.metrics;
  const growth = average([
    metricScore(m.revenueGrowth, (v) => 50 + v * 2),
    metricScore(m.epsGrowth, (v) => 50 + v * 2),
    metricScore(m.freeCashFlowGrowth, (v) => 50 + v * 2),
  ]);
  const profitability = average([
    metricScore(m.grossMargin, (v) => 40 + v),
    metricScore(m.operatingMargin, (v) => 50 + v * 1.5),
    metricScore(m.netProfitMargin, (v) => 50 + v * 2),
    metricScore(m.returnOnEquity, (v) => 50 + v * 1.5),
  ]);
  const health = average([
    metricScore(m.currentRatio, (v) => 30 + v * 30),
    metricScore(m.debtToEquity, (v) => 80 - v * 30),
    metricScore(m.freeCashFlowMargin, (v) => 50 + v * 2),
  ]);
  const valuation = average([
    metricScore(m.priceToEarnings, (v) => 100 - v * 2.5),
    metricScore(m.priceToSales, (v) => 90 - v * 8),
    metricScore(m.priceToBook, (v) => 85 - v * 10),
    metricScore(m.cashFlowYield, (v) => 45 + v * 4),
  ]);
  return {
    fundamental: average([growth, profitability, health]),
    valuation,
    quality: average([profitability, health]),
  };
};
const statusOf = (
  input: QuantitativeInput,
  source: 'fundamental' | 'technical',
): QuantitativeDataStatus => {
  if (input.errors?.[source]) return 'error';
  if (source === 'technical') return input.technical?.provenance.status ?? 'unavailable';
  if (!input.fundamental) return 'unavailable';
  if (input.fundamental.environment === 'demo') return 'demo';
  return input.fundamental.dataStatus === 'populated' ? 'real' : 'partial';
};
const qualityMultiplier: Record<QuantitativeDataStatus, number> = {
  real: 1,
  partial: 0.75,
  demo: 0.35,
  unavailable: 0,
  error: 0,
};

function buildComponents(input: QuantitativeInput, weights: QuantitativeWeights) {
  const fs = fundamentalScores(input.fundamental);
  const technical = input.technical;
  const technicalParts = Object.fromEntries(
    (technical?.score.components ?? []).map((item) => [item.name, item]),
  );
  const values: Record<QuantitativeComponentName, number | null> = {
    fundamental: fs.fundamental,
    technical: finite(technical?.score.value) ? technical.score.value : null,
    momentum:
      finite(technicalParts.momentum?.score) && technicalParts.momentum.available
        ? technicalParts.momentum.score
        : null,
    trend:
      finite(technicalParts.trend?.score) && technicalParts.trend.available
        ? technicalParts.trend.score
        : null,
    volume:
      finite(technicalParts.volume?.score) && technicalParts.volume.available
        ? technicalParts.volume.score
        : null,
    risk:
      finite(technicalParts.volatility?.score) && technicalParts.volatility.available
        ? technicalParts.volatility.score
        : null,
    valuation: fs.valuation,
    quality: fs.quality,
  };
  const availableWeight = names.reduce(
    (sum, name) => sum + (values[name] === null ? 0 : weights[name]),
    0,
  );
  return names.map((name): QuantitativeScoreComponent => {
    const score = values[name];
    const source = ['fundamental', 'valuation', 'quality'].includes(name)
      ? 'fundamental'
      : 'technical';
    const status = statusOf(input, source);
    const direction: SignalDirection =
      score === null ? 'neutral' : score >= 60 ? 'bullish' : score < 50 ? 'bearish' : 'neutral';
    const details =
      source === 'technical' ? ((name === 'technical' ? technical?.signals : undefined) ?? []) : [];
    const generated =
      score === null
        ? []
        : [
            factor(
              `${name}-assessment`,
              `${name} model assessment`,
              direction,
              `${name} normalized score is ${Math.round(score)}/100.`,
            ),
          ];
    const converted = details.map((item) =>
      factor(`technical-${item.id}`, item.label, item.direction, item.explanation),
    );
    const factors = generated.concat(converted);
    const effectiveWeight =
      score === null || availableWeight === 0 ? 0 : weights[name] / availableWeight;
    return {
      name,
      score: score === null ? null : Math.round(score),
      weight: weights[name],
      effectiveWeight,
      contribution: score === null ? null : score * effectiveWeight,
      positiveFactors: factors.filter((item) => item.direction === 'bullish'),
      negativeFactors: factors.filter((item) => item.direction === 'bearish'),
      neutralFactors: factors.filter((item) => item.direction === 'neutral'),
      missingInputs: score === null ? [`Insufficient ${source} inputs for ${name}.`] : [],
      dataStatus: status,
      provenance:
        source === 'fundamental'
          ? input.fundamental
            ? [input.fundamental.providerName, input.fundamental.source]
            : []
          : technical
            ? [technical.provenance.provider, technical.provenance.source]
            : [],
      confidence: score === null ? 0 : Math.round(qualityMultiplier[status] * 100),
    };
  });
}

function conflictsOf(components: QuantitativeScoreComponent[]): SignalConflict[] {
  const score = (name: QuantitativeComponentName) =>
    components.find((c) => c.name === name)?.score ?? null;
  const conflicts: SignalConflict[] = [];
  const add = (code: string, parts: QuantitativeComponentName[], explanation: string) =>
    conflicts.push({ code, severity: 'warning', components: parts, explanation });
  const f = score('fundamental'),
    t = score('technical'),
    m = score('momentum'),
    r = score('risk'),
    v = score('valuation');
  if (f !== null && t !== null && f >= 70 && t < 50)
    add(
      'strong-fundamentals-weak-technicals',
      ['fundamental', 'technical'],
      'Strong fundamentals conflict with weak technical conditions.',
    );
  if (f !== null && t !== null && f < 50 && t >= 70)
    add(
      'weak-fundamentals-strong-technicals',
      ['fundamental', 'technical'],
      'Strong technical conditions conflict with weak fundamentals.',
    );
  if (m !== null && m >= 70 && f !== null && f < 50)
    add(
      'momentum-fundamental-divergence',
      ['momentum', 'fundamental'],
      'Strong momentum conflicts with weak or deteriorating fundamental inputs.',
    );
  if (t !== null && t >= 70 && r !== null && r < 50)
    add(
      'trend-volatility-risk',
      ['technical', 'risk'],
      'Strong technical conditions coexist with elevated volatility risk.',
    );
  if (v !== null && v >= 70 && f !== null && f < 60)
    add(
      'valuation-growth-conflict',
      ['valuation', 'fundamental'],
      'Attractive valuation coexists with weak broader fundamental or growth evidence.',
    );
  if (f === null && t !== null && t >= 70)
    add(
      'missing-fundamentals',
      ['fundamental', 'technical'],
      'Strong technical evidence is present, but fundamentals are unavailable.',
    );
  if (t === null && f !== null && f >= 70)
    add(
      'missing-technicals',
      ['technical', 'fundamental'],
      'Strong fundamental evidence is present, but technical history is unavailable.',
    );
  return conflicts;
}

export function assessQuantitativeSignals(
  input: QuantitativeInput,
  supplied: Partial<QuantitativeWeights> = {},
): QuantitativeAssessment {
  if (!input.symbol.trim()) throw new Error('A symbol is required.');
  const weights = normalizeQuantitativeWeights(supplied);
  const components = buildComponents(input, weights);
  const usable = components.filter((item) => item.score !== null);
  const raw = usable.length
    ? usable.reduce((sum, item) => sum + (item.contribution ?? 0), 0)
    : null;
  const score = raw === null ? null : Math.round(clamp(raw));
  const factors = components.flatMap((item) => [
    ...item.positiveFactors,
    ...item.negativeFactors,
    ...item.neutralFactors,
  ]);
  const statuses = new Set(components.filter((c) => c.score !== null).map((c) => c.dataStatus));
  const dataStatus: QuantitativeDataStatus =
    input.errors?.fundamental || input.errors?.technical
      ? 'error'
      : !usable.length
        ? 'unavailable'
        : statuses.has('demo')
          ? 'demo'
          : usable.length < components.length || statuses.has('partial')
            ? 'partial'
            : 'real';
  const coverage = components.reduce((sum, c) => sum + (c.score === null ? 0 : c.weight), 0);
  const confidence = Math.round(components.reduce((sum, c) => sum + c.weight * c.confidence, 0));
  return {
    symbol: input.symbol.trim().toUpperCase(),
    score,
    classification: score === null ? 'Unavailable' : classifyCompositeScore(score),
    components,
    bullishFactors: factors.filter((f) => f.direction === 'bullish'),
    bearishFactors: factors.filter((f) => f.direction === 'bearish'),
    neutralFactors: factors.filter((f) => f.direction === 'neutral'),
    conflicts: conflictsOf(components),
    riskFlags: components.find((c) => c.name === 'risk')?.negativeFactors ?? [],
    missingData: components.flatMap((c) => c.missingInputs),
    dataStatus,
    confidence,
    incomplete: coverage < 0.999999 || dataStatus !== 'real',
    methodology:
      'Available components are normalized to 0–100, reweighted across available evidence, and combined deterministically. Missing values are never treated as zero. This model assessment is analytical, not a guarantee or trade recommendation.',
  };
}

export function createQuantitativeIntelligenceService(
  provider: QuantitativeSignalProvider,
): QuantitativeIntelligenceService {
  return {
    assess: assessQuantitativeSignals,
    async analyze(symbol, weights) {
      return assessQuantitativeSignals(await provider.getInputs(symbol), weights);
    },
  };
}
