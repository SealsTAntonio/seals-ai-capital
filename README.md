# Seals AI Capital

AI-powered investment research and portfolio management, built with Expo, React Native, and
TypeScript.

> **Research First. Profit Second. Protect Capital Always.**

## Prerequisites

- Node.js 20.19.4 or newer
- npm
- Expo Go or an Android/iOS simulator for local device development

## Getting started

```bash
npm install
cp .env.example .env.local
npm start
```

Before starting Expo, replace the placeholder Supabase values in `.env.local`. The app restores
persisted sessions at launch and routes signed-out users to the welcome, sign-in, and account
creation experience. Signed-in users enter the existing protected application tabs; use the
Settings account section to sign out.

Use `npm run android`, `npm run ios`, or `npm run web` to open a specific platform. Before
submitting changes, run the complete local verification suite:

```bash
npm run check
```

## Environment configuration

Expo inlines variables beginning with `EXPO_PUBLIC_` into the application bundle. Copy
`.env.example` to `.env.local` and configure:

| Variable                            | Purpose                                                                              |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`          | Public URL for the Supabase project.                                                 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY`     | Supabase publishable or legacy anonymous key. This must never be a service-role key. |
| `EXPO_PUBLIC_API_BASE_URL`          | Trusted application backend or Supabase Edge Functions base URL.                     |
| `EXPO_PUBLIC_MARKET_DATA_MODE`      | Public adapter selection. Use `demo`; `backend` is reserved for a future adapter.    |
| `EXPO_PUBLIC_FUNDAMENTAL_DATA_MODE` | Select `demo` (illustrative) or `sec` (real SEC filings).                            |
| `EXPO_PUBLIC_SEC_USER_AGENT`        | Public SEC request identification (`app/version contact-email`), not a credential.   |

OpenAI must be called by the trusted backend identified by `EXPO_PUBLIC_API_BASE_URL`. **Never
store an OpenAI API key in the application or in an `EXPO_PUBLIC_` variable.** The API service in
`src/services/api.ts` provides the client-side boundary for future AI features.

### Supabase email/password setup

1. Create or select a Supabase project and copy its project URL and publishable (or legacy anon)
   key from the project's API settings into `.env.local`.
2. In the Supabase dashboard, open **Authentication → Providers → Email** and enable the Email
   provider. Choose whether email confirmation is required for your local workflow.
3. When confirmation is enabled, configure the Authentication URL settings for the URLs used by
   your Expo application, then confirm the verification email before signing in.

Only the public project URL and publishable/anonymous key belong in the Expo client. Never use a
service-role or secret key in `.env.local`, an `EXPO_PUBLIC_` variable, or client source code.

### Supabase profile setup (Sprint 1.5)

Apply `supabase/migrations/20260808000000_create_profiles.sql` with the Supabase CLI or the SQL
editor before opening the authenticated application. The migration creates a one-to-one
`public.profiles` record keyed to `auth.users.id`, enables row-level security, and installs
authenticated-user-only select, insert, and update policies. It also maintains `updated_at` on
profile updates. No service-role key is required by—or permitted in—the Expo client.

On the first authenticated session, the profile provider queries for the current user's row and
idempotently initializes it when absent. Settings then allows the user to view their authentication
email and edit the optional display name. Authentication/session state remains owned by the auth
provider; profile loading, initialization, retry, and update state remains in the profile feature.

## Project structure

```text
.
├── app/                    # Expo Router routes and navigation layouts
│   ├── (tabs)/             # Bottom tabs and all Sprint 1.2 product screens
│   ├── _layout.tsx         # Root navigation and global visual theme
│   └── index.tsx           # Redirect into the application shell
├── src/
│   ├── components/         # Shared, feature-agnostic UI components
│   ├── config/             # Validated runtime configuration
│   ├── features/           # Feature modules (UI, hooks, state, and domain logic)
│   ├── hooks/              # Shared React hooks
│   ├── lib/                # Configured third-party clients such as Supabase
│   ├── services/           # Network and application service boundaries
│   ├── theme/              # Colors, spacing, typography, and navigation theme
│   ├── types/              # Shared TypeScript types
│   └── utils/              # Pure shared utilities
├── app.json                # Expo application and plugin configuration
├── eslint.config.js        # ESLint flat configuration based on Expo defaults
├── tsconfig.json           # Strict TypeScript and `@/` path alias configuration
└── .env.example            # Safe template for public environment values
```

