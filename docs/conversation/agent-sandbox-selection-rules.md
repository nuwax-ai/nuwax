# Agent 容器选择与 sandboxId 传参逻辑

> 更新日期：2026-10-15。按当前工作区实现整理，包含首页隐藏容器选择器时不传 `sandboxId` 的修复；该修复在本次整理时尚未部署。
>
> 阅读顺序：先确定页面状态，再按 Agent 类型和配置查表。表格记录当前行为；入口之间尚未统一的地方列在第 8 节。
>
> 同日补充 BUG-2674：会话发送后不再等待 `sandboxServerId` 回填才锁定；锁定后仍可展开完整容器列表，其他容器项禁用，不允许切换。锁定但电脑 ID 尚未回填时保持等待，不显示“电脑不可用”。这些补充在本次修复时尚未部署。

## 1. 页面状态与判断口径

| 状态 | 业务含义 | 本文检查的动作 |
| --- | --- | --- |
| 平台首页 | `/home`，尚未进入具体会话 | 创建会话或项目 |
| Agent 首页 | 某个 Agent 的介绍和输入页，尚未进入聊天页；详情接口可能已经返回会话 ID | 输入内容与电脑选择随跳转进入聊天页 |
| 会话首页 | 已有会话 ID，但尚未发送首条消息、没有持久化消息 | 选择电脑并发送首条消息 |
| 已有会话 | 已经有消息，包括执行中、执行结束后继续聊天 | 继续发送消息 |

表格中的“绑定电脑”指 Agent 自身的 `sandboxId` 非空且不为 `-1`。`agent.sandboxId = -1` 不算固定绑定。选择器只有一个云端选项、显示但锁定、不显示，是三种不同状态。

“允许选电脑”对应 `allowPrivateSandbox`。下表按其明确开启或关闭的正常配置说明。平台首页将空值视为未开启；Agent 首页仅在明确为 `No` 时设置只读，缺失配置时两处行为不同。

工作目录仅在允许使用个人电脑、选中个人电脑且入口开放目录能力时生效；云端不携带个人工作目录。

## 2. ChatBot 对话型 Agent

适用普通对话入口。平台首页选中开发类推荐或带有项目上框时，先看第 6 节的覆盖规则。

| 页面状态 | 容器选择器 | 能否切换 | 当前 sandboxId 行为 |
| --- | --- | --- | --- |
| 平台首页 | 不显示 | 不提供切换 | 创建会话不传，不补 `-1` |
| Agent 首页 | 不显示 | 不提供切换 | 当前选择状态或 URL 带入值仍可能随跳转传递，入口未统一过滤隐藏状态 |
| 会话首页 | 不显示 | 不提供切换 | 首条 chat 消息仍传会话记录、Agent 绑定或兜底 `-1` |
| 已有会话 | 不显示 | 不提供切换 | 主 Chat 页按当前会话记录解析环境，继续发送时仍传环境参数 |

代码入口：[平台首页](../../src/pages/Home/index.tsx)、[Agent 首页](../../src/components/business-component/ConversationDetails/index.tsx)、[主 Chat 发送入口](../../src/pages/Chat/index.tsx)。

## 3. TaskAgent 任务型 Agent

### 3.1 允许选电脑且没有固定绑定

| 页面状态 | 容器选择器 | 能否切换 | 当前 sandboxId 行为 |
| --- | --- | --- | --- |
| 平台首页 | 显示 | 可以 | 云端传 `-1`，个人电脑传对应 ID；可携带个人工作目录 |
| Agent 首页 | 显示 | 可以 | 所选电脑以 `selectedComputerId` 随跳转进入聊天页 |
| 会话首页 | 显示 | 通常可以；PUSH 跳转已带电脑选择时锁定 | 未锁定的空会话可在首条消息前改选，发送采用新选择；否则采用会话记录或已带入的选择 |
| 已有会话 | 显示当前电脑，可展开完整列表 | 发送后锁定，执行结束不自动解锁，不依赖环境字段回填 | 主 Chat 页优先采用会话记录的环境 |

没有手动点过下拉，也可能已经选中电脑：平台首页启用按 Agent 读取的选择记忆，无有效记忆时默认云端。默认选中与手动选中都会产生选择值；具体 ID 是否可用还受候选列表状态影响。

