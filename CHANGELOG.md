# Changelog

All notable changes to Seals AI Capital are documented in this file.

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
