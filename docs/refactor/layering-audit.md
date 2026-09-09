# 分层治理审计与修复记录（scoped 收敛版）

> 分支 `refactor/layering-cohesion-scoped`（worktree：`.claude/worktrees/layering-refactor`，基于 **feat-dong.0930@b351fc483**）。 **范围声明**：本分支只覆盖负责域——**会话相关、首页会话框、主题菜单导航（含客户端适配壳）**，外加全局分层红线基建。全量版（含 AppDevPro/连接器/系统管理域等搬迁）保留在备份分支 `refactor/layering-cohesion`（8 提交@0466dff66），未合入；相关域负责人可另行取用。原则：**零行为变化**——文件移动、import 路径改写、类型下沉、红线配置与文档。

## 1. 基线快照（2026-09-09，基座 b351fc483 = feat-dong.0930@origin）

| 指标 | 基线值 |
| --- | --- |
| 全量 `vitest run` | 159 文件（20 失败/139 过）；1310 用例（23 失败/1281 过/6 跳过） |
| `test:conversation` | 52 文件（1 失败/51 过）；490 用例（1 失败/489 过） |
| `tsc --noEmit` | 519 错 |

**门禁口径**：全量失败文件集合零新增；tsc 总数 ≤519 且新增文件为零；`test:conversation` 失败集合 ⊆ 基线 1 条。

test:conversation 基线失败（既有，非本线引入）：

```
tests/conversationInfoModel.test.ts > conversationInfo model > OPEN_DESKTOP 云电脑 gate > 纯云电脑会话（无个人/共享绑定，兜底 -1）放行并 ensurePod
```

## 2. 保留域改动清单（52 文件，+2676/−715）

### 2.1 红线基建

`.eslintrc.js`（非页面层 →pages **error**、服务层禁 hooks/components warn）、`.dependency-cruiser.cjs` + `tsconfig.depcruise.json`（别名解析，勿用 src/.umi/tsconfig——其 `moduleResolution:"bundler"` 会让 paths 失效）、`.dependency-cruiser-known-violations.json`（存量 121 条冻结，只防新增）、package.json `lint:arch` 脚本、engineering-conventions §4.1~4.3 扩写。

### 2.2 会话相关

- `ConversationStatus` 下沉 business-component（UnifiedChatSession 引用与测试 mock 同步）
- `devLogParser` 下沉 `src/utils`（服务会话控制台 DevLogPanel，解除 components→pages 倒挂；AppDev/AppDevPro/ConversationAgent 连带引用更新）
- `markdownProcess` 下沉 `src/utils`（utils/chatUtils、hooks/useAppDevChat 倒挂修复）
- `NestedForm copy 2.tsx` 死副本删除

### 2.3 首页会话框

`CreateModel` 下沉 business-component（ChatInputHome/ModelSelector 倒挂修复；SpaceLibrary/GlobalModelManage/SpaceResource/ModelManage 连带引用）。

### 2.4 菜单导航/权限（含客户端适配壳）

- MenuPermission 域类型下沉 `src/types/menuPermission/`（4 文件）
- MenuPermission 域 services 上提 `src/services/menuPermission/`（4 文件）
- 连带引用修复：menuModel、layouts（DynamicMenusLayout utils/SidebarSearchModal）、utils/permission、types/interfaces/menu、MenuPermission/UserManage/SystemManagement/Content 等全部消费点

## 3. 违规削减（scoped 口径，depcruise 对照基线 b351fc483）

| 规则 | 修复前 | scoped 后 |
| --- | --- | --- |
| types/utils/models/layouts → MenuPermission 页面内模块 | 存量 | **0** |
| ChatInputHome/ModelSelector → pages | 1 | **0** |
| DevLogPanel / services.appDev → pages/AppDev/utils | 2 | **0** |
| chatUtils / useAppDevChat → pages/AppDev/utils | 2 | **0** |
| 存量冻结（回退域恢复后） | — | 121 条（页面互引 59、utils→services 32、non-pages→pages 14、环 11、hooks→components 4、components→models 1） |

门禁结果（2026-09-09）：tsc **515**（<519，顺带消 4 条存量）；全量 vitest 失败文件集合=基线零新增；test:conversation 490 用例仅基线同款 1 失败；`lint:arch` 零新增。

## 4. 遗留清单

1. 回退域（AppDevPro/连接器/系统管理域/AppDev 散件/Antv-X6/订阅链）的搬迁成果在全量分支 `refactor/layering-cohesion`，待各域负责人认领后以本线同款模式（类型/services 下沉 + 基线冻结）分批推进。
2. `services/agentConfig.ts:1` type-only 引 AgentIntervention 类型（会话域类型，留待会话域治理线）。
3. 页面互引存量 59 条、utils→services 32 条、hooks→components 4 条、components→models 1 条、模块内局部环 11——均冻结于 depcruise 基线，只减不增。
4. CI 接入 `lint:arch` 未做（当前本地 + 本文档约束）。
5. 巨型页面拆分未启动（conversationInfo.ts 归会话域双轨线）。

## 5. 后续方向：会话消息渲染 SDK

本分支之上的下一阶段（feat/conversation-sdk）：把 presentation-v2 纯函数层 + runtime 会话线（transport/store/reducer/React 绑定，零 umi 依赖）+ 渲染 React 层模块化为 `src/sdk/conversation` + `packages/conversation-sdk`，三方 `init({baseUrl, token})` 快速接入女娲 chat API。详见 docs/conversation/sdk/（随 SDK 分支提交）。

## 6. dev server 页面抽查

worktree 起独立端口 dev server 冒烟（验证完即关）：关键路由 200 + 编译零错误。抽查面=保留域：全局菜单/导航壳（P0）、菜单权限四页、用户管理授权弹窗、首页会话框（含模型选择器）、Chat 会话状态条。