Route files stay in `app/`, as required by Expo Router. Product code belongs in `src/`; new
features should be self-contained under `src/features/<feature-name>` and expose only the public
surface other modules need. Cross-feature code should move into `components`, `hooks`, `services`,
or `utils` only when it is genuinely shared.

## Design system

The initial design system uses a near-black professional palette with restrained gold accents.
Consume tokens from `@/theme` instead of embedding colors or spacing values in components. This
keeps React Navigation and application UI visually consistent and makes future theming changes
centralized.

## Sprint 1.3: premium UI and dashboard

Sprint 1.3 transforms the application shell into a polished fintech experience. A branded animated
splash screen introduces the mission, while the dashboard presents an illustrative market pulse,
watchlist, portfolio snapshot, AI insight, congressional disclosure, and curated headlines. All
values are realistic demonstration data—this sprint intentionally makes no API, authentication,
Supabase, or OpenAI calls.

The refined dark-and-gold design system includes a stronger typography hierarchy, consistent
spacing, layered surfaces, subtle elevation, and active gold navigation. Shared `Header`,
`ScreenContainer`, `Card`, `PrimaryButton`, and `SectionTitle` primitives have been enhanced, with
new `StatCard`, `DashboardCard`, and `EmptyState` components available for future features.

## Sprint 1.4: Supabase authentication

Sprint 1.4 adds real Supabase email/password sign-up, sign-in, and sign-out flows while preserving
the premium dark-and-gold application shell. A centralized authentication provider restores the
persisted session, listens for authentication changes, exposes the current Supabase user, and
prevents protected content from rendering until authentication is known. Expo Router directs
signed-out users to the authentication route group and signed-in users to the existing tabs.

Authentication forms include basic email, empty-field, password length, and password confirmation
validation plus request loading, disabled-button, success, and user-friendly error states.

## Sprint 1.5: user profile and account foundation

Sprint 1.5 adds a dedicated profile data-access layer and provider on top of authentication. It
handles first-session profile initialization without duplicate rows and exposes explicit loading,
missing, ready, error, and signed-out states. The Settings account experience includes the user's
read-only authentication email, an editable optional display name, save feedback, retry behavior,
and the existing sign-out control.

Profile access is enforced in PostgreSQL with row-level security based on `auth.uid()`. Client code
continues to use the single centralized Supabase client and only the public project URL and
publishable/anonymous key.

## Sprint 1.6: live market data foundation

Market data now follows a strict `MarketDataService → hooks → reusable market components → screen`
flow under `src/features/market-data`. Provider-neutral quote models include price movement, OHLC,
volume, average volume, market cap, 52-week range, timestamp, source, and a five-state market status.
The service boundary also exposes batched quotes and symbol/company lookup for future Watchlist,
Portfolio, Day Trading, Stock Analyzer, Ask SAC, and other features.

`useQuote`, `useQuotes`, and `useMarketStatus` expose data, initial loading, error, refresh, and
refresh-in-progress state. A short shared cache coalesces duplicate in-flight requests. Dashboard
market cards use these abstractions and render distinct loading, failure, empty, positive, negative,
and unchanged presentations.

Development defaults to an in-memory demo adapter. Every demo surface is labeled **DEMO**, and its
illustrative snapshots must not be treated as real-time prices. To add a production provider,
implement `MarketDataService`, normalize provider payloads at the boundary, and install the adapter
with `setMarketDataService`. The adapter must call the trusted backend through the existing API
boundary; provider keys and service credentials belong only in server-side secret storage. Setting
`EXPO_PUBLIC_MARKET_DATA_MODE=backend` alone does not create a production integration.

## Integration boundaries

## Sprint 2.8: portfolio intelligence and allocation

