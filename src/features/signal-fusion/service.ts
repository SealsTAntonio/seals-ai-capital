import type {
  DecisionClassification,
  DecisionConfidence,
  DecisionContext,
  SignalAgreement,
  SignalAlignment,
  SignalAvailability,
  SignalComponent,
  SignalComponentName,
  SignalConflict,
  SignalDataQuality,
  SignalFusionAssessment,
  SignalFusionConfig,
  SignalProvenance,
  SignalReadiness,
  SignalWeight,
} from './types';
import { SignalFusionValidationError } from './types';

export const DEFAULT_SIGNAL_WEIGHTS: Readonly<Record<SignalComponentName, number>> = {
  COMPOSITE_SCORE: 0.15,
  OPPORTUNITY: 0.2,
  CATALYST: 0.1,
  RISK: 0.2,
  PORTFOLIO_FIT: 0.15,
  TECHNICAL_CONTEXT: 0.1,
  FUNDAMENTAL_CONTEXT: 0.1,
};
const DEFAULT_CRITICAL: SignalComponentName[] = ['OPPORTUNITY', 'RISK'];
const badStatuses = new Set<SignalAvailability>(['UNAVAILABLE', 'ERROR', 'MISSING']);

const validatePercent = (value: number | null, label: string) => {
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > 100))
    throw new SignalFusionValidationError(`${label} must be null or between 0 and 100.`);
};
const status = (value: string | undefined): SignalAvailability => {
  const normalized = value?.toUpperCase();
  if (normalized === 'REAL') return 'SUPPLIED';
  if (normalized === 'EMPTY') return 'MISSING';
  if (
    normalized === 'PARTIAL' ||
    normalized === 'DEMO' ||
    normalized === 'STALE' ||
    normalized === 'UNAVAILABLE' ||
    normalized === 'ERROR' ||
    normalized === 'MISSING'
  )
    return normalized;
  return 'SUPPLIED';
};
const directionFromScore = (
  score: number | null,
  inverse = false,
): SignalComponent['direction'] => {
  if (score === null) return 'UNAVAILABLE';
  const supportive = inverse ? score <= 59 : score >= 60;
  const opposing = inverse ? score >= 60 : score < 40;
  return supportive ? 'SUPPORTIVE' : opposing ? 'OPPOSING' : 'NEUTRAL';
};
const provenance = (
  component: SignalComponentName,
  entries: {
    provider?: string;
    source?: string;
    sourceName?: string;
    observedAt?: string | null;
    retrievedAt?: string | null;
  }[],
  availability: SignalAvailability,
): SignalProvenance[] =>
  entries.map((p) => ({
    component,
    provider: p.provider ?? 'upstream',
    source: p.source ?? p.sourceName ?? 'authoritative-assessment',
    observedAt: p.observedAt,
    retrievedAt: p.retrievedAt,
    status: availability,
  }));

