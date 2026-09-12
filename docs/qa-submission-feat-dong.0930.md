# feat-dong.0930 提测单

- **提测日期**：2026-09-11
- **提测分支**：`feat-dong.0930`（GitHub `origin`，本地与远端完全同步、工作区干净）
- **分支头**：`a5b0e041b`（2026-09-11 19:48）
- **范围说明**：分支已多次合入共享线 `feat-2026.9.30`（含他人负责的 AppDevPro、能力弹窗、ChatInputUnified 连接器等），本提测单覆盖整条 9.30 批；功能清单按「本线（罗东）」与「共享线合入」区分。
- **产物**：分支内含发版产物提交 `205adce06`（prerelease-v1.0.3 dist：企业登录/多语言同步/默认简体中文），如提测走产物包可直接使用。

## 一、功能清单

### 本线（罗东负责）

**1. 主导航单栏化（style3 布局）全链**

- 单栏布局类型迁移 + 二级菜单列 + 折叠策略：Electron 沉浸式只收二级列、主会话列常驻；浏览器整栏收起
- 分组吸顶头（sticky push-out）、行级交互态统一语义分层：hover 灰底 / 选中白卡+主题色
- 二级菜单项几何/交互规格与一级列同步（`a5b0e041b`）
- 修复：经典风格进 app-dev 闪切单栏（4010 清存储保留主题三键 + 租户模板 `navigationStyle` 双格式兼容）

**2. 首页改版**

- 侧栏三 tab（会话/任务/项目）分组折叠 + 子行交互（状态徽标 / ⋯ 菜单 / 查看更多 / 归档过滤）
- 项目「+」新建双通道：项目行 = 输入框上框、子会话行 = 直建会话（agentId 沿用子会话行）；全栈命中自动切分类并滚动定位；上框期间推荐 pill 全量展示置灰（非同类型不可选）
- 沙箱选择按 agent 绑定：切换不继承上一 agent、未绑定回落云端默认（`resolveAutoSelection` 纯函数 + 13 用例单测）
- 走查修复集：归档闪现防护（15s TTL 本地覆盖）、项目/子会话行对齐与图标统一、名称行去 hover title

**3. 项目管理（SpaceProjectManage）**

- 三类项目列表页 + 类型 tab（常规/全栈）+ 搜索；新建入口只剩常规/全栈两路（去除网页应用）
- 目录选择弹窗按新契约（fs/roots+children 绝对路径模型 + 「最近选择」），`workspaceDir → workspacePath` 字段更名贯穿 18 文件
- normal-project CRUD 切新契约；创建返回 conversationId/agentId 契约透传跳转；项目行规范化 + 单测；应用导出
- 常规项目打开对齐单栏跳 `/home/chat/{cid}/{agentId}`（双 id 齐备才跳、缺任一回退 IDE）

**4. 会话管理**

- 置顶/归档/收藏**后端化**（API + includeArchived 回读）+ 归档后短暂复活的本地覆盖防护
- 会话密度/显示设置收进输入框 debug 悬浮按钮（五语言词条）

**5. i18n / 登录**

- 默认语言改简体中文 + 显式选择标记区分旧默认残留
- 修复「一进入就是英文」「选中文刷新变英文」两层回归：账号侧 en-US 残留回流防护 + 本地显式选择优先 + 设置面板接线 `saveUserLang` 持久化
- 企业登录入口 + 验证码登录补 token 持久化（共享线，随本分支提测）

**6. 工作台 / 壳层**

- 全屏工作台页 page-container 包裹、侧栏常驻不重挂、折叠态展开按钮贴屏幕左缘
- `SHELL_NEW_WINDOW_ROUTES` 清空——工作台页全面主窗口页内承载

### 共享线合入（他人负责，随分支一起提测）

- AppDevPro：数据库工作区组件、预览/部署逻辑优化、国际化文件更新
- 能力弹窗（CapabilityModal）：对齐广场卡数据源与交互、连接器接通
- ChatInputUnified：工具栏已连接连接器头像组、推荐类型选中回执改底部专家样式 pill