`src/features/portfolio-intelligence` is the provider-neutral analytical layer above the existing
quantitative, ranking, catalyst, and risk outputs. A snapshot contains only explicitly supplied
holdings. The engine values a position from supplied notional, or derives notional from supplied
quantity and reference price; every result labels itself `SUPPLIED`, `DERIVED`, `UNAVAILABLE`, or
`INVALID` and lists its source inputs. Long, short, gross, net, position, sector, asset, opportunity,
risk, catalyst, and timeframe exposure remain deterministic.

Concentration bands are transparent descriptive thresholds: below 20% low, 20–under 30% moderate,
30–under 50% high, and 50% or above very high. Diversification assesses only available holdings,
sector, asset, direction, risk, catalyst, and timeframe dimensions. Correlation is unavailable
unless coefficients are supplied; it is never inferred. Risk utilization and remaining capacity
exist only when the caller supplies a positive risk budget. Allocation gaps exist only for supplied
targets. Portfolio fit preserves the upstream rank and score and adds contextual concentration,
diversification, catalyst, timeframe, and risk observations.

The workspace can optionally render snapshot, exposure, concentration, diversification, budget,
conflict, fit, allocation, readiness, quality, provenance, and explanation sections without
changing older consumers. Quality states (`REAL`, `PARTIAL`, `DEMO`, `UNAVAILABLE`, `ERROR`,
`MISSING`, `STALE`) and deduplicated provenance flow through the assessment. There is no fallback
portfolio, price, correlation, target, or budget.

This feature has no brokerage/account provider, order execution, payment, wallet, private-key,
secret, transaction, or automated-trading capability. Future providers may normalize user-supplied
or trusted-backend data into the contracts, but must remain separate from domain calculations.

## Sprint 2.6: catalyst and market context intelligence

Sprint 2.6 adds `src/features/catalyst-intelligence`, a provider-neutral context layer that consumes
the existing quantitative opportunity result rather than recalculating or modifying its score.
Strongly typed contracts cover earnings and guidance, filings, corporate actions, ratings, product
and regulatory events, M&A, management, dilution, capital returns, contracts, legal matters,
announcements, and sector/macro/market events. Each event separates lifecycle phase, verification,
availability, scope, impact direction, magnitude, horizon, confidence, quality, freshness, risks,
dates or windows when supplied, and source provenance.

Impact assessment is deterministic and uses cautious labels—potentially supportive, potentially
adverse, mixed, unclear, or insufficient evidence. It does not infer price outcomes. Opportunity
enrichment is optional and backward compatible: catalyst summaries, counts, risks, timeline,
market and sector context, conflicts, warnings, missing information, and quality are layered onto
Sprint 2.5. Watchlist inputs use the same contracts, and portfolio/alert event interfaces are ready
for later consumers without delivering notifications or financial actions.

There is currently no trusted live catalyst provider. The safe default returns `UNAVAILABLE`, an
empty event list, null confidence, and empty provenance; it never invents news or dates and never
falls back to demo. A future adapter must normalize trusted provider data at the boundary and mark
fixtures `DEMO` explicitly. Market and sector conditions remain distinct from company fundamentals
and technicals. Known limitations include provider coverage, ambiguous event impact, unconfirmed
events, delayed sources, missing timestamps, and the absence of sector-relative calibration.

Future alert delivery may consume the alert-ready contracts for new/approaching/changed catalysts,
filings, earnings, guidance, regulatory, sector, market, risk, and conflict events. Brokerage,
account linking, trading, wallets, deposits, withdrawals, payments, and client-side secrets remain
separate future secure-infrastructure phases and are expressly outside this intelligence layer.

- **Supabase:** call `getSupabaseClient()` from `src/lib/supabase.ts`. The client is initialized
  lazily, persists native sessions with AsyncStorage, and manages token refresh with app state.
- **OpenAI:** call the project's trusted API through `apiRequest()` in `src/services/api.ts`.
  Provider credentials, prompts that must remain private, rate limiting, and OpenAI calls belong on
  the server.
