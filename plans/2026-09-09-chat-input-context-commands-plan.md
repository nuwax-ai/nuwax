# 首页会话输入框:@ 引用上下文文件 + / 唤起技能插件弹窗

## 一、现状梳理(现有实现如何运转)

### 1. 输入框组件链路(两套并行,底层共用)

```
首页 /home(新建会话)
└─ src/pages/Home/index.tsx:365
   └─ src/components/ChatInputHome/index.tsx          ← 输入框 A(legacy 版)

首页会话 /home/chat/:id/:agentId(以及应用会话等五入口)
└─ src/pages/Chat/index.tsx(ChatCore :112)
   └─ LeftContent/index.tsx:241
      └─ UnifiedChatSession/index.tsx:425
         └─ components/ChatInputHomeIndependent       ← 输入框 B
```

两套输入框 **底层共用同一套编辑器与弹窗**:

- `src/components/ChatInputHome/MentionEditor/index.tsx` — contenteditable 富文本编辑器(无第三方库),@ 检测、chip 插入、光标定位、键盘导航、IME、撤销栈全在这里
- `src/components/ChatInputHome/MentionPopup/index.tsx` — 跟随光标(fixed + `range.getBoundingClientRect()`)的技能选择浮层,Tab(全部/最近/收藏)+ 滚动分页
- `src/components/ChatInputHome/AtMentionIcon` — 底部 @ 按钮,复用同一弹窗

`conversationRuntime=1` 双轨 flag **只切数据面(消息列表/发送链路),不换输入框**,两条轨都用输入框 B,输入框层改动对双轨同时生效。

### 2. 现有 @ 的输入即过滤机制(新 @ 文件弹窗沿用)

```
输入 @xx → detectMention(:350)检测到 @ 与 searchText(=@ 后已输入文字)
→ MentionEditor 把 mentionSearchText 作为受控 searchText 传给弹窗
→ 用户继续输入 → searchText 实时更新 → 弹窗列表实时过滤
选中 → 把 "@xx" 文本替换为不可编辑 chip <span data-mention-id data-mention-name>
→ selectedMentions 从 DOM 重建(:484)→ 去重取 targetId → onSkillIdsChange(skillIds)
→ 发送 ConversationChatParams.skillIds(legacy: models/conversationInfo.ts:2011;runtime: createConversationRuntimeSession.ts:365)
```

`enableMention` 开关由 ChatCore 控制:`type===TaskAgent && allowAtSkill===Yes`(src/pages/Chat/index.tsx:1556)。

### 3. "当前会话产生的文件"数据源(已存在,闭环现成)

- API:`apiGetStaticFileList(conversationId, { relativePath, recursive })` → `GET /api/computer/static/file-list`(src/services/vncDesktop.ts:17),返回 `StaticFileInfo { name, fileProxyUrl, isDir, contents... }`,即"会话过程由 AI 自动生成的文件"
- 现成 hook:`src/pages/Chat/hooks/useWorkspaceDirectoryFiles.ts`(Chat 页右侧文件树在用,支持 `recursive` 拉扁平全量)
- 实时性:会话 SSE 过程中 `models/conversationInfo.ts` 已有 `fileTreeRefreshTrigger` 时间戳,Chat 页订阅节流刷新——**@ 弹窗每次打开时拉一次即可拿到最新列表**

### 4. 可复用资产与缺口

| 项 | 现状 |
| --- | --- |
| 弹窗跟随光标定位 + 输入即过滤 | ✅ MentionPopup `getCaretPosition` + `searchText` 受控过滤直接复用 |
| @ 选文件 | AppDev IDE 有先例(`pages/AppDev/components/ChatArea/`,插入纯文本 `@path`),可参考协议 |
| slash 命令菜单 | ❌ 全仓库无实现,需新建(浮层方案照搬 MentionPopup) |
| 技能/插件列表数据 | ✅ `MentionPopup/atSkill.ts` 三接口;`services/created.ts getList(Plugin)` |
| 选中结果通道 | ✅ 技能 → `skillIds`;插件 → `selectedComponents: {id, type}[]`(两套输入框均已支持组件选择) |

