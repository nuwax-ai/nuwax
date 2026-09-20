# 实施计划：首页项目列表 P0 两卡（列表不刷新 2407/2413 + 泄漏协作者会话 2465）

- 对应 spec：specs/project-list-p0-fixes-2026-09-20.md
- 状态：已完成（含偏离记录，2026-09-20）
- 分支：`feat-dong.0930` · 日期：2026-09-20 · 分支头 `958cc27b2`
- 关联：zt.nuwax.com 我的（罗东）bug

## Context

### 卡 1 —— 2407 / 2413（P0）

现象：首页输入框建常规项目 → 发送跳 `/home/chat/{cid}/{agentId}` → 会话结束后左侧栏「项目」分组**不出现新项目**，项目名也不更新；只有浏览器手动刷新才出现。

已建成的链路（`5cc0a72ce` 事件总线）确实在工作：`src/pages/SpaceCreateProject/utils/projectCreateStrategy.ts:117-145` 创建后发 `ProjectChanged(created)` + `ConversationChanged(created, project)` 双事件；`src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.tsx:510-518` 收到 created 后 `fetchPage(1, {append:false})` 整表重拉。QA 在新构建仍复现，断点不在「事件有没有发」，而在**这一次重拉之后没有任何补救**：

1. `fetchPage` 的 `append:false` 分支（`index.tsx:321-330`）用回包 `mapped` **整表替换** `projects`。
2. 本应兜底的 60s 事件重放（`index.tsx:313-320`）走 `applyProjectChangedToList`（`src/utils/directorySyncEvents.ts:145-148`）：`targetIndex < 0` 直接 `return list`；且 created 事件不带 `patch`（`src/types/directorySync.ts:29-38` 只有 `project` 三元组）。**这个重放对 created 是空操作，插不进新行。**
3. 本地也没有乐观插入。于是：回包一旦还没有新项目行，行从此**永久缺失**，只能重挂载（F5）才恢复。

「回包还没有新行」不是猜测——仓内已有记载：`docs/project-conversation-sync.md:283`「后端列表接口对新会话有秒级可见性延迟」。**任务列表有 `RefreshConversationList` 兜底补拉（`useHomeSectionData.ts:508-517`）才最终一致，项目面板没有对应物。**

次级成因（同 bug 的另一条独立路径，非本次主修）：经典布局 style1/2 下 `ProjectPanel` 是条件渲染（`ClassicHomeSection.tsx:165-172` 任务 tab 一切就卸载、`ClassicLayout/index.tsx:272-278` activeTab 门控），事件根本没有订阅者。QA 环境为单栏 style3（`347431470` 已锁），`SidebarNavHomeSection.tsx:196` 常挂，不触发。

唯一兜底路 `revalidateVisible()` 也被削掉：唯一调用方 `SidebarNavHomeSection.tsx:50-69` 先过 **30s 节流**（`lastSyncAtRef` 初值 = 挂载时刻），延后那次调用带 `reason='visibility'`（`:56-58` 硬编码）→ 撞上 `:43-49` 活动门控 `!hasExecutingTask && !hasExecutingChildren()` → 直接 return。而「会话跑完后」正好没有执行中会话（任务列表用 `projectFilter:'exclude'`，见 `useHomeSectionData.ts:205-215`，项目会话不算 executing），**兜底被吃掉**。

「项目名不更新」同根因解释：Chat 页自动命名 emit 的 `project.updated` 补丁（`src/pages/Chat/hooks/useChatNormalProjectNameSync.ts:127-143`）落在 `applyProjectChangedToList` → 行不在列表里 → 补丁打空。

### 卡 2 —— 2465（P0）

现象：左侧栏展开某个全栈/常规项目后，**协作者的会话也被加载出来**。

链路：`ProjectPanel/index.tsx:402` `apiUserProjectConversations(projectId, projectType)` → GET `/api/user-project/conversations/{projectId}`。后端按「项目」维度回**该项目下所有用户**的会话，回包行带 `userId: number`（`src/types/interfaces/conversationInfo.ts:343`）与 `userName?: string`，前端 3 个调用方全都原样渲染，没人按归属过滤。