function buildComponents(input: DecisionContext): SignalComponent[] {
  const o = input.opportunity;
  const tf = o.timeframe;
  const oq = status(o.dataStatus);
  const catalyst = o.context;
  const cq = catalyst ? status(catalyst.dataStatus) : 'UNAVAILABLE';
  const risk = input.risk ?? null;
  const rq = risk ? status(risk.dataQuality) : 'MISSING';
  const fit =
    input.portfolioFit ?? input.portfolio?.opportunities.find((x) => x.symbol === o.symbol) ?? null;
  const pq = input.portfolio ? status(input.portfolio.dataQuality) : 'MISSING';
  const scoreComponent = (
    name: SignalComponentName,
    score: number | null,
    availability: SignalAvailability,
    evidence: string[],
    inverse = false,
    prov: SignalProvenance[] = [],
  ): SignalComponent => ({
    name,
    direction: badStatuses.has(availability) ? 'UNAVAILABLE' : directionFromScore(score, inverse),
    strength: score,
    availability,
    timeframe: tf,
    evidence,
    provenance: prov,
  });
  const catalystScore = !catalyst
    ? null
    : catalyst.catalystDirection === 'potentially-supportive'
      ? 75
      : catalyst.catalystDirection === 'potentially-adverse'
        ? 25
        : 50;
  const fitScore = !fit
    ? null
    : fit.fit === 'STRONG_FIT'
      ? 85
      : fit.fit === 'ACCEPTABLE_FIT'
        ? 70
        : fit.fit === 'NEUTRAL'
          ? 50
          : fit.fit === 'WEAK_FIT'
            ? 35
            : fit.fit === 'CONFLICT'
              ? 10
              : null;
  return [
    scoreComponent(
      'COMPOSITE_SCORE',
      o.compositeScore,
      oq,
      [`Authoritative composite: ${o.compositeScore ?? 'unavailable'}`],
      false,
      o.provenance.map((source) => ({
        component: 'COMPOSITE_SCORE',
        provider: 'upstream',
        source,
        status: oq,
      })),
    ),
    scoreComponent(
      'OPPORTUNITY',
      o.confidence.score,
      oq,
      [o.classification, o.explanation],
      false,
      o.provenance.map((source) => ({
        component: 'OPPORTUNITY',
        provider: 'upstream',
        source,
        status: oq,
      })),
    ),
    scoreComponent(
      'CATALYST',
      catalystScore,
      cq,
      [catalyst?.catalystSummary ?? 'Catalyst intelligence unavailable'],
      false,
      provenance('CATALYST', catalyst?.provenance ?? [], cq),
    ),
    scoreComponent(
      'RISK',
      risk?.score ?? null,
      rq,
      [risk?.explanation ?? 'Risk intelligence unavailable'],
      true,
      provenance('RISK', risk?.provenance ?? [], rq),
    ),
    scoreComponent(
      'PORTFOLIO_FIT',
      fitScore,
      pq,
      fit?.explanation ?? ['Portfolio fit unavailable'],
      false,
      provenance('PORTFOLIO_FIT', input.portfolio?.provenance ?? [], pq),
    ),
    scoreComponent('TECHNICAL_CONTEXT', o.technicalScore, oq, [
      `Authoritative technical component: ${o.technicalScore ?? 'unavailable'}`,
    ]),
    scoreComponent('FUNDAMENTAL_CONTEXT', o.fundamentalScore, oq, [
      `Authoritative fundamental component: ${o.fundamentalScore ?? 'unavailable'}`,
    ]),
  ];
}

function validate(input: DecisionContext, config: SignalFusionConfig) {
  validatePercent(input.opportunity.compositeScore, 'Composite score');
  validatePercent(input.opportunity.confidence.score, 'Opportunity confidence');
  validatePercent(input.risk?.score ?? null, 'Risk score');
  validatePercent(input.risk?.confidence ?? null, 'Risk confidence');
  for (const [name, weight] of Object.entries({ ...DEFAULT_SIGNAL_WEIGHTS, ...config.weights })) {
    if (!Number.isFinite(weight) || weight < 0 || weight > 1)
      throw new SignalFusionValidationError(`${name} weight must be between 0 and 1.`);
  }
}

function agreements(components: SignalComponent[]): SignalAgreement[] {
  const supportive = components.filter((c) => c.direction === 'SUPPORTIVE');
  if (supportive.length < 2) return [];
  const selected = supportive.slice(0, 4);
  return [
    {
      code:
        selected.some((c) => c.name === 'OPPORTUNITY') &&
        selected.some((c) => c.name === 'CATALYST')
          ? 'OPPORTUNITY_CATALYST_SUPPORT'
          : 'INDEPENDENT_LAYER_SUPPORT',
      importance: selected.length >= 3 ? 'HIGH' : 'MEDIUM',
      involvedComponents: selected.map((c) => c.name),
      explanation: `${selected.map((c) => c.name).join(', ')} independently provide supportive research context.`,
      evidence: selected.flatMap((c) => c.evidence),
      timeframe: selected[0]!.timeframe,
      provenance: selected.flatMap((c) => c.provenance),
      resolution: 'ACKNOWLEDGED',
    },
  ];
}