代码入口：[电脑自动选择](../../src/components/ChatInputHome/ComputerTypeSelector/index.tsx)、[默认选择决策](../../src/components/ChatInputHome/ComputerTypeSelector/resolveAutoSelection.ts)、[主 Chat 选择恢复](../../src/pages/Chat/hooks/useChatSandbox.ts)。

### 3.2 允许选电脑且已有固定绑定

| 页面状态 | 容器选择器 | 能否切换 | 当前 sandboxId 行为 |
| --- | --- | --- | --- |
| 平台首页 | 显示绑定电脑 | 锁定 | 同步 Agent 绑定到选择状态，创建会话传绑定 ID |
| Agent 首页 | 显示绑定电脑 | 锁定 | 绑定 ID 随跳转进入聊天页 |
| 会话首页 | 显示固定环境，可展开完整列表 | 锁定 | 主 Chat 页优先采用会话记录，未取得记录时再解析选择或 Agent 绑定 |
| 已有会话 | 显示固定环境，可展开完整列表 | 锁定 | 按会话记录的环境继续发送 |

Agent 首页与平台首页按 Agent 自身绑定锁定；进入主 Chat 页后，不能将 Agent 当前配置覆盖到已有会话的环境记录上。

代码入口：[真实绑定判断](../../src/utils/effectiveSandbox.ts)、[输入框绑定同步](../../src/components/business-component/ChatInputUnified/index.tsx)、[选择器锁定](../../src/components/business-component/UnifiedChatSession/resolveComputerSelection.ts)。

### 3.3 不允许用户选电脑

无论 Agent 是否有固定绑定，下表均适用。

| 页面状态 | 容器选择器 | 能否切换 | 当前 sandboxId 行为 |
| --- | --- | --- | --- |
| 平台首页 | 不显示 | 不提供切换 | 创建会话不传，不补 `-1`，也不发送隐藏状态中的旧选择 |
| Agent 首页 | 不显示 | 不提供切换 | Agent 绑定、选择状态或 URL 带入值仍可能随跳转传递 |
| 会话首页 | 不显示 | 不提供切换 | 首条 chat 消息仍传解析出的环境 |
| 已有会话 | 不显示 | 不提供切换 | 后续消息仍按会话环境发送 |

`allowPrivateSandbox` 当前控制用户能否选择个人电脑。该开关并不统一控制所有请求是否包含 `sandboxId`。

## 4. PageApp 与其他 Agent 分类

| Agent 类型或分类 | 页面状态 | 当前规则 |
| --- | --- | --- |
| 运行时类型 `PageApp` | 平台首页、Agent 首页、会话首页、已有会话 | 单凭该类型不会显示任务型电脑选择器；平台首页开发推荐的任务态覆盖规则另见第 6 节 |
| `AgentFlow`、`ConversationAgent`、`AgentGroup` 分类名称或子类型 | Agent 首页、会话首页、已有会话 | 没有按这些名称单独定义容器选择规则；输入框按实际传入的运行时类型是否为 `TaskAgent`、是否强制任务态及权限判断 |
| 网页应用项目开发 | 项目创建或开发入口 | 项目能力策略仅允许云端，不开放个人电脑和自定义目录；具体入口是否显示选择器另受类型和权限影响 |

这里的运行时 `Agent.type` 与项目类型是两个维度。例如 `PageApp` 项目受项目能力策略约束，不能仅凭开发智能体属于 `TaskAgent` 就允许个人电脑。

代码入口：[Agent 类型](../../src/types/enums/space.ts)、[输入框展示条件](../../src/components/business-component/ChatInputUnified/index.tsx)、[项目能力策略](../../src/constants/workspaceDirPolicy.constants.ts)。

## 5. 会话首页与已有会话的共同状态规则

