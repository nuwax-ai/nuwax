# 飞书 9/24 文件树自动刷新语义补修

## 来源与范围

- 研发组 9/24 冯飞：编辑/新增文件才刷新，现在只要有工具调用就刷新，浪费资源；编辑文件后再刷新。
- 父代理核对禅道全量 2497 条未找到同义工单；2419 后端搜索不属于本问题。排除移动端。
- 基线 combined `d2db5ef6fa24f1074d33a14b3ed56eb9db9fc824`，独立 worktree `nuwax-feishu-file-refresh-20260926`。
- home/chat 与 AppDevPro 复用现有文件树面板，不更改下载函数，不改树 UI/懒加载合并规则。

## 当前因果

- runtime `createConversationRuntimeSession` 对所有 PROCESSING ToolCall 派发节流刷新，包括搜索和 EXECUTING 开始事件。
- legacy `conversationInfo` 有可见性门控，但仍对所有 ToolCall 刷新。
- AppDevPro 新 runtime 的 effectsResources 为空，实时文件变更未接文件树，只在任务结束刷新。

## 实施与验收

1. 先调整 runtime 直接回归，确认搜索/读取/开始事件不再应刷新；新增文件编辑/新建/删除/重命名、diff、终端写入完成和最终兜底合同。
2. domain 纯函数统一完成后的文件变更判定，两轨共用：协议 kind / diff 优先，文件变更工具名兜底；终端不可靠地解析任意脚本，已知简单只读命令跳过，未知/写命令完成后保守刷新。
3. AppDevPro 仅补共享刷新资源接线，保持已有完成后树+选中文件+Git 的兜底与页面显隐规则。
4. 定向验证、必跑 test:conversation 与 lint:arch、查看改动路径新增类型错误；实际 UI/E2E 使用同一共享 TaskSpace，与父代理协调端口/页。
5. 隔离提交，仅报告此反馈修复及证据；没有真实部署验证时不宣称现网已修复。

## 独立复审补漏

- runtime effectsResources 仅在会话 session 首次创建捕获，AppDev 页面给回调不能依赖当时的 active/id 闭包。
- 提取稳定的 React 节流入口，读取 render 更新的 active/id/refresh ref；切换/卸载取消旧尾任务，旧会话请求不得刷新当前文件树。
- 用首次暴露回调跨 rerender 验证 inactive→active、会话切换后的新 ID、旧 ID 拒绝及卸载清理，先红后绿。
- 附加父代理 F3 Java→ 前端 ERROR 真实载荷合同测试；浏览器 fixture 仅验证真实生产刷新链网络次数，不代替部署验收。

## 任务卡

- 标题：PC home/chat 与全栈开发文件树按文件变更完成刷新。
- 难度：中等；适合具备 SSE/React 副作用经验的模型/agent。
- 验收：查询/读取/计划/浏览器和文件工具执行开始时零自动刷新；编辑/新增/删除/重命名完成刷新；终端写文件完成不漏；FINAL 仍兜底；复用树 UI、展开状态与下载不回归。