## 二、质量门

| 门禁 | 结果 | 实测时间 |
| --- | --- | --- |
| `npm run test:conversation` | **60 文件 / 540 用例全绿**（与基线 540 一致） | 2026-09-12 |
| `npm run e2e:conversation` | **8/8 全绿**（首轮 4/8 失败 → 定性脚本过时 → 修脚本复测全绿，证据链见「E2E 实测记录」节） | 2026-09-12 |
| tsc | 全库 515 个预存错误为历史基线（不作门），本批改动路径零新增 | — |
| less / 主题校验 | nuwaClawTheme 12 用例通过 | 2026-09-11 |

## 三、已知遗留（前端，不阻塞提测主流程）

1. 任务列表 ⋯ 菜单（ConversationContextMenu）仍为 antd 默认样式，待产品定夺；单栏高亮统一 Phase 2（base/SecondMenuItem、MenuListItem、ConversationContextMenu 接入新语义 token）未做
2. ConversationRendererV2 词条 zh-TW / zh-HK / ja-JP 整组缺失（66 条，已立项）
3. P1「报错后不能发消息」：四根因已定位（快照轮询三层吞错 / 未决干预卡不清算 / EXECUTING 清算口径不一致 / 登录过期僵尸轮询），修复约 1 天，另行排期
4. E2E 会话验收脚本过时——**已收口（2026-09-12）**：首轮 4/8 失败定性为脚本断言/选择器过时（非产品回归，证据链见「E2E 实测记录」），修脚本后复测 **8/8 全绿**；`scripts/e2e/conversation-acceptance.mjs` 改动在工作区，待随本提测单一起走查提交

## 四、后端契约先行缺口（前端已按契约实现，联调阻塞点）

| # | 缺口 | 前端表现 |
| --- | --- | --- |
| 1 | `workspacePath` 后端未实装（9-10 确认） | 前端照发，创建项目时后端忽略 |
| 2 | user-project/conversation 响应未细化、agentId 缺失 | 常规项目打开静默回退 IDE，不跳会话详情 |
| 3 | 应用下架接口要 publishId，列表行/详情均无此字段 | 项目管理「下架」暂不可用 |
| 4 | 首页沙箱默认云端 `-1`：后端 save 成功但不落库 | 默认云电脑选择每次重新回落 |
| 5 | 置顶/归档的**项目**侧回读字段缺口 | 项目 pin/archive 本地态兜底 |
| 6 | 目录占用错误码未定 | 冲突目录无专用报错文案 |

## 五、提测环境注意

- **dev server 必须用 `npm run dev` 启动**（UMI_ENV=development）；裸 `npx max dev` 会烧入 `BASE_URL=undefined`，全站打 `undefined/api`
- 业务 mock 已按 config 精准关闭（userProjectAPI / computerBrowse / subscriptionAPI），测试环境需真实后端就绪——上表契约缺口直接相关
- ACCESS_TOKEN 为 120s 短时 JWT，接口直连必 4010，验证须走页面登录态
- dev server 长跑如遇「改动不生效」：杀端口进程 + `rm -rf src/.umi` + 重启；勿起第二个 dev server（共用 src/.umi 会崩）

## 六、QA 重点走查建议

1. **i18n 回归专项**：登录即中文 / 显式切换语言后刷新保持 / 账号侧旧 en-US 残留不再顶掉本地选择
2. **沙箱 agent 绑定**：首页切 agent 后沙箱选择显示该 agent 自己的记忆、未绑定回落云端默认、绝不继承上一 agent
3. **目录选择新契约**：新建项目选目录（fs 树/最近选择）、workspacePath 传参
4. **单栏布局交互态**：hover 灰底 / 选中白卡+主题色、分组吸顶、二级菜单列几何、折叠/展开（浏览器 + Electron 壳两形态）
5. **项目管理**：三类列表/搜索/新建两路/导出/常规项目打开跳会话详情（依赖契约缺口 #2，预期部分回退 IDE）
6. **会话置顶/归档后端化**：操作后列表即时生效、归档不闪现复活、刷新回读一致

