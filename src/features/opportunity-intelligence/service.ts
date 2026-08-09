import type {
  QuantitativeComponentName,
  QuantitativeScoreComponent,
} from '@/features/quantitative-intelligence';

import type {
  OpportunityCandidate,
  OpportunityClassification,
  OpportunityConfidence,
  OpportunityConflict,
  OpportunityRankingOptions,
  OpportunityRankingService,
  OpportunityTimeframe,
  RankedOpportunity,
  SignalAgreement,
  WatchlistOpportunityInput,
} from './types';
import { opportunityStatus } from './types';

const componentNames: QuantitativeComponentName[] = [
  'fundamental',
  'technical',
  'momentum',
  'trend',
  'volume',
  'risk',
  'valuation',
  'quality',
];
const component = (candidate: OpportunityCandidate, name: QuantitativeComponentName) =>
  candidate.assessment.components.find((item) => item.name === name);
const score = (candidate: OpportunityCandidate, name: QuantitativeComponentName) =>
  component(candidate, name)?.score ?? null;
const unique = (values: string[]) => [...new Set(values)];

export function assessSignalAgreement(candidate: OpportunityCandidate): SignalAgreement {
  const f = score(candidate, 'fundamental');
  const t = score(candidate, 'technical');
  const m = score(candidate, 'momentum');
  const r = score(candidate, 'risk');
  const conflicts: OpportunityConflict[] = candidate.assessment.conflicts.map((item) => ({
    ...item,
    impact: item.severity === 'warning' ? 'reduces-confidence' : 'informational',
  }));
  let kind: SignalAgreement['kind'] = 'mixed';
  let label = 'Mixed Signals';
  let agreedComponents: QuantitativeComponentName[] = [];
  if (f === null || t === null) {
    kind = 'incomplete';
    label = 'Incomplete Assessment';
  } else if (f >= 70 && t >= 70) {
    kind = 'confirmed-strength';
    label = 'Confirmed Strength';
    agreedComponents = ['fundamental', 'technical'];
  } else if (f < 50 && t < 50) {
    kind = 'confirmed-weakness';
    label = 'Confirmed Weakness';
    agreedComponents = ['fundamental', 'technical'];
  } else if (f >= 70 && t < 50) {
    kind = 'fundamental-technical-conflict';
    label = 'Fundamental/Technical Conflict';
  } else if (f < 50 && m !== null && m >= 70) {
    kind = 'momentum-driven-risk';
    label = 'Momentum-Driven Risk';
  } else if (t >= 70 && r !== null && r < 50) {
    kind = 'high-risk-technical-setup';
    label = 'High-Risk Technical Setup';
  }
  const available = componentNames
    .map((name) => score(candidate, name))
    .filter((v): v is number => v !== null);
  const bullish = available.filter((v) => v >= 60).length;
  const bearish = available.filter((v) => v < 50).length;
  return {
    kind,
    label,
    agreedComponents,
    conflicts,
    score: available.length
      ? Math.round((Math.max(bullish, bearish) / available.length) * 100)
      : null,
  };
}

export function calculateOpportunityConfidence(
  candidate: OpportunityCandidate,
  agreement = assessSignalAgreement(candidate),
): OpportunityConfidence {
  const valid = candidate.assessment.components.filter((item) => item.score !== null);
  const total = candidate.assessment.components.length || componentNames.length;
  const completeness = Math.round((valid.length / total) * 100);
  if (
    !valid.length ||
    candidate.assessment.dataStatus === 'unavailable' ||
    candidate.assessment.dataStatus === 'error'
  ) {
    return {
      score: null,
      label: 'unavailable',
      completeness,
      validComponents: valid.length,
      totalComponents: total,
      reasons: ['No reliable scoring evidence is available.'],
    };
  }
  const reasons: string[] = [];
  const quality = valid.reduce((sum, item) => sum + item.confidence, 0) / valid.length;
  const freshness =
    candidate.sourceFreshness === 'current' ? 100 : candidate.sourceFreshness === 'stale' ? 50 : 70;
  const provider =
    candidate.assessment.dataStatus === 'real'
      ? 100
      : candidate.assessment.dataStatus === 'partial'
        ? 70
        : candidate.assessment.dataStatus === 'demo'
          ? 35
          : 0;
  const history =
    candidate.historyAvailable === true ? 100 : candidate.historyAvailable === false ? 40 : 70;
  const agreementValue = agreement.score ?? 50;
  const conflictPenalty = Math.min(
    30,
    agreement.conflicts.filter((item) => item.impact === 'reduces-confidence').length * 10,
  );
  const value = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completeness * 0.3 +
          quality * 0.2 +
          freshness * 0.1 +
          provider * 0.15 +
          history * 0.1 +
          agreementValue * 0.15 -
          conflictPenalty,
      ),
    ),
  );
  if (completeness < 100)
    reasons.push(`${total - valid.length} scoring components are unavailable.`);
  if (candidate.sourceFreshness !== 'current')
    reasons.push('Source freshness is stale or unknown.');
  if (candidate.assessment.dataStatus !== 'real')
    reasons.push(`Provider data status is ${candidate.assessment.dataStatus}.`);
  if (agreement.conflicts.length)
    reasons.push(`${agreement.conflicts.length} signal conflict(s) reduce confidence.`);
  return {
    score: value,
    label: value >= 80 ? 'high' : value >= 55 ? 'moderate' : 'low',
    completeness,
    validComponents: valid.length,
    totalComponents: total,
    reasons,
  };
}

