# 项目/会话目录跨页面更新同步方案（含 app-pro 接入指南）

> 状态：已落地（2026-09-16，验收通过待提交）。关联工件：`specs/project-conversation-sync.md`（规格）、`plans/20260916-project-conversation-sync-*.md`（intent/plan）。本文是工程侧总入口：方案全景 + 收发点位清单 + **app-pro（全栈 IDE）接入指南**（第 4 节，含 `nameDefined` 规则）。

---

## 1. 背景与问题

单栏（style3）左侧栏常驻展示最新的项目/任务及其子会话的名称与状态；侧栏在全屏工作台页（AppDevPro 等）**不重挂载**，`ProjectPanel` 仅在 spaceId 变化时重拉接口。因此任何其他页面的改名、首条消息自动命名、IDE 自动生成项目名、会话运行状态变化，若不主动推送，侧栏将永久陈旧。经典风格 style1/2 与单栏挂载**同一套** `NewHomeSection/ProjectPanel/useHomeSectionData`，一次接入双风格同时生效。

改造前的缺口：

| 维度 | 缺口 |
| --- | --- |
| 项目 | 重命名/删除/新建**零广播**，全部本地 setState，跨页一致性完全依赖组件重挂载 |
| 会话改名 | `conversation-updated` CustomEvent 仅任务列表监听；项目子行、历史会话页、管理页不感知 |
| 自动命名 | 双线 topic 更新只发 `RefreshConversationList`（任务列表重拉），项目子行拿不到新名 |
| 会话状态 | `UpdateConversationListTaskStatus` 仅任务列表消费，项目子行「执行中」不实时 |
| 新建会话 | 绑定项目创建成功后无事件，子行不出现 |

## 2. 方案总览

### 2.1 架构

**数据所有权不动**：各列表仍自持本地 state + 接口拉取；事件只做「**幂等本地补丁（最快路径）+ 失效静默重拉（兜底）**」信号。

```
写操作（接口成功后）──emit──▶ 领域事件（eventBus）──▶ 消费方
                                  ▲                       │
legacy 通道（window CustomEvent × 2、   └── 单向桥接 ──┘   ├─ applyXxxToList 幂等补丁
UpdateConversationListTaskStatus）           （app.tsx 全局安装）└─ created/deleted → 定向失效重拉
```

**两个判别联合领域事件**（优于细粒度多事件：同一业务写操作只发一个事件，避免创建+集合变化双事件重复重拉；已否决备选见 spec）：

```ts
// src/types/directorySync.ts
type ProjectRef = {
  projectId: string;
  projectType: AgentComponentTypeEnum; // 身份匹配至少比 projectId+projectType，有 spaceId 同时比空间
  spaceId?: string;
};

type ConversationChangedEvent = {
  type: 'conversation.changed';
  operation: 'created' | 'updated' | 'deleted';
  conversationId: string;
  project?: ProjectRef; // 带项目引用时，消费方做定向子会话失效
  patch?: { topic?: string; icon?: string; taskStatus?: TaskStatus };
  reason: string; // rename / auto-topic / task-status / create / delete
  origin: string; // 发射方标识（调试 + 回声分析）
  eventId: string;
};

type ProjectChangedEvent = {
  type: 'project.changed';
  operation: 'created' | 'updated' | 'deleted';
  project: ProjectRef;
  patch?: { name?: string; description?: string; icon?: string | null };
  reason: string; // rename / auto-metadata / create / delete
  origin: string;
  eventId: string;
};
```

### 2.2 核心规则

1. **接口成功才发事件**；失败保持各页面现有错误处理，不广播。
2. **单业务单事件**：一次写操作只发一个领域事件，不叠加「集合变化」事件。
3. **幂等补丁**：`applyConversationChangedToList/applyProjectChangedToList` 无变化返回原引用，防重复渲染；支持 `topicField: 'name'` 字段映射（任务列表用 `topic`、项目子行用 `name`）。
4. **身份守卫**：项目匹配 `projectId + projectType (+ spaceId)`；跨空间/类型不匹配自然 no-op。
5. **legacy 单向桥接**：`conversation-updated`/`conversation-deleted`/`UpdateConversationListTaskStatus` 桥接进新协议；旧通道与旧监听（如 conversationPageCacheManager）保留不动。**新代码禁止再发 legacy 事件**。
6. **轮询发现不冒充创建**：观察到后端已有会话（如 ConversationAgent `devConversationId` 轮询）不发 created。
7. **PageApp 契约缺口**：项目改名/删除对 PageApp 仅本地生效（后端无契约），**不广播**（`persisted` gate，见 ProjectPanel）。

### 2.3 底座文件

