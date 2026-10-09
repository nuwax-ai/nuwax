# runtime 桥接死循环与终态 text 覆盖修复

> 修复日期：2026-08-26 · 分支：`feat/conversation-auto-collapse` · 提交：`73dab3755`（P1 死循环）、`69eb89b9d`（P2 终态覆盖，含回归测试）
>
> 来源：8-26 上午 24h 提交审查（审查对象 `9f20428e1` docs+演示回归、`055831262` 预览标题修复等）。问题等级：P1（flag 门控，生产默认不触发）+ P2（功能缺陷）。本报告为该轮处置唯一存档文档。

---

## 1. P1：runtime 桥接 effect 自激死循环

### 1.1 现象

URL 带 `?conversationRuntime=1`（新线 runtime session flag）进入会话页即触发持续渲染循环：CPU 占用升高、console 持续输出，直到离开页面。flag 默认关闭，生产用户不受影响。

### 1.2 根因链（五环，缺一不断）

```text
① chat.ts:78 handleChatProcessingList 是裸函数（未 useCallback）
   → 每次 chat model 重跑都产生新函数身份
② umi4 useModel 用 fast-deep-equal 比较 model 返回对象
   → 函数属性按引用比较，身份不同即判「对象不等」→ 通知所有消费组件重渲染
③ useConversationRuntimeSession.ts:241-249 桥接 effect 把该函数放进 deps
   → 函数身份变化使 effect 重新执行
④ effect 无条件调用 handleChatProcessingList(messageList.flatMap(...))
⑤ chat.ts setProcessingList updater 每次返回 Array.from(processedMap.values())
   → 恒为新数组引用 → state 必然更新 → model 重跑 → 回到 ①
```

umi4 实现依据：`@umijs/plugins/dist/model.js` → `libs/model.tsx` 模板，Executor effect 无 deps + fast-deep-equal bailout。**通用教训：umi4 model 返回对象里的非 memo 函数，放进任何 effect deps 都会构成自激励环。**

### 1.3 为什么旧线同构却不循环

旧线 `useConversationActiveState.ts:177` 的 `syncMessageListRuntimeState` 同样以 `handleChatProcessingList` 为 useCallback deps，但该函数是「消息 state 提交后手动调用」（rAF 派生同步），不是随 deps 变化自动执行的 effect。函数身份变化只导致 useCallback 级联换身份与消费方无效重渲染，没有「自动再调用」一环，环不闭合。代价是性能浪费而非死循环。

### 1.4 修复（`73dab3755`）

```diff
 src/models/chat.ts
-  const handleChatProcessingList = (incomingList: ProcessingInfo[]) => {
+  const handleChatProcessingList = useCallback((incomingList: ProcessingInfo[]) => {
     ...合并 upsert 逻辑不变...
-  };
+  }, []);
```

- `useCallback(..., [])` 合法性：函数体仅闭包 `setProcessingList`（setState 返回值，恒稳定）与 `shouldReplaceProcessingItem`（纯函数）。
- `shouldReplaceProcessingItem` 从 model 内提为模块级函数：避免 useCallback 空依赖闭包住首轮的函数引用（行为等价但消除过期闭包隐患与 lint 报警）。
- 附带收益：旧线 `useConversationActiveState` / `conversationInfo` / `conversationAgent` 等全部 `useModel('chat')` 消费方的无效重渲染一并消除——model 返回对象在 processingList 内容不变时即可通过 fast-deep-equal bailout。

### 1.5 验证

- `npx tsc --noEmit`：改动文件零错误（测试文件的 vitest-globals 报错为存量环境噪音）。
- ESLint 改动文件零告警。
- `src/features/conversation` + `src/models` 48 测试全过；失败 8 例与干净树（stash 后）基线逐一致，均为存量环境失败。

---

## 2. P2：终态投影用 reconcile 前 text 覆盖，补投 OpenUI 块丢失

### 2.1 现象

工具结果只在 `finalResult.componentExecuteResults` 里补投（流式期间未下发 RENDER_UI PROCESSING 事件）的会话，终态后消息 text 中不出现对应的 `markdown-custom-process` 自定义块——下游 MarkdownCustomProcess / OpenUiArtifactView 找不到条目，详情为空、按钮禁用。

### 2.2 根因

