# 输入框状态、上框与草稿生命周期

本文说明平台首页及 `ChatInputUnified` 会话输入框的现行契约。这里的“上框”指项目、智能体、技能或资料出现在输入卡片里；它们的保存方式并不相同。排查时先确定状态归属，再看导航和恢复事件。

## 1. 状态归属与保存范围

| 状态 | 实际持有者 | 作用域与保存位置 | 离开后返回 / 刷新 |
| --- | --- | --- | --- |
| 未发送正文、技能/文档/文件引用、已上传附件 | `ChatInputUnified` 编辑态，`draftStorage` 读写 | `localStorage` 的 `chat_draft:<scope>`，24 小时有效 | 按 scope 恢复；刷新也能恢复 |
| 首页绑定项目、推荐智能体、召唤专家、分类、电脑、目录、模型、空间、手选工具及工具展示元数据 | `homeInputContext` | SPA 内存，首页只有一份，独立于所有已有会话 | 普通路由返回保留，刷新丢失。空输入时主动点击首页或新建任务会复位 |
| 项目「+」、召唤专家、广场智能体、技能卡的带入参数 | `pageHandoffContext` | SPA 内存，一次性消费；每条通道只有一个待消费值 | 消费后删除；刷新丢失；后一次写入覆盖同通道前一次 |
| 电脑选择记忆 | `ComputerTypeSelector` + 后端 `agentSelected` | 当前用户、按智能体保存；组件另有本次手选镜像 | 重建时重新查询，受项目配置/会话绑定/只读限制约束 |
| 模型默认选择 | 页面受控 `selectedModelId` + `ModelSelector` | 当前页面选择；服务端 options 首项提供该智能体的最近使用候选 | 首页路由返回保留手选；重建/刷新按可用列表重新校验，失效时选默认候选 |
| 审批模式 | 宿主受控 `agentMode` | 本地 `nuwax_agent_mode_cache` 按智能体保存，并受 `allowChooseMode` 门控 | 可恢复；不允许切模式时回落 `yolo` |
| 审批、产物版本管理、自动提交偏好 | `useChatboxAgentConfig` | 服务端用户配置 `chatbox.config.<agentId>` | 挂载/切智能体读取；用户改过后，晚到 GET 不覆盖操作；写失败保留本地乐观态 |
| 已有会话的项目和运行电脑 | 会话/项目服务端记录、页面环境解析 | 业务记录，不能当作首页上框缓存 | 按当前会话恢复，不得被另一个会话或首页草稿覆盖 |
| 已有会话中模型、工具等未持久化的页面选择 | 各页面的 state / 页面局部 model | 页面实例；整页保活命中时一起保留 | 实例释放后由页面初始化/透传/后端记录重新构造，不能宣称全部由草稿恢复 |

“回到页面还在”有三种可能：组件实例仍挂着、首页 model 仍活着、草稿从存储重新加载。维护时必须区分它们。

工具栏“已连接的连接器”头像组来自服务端已连接列表，挂载及能力弹窗关闭后刷新，不是手选工具缓存。推荐分类、智能体详情、提示问题、模型/电脑候选列表也由接口重新取得。弹窗开关、光标、撤销栈及语音输入过程属于组件临时状态，没有草稿持久化保证。

## 2. 草稿如何按会话隔离

作用域由 [useConversationDraftScope](../../src/components/business-component/ChatInputUnified/useConversationDraftScope.ts) 决定：显式 `draftKey` 优先，否则使用页面入口和本输入框所属会话 ID；没有这两者就不开启草稿保存。

| 输入框所在位置                      | scope 示例   | 存储键示例              |
| ----------------------------------- | ------------ | ----------------------- |
| 平台首页                            | `home`       | `chat_draft:home`       |
| `/home/chat/:id/:agentId`           | `chat:123`   | `chat_draft:chat:123`   |
| `/agent/*` 的会话面板               | `agent:123`  | `chat_draft:agent:123`  |
| `/space/:spaceId/*` 的开发/调试会话 | `apppro:123` | `chat_draft:apppro:123` |
| 其他承载面，如插件、技能等          | `page:123`   | `chat_draft:page:123`   |

隔离维度是“入口类型＋会话 ID”，没有额外拼 Agent ID、项目 ID 或完整 URL。同一会话在主聊天和 Agent 面板里的草稿独立；同属 `/space/*` 且会话 ID 相同的输入框使用同一个桶。首页只有一个尚未创建会话的草稿，不会为每个项目各存一份。

