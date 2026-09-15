# 规格：conversation-page-cache

- 对应 intent：`plans/20260915-conversation-page-cache-intent.md`
- 状态：已实现，待登录态 E2E 验收

## 需求基线

统一维护会话页面缓存的创建、更新、激活、失效和 LRU 淘汰。缓存范围为右侧工作区与输入草稿，不并行缓存消息/SSE 运行时。

## 方案设计

### 架构落点

- `features/conversation/domain` 保存纯缓存类型和 LRU 规则。
- `features/conversation/runtime` 提供全局缓存 manager 和持久化适配。
- `features/conversation/react` 提供 `useSyncExternalStore` 订阅和开发调试视图所需接口。
- Chat 页面只通过 React 层更新当前会话的面板状态；输入框原草稿 API 改为 manager 兼容适配。

### 数据与契约

- 条目 key 为“路由面 × 会话 ID”；默认最多 5 个内存条目，容量由 manager 统一配置并限制在安全区间，后续可接租户或远端配置。
- 稳定面板状态为 `closed | filePreview | terminal | desktop | pagePreview`。
- 草稿保留旧 `chat_draft:*` key、version 1 和 24 小时 TTL，保证升级兼容。
- LRU 淘汰只释放内存条目，不删除持久化面板意图和草稿；删除会话才全部清除。
- 调试快照只暴露草稿字符数、技能数和更新时间，不暴露正文。

### VNC

VNC 使用独占实例策略：普通切会话时保留当前唯一实例；另一会话打开桌面时先卸载旧 owner 的 VNC，再挂载新 owner，确保不会出现多条 VNC 连接。会话条目只保存 `desktop` 显示意图。

## 异常与失败场景

- localStorage 不可用或数据损坏时降级为本次内存状态。
- 快速切换通过 revision 丢弃过期异步结果。
- 恢复到当前智能体不支持的视图时回退文件预览或关闭。
- 第 6 个条目创建前同步淘汰最久未访问的非当前条目。

## 测试计划

- 纯函数覆盖 LRU、当前条目保护、更新和失效。
- 草稿兼容测试覆盖旧 key、TTL、空内容清理和摘要脱敏。
- Chat 组件覆盖 A→B→A 面板恢复和第 6 个会话淘汰。
- E2E 覆盖终端/iframe 实例命中、唯一 VNC 和开发调试面板。

## 已否决的备选方案

- 直接缓存完整 ChatCore：全局 conversationInfo/chat model 会互相覆盖。
- 各组件自行缓存：无法统一限制资源和处理失效。
- 每会话一个 VNC：与云端电脑唯一语义冲突且资源不可控。