终态收敛链路中，reconciler 负责把补投结果写进 text：

```text
reduceTerminalEvent(FINAL_RESULT)
  → reconcileFinalMessageState            reconcileFinalMessageState.ts:124
    → patchInterventionsFromExecuteResults   :53  遍历 componentExecuteResults
      → processInterventionSsePatch            → applyOpenUiToolCallSseEvent
        → text: getCustomBlock(currentMessage.text, processingItem)   :183
          ↑ 自定义块在此追加进 text（幂等：已有同 executeId 块则不重复）
```

而 `reduceTerminalEvent.ts:90-97`（修复前）在 spread reconciler 返回值**之后**用 reconcile 前的值整体覆盖 text：

```ts
const message = {
  ...(reconcileFinalMessage(currentMessage, finalResult) || {}),
  text: closeOpenThinkBlock(),   // ← 基于 currentMessage.text（reconcile 前）
  ...
};
```

`closeOpenThinkBlock` 闭包的是 `currentMessage.text`，把 reconciler 刚追加的补投块全部盖掉。流式期间正常下发过 RENDER_UI 事件的场景不受影响（块在 reconcile 前已在 text 里）。

### 2.3 修复（`69eb89b9d`）

先取 reconciler 返回值，思考收口基于 reconcile 之后的 text/thinkBlocks：

```diff
+  const reconciled = (reconcileFinalMessage(currentMessage, finalResult) ||
+    {}) as Partial<MessageInfo>;
   const message = {
-    ...(reconcileFinalMessage(currentMessage, finalResult) || {}),
-    text: closeOpenThinkBlock(),
+    ...reconciled,
+    text: closeThinkBlock(
+      reconciled.text || '',
+      reconciled.thinkBlocks?.[reconciled.thinkBlocks.length - 1] || '',
+    ),
     ...
   } as MessageInfo;
```

- ERROR 分支不经 reconciler，维持基于 `currentMessage.text` 收口的原行为（`closeOpenThinkBlock` 保留为该分支使用）。
- `shouldRemove`（用户取消 + 无输出则移除乐观消息）语义随之更准：reconcile 后 text 含补投块即视为「有输出」，不再误删。
- reconciler 返回 null 时降级 `{}`，与原 `|| {}` 行为一致。

### 2.4 验证

新增回归测试 `src/features/conversation/domain/reduceTerminalEvent.test.ts` 2 例：

1. 终态 text 同时含原文与 reconciler 写入的补投块；
2. 思考收口 finalizer 收到的 text 含补投块、其输出成为终态 text。

反向验证：`git stash` 撤掉修复后 2 例全红，恢复后全绿。测试用同形 stub reconciler 表达「reconciler 会往 text 追加块」的契约，不耦合 AgentIntervention 依赖链（真 reconciler 链引入 `@nuwax-ai/openui-mcp`，会踩当前环境的 esbuild `TextEncoder instanceof Uint8Array` 不变量，属存量环境问题，见 §4）。

---

## 3. 关联交付：预览缓存版本号

同轮审查的 P2「file-preview 缓存版本号未 bump」处置与操作项单独立档：[docs/file-preview-cache-version-bump.md](../../file-preview-cache-version-bump.md)（提交 `d50c5119e`；gitlab/test 需带新 `?v=` 重发一次 dist，否则缓存命中者持续拿到去后缀坏版）。

---

## 4. 遗留（本轮未动，处置待定）

| 项 | 说明 |
| --- | --- |
| 桥接未过滤无 executeId 项 | 新线桥接（useConversationRuntimeSession.ts:244-248）直接 flatMap `message.processingList`；旧线 `conversationAgent.ts:243-260` 有 `.filter(item => item?.result?.executeId)`（滤掉 SandboxStart 等无执行 ID 条目）。不过滤时无 executeId 项在 chat model 以 `_${type}` 为 key，跨消息互踩 |
| formatDuration 进位瑕疵 | `formatDuration(119500)` → `"1m60s"`，应进位为 `"2m0s"` |
| esbuild 环境不变量 | 本机凡 import 链带 `@nuwax-ai/openui-mcp` 的测试文件 collect 阶段即报 `TextEncoder instanceof Uint8Array` false 而收不了（含存量 reconcileFinalMessageState.test.ts 等），属环境问题非代码问题，影响面待查 |