整页保活时，全局 URL 已切到其他页面，但隐藏的输入框还在。此时使用 `ConversationPagePathnameContext` 的固定路径，避免旧输入框跟随新 URL 改桶。所属会话 ID 取输入框自己的 `getCurrentConversationId()` / `conversationInfo.id`，不能改为读取全局最后打开的会话。

草稿结构只保存可恢复数据：正文摘要、按编辑顺序排列的字符串和结构化引用、已上传附件必要元数据、时间戳与版本号。不存编辑器 HTML、本地 `File`、上传请求对象、项目绑定、电脑、目录、模型、空间和首页专家选择。旧 `skillIds` 数据仍兼容读取，现行引用恢复以结构化 `content` 为准。

## 3. 草稿的写入、恢复和清除

1. **进入输入框**：读取当前桶。首挂仅在输入为空时恢复，避免覆盖已经回填的内容；同一组件切换 scope 时，新桶无条件接管，空桶也要清空旧内容。
2. **编辑**：正文、技能、文档和已上传附件变化后，约 1 秒防抖保存。删除引用、删除附件、清空最后一段正文立即写回，防止删除后立刻离开又恢复旧内容。
3. **离开/卸载**：用最新镜像补写未落盘的非空草稿。卸载兜底只补写，不以 teardown 中的空镜像删草稿；真正的用户清空在编辑阶段处理。
4. **恢复引用**：`MentionEditor` 从结构化数据重新创建 chip，再派生 `skillIds`、`selectedDocs` 等发送参数。只恢复文字 `@名称` 不等于恢复引用。
5. **恢复附件**：图片和其他已上传文件都算输入内容。恢复时只保留有服务端 `url` 和 `key` 的完成附件。正在上传的文件也算当前页面有内容。
6. **全空**：纯空格/换行不算正文；没有正文、引用、已上传附件和兼容技能数据时删除存储键。读取时过滤非法引用/附件，过期或合法结构中的空草稿被清除；存储不可用时静默降级。
7. **发送**：当前实现是在调用 `onEnter` 后立即消费并清除当前桶，取消待保存定时器，卸载时不回写已消费内容。`isClearInput=true` 还清空当前编辑态；首页传 `false`，在页面跳转前保留输入。
8. **删除会话**：缓存 manager 按会话 ID 删除各入口对应的草稿及面板偏好。LRU 释放页面实例本身不删除草稿，24 小时 TTL 也不等于页面实例的寿命。

实时“有没有内容”以输入框 ref 的 `hasContent()` 为准，覆盖正文、引用、附件及上传中的文件。不能通过 `loadDraft()` 判断当前页面是否为空：保存有延迟，已发送内容也可能仍暂留在首页编辑器里。

实现：[统一输入框](../../src/components/business-component/ChatInputUnified/index.tsx)、[草稿兼容入口](../../src/components/business-component/ChatInputUnified/draftStorage.ts)、[序列化类型与规范化](../../src/features/conversation/domain/conversationPageCache.ts)、[存储与生命周期 manager](../../src/features/conversation/runtime/conversationPageCacheManager.ts)。

## 4. 首页导航与上框事件