function conflicts(input: DecisionContext, components: SignalComponent[]): SignalConflict[] {
  const by = (name: SignalComponentName) => components.find((c) => c.name === name)!;
  const out: SignalConflict[] = [];
  const add = (
    code: string,
    severity: SignalConflict['severity'],
    names: SignalComponentName[],
    explanation: string,
  ) =>
    out.push({
      code,
      severity,
      affectedComponents: names,
      explanation,
      evidence: names.flatMap((n) => by(n).evidence),
      timeframe: input.opportunity.timeframe,
      dataQuality: names.some((n) => badStatuses.has(by(n).availability)) ? 'MISSING' : 'SUPPLIED',
      resolution: 'OPEN',
    });
  if (by('OPPORTUNITY').direction === 'SUPPORTIVE' && by('RISK').direction === 'OPPOSING')
    add(
      'STRONG_OPPORTUNITY_EXCESSIVE_RISK',
      'CRITICAL',
      ['OPPORTUNITY', 'RISK'],
      'Supportive opportunity intelligence conflicts with excessive risk.',
    );
  if (by('CATALYST').direction === 'SUPPORTIVE' && by('TECHNICAL_CONTEXT').direction === 'OPPOSING')
    add(
      'CATALYST_TECHNICAL_DIVERGENCE',
      'WARNING',
      ['CATALYST', 'TECHNICAL_CONTEXT'],
      'Supportive catalyst intelligence conflicts with deteriorating technical context.',
    );
  if (
    by('COMPOSITE_SCORE').direction === 'SUPPORTIVE' &&
    by('PORTFOLIO_FIT').direction === 'OPPOSING'
  )
    add(
      'SCORE_PORTFOLIO_CONFLICT',
      'CRITICAL',
      ['COMPOSITE_SCORE', 'PORTFOLIO_FIT'],
      'A supportive composite score conflicts with poor portfolio fit or concentration.',
    );
  if (
    by('OPPORTUNITY').direction === 'SUPPORTIVE' &&
    ['PARTIAL', 'STALE', 'DEMO'].includes(by('OPPORTUNITY').availability)
  )
    add(
      'OPPORTUNITY_DATA_QUALITY',
      'WARNING',
      ['OPPORTUNITY'],
      'Supportive opportunity intelligence is constrained by data quality.',
    );
  const time = input.timeframeSignals ?? [];
  if (
    time.some((x) => x.direction === 'SUPPORTIVE') &&
    time.some((x) => x.direction === 'OPPOSING')
  )
    add(
      'TIMEFRAME_DIVERGENCE',
      'WARNING',
      ['OPPORTUNITY'],
      `Intelligence disagrees across explicitly supplied timeframes: ${time.map((x) => `${x.timeframe} ${x.direction}`).join(', ')}.`,
    );
  for (const conflict of input.risk?.conflicts ?? [])
    if (conflict.severity === 'CRITICAL')
      add(`RISK_${conflict.code}`, 'CRITICAL', ['RISK'], conflict.explanation);
  for (const conflict of input.portfolio?.conflicts ?? [])
    if (conflict.severity !== 'INFO')
      add(`PORTFOLIO_${conflict.code}`, conflict.severity, ['PORTFOLIO_FIT'], conflict.explanation);
  return out;
}

