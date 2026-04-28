# I18n Contributing Guide

This guide describes how to add or maintain a locale in the Nuwax frontend without breaking the runtime fallback chain.

## Supported Locales

- `zh-CN`: Simplified Chinese
- `zh-TW`: Traditional Chinese
- `zh-HK`: Hong Kong Traditional Chinese
- `en-US`: English
- `ja-JP`: Japanese

## Add A Locale

1. Add the Umi locale file under `src/locales/<locale>.ts`.
2. Add the runtime dictionary under `src/locales/i18n/<locale>.ts`.
3. Register the dictionary in `src/locales/i18n/index.ts`.
4. Register third-party locale adapters in `src/utils/i18nAdapters.ts`.
5. Add the locale to import defaults in `src/constants/i18n.constants.ts` when it needs to be available in i18n management screens.
6. Run the i18n checks and confirm there are no missing keys.

## Verification

```bash
node scripts/i18n-governance-report.js
node scripts/check-hardcoded-i18n.js
pnpm test --run
pnpm exec tsc --noEmit
```

When adding translated copy, keep product terms consistent: Agent, Workflow, Plugin, Skill, Knowledge Base, and Data Table should use the same translation across all screens.