| 文件 | 职责 |
| --- | --- |
| `src/types/directorySync.ts` | 事件与身份类型 |
| `src/utils/directorySyncEvents.ts` | `emitConversationChanged/emitProjectChanged`、`subscribeXxx`（返回退订）、引用计数桥接 `installDirectorySyncLegacyBridge`、幂等补丁助手、`matchesProjectRef` |
| `src/hooks/useDirectorySync.ts` | `useConversationChanged/useProjectChanged`（handler ref 保新、自动清理、随订阅装桥接） |
| `src/app.tsx` | 全局装一次桥接（dispose 安全，HMR/测试可重装） |
| `src/types/enums/event.ts`、`src/constants/event.constants.tsx` | 注册 `directory_conversation_changed`/`directory_project_changed` |
| `tests/directorySyncEvents.test.ts` | 协议、桥接只装一次、退订、幂等、身份匹配 |

## 3. 收发点位全景

### 3.1 发射点（写操作收口，按服务层调用点不按 UI 入口）

| 操作 | 位置 | 事件 · reason |
| --- | --- | --- |
| 会话自动命名（runtime 线） | `features/conversation/react/runtimeLineHttp.ts:164`（topic.update 成功后） | conversation.updated · auto-topic |
| 会话自动命名/改名（legacy 线） | `models/conversationInfo.ts` runUpdateTopic onSuccess | conversation.updated · auto-topic |
| 会话创建 | `hooks/useConversation.ts:120`（带 project 引用）、`pages/Chat/hooks/useChatConversation.ts`（清空新建） | conversation.created · create |
| 首页建项目（含连建会话） | `pages/SpaceCreateProject/utils/projectCreateStrategy.ts:111`（ProjectCreated + ConversationCreated 双事件） | project/conversation.created · create |
| 管理页建常规项目 | `SpaceProjectManage/components/CreateNormalProjectModal`（含 conversationId） | project/conversation.created · create |
| 建全栈项目 | `AppDevPro/components/CreateUserApp`（create 分支） | project.created · create |
| 项目改名（侧栏） | `NewHomeSection/components/ProjectPanel` handleProjectRenameSubmit（仅真实接口成功分支，PageApp 不广播） | project.updated · rename |
| 项目改名（管理页/编辑弹窗） | `SpaceProjectManage/index.tsx` handleRenameSubmit、`EditNormalProjectModal` | project.updated · rename |
| 项目改名/自动元数据（app-pro） | `AppDevPro/index.tsx:655`（applyMetadata）、`CreateUserApp`（update 分支） | project.updated · auto-metadata / rename |
| 项目删除 | ProjectPanel / SpaceProjectManage / NormalProject / UserAppProject 四处 | project.deleted · delete |
| 会话改名/删除（存量 UI） | ConversationContextMenu、Chat DropdownChangeName、HistoryConversationList 等 legacy CustomEvent → 桥接 | conversation.updated/deleted |
| taskStatus | 双线既有 `UpdateConversationListTaskStatus` 发射点 → 桥接 | conversation.updated · task-status |

### 3.2 消费点

| 页面 | 行为 |
| --- | --- |
| **侧栏 ProjectPanel**（第一优先） | 子行 topic/icon/taskStatus 幂等补丁（topicField 'name'）；created/deleted 带 project 引用 → 该项目子行失效重拉（per-project revision 防陈旧回写）；project.updated 补 name；project.created 静默重拉首页；project.deleted 过滤 + 清 pinned/archived/collected 标记 |
| 侧栏任务列表 `useHomeSectionData` | 已迁统一订阅：created 无 project 引用才重拉（项目会话被 projectFilter 排除）；updated/deleted 补丁 + topic/icon 变化静默重拉兜底 |
| `SpaceProjectManage` | 列表补丁 + 相关任务 conversations state/双 ref Map 补丁；created/deleted 重拉 |
| `NormalProject` / `UserAppProject` / 两 Detail 页 | 同款补丁；Detail 页 project.deleted 自动跳回 project-manage |
| `HistoryConversationList` | ref API（updateItemTopic/removeItem/refresh）按 tab 分流 |
| **AppDevPro** | userAppInfo 补丁回写顶栏；project.deleted 跳 project-manage |
| Chat 页（model 线）/ `useConversationRuntimeSession`（runtime 线） | 当前会话命中 conversationId 时标题/状态回写（双线各自订阅） |

---

## 4. app-pro（全栈 IDE）接入指南 ★

负责 app-pro 的同学看这节即可。分两部分：**已接线（无需开发）** 与 **待接入（nameDefined 规则）**。

### 4.1 已接线：自动生成项目名/会话名的广播已就位

**项目名自动生成（Prompt 创建后 `useInitProjectMetadata`）**

