# 0930 剩余前端：IM 任务与资料库跟进草案

- 日期：2026-10-02。
- 范围：飞书「本次版本剩余未完成内容」第 10 条 IM、第 12 条资料库 BUG 的前端部分。独立应用前端属于本次范围。
- 状态：IM 按「会话关联女娲任务」已实现只读界面与显式开发 mock。关联明细及真实成员授权仍需确认；资料库具体 BUG 清单待答。
- 下文第 1–4 节保留首次核对和契约草案，实际实现及交付以上方本轮记录、[一期规格](../specs/release0930-im-tasks.md)为准。

## 本轮实际实现与交付

- 独立 IM 子仓前端分支 `codex/release0930-im-tasks-20261002` 已提交并推送 **`172d23cf1d299d426351a52baf37119274bafc8a`**；17 个路径只涉及前端与测试，没有后端/依赖锁改动。
- 只读任务页签、状态、会话隔离、任务/产物分别重试、刷新失效、文本/图片预览及 Blob 下载已实现。固定 fixture 模拟绑定投影，不调用真实成员或绑定接口。实际资源契约为 `readArtifact → text | Blob`，没有任意 URL 打开入口；下方 `openArtifact` 等属于原草案。
- 子仓测试 1355 项全绿，正式 platform build 含 tsc 成功，业务 JS 不含运行期 fixture。根浏览器已进入 IM mock 登录，通知权限提示将控制权交给用户；任务按钮、预览/下载、错误重试和长内容宽度仍待继续，不能记为页面已验。
- 主仓标准构建只接受上游 main 历史的固定 pin。保持 gitlink、adapter pin **`65779cc`** 与 main guard，通过已有 `micro-frontends/message/adapter.patch` 集成新任务前端；子仓 feature SHA 是实现来源，不能写成主仓产物 manifest 的 `source.commit`。
- 真实任务 provider 仍为不可用；默认和生产隐藏所有任务入口，只有显式 Vite DEV mock 可看 fixture。真实接口、成员与产物授权、产物部署另行验收。
- 未来只有新 pin 本身已含等价任务实现、且满足 main 历史与 gitlink 配对时，才从适配补丁移除重复的任务差异并重验。远程 main 已合入而 pin 仍为 `65779cc` 时不能删；squash 合入需检查文件等价性，不能只看 feature SHA 祖先关系。

## 1. 当前源码证据

核对主检出已初始化子模块：IM `65779cc21fe5d394e532c7b5c05f5816bd31a792`；资料库 `ff0e6e6e4a322436bd0330a2ee48445429e22738`。两者与 remaining 中的 `micro-frontends/*/adapter.json` 固定 pin 一致。下列路径相对于 `/Users/apple/workspace/nuwax`；源码、构建产物和真实环境验收分别取证。

| 对象 | 已有实现 | 与剩余需求的关系 |
| --- | --- | --- |
| IM 建群、加成员 | `submodules/nuwax-im/nuwax-im-web/src/components/CreateGroupModal.tsx`、`AddMemberModal.tsx` 支持用户和智能体；支持智能体群成员唤起/监听模式 | 有前端实现，后续需实际联调回归；不能据此认定关联任务已做 |
| IM 会话导航 | `nuwax-im-web/src/lib/topTabs.ts` 和 `components/ChatWindow.tsx` 包含消息、成员、文件、搜索、置顶、公告、设置、入群申请、资料库 | 当前未见任务页签或对应任务列表渲染 |
| IM 文件面板 | `components/ChatFilesPanel.tsx` 调用 `msgApi.files`，列出消息附件 | 消息附件不能替代女娲任务产物查询 |
| IM → 平台会话绑定 | `nuwax-im-core-domain/.../model/AgentBinding.java`，对应 `im_agent_binding`；`nuwax-im-core-application/.../agent/ImAgentChatService.java` 的 `ensureChatConversationAsync` | 已存在可用关联线索，但尚未暴露为前端任务查询契约 |
| 平台任务模型 | `src/types/interfaces/conversationInfo.ts`、`userProject.ts`、`src/types/enums/agent.ts` | 会话有 `taskId`、`taskStatus`、`type`、主题、智能体、时间等字段；目前不是已证实的逐轮执行历史接口 |
| 平台产物呈现 | `src/utils/taskResult.ts`、`src/components/MarkdownRenderer/TaskResult/*` | 已有 `<task-result>` 文件摘要与预览入口，可复用字段/呈现方式，不能把消息原文直接当作完整产物列表接口 |

