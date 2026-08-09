import type { RankedOpportunity } from '@/features/opportunity-intelligence';

import type {
  ConcentrationLevel,
  DiversificationLevel,
  PortfolioAssessment,
  PortfolioAssessmentInput,
  PortfolioConflict,
  PortfolioExposure,
  PortfolioHolding,
  PortfolioOpportunity,
  PortfolioValue,
} from './types';

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const unavailable = (): PortfolioValue => ({
  value: null,
  availability: 'UNAVAILABLE',
  sourceInputs: [],
});
const derived = (value: number, ...sourceInputs: string[]): PortfolioValue => ({
  value,
  availability: 'DERIVED',
  sourceInputs,
});
const supplied = (value: number, source: string): PortfolioValue => ({
  value,
  availability: 'SUPPLIED',
  sourceInputs: [source],
});
const round = (n: number) => Math.round(n * 10000) / 10000;

function validate(input: PortfolioAssessmentInput) {
  if (!input?.snapshot || !Array.isArray(input.snapshot.holdings))
    throw new TypeError('A portfolio snapshot with holdings is required.');
  for (const h of input.snapshot.holdings) {
    if (!h.symbol.trim()) throw new Error('Holding symbol is required.');
    for (const [key, value] of Object.entries({
      quantity: h.quantity,
      entryPrice: h.entryPrice,
      referencePrice: h.referencePrice,
      notionalValue: h.notionalValue,
      weight: h.weight,
    })) {
      if (
        value != null &&
        (!finite(value) ||
          value < 0 ||
          ((key === 'quantity' || key.includes('Price')) && value === 0))
      )
        throw new RangeError(`${h.symbol} ${key} is invalid.`);
    }
    if (finite(h.weight) && h.weight > 1)
      throw new RangeError(`${h.symbol} weight must be from 0 to 1.`);
  }
  if (
    input.snapshot.riskBudget != null &&
    (!finite(input.snapshot.riskBudget) || input.snapshot.riskBudget <= 0)
  )
    throw new RangeError('Risk budget must be greater than zero.');
  for (const [key, target] of Object.entries(input.snapshot.targetAllocations ?? {}))
    if (!finite(target) || target < 0 || target > 1)
      throw new RangeError(`${key} target allocation must be from 0 to 1.`);
  for (const c of input.snapshot.correlation ?? [])
    if (!finite(c.coefficient) || c.coefficient < -1 || c.coefficient > 1)
      throw new RangeError('Correlation coefficient must be from -1 to 1.');
}

