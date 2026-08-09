# Seals AI Capital

## Version

0.1

## Mission

Build the world's smartest AI-powered investment research platform.

## Tech Stack

- React Native (Expo)
- TypeScript
- Supabase
- OpenAI API
- TradingView Charts

## Version 1 Features

- Login
- Dashboard
- Ask SAC AI
- Watchlist
- Trade Journal
- Day Trading
- Portfolio

## Design Style

Professional

Dark Theme

Gold accents

Fast

Modern

Simple

## AI Modules

- Core AI
- Day Trading AI
- Congressional Intelligence AI
- Trade Journal AI

## Future Modules

- Options AI
- Portfolio Manager
- Risk Manager
- Earnings AI
- Economic Calendar
- Alerts
- Push Notifications

Mission Statement:

Research First.
Profit Second.
Protect Capital Always.

## Version 1 Screens

1. Splash Screen

2. Login

3. Dashboard

4. Ask SAC AI

5. Portfolio

6. Watchlist

7. Day Trading

8. Congressional Intelligence

9. Trade Journal

10. Settings

## Database

Users

Watchlists

Trades

Portfolios

AI Conversations

Saved Research

Settings

Notifications

## Future Integrations

Robinhood

TradingView

OpenAI

Supabase

GitHub

News APIs

SEC Filings

Congressional Trading APIs

## Sprint 1.6 — Market Data Foundation

Market information flows through a provider-neutral `MarketDataService`, reusable cached hooks,
market components, and finally screens. The quote domain covers identity, price and movement,
session OHLC, volume, market capitalization, 52-week range, timestamp, source, and market status.
Fields that a provider may omit are nullable so the interface never invents a value.

The service supports single and batched quotes, market status, and symbol/company search. Market
status represents open, pre-market, after-hours, closed, or unknown. Screens may not call a market
provider directly. The current adapter is a local, explicitly labeled demo adapter; its values are
illustrative and are never described as live.

Production integration requires a new adapter that calls the trusted application backend at
`EXPO_PUBLIC_API_BASE_URL`. Market-provider API keys, signing secrets, rate limiting, normalization,
and upstream requests stay on that backend and must never be embedded in Expo. The public
`EXPO_PUBLIC_MARKET_DATA_MODE` setting only selects `demo` or a future `backend` adapter.

## Sprint 1.7 — Watchlist and Portfolio Foundation

Authenticated users own Watchlist entries and current Portfolio positions. `public.watchlist` stores a normalized symbol and optional display name; `public.portfolio_positions` stores a normalized symbol, positive quantity, and non-negative average cost. Both tables reference `auth.users`, cascade on user deletion, enforce one row per user/symbol, maintain timestamps, and index owner IDs. RLS permits select, insert, update, and delete only when `auth.uid() = user_id`.

Feature access follows `investment service → shared provider/hooks → reusable components → routes`. The service uses the single centralized Supabase client and explicitly scopes queries by user as defense in depth. Quotes and search continue through Sprint 1.6's `MarketDataService`; no duplicate vendor model or client is introduced.

Position calculations are derived, not persisted: market value is quantity × current price; cost basis is quantity × average cost; unrealized gain/loss is market value − cost basis; and return percentage is unrealized gain/loss ÷ cost basis × 100. Missing quotes produce unavailable quote-derived metrics, and zero cost basis safely produces an unavailable percentage. Current positions are not a transaction ledger and do not represent trades or real money. The migration must be manually applied to each Supabase environment; this local repository cannot verify a live deployment.

## Sprint 1.8 — Investment Research & Intelligence Foundation

Research follows `ResearchService → cached hooks → reusable workspace → symbol route`. Models cover
company identity, quotes, performance, fundamentals, technicals, news, risks, thesis, lifecycle
(`idle`, `loading`, `ready`, `partial`, `empty`, `error`, `retrying`) and source (`demo`, `live`,
`unavailable`). Watchlist, Portfolio, and Dashboard navigate to one route while existing providers
retain ownership of saved records, calculations, and market snapshots.

The local adapter is illustrative. It delegates quotes to the existing market service, leaves
unsupported metrics unavailable, provides no historical chart, and labels fixture content as demo
framework material. It does not represent AI analysis or live intelligence. Future live adapters
must normalize responses and access privileged providers only through a trusted backend.

Notes use a validated, replaceable, user-scoped contract and device-local AsyncStorage keyed by the
authenticated user ID. No migration or manual Supabase step is required and notes do not sync. A
future Supabase implementation must reuse the centralized client with owner-only CRUD RLS, indexes,
and timestamps. Visual verification requires a configured Expo runtime and public Supabase values
and was unavailable in this repository environment.

## Sprint 1.9 — News & Catalyst Intelligence Foundation

News follows `NewsService → deduplicated cached hooks → reusable components → market, personalized, and symbol workspaces`. Provider-neutral models cover sources, articles, events, categories, impact, sentiment, catalysts, importance, status, relevance, relationships, tags, and company summaries. Search accepts symbols, companies, headlines, categories, and catalyst types at the service boundary.

The isolated local adapter contains only labeled illustrative UI scenarios. It supplies no external URL or claimed real-world event timestamp and never represents content as live. A trusted adapter can be installed with `setNewsService` without changing UI and must normalize validated backend responses.