## 二、实现方案

核心思路:**@ 与 / 两个触发字符各司其职——@ 只引用会话上下文文件,/ 选择技能与插件**;能力做在共用层(MentionEditor),两套输入框同时受益,即"首页与会话最终共用统一组件"的收敛方向。原 @ 技能交互整体迁移到 / 入口。

### 功能 1:@ 引用当前会话产生的文件(纯文件,无技能)

1. **MentionItem 扩展**(`MentionPopup/types.ts`):tagged union 加 `kind: 'file' | 'skill'`,file 项携带 `relativePath`。chip dataset 增加 `data-mention-kind`、`data-mention-path`。
2. **@ 触发白名单放宽**:`detectMention` 的 @ 后字符白名单从 `字母数字中文-_` 放宽到含 `.` `/`(文件路径需要);序列化时 file chip → `@相对路径` 纯文本(纯文本路径引用,零后端改动,模型在沙盒按路径自取)。
3. **@ 弹窗改为纯文件列表 + 输入即过滤**:
   - 数据源外部注入,弹窗打开瞬间拉 `apiGetStaticFileList(conversationId, {recursive:true})` 扁平全量;
   - 弹窗打开后用户继续输入的文字即 `searchText`,**本地实时过滤文件列表**(按文件名/相对路径模糊匹配),沿用现有受控 `searchText` 机制;
   - 键盘导航复用现有协议(↑↓ 选择、Enter 确认、ESC 关闭);
   - **无数据源时(首页新会话 / 非 TaskAgent)@ 输入不触发弹窗,自然降级为普通文本**。
4. **数据注入走 props**:MentionEditor 新增 `onFetchMentionFiles` 类 props(传入 conversationId 或取数函数),由 ChatCore → UnifiedChatSession → ChatInputHomeIndependent 透传;首页 ChatInputHome 不传即降级。共用组件不自己拉业务数据。
5. file chip 不参与 `onSkillIdsChange` 派生(按 kind 过滤),发送 payload 无任何改动。

### 功能 2:/ 唤起技能/插件弹窗(承接原 @ 技能交互)

1. **触发**:MentionEditor 输入检测并行增加 `/` 触发(**仅当 / 位于行首或前面是空白**才触发,避免正常输入路径误弹);复用 `getCaretPosition` 定位。
2. **弹窗组件**:新建 SlashPopup(复用 MentionPopup 的骨架样式与键盘导航),Tab:技能 / 插件。技能走 `atSkill.ts` 现有接口,插件走 `services/created.ts getList(Plugin)`。/ 后继续输入同样作为 `searchText` 实时过滤当前 Tab 列表。
3. **选中分流,复用现有通道**:技能选中 → 插入 skill chip(沿用现有 chip/dataset/skillIds 派生链路,序列化仍为 `@名称` 文本,线上协议不变);插件选中 → 不进编辑器文本,回调给输入框并入现有 `selectedComponentList` → payload `selectedComponents`。后端零改动。
4. **原 @ 技能交互迁移下线**:@ 不再唤起技能列表;底部 `AtMentionIcon`(@ 图标按钮)改为唤起 / 弹窗(快速入口保留,入口语义变为命令选择)。
5. **两套输入框同步接入**:ChatInputHomeIndependent(会话页)与 ChatInputHome(首页)都接 / 触发(技能/插件为全局发布数据,不依赖会话);@ 文件仅会话页有数据源。
6. 开关:沿用 `enableMention` 总开关(TaskAgent && allowAtSkill)控制 / 能力;@ 文件以"是否有会话文件数据源"自然控制,无需新 flag。

### 发送协议(已确认)

- @文件:`message` 文本内联 `@相对路径`,无新增字段
- /技能:`skillIds`(现有);/插件:`selectedComponents`(现有)

