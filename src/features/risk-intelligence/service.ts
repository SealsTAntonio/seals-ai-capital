import type {
  OpportunityRiskRelationship,
  PositionSizingInput,
  PositionSizingResult,
  RiskAssessment,
  RiskAssessmentInput,
  RiskCategory,
  RiskClassification,
  RiskComponent,
  RiskConflict,
  RiskDataQuality,
  RiskFactor,
  RiskLevel,
  TradeReadinessAssessment,
} from './types';

const DEFAULT_REQUIRED: RiskCategory[] = [
  'market',
  'volatility',
  'liquidity',
  'technical',
  'catalyst',
];
const unavailable = new Set<RiskDataQuality>(['UNAVAILABLE', 'ERROR', 'MISSING']);
const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function assertRange(name: string, value: number | null, min = 0, max = 100) {
  if (value !== null && (!Number.isFinite(value) || value < min || value > max))
    throw new RangeError(`${name} must be a finite number from ${min} to ${max}.`);
}

export function classifyRisk(value: number): {
  level: RiskLevel;
  classification: RiskClassification;
} {
  assertRange('risk value', value);
  if (value < 20) return { level: 'VERY_LOW', classification: 'Very Low Risk' };
  if (value < 40) return { level: 'LOW', classification: 'Low Risk' };
  if (value < 60) return { level: 'MODERATE', classification: 'Moderate Risk' };
  if (value < 80) return { level: 'HIGH', classification: 'High Risk' };
  return { level: 'VERY_HIGH', classification: 'Very High Risk' };
}

function validateFactor(factor: RiskFactor) {
  assertRange(`${factor.code} value`, factor.value);
  assertRange(`${factor.code} confidence`, factor.confidence);
  if (!Number.isFinite(factor.weight) || factor.weight <= 0)
    throw new RangeError(`${factor.code} weight must be a finite number greater than zero.`);
  if (factor.value !== null && unavailable.has(factor.dataQuality))
    throw new Error(
      `${factor.code} cannot have a value when data quality is ${factor.dataQuality}.`,
    );
}

const componentOf = (factor: RiskFactor): RiskComponent => ({
  ...factor,
  classification: factor.value === null ? null : classifyRisk(factor.value).classification,
});

export function assessOpportunityRisk(
  opportunity: RiskAssessmentInput['opportunity'],
  score: number,
): OpportunityRiskRelationship {
  assertRange('opportunity score', opportunity.compositeScore);
  assertRange('risk score', score);
  const opportunityBand =
    opportunity.compositeScore! >= 70
      ? 'Strong'
      : opportunity.compositeScore! >= 45
        ? 'Neutral'
        : 'Weak';
  const riskBand = score < 40 ? 'Low' : score < 60 ? 'Moderate' : 'High';
  return `${opportunityBand} Opportunity / ${riskBand} Risk`;
}

