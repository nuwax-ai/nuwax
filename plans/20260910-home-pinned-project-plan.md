<!--
nuwa-sdlc-kit v1.0.0 · content — 播种一次，本地所有（升级不覆盖）
SDLC Stage 3 · Build 工件模板
用法：spec 通过后在 plan mode 访谈产出，存 plans/YYYYMMDD-<slug>-plan.md。
闸门：接受本计划才允许动 src；实现偏离计划时同一 commit 更新本文件（plan-gate 会提醒）。
-->

# 实施计划：home-pinned-project

- 对应 spec：specs/home-pinned-project.md
- 状态：已接受（2026-09-10 用户批准计划）

## 改动文件清单

| # | 文件 | 动作(增/改/删) | 说明 |
| --- | --- | --- | --- |
| 1 | plans/20260910-home-pinned-project-intent.md | 增 | SDLC Stage 1 工件 |
| 2 | specs/home-pinned-project.md | 增 | SDLC Stage 2 工件 |
| 3 | plans/20260910-home-pinned-project-plan.md | 增 | 本文件（Stage 3 工件） |
| 4 | src/types/interfaces/userProject.ts | 改 | `UserProjectTabItem` +`devAgentId?`（契约先行）；新增 `PinnedProjectInfo` |
| 5 | src/types/interfaces/conversationInfo.ts | 改 | `ConversationCreateParams` +`projectId?`/`devAgentId?`（契约先行） |
| 6 | src/constants/recommendAgentPolicy.constants.ts | 增 | 推荐位策略单源：收编 Home 三映射 + 可选范围/默认命中四件套 |
| 7 | src/constants/recommendAgentPolicy.constants.test.ts | 增 | 策略单测（过滤/命中矩阵） |
| 8 | src/utils/homeSendPlan.ts | 增 | 首页发送计划纯函数（双分支拼装收编+上框优先级） |
| 9 | src/utils/homeSendPlan.test.ts | 增 | 计划单测（三分支+条件） |
| 10 | src/hooks/useHomePinnedProjectHandoff.ts | 增 | 上框 pageHandoffContext 读写封装（照 useSummonExpertHandoff） |
| 11 | src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.tsx | 改 | ProjectItem 字段补带；`+` 按钮接 pin（PageApp 维持 toast） |
| 12 | src/pages/Home/index.tsx | 改 | 上框消费/过滤/命中/防呆；handleEnter 瘦身为 build→execute；三映射改 import |
| 13 | src/hooks/useConversation.ts | 改 | attach +`projectId/devAgentId/sandboxId/redirectUrl`；跳转扩展 |
| 14 | src/types/interfaces/common.ts | 改 | ChatInputProps +`pinnedProject`/`onClearPinnedProject` |
| 15 | src/components/ChatInputHome/index.tsx | 改 | env-bar 上框栏渲染；目录栏/电脑选择器 `!pinnedProject` 门控 |
| 16 | src/components/ChatInputHome/index.less | 改 | 上框栏变体样式（徽标/删除钮/名称省略） |
| 17 | src/locales/i18n/{zh-CN,zh-TW,zh-HK,en-US,ja-JP}.ts | 改 | pinnedProject 四词条 |

## 实施顺序

1. types 契约字段（#4 #5）——无依赖先行。
2. 策略单源+单测（#6 #7）、发送计划+单测（#8 #9）——纯函数可并行验证。
3. handoff hook（#10）。
4. ProjectPanel 入口（#11）→ Home 薄接入（#12）→ useConversation（#13）。
5. ChatInputHome props/渲染/样式（#14 #15 #16）。
6. i18n 五语言（#17，Edit 前重读锚点防并行冲突）。
7. 全量验证：新增单测 + `npm run test:conversation`（基线对照）+ `npx tsc --noEmit` 触达零新增 + prettier。

## 证明成立的测试

- 新增测试：`recommendAgentPolicy.constants.test.ts`（无上下文全量/两类过滤/六开发类+对话型排除/命中矩阵）、`homeSendPlan.test.ts`（纯对话/项目类推荐/上框优先级/全栈 redirectUrl+devAgentId/workspaceDir 仅个人电脑）。
- 回归范围：`npm run test:conversation` 全绿（存量基线挂对照法）；`npx tsc --noEmit` 触达文件零新增（全库 515 预存不作门）。
- 手动走查（dev server，用户验收）：常规/全栈两路「+」跳首页上框、删除恢复、全栈命中失败提示、发送分别跳 /home/chat 与 app-pro。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 后端契约未 ready（conversation/create 不识别新字段） | 字段可选+后端忽略未知字段惯例；缺失 devAgentId 走「提示+手选」降级 | 参数拼装集中在 homeSendPlan/useConversation 两点，注释标注契约先行，可单独摘除 |
| Home 旧流程重构引入回归 | 三映射/双分支拼装**原样上移**（不改行为）+ 单测锁定等价 + test:conversation 门禁 | 各文件独立小 commit，可按文件粒度 revert |
| 并行会话共用 i18n 文件冲突 | Edit 前重读锚点再插；只 add 自己文件 | — |
| pageHandoffContext 刷新丢失上框 | 预期降级（与专家召唤先例一致），intent 已注明 | — |

## 偏离记录

（实现中偏离原计划的逐条补记：原因 + 同步的 commit）

1. 新增单测文件补显式 `import { describe, expect, it } from 'vitest'`（计划未提）：仓内 tsconfig 未注入 vitest 全局类型，既有 src 单测均显式导入，对齐基线后新测试文件 tsc 零新增。
2. ChatInputHome 上框项目图标渲染补走 `useAuthProtectedImageSrc`（计划只写了 icon 展示）：项目 icon 可能为 `/api/f/` 受保护地址，与专家召唤展示同款处理；无图标/加载失败回退 FolderOutlined。
3. homeSendPlan 项目分支的 `PageAppDev` 空间选择断言修正（计划期误判）：六个项目类功能类型均在空间选择器集合内（忠实收编原行为），fallbackSpaceId 仅缺省兜底；单测已按实际口径锁定。
4. 上框全栈默认命中补「类型兜底」（2026-09-10 用户走查反馈「没有选中」）：devAgentId 契约未 ready 时 findDefaultAgent 必然落空、每次上框都 toast 手选；改为精确命中优先、回落唯一同类型推荐自动选中（0 个/多个仍提示手选）。涉及 recommendAgentPolicy 新增 findTypeFallbackAgent + Home 命中链 ?? 兜底 + 单测矩阵。