## 三、改动文件清单

| 文件 | 改动 |
| --- | --- |
| `src/components/ChatInputHome/MentionPopup/types.ts` | MentionItem tagged union、文件取数 props 类型 |
| `src/components/ChatInputHome/MentionEditor/index.tsx` | @ 检测切到文件数据源、白名单放宽、/ 行首触发、双弹窗状态机(互斥)、chip kind dataset、kind 过滤、searchText 过滤联动 |
| `src/components/ChatInputHome/MentionPopup/index.tsx` | 数据源由技能接口改为外部注入的文件列表(本地 searchText 过滤;技能数据源挪到 SlashPopup) |
| `src/components/ChatInputHome/AtMentionIcon` | 改为唤起 / 弹窗的命令入口按钮 |
| `src/components/ChatInputHome/SlashPopup/`(新增) | / 弹窗(技能/插件 Tab + 键盘导航 + searchText 过滤) |
| `src/components/business-component/UnifiedChatSession/components/ChatInputHomeIndependent/index.tsx` | 接入文件取数 props、/ 弹窗、插件并入 selectedComponentList |
| `src/components/ChatInputHome/index.tsx` | 首页版接入 / 弹窗 |
| `src/pages/Chat/index.tsx` + `LeftContent/index.tsx` | conversationId/文件取数 props 透传 |
| `ChatInputHomeIndependent/draftStorage.ts` | 确认 skillIds 草稿兼容(经 / 选择仍落 skillIds,机制不变) |

## 四、实施步骤

1. 类型层:MentionItem tagged union + chip dataset + 序列化规则(file → `@path` 纯文本)
2. MentionEditor 触发层:@ 白名单放宽、/ 行首触发、双弹窗互斥状态机、searchText 联动
3. @ 文件弹窗:props 注入取数 + 打开时拉取 + 本地实时过滤 + file chip 插入
4. SlashPopup:技能/插件 Tab + 键盘导航 + searchText 过滤 + 选中分流(chip / selectedComponents)
5. AtMentionIcon 迁移为 / 入口
6. 接线:ChatInputHomeIndependent(会话页)+ ChatInputHome(首页)、ChatCore props 透传
7. 质量门:`npm run test:conversation` 全绿(改到 UnifiedChatSession / pages/Chat 路径,必跑);为 detectMention 泛化、序列化、chip 删除补单测;合入前过会话 E2E

## 五、风险与边界

- **存量交互变化**:老用户 @ 选技能改为 / 选技能,AtMentionIcon 按钮语义同步变化——属于本次需求的目标行为,需在迭代说明中明确
- **误触发**:/ 仅行首/空白后触发;@ 白名单放宽后 `@xx.yy` 也会触发文件搜索(此前被拦),行为变化可接受
- **大文件列表**:recursive 全量 + 本地过滤 + 条数上限
- **双轨回归**:输入框为双轨共用,legacy 与 runtime(conversationRuntime=1)都要手测 skillIds/selectedComponents 发送链路

## 执行与验证记录

- @ 文件引用与命令选择接线完成；保留现有发送字段。
- 后续按用户四张参考图对齐 CapabilityModal：白色侧栏、两列卡片、分类行搜索、灰底紫色选中态、各类型专用卡片和右上角关闭按钮。
- 资料库保留真实系统/团队数据源，通过顶部标题菜单切换；列表内容与分类使用实际接口数据。
- 连接器连接状态和启用状态来自接口；卡片控件继续调用现有选择回调，不新增提供方状态修改请求。
- 浏览器模拟数据预览检查了四类布局与搜索/关闭交互。
- npm run test:conversation：53 个测试文件、511 项通过。旧 ensurePod 断言已对齐既有第二可选参数，不改该业务实现。
- TypeScript：改动文件未发现报错，全仓库仍有既有类型错误。
- 真实会话 E2E 尚未通过：本机缺少 ego-browser，所用浏览器无登录态。