- **Market data:** consume `MarketDataService` or its hooks. Never call a vendor from a screen and
  never place a vendor secret in Expo; production requests must traverse the trusted backend.

## Available scripts

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `npm start`            | Start the Expo development server.              |
| `npm run android`      | Start Expo and open Android.                    |
| `npm run ios`          | Start Expo and open iOS.                        |
| `npm run web`          | Start Expo for web.                             |
| `npm run lint`         | Run Expo's ESLint configuration.                |
| `npm run typecheck`    | Run TypeScript without emitting output.         |
| `npm run format`       | Format the repository with Prettier.            |
| `npm run format:check` | Verify formatting without modifying files.      |
| `npm run check`        | Run lint, type checking, and formatting checks. |

## Sprint 1.7: personalized watchlist and portfolio foundation

Apply `supabase/migrations/20260808010000_create_watchlist_and_portfolio.sql` after the profile migration with the Supabase CLI or SQL editor. It creates `public.watchlist` and `public.portfolio_positions` with normalized symbols, one row per user/symbol, timestamps, indexes, validation, and owner-only RLS for select, insert, update, and delete. Applying this migration is a required manual deployment step; this repository cannot apply or verify it against a live project without developer-provided access.

Authenticated screens use the centralized Supabase client through a dedicated investment service and shared provider. The Watchlist supports market-service symbol search, duplicate-safe adds, removals, refresh, and explicit loading, empty, error, and retry states. Portfolio positions store only symbol, quantity, and average cost. Market value, cost basis, and unrealized returns are derived from available quotes; zero cost basis produces an unavailable percentage rather than division by zero. Dashboard Watchlist and Portfolio snapshots now reflect authenticated user records instead of static portfolio values.

Supabase remains the authority for isolation: every data-access operation also includes the current user ID as defense in depth, while RLS enforces `auth.uid() = user_id`. Demo market mode remains illustrative and labeled, not live. No transaction history, brokerage connection, real-money trading, deposits, withdrawals, or AI integration is included.

## Sprint 1.8: investment research foundation

The symbol-driven `/research/[symbol]` workspace uses the provider-neutral `src/features/research`
domain. Strongly typed company, quote, performance, fundamental, technical, news, thesis, risk,
status, source, and note models flow through a replaceable `ResearchService`, deduplicated one-minute
hook cache, and reusable presentation. Watchlist, Portfolio, and Dashboard open the same workspace
without duplicating calculations or market data.

The development adapter is explicitly **demo / illustrative**. It reuses the market-data boundary,
leaves unsupported fields unavailable, provides no historical chart, and does not claim current news
or AI analysis. Live adapters installed with `setResearchService` must normalize responses and call
a trusted backend or Edge Function; provider and AI secrets never belong in Expo.

Notes use a separate `ResearchNotesService` and device-local AsyncStorage partitioned by authenticated
user ID. There is no migration or cross-device sync. A future Supabase adapter must reuse the
centralized client and owner-only RLS.

## Sprint 1.9: news and catalyst intelligence foundation

The `/news` workspace provides Market, Watchlist, Portfolio, Company, Catalyst, and Saved News views; `/news/[symbol]` is the shared symbol workspace linked from Research. Normalized contracts and cached hooks sit behind a replaceable `NewsService`. Cards obtain market context only from existing market hooks, while personalized filters consume the authenticated investment provider and preserve its centralized Supabase client, explicit owner filtering, and database RLS.

The bundled adapter is a scenario library, not a news feed. Every fixture is labeled **DEMO / ILLUSTRATIVE**, omits real-world event timestamps and source URLs, and makes no claim that an event happened. No news environment variable is required. Live integration must implement `NewsService`, validate/normalize responses, and reach an approved provider only through the trusted backend at `EXPO_PUBLIC_API_BASE_URL`; provider secrets remain server-side.

Saved-news notes are namespaced to the signed-in user in device-local AsyncStorage. Sprint 1.9 adds no migration or manual Supabase step, and notes do not sync. Future database persistence must reuse `getSupabaseClient()` and authenticated owner-only RLS.