function notionals(holdings: PortfolioHolding[]) {
  return holdings.map((h) =>
    h.notionalValue != null
      ? supplied(h.notionalValue, `${h.symbol}.notionalValue`)
      : finite(h.quantity) && finite(h.referencePrice)
        ? derived(
            round(h.quantity * h.referencePrice),
            `${h.symbol}.quantity`,
            `${h.symbol}.referencePrice`,
          )
        : unavailable(),
  );
}
function exposureOf(holdings: PortfolioHolding[]): PortfolioExposure {
  const values = notionals(holdings);
  const complete = values.every((v) => v.value !== null);
  const total = complete ? round(values.reduce((s, v) => s + v.value!, 0)) : null;
  const side = (direction: 'LONG' | 'SHORT') =>
    complete
      ? derived(
          round(
            holdings.reduce(
              (s, h, i) => s + (h.direction === direction ? values[i]!.value! : 0),
              0,
            ),
          ),
          'holdings.notional',
        )
      : unavailable();
  const long = side('LONG'),
    short = side('SHORT');
  const group = (get: (h: PortfolioHolding) => string | null | undefined) => {
    const out: Record<string, PortfolioValue> = {};
    if (total === null || total === 0) return out;
    holdings.forEach((h, i) => {
      const key = get(h);
      if (key && values[i]!.value !== null)
        out[key] = derived(
          round((out[key]?.value ?? 0) + values[i]!.value! / total),
          'holdings.notional',
        );
    });
    return out;
  };
  const positions: Record<string, PortfolioValue> = {};
  holdings.forEach((h, i) => {
    positions[h.symbol] = finite(h.weight)
      ? supplied(h.weight, `${h.symbol}.weight`)
      : total && values[i]!.value !== null
        ? derived(round(values[i]!.value! / total), `${h.symbol}.notional`, 'portfolio.total')
        : unavailable();
  });
  const risk: Record<string, PortfolioValue> = {};
  holdings.forEach((h) => {
    const w = positions[h.symbol]!.value,
      score = h.riskAssessment?.score;
    risk[h.symbol] =
      w !== null && finite(score)
        ? derived(round(w * score), `${h.symbol}.weight`, `${h.symbol}.riskAssessment.score`)
        : unavailable();
  });
  return {
    total: total === null ? unavailable() : derived(total, 'holdings.notional'),
    long,
    short,
    gross: total === null ? unavailable() : derived(total, 'long', 'short'),
    net:
      long.value === null || short.value === null
        ? unavailable()
        : derived(round(long.value - short.value), 'long', 'short'),
    positionWeights: positions,
    sectorWeights: group((h) => h.sector),
    assetWeights: group((h) => h.assetClass),
    opportunityWeights: group((h) => h.opportunity?.classification),
    riskWeights: risk,
    catalystWeights: group((h) => h.catalystThemes?.[0]),
    timeframeWeights: group((h) => h.timeframe),
  };
}
const level = (weight: number | null): ConcentrationLevel =>
  weight === null
    ? 'INSUFFICIENT_DATA'
    : weight >= 0.5
      ? 'VERY_HIGH'
      : weight >= 0.3
        ? 'HIGH'
        : weight >= 0.2
          ? 'MODERATE'
          : 'LOW';
const largest = (values: Record<string, PortfolioValue>) => {
  const nums = Object.values(values)
    .map((v) => v.value)
    .filter(finite);
  return nums.length ? Math.max(...nums) : null;
};
const diversify = (count: number, max: number | null): DiversificationLevel =>
  !count || max === null
    ? 'INSUFFICIENT_DATA'
    : max >= 0.65 || count === 1
      ? 'HIGHLY_CONCENTRATED'
      : max >= 0.4 || count === 2
        ? 'CONCENTRATED'
        : max >= 0.25
          ? 'MODERATELY_DIVERSIFIED'
          : 'WELL_DIVERSIFIED';

export function assessPortfolioOpportunity(
  opportunity: RankedOpportunity,
  portfolio: Pick<PortfolioAssessment, 'snapshot' | 'exposure' | 'concentration' | 'riskBudget'>,
): PortfolioOpportunity {
  const holding = portfolio.snapshot.holdings.find((h) => h.symbol === opportunity.symbol);
  const existing = portfolio.exposure.positionWeights[opportunity.symbol]?.value ?? 0;
  const sector = holding?.sector;
  const sectorWeight = sector ? (portfolio.exposure.sectorWeights[sector]?.value ?? null) : null;
  const themes = opportunity.context?.eventTimeline.map((event) => event.category) ?? [];
  const catalystOverlap = themes.length
    ? portfolio.snapshot.holdings.some(
        (h) =>
          h.symbol !== opportunity.symbol &&
          h.catalystThemes?.some((t) => themes.includes(t as never)),
      )
    : null;
  const timeframeOverlap =
    portfolio.snapshot.holdings.some((h) => h.timeframe === opportunity.timeframe) || null;
  const riskScore = holding?.riskAssessment?.score ?? opportunity.riskScore;
  const impact = finite(riskScore) ? round(existing * riskScore) : null;
  const concentrationImpact = level(Math.max(existing, sectorWeight ?? 0));
  let fit: PortfolioOpportunity['fit'] = 'NEUTRAL';
  if (opportunity.compositeScore === null || opportunity.confidence.score === null)
    fit = 'INSUFFICIENT_DATA';
  else if (concentrationImpact === 'VERY_HIGH' || (finite(riskScore) && riskScore >= 80))
    fit = 'CONFLICT';
  else if (concentrationImpact === 'HIGH' || (finite(riskScore) && riskScore >= 65))
    fit = 'WEAK_FIT';
  else if (opportunity.compositeScore >= 75 && existing < 0.2) fit = 'STRONG_FIT';
  else if (opportunity.compositeScore >= 55) fit = 'ACCEPTABLE_FIT';
  return {
    symbol: opportunity.symbol,
    rank: opportunity.rank,
    opportunityScore: opportunity.compositeScore,
    riskScore: riskScore ?? null,
    catalystContext: opportunity.context?.catalystSummary ?? null,
    existingExposure: existing,
    concentrationImpact,
    diversificationImpact:
      sectorWeight === null
        ? 'UNAVAILABLE'
        : sectorWeight >= 0.3
          ? 'REDUCES'
          : sectorWeight === 0
            ? 'IMPROVES'
            : 'NEUTRAL',
    catalystOverlap,
    timeframeOverlap,
    riskImpact: impact,
    fit,
    explanation: [
      `Upstream rank #${opportunity.rank} and score ${opportunity.compositeScore ?? 'unavailable'} were preserved.`,
      `Fit reflects portfolio context only: concentration ${concentrationImpact}.`,
    ],
  };
}

