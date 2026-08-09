# Changelog

All notable changes to Seals AI Capital are documented in this file.

## Sprint 2.7 — 2026-08-09

### Added

- Provider-neutral risk factors, weighted risk assessment, scenarios, provenance, portfolio-preparation, position-sizing, opportunity/risk relationship, conflict, and trade-readiness contracts.
- Deterministic 0–100 risk classification, explicit incomplete assessments, auditable conflict detection, and position sizing constrained only by caller-supplied account, price, stop, exposure, and concentration inputs.
- A backward-compatible Risk & Trade Readiness section in the Market Opportunity Workspace and deterministic tests for calculation, validation, missing data, failures, conflicts, readiness, provenance, and sizing boundaries.

### Security and limitations

- Risk thresholds are transparent analytical heuristics, not calibrated predictions, guarantees, financial advice, or automatic Buy/Sell instructions. No live volatility, price, liquidity, portfolio, or brokerage provider is configured.
- No brokerage connectivity, account access or movement, orders, execution, payments, wallets, credentials, secrets, migrations, or additional Supabase client was added.

## Sprint 2.6 — 2026-08-09

### Added

- Provider-neutral catalyst, impact, risk, timeline, provenance, market-context, sector-context, portfolio, and alert-ready contracts with explicit REAL/PARTIAL/DEMO/UNAVAILABLE/EMPTY/ERROR states.
- Deterministic freshness, phase, confidence, and contextual conflict assessment layered on existing Sprint 2.5 opportunities without changing the Sprint 2.4 Composite Score or rank order.
- Backward-compatible optional opportunity and Watchlist context, catalyst-aware explanations, expanded workspace views, and tests for provider failures and no-fabrication behavior.

### Security and limitations

- No live catalyst provider is configured. The default provider returns UNAVAILABLE with empty events and no provenance; it never silently substitutes demo data.
- Catalyst language describes potential support, adversity, mixed evidence, or uncertainty—not causation, guaranteed price movement, advice, or execution. No broker, order, wallet, payment, private key, service-role secret, or financial transaction capability was added.

## Sprint 2.5 — 2026-08-09

### Added

- Strongly typed, provider-neutral opportunity candidates, ranked results, portfolio snapshots, and alert-ready change-event contracts built directly on Sprint 2.4 assessments.
- Deterministic ranking with explicit tie handling, timeframe support, classification, confidence, signal agreement/conflicts, evidence-driven explanations, provenance, and quality states.
- A reusable opportunity workspace with top, bullish, bearish, confidence, momentum, risk, conflict, and incomplete views, plus a Watchlist adapter that uses the shared scoring output.
- Automated coverage for ranking, ties, normalization boundaries, confidence, missing/partial/error/demo data, agreement/conflicts, classifications, timeframe handling, Watchlist use, provenance, and no-fallback behavior.

### Security and limitations

- Opportunity labels are analytical research classifications, not trading instructions or guaranteed returns. Thresholds are not backtested, sector-relative, or predictive.
- No brokerage link, credential, order, execution, wallet, payment, deposit, withdrawal, push delivery, secret, migration, or additional Supabase client was added. Missing data remains unavailable and provider failure never falls back to demo.

## Sprint 2.4 — 2026-08-09

### Added

- Provider-neutral quantitative contracts and a deterministic, configurable eight-component SAC Composite Score with normalized weights and null-safe missing-data behavior.
- Per-component contributions, factors, provenance, confidence, five-state quality, structured risk flags, incomplete metadata, and explicit conflict detection.
- Shared Fundamental and Technical workspace presentation plus automated scoring, quality, conflict, boundary, provider-error, and finite-output coverage.

### Security and limitations

- Classifications are descriptive analytical assessments, not Buy/Sell instructions or guarantees. General thresholds are not yet sector-calibrated or backtested.
- Failures never fall back to demo, demo stays illustrative, and unavailable values remain null. No secret, broker, execution, account movement, migration, or Supabase client was added.