function quality(
  components: SignalComponent[],
  critical: SignalComponentName[],
): SignalDataQuality {
  const missing = critical.filter((name) => {
    const c = components.find((x) => x.name === name);
    return !c || badStatuses.has(c.availability);
  });
  const stale = components.filter((c) => c.availability === 'STALE').map((c) => c.name);
  const available = components.filter((c) => !badStatuses.has(c.availability));
  const overall: SignalAvailability =
    available.length === 0
      ? 'UNAVAILABLE'
      : stale.length
        ? 'STALE'
        : missing.length || available.length < components.length
          ? 'PARTIAL'
          : components.some((c) => c.availability === 'DEMO')
            ? 'DEMO'
            : 'SUPPLIED';
  return {
    overall,
    byComponent: Object.fromEntries(components.map((c) => [c.name, c.availability])),
    staleComponents: stale,
    missingCriticalComponents: missing,
    issues: [
      ...missing.map((x) => `${x} is a missing critical input.`),
      ...stale.map((x) => `${x} is stale.`),
    ],
  };
}

function confidence(
  components: SignalComponent[],
  conflictsFound: SignalConflict[],
  dq: SignalDataQuality,
  alignment: SignalAlignment,
): DecisionConfidence {
  const factors: DecisionConfidence['factors'] = [];
  const available = components.filter((c) => !badStatuses.has(c.availability));
  if (!available.length)
    return {
      score: null,
      level: 'UNAVAILABLE',
      factors: [
        { code: 'NO_EVIDENCE', impact: -100, explanation: 'No usable components were supplied.' },
      ],
    };
  let score = Math.round((available.length / components.length) * 100);
  const affect = (code: string, impact: number, explanation: string) => {
    score += impact;
    factors.push({ code, impact, explanation });
  };
  if (dq.staleComponents.length) affect('STALE_DATA', -15, 'Stale evidence reduces confidence.');
  if (dq.overall === 'DEMO')
    affect('DEMO_DATA', -25, 'Demo evidence cannot support production conviction.');
  if (dq.overall === 'PARTIAL') affect('PARTIAL_DATA', -10, 'Partial evidence reduces confidence.');
  affect(
    'CONFLICTS',
    -conflictsFound.reduce(
      (n, c) => n + (c.severity === 'CRITICAL' ? 20 : c.severity === 'WARNING' ? 10 : 2),
      0,
    ),
    'Open conflicts reduce confidence.',
  );
  if (alignment === 'ALIGNED')
    affect('AGREEMENT', 5, 'Independent agreement modestly supports confidence.');
  score = Math.max(0, Math.min(100, score));
  return { score, level: score >= 75 ? 'HIGH' : score >= 50 ? 'MODERATE' : 'LOW', factors };
}