## Sprint 2.0: fundamental analysis foundation

The symbol route `/fundamentals/[symbol]` provides a premium provider-neutral workspace for company identity, growth, profitability, financial health, valuation, historical fundamentals, and the SAC score-input foundation. Watchlist and Portfolio entries open this workspace, Research links to it, and Dashboard includes a restrained snapshot. Missing values render as **Unavailable**, never zero.

`src/features/fundamentals` owns typed domain contracts, safe calculation utilities, the replaceable `FundamentalAnalysisService`, request-coalescing hooks, and presentation. The bundled demo adapter is explicitly **DEMO / ILLUSTRATIVE** and deliberately returns unavailable metrics and no invented history. It is not live data and makes no recommendation. A future adapter must validate and normalize an approved provider behind `EXPO_PUBLIC_API_BASE_URL`; financial-provider keys and other privileged credentials must never enter Expo. No new Supabase client, migration, provider variable, brokerage behavior, or trading capability is introduced.

## Sprint 2.1: real fundamental data integration

Fundamental analysis now follows `FundamentalDataProvider → FundamentalAnalysisService → cached hooks → FundamentalWorkspace`. Set `EXPO_PUBLIC_FUNDAMENTAL_DATA_MODE=sec` and provide the public, identifying `EXPO_PUBLIC_SEC_USER_AGENT` requested by SEC fair-access guidance to retrieve real U.S. issuer facts from the SEC EDGAR ticker directory and XBRL Company Facts APIs. The default remains `demo`; it is visibly illustrative and is never used as fallback when an SEC lookup fails.

The SEC adapter resolves ticker to CIK and contains all source concepts at its normalization boundary. It retains CIK, fiscal/reporting period, filing date, form, source URL, provider, retrieval time, annual history, discrete quarterly history where identifiable, and per-metric availability. Latest-filed duplicates take precedence. Missing, unsupported, non-finite, and zero-denominator inputs remain unavailable, while valid negative values are preserved.

Same-symbol requests are coalesced and snapshots are cached for 15 minutes; ticker identity is cached for 24 hours. There is no polling. Retrieval time and freshness are visible. SEC failures produce an error with retry, unknown tickers produce an empty state, and incomplete filings are labeled **REAL DATA • PARTIAL**. No real-data failure silently substitutes demo data.

SEC filings are not real-time market prices and may be amended, delayed, differently tagged, or incomplete. Market-capitalization and price-derived metrics remain unavailable unless the separate market-data architecture supplies a real compatible value. Sprint 2.1 does **not** provide or guarantee real-time prices. Future adapters implement `FundamentalDataProvider`; credentialed providers must run behind a trusted backend. This sprint adds no Supabase client, migration, brokerage connection, trading, or privileged credential.

## Sprint 2.2: technical analysis foundation

Technical analysis follows `TechnicalAnalysisService → MarketDataProvider → trusted backend adapter`, with validated symbol/timeframe inputs, request deduplication, timeframe-aware caching, and a shared symbol workspace. The domain distinguishes `real`, `partial`, `demo`, `unavailable`, and `error` provenance and carries provider, source, retrieval time, freshness, symbol, timeframe, and structured errors. Supported request timeframes are 1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W, and 1M; provider coverage may be narrower.

Pure modules implement SMA, EMA, RSI, MACD, ATR, Bollinger Bands, volume comparison, momentum, trend, return volatility, and support/resistance. Every calculation documents its lookback and returns explicit insufficient data rather than NaN, Infinity, or a substitute zero. The explainable 0–100 score weights trend (30%), momentum (25%), volume (15%), volatility context (10%), and support/range context (20%), renormalizing across available components. Bullish/bearish/neutral is descriptive context—not a Buy/Sell recommendation or profit guarantee.

No historical-candle provider is enabled by default. The workspace therefore renders **UNAVAILABLE** and never synthesizes candles. Future adapters must retrieve data through a trusted backend or Edge Function, validate and normalize candles, state supported timeframes and latency, preserve errors without demo fallback, and keep provider keys server-side. Any development fixture must retain `demo` provenance and label every derived result illustrative, never live.

