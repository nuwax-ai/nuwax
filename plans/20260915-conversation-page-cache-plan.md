# 实施计划：conversation-page-cache

- 对应 spec：`specs/conversation-page-cache.md`
- 状态：已完成（E2E 待登录态环境执行）

## 改动文件清单

| # | 文件 | 动作 | 说明 |
| --- | --- | --- | --- |
| 1 | `src/features/conversation/{domain,runtime,react}/conversationPageCache*` | 增 | 统一缓存模型、manager、订阅 hook |
| 2 | `src/pages/Chat/**` | 改 | 面板状态恢复、缓存激活与工作区实例宿主 |
| 3 | `src/components/business-component/ChatInputUnified/**` | 改 | 草稿接入 manager、调试面板展示缓存快照 |
| 4 | `tests/conversation/**` | 增 | LRU、持久化、生命周期与调试视图测试 |

## 实施顺序

1. 先写缓存策略和 manager 的失败测试，再实现内核。
2. 将现有草稿存储迁移为 manager 兼容适配，保持存储协议不变。
3. Chat 接入缓存激活和面板持久化恢复。
4. 提取并缓存右侧工作区实例，接入可配置容量的 LRU 和 dispose（默认 5）。
5. VNC 提升为唯一共享宿主。
6. 在现有 ConversationDebugFab 中加入缓存仪表盘。

## 证明成立的测试

- 新增：缓存 manager、草稿适配、Chat A→B→A、LRU 淘汰和 VNC 单例测试。
- 回归：`npm run test:conversation`、`npm run lint:arch`。
- 合入前：`npm run e2e:conversation`。

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 隐藏实例资源泄漏 | 有界 LRU + 显式 dispose + 调试计数 | 关闭页面实例缓存开关，保留持久化恢复 |
| 草稿迁移丢失 | 保持原 localStorage key/schema | draftStorage 兼容层可独立回退 |
| 双轨副作用串会话 | 所有命令携带 conversationId + revision | 回退到现有当前会话直连 |
| VNC owner 失效 | 删除/退出时受控重绑或销毁 | 回退到当前会话重连模式 |

## 偏离记录

- VNC 没有提升成脱离文件工作区的固定宿主，而是在统一实例槽中采用 `exclusive` 独占策略：切换到另一会话桌面时卸载旧 VNC，保证全局唯一；这样避免改动 `FileTreePreviewPanel` 的预览/header 协议。
- `loadingAsync` 从切会话整树卸载改为首次加载后使用覆盖层，这是实例保活成立的必要条件。
- 会话合同网中的 `workspaceDirComputerSwitch` 既有测试桩缺少 antd Form 支持，补齐测试 mock 后质量门恢复全绿，未改业务代码。