function detectConflicts(input: RiskAssessmentInput, components: RiskComponent[]): RiskConflict[] {
  const value = (category: RiskCategory) =>
    components.find((c) => c.category === category)?.value ?? null;
  const high = (category: RiskCategory) => (value(category) ?? -1) >= 70;
  const lowRisk = (category: RiskCategory) => (value(category) ?? 101) <= 30;
  const strong = (input.opportunity.compositeScore ?? -1) >= 70;
  const conflicts: RiskConflict[] = [];
  const add = (
    code: string,
    severity: RiskConflict['severity'],
    involvedComponents: RiskCategory[],
    explanation: string,
  ) =>
    conflicts.push({ code, severity, involvedComponents, explanation, resolution: 'UNRESOLVED' });
  if (strong && components.some((c) => (c.value ?? -1) >= 80))
    add(
      'STRONG_OPPORTUNITY_EXCESSIVE_RISK',
      'CRITICAL',
      ['thesis-conflict'],
      'A strong upstream opportunity coexists with at least one very-high-risk component.',
    );
  if (
    (input.opportunity.technicalScore ?? -1) >= 70 &&
    (input.opportunity.fundamentalScore ?? 101) < 50
  )
    add(
      'TECHNICAL_FUNDAMENTAL_DIVERGENCE',
      'WARNING',
      ['technical', 'fundamental'],
      'Strong technical evidence conflicts with weak fundamental evidence.',
    );
  if (
    input.opportunity.context?.catalystDirection === 'potentially-supportive' &&
    high('volatility')
  )
    add(
      'POSITIVE_CATALYST_EXTREME_VOLATILITY',
      'CRITICAL',
      ['catalyst', 'volatility'],
      'A supportive catalyst coincides with extreme volatility risk.',
    );
  if ((input.opportunity.momentumScore ?? -1) >= 70 && high('trend'))
    add(
      'MOMENTUM_DETERIORATING_TREND',
      'WARNING',
      ['momentum', 'trend'],
      'Strong momentum coexists with deteriorating trend risk.',
    );
  if (strong && high('liquidity'))
    add(
      'ATTRACTIVE_OPPORTUNITY_POOR_LIQUIDITY',
      'CRITICAL',
      ['liquidity'],
      'The opportunity is attractive but liquidity risk is high.',
    );
  if (
    input.opportunity.context?.marketContext?.broadTrend === 'bullish' &&
    input.opportunity.context?.sectorContext?.trend === 'bearish'
  )
    add(
      'MARKET_SECTOR_DIVERGENCE',
      'WARNING',
      ['market'],
      'Positive market context conflicts with negative sector context.',
    );
  if (strong && components.filter((c) => c.value !== null).length < 3)
    add(
      'STRONG_THESIS_INSUFFICIENT_DATA',
      'CRITICAL',
      ['data-quality', 'thesis-conflict'],
      'The strong thesis has insufficient risk evidence.',
    );
  if (strong && high('concentration'))
    add(
      'STRONG_OPPORTUNITY_CONCENTRATION',
      'WARNING',
      ['concentration'],
      'The opportunity increases concentration risk.',
    );
  if ((input.opportunity.context?.upcomingCatalystCount ?? 0) > 0 && high('catalyst'))
    add(
      'CATALYST_UNCERTAINTY',
      'WARNING',
      ['catalyst', 'event'],
      'The catalyst-driven opportunity has high catalyst uncertainty.',
    );
  if (!input.opportunity.timeframeSupported)
    add(
      'CONFLICTING_TIMEFRAMES',
      'CRITICAL',
      ['technical', 'trend'],
      'The requested timeframe is not supported by upstream evidence.',
    );
  if (lowRisk('market') && high('concentration'))
    add(
      'BENIGN_MARKET_CONCENTRATION_RISK',
      'INFO',
      ['market', 'concentration'],
      'Low market risk does not resolve concentrated portfolio exposure.',
    );
  return conflicts;
}

function qualityOf(components: RiskComponent[], complete: boolean): RiskDataQuality {
  if (!components.length) return 'MISSING';
  if (components.some((c) => c.dataQuality === 'ERROR')) return 'ERROR';
  if (components.some((c) => c.dataQuality === 'STALE')) return 'STALE';
  if (
    !complete ||
    components.some((c) => c.dataQuality === 'PARTIAL' || unavailable.has(c.dataQuality))
  )
    return 'PARTIAL';
  if (components.some((c) => c.dataQuality === 'DEMO')) return 'DEMO';
  return 'REAL';
}

