# bug 2451 会话沙箱发送链路修复计划(卡4;含卡5 bug 2450 口径结论)

> 2026-09-20 · 罗东 · zt.nuwax.com bug 处理
> 关联:已关 bug 2341(resume 链路 gate,64db47a9d 补 agent.sandboxId 层)、3c3c4a624(参与者沙箱自选)

## 已确认口径(与需求方问答)

- **2451 后端契约**:会话执行按**创建时绑定的 sandboxId** 路由 → 修复核心 = 创建链路补参 + 统一取值顺序。
- **2450 方向反转**:他人项目上框 = 常规项目专属流程,参与者沙箱自选(云/个人电脑)是 3c3c4a624(09-19)设计定调,**云/个人均不限制 → 不改代码**,bug 卡上「应禁用」按此口径回复禅道。

## 根因(探索结论)

1. 发送契约只有 `sandboxId` 一个字段(云 = '-1' 哨兵 `CLOUD_SANDBOX_ID`,个人 = 沙箱 id);四级取值链(手动 > agent.sandboxId > sandboxServerId > 云)在 **4 处手工拷贝且漂移**:
   - `src/pages/Chat/hooks/useChatSandbox.ts:43-80`(手动优先,正确基准)
   - `src/pages/AppDevPro/index.tsx:388-419`、`src/pages/ConversationAgent/index.tsx:362-393`(同序拷贝)
   - `src/pages/EditAgent/PreviewAndDebug/index.tsx:451-464` **倒挂**:`sandboxServerId ?? agent.sandboxId ?? 手动 ?? '-1'` —— 手动选择第三,被会话快照/共享沙箱压死;且 `:725-727` agentInfo.sandboxId 传值同样压手动。
2. **会话创建只有 Home 路径带 sandboxId**(`src/hooks/useConversation.ts:90-115`);其余创建点全裸:
   - `src/pages/Chat/hooks/useChatConversation.ts:91-94`(清空重建)
   - `src/pages/EditAgent/PreviewAndDebug/index.tsx:383-386`(调试会话)
   - `src/pages/ConversationAgent/hooks/useConversationAgentChatSession.ts:184-187`(调试会话)
   - AppDevPro 页面内**零创建点**(会话由项目/Home 链路创建,绑定项目云沙箱)。

## 实施步骤

### 卡4(bug 2451)

**Step 0 抓包基线**(testagent/dev + ego-browser):三入口各复现一次「选个人电脑→发送」,记录 ①conversation/create 报文是否带 sandboxId ②chat 报文 sandboxId ③实际执行机器。独立会话页额外定位空 id 首条消息的创建链路。

**Step 1 统一取值单源(无条件做)**

- 新增 `src/utils/effectiveSandbox.ts`:`resolveEffectiveSandboxId({ selectedComputerId?, pushStateComputerId?, agentSandboxId?, sandboxServerId? })`,顺序 = 手动 > PUSH state(可选层)> agent.sandboxId > sandboxServerId,返回 ''(调用方 `|| CLOUD_SANDBOX_ID` 兜底)+ 单测。
- 四处收敛:前三处委托(行为不变);PreviewAndDebug 换用该函数 = 修倒挂,agentInfo.sandboxId 传值改为 `conversationInfo?.agent?.sandboxId || conversationInfo?.sandboxServerId || undefined`。

**Step 2 创建补参**

- Chat `handleClear`:带 `sandboxId: Number(getEffectiveSandboxId() || CLOUD_SANDBOX_ID)`(已知残留:清空后再改选,彻底修 = 创建时机后置,超本单)。
- 独立会话页首条消息创建链路按 Step 0 定位补参。
- PreviewAndDebug 调试会话创建带 `Number(手动 || agentConfigInfo?.sandboxId || -1)`;devMode 契约以抓包为准。
- ConversationAgent 调试会话创建同步补参。

**Step 3 AppDevPro 入口**(取证后落地):默认面板选择器 cloudOnly/锁会话绑定(对齐全栈「仅云端」策略);若抓包证明逐消息参数有效则只保发送链。

**Step 4 门禁与走查**:`npx vitest run` 相关套件 + `npm run test:conversation` 全绿、tsc 零新增、`lint:arch`;ego 走查三入口 + 云电脑不受影响 + 共享沙箱不回归。

### 卡5(bug 2450)

不改代码。禅道回复口径:「他人项目上框为常规项目专属流程;项目沙箱可能绑定创建者个人电脑、参与者不可用,故 09-19 起定调参与者可自选沙箱(云端/个人电脑+工作目录),云/个人均不限制,按设计关闭」。
备查(不实施):若产品翻案要禁,最小改法 = `Home/index.tsx:202-204` disablePersonalComputer 派生加 `|| pinnedParticipantSandbox` 一行。

## 风险与边界

- AppDevPro 方向未经需求方拍板(提问未答):按「先抓包、默认禁选」执行,证据表随交付给出。
- devMode 会话(智能体编辑页/会话面板)的创建参效力依赖抓包确认;Step 1 顺序修复对该入口无条件生效。