export function classifyOpportunity(
  composite: number | null,
  risk: number | null,
  supported: boolean,
): OpportunityClassification {
  if (composite === null || !supported) return 'Incomplete Assessment';
  if ((risk !== null && risk < 35) || composite < 30) return 'High-Risk / Avoid';
  if (composite >= 85) return 'Strong Bullish Opportunity';
  if (composite >= 75) return 'Bullish Opportunity';
  if (composite >= 65) return 'Constructive Setup';
  if (composite >= 50) return 'Neutral / Watch';
  if (composite >= 40) return 'Weak Setup';
  return 'Bearish Opportunity';
}

function factorLabels(items: QuantitativeScoreComponent[], strongest: boolean) {
  return items
    .filter((item) => item.score !== null)
    .sort((a, b) => (strongest ? b.score! - a.score! : a.score! - b.score!))
    .slice(0, 3)
    .map((item) => `${item.name}: ${item.score}/100`);
}

function build(
  candidate: OpportunityCandidate,
  timeframe: OpportunityTimeframe,
): RankedOpportunity {
  const a = candidate.assessment;
  const supported = candidate.supportedTimeframes.includes(timeframe);
  const agreement = assessSignalAgreement(candidate);
  const confidence = calculateOpportunityConfidence(candidate, agreement);
  const missing = unique([
    ...a.missingData,
    ...(!supported ? [`${timeframe} timeframe is not supported by the available history.`] : []),
  ]);
  const warnings = unique([
    ...agreement.conflicts.map((item) => item.explanation),
    ...(a.dataStatus === 'demo'
      ? ['Demo data is illustrative and is not a substitute for real provider data.']
      : []),
  ]);
  const classification = classifyOpportunity(a.score, score(candidate, 'risk'), supported);
  return {
    rank: 0,
    symbol: a.symbol,
    companyName: candidate.companyName ?? null,
    compositeScore: a.score,
    classification,
    confidence,
    timeframe,
    timeframeSupported: supported,
    fundamentalScore: score(candidate, 'fundamental'),
    technicalScore: score(candidate, 'technical'),
    momentumScore: score(candidate, 'momentum'),
    trendScore: score(candidate, 'trend'),
    volumeScore: score(candidate, 'volume'),
    riskScore: score(candidate, 'risk'),
    valuationScore: score(candidate, 'valuation'),
    qualityScore: score(candidate, 'quality'),
    signalAgreement: agreement,
    conflicts: agreement.conflicts,
    strengths: factorLabels(a.components, true),
    weaknesses: factorLabels(a.components, false),
    positiveSignals: unique(a.bullishFactors.map((item) => item.explanation)),
    negativeSignals: unique(a.bearishFactors.map((item) => item.explanation)),
    warnings,
    missingInformation: missing,
    catalystAvailable: candidate.catalystAvailable ?? null,
    dataStatus: opportunityStatus(a.dataStatus),
    provenance: unique(a.components.flatMap((item) => item.provenance)),
    explanation: `${a.symbol} has an overall score of ${a.score ?? 'unavailable'} and is classified as ${classification} for the ${timeframe} timeframe. Confidence is ${confidence.score ?? 'unavailable'}; signal agreement is ${agreement.label}. This is analytical intelligence, not a trade instruction or guarantee.`,
  };
}

export function rankOpportunities(
  candidates: OpportunityCandidate[],
  options: OpportunityRankingOptions,
): RankedOpportunity[] {
  return candidates
    .map((candidate) => build(candidate, options.timeframe))
    .sort((a, b) => {
      if (a.timeframeSupported !== b.timeframeSupported) return a.timeframeSupported ? -1 : 1;
      if (a.compositeScore !== b.compositeScore)
        return (b.compositeScore ?? -1) - (a.compositeScore ?? -1);
      if (a.confidence.score !== b.confidence.score)
        return (b.confidence.score ?? -1) - (a.confidence.score ?? -1);
      return a.symbol.localeCompare(b.symbol);
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export const createOpportunityRankingService = (): OpportunityRankingService => ({
  rank: rankOpportunities,
});

export function rankWatchlistOpportunities(
  items: WatchlistOpportunityInput[],
  timeframe: OpportunityTimeframe,
) {
  return rankOpportunities(
    items.map((item) => ({
      assessment: item.assessment,
      companyName: item.displayName,
      requestedTimeframe: timeframe,
      supportedTimeframes: item.supportedTimeframes,
    })),
    { timeframe },
  );
}