1. **空会话不因已经有会话 ID 就一律锁定。** 无固定绑定、没有首条消息且没有跳转锁时，可以修改电脑。
2. **本次 PUSH 跳转携带电脑选择会锁定。** 平台首页或 Agent 首页已经确定电脑并带入聊天页时，聊天页保留该选择；刷新、POP、REPLACE 不继续沿用旧的跳转选择。
3. **发送或已有消息后锁定。** 锁定依据消息和发送标记，不依赖 `sandboxServerId` 是否已经回填；任务完成后不会自动恢复可切换。锁定时保留下拉箭头，可展开完整容器列表查看，其他容器项禁用，点击不会更改当前选择。
4. **执行中额外锁定。** 输入框的活跃态也参与锁定，避免运行中切换电脑。
5. **主 Chat 页优先恢复当前会话环境。** 当前会话有 `sandboxServerId` 时优先使用；未锁定的空会话显式改选后可以使用新选择。切换会话时不采用上一个会话的快照。
6. **环境记录缺失不解除锁定。** Agent 首页发起会话时，详情快照的 `sandboxServerId` 可能暂为空；首条消息发起或有消息后仍固定当前选择。电脑 ID 尚未回填时等待，不将空 ID 判为电脑不可用；明确不可用或候选列表确认缺失的电脑仍显示错误。

以上指主 Chat 页及其共享输入框逻辑；AppDevPro、ConversationAgent 和编排预览的环境解析差异见第 8 节。

## 6. 平台首页的项目与推荐覆盖规则

先判断是否有项目上框，再判断推荐位及普通 Agent 类型，不能只按 `Agent.type` 查表。

| 首页状态 | 容器选择器 | 能否切换 | 创建动作与参数 |
| --- | --- | --- | --- |
| 常规项目上框，新建任务 | 显示，先继承项目配置 | 可以，不受项目创建者或参与者身份限制 | 直接创建会话绑定项目；传当前选择的 `sandboxId`，个人电脑可附带目录 |
| 全栈项目上框，新建任务 | 不显示 | 不提供切换 | 直接创建会话；携带 `projectId`、`projectType`、`devAgentId`，不传项目原有 `sandboxId`、旧电脑选择或目录 |
| 选中全栈应用开发推荐，新建项目 | 按任务态与权限显示；显示时仅云端 | 不能改用个人电脑 | 走项目创建；显示且选中云端时传 `-1`，隐藏时首页不带电脑选择值 |
| 选中智能体、技能、插件、常规项目开发推荐 | 按任务态与权限显示 | 再受绑定、权限和能力策略限制 | 走项目创建；有选择时传对应 ID，个人电脑可附带目录 |
| 选中网页应用开发推荐 | 推荐类型本身不强制任务态；仍可能因实际 Agent 为 `TaskAgent` 且允许选择而显示 | 仅云端 | 走项目创建，隐藏时首页不带电脑选择值 |

常规项目继承电脑时：`sandboxType = Cloud` 转为选择器的 `-1`；个人电脑保留具体 ID。项目自定义目录只取 `fileWorkspacePath`，缺失或为空表示默认目录，不使用 `agentWorkspacePath` 或兼容字段 `workspacePath` 补位。列表与详情入口都按此规则解析后，使用 `workspacePath` 向首页传递目录。

仅当前选中的个人电脑 ID 与项目记录一致时回显项目自定义目录。选择云端或其他个人电脑时清空旧目录；切回项目原个人电脑时恢复该目录，用户仍可改选默认目录或另一个目录。项目原电脑离线、首次候选列表不包含该电脑时，同步采用选择器实际回落的选项，不再出现“显示云端但保留个人电脑目录”的组合，发送也采用回落后的电脑与目录。

本次项目新建任务中，离开个人电脑前按 `sandboxId` 暂存当前目录，切回时优先恢复该电脑本次的选择，包括用户主动选择的默认目录。没有本次选择时，才按项目 ID 匹配规则回填接口目录；不同电脑之间不共用目录。再次新建任务（含同项目重复点击）、切换项目或移除项目关联时清空暂存，重新以入口和最新项目接口配置为准。

常规项目上框关闭 Agent 记忆自动回填，避免覆盖项目配置；已展示过的电脑在后续列表刷新中暂时缺失时，仍沿用选择保护规则，不据短暂列表缺失自动切换。

代码入口：[推荐位任务态与项目类型映射](../../src/constants/recommendAgentPolicy.constants.ts)、[首页发送计划](../../src/utils/homeSendPlan.ts)、[创建会话](../../src/hooks/useConversation.ts)、[创建项目](../../src/pages/SpaceCreateProject/utils/projectCreateStrategy.ts)。

## 7. sandboxId 值与请求阶段