链路：`AppDevPro/index.tsx:645` 起，`applyMetadata` 调 `apiUserAppUpdate` 写入 name/description/icon → 成功后 `emitProjectChanged({ operation:'updated', reason:'auto-metadata', patch:{name,description,icon} })`。侧栏项目行、管理页、详情页会即时收到新名，**同事无需再做任何开发**。

**会话名自动生成（面板首条消息 topic）**

**与普通会话完全一致，无 app-pro 特殊分支**：链路、触发时机、`topicUpdated` gate 全部复用既有会话自动命名逻辑（首事件时机 + 未手动命名判定，即 bug2382 修复后的链路）——面板首条消息 → runtime 线 `runtimeLineHttp.ts:164`（默认线）/ legacy 线 `models/conversationInfo.ts` runUpdateTopic → `emitConversationChanged(reason:'auto-topic')` → 侧栏项目子行/任务列表/历史页补丁。**同事无需在面板侧做任何事**；`nameDefined` 只约束项目名，**不引入会话级新规则**。唯一红线：不要在 app-pro 内自行调 `apiAgentConversationUpdate` 改名而不发事件（走双线既有链路）。

**app-pro 自身作为消费方**

`AppDevPro/index.tsx:228` 起已订阅 `useProjectChanged`：守卫 `projectType===UserApp && projectId===appId && spaceId 匹配`；updated → `userAppInfo` 幂等补丁（顶栏名即时刷新，别处改名也能同步进来）；deleted → `history.replace` 跳回项目管理页。

### 4.2 待接入：`nameDefined` 规则（后端已实现，前端接入三步）

**语义（产品定调）**：自动生成项目名**只在项目未被用户定义过名称时生效**。**后端已实现**该逻辑并下发字段；前端当前未消费（`UserAppInfo` 无此字段、`applyMetadata` 无条件写 name），接入三步即可。

| `nameDefined` | 含义 | 自动生成行为 |
| --- | --- | --- |
| `false` | 仍是默认名（如「未命名项目」） | **允许**自动生成覆盖 name |
| `true` | 用户定义过（手动改名/明确命名） | **不再**自动更新 name（icon/描述回填策略维持现状） |

**接入步骤**：

1. **补类型字段**：`UserAppInfo`（`src/types/interfaces/userProject.ts:375`）加 `nameDefined?: boolean`；首次联调时核对回包取值形态（boolean 还是 0/1——仓库有 `topicUpdated` 用 0/1 的先例，以后端实际回包为准）。
2. **自动生成分支加 gate**（`AppDevPro/index.tsx` `applyMetadata` 内）：

   ```ts
   const meta = await fetchGeneratedMetadata(prompt);
   const allowRename = userAppInfo?.nameDefined === false; // 仅未命名项目允许自动改名
   await apiUserAppUpdate({
     id: appId,
     // nameDefined=true 时不动 name，只回填 icon/description
     ...(allowRename && meta.name ? { name: meta.name } : {}),
     description: meta.description?.trim() || undefined,
     icon: meta.iconUrl?.trim() || undefined,
   });
   emitProjectChanged({
     operation: 'updated',
     project: {
       projectId: String(appId),
       projectType: AgentComponentTypeEnum.UserApp,
       spaceId: String(spaceId),
     },
     // name 没写就不带进 patch —— 补丁幂等，事件层无需感知 nameDefined
     patch: {
       ...(allowRename && meta.name ? { name: meta.name } : {}),
       description: meta.description?.trim() || undefined,
       icon: meta.iconUrl?.trim() || undefined,
     },
     origin: 'app-dev-pro',
     reason: 'auto-metadata',
   });
   ```

3. **手动改名置位（后端负责，前端只消费）**：后端已实现 `nameDefined` 逻辑，手动改名/明确命名后应置 `true` 并在详情回包体现——前端无需自行置位，联调时验证一次「改名 → 重拉详情 → nameDefined 为 true → 再次自动生成不覆盖」即可；若发现后端未置位，再回到此节补前端兜底。
4. **事件协议不变**：`nameDefined` 是「是否允许写」的业务 gate，写在 gate 侧即可；事件只反映真实写入结果（写了 name 才带 name 进 patch）。

### 4.3 维护守则（改自动生成/项目元数据逻辑时的 checklist）

- [ ] 新增写路径（换接口、加字段）必须**接口成功后** emit 对应领域事件；禁止发 legacy CustomEvent 新增点。
- [ ] `reason` 语义保持：自动生成 `auto-metadata`、手动改名 `rename`、创建 `create`、删除 `delete`——消费方当前不分支 reason，但它是排障定位的依据。
- [ ] 订阅守卫三件套不省略：`projectType===UserApp && projectId===appId && spaceId 匹配`，缺一条都会串页/跨空间误伤。
- [ ] PageApp 教训：契约未覆盖的写操作**不广播**（见 ProjectPanel `persisted` gate），否则其他页面会 patch 未持久化的名字、重拉后跳回。
- [ ] 若未来 app-pro 面板需要展示会话 topic：直接消费 `conversationInfo`/`useConversationChanged` 按 conversationId 命中，不要另建拉取链路。