export function assessPortfolio(input: PortfolioAssessmentInput): PortfolioAssessment {
  validate(input);
  const { snapshot } = input;
  const exposure = exposureOf(snapshot.holdings);
  const missing: string[] = [];
  if (!snapshot.holdings.length) missing.push('portfolio holdings');
  snapshot.holdings.forEach((h) => {
    if (exposure.positionWeights[h.symbol]?.value === null)
      missing.push(`${h.symbol} notional or quantity/reference price`);
  });
  const maxima = {
    position: largest(exposure.positionWeights),
    sector: largest(exposure.sectorWeights),
    asset: largest(exposure.assetWeights),
    risk: largest(exposure.riskWeights),
    catalyst: largest(exposure.catalystWeights),
    timeframe: largest(exposure.timeframeWeights),
  };
  const dimensions = Object.fromEntries(Object.entries(maxima).map(([k, v]) => [k, level(v)]));
  const order: ConcentrationLevel[] = ['INSUFFICIENT_DATA', 'LOW', 'MODERATE', 'HIGH', 'VERY_HIGH'];
  const overall = Object.values(dimensions).reduce(
    (a, b) => (order.indexOf(b) > order.indexOf(a) ? b : a),
    'INSUFFICIENT_DATA' as ConcentrationLevel,
  );
  const dDimensions: Record<string, DiversificationLevel> = {
    holdings: diversify(snapshot.holdings.length, maxima.position),
    sectors: diversify(Object.keys(exposure.sectorWeights).length, maxima.sector),
    assets: diversify(Object.keys(exposure.assetWeights).length, maxima.asset),
    direction: diversify(
      [exposure.long.value ? 1 : 0, exposure.short.value ? 1 : 0].filter(Boolean).length,
      exposure.gross.value
        ? Math.max(exposure.long.value ?? 0, exposure.short.value ?? 0) / exposure.gross.value
        : null,
    ),
    risk: diversify(Object.keys(exposure.riskWeights).length, maxima.risk),
    catalysts: diversify(Object.keys(exposure.catalystWeights).length, maxima.catalyst),
    timeframes: diversify(Object.keys(exposure.timeframeWeights).length, maxima.timeframe),
  };
  const dOrder: DiversificationLevel[] = [
    'INSUFFICIENT_DATA',
    'WELL_DIVERSIFIED',
    'MODERATELY_DIVERSIFIED',
    'CONCENTRATED',
    'HIGHLY_CONCENTRATED',
  ];
  const diversificationClassification = Object.values(dDimensions)
    .filter((v) => v !== 'INSUFFICIENT_DATA')
    .reduce(
      (a, b) => (dOrder.indexOf(b) > dOrder.indexOf(a) ? b : a),
      'INSUFFICIENT_DATA' as DiversificationLevel,
    );
  const contribution = Object.fromEntries(
    snapshot.holdings.map((h) => [h.symbol, exposure.riskWeights[h.symbol]?.value ?? null]),
  );
  const validContrib = Object.values(contribution).filter(finite);
  const aggregateRisk =
    validContrib.length === snapshot.holdings.length && validContrib.length
      ? round(validContrib.reduce((a, b) => a + b, 0))
      : null;
  const budget = snapshot.riskBudget ?? null;
  const utilization =
    budget !== null && aggregateRisk !== null ? round(aggregateRisk / budget) : null;
  const sectorContributions: Record<string, number | null> = {};
  snapshot.holdings.forEach((h) => {
    if (h.sector) {
      const v = contribution[h.symbol] ?? null;
      sectorContributions[h.sector] =
        v === null ? null : round((sectorContributions[h.sector] ?? 0) + v);
    }
  });
  const targets = snapshot.targetAllocations ?? null;
  const gaps: Record<string, PortfolioValue> = {};
  if (targets)
    Object.entries(targets).forEach(([s, t]) => {
      const current = exposure.positionWeights[s]?.value;
      gaps[s] =
        current === null || current === undefined
          ? unavailable()
          : derived(round(t - current), `${s}.target`, `${s}.weight`);
    });
  const conflicts: PortfolioConflict[] = [];
  const add = (
    code: string,
    severity: PortfolioConflict['severity'],
    affectedComponents: string[],
    explanation: string,
    evidence: string[],
  ) =>
    conflicts.push({
      code,
      severity,
      affectedComponents,
      explanation,
      evidence,
      resolution: 'OPEN',
    });
  if (overall === 'HIGH' || overall === 'VERY_HIGH')
    add(
      'EXCESSIVE_CONCENTRATION',
      'CRITICAL',
      Object.keys(dimensions).filter(
        (k) => dimensions[k] === 'HIGH' || dimensions[k] === 'VERY_HIGH',
      ),
      'One or more observed portfolio dimensions exceed transparent concentration bands.',
      Object.entries(maxima).map(([k, v]) => `${k}: ${v ?? 'unavailable'}`),
    );
  if (dimensions.sector === 'HIGH' || dimensions.sector === 'VERY_HIGH')
    add(
      'EXCESSIVE_SECTOR_EXPOSURE',
      'CRITICAL',
      Object.keys(exposure.sectorWeights),
      'Supplied sector classifications reveal excessive sector concentration.',
      Object.entries(exposure.sectorWeights).map(([key, value]) => `${key}: ${value.value}`),
    );
  if (dimensions.catalyst === 'HIGH' || dimensions.catalyst === 'VERY_HIGH')
    add(
      'CATALYST_CONCENTRATION',
      'WARNING',
      Object.keys(exposure.catalystWeights),
      'Holdings overlap on a supplied catalyst/theme.',
      Object.entries(exposure.catalystWeights).map(([key, value]) => `${key}: ${value.value}`),
    );
  if (dimensions.timeframe === 'HIGH' || dimensions.timeframe === 'VERY_HIGH')
    add(
      'TIMEFRAME_CONCENTRATION',
      'WARNING',
      Object.keys(exposure.timeframeWeights),
      'Holdings are concentrated in a supplied timeframe.',
      Object.entries(exposure.timeframeWeights).map(([key, value]) => `${key}: ${value.value}`),
    );
  if (budget === null)
    add(
      'MISSING_RISK_BUDGET',
      'WARNING',
      ['riskBudget'],
      'Risk utilization cannot be calculated without an explicitly supplied budget.',
      [],
    );
  if (missing.length)
    add(
      'INCOMPLETE_POSITION_INFORMATION',
      'WARNING',
      snapshot.holdings.map((h) => h.symbol),
      'Some positions cannot be fully valued.',
      missing,
    );
  if (!snapshot.correlation?.length)
    add(
      'CORRELATION_UNAVAILABLE',
      'INFO',
      ['correlation'],
      'Correlated exposure cannot be assessed because no coefficients were supplied.',
      [],
    );
  const opposing = snapshot.holdings.filter((holding, index) =>
    snapshot.holdings.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.symbol === holding.symbol &&
        other.direction !== holding.direction,
    ),
  );
  if (opposing.length)
    add(
      'OPPOSING_OVERLAPPING_POSITIONS',
      'CRITICAL',
      [...new Set(opposing.map((holding) => holding.symbol))],
      'The same symbol has contradictory long and short position inputs.',
      opposing.map((holding) => `${holding.symbol}: ${holding.direction}`),
    );
  const unknownLiquidity = snapshot.holdings
    .filter((holding) => holding.liquidityAvailable !== true)
    .map((holding) => holding.symbol);
  if (unknownLiquidity.length)
    add(
      'INSUFFICIENT_LIQUIDITY_INFORMATION',
      'INFO',
      unknownLiquidity,
      'Liquidity information was not explicitly supplied for all positions.',
      [],
    );
  if (exposure.gross.value && Math.abs(exposure.net.value ?? 0) / exposure.gross.value >= 0.8)
    add(
      'LONG_SHORT_IMBALANCE',
      'WARNING',
      ['direction'],
      'Net exposure is at least 80% of gross exposure.',
      [`net ${exposure.net.value}`, `gross ${exposure.gross.value}`],
    );
  const riskBudget = {
    status:
      budget === null
        ? ('RISK_BUDGET_UNAVAILABLE' as const)
        : aggregateRisk === null
          ? ('INSUFFICIENT_DATA' as const)
          : ('AVAILABLE' as const),
    budget,
    aggregateRisk,
    utilization,
    remainingCapacity:
      budget !== null && aggregateRisk !== null ? round(budget - aggregateRisk) : null,
    positionContributions: contribution,
    sectorContributions,
    concentrationRisk: maxima.risk,
  };
  const base = {
    snapshot,
    exposure,
    concentration: {
      overall,
      dimensions,
      largestWeights: maxima,
      explanation: [
        'Bands: low <20%, moderate 20–<30%, high 30–<50%, very high ≥50%; descriptive, not predictive.',
      ],
    },
    riskBudget,
  };
  const opportunities = (input.opportunities ?? []).map((o) => assessPortfolioOpportunity(o, base));
  const critical = conflicts.some((c) => c.severity === 'CRITICAL');
  const readiness =
    !snapshot.holdings.length || missing.length
      ? 'INSUFFICIENT_DATA'
      : critical
        ? 'CONFLICTED'
        : overall === 'HIGH' || overall === 'VERY_HIGH'
          ? 'CONCENTRATED'
          : snapshot.dataQuality === 'STALE'
            ? 'WATCH'
            : snapshot.dataQuality === 'ERROR' || snapshot.dataQuality === 'UNAVAILABLE'
              ? 'NOT_READY'
              : budget === null
                ? 'CONDITIONAL'
                : 'READY_FOR_PORTFOLIO_REVIEW';
  const provenance = [
    ...new Map(
      [
        ...snapshot.provenance,
        ...snapshot.holdings.flatMap((h) => h.provenance),
        ...(snapshot.correlation ?? []).flatMap((c) => c.provenance),
      ].map((p) => [`${p.provider}|${p.source}|${p.observedAt ?? ''}`, p]),
    ).values(),
  ];
  return {
    ...base,
    allocation: {
      current: exposure.positionWeights,
      targets,
      gaps,
      comparisonStatus: targets ? 'AVAILABLE' : 'UNAVAILABLE',
    },
    diversification: {
      classification: diversificationClassification,
      dimensions: dDimensions,
      correlationStatus: snapshot.correlation?.length ? 'AVAILABLE' : 'UNAVAILABLE',
      explanation: [
        'Only supplied dimensions are assessed; correlation coefficients are never inferred.',
      ],
    },
    opportunities,
    conflicts,
    readiness: {
      state: readiness,
      reasons: [
        `Concentration is ${overall}.`,
        `Data quality is ${snapshot.dataQuality}.`,
        `${conflicts.length} conflicts detected.`,
      ],
    },
    dataQuality: snapshot.dataQuality,
    provenance,
    missingInputs: [...new Set(missing)],
    explanation:
      'Deterministic analytical assessment derived only from supplied holdings and preserved upstream intelligence; it is not a trade instruction.',
  };
}