## Sprint 2.3 — 2026-08-09

### Added

- Deterministic VWAP, stochastic oscillator, ADX/+DI/-DI, ROC, average-volume, and relative-volume calculations alongside the existing technical indicator suite.
- Provider-neutral technical condition evaluation for trend, momentum, RSI, MACD, moving-average, volume, support, and resistance context.
- Expanded symbol workspace sections, weighted score factors, signal explanations, warnings, and per-indicator five-state provenance.
- Automated coverage for calculations, deterministic results, insufficient history, provenance states, provider failures, validation, and cache deduplication.

### Security and limitations

- The default historical provider remains unavailable and no live or demo candles are fabricated. Partial and demo data remain explicitly labeled and provider failures never trigger fallback data.
- Signals and scores are descriptive technical conditions, not predictions, advice, or trade actions. No broker, order execution, transaction, credential, migration, or additional Supabase client was added.

## Sprint 2.1 — 2026-08-09

### Added

- A provider-neutral `FundamentalDataProvider` and real SEC EDGAR/XBRL Company Facts adapter with ticker-to-CIK resolution, provenance, annual history, and reliable discrete-quarter history.
- Explicit real, partial, demo, unavailable, empty, error/retry, freshness, filing, provider, and CIK presentation in the existing workspace.
- Fifteen-minute snapshot caching, request coalescing, and a 24-hour ticker-directory cache without polling.

### Changed

- Connected Sprint 2.0 growth, margin, ROE, leverage, net debt, and free-cash-flow calculations to real filing inputs while preserving nulls and negative values.
- Added selectable `demo` and `sec` modes. Real failures never fall back to illustrative data.

### Security and limitations

- Added no provider secret, service-role key, brokerage/trading capability, Supabase client, or migration. Future credentialed providers must run behind a trusted backend.
- SEC coverage and taxonomy usage vary by issuer. Unsupported concepts remain unavailable. Filed fundamentals are not guaranteed real-time prices, and price-derived metrics require separate real market data.

## Sprint 2.0 — 2026-08-09

### Added

- Provider-neutral fundamental domain, normalized service contract, replaceable illustrative demo adapter, deduplicated hooks, safe calculations, historical-period architecture, and configurable SAC score-input categories.
- Fundamental workspace with explicit loading, error/retry, empty, stale, demo, and unavailable presentations plus Watchlist, Portfolio, Research, and compact Dashboard entry points.

### Security

- Added no live/paid provider, provider key, broker integration, trade action, Supabase client, or privileged credential. Future upstream access remains restricted to the trusted backend.

### Notes

- Demo responses are explicitly illustrative and deliberately contain no actual financial metrics or fabricated history. The score framework makes no Buy/Sell recommendation.

## Sprint 1.9 — 2026-08-09

### Added

- Strict provider-neutral news, source, event, catalyst, company summary, query, lifecycle, and normalized response contracts.
- Replaceable local demo adapter, deduplicated cached hooks, reusable search, News workspace, symbol route, catalyst cards, market context, and private saved-news notes.
- News views scoped to authenticated Watchlist and Portfolio symbols plus restrained Dashboard and Research integration.

### Security

- Added no credential, brokerage behavior, Supabase client, or migration. Existing Watchlist and Portfolio ownership remains in the investment provider and owner-scoped Supabase service/RLS.
- Saved-news notes are partitioned by authenticated user ID in device-local storage. Future providers must run behind the trusted backend.

### Notes

- All fixtures are explicitly illustrative scenarios, have no source URL or real-world event timestamp, and make no claim that an event occurred. No live provider is configured.
- Saved news does not sync. No manual Supabase step or new environment variable is required.

## Sprint 1.8 — 2026-08-08

### Added

- Provider-neutral research models, validation, replaceable services, local demo adapter, and deduplicated cached hooks with normalized lifecycle states.
- Symbol-driven workspace covering identity, performance, fundamentals, technicals, news, thesis, risks, monitoring, and local notes.
- Research navigation from Watchlist, Portfolio, and Dashboard symbols.