## Sprint 2.3: advanced technical analysis and signal intelligence

The shared symbol Technical workspace now groups technical overview, trend, momentum, volatility,
volume, moving averages, oscillators, support/resistance, score, and an explainable signal
breakdown. Its deterministic engine adds VWAP, stochastic %K/%D, ADX/+DI/-DI, ROC, average volume,
and relative volume to the Sprint 2.2 suite. Calculations require documented history and never
synthesize a missing value.

Every indicator visibly inherits **REAL**, **PARTIAL**, **DEMO / ILLUSTRATIVE**, **UNAVAILABLE**, or
**ERROR** provenance. The score renormalizes only available weighted factors and exposes each
factor. Signals and scores are descriptive technical conditions—not predictions, financial advice,
or Buy/Sell instructions. The default provider remains unavailable; credentialed providers stay
behind the trusted backend, and no trading, brokerage, secret, migration, or second Supabase client
is included.

## Sprint 2.4: quantitative signal fusion and stock scoring

`src/features/quantitative-intelligence` combines the existing normalized Fundamental and Technical domains; it does not recalculate their statements or indicators. The provider-neutral `QuantitativeSignalProvider` supplies those results to one deterministic service reusable by Research, Dashboard, Watchlist, Portfolio, and symbol workspaces. The Fundamental and Technical workspaces expose the same score card rather than owning separate engines.

Default composite weights are Fundamental 25%, Technical 25%, Momentum 15%, Trend 10%, Volume 5%, volatility/risk 10%, Valuation 5%, and Quality 5%. Callers may override weights; the service validates and normalizes the model. Missing components are `null`, never zero, and available weights are renormalized. Every component reports configured/effective weight, contribution, factors, missing inputs, provenance, status, and confidence. Bands are 90–100 Exceptional, 80–89 Strong, 70–79 Constructive, 60–69 Neutral, 50–59 Weak, and 0–49 High Risk / Weak.

Conflict metadata preserves fundamental/technical disagreement, momentum/fundamental divergence, trend/volatility tension, valuation/growth tension, and strong evidence paired with a missing domain. Quality states are `real`, `partial`, `demo`, `unavailable`, and `error`; provider errors never fall back to demo, and illustrative evidence lowers confidence.

Known limitations: initial transparent normalization thresholds are general heuristics, not sector-specific or empirically calibrated factors. Existing SEC and historical-market provider coverage still applies. Future providers must return validated existing SAC contracts, preserve provenance and failures, keep credentials behind the trusted backend, and never label illustrative data live. Classifications are analytical model assessments—not Buy/Sell instructions or guarantees of investment performance.

## Sprint 2.5: opportunity ranking and signal intelligence

`src/features/opportunity-intelligence` consumes Sprint 2.4 `QuantitativeAssessment` objects without
recalculating fundamentals, indicators, or composite scores. Its deterministic ranking order is
supported timeframe, composite score, normalized confidence, then symbol. The reusable result and
workspace contracts support top, bullish, bearish, confidence, momentum, risk, conflict, and
incomplete views for Dashboard, Watchlist, Research, Technical, Fundamental, and Portfolio.

Classifications range from Strong Bullish Opportunity through Neutral / Watch and Bearish
Opportunity to High-Risk / Avoid. They are analytical labels, never Buy/Sell instructions or return
guarantees. Signal agreement explicitly describes confirmed strength/weakness,
fundamental/technical conflict, momentum-driven risk, high-risk technical setups, mixed evidence,
and incomplete evidence. Structured conflicts remain available to downstream alert systems.

Confidence combines valid-component completeness, upstream component confidence, declared
freshness, provider status, historical availability, agreement, and a visible conflict penalty.
Missing evidence produces `null`, not zero; unsupported timeframes produce Incomplete Assessment.
`REAL`, `PARTIAL`, `DEMO`, `UNAVAILABLE`, `EMPTY`, and `ERROR` are downstream presentation states;
demo is never substituted after a provider failure. Catalyst absence is unknown unless a caller
explicitly supplies it.

