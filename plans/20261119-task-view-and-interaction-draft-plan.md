# 计划：任务视图与系统互动草稿恢复

## 目标与决定

PC Web 和桌面端普通任务会话，在同一账号、工作空间和本地客户端环境内，切任务、刷新页面或重启客户端后，从上次的文件树状态和仍待处理的提问草稿继续。

| 状态 | 保存范围 | 保存内容 |
| --- | --- | --- |
| 工作区主视图 | 账号、工作空间、会话 ID | 兼容现有工作区视图记录，识别用户显式关闭 |
| 文件树左栏 | 同一会话。目录另校验实际工作区来源 | 左栏显隐、文件／源代码管理选项、展开目录的工作区相对路径 |
| 系统提问草稿 | 同一会话下的 `requestId` 与 `revision` | 用户编辑过的字段、显式清空的值、多步表单的步骤 ID |

沿用本机存储，按任务或提问独立写入轻量记录。整页内存缓存用于加快回切，刷新与重启从本机记录恢复。权限审批及提问是否已处理，以会话数据和响应回执为准。用户提交仍走现有互动入口。 [工作区状态](../src/features/conversation/runtime/conversationPageCacheManager.ts#L387) · [提问标识](../src/utils/mcpAskResolution.ts#L4)

### 文件树保存与恢复

1. 把左栏显隐、选项卡和目录展开交给任务页持有。显隐、切选项卡、展开、折叠、全部折叠等操作立即更新记录。收起左栏或切到源代码管理时保留展开记录。现有预览文件和阅读位置继续由原会话缓存处理。 [左栏切换](../src/components/business-component/FileTreeGitSourcePanel/PanelCore.tsx#L152) · [目录展开](../src/components/business-component/FileTreeGitSourcePanel/FileTreePanel/FileTree/index.tsx#L64)
2. 打开任务时先应用有效偏好。入口明确限制显示时遵守入口限制。在普通入口，用户保存的关闭优先于自动打开产物，首次打开才使用默认行为。Git 暂不可用时显示文件选项，保留已记住的源代码管理选择。
3. 目录恢复等待实际工作区和根目录就绪。校验同一工作区来源后，沿可见的展开分支逐级加载。父目录处于折叠态时，等用户再次展开再加载后代。按最新成功返回的目录列表剔除已删除或失效的路径。请求失败或授权尚未就绪时保留展开记录，旧任务的迟到结果按现有工作区请求隔离逻辑丢弃。 [目录懒加载与请求隔离](../src/components/business-component/FileTreeGitSourcePanel/hooks/useWorkspaceDirectoryFiles.ts#L72)

### 系统提问草稿保存与恢复

1. 编辑字段和切换步骤时保存本地草稿，切任务和页面隐藏时提交待写记录。恢复时等待当前任务的历史消息或实时事件确认**同一请求、同一版本仍待处理**，再以表单默认值为底回填草稿。保留用户主动清空的值，步骤按 ID 定位。表单版本变化时用新版本默认值和初始步骤。 [现有表单初始化](../src/components/business-component/AgentIntervention/McpAskQuestionCard/index.tsx#L125) · [历史回执匹配](../src/components/business-component/AgentIntervention/utils/mcpAskHydrateMessage.ts#L59)
2. 提交在途、网络失败或历史加载暂时缺失时保留草稿。当前请求确认提交、跳过、取消、明确失效或被新版本替代后，清理对应草稿。收到完成回执时一并撤销待写记录，避免迟到写入将它恢复。每次回填仅更新表单，用户在卡片上主动提交才触发发送。 [现有提交与回滚](../src/components/business-component/AgentIntervention/hooks/useAgentInterventionHandlers.ts#L171)
3. 普通字段可跨重启恢复。表单或字段可用 `persistDraft: false` 将敏感输入限制在当前表单内存。现有 Ask 上传使用临时引用，恢复表单后，附件需要重新选择。 [表单字段协议](../src/components/business-component/AgentIntervention/types/mcpAskIntervention.ts#L37) · [附件上传](../src/components/business-component/AgentIntervention/McpAskQuestionCard/McpAskFileUpload.tsx#L56)

### 场景预期

| 场景 | 文件树 | 系统提问 |
| --- | --- | --- |
| A 切到 B，再切回 A | 两个任务各用自己的显隐、选项卡和展开目录。A 即使被回收，切回也可重建 | 卡片仍待处理时回到 A 的已填字段和步骤。B 有独立草稿 |
| 刷新页面 | 先读任务记录，再根据当前工作区逐级恢复目录 | 先加载会话记录，再回填同版本待处理草稿。另一窗口已处理的问题以回执为准 |
| 重启客户端或关闭后重开浏览器 | 同一账号与本地配置读取上次已写入的任务记录，再获取有效工作区 | 同样从本机读取已保存字段，等会话确认请求有效后再回填 |

## 实施与验证

- 普通 Chat 入口通过任务 Provider 注入文件树状态和互动草稿作用域，消费组件直接读取。沿用现有整页缓存和目录懒加载。旧版仅有主视图记录时先读原偏好，新增字段使用默认值，首次写入后使用带版本号和账号作用域的新记录。
- 在 MCP Ask 卡片接入草稿读写，复用 `requestId`、`revision` 和现有回执匹配。确认草稿的清理信号来自已接受的响应或匹配到的历史回执。删除任务时清理对应记录。本机存储不可用时以当前内存状态继续。
- 验收覆盖三种场景，以及左栏重复开关、文件／源码管理往返、目录删除、工作区切换、同版本补拉、提问版本变更、显式清空、发送失败和外部已应答。实现后跑 `test:conversation` 与对应 E2E，并在桌面客户端实际退出后重开验证。