### Security

- Added no privileged key, broker integration, order behavior, Supabase client, or migration. Device-local notes are partitioned by authenticated user ID.
- Reserved live research and AI provider calls for a trusted backend or Edge Function.

### Notes

- Demo content is illustrative and labeled. Missing metrics and historical series are unavailable; the app does not fabricate a live chart or claim AI analysis.
- Notes are local and do not sync. Visual verification requires a configured Expo environment.

## Sprint 1.7 — 2026-08-08

### Added

- User-owned Watchlist and current Portfolio Position tables with normalization, validation, duplicate prevention, timestamps, indexes, and owner-only RLS.
- Centralized investment services/provider, symbol search, watchlist controls, position editor, portfolio rows and summary, refresh behavior, and explicit loading/error/empty states.
- Pure cost basis, market value, and unrealized return calculations with safe zero-cost and missing-quote behavior.

### Changed

- Replaced Watchlist and Portfolio placeholders with authenticated personal workspace screens.
- Connected Dashboard Watchlist and Portfolio snapshots to user records while preserving existing intelligence sections.

### Security

- Restricted all Watchlist and Portfolio operations to `auth.uid() = user_id` through RLS and explicit user filters as defense in depth.
- Retained the centralized Supabase client and provider-neutral market-data boundary; no privileged credential or real-money action was added.

### Notes

- Apply `supabase/migrations/20260808010000_create_watchlist_and_portfolio.sql` manually. A live migration or authenticated RLS test was unavailable locally.
- Quote-derived values use the configured adapter. The default demo adapter remains illustrative and explicitly labeled, not live.

## Sprint 1.6 — 2026-08-08

### Added

- Provider-neutral quote, market-status, symbol-search, source, and service contract types.
- Reusable single-quote, batched-quote, and market-status hooks with request coalescing, caching,
  refresh state, and failure handling.
- Explicit local demo adapter plus reusable market status, movement, quote row, loading, empty, and
  error presentations.

### Changed

- Connected Dashboard market pulse and watchlist cards to the market service architecture while
  preserving the premium dark-and-gold presentation.
- Documented public adapter selection and trusted-backend requirements for a future live provider.

### Security

- Kept provider keys and privileged credentials out of Expo; future provider traffic must pass
  through the trusted backend.
- Retained the single centralized Supabase client without adding any market-provider dependency.

### Notes

- Dashboard values currently come from an explicitly labeled illustrative demo adapter, not a live
  market feed. `backend` mode is reserved until a real trusted-backend adapter is implemented.

## Sprint 1.5 — 2026-08-08

### Added

- One-to-one Supabase application profiles with an optional display name and lifecycle timestamps.
- Idempotent first-session profile initialization with loading, missing, error, retry, and
  signed-out states kept separate from authentication state.
- Premium account profile editor with save success and failure feedback.

### Changed

- Expanded Settings to show the authenticated email, editable profile information, and session
  controls.
- Wrapped protected navigation in a dedicated profile provider while retaining the existing auth
  provider and centralized Supabase client.

### Security

- Enabled row-level security with policies restricting profile select, insert, and update access to
  the matching authenticated `auth.uid()`.
- Kept privileged credentials out of profile storage and the Expo client.

### Notes

- Developers must apply `supabase/migrations/20260808000000_create_profiles.sql` to their Supabase
  project before using profile features.
- A live authenticated-device test requires developer-provided public Supabase configuration.

## Sprint 1.4 — 2026-08-08

### Added

- Supabase email/password account creation and sign-in screens with validation and request states.
- Centralized authentication context with persistent session restoration and an auth state listener.
- Authentication-aware Expo Router protection for the existing application shell.
- Account identity and sign-out controls in Settings, including loading and error handling.

### Changed

- Documented the public Supabase environment configuration and email provider setup workflow.
- Configured launch navigation to wait for authentication state before showing protected content.

