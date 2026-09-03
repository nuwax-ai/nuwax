# 智能体电脑桌面仅云电脑可用（cloud gate）修复说明

> PC 已合入：`5706604ef` — `fix(conversation): 智能体电脑桌面仅云电脑会话可打开`（分支 `fix-agent-desktop-cloud-gate`，基底 dev `65dcce3b1`）计划工件：`plans/20260903-agent-desktop-cloud-gate-plan.md` 前置口径提交：`3f8a2426a` — `fix(Chat): 个人电脑会话隐藏打开智能体电脑按钮`

---

## 1. 现象

个人电脑会话（输入框电脑选择器显示如「我的电脑 544」）中：

1. 顶部「切换到智能体电脑（云电脑）」图标按钮**已按预期隐藏**（`3f8a2426a` 生效）
2. 但智能体电脑桌面面板**仍被自动打开**，VNC 区域报 `ttyd gateway route not found`
3. 面板背后 `apiEnsurePod` 已执行——为个人电脑会话**拉起了云端容器**，且 keepalive 轮询（60s 间隔、`pollingErrorRetryCount: -1`）持续保活，**面板关闭后轮询不停**

核心矛盾：**入口按钮按「仅云电脑（'-1'）」收敛了，但自动打开路径仍停留在「只判 hideDesktop」的旧口径上。**

---

## 2. 背景与口径

- 云电脑在电脑选择体系中 ID 固定为 `'-1'`；个人电脑是真实 sandboxId；共享电脑走 `sandboxServerId`
- 产品口径（`3f8a2426a` 起）：桌面视图**仅云电脑会话可达**——三个入口的 `isShowDesktop` 均要求生效电脑 ID `=== '-1'`：

| 页面 | 显隐条件位置 |
| --- | --- |
| Chat 主聊天 | `src/pages/Chat/index.tsx`（`isShowDesktop`，按钮渲染在 `components/LeftContent/index.tsx`） |
| ConversationAgent 会话面板 | `src/pages/ConversationAgent/index.tsx` |
| EditAgent 预览调试 | `src/pages/EditAgent/PreviewAndDebug/index.tsx`（注意 `effectiveSandboxId` 三级兜底后默认 `'-1'`） |

---

## 3. 打开路径全量盘点（修复前）

| # | 路径 | 触发方式 | 修复前守卫情况 |
| --- | --- | --- | --- |
| 1 | 手动点击图标按钮 | 页面回调 `handleOpenDesktopView` / `handleOpenDesktopPanel` | 按钮显隐已收敛，非云电脑点不到 ✅ |
| 2 | 后端 SSE `OPEN_DESKTOP` 事件（智能体执行电脑操作时下发） | `models/conversationInfo.ts` 的 `handleChangeMessageList` | **只判 `hideDesktop !== Yes`，不判电脑类型** ❌ |
| 3 | `restartVncPod` 重启电脑 | 文件面板「更多操作」→「重启客户端电脑」（非云电脑也显示该项） | 客户端分支 `hideDesktop !== Yes` 即切 desktop 视图（与注释语义相反）❌ |
| 4 | VNC 重连 `ensureDesktopConnection` | VncPreview retry | 仅 ensure + 保活，不切视图 ➖ |
| 5 | 恢复流 resume | sub 流复用同一个 `handleChangeMessageList` | 同路径 2 ❌ |

页面级兜底（`viewMode === 'desktop'` 且非云电脑时关视图）：**仅 Chat 有**（`3f8a2426a` 补的），ConversationAgent / PreviewAndDebug 缺失。

### keepalive 泄漏机制（路径 2/3 的连带伤害）

`openDesktopView` 流程：`stopKeepalive` → `openPreviewChangeState('desktop')` → `await apiEnsurePod` → 成功后 `runKeepalivePodPolling`。Chat 守卫 effect 在 re-render 时执行 `stopKeepalive`，但此时 `ensurePod` 尚未 resolve——resolve 成功后**再次启动轮询**，且 `pollingErrorRetryCount: -1` 无限重试。结果：个人电脑会话的云端容器被拉起并永久保活。

---

## 4. 修复方案（`5706604ef`）

原则：**gate 挡在 `ensurePod` 之前**（而不是开了再关）；自动路径与手动入口统一到「生效电脑 `=== '-1'`」一个口径。