Known limitations: ranking is not backtested or sector-relative, freshness and supported timeframes
must be supplied by upstream integrations, and no historical performance model is implied. Event
contracts are alert-ready, but delivery is not implemented. This sprint adds no brokerage link,
orders, trading, wallets, payments, deposits, withdrawals, client-side secrets, or financial
transactions; future trading infrastructure remains a separate secured system.

## Sprint 2.7: risk, position sizing, and trade readiness

`src/features/risk-intelligence` consumes a Sprint 2.5 ranked opportunity (including optional Sprint
2.6 context) and caller-supplied normalized risk factors. It never recalculates the Sprint 2.4
Composite Score or Sprint 2.5 rank. Each factor retains value, weight, confidence, quality,
provenance, missing inputs, and explanation. Valid weighted evidence produces a separate 0–100 risk
score: 0–19 Very Low, 20–39 Low, 40–59 Moderate, 60–79 High, and 80–100 Very High. Invalid values
are rejected rather than clamped; missing or failed evidence remains unavailable and can make the
assessment incomplete.

Opportunity/risk relationships combine Strong, Neutral, or Weak opportunity with Low, Moderate, or
High risk. Trade readiness can be `READY_FOR_RESEARCH`, `WATCH`, `CONDITIONAL`,
`INSUFFICIENT_DATA`, `HIGH_RISK`, `CONFLICTED`, or `NOT_READY`; even
`READY_FOR_RESEARCH` is only a research workflow state. Structured, unresolved conflicts expose
opportunity/risk, technical/fundamental, catalyst/volatility, momentum/trend, liquidity,
market/sector, insufficient-data, concentration, catalyst-uncertainty, and timeframe tensions.

Position sizing requires explicit inputs. Risk per share is `abs(entry - stop)` (or a supplied risk
per share); allowed dollar risk is the smaller supplied constraint from
`equity × maximum-risk-percent / 100` and maximum risk dollars; shares are the floor of allowed risk
divided by risk per share, further limited by explicitly supplied notional, exposure, and
concentration caps. No account equity, prices, stop, volatility, liquidity, or balance is invented.
Zero risk per share is invalid rather than unlimited size.

Known limitations: factors and scenario evidence must be normalized by future trusted providers;
thresholds are not backtested or sector calibrated; no live provider or portfolio connection is
included. Risk classifications and sizing results are analytical illustrations from supplied data,
not guarantees, financial advice, automatic Buy/Sell instructions, or authority to transact. The
feature adds no brokerage connection, account movement, orders, wallet, payment flow, credential,
secret, or Supabase client.

## Sprint 2.9: Signal Fusion & Decision Intelligence

`src/features/signal-fusion` is the provider-neutral decision-intelligence boundary. It consumes the existing composite, opportunity, catalyst, risk, portfolio-fit, technical, and fundamental outputs; it does not reproduce their calculations. `assessSignalFusion` validates bounded numerical inputs, maps authoritative assessments into inspectable supportive/neutral/opposing/unavailable components, applies explicit configurable weights, and retains every unavailable weight rather than redistributing it.

The result separately reports alignment (`ALIGNED`, `MOSTLY_ALIGNED`, `MIXED`, `CONFLICTED`, `INSUFFICIENT_DATA`, or `UNAVAILABLE`), structured agreements, open conflicts, a primary timeframe, explicit cross-timeframe conflicts, component provenance, data quality, confidence factors, readiness, and a deterministic explanation. Confidence begins with usable-input completeness and is reduced by partial/stale/demo evidence and conflicts; agreement provides only a small bounded increase. Missing critical opportunity or risk intelligence gates the result, while absent catalyst and portfolio intelligence remain explicitly unavailable.

Decision labels such as `HIGH_CONVICTION_RESEARCH` and `SUPPORTIVE_RESEARCH` describe analytical support for **further research only**. They are not Buy/Sell recommendations, financial advice, forecasts, or executable trading instructions. The optional workspace card preserves all existing callers and repeats that boundary. No provider reconciliation or market prediction is attempted, and no missing signal is synthesized.
