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

| Variable                        | Purpose                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`      | Public URL for the Supabase project.                                                 |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable or legacy anonymous key. This must never be a service-role key. |
| `EXPO_PUBLIC_API_BASE_URL`      | Trusted application backend or Supabase Edge Functions base URL.                     |
| `EXPO_PUBLIC_MARKET_DATA_MODE`  | Public adapter selection. Use `demo`; `backend` is reserved for a future adapter.    |

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
