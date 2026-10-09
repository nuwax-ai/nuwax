# 规格：project-conversation-sync

- 对应 intent：plans/20260916-project-conversation-sync-intent.md
- 状态：技术评审通过（Codex 评估修订，2026-09-16）

## 需求基线

以 intent 为准。本期处理同一 SPA 运行上下文内的项目/会话目录同步，优先保证常驻侧栏和当前详情。明确不做跨标签页、收藏、置顶、归档同步。

## 方案设计

### 架构落点

- `types` 定义两个判别联合事件：`conversation.changed` 与 `project.changed`。
- `utils` 提供类型化 emit/on、事件 ID、旧通道单向桥接和纯补丁函数。
- `hooks` 提供 React 订阅生命周期封装。
- `app.tsx` 显式安装一次旧通道桥接；支持 dispose，避免 HMR/测试重复注册。
- 写操作仅在接口成功后发事件；轮询发现已有会话不冒充“创建”。

现有数据所有权不变。能确定新值时先做幂等本地补丁；只知道集合变化时标记失效并静默重拉。

### 数据与契约

```ts
type ProjectRef = {
  projectId: string;
  projectType: AgentComponentTypeEnum;
  spaceId?: string;
};

type ConversationChangedEvent = {
  type: 'conversation.changed';
  operation: 'created' | 'updated' | 'deleted';
  conversationId: string;
  project?: ProjectRef;
  patch?: { topic?: string; icon?: string; taskStatus?: TaskStatus };
  reason: string;
  origin: string;
  eventId: string;
};

type ProjectChangedEvent = {
  type: 'project.changed';
  operation: 'created' | 'updated' | 'deleted';
  project: ProjectRef;
  patch?: { name?: string; description?: string; icon?: string | null };
  reason: string;
  origin: string;
  eventId: string;
};
```

规则：

- 同一次业务写操作只发一个领域事件，不另发重复的“项目会话集合变化”事件。
- legacy `conversation-updated`、`conversation-deleted`、`UpdateConversationListTaskStatus` 只桥接到新协议；旧事件本身继续保留。
- 项目匹配至少比较 `projectId + projectType`；有 `spaceId` 时同时比较空间。
- `ProjectPanel` 使用每项目 revision/dirty 标记。请求期间收到失效事件时，旧响应不得作为最终结果，完成后必须补拉一次。

### 平台/引擎矩阵

| 行为点 | legacy 会话线 | runtime 会话线 | 备注 |
| --- | --- | --- | --- |
| 自动会话标题 | 成功后发 updated | 成功后发 updated | runtime 当前为默认线 |
| taskStatus | 旧 eventBus 桥接 | 旧 eventBus 桥接 | 终态规则复用现有逻辑 |
| 当前详情标题 | model 补丁 | runtime 本地 state 补丁 | 按 conversationId 命中 |
| style1/2/3 侧栏 | 同一 ProjectPanel/useHomeSectionData 接入 | 同左 | ProjectPanel state 不属于 componentCache |

## 异常与失败场景

- 接口失败：不发事件，保持现有页面错误处理。
- 事件缺少项目归属：仍可按 conversationId 更新/删除已加载条目，但不做定向项目重拉。
- 目标项目或会话未加载：补丁 no-op；创建/删除且有项目归属时触发对应项目失效。
- 请求途中连续事件：revision 增长，当前请求完成后再次拉取；并发期间最多保持一个请求。
- 跨空间或项目类型不匹配：忽略事件。
- 旧事件重复或自身回声：补丁函数引用相等，重复事件不产生额外 state 更新。

## 测试计划

- `tests/directorySyncEvents.test.ts`：协议、桥接、退订、幂等补丁、项目身份匹配。
- `ProjectPanel` 测试：更新/删除补丁、创建失效、请求途中再次变脏、无重复重拉。
- `useHomeSectionData` 测试：新协议名称/状态/删除消费，旧桥接兼容。
- runtime/legacy 自动标题测试：成功后事件 payload 正确。
- 当前详情测试：只更新命中的 conversationId。
- 回归：`npx vitest run`、`npm run test:conversation`、`npm run lint:arch`，以及触达路径 TypeScript 零新增错误。
- 手工浏览器：style1/2/3 分别覆盖项目改名、会话改名、运行状态、首页新建项目/任务、AppDevPro 自动项目名。

## 已否决的备选方案

- 七个独立事件：创建事件与集合变化事件语义重复，容易造成双重重拉。
- 仅靠全量接口刷新：反馈延迟且会显著放大请求量。
- 在所有 service 函数内部自动广播：service 缺少 reason、origin、项目上下文，且更新接口不一定代表名称更新。
- 将轮询发现的 `devConversationId` 当成创建：观察到变化不等价于本页面完成创建。
- v1 使用 BroadcastChannel：当前目标是同一 SPA 跨页面同步，暂不扩大范围。
