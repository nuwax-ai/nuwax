# 实施计划：IM 事件监听与消息导航未读角标

- 分级：中等接入调整，复用已有 IM 监听协议，仅维护本计划。
- 状态：五步已实施（2026-09-29）。代码随 `a8a402188` 合入 `feat-dong.0930`，对照文档见 [docs/im-event-reference.md](../docs/im-event-reference.md)，角标边界单测见 `tests/microApps/imMenuBadge.test.tsx`。
- 修改前边界：主仓 `d2c9e2744`；保留已有 `src/constants/version.ts` 修改。

## 实施顺序

1. 核对上游监听桥协议，固定包含 DEV-327 的消息 main 提交；对齐 gitlink、adapter pin 与适配补丁。原 pin 与 gitlink 已不一致，升级前核对并保存恢复依据。
2. 消息微应用挂载完成后订阅 `window.__im`：自定义事件只转发 `eventType/payload` 到现有 eventBus；不调用任何消费标记接口，batch 源码保持原样。
3. 同一实例订阅未读变化，并读取 `getSnapshot().unreadTotal` 初值；隐藏保活保留订阅，登出、认证失效及卸载退订并清零，拒绝旧回调。
4. 各导航布局的消息入口共用未读角标：0 隐藏，1–99 显示数量，超过 99 显示 `99+`；通知中心保持原口径。
5. 补充消费端类型及消息监听接口对照文档，供未来客户端独立接入参考。

## 验证

- 真实 React 宿主：挂载后唯一订阅、登录门控、隐藏仍接收、登出/卸载/重挂及迟到回调隔离。
- 同一 payload 经 batch 与 IM 都进入原处理器；IM 不消费，batch 仍清理，batch clear 在途不阻塞 IM。
- 未读快照初值、未读增加/归零、99/100 边界，以及经典/单栏菜单正确定位与点击。
- 上游桥与现有适配合同、会话质量门、分层检查、类型新增诊断与格式检查；构建验证使用固定输入，不调用默认 prebuild 升级其它应用。

## 偏离记录

- 用户新增未读角标要求，需要升级到包含 onUnreadChange/getSnapshot 的消息版本，增加导航显示与协议文档；不接入原生通知或客户端独立 WS。
- 原主仓 gitlink 为 `6704fe0`，adapter.pin 为 `f7fd703`。固定输入必须一并对齐；上游 DEV-327 新增 store 订阅导致一个旧补丁上下文不再匹配，重定位该上下文并保留原清理行为。
- 接手（Codex 会话中断后）：最终 gitlink = pin = `757bcf0d`（中途 `76f1e8b` 升级线已撤回）。补丁曾丢失 vite 的 rename 段，导致 `sync:micro-apps` 在 `tsc -b` 失败；已在 `264c86c1f` 恢复。
- 验证记录（在 `05d07af1c` 上）：
  - 两个微应用的固定输入构建均通过，消息产物包含 `onCustomEvent` / `onUnreadChange` / `[IM-BRIDGE]`。
  - 微应用与轮询相关 15 个文件 93 例，加角标 6 例，全部通过。
  - `test:conversation` 110 个文件 1075 例全部通过。
  - `lint:arch` 零新增违规。
  - tsc 在改动路径上零新增错误（全库 350 条均为预存基线）。
- 未做：真实账号的端到端收发（需要另一个账号制造未读）。
