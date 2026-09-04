# 实施计划：智能体电脑桌面仅云电脑可用（cloud gate 收口）

- 对应 spec：无（缺陷修复，事实源 = 会话分析 + 3f8a2426a 的后续补口）
- 状态：已接受
- 背景：个人电脑会话中「切换到云电脑」入口按钮已按 `finalSelectedId === '-1'` 收敛（3f8a2426a），但**自动打开路径仍在模型层绕过该口径**：后端 `OPEN_DESKTOP` SSE 事件与 `restartVncPod` 客户端分支都会把视图切到 desktop，导致个人电脑会话桌面面板被打开（ttyd gateway route not found），且 `apiEnsurePod` + keepalive 轮询（`pollingErrorRetryCount:-1`）被无谓拉起。

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `src/models/conversationInfo.ts` | 改 | `OPEN_DESKTOP` 分支加「生效电脑必须是 '-1'」gate；`restartVncPod` 客户端电脑分支不再切 desktop 视图（仅重启） |
| 2 | `src/pages/ConversationAgent/index.tsx` | 改 | 补兜底 effect：`finalSelectedComputerId !== '-1'` 且面板开着 → 关面板并恢复文件预览（对齐 Chat 3f8a2426a） |
| 3 | `src/pages/EditAgent/PreviewAndDebug/index.tsx` | 改 | 补兜底 effect：`effectiveSandboxId !== '-1'` 且 `viewMode === 'desktop'` → `closePreviewView()` |

## 实现口径

1. **gate 取值**（与 `useChatSandbox.getEffectiveSandboxId` 优先级一致，模型层可见信息）：
   ```ts
   const effectiveSandboxId =
     params.sandboxId || // live 发送路径携带（Chat/PreviewAndDebug 均传）
     conversationInfoRef.current?.agent?.sandboxId || // 智能体绑定个人电脑
     conversationInfoRef.current?.sandboxServerId || // 共享电脑
     '-1'; // 兜底=云电脑
   ```
   `String(effectiveSandboxId) !== '-1'` → 不切视图、不 ensurePod（修 keepalive 泄漏的根：gate 挡在 ensurePod 之前）。 resume 路径 params 仅 `{conversationId}`（`useResumeStreamHandlers.ts:358`），自然落到 conversationInfo 推导——行为：绑了个人/共享电脑的会话被挡，纯云电脑会话保留原自动打开设计。
2. **`restartVncPod`**：删除客户端分支里的 `openPreviewChangeState('desktop')`（原实现与注释"是否打开由 hideDesktop 决定"不符，且违背三入口 `isShowDesktop` 仅云电脑的产品口径）；云电脑分支行为不变。
3. **不改动**：`openDesktopView` 本体（手动按钮路径已被显隐 + 页面兜底双保险覆盖，其无 sandbox 入参，强改需动 5 处调用点，收益低）；新线 `desktop.open`（当前无生产者，接线时另带 gate）。

## 实施顺序

1. 模型层两处 gate（无依赖）
2. 两个页面兜底 effect（无依赖，可与 1 并行）
3. `npm run test:conversation` 全绿 + 改动路径 tsc 零新增

## 证明成立的测试

- 新增测试：模型层 gate 逻辑属 umi model（vitest 禁 import umi 模块），以 `test:conversation` 回归覆盖既有行为不劣化；gate 分支为纯条件删除/前置，无新函数
- 回归范围：`npm run test:conversation`（会话合同网，必跑全绿）；改动路径 `tsc --noEmit` 对比基线零新增

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 云电脑会话被误挡（params.sandboxId 语义不符预期） | live 路径 Chat/PreviewAndDebug 发送时均传生效 id，'-1' 即云电脑；resume 推导兜底 '-1' 放行 | revert 单 commit |
| ConversationAgent 兜底 effect 误关面板 | 条件与 Chat 兜底同构（仅在非云电脑时触发），面板本就不该在非云电脑打开 | revert 单 commit |
| restartVncPod 行为变化影响依赖旧暴露面的流程 | 仅删除"个人电脑重启时顺带开桌面"的旁支，重启主流程不变 | revert 单 commit |

## 偏离记录

（实现中偏离原计划的逐条补记：原因 + 同步的 commit）

- 首版实现（5706604ef）漏掉取值链第 2 层 `agent.sandboxId`，仅实现三级（发送参数 > 共享电脑 > 兜底），并把「绑个人电脑的会话」推给页面层兜底 effect 收口——与本文「resume 由 conversationInfo 推导拦截」的口径不符，resume 路径仍会误拉起云端 pod + keepalive。2026-09-04 评审发现，已补齐四级链并新增模型层 gate 用例防回归（tests/conversationInfoModel.test.ts `OPEN_DESKTOP 云电脑 gate`）。