export function assessSignalFusion(
  input: DecisionContext,
  config: SignalFusionConfig = {},
): SignalFusionAssessment {
  validate(input, config);
  const components = buildComponents(input);
  const critical = config.criticalComponents ?? DEFAULT_CRITICAL;
  const dq = quality(components, critical);
  const foundConflicts = conflicts(input, components);
  const available = components.filter((c) => c.direction !== 'UNAVAILABLE');
  const support = available.filter((c) => c.direction === 'SUPPORTIVE').length;
  const oppose = available.filter((c) => c.direction === 'OPPOSING').length;
  const criticalConflict = foundConflicts.some((c) => c.severity === 'CRITICAL');
  const alignment: SignalAlignment =
    available.length === 0
      ? 'UNAVAILABLE'
      : dq.missingCriticalComponents.length
        ? 'INSUFFICIENT_DATA'
        : criticalConflict
          ? 'CONFLICTED'
          : support && oppose
            ? 'MIXED'
            : support === available.length
              ? 'ALIGNED'
              : support >= Math.ceil(available.length * 0.6)
                ? 'MOSTLY_ALIGNED'
                : 'MIXED';
  const conf = confidence(components, foundConflicts, dq, alignment);
  const risk = components.find((c) => c.name === 'RISK')!;
  let classification: DecisionClassification =
    alignment === 'UNAVAILABLE'
      ? 'UNAVAILABLE'
      : alignment === 'INSUFFICIENT_DATA'
        ? 'INSUFFICIENT_DATA'
        : criticalConflict
          ? 'CONFLICTED'
          : risk.direction === 'OPPOSING'
            ? 'HIGH_RISK'
            : alignment === 'MIXED'
              ? 'MIXED_SIGNAL'
              : alignment === 'ALIGNED' && conf.score !== null && conf.score >= 80
                ? 'HIGH_CONVICTION_RESEARCH'
                : alignment === 'ALIGNED' || alignment === 'MOSTLY_ALIGNED'
                  ? 'SUPPORTIVE_RESEARCH'
                  : 'WATCH';
  if (dq.overall === 'DEMO' && classification === 'HIGH_CONVICTION_RESEARCH')
    classification = 'CONDITIONAL_RESEARCH';
  const weights: SignalWeight[] = components.map((c) => {
    const configured = config.weights?.[c.name] ?? DEFAULT_SIGNAL_WEIGHTS[c.name];
    return {
      component: c.name,
      configured,
      applied: c.direction === 'UNAVAILABLE' ? 0 : configured,
      reason:
        c.direction === 'UNAVAILABLE'
          ? 'Unavailable evidence receives no contribution and is not redistributed.'
          : 'Configured deterministic weight.',
    };
  });
  const readiness: SignalReadiness = {
    state:
      classification === 'HIGH_CONVICTION_RESEARCH' || classification === 'SUPPORTIVE_RESEARCH'
        ? 'READY_FOR_RESEARCH'
        : classification === 'INSUFFICIENT_DATA' || classification === 'UNAVAILABLE'
          ? 'INSUFFICIENT_DATA'
          : classification === 'WATCH' || classification === 'MIXED_SIGNAL'
            ? 'WATCH'
            : classification === 'CONDITIONAL_RESEARCH'
              ? 'CONDITIONAL'
              : 'NOT_READY',
    reasons: [...dq.issues, ...foundConflicts.map((c) => c.explanation)],
    executableInstruction: false,
  };
  const explanation =
    alignment === 'UNAVAILABLE' || alignment === 'INSUFFICIENT_DATA'
      ? 'A complete research classification cannot be produced because critical inputs are unavailable.'
      : criticalConflict
        ? 'Supportive intelligence is present, but an unresolved critical conflict prevents a supportive research classification.'
        : support && oppose
          ? 'The available intelligence is mixed: supportive layers are offset by opposing evidence.'
          : support
            ? `${components
                .filter((c) => c.direction === 'SUPPORTIVE')
                .map((c) => c.name)
                .join(
                  ', ',
                )} are aligned for ${input.opportunity.timeframe} research, while confidence remains conditional on supplied data quality.`
            : 'The supplied intelligence does not currently provide meaningful support for further research.';
  return {
    symbol: input.opportunity.symbol,
    classification,
    confidence: conf,
    timeframe: input.opportunity.timeframe,
    alignment,
    compositeScoreReference: input.opportunity.compositeScore,
    opportunityAssessment: input.opportunity,
    catalystAssessment: input.opportunity.context ?? null,
    riskAssessment: input.risk ?? null,
    portfolioFitAssessment:
      input.portfolioFit ??
      input.portfolio?.opportunities.find((x) => x.symbol === input.opportunity.symbol) ??
      null,
    components,
    weights,
    agreements: agreements(components),
    conflicts: foundConflicts,
    dominantSupportingFactors: components
      .filter((c) => c.direction === 'SUPPORTIVE')
      .map((c) => c.evidence[0]!),
    dominantOpposingFactors: components
      .filter((c) => c.direction === 'OPPOSING')
      .map((c) => c.evidence[0]!),
    dataQuality: dq,
    readiness,
    provenance: components.flatMap((c) => c.provenance),
    explanation,
    unresolvedIssues: [
      ...dq.issues,
      ...foundConflicts.filter((c) => c.resolution === 'OPEN').map((c) => c.explanation),
    ],
    methodology:
      'Provider-neutral orchestration of authoritative Sprint 2.4–2.8 outputs. Explicit directions and configured weights are reported; unavailable weights are never redistributed and no upstream score is recalculated.',
  };
}