**3 个泄漏点**（全部 import 自共享层 `@/services/userProjectApp`）：

| # | 位置 | 风险 |
| --- | --- | --- |
| 1 | `src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.tsx:402` | QA 报的现场 |
| 2 | `src/components/business-component/HistoryConversationList/ProjectList/index.tsx:309` | 历史会话页「项目」tab，同源同现象 |
| 3 | `src/layouts/DynamicMenusLayout/SidebarSearchModal/sources.ts:198` | 搜索命中他人会话可跳进别人会话 |

**不能动的两处**：`SpaceProjectManage/NormalProjectDetail/index.tsx:153` 与 `AppProjectDetail/index.tsx:204` 走的是**页面自己的接口副本** `src/pages/SpaceProjectManage/services/index.ts:34`（注释即「返回所有用户在该项目的会话，附带会话所属用户名」），语义上就该看全员、靠 `ConversationPanel` 置灰区分。硬过滤会把详情页右侧「相关任务」清空。

契约空白：`docs/`、`plans/`、`specs/` 对该接口零记载，本次沉淀。

---

## 用户已拍板的两条

1. **卡 2 范围 = 三处全修**（含侧栏搜索）。
2. **卡 1 只做有界重试，不插占位行**（不引入「未命名项目」占位名，规避与「名联动勿擅修」的口径混淆）。

---

## 卡 1 实施方案

### 1. `ProjectPanel`：created 事件后有界重拉到「行出现」为止

文件：`src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.tsx`

**a. `fetchPage` 增加可选 `awaitKey` 并返回是否已收敛**（现有 4 个调用方都不看返回值，向后兼容）：

```ts
const fetchPage = useCallback(
  async (
    page: number,
    options: { append: boolean; awaitKey?: string },
  ): Promise<boolean> => {
    // ...现有 version 守卫与请求不变...
    if (requestVersion !== pageRequestVersionRef.current) return false; // 被更新请求顶掉，交由重试收敛
    if (res?.code === SUCCESS_CODE && Array.isArray(res.data?.records)) {
      const records = res.data.records;
      // ...现有 setProjects / 标记回读 / pageRef / total 逻辑不动...
      if (options.awaitKey !== undefined) {
        return records.some(
          (item) =>
            projectKeyOf({
              id: item.projectId,
              projectType: item.projectType,
            }) === options.awaitKey,
        );
      }
      return true;
    }
    return options.awaitKey === undefined;
  },
  [],
);
```

**b. 新增 `settleCreatedProject`**（放在 `useProjectChanged` 订阅之前，与 `invalidateProjectChildren` 同区）：

```ts
/** created 事件后有界重拉：后端列表接口对新项目有秒级可见性延迟
 * （docs/project-conversation-sync.md），单轮重拉在延迟窗口内会用「还没有新项目」的
 * 旧回包整表替换，行自此永久缺失（只能 F5 重挂载才恢复）。这里重试到行出现为止。 */
const CREATED_SETTLE_DELAYS_MS = [300, 700, 1500]; // 首轮立即 + 3 次补偿 ≈ 2.5s 窗口

const settlingCreatedKeysRef = useRef<Set<string>>(new Set());

const settleCreatedProject = useCallback(
  async (project: DirectoryProjectRef) => {
    const key = projectKeyOf({
      id: project.projectId,
      projectType: project.projectType,
    });
    // ProjectChanged 与 ConversationChanged 双事件会各触发一次，去重避免两条并行重试链
    if (settlingCreatedKeysRef.current.has(key)) return;
    if (projectsRef.current.some((item) => projectKeyOf(item) === key)) return;
    settlingCreatedKeysRef.current.add(key);
    try {
      for (
        let attempt = 0;
        attempt <= CREATED_SETTLE_DELAYS_MS.length;
        attempt += 1
      ) {
        if (unmountedRef.current) return;
        const settled = await fetchPage(1, { append: false, awaitKey: key });
        if (settled) return;
        if (projectsRef.current.some((item) => projectKeyOf(item) === key))
          return;
        const delay = CREATED_SETTLE_DELAYS_MS[attempt];
        if (delay === undefined) return;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } finally {
      settlingCreatedKeysRef.current.delete(key);
    }
  },
  [fetchPage],
);
```