### 4.4 自测路径

- 自动元数据：Prompt 创建全栈应用 → 首条消息后侧栏项目行名称即时变化（单栏/经典双形态都验）；`nameDefined=true` 场景改名后再次 Prompt 创建同项目，侧栏名称不应被自动覆盖。
- 别处改名回写：侧栏右键重命名当前打开的 app-pro 项目 → IDE 顶栏名称即时刷新。
- 删除联动：侧栏删除当前打开的项目 → IDE 自动跳回项目管理页。
- 会话名：面板首条消息 → 侧栏项目子行从「新会话」变为自动生成名。

---

## 5. 通用接入模板

**新消费方**（任何展示项目/会话目录数据的页面）：

```tsx
const [list, setList] = useState(items);
useConversationChanged((event) => {
  setList((prev) =>
    applyConversationChangedToList(prev, event, {
      topicField: 'topic' /* 子行用 'name' */,
    }),
  );
  if (
    event.project &&
    (event.operation === 'created' || event.operation === 'deleted')
  ) {
    refetchChildrenOf(event.project); // 定向失效重拉，勿整页刷新
  }
});
useProjectChanged((event) => {
  if (
    event.project.spaceId !== undefined &&
    event.project.spaceId !== String(spaceId ?? '')
  )
    return;
  if (event.operation === 'created') return refetchFirstPage();
  setList((prev) => applyProjectChangedToList(prev, event)); // deleted 也走它（内部过滤）
});
```

**新发射方**（新的目录写操作入口）：

```ts
const res = await apiXxxUpdate(payload);
if (res?.code === SUCCESS_CODE) {
  emitProjectChanged({
    operation: 'updated',
    project: { projectId: String(id), projectType, spaceId: String(spaceId) },
    patch: { name },
    origin: 'your-surface', // 页面/组件标识
    reason: 'rename',
  });
}
```

**测试**：纯函数用例直接测 emit/subscribe/applyXxxToList；组件用例 mock umi（`useModel/useLocation` 等，仓内已有先例，见 `ProjectPanel/index.selection.test.tsx`）；会话路径改动必跑 `npm run test:conversation`。

## 6. 验收现状（2026-09-16）

**自动化门禁**：

- `npm run test:conversation`：86 文件 / 767 用例全绿（含门面 4 用例、ProjectPanel 改名补丁与请求竞态 2 专项）。
- `npm run lint:arch`：本方案零新增（现存 2 条 `SpaceProjectManage → AppDevPro` 违规为历史版本功能带入的存量，另案处理）。
- tsc：521 < 基线 524，零新增且消除 3 个存量错误。

**浏览器走查（dev + testagent，单栏 style3，真实数据，验收后已还原清理）**：

- 项目改名 ↔ IDE 顶栏双向同步（三轮）✅
- 项目子行改名 → Chat 标题即时回写，同名会话零串扰 ✅
- 首页新建任务：created 事件 1.15s 内触发任务列表重拉（performance 实锤），自动命名同步到列表行 ✅
- 项目「+」直建子会话：4s 内子行 7→8 出现 ✅
- app-pro 自动生成项目名 → 侧栏实时跟改 ✅（**同时实测复现 nameDefined 待接入场景**：用户定过名的项目被自动生成覆盖，已还原）
- 删除同步：子会话删除子行 8→7、任务会话删除列表行即时消失 ✅

**附带发现（存量问题，非本方案引入）**：

- 管理页「新建项目」在 test 环境返回 200 但 code 非 success，`CreateNormalProjectModal` 失败分支静默无提示，建议另开单。
- `loadList` 的 `loadingRef` 在途守卫会偶发吞掉 created 触发的重拉，由会话结束 `RefreshConversationList` 兜底补拉，最终一致。
- 后端列表接口对新会话有秒级可见性延迟；app-pro 全栈会话的后端 topic 生成较慢——均为后端时机，前端链路无恙。
- 执行中（taskStatus）瞬时态走查未抓取到（agent 回复过快），该点位由单测幂等补丁用例覆盖。

## 7. 边界与演进

**本期明确不做**（spec 有据）：跨标签页同步（BroadcastChannel）、收藏/置顶/归档同步、轮询发现冒充创建、service 层自动广播（缺 reason/origin/项目上下文）。

**演进方向**：flag 类操作同步（扩 patch 或 operation）；跨标签页（BroadcastChannel，消费方订阅层不变，仅桥接层扩展）。