| 用户动作 | 内容处理 | 项目、智能体及其他选择 |
| --- | --- | --- |
| 点击“首页”或“新建任务”，当前没有正文、引用或附件 | 保持空输入 | `resetInputContext()` 复位首页选择，清除项目、目录、推荐、专家、工具、模型、空间和手选分类，恢复默认智能体及其配置 |
| 点击“首页”或“新建任务”，已有内容 | 保留并恢复草稿 | 保留原项目、电脑和目录、推荐或专家、工具、模型、空间和分类 |
| 当前已在首页，再点这些入口 | 读取实时编辑态 | 每个新的导航 key 执行一次空输入判断 |
| 普通路由返回、浏览器前进或后退到首页 | 按 `home` 恢复草稿 | 保留首页内存选择 |
| 项目行/详情页「+」 | 保留当前草稿 | 一次性项目透传优先绑定指定项目；不当作全局新建任务 |
| 同项目再次「+」 | 保留草稿 | 保留所选智能体和工具，重读项目电脑与目录；项目身份按类型＋ ID 比较 |
| 改点另一个项目「+」 | 保留草稿 | 替换项目，清掉互斥的推荐/专家/模型/空间/分类，继承新项目电脑与目录 |
| 召唤专家 / 广场智能体上框 | 保留草稿与其他配置 | 替换会话智能体槽位，清掉推荐选择；项目类型限制仍生效 |
| 技能卡“选择” | 向编辑器回填技能 chip | 技能与专家/项目是不同通道，发送由实际 chip 派生技能 ID |
| 切上方内容分类 | 保留全部输入 | 只切推荐列表，不改变已选智能体或其他配置 |
| 点击推荐智能体 pill | 显式切对象时清空编辑器正文和引用，附件仍保留 | 清掉专家，更新/取消推荐，复位模型与空间；项目内保留电脑，项目外按智能体解析电脑记忆；全栈项目已选中项不可取消 |
| 移除项目 chip | 清空编辑器正文和引用，附件仍保留 | 去掉项目、推荐、手选分类、目录并复位电脑；这不是全量 `resetInputContext`，已有专家按现行行为保留 |
| 刷新首页 | 正文、引用、已上传附件仍可恢复 | 首页内存选择及待消费透传丢失，按默认首页重新初始化 |

首页菜单沿用 `menuCode: 'homepage'`，首页仅在 `PUSH` 导航时把它当作主动点击。单栏 Logo、经典布局快捷新建、Ctrl/Cmd+N 和宿主 `new-task` 命令用 `history.state.newTask` 标识进入首页输入框。首页处理时从当前历史项移除该标记并保留其余数据。项目「+」等业务上框入口沿用各自的一次性透传。

一次性通道的交接点是 `pageHandoffContext`，消费后的首页选择由 `homeInputContext` 接管。不要为了保留项目而把一次性 payload 留在 handoff map，也不要把首页的项目状态塞进已有会话的草稿桶。

### 项目与智能体的优先级

- 当前会话智能体：召唤/上框专家 > 推荐项 > 租户默认智能体。全栈项目未命中允许的开发智能体前，不回落到租户默认智能体。
- 首页发送分支：已有项目上框 > 项目类推荐新建项目 > 普通新建会话。项目外个人目录可能触发后端隐式创建常规项目。
- 首页只在当前智能体详情允许切换模型时发送所选模型 ID。
- 常规项目先继承项目电脑与文件服务目录，允许修改；全栈项目由项目隐含环境，不把隐藏的旧电脑/目录塞进创建请求。
- 项目详情异步回填使用请求序号与挂载状态校验；切项目、移除项目、空输入新建任务、认证清理后，旧响应不能重新带回项目电脑或目录。
- 智能体详情请求取消旧代结果；同智能体返回首页时，`componentAgentKey` 防止默认工具覆盖用户手选。

来源：[首页](../../src/pages/Home/index.tsx)、[首页上下文](../../src/models/homeInputContext.ts)、[一次性上下文](../../src/models/pageHandoffContext.ts)、[发送计划](../../src/utils/homeSendPlan.ts)。电脑与目录的类型、权限、锁定和回落细则以 [容器选择规则](agent-sandbox-selection-rules.md) 为准。

## 5. 已有会话恢复与整页保活

首页创建会话后，将首条正文、附件、引用、工具、模型、电脑及模式通过路由 state 等透传交给目标页，不是把 `home` 草稿改名成新会话草稿。目标页的首条自动发送与防重另由各入口负责；后续手工输入才进入该会话自己的草稿桶。

主聊天、Agent 会话面板、编排预览、插件和技能入口复用 `UnifiedChatSession` / `ChatInputUnified`；会话 model 可能由 `usePageModel` 提供页面实例覆盖，不应混用全局 model。旧 `ChatInputHome` 仍被创建项目 PromptBox、ChatTemp 使用，AppDev 还有独立同名输入框，不能假定这些组件具备统一输入框的全部草稿契约。

PC style3 的整页保活由 `ClientConversationKeepAlive` 和 `fullPageInstanceCacheManager` 管理，支持主聊天、智能体开发工作区、全栈 IDE，首页不在其中。总容量 5，IDE 最多 2；优先释放隐藏且非运行的页面，隐藏终态页有 60 秒宽限期。style1/style2、移动端按原路由生命周期。另一个 `conversationPageCacheManager` 管理会话工作区/草稿摘要和面板偏好，默认容量也为 5，不能把两个 manager 的容量或淘汰规则混为一谈。