配套新增 `const unmountedRef = useRef(false)`，并挂进既有挂载 effect 的 cleanup 置 true（不新增 effect）。`DirectoryProjectRef` 类型从 `@/types/directorySync` 引入。

**c. 两个 created 分支都改调它**：

- `useProjectChanged`（`:516-519`）：`if (event.operation === 'created') { void settleCreatedProject(event.project); return; }`
- `useConversationChanged`（`:499-507`）：`const found = invalidateProjectChildren(event.project); if (!found && event.operation === 'created') void settleCreatedProject(event.project);`

`invalidateProjectChildren` 语义不变：项目行已在本地列表时仍走逐项目子会话补拉；行不在（后端还没回）时才落到 settle 重试。

### 2. 明确不改的部分（附理由）

- **`SidebarNavHomeSection.tsx:56-58` 的 `'visibility'` 硬编码**：确是真缺陷（路由同步被降级成受门控的可见性同步），但重试窗口覆盖面内不需要它；改了会放宽 `155a4b4f2` 有意收敛的「静止切回零请求」。留作后续工单。
- **经典布局条件渲染**（`ClassicHomeSection.tsx:165-172` / `ClassicLayout/index.tsx:272-278`）：超出卡上范围（`src/pages/Home`、`projectCreateStrategy`、`ProjectPanel`），且 QA 环境是 style3 锁定。留作后续工单。
- **名联动**：按卡上要求不碰。「项目名不更新」随行恢复（补丁能落到行上）自动消失，不单独改命名逻辑。
- **不插占位行**：用户已拍板。因此不动 `src/utils/directorySyncEvents.ts` 与 `applyProjectChangedToList`。

---

## 卡 2 实施方案

### 1. 新增纯函数模块 `src/utils/projectConversationOwnership.ts`

utils 只依赖 types/constants（engineering-conventions §4 规则 5），故本模块**不 import services**：

```ts
/** 只保留当前用户自己的项目会话。
 *  后端 /api/user-project/conversations/{projectId} 按项目维度回该项目下所有用户的
 *  会话（契约缺口期，后端不支持 onlyMine），侧栏三处消费方都只要自己的会话；
 *  currentUserId 取不到时**原样返回**（防御式降级，避免把列表清空）。 */
export function pickMineConversations<
  T extends { userId?: number | string | null },
>(conversations: T[], currentUserId?: number | string | null): T[] {
  if (
    currentUserId === undefined ||
    currentUserId === null ||
    currentUserId === ''
  ) {
    return conversations;
  }
  const filtered = conversations.filter(
    (item) =>
      item.userId != null && String(item.userId) === String(currentUserId),
  );
  // 无过滤结果时返回原引用，避免下游 effect 因引用变化反复触发（同 openedAppTabs 教训）
  return filtered.length === conversations.length ? conversations : filtered;
}
```

### 2. 共享服务层 `src/services/userProjectApp.ts:48-56`

`apiUserProjectConversations` 保持函数名与签名不变（4 个测试文件的 mock 因此零改动），在归一化响应前加归属过滤：

```ts
import { UserService } from '@/services/userService';

const resolveCurrentUserId = () =>
  UserService.getUserInfoFromStorage()?.id ?? undefined;

export async function apiUserProjectConversations(
  projectId: number,
  projectType: AgentComponentTypeEnum,
): Promise<RequestResponse<ConversationInfo[]>> {
  const res = await request(`/api/user-project/conversations/${projectId}`, {
    method: 'GET',
    params: { projectType },
  });
  if (Array.isArray(res?.data)) {
    res.data = pickMineConversations(res.data, resolveCurrentUserId());
  }
  return res;
}
```

函数头注释写清三件事：后端回包含协作者会话；本函数是共享层、当前**仅**侧栏三处消费，两个项目管理详情页走页面自己的接口副本、语义上要看全员所以不受影响；后端支持 `onlyMine` 后删除本过滤。

**为何改共享层而不是三个调用方**：三个调用方已确认全部 import 自 `@/services/userProjectApp`，一处收口即三处全修；调用方各自 import `UserService` 会是三份重复，且 `UserService` 的传递依赖（`account` / `router` / `antd`）进 `ProjectPanel` 有触发 vitest 顶层 import 崩的风险（仓内既有坑）。