### 4.1 模型层 `OPEN_DESKTOP` 分支加 gate

```ts
// 生效电脑判定：发送参数（live 路径页面传入的生效 id）> 共享电脑 > 兜底云电脑
String(params.sandboxId || conversationInfo?.sandboxServerId || '-1') === '-1';
```

- live 路径：Chat / PreviewAndDebug 发送参数均携带 `sandboxId`（页面解析的生效电脑），个人/共享电脑直接被挡，`ensurePod` / keepalive 完全不发生
- resume 路径：params 仅含 `{ conversationId }`（`useResumeStreamHandlers.ts`），落到兜底 `'-1'` 放行；绑个人电脑的会话由页面兜底 effect 收口（见 4.3）

### 4.2 `restartVncPod` 客户端分支不再开桌面

删除 `sandboxId !== '-1'` 分支里的 `openPreviewChangeState('desktop')`——原实现注释写「是否打开由 hideDesktop 决定」，实际是「非隐藏就打开」，与三入口 `isShowDesktop` 仅云电脑的口径冲突。修复后客户端电脑只重启容器。

### 4.3 ConversationAgent / PreviewAndDebug 补页面兜底

对齐 Chat `3f8a2426a` 的兜底 effect：

- ConversationAgent：`finalSelectedComputerId !== '-1' && isAgentDesktopOpen` → `closeAgentDesktop()` + `setCanShowFileView(true)`（该页面桌面面板由本地 state 驱动，非 model `viewMode`）
- PreviewAndDebug：`effectiveSandboxId !== '-1' && viewMode === 'desktop'` → `closePreviewView()`

### 4.4 计划偏离记录

计划原拟用 `conversationInfo.agent.sandboxId` 参与生效电脑推导，但 dev 基底的 `ConversationInfo.agent` 内联类型**没有该字段**（`feat-dong.0930` 才加），改为上述「发送参数 > sandboxServerId > 兜底」链。已在计划工件偏离记录中同步。

---

## 5. 验证

| 项 | 结果 |
| --- | --- |
| 会话相关定向测试（`tests/conversationInfoModel` / `src/models/conversationInfoMessageList` / `src/pages/Chat/index.test` / `src/pages/ConversationAgent` ×2） | 5 文件 81 用例全绿 ✅ |
| `tsc --noEmit` 改动文件 | 零错误（全库预存错误不作门）✅ |
| 全量 vitest | 31 失败均为 dev 预存（stash 基线对比确认：AgentIntervention / Antv-X6 / workflowSaveService 等，与本次改动无关）✅ |
| dev 基底无 `test:conversation` 脚本 | 已跑其等价物（定向 vitest run） |

基线对比方法（可复用）：`git stash push -u -m "<unique-tag>"` → 记录 sha → 跑同批测试 → `git stash apply <sha>` 恢复 → `git stash drop <sha>` 清理（勿用裸 `git stash pop`，stash 栈跨 worktree 共享）。

---

## 6. 已知边界与后续事项

1. **新线 runtime**：`desktop.open` effect 已定义（`features/conversation/runtime/effectDispatcher.ts`），消费端 `mainChatEffectsAdapter` / `runtimeLineHttp` 均直接执行 `openDesktop` 且**无电脑类型判断**；当前无生产者（runtime session 未产出该 effect），接线时必须带上同样的 gate
2. **resume 路径**：模型层 gate 对绑个人电脑的会话不生效（无发送参数可读），依赖页面兜底 effect 兜住视图；`ensurePod` 在 resume 场景仍可能发生——彻底收口需把生效电脑 ID 下沉到 model（如页面 setSelectedComputerId 时回写）
3. **口径三态**：Chat 的 `finalSelectedId` 兜底是 `''` 不是 `'-1'`（`useChatSandbox.ts`）——未手动选择电脑的云电脑会话里，按钮显隐 / 兜底守卫 / 自动打开三处判定各说各话；`3f8a2426a` 以来靠「按钮隐藏 + 守卫关闭」实际兜住，未再收口
4. **环境注意**：worktree 无 `src/.umi` 时 vitest 因 `tsconfig.json extends ./src/.umi/tsconfig.json` 全挂，先跑 `npm run setup`；git hook 需要 `PATH` 前置主仓库 `node_modules/.bin`（worktree 无自己的 node_modules）
