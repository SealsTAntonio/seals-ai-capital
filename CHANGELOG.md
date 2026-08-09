# Changelog

All notable changes to Seals AI Capital are documented in this file.

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