### 3. 类型与文档

- `src/types/interfaces/userProject.ts` 的 `UserProjectConversationInfo` 注释补一行「含协作者会话，侧栏按 userId 过滤」。
- `src/pages/SpaceProjectManage/services/index.ts:33` 那行已是唯一契约源，本次不改（它就是「看全员」的凭证），但在新建的 spec 里沉淀。

### 4. 规格工件

`specs/project-list-p0-fixes-2026-09-20.md`（本仓 SDLC 链要求，模板在 `templates/`）：两张卡的根因、本期做/不做、验收口径。两卡都是既有代码的缺陷修复，无存量 spec 需对齐。

同时把本计划落到 `plans/20260920-project-list-p0-fixes-plan.md`：`.sdlc.json` 的 `plansDirs` 只认 `plans` 与 `specs`，`plans/` 下有在途改动时 `.claude/hooks/plan-gate.mjs` 才不会在首次改 `src/` 时拦一次（拦了也可直接重试放行，同会话只问一次）。

---

## 测试计划

### 卡 1（失败测试先于修复）

复用 `index.selection.test.tsx` 现成 harness（`respondPage` / `buildRecord` / `defaultConversations` / `emitProjectChanged` / `pageQueryMock`）：

1. **「created 事件后首轮回包还没有新项目：有界重试到行出现，无需手动刷新」**：首屏 `respondPage([项目一])` → emit created(projectId 3) → 第一次响应仍只回「项目一」→ 断言 `pageQueryMock` 被再次调用且「新项目」尚未出现 → 第二次响应改为回「项目一 + 新项目」→ `await waitFor(() => expect(screen.getByText('新项目')).toBeTruthy())`。（现有 `index.selection.test.tsx:361` 那条只 mock「第二拉就返回含新项目」，正是缺口。）
2. **「重试窗口内后端始终不回：重试有界、不会无限请求」**：断言 `pageQueryMock.mock.calls.length` 收敛在 `1 + CREATED_SETTLE_DELAYS_MS.length` 内（总窗 ≈ 2.5s，`waitFor` 需放宽 timeout）。
3. **「双事件连发不产生两条并行重试链」**：emit ProjectChanged + ConversationChanged（带同一 project）→ 断言 `pageQueryMock` 调用数不翻倍。
4. `src/pages/SpaceCreateProject/utils/projectCreateStrategy.test.ts` 补断言（现存完全没验 emit）：NormalProject / UserApp / PageApp 创建后确实 emit `ProjectChanged(created)` + `ConversationChanged(created)`；Agent / Skill / Plugin 不 emit；`conversationId` 缺失时不 emit 会话事件。

### 卡 2

5. `tests/userProjectApp.service.test.ts` 新增：`apiUserProjectConversations` 丢弃 `userId !== 当前用户` 的行、保留自己的、localStorage 无用户信息时原样返回（需 `localStorage.setItem('USER_INFO', JSON.stringify({ id: 7 }))`，key 常量 `src/constants/home.constants.ts:4`）。
6. `src/utils/projectConversationOwnership.test.ts` 新增：纯函数 5 例（全自己 / 全他人 / 混合 / `userId` 缺失 / 无 currentUserId 时返回原引用）。

### 质量门

- `npm run test:conversation` 必跑全绿（触达会话路径硬门；当前基线 93 文件 / 826 用例全绿）。
- `npx vitest run tests/sidebarProjectPanel.test.tsx src/layouts/DynamicMenusLayout/NewHomeSection tests/userProjectApp.service.test.ts src/layouts/DynamicMenusLayout/SidebarSearchModal tests/projectHistoryList.test.tsx src/pages/SpaceCreateProject`
- `npm run lint:arch`：确认零新增违规（`userProjectApp → userService` 可能引入 `no-circular`，有则改用「服务层读 localStorage + `USER_INFO` 常量」的降级写法）。
- tsc 不作门，仅确认改动路径零新增。
- **ego 实测（需你，我无 testagent 登录态）**：testagent 后端走「首页输入框 → 建常规项目 → 发送 → 会话结束」，不切 tab、不 F5，确认左列表即出现新项目；再展开一个多人项目确认只剩自己的会话。