### 1.1 关联模型必须保留的区别

现有绑定一行是「IM 会话 × 智能体」，键为 `(convId, agentSubjectId)`，其中 `chatConversationId` 指向平台智能体会话。首次真正聊天前创建平台空会话并存回，之后复用；移除智能体时绑定仍保留，重新拉回时复用原平台上下文。

因此：

- IM `convId`、平台 `chatConversationId`、平台 `taskId` 是不同标识；所有跨应用 ID 在新前端契约中按字符串传输，保持 IM 64 位 ID 精度约定。
- 一个群可有多个智能体绑定；一个绑定的平台会话可被多次执行。现有绑定不能证明「一条 IM 消息 = 一条任务」或「每轮执行都能独立列举」。
- IM `spaceId` 是资料库空间关联，单聊也可懒建空间；它不等于平台项目 ID，也不能用来推导关联任务列表。
- 群聊创建的平台会话使用群代理身份，私聊使用人的身份；群成员看到消息不自动意味着可以读取群代理的整个平台会话、工作目录或产物。
- `MessageDto.agentStatusDetail` 是发送者本人可见的「此消息交给智能体处理的状态」，有自己的数值状态；不能替代平台 `TaskStatus` 或群任务授权。

## 2. IM 一期最小范围

### 2.1 推荐关联口径

先按现有绑定取「当前 IM 会话关联、当前访问者获准查看的女娲任务」。在没有独立执行历史接口时，一条记录表示一个关联平台会话的当前/最近任务状态；不伪造历史任务或逐消息任务。若后端提供独立执行记录，再以明确的执行 ID 区分。

mock 先采用当前成员中的智能体绑定作为来源。退出群的智能体所保留的历史绑定是否继续展示、是否还需手工关联项目任务，列为待确认，不自行扩大查询。

### 2.2 用户流程

1. 在右侧会话窗口顶部增加「任务」页签，复用现有添加/管理页签机制；不改左侧「消息 / 智联录」导航。私聊和群聊均可进入，没有关联任务时显示成功空态。
2. 点开页签按当前 IM 会话加载任务；列表展示主题、智能体名称、状态、最近更新时间与产物数量。主题缺失时取智能体名称，再回落「未命名任务」。
3. 展开一项查看已有产物：名称、描述、文件类型及可用的查看入口；无产物显示「暂无产物」，执行中无产物显示「任务执行中，暂无产物」。
4. 状态与产物加载失败分别显示原因和重试；刷新更新当前页。任务页签打开时才查询，切换会话隔离缓存与迟到响应。
5. 真实文件查看使用服务端授权后的资源引用/访问地址。mock 用本地固定的文本、图片等示例展示，不请求真实工作目录或伪造真实文件地址。

一期只查看任务和产物，不加入创建、取消、重试执行、编辑、手工关联/解绑、批量管理、执行历史时间线。列表刷新仅重读数据，绝不触发模型调用。

### 2.3 状态与权限

| 原模型状态   | 页签文案 |
| ------------ | -------- |
| `CREATE`     | 待开始   |
| `EXECUTING`  | 执行中   |
| `COMPLETE`   | 已完成   |
| `FAILED`     | 执行失败 |
| `CANCEL`     | 已取消   |
| 空值或未知值 | 状态未知 |

Ask 等待不是已证实的平台任务枚举；没有对应字段时不新增 `WAITING` 并假定后端支持。失败和取消任务仍可展示已有且授权可见的产物。

生产查询必须由服务端检查租户、IM 会话成员资格和平台任务/产物读取权限，只返回可见数据。前端不传任意 `userId` 或以群代理身份冒充请求，不用「任务负责人是我」替代真实权限判定。主站 `hasPermission` 注释指使用智能体权限，不能直接推导所有产物读取权限。

默认只展示后端授权返回的结果；权限未明时禁用真实详情/文件操作。mock 可覆盖普通成员、管理员、无权限等状态，不能作为正式权限规则已落实的证据。

## 3. 复用与接入边界