function tradeReadiness(
  input: RiskAssessmentInput,
  score: number | null,
  relationship: OpportunityRiskRelationship | null,
  complete: boolean,
  conflicts: RiskConflict[],
  missing: string[],
): TradeReadinessAssessment {
  const reasons: string[] = [];
  let state: TradeReadinessAssessment['state'];
  if (!complete || score === null || input.opportunity.compositeScore === null)
    state = 'INSUFFICIENT_DATA';
  else if (!input.opportunity.timeframeSupported) state = 'NOT_READY';
  else if (conflicts.some((c) => c.severity === 'CRITICAL')) state = 'CONFLICTED';
  else if (score >= 80) state = 'HIGH_RISK';
  else if ((input.opportunity.compositeScore ?? 0) < 45) state = 'NOT_READY';
  else if (score >= 60 || input.factors.some((factor) => factor.dataQuality === 'STALE'))
    state = 'WATCH';
  else if (
    input.opportunity.context?.catalystDirection === 'insufficient-evidence' ||
    input.opportunity.dataStatus !== 'REAL'
  )
    state = 'CONDITIONAL';
  else state = 'READY_FOR_RESEARCH';
  reasons.push(`Opportunity/risk relationship: ${relationship ?? 'unavailable'}.`);
  reasons.push(`Readiness is ${state}; it is analytical research status, not permission to trade.`);
  return {
    state,
    relationship,
    reasons,
    missingInputs: missing,
    timeframeCompatible: input.opportunity.timeframeSupported,
  };
}

export function assessRisk(input: RiskAssessmentInput): RiskAssessment {
  if (!input || !input.opportunity || !Array.isArray(input.factors))
    throw new TypeError('A ranked opportunity and factors are required.');
  input.factors.forEach(validateFactor);
  const components = input.factors.map(componentOf);
  const required = input.requiredCategories ?? DEFAULT_REQUIRED;
  const missing = [
    ...new Set([
      ...required
        .filter((category) => !components.some((c) => c.category === category && c.value !== null))
        .map((c) => `${c} risk`),
      ...components.flatMap((c) => c.missingInputs),
      ...input.opportunity.missingInformation,
    ]),
  ];
  const valid = components.filter(
    (c): c is RiskComponent & { value: number; confidence: number } =>
      c.value !== null && c.confidence !== null && !unavailable.has(c.dataQuality),
  );
  const complete = required.every((category) => valid.some((c) => c.category === category));
  const weight = valid.reduce((sum, c) => sum + c.weight, 0);
  const score =
    complete && weight
      ? Math.round(valid.reduce((sum, c) => sum + c.value * c.weight, 0) / weight)
      : null;
  const confidence =
    complete && weight
      ? Math.round(valid.reduce((sum, c) => sum + c.confidence * c.weight, 0) / weight)
      : null;
  const classification = score === null ? null : classifyRisk(score).classification;
  const relationship =
    score === null || input.opportunity.compositeScore === null
      ? null
      : assessOpportunityRisk(input.opportunity, score);
  const conflicts = detectConflicts(input, components);
  const readiness = tradeReadiness(input, score, relationship, complete, conflicts, missing);
  const provenance = [
    ...new Map(
      components
        .flatMap((c) => c.provenance)
        .map((p) => [`${p.provider}|${p.source}|${p.observedAt ?? ''}`, p]),
    ).values(),
  ];
  return {
    symbol: input.opportunity.symbol,
    timeframe: input.opportunity.timeframe,
    score,
    classification,
    confidence,
    dataQuality: qualityOf(components, complete),
    complete,
    components,
    conflicts,
    scenarios: input.scenarios ?? [],
    relationship,
    tradeReadiness: readiness,
    missingInputs: missing,
    provenance,
    explanation:
      score === null
        ? `Risk assessment is incomplete. Missing: ${missing.join(', ') || 'sufficient valid evidence'}.`
        : `Normalized risk is ${score}/100 (${classification}) from explicitly supplied weighted evidence. The upstream composite score remains ${input.opportunity.compositeScore}/100 and was not recalculated.`,
    opportunity: input.opportunity,
  };
}