---

## 风险与回退

| 风险 | 缓解 | 回退方式 |
| --- | --- | --- |
| 卡 1 重试在「后端确实不回这行」时空转 4 次 | 有界（4 轮 / ≈2.5s）+ in-flight 去重；每次就是一次已有的 page-query POST | 把 `settleCreatedProject` 调用改回 `fetchPage(1)` 一行 |
| 卡 2 共享层静默过滤误导未来消费方 | 函数头注释写死契约缺口 + 唯一实现；详情页走另一副本不受影响 | 摘掉 `pickMineConversations` 一行 |
| 卡 2 与「切回核对探针」口径不一致导致多拉一次子会话 | 过滤后 children 与 `agent/conversation/list` 的 universe 更接近，理论上更一致；实测多一次请求也只影响 `revalidateVisible` 性能，不影响正确性 | 同上 |
| 卡 2 过滤掉「参与者本人的历史会话」 | 判据是 `userId` 归属而非角色，参与者自己的会话 `userId` 就是他自己，不会误杀 | 同上 |

## 偏离记录

1. **`tests/sidebarProjectPanel.test.tsx` 是红的，且比预期严重**（原计划只当它是复用的回归 harness）。实际它在本次改动前就已经红，两处根因都不在本次两张卡的范围里，但都落在本项目面板的守卫文件里、会污染本次验证信号，故一并修：
   - 置顶后 `.pin-icon` 断言失效：`5e5028a87` 起置顶态改渲染 `.unpin-icon` 槽位；
   - 置顶后本地标记被洗掉：`2e17f6669` 给 `toggleProjectFlag` 加了「成败都向服务端真值收敛重拉」，而本文件的 `apiUserProjectPageQuery` mock 是**静态**回包、永远不带 `pinned: true`，收敛重拉必然把刚落上的标记清掉。改为让 mock 记录服务端真值（读己之写），与 `index.selection.test.tsx` 的同款用例口径一致，并在 `beforeEach` 复位防跨用例泄漏。
   - 归档断言缺二次确认：`9f3292a79` 起归档从 ⋯ 菜单直执行改为「点归档进 armed → 点红色确认才请求」，补上第二次点击。
   修完 5/5 通过。
2. **`npm run lint:arch` 的 3 个 error 确认与本次无关**（改动前后完全一致，均早于本分支存在于 `origin/dev`），已登记进遗留 #5。
3. **卡 1 的 ①「本地 testagent 后端实跑抓事件」未做**：本会话无 testagent 登录态，改为静态链路核实 + 单测锁定（`projectCreateStrategy.test.ts` 现在直接断言 emit 的形态与「哪些类型该发/不该发」，这正是排查的第一个断点）。真机验证仍需你在 testagent 上跑 ego。

## 遗留（本次明确不做，建议各开工单）

1. `SidebarNavHomeSection.tsx:56-58` 延后调用把「路由同步」降级成「受门控的可见性同步」，静止场景下唯一兜底被静默吃掉。
2. 经典布局 `ProjectPanel` 条件渲染：任务 tab 切换即卸载，`project.created` 事件必丢。
3. `dist/` 80MB 构建产物被 `git add -f` 进主干（`.gitignore` 有 `/dist` 仍被跟踪 823 个文件），本分支还带一次 216 文件的重建提交。
4. `vitest.config.ts` 的 `tests/**/*[Vv]2*.test.{ts,tsx}` exclude 规则把 10 个 X6 v3 编辑器测试（约 33 用例）整体排除在所有套件外；该行由 `262b21d9c`（一次依赖升级提交）误入，注释指向的却是旁边 `.claude/worktrees/**`。
5. `npm run lint:arch` 当前 3 个 error（`SpaceProjectManage/{UserAppProject,ThirdAppDetail,AppProjectDetail}` → `AppDevPro`），基线 `.dependency-cruiser-known-violations.json` 只冻结了 `SpaceProjectManage/index.tsx` 三条，新增的三条在 `origin/dev` 同样存在；`lint:arch` 不在 CI，所以一直没被发现。