保活命中会保留页面局部选择和 DOM；实例被淘汰或刷新后，需要重新加载业务记录及草稿。持久化草稿只保证第 2、3 节列出的数据，不保证模型、工具、弹窗、光标、撤销栈和上传中的文件全部恢复。

来源：[整页宿主](../../src/layouts/SidebarShell/ClientConversationKeepAlive.tsx)、[保活路由](../../src/layouts/SidebarShell/clientConversationRoute.ts)、[整页生命周期](../../src/features/conversation/runtime/fullPageInstanceCacheManager.ts)、[页面 model](../../src/modelScopes/usePageModel.ts)。

## 6. 认证清理与已知边界

- 正常登出及相应认证失效链调用 `clearStoragePreservingUserPrefs()`：发出 `AUTH_SESSION_CLEARED`、清除本地存储，只恢复主题、语言和首页折叠布局等白名单偏好。因此草稿、本地模式缓存随此链路删除；首页上下文也监听事件复位，并阻止旧项目响应回填。服务端按用户保存的偏好不因此删除。
- 仅发出 `AUTH_SESSION_CLEARED` 不等于清空整个 localStorage；例如 `UserService.logout()` 本身只做部分清理。`pageHandoffContext` 与两个页面缓存 manager 当前没有统一的认证事件清理入口，不能宣称所有 SPA 内存仅靠该事件都会销毁。
- **刷新保留草稿内容，但不保留首页项目/专家/电脑/目录等内存上下文。** 这是现行保存边界，不能描述为“完整首页草稿跨刷新恢复”。若后续要求刷新也保留绑定，需要单独确定账号/租户隔离、项目权限和失效策略。
- **草稿消费发生在发送回调调用后，不等待后端成功。** 首页创建失败时当前挂载输入通常仍在，但离开后不保证重新恢复；输入框无法凭 `void onEnter` 判断发送是否成功。后续若要保证失败跨页重试，需要统一发送结果契约，不能只在某个页面补保存。
- 24 小时按每次保存的 `savedAt` 判定，不是定时后台清扫；存储键不包含用户/租户前缀，正常认证清理是现有隔离的一部分。不能绕过认证清理直接跨账号复用存储。

来源：[认证清理](../../src/utils/authStorageCleanup.ts)、[用户服务](../../src/services/userService.ts)、[发送回调](../../src/components/business-component/ChatInputUnified/index.tsx)。这些限制是维护时需要知道的实际边界，不代表已经改成了新的契约。

## 7. 修改入口与验证

| 要调整的规则 | 修改入口 | 主要回归 |
| --- | --- | --- |
| 点击首页、新建任务、业务上框与草稿恢复 | `useMenuNavigation`、`Home`、`homeInputContext` | `newTaskNavigation.test.tsx`、`homePinnedProjectRepeatPin.test.tsx` |
| 正文/引用/附件恢复、延迟保存、发送消费 | `ChatInputUnified`、`draftStorage`、会话缓存 manager | `chatInputUnified.home.test.tsx`、`draftStorage.test.ts`、`conversationPageCache.test.ts` |
| 按入口和会话隔离、保活路径冻结 | `useConversationDraftScope`、`ConversationPagePathnameContext` | `useConversationDraftScope.test.tsx`、统一输入框切 scope 回归 |
| 专家/技能/项目带入 | 各 `use*Handoff`、`pageHandoffContext`、首页消费 | `homeSummonedExpertHandoff.test.tsx`、`homeSelectedSkillHandoff.test.tsx`、项目上框回归 |
| 工具默认值与手选恢复 | `useSelectedComponent`、首页 `componentAgentKey`、各会话页面 | 首页重复 pin、同页异步竞态与工具发送回归 |
| 电脑/模型/空间默认值及模式偏好 | 对应选择器、`useChatboxAgentConfig`、干预层模式缓存 | 选择器及配置 hook 的现有回归；按实际入口走查 |

会话改动执行 `npm run test:conversation`。首页走查覆盖项目「+」后空输入点首页、输入正文或添加附件后切页再点首页，以及删除最后一段正文后立即返回首页。已有会话走查验证 A/B 草稿隔离。保活、持久化和后端记录分别验证。
