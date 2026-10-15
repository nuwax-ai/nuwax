# 实施计划：NW-027 / NW-026

- 对应 spec：specs/conversation-terminals.md
- 状态：候选实现已保存；方案待评审。按用户最新要求，先梳理再决定后续实现与合入。

历史实现和验证结果保留作评审材料，不作为最终方案已确认或可直接发布的结论。独立分支：`codex/nw026-nw027-terminal-design`。

## 实施顺序与文件

1. `ConversationTerminalWorkspace/`：新增按会话身份保留的门户宿主、页面挂载点和资源清理；`src/app.tsx` 安装宿主。先补测试覆盖卸载/重挂及清理，再实现。
2. `pages/Chat/index.tsx`：使用持久终端入口；页面隐藏不重置终端打开意图。终端保持在原有预览区底部，不调整其他面板协议。
3. `ConversationBottomConsole/index.tsx`：增加可选标签头部插槽；新工作区组件提供新增/切换/关闭独立终端；补多语言与样式。
4. 回归 `EmbeddedConsoleTerminal` 的显隐连接合同及 URL 更换隔离，必要时修正。
5. 跑相关单测、`test:conversation`、`typecheck:conversation`、`lint:arch`，ego-browser 浏览器验证。

## 风险与回退

- 门户需继承应用主题；由常驻 React 宿主 createPortal，避免另建无上下文 React root。
- 终端会继续占用资源，提供显式关闭；退出登录/删会话/换沙箱清理，不使用会中断用户任务的自动淘汰。
- 回退可移除 Chat 新入口及 app 宿主，公共控制台新增插槽为兼容可选属性。

## 验证记录

- `npm run test:conversation`：118 文件、1225 测试全绿（含新增 6 个真实控制台/终端组件合同）。
- 终端流控、共享开发/线上控制台、开发 WS 代理相关 22 测试通过；新增折叠回归后会话合同网再次全绿。
- `npm run typecheck:conversation`：128 文件、0 诊断；全库现有 287 个域外诊断，改动路径未新增。
- `npm run lint:arch`：无新增违规，97 条历史基线未扩张。
- `npm run build:dev`：最终源码构建成功；Prettier 和 diff whitespace 检查通过。
- ego-browser 真实云端 ttyd：多 shell 独立；A 会话持续输出 180 次，文件预览及切 B 停留超过一分钟后返回均未关闭 A 连接；关闭第三终端只释放对应连接。
- 创建临时文本文件后成功加载预览，后台命令继续输出；临时文件已删除，验收命令已结束。
- 详见 `docs/acceptance/20261015-conversation-terminals.md`。

## 偏离记录

- 补充本地开发 `/computer/terminal` 同源 WS 代理，复用既有 Origin/Cookie 规则，使真实终端验收可运行；不变更线上接口。
- 标签头部替换后补回折叠面板的点击恢复行为；先由回归测试复现，再用既有 terminalSignal 消息恢复面板。
