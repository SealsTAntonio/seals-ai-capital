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
