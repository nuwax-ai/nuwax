# #2461 共享会话面板规格

- 公共面板入口：进度、详情、文件树、终端、云电脑的图标/激活态/Tooltip 同源。页面提供受控状态、回调与权限门控。
- 公共布局：使用 ResizableSplit 同一拖拽条；窗口不足最小宽度总和时按比例收敛边界，不产生负宽或裁掉整个右栏。保持关闭面板子树保活语义。
- 进度/详情：胶囊取生效 runtime 的 messageList/active；详情消费当前会话 agent。切换会话重置浮层。
- 文件树：继续共享 FileTreeGitSourcePanel，保留全栈源码/git适配和文件预览。
- 终端：复用 ConversationBottomConsole；全栈适配层负责 dev/prod URL、容器状态、日志数据和两环境隔离。
- 云电脑：复用 VncPreview，同会话 ID 与 appStage=dev，容器未 running 时保留启动反馈；不以应用 ID 代替会话 ID。
- 不新增产品横向滚动兜底，不改变 sandbox/会话执行契约，不下放页面 services 到业务组件。