| 现有能力 | 本期复用方式 | 限制 |
| --- | --- | --- |
| IM `topTabs`、`ChatWindow` | 新增 `tasks` 定义及内容分支，沿用页签偏好、关闭回消息、子根弹层和隐藏保活机制 | 尚无任务实现，不能仅加「尚未接入」占位当作完成 |
| 主站 `ConversationInfo` / `UserProjectConversationInfo` | 对齐 ID、主题、智能体、状态与时间字段；在 IM 独立 bundle 中定义必要投影 | 不跨 bundle 导入 umi、主站 model 或页面组件 |
| `ConversationPanel`、`TaskListSection` | 参考任务行信息布局 | 前者包含新建入口和仅负责人可点策略，后者含置顶/归档/收藏；不整体复用为只读群任务页 |
| `TaskResultRow` | 纯展示可抽取为共享纯组件，或在 IM 按同字段呈现 | `TaskResult/index.tsx` 依赖主站页面 model，不能直接嵌入 IM |
| IM 文件图标、长文件名提示、图片预览 | 复用纯展示及文件名处理 | `saveAndOpenMedia` 同时触发落盘，不作为「查看产物」的默认点击行为 |
| `resolveConversationRoute` | 如后续需要打开原任务，由宿主按已授权的平台会话元数据计算普通/IDE 路由 | 不手拼所有任务都指向 `/home/chat`；现有 IM `onNavigate` 不能跨应用导航 |

`src/layouts/MicroAppHost/index.tsx` 的 `onNavigate` 只允许当前微应用业务路径；IM `hostRuntime.ts` 目前仅声明此回调。因此最小方案先在任务页签展示任务信息与产物。需要跨主站打开原任务或使用主站文件预览时，应显式设计受限宿主能力并做合同测试；不能放宽现有导航白名单到任意地址。

本仓已有 `micro-frontends/message/adapter.patch` 与 `overlay/` 隔离适配路线。实际开发前由 root 选择受控适配层或独立 IM 分支交付；本轮不直接修改主检出子模块。无论路径，最终须重建 `/micro-apps/message/` 并校验 manifest pin/适配摘要，源码存在不代表测试环境已生效。

## 4. mock 适配契约草案

以下是 UI 数据源契约，不是已存在的后端接口、URL 或最终 Swagger。真实 API 由独立 adapter 转成同一投影；mock 与真实 provider 显式选择，不改变已有 `VITE_IM_AUTH_MODE=platform`，不把接口异常静默降级为假数据。

```ts
type TaskStatus = 'CREATE' | 'EXECUTING' | 'COMPLETE' | 'FAILED' | 'CANCEL';

type TaskArtifact = {
  id: string;
  name: string;
  description?: string;
  mimeType?: string;
  size?: number; // 未知时不伪装为 0 B
  availability: 'available' | 'unavailable'; // UI 投影，不声称后端已有该枚举
  unavailableReason?: string;
  resourceRef?: string; // 不透明、已授权的引用；不由前端猜目录
};

type ConversationTask = {
  key: string; // 默认平台会话 ID；独立执行历史需另有稳定执行键
  imConversationId: string;
  platformConversationId: string;
  agentSubjectId: string;
  agentId: string;
  agentName?: string;
  title?: string;
  taskId?: string;
  taskStatus?: TaskStatus | string;
  updatedAt?: string; // adapter 统一为有效 ISO 时间
  artifactCount?: number;
};

type Page<T> = {
  records: T[];
  hasMore: boolean;
  nextCursor?: string;
};

interface ConversationTasksProvider {
  listTasks(input: {
    imConversationId: string;
    cursor?: string;
  }): Promise<Page<ConversationTask>>;
  listArtifacts(input: {
    imConversationId: string;
    taskKey: string;
    cursor?: string;
  }): Promise<Page<TaskArtifact>>;
  // UI 点击时才获取可读内容/访问入口；具体返回类型随真实资源契约确认。
  openArtifact(input: {
    imConversationId: string;
    taskKey: string;
    artifactId: string;
  }): Promise<void>;
}
```

provider 错误区分 `unauthenticated`、`forbidden`、`unavailable`、`network`、`not-found`；不把所有错误转换成空数组。产物列表延迟加载，避免一次下载所有消息或所有文件来解析 `<task-result>`。分页大小可先定 20，列表以稳定 key 去重；无游标但 `hasMore=true` 的非法响应显示加载失败。

### 4.1 必备 mock 与验收场景

