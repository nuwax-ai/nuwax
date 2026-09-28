# PC Web 应用权限状态、空态与新建任务修复计划

用户提供三张 PC Web 截图，并确认本次在 `/Users/apple/workspace/nuwax` 修复；无权限应在页面内统一展示无权限状态，空数据状态应在主内容区域居中，“新建任务”应直接进入主页。

状态：已完成。范围是已有行为的修复，不调整后端授权。

1. 定位侧栏用户应用到私有数据页面的请求链。将权限拒绝与成功但无数据区分，复用项目现有无权限状态，不用空数据状态表示权限失败。
2. 给应用页面空态和权限态共用可填满主内容区的布局，使状态在可用内容区域水平、垂直居中；避免扩大为所有 Empty 组件的全局样式变更。
3. 将侧栏“新建任务”、浏览器快捷键和同入口的宿主命令统一为进入 `/home`；用户开始输入并发送后仍沿用原创建会话流程。检查传统布局入口与单栏布局的一致性。
4. 先用定向回归重现权限误判及导航副作用，再修复并运行相关测试、格式检查与分层检查。
5. 使用既有 `localhost:3000` 开发服务做浏览器验证：有权限空数据、无权限、普通错误、切换应用，以及点击新建任务后的 URL、主页输入框和未提前创建会话。浏览器模拟响应与真实后端验证分别记录。

保留工作区已有的 WorkTraceDisclosure / traceSegments 并行改动。本次不提交、推送、构建发布物，也不改客户端仓库或前端 submodule。

## 验证记录

- 新增 `AppPageState` 共用居中布局及资源权限错误识别，UserApp 与 ConversationDetails 统一消费；保留第三方主页直载、域名优先级和应用标签实例保活。
- 请求层将原有拒绝分支改为同步抛出原错误，保留业务 `code/message/tid` 与 HTTP 状态；Umi 的同步 catch 可以接住，避免丢弃 rejected Promise。原认证副作用、静默及 skip 策略保留。
- 两种菜单布局共用 `handleNewTask`，点击/快捷键/宿主命令直接进入 `/home`，旧应用内新对话创建链保持原功能。
- 失败先行：页面权限/错误用例修复前 5 失败、9 通过；导航入口用例重现提前创建会话；真实 Axios 链业务 4030/4290 修复前拒绝原因为 undefined。
- 独立 verifier 最终定向合批 12 文件、186/186 通过；会话全量复跑 107 文件、1029/1029 通过；分层检查无新增违规，14 个任务文件格式检查与全仓 diff 检查通过。
- 会话首轮有 1 条现存计时断言失败（`tests/conversationInfoModel.test.ts:1144`，两次 `Date.now()` 落在同一毫秒）；相关模型与测试无修改，最小用例与全量复跑通过。该不稳定性保留记录，未顺带修改。
- 浏览器使用 ego-browser space 3、既有 localhost:3000 服务，经真实 Umi/Axios 链模拟业务 4030、HTTP403、HTTP500 与成功空域名。四种状态均正确，没有预览 iframe，内容中心偏差小于 0.01px；普通失败和正常空态不会显示权限不足。截图在 `/tmp/nuwax-app-permission.png`、`/tmp/nuwax-app-http403.png`、`/tmp/nuwax-app-load-error.png`、`/tmp/nuwax-app-empty-centered.png`。最后一次空态截图捕获超时，空态几何与文本断言通过，并已有此前相同状态截图。
- 浏览器点击新建任务及 Ctrl+N 均进入 `/home`、显示主页可编辑输入框，Network 中没有 conversation/create 请求。测试账号后端 `new_conversation.status=0`，为适配另一个并行菜单显隐任务，浏览器仅在测试标签页临时模拟该菜单启用；后端菜单和权限未修改。截图 `/tmp/nuwax-new-task-home.png`。
- 当前真实登录账号 ldd 可打开学员信息系统 `/user-app/169` 的生产预览 iframe；无权限截图用户的真实账号未直接登录验证，权限拒绝使用浏览器响应模拟与单测验证。

保留其他在途任务的 SidebarNavHeader 显隐、HomeCategoryTabs 样式及 WorkTraceDisclosure / traceSegments 改动，本任务未提交或推送。
