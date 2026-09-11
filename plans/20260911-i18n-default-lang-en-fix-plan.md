# 修复「一进入就是英文」：i18n 默认语言回归（2026-09-11）

## 背景与根因

2928abb1d（默认语言改简体中文 + 显式选择标记）只防住了 **localStorage 侧**的旧默认残留（无 `umi_locale_user_set` 标记时忽略 `umi_locale`、回落 zh-cn），但漏了**账号侧**残留的回流路径：

1. 每次进入应用，`src/app.tsx:62-63` → `UserService.getUserInfo()`（优先吃本地陈旧 `USER_INFO` 缓存，`userService.ts:121-130`）→ `syncLangFromUserInfo`（`src/services/i18nRuntime.ts:193-209`）。
2. `syncLangFromUserInfo` 只要 `user.lang` 非空就**无条件** `markLangUserSet()` + `setCurrentLang(user.lang)`——「平台账号语种=用户自己的设置」这个假设对旧默认残留不成立：历史版本默认英文，存量账号 `lang='en-US'` 从未被用户选过。
3. 于是每次进入都把 `initI18n` 刚归位的 zh-cn 顶回 en-us，并写死 `umi_locale_user_set='1'`；下次进入 `initI18n`（L294-301）直接吃缓存的 en-US——闭环，即「一进入就是英文」。

相邻问题（顺带修，用户定调）：

- 4010 清存储（`authStorageCleanup.ts`）只保留主题三键，语言两键被清，显式选择不持久。
- 登录页/设置页语言下拉初值取后端 `isDefault`（英文），界面中文但下拉显示英文。

## 方案（用户定调：标记版本升级一次性归位 + 顺带修两个相邻问题）

1. **决策抽纯函数**：新建 `src/services/i18nLangPolicy.ts`——`normalizeLang` 迁入、`isUserSetExplicit`（只认 `'2'`）、`resolveEntryLang`、`shouldSyncAccountLang`（`en-us` 且非显式 → 残留忽略）。
2. **标记版本升级**：USER_SET 值 '1'→'2'。存量 marker='1'（被脏同步写入）一次性归位 zh-cn；真显式选过英文的用户重选一次（prerelease 可接受）。写入单点 `markLangUserSet`，三处调用自动覆盖。
3. **残留防护**：`syncLangFromUserInfo` 入口加 `shouldSyncAccountLang` 守卫——账号侧 en-US 残留在无显式标记时被忽略（不顶中文、不置标记）；非 en-US 语种不可能是旧默认，照常同步。
4. **4010 保留语言两键**：`authStorageCleanup.ts` 保留清单加 `umi_locale` + `umi_locale_user_set`。
5. **下拉初值改当前语言**：LoginLangSwitcher / LanguageSwitchPanel 先按 `getCurrentLang()` 匹配，回落后端 `isDefault`。

## 验证

- `npx vitest run src/services/i18nLangPolicy.test.ts` 全绿（显式 import vitest 全局，仓库惯例）。
- `npx tsc --noEmit` 触达文件零新增（全库基线 ~514 预存对照）。
- 浏览器走查（用户 3000）：① 脏 profile（en-US+marker'1'）刷新 → 中文；② 清空存储 → 中文；③ 登录页显式选英文 → 持久（marker='2'）；④ 后端 lang='en-US' 账号登录 → 仍中文；⑤4010 清理后语言两键保留。

## 明确不做 / 已知代价

- 不主动把 zh-cn 回写后端账号偏好（会覆盖真选英文用户的服务端数据）；不动 getUserInfo 缓存策略（残留防护已覆盖其影响）。
- umi baseNavigator 首帧闪现与 `umi_locale` 小写格式窗口属预存行为，不在此单。
- 结构性代价：真选英文的用户在**新设备**首登会被当残留回落中文，需重选一次（prerelease 阶段可接受）。