| 场景 | 预期 |
| --- | --- |
| 单聊和群聊；一个/多个智能体；两个 IM 会话各有任务 | 正确列表，切会话不串数据；不能把同智能体在两个群的绑定合并 |
| 无智能体或尚未形成平台任务 | 成功返回空列表后显示「暂无关联任务」 |
| 五种状态、未知状态、无主题/名称/有效时间 | 文案有兜底，不崩溃，不编造状态或时间 |
| 执行中无产物、完成无产物、失败已有产物、多文件 | 正确区别任务状态与产物存在性；有权的历史产物仍可看 |
| 文本、图片、PDF/其他文件、长中文名、未知大小、产物失效 | 可查看的打开正确；暂不可看的明确提示，长名不撑出横向滚动条 |
| 任务首屏失败、刷新失败、产物局部失败、分页失败 | 首屏失败不显示成功空态；局部失败不抹掉已成功数据，有明确重试 |
| 无权限、401、任务/文件被删除 | 分别提示；401 走已有鉴权清理，403 不当作重新登录；不透露未授权内容 |
| A 会话慢请求晚于 B 会话、重复分页、真卸载后迟到响应 | 仅写入对应会话/有效挂载，去重，不影响新实例认证 |

完成证据应包括独立 IM 定向测试、微应用隔离适配合同、重建产物与浏览器操作。若新增宿主会话/文件能力，再跑相应主站会话质量门和 E2E。mock 通过仅证明前端状态与交互，真实任务关联、授权和资源地址仍需联调。

## 5. 仍需确认的最少业务点

mock 开发可继续按上述默认值；下面两点决定正式接口和最终验收：

1. **关联来源与粒度**：是否接受现有「当前 IM 会话 × 智能体」绑定的平台会话及当前任务；还是要包括每次执行历史、退群智能体历史、手工关联其他项目任务？现有源码只能证明第一种绑定存在。
2. **真实可见范围**：普通成员、群主/管理员、任务发起者各能看到哪些任务和产物；群代理拥有的平台会话如何授权给真实成员？不能从现有 IM 消息状态可见性或项目任务负责人策略直接推导。

是否创建、取消任务不属于本期最小范围，无需先讨论这些操作才能继续只读页签。

## 6. 第 12 条「资料库 BUG」核对

原条目没有具体 BUG、文档链接或复现步骤。现有源码与最近提交能证明一些修复已存在，**未找到足够证据指认一个仍未修复且属于这条版本剩余范围的 BUG**。不能判定本条全部完成，也不从 README 通用 TODO 或存量类型基线扩展需求。

| 最近已有修复 | 可复验线索 | 本次结论 |
| --- | --- | --- |
| `ff0e6e6`，2026-09-30 01:14，完善分享链接 | 从内网 IP/镜像入口打开资料库，复制文档、文件夹或分享链接；应使用租户配置 `siteUrl`，保留路径/query/hash，避免内部域名发给外部用户。`src/lib/paths.ts`、ShareDialog、DocPage 等已有处理 | 代码已包含修复；是否对应 #12、实际租户配置是否正确、是否部署需复验 |
| `188224f`，2026-09-28 16:42，HTML 预览修复 | HTML 的内联脚本字符串含 `<body>`，例如 ECharts toolbox 的新窗口模板；历史现象是预览铺出原始代码。`HtmlPreview.tsx` 的 `BODY_TAG_RE` 已跳过注释/script/style 后定位真实 body | 现有回归候选，不冒充未修 BUG |
| 同提交的表格重放修复 | 已有历史加删工作表操作的表格重新打开；历史「女娲菜单 2」出现网格压成一条/白屏。`SheetEditor.tsx` 已对删除操作验证后状态、禁止破坏性重试，并在结构重放后重建渲染单元 | 需匹配实际问题文档才能验证；不能用一个新空表证明该历史数据问题通过 |

另有宿主文档 `docs/micro-frontend-qiankun.md` 的 2026-09-29 记录：测试环境 `/repo/` 或 `/instant-message/` 直接打开/刷新返回旧独立应用 HTML，主站导航消失，本地正常。该记录可作为真实环境回归项；它指向实际外层网关的业务路径分流，不能未经当前环境验证认定为今天仍存在的资料库业务 BUG，更不能只改静态模板就宣称修好。

**最少缺少信息**：给出 #12 对应的一条 BUG/问题文档链接，或一个受影响资料库文档链接加复现动作、预期/实际现象。若问题依赖角色或环境，再补角色和入口环境即可；不要求提供整个资料库待办清单。

拿到该信息后按「当前 pin 是否已有修复 → 当前 served 产物是否包含 → 原场景能否复现」定位。确实仍复现的前端 BUG 再做限定修复；已修未部署归入交付/联调，不能重复开发。