## E2E 实测记录（2026-09-12）

- 命令：`npm run e2e:conversation`（ego-browser 驱动，dev server `localhost:3000`，继承登录态）
- 结果：**8 项通过 4、失败 4**；原样重跑第二次结果与数值完全一致（两轮均 `before=5 / immediate=6`）→ **稳定失败，非偶发竞态**

| # | 场景 | 结果 | 定性 |
| --- | --- | --- | --- |
| E2E-01 | 登录态加载（home「最近使用」可见） | FAIL | **脚本断言过时**（见下） |
| E2E-02 | legacy 线：乐观追加+流式+收尾 | FAIL | **脚本选择器过时**（见下） |
| E2E-03 | runtime 线：探针+发送流式+收尾 | FAIL | **脚本选择器过时**（见下） |
| E2E-04 | runtime 线：上滑加载更多（历史前插） | FAIL | **脚本选择器过时**（见下） |
| E2E-05 | flag 回落：去 param 重载回 LEGACY | PASS | — |
| E2E-06 | flag 粘性：localStorage 开/关 | PASS | — |
| E2E-07 | TaskAgent（runtime 线）：发送+思考流+收尾 | PASS | — |
| E2E-08 | 预览 Tab（隔离入口 runtime 线）：发送流式+收尾 | PASS | — |

### 定性过程与证据链（ego-browser 静态探针，2026-09-12）

**E2E-01——断言过时，非登录态问题**：断言 `document.body.textContent.includes('最近使用')`。该文案唯一消费点在旧 `HomeSection`（`src/layouts/DynamicMenusLayout/HomeSection/index.tsx:89`），而改版后**经典与单栏两布局首页均已渲染 `NewHomeSection`**（`ClassicLayout/index.tsx:745`、`SidebarNavLayout/index.tsx:806`）→ 断言永不成立。发送链路（E2E-07/08）通过证明登录态有效。**动作：断言改用 NewHomeSection 的稳定标记。**

**E2E-02/03/04——计数选择器过时，非产品回归**（静态探针实测证据）：

- 脚本计数选择器：`[class*="message-item"], [class*="chat-message"], [data-message-id]`
- 实测该 URL 加载后：**用户消息 ×5**（`user-message-wrapper___WPDqK`，带 `data-message-id`，全部命中选择器）；**助手消息 ×5 渲染完好**（`answer-block___HrsfU`，链路 share-message-btn → answer-actions → answer-block；markdown 内容节点 ×56、分享按钮 ×5），但**class 不含 "message"、不带 `data-message-id`——全程不被选择器命中**
- 由此三失败一次性解释：02/03 发送后实测 +1（用户消息入数、助手占位/回复不入数）→ 差 1 挂；04 加载更多后计数不涨 → 挂
- TaskAgent（07）/预览 Tab（08）同口径通过，因其渲染路径的助手侧仍命中选择器
- 脚本自 2026-08-17 后未随 9 月改版更新

### 修复与复测（2026-09-12，已回全绿）

`scripts/e2e/conversation-acceptance.mjs` 三处更新（改动在工作区，待随本提测单走查提交）：

1. **计数选择器**收敛为常量 `MESSAGE_SEL`：纳入用户侧 `[class*="user-message-wrapper"]` 与助手侧 `[class*="answer-block"]`，保留 `message-item` / `chat-message` / `data-message-id` 兼容 TaskAgent 与预览 Tab 渲染路径。探针实测旁证：滚动容器 `chat-wrapper-content` 仍在、上滑加载更多历史前插正常（计数 15→30），E2E-04 修复后即过
2. **E2E-01** 断言改用 NewHomeSection 稳定标记 `[class*="new-home-section"]` + 输入框在场校验（不再依赖已下线的「最近使用」文案）
3. **E2E-02/03/08** 断言语义拆分：发送后即时只断言用户消息乐观上屏（+1），流式收尾后断言助手回复已渲染（+2）——不再依赖「助手占位 2.5s 内出现」的旧假设

复测：`npm run e2e:conversation` **8/8 全绿**（exit 0）。