function invalidPosition(message: string): PositionSizingResult {
  return {
    status: 'INVALID',
    dollarRiskPerShare: null,
    maximumAllowedDollarRisk: null,
    suggestedMaximumShares: null,
    positionNotionalValue: null,
    positionExposurePercentage: null,
    estimatedLossAtStop: null,
    limitingConstraints: [],
    warnings: [message],
    missingInputs: [],
  };
}

export function calculatePositionSize(input: PositionSizingInput): PositionSizingResult {
  const supplied = Object.entries(input).filter(([, v]) => v !== null && v !== undefined);
  if (supplied.some(([, v]) => typeof v !== 'number' || !Number.isFinite(v) || v < 0))
    return invalidPosition(
      'All supplied position-sizing inputs must be finite, non-negative numbers.',
    );
  if (finite(input.maximumRiskPercentage) && input.maximumRiskPercentage > 100)
    return invalidPosition('Maximum risk percentage cannot exceed 100.');
  if (finite(input.portfolioExposureLimit) && input.portfolioExposureLimit > 100)
    return invalidPosition('Portfolio exposure limit cannot exceed 100.');
  const missing: string[] = [];
  if (!finite(input.accountEquity)) missing.push('account equity');
  if (!finite(input.entryPrice)) missing.push('entry price');
  let riskPerShare = finite(input.riskPerShare)
    ? input.riskPerShare
    : finite(input.entryPrice) && finite(input.stopPrice)
      ? Math.abs(input.entryPrice - input.stopPrice)
      : null;
  if (riskPerShare === null) missing.push('stop price or risk per share');
  const equityRisk =
    finite(input.accountEquity) && finite(input.maximumRiskPercentage)
      ? (input.accountEquity * input.maximumRiskPercentage) / 100
      : null;
  const allowed =
    finite(input.maximumRiskDollarAmount) && equityRisk !== null
      ? Math.min(input.maximumRiskDollarAmount, equityRisk)
      : finite(input.maximumRiskDollarAmount)
        ? input.maximumRiskDollarAmount
        : equityRisk;
  if (allowed === null) missing.push('maximum risk percentage or maximum risk dollar amount');
  if (missing.length)
    return {
      ...invalidPosition('Required inputs are unavailable; no position size was calculated.'),
      status: 'INCOMPLETE',
      warnings: [],
      missingInputs: missing,
      dollarRiskPerShare: riskPerShare,
      maximumAllowedDollarRisk: allowed,
    };
  if (riskPerShare === 0)
    return invalidPosition('Risk per share is zero; a finite share limit cannot be calculated.');
  if (riskPerShare === null) return invalidPosition('Risk per share is unavailable.');
  const constraints: [string, number][] = [['risk budget', Math.floor(allowed! / riskPerShare)]];
  if (finite(input.maximumPositionValue))
    constraints.push([
      'maximum position value',
      Math.floor(input.maximumPositionValue / input.entryPrice!),
    ]);
  if (finite(input.portfolioExposureLimit))
    constraints.push([
      'portfolio exposure limit',
      Math.floor((input.accountEquity! * input.portfolioExposureLimit) / 100 / input.entryPrice!),
    ]);
  if (finite(input.concentrationLimit))
    constraints.push([
      'concentration limit',
      Math.floor((input.accountEquity! * input.concentrationLimit) / 100 / input.entryPrice!),
    ]);
  const shares = Math.min(...constraints.map(([, n]) => n));
  const notional = shares * input.entryPrice!;
  return {
    status: 'COMPLETE',
    dollarRiskPerShare: riskPerShare,
    maximumAllowedDollarRisk: allowed!,
    suggestedMaximumShares: shares,
    positionNotionalValue: notional,
    positionExposurePercentage:
      input.accountEquity! === 0 ? null : (notional / input.accountEquity!) * 100,
    estimatedLossAtStop: shares * riskPerShare,
    limitingConstraints: constraints.filter(([, n]) => n === shares).map(([name]) => name),
    warnings: [],
    missingInputs: [],
  };
}
