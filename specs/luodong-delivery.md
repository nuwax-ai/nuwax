# 罗东需求交付规格

对应 intent：../plans/20260908-luodong-delivery-intent.md。用户已授权实施，未确认的产品语义保留为待办。

> **回滚注记（2026-09-09）**：「文件树选择非工作空间目录（本地目录数据源）」需求取消，已回滚—— DirectorySourceNavigator、OpenFileByPath（按路径打开文件）、useLocalDirectoryFiles、 filePathPreview、pickLocalDirectory 及 customTargetDir 数据面均删除；输入框侧工作目录栏（WorkspaceDirPickerModal + 会话记录 workspaceDir，wiki #17）按用户定调保留；#5a 工作区内部能力（逐层文件树导航、懒加载、TaskResult 选文件路由）不受影响。

## 首批：#5a 按路径预览（已回滚，见顶部注记）

- 文件树数据源导航提供“按路径打开文件”。路径相对当前所选根目录，默认输入当前层路径；支持中文、空格、隐藏文件。
- 使用现有 `/api/computer/static/{cId}/{encodedPath}`，本地根额外传 `customTargetDir`，路径段分别编码。仅以用户明确选择的当前数据源为根，不自动推断本机绝对目录。
- 请求携带现有登录态、禁用缓存；404、403、网络错误必须显示失败，空文件是有效文件。
- 预览复用 FilePreview，使用拉取后的 File，避免再次发出无认证请求。弹窗可预览、关闭；切换会话/数据源关闭并废弃在途请求，较早请求不能覆盖较晚请求。
- 该入口只读，不改变文件树的单层查询、不把隐藏文件插入列表，不修改服务端目录策略。
- 这只完成 #5a 的一个遗留入口；发起会话目录选择、会话记录目录、实机验收仍为 #5a 必做项。

## 验证

路径编码/数据源与请求认证测试；组件行为覆盖失败重试、空文件、切换数据源竞态；会话合同回归；浏览器真实操作与现有文件树回归。
