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

Use `npm run android`, `npm run ios`, or `npm run web` to open a specific platform. Before
submitting changes, run the complete local verification suite:

```bash
npm run check
```

## Environment configuration

Expo inlines variables beginning with `EXPO_PUBLIC_` into the application bundle. Copy
`.env.example` to `.env.local` and configure:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Public URL for the Supabase project. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable or legacy anonymous key. This must never be a service-role key. |
| `EXPO_PUBLIC_API_BASE_URL` | Trusted application backend or Supabase Edge Functions base URL. |

OpenAI must be called by the trusted backend identified by `EXPO_PUBLIC_API_BASE_URL`. **Never
store an OpenAI API key in the application or in an `EXPO_PUBLIC_` variable.** The API service in
`src/services/api.ts` provides the client-side boundary for future AI features.

## Project structure

```text
.
├── app/                    # Expo Router routes and navigation layouts
│   ├── _layout.tsx         # Root navigation and global visual theme
│   └── index.tsx           # Intentionally empty foundation route
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

## Integration boundaries

- **Supabase:** call `getSupabaseClient()` from `src/lib/supabase.ts`. The client is initialized
  lazily, persists native sessions with AsyncStorage, and manages token refresh with app state.
- **OpenAI:** call the project's trusted API through `apiRequest()` in `src/services/api.ts`.
  Provider credentials, prompts that must remain private, rate limiting, and OpenAI calls belong on
  the server.

## Available scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo development server. |
| `npm run android` | Start Expo and open Android. |
| `npm run ios` | Start Expo and open iOS. |
| `npm run web` | Start Expo for web. |
| `npm run lint` | Run Expo's ESLint configuration. |
| `npm run typecheck` | Run TypeScript without emitting output. |
| `npm run format` | Format the repository with Prettier. |
| `npm run format:check` | Verify formatting without modifying files. |
| `npm run check` | Run lint, type checking, and formatting checks. |
