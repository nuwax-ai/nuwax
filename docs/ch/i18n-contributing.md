# 多语言贡献指南

本文说明如何在 Nuwax 前端新增或维护语言包，同时不破坏运行时兜底链路。

## 当前支持语言

- `zh-CN`：简体中文
- `zh-TW`：繁体中文
- `zh-HK`：香港繁体中文
- `en-US`：英文
- `ja-JP`：日文

## 新增语言流程

1. 在 `src/locales/<locale>.ts` 增加 Umi locale 文件。
2. 在 `src/locales/i18n/<locale>.ts` 增加运行时字典。
3. 在 `src/locales/i18n/index.ts` 注册该字典。
4. 在 `src/utils/i18nAdapters.ts` 注册 Ant Design、dayjs、Umi 等第三方 locale 适配。
5. 如果该语言需要出现在多语言管理导入默认值中，在 `src/constants/i18n.constants.ts` 注册默认字典。
6. 运行 i18n 检查，确认没有缺失 key。

## 验证命令

```bash
node scripts/i18n-governance-report.js
node scripts/check-hardcoded-i18n.js
pnpm test --run
pnpm exec tsc --noEmit
```

新增翻译时请保持产品术语一致，例如 Agent、Workflow、Plugin、Skill、Knowledge Base、Data Table 等，不要在不同页面使用不同译法。