| 值或字段 | 本文含义 |
| --- | --- |
| 创建请求不传 `sandboxId` | 本次创建不主动指定环境，不等于明确选择云端 |
| `sandboxId = -1` | 明确采用云端选项，不是实际容器实例 ID |
| 具体 `sandboxId` | 指定某个环境；项目记录需结合 `sandboxType` 判断云端或个人电脑，不能只看数字正负 |
| `selectedComputerId` | 前端选择或跳转状态，包括默认值、记忆、继承和手选，不代表一定发生过人工点击 |
| `agent.sandboxId` | Agent 自身的环境绑定 |
| `conversationInfo.sandboxServerId` | 已有会话记录的环境，用于主 Chat 页恢复和发送 |

平台首页处理的是创建请求；Agent 首页主要透传跳转状态；会话首页和已有会话处理的是 chat 请求。不同阶段当前是否携带参数应分别核对，不能由“页面有没有下拉框”直接推导所有后续请求。

## 8. 当前未统一的入口与边界

以下保留为当前实现差异，不表示已经统一为同一产品规则。

| 编号 | 场景 | 当前差异 |
| --- | --- | --- |
| D1 | 首页创建与会话发送 | 首页隐藏选择器时不传；主 Chat 发送仍按生效环境传参，解析为空时兜底 `-1` |
| D2 | Agent 首页透传 | 没有首页同款隐藏过滤；`selectedComputerId` 或 URL 的 `sandboxId` 可能随跳转进入聊天页 |
| D3 | 清空上下文、调试重建 | 主 Chat 清空后创建仍带 Agent 绑定或 `-1`；部分调试入口沿用当前选择或绑定重建 |
| D4 | 独立创建全栈应用弹窗 | 固定传 `sandboxId = -1`，没有采用首页的隐藏过滤判断 |
| D5 | 主 Chat 与开发面板 | 主 Chat 增加当前会话记录优先规则；AppDevPro、ConversationAgent 等主要按“当前选择 → PUSH 带入 → Agent 绑定 → 会话记录”解析 |
| D6 | ID 类型 | 普通会话创建支持数字或字符串归一；项目创建、部分调试重建仍直接使用 `Number(...)`，非数字 ID 存在转成 `NaN/null` 的风险 |
| D7 | 配置缺失 | `allowPrivateSandbox` 缺失时首页与 Agent 首页的展示判断不同 |

排查入口：[主 Chat 发送与兜底](../../src/pages/Chat/index.tsx)、[清空后创建](../../src/pages/Chat/hooks/useChatConversation.ts)、[Agent 首页透传](../../src/components/business-component/ConversationDetails/index.tsx)、[全栈应用创建弹窗](../../src/components/business-component/CreateUserApp/index.tsx)、[编排预览](../../src/pages/EditAgent/PreviewAndDebug/index.tsx)、[开发面板解析](../../src/pages/AppDevPro/index.tsx)。

## 9. 回归检查入口

| 检查内容 | 现有测试 |
| --- | --- |
| 首页隐藏时不带旧选择、全栈项目不带项目沙箱、常规项目继承及修改 | [homePinnedProjectRepeatPin.test.tsx](../../tests/chatConversation/homePinnedProjectRepeatPin.test.tsx) |
| 首页发送计划、项目上框与个人目录 | [homeSendPlan.test.ts](../../src/utils/homeSendPlan.test.ts) |
| 创建请求未选不补 `-1`、已选云端或个人电脑正常传参 | [useConversationCreateSandbox.test.tsx](../../tests/chatConversation/useConversationCreateSandbox.test.tsx)、[workspaceDirCreate.test.tsx](../../tests/conversation/workspaceDirCreate.test.tsx) |
| 空会话改选、历史会话恢复与锁定 | [useChatSandbox.test.tsx](../../src/pages/Chat/hooks/useChatSandbox.test.tsx)、[resolveComputerSelection.test.ts](../../src/components/business-component/UnifiedChatSession/resolveComputerSelection.test.ts) |
| 记忆回填、候选列表刷新、固定绑定与仅云端模式 | [ComputerTypeSelector/index.test.tsx](../../src/components/ChatInputHome/ComputerTypeSelector/index.test.tsx) |

这些测试是对应行为的排查入口，不代表表格内所有配置组合均已有自动覆盖。调整逻辑后应执行 `npm run test:conversation`，发送计划另跑 `pnpm exec vitest run src/utils/homeSendPlan.test.ts`；页面验收按本文的 Agent 类型和状态逐项检查。