News cards request market context through Sprint 1.6 hooks; News never supplies prices. Personalized views consume symbols from Sprint 1.7's authenticated investment provider, without reimplementing ownership. Research links to the shared symbol workspace. Saved notes use user-ID-partitioned local AsyncStorage, require no migration, and do not sync. A future persistent service must reuse the centralized Supabase client with owner-only RLS. Live news requires a trusted backend and approved provider; provider secrets, service-role keys, brokerage credentials, and trading remain excluded.

## Sprint 2.0 — Fundamental Analysis Foundation

Fundamentals follow `FundamentalAnalysisService → normalized responses → deduplicated hooks → workspace`. Provider-neutral models retain metric availability, estimate/historical status, demo classification, fiscal/reporting periods, timestamps, freshness, source, and per-field availability. The service separates overview, statements, profitability, growth, valuation, health, history, summary, and configurable score inputs so a future adapter does not require UI changes.

Pure calculations return explicit unavailable results for missing inputs and zero denominators; they never leak NaN/Infinity or mutate source records. The score is a configurable category/input foundation, not an investment rating. The installed demo adapter intentionally supplies no actual company metrics or history and labels every response illustrative. A future live adapter must call an approved provider through the trusted backend, normalize and validate its response, preserve provenance, and keep all provider secrets server-side. It must reuse the centralized Supabase architecture if persistence is later required.

## Sprint 2.1 — Real Fundamental Data Integration

Fundamentals now flow through `FundamentalDataProvider → FundamentalAnalysisService → deduplicated hooks → FundamentalWorkspace`. The first real provider uses the public SEC EDGAR ticker directory and XBRL Company Facts endpoints for U.S. issuers. SEC concepts remain inside its adapter and are normalized into SAC metrics, periods, history, availability, and provenance so future providers do not require workspace changes.

Real snapshots retain CIK, filing/form/fiscal dates, source URL, provider name, retrieval/freshness timestamps, annual history, reliable discrete-quarter history, and explicit partial, empty, unavailable, or error behavior. Latest-filed duplicates take precedence. Missing facts remain null; calculations reject missing/non-finite inputs and zero denominators. SEC errors never trigger a demo fallback. Demo mode remains separately selected and visibly illustrative.

Bounded caches and in-flight deduplication avoid repeated SEC requests; no polling is used. SEC fundamentals are filed information, not guaranteed real-time pricing. Market-price-derived metrics remain unavailable without the separate real market-data boundary. No Supabase client, privileged key, brokerage integration, order placement, or trading execution is introduced. Future credentialed providers must run in a trusted server-side environment and normalize through `FundamentalDataProvider`.

## Sprint 2.2 — Technical Analysis Foundation

Technical data follows `TechnicalAnalysisService → MarketDataProvider → trusted backend/provider adapter`. Strong types cover normalized symbols, exchange, non-negative OHLCV candles, ISO timestamps, volume, nine standard timeframes, historical series, indicators, trend, momentum, volatility, support/resistance, explainable score components, freshness, errors, and `real | partial | demo | unavailable | error` provenance.

Indicator calculations are deterministic and independently testable. SMA/EMA require their period; RSI and ATR require period + 1 observations; MACD(12,26,9) requires 34 closes; Bollinger Bands and support/resistance require 20 closes; volume analysis and volatility require 21 observations; momentum(10) requires 11; and 20/50 trend detection requires 50. Missing, invalid, zero-denominator, or insufficient inputs return null with an explicit state—never invented zeros, NaN, or Infinity.

The technical score is a transparent weighted description: trend 30%, momentum 25%, volume 15%, volatility context 10%, and support/resistance 20%. It renormalizes across available inputs and exposes every component and reason. Bullish, bearish, and neutral are technical classifications, not Buy/Sell claims, financial advice, or guarantees.

The default provider is deliberately unavailable. No live or demo candles are fabricated. Future adapters must run credentialed upstream access on the trusted backend, normalize validated responses, preserve provider failures without silent demo fallback, declare timeframe coverage/freshness, and never expose secrets in Expo. Cache keys include symbol and timeframe, coalesce in-flight work, expire bounded results, and expose upstream freshness. No Supabase client, brokerage credential, order placement, execution, or financial transaction is added.

## Sprint 2.3 — Advanced Technical Analysis & Signal Intelligence

The provider-neutral pipeline now derives SMA, EMA, RSI, MACD, ATR, Bollinger Bands, VWAP,
stochastic %K/%D, ADX with +DI/-DI, ROC, average/relative volume, momentum, trend, volatility, and
observed support/resistance solely from validated OHLCV history. Every reading inherits `real`,
`partial`, `demo`, `unavailable`, or `error` provenance; insufficient history is unavailable and is
never replaced with an invented value.

Signal intelligence classifies descriptive trend, momentum, oscillator, moving-average, volume,
and range-proximity conditions. The explainable 0–100 score retains weighted factors and maps
0–20 to very bearish, 21–40 bearish, 41–59 mixed, 60–79 bullish, and 80–100 very bullish context.
It is technical context, not advice, a prediction, or an execution instruction. No provider secret,
Supabase client, migration, broker connection, order action, or transaction was added.