### Security

- Client configuration remains limited to the Supabase project URL and publishable/anonymous key;
  no privileged credentials are stored in the application.

## Sprint 1.3 — 2026-08-07

### Added

- Animated, branded splash screen with the Seals AI Capital mission statement.
- Premium dashboard cards populated with realistic illustrative market content.
- Reusable `StatCard`, `DashboardCard`, and `EmptyState` components.

### Changed

- Refined the global dark theme, typography hierarchy, spacing scale, borders, radii, and elevation.
- Enhanced shared cards, headers, buttons, section titles, and screen containers.
- Polished bottom navigation with clearer icons, elevated styling, and a gold active state.

### Notes

- Dashboard values are static demonstration content. No APIs, authentication, Supabase queries, or
  OpenAI calls were added.

## Sprint 2.2 — 2026-08-09

### Added

- Strongly typed technical-analysis domain, symbol/timeframe/candle validation, provider-neutral market-data adapter boundary, explicit five-state provenance, bounded cache, and in-flight request deduplication.
- Deterministic SMA, EMA, RSI, MACD, ATR, Bollinger Bands, volume, momentum, trend, volatility, support/resistance, and transparent weighted scoring calculations with explicit insufficient-data results.
- Symbol and timeframe technical workspace with loading, empty/unavailable, error/retry, real, partial, demo, freshness, provenance, indicator, score, and explanation presentations; connected from Dashboard, Watchlist, Portfolio, and Research.
- Automated tests for calculations, missing history, validation, provider errors, status preservation, scoring, and cache behavior.

### Security

- Added no Supabase client, service-role key, market-provider secret, brokerage/trading credential, order execution, or financial transaction. Future credentialed market data must traverse a trusted backend or Edge Function.

### Notes

- No trusted historical candle provider is configured in this sprint. The default workspace is explicitly unavailable; it never creates or presents fabricated live candles, prices, indicators, or signals and never silently falls back to demo after an error.
- Demo provenance is supported for explicitly installed illustrative fixtures, but no default candle fixture pretends to be live. Technical classifications and scores are descriptive, not Buy/Sell recommendations or profit guarantees.

# Sprint 2.8 — 2026-08-09

### Added

- Strongly typed, provider-neutral portfolio snapshot, exposure, allocation, concentration,
  diversification, correlation, risk-budget, opportunity-fit, conflict, quality, provenance, and
  readiness contracts.
- Deterministic portfolio assessment with explicit supplied/derived/unavailable lineage,
  transparent concentration bands, no invented correlation/budget/targets, and structured conflict
  evidence.
- Optional Portfolio Intelligence workspace and backward-compatible opportunity-card enrichment.
- Deterministic coverage for exposure, allocation, unavailable inputs, provenance, stale data,
  incomplete holdings, and invalid numeric values.

### Security

- Portfolio Intelligence is analytical only. No brokerage, account, balance, credential, payment,
  wallet, key, secret, order, transaction, execution, or automated-trading integration was added.

# Sprint 2.9 — 2026-08-09

### Added

- Provider-neutral Signal Fusion contracts and a pure, deterministic orchestration engine over the authoritative Sprint 2.4–2.8 assessments.
- Inspectable component weights, agreement and conflict records, confidence factors, timeframe divergence, provenance, data-quality gates, readiness, and research-only decision classifications.
- Optional Signal Fusion & Decision Intelligence workspace card and deterministic unit coverage for alignment, missing/stale/provider-unavailable evidence, validation, conflicts, provenance, timeframes, and explanations.

### Security

- Signal Fusion remains analytical and explicitly non-executable. No brokerage, account, wallet, credential, private-key, payment, transaction, order, privileged Supabase, or automated-trading capability was added.

### Limitations

- Fusion can only interpret supplied upstream assessments. It does not source market data, infer absent catalysts/portfolio holdings, reconcile provider identities, or predict price movement.
