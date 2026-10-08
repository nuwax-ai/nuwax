# remaining 分支最新 feature 合并与启动验收

日期：2026-10-07。看板：NUW-17（原任务）、NUW-18（合并与启动）。

## 10 月 8 日：菜单配置与管理页失败重试补充

本轮仍在主目录 `feat-dong.0930-remaining`。原烤哈希 WIP 保留；本节对应的源码、回归测试和文档纳入本次本地提交，尚未推送或部署。下方“未提交”描述为各验收阶段当时的状态。

用户后续收窄本轮范围：IM、Ask Question 和资料库暂不处理，相关历史核查保留但不计入本轮待办或阻塞条件。当前继续范围以原清单 10.08 最新章节为准。

### 真实环境只读核对

- 用户配置菜单后，`https://testagent.xspaceagi.com/api/user/list-menu` 返回菜单 7295/7296 的正确 path，`localhost:3000/system/config/theme` 两菜单实际点击成功，原“处理路径跳转失败”已解除。
- 敏感词分页 `0000`、总数 0；IdP 列表 `0000`、4 项均启用、自动跳转 0 项；当前绑定 0 项；scope 13 项；租户 `openImageCaptcha=0 / openCaptcha=0`。
- `oauth2_scope_audit` 菜单查询返回“菜单不存在”，`/api/system/oauth2/page-query` 返回 `4033`“无此资源权限”。未执行审核写入或配置修改。
- 当日测试 OpenAPI 仍有 1205 路径，无 License/licence/entitlement 路径；21 个 `/api/nuwax-im/*` 路径无会话关联任务与产物读取合同。现有通用定时任务接口不提供 IM 会话关联及成员授权，不能代替真实 provider。

### 本地修复与验证

`SensitiveWord.handleToggle / handleDelete` 与 `AuthMethod.runToggle / handleDelete` 原来没有消费请求拒绝。开关事件会泄漏拒绝；删除确认链也会重新抛出。两页面在各自业务边界消费已提示的失败，不报成功、不刷新，保留原状态；`finally` 解除开关 pending，删除可再次打开确认框重试。未改共享 OperationBtn 或 Modal 组件。

- `tests/systemConfigToggleBoundary.test.tsx` 新增 8 项，覆盖启用/停用、设置/取消自动跳转及两类删除的拒绝后重试。开关 6 项及删除 2 项各自在修前失败，修后通过；连同 AuthMethod utils 和业务 mock 合同，共 29 项通过。
- 现有 `E2E_CASES=sensitive,auth` 六项页面用例通过；同一个 Ego TaskSpace 41 / p1、专用 mock `localhost:3197` 额外验证 3 类开关和两类删除故障/重试，5 项通过、未处理拒绝为 0。等待确认框入场动画结束后提交，防止自动化点击受过渡阶段影响。
- 失败时确认原值/记录保留、没有成功通知；重试后后端本地供数及实际页面更新。真实业务环境只读，本地修改仅作用于显式 mock。
- 改动路径 TypeScript 无报错，Prettier 和 diff 检查通过；`lint:arch` 检查 3011 modules / 13122 dependencies，无新增违规，97 项存量豁免。没有改会话路径，本轮不重复未变更的全量会话门禁。

当前待办已汇总到[原清单最新章节](../../plans/20260929-release0930-remaining-checklist.md#2026-10-08当前待办与继续处理结果)。真实写入闭环、外部契约、共享部署和客户端包继续分别记账。

### 用户授权后的审核菜单创建

用户明确要求在 `localhost:3000/system/menu-permission/menu-manage` 新建，并指定使用 ego-browser。当前新增表单缺少菜单编码字段；通过同一个 Ego TaskSpace 42 的页面登录态调用已有菜单创建接口，填写明确编码，避免自动生成其他编码。

- 菜单：`7789`「授权范围审核」，编码 `oauth2_scope_audit`，父菜单 `195`「系统配置」，路径 `/system/oauth2/scope-audit`，排序 14、启用、应用内打开。初次放在系统管理直系；用户纠正后已通过 ego-browser 编辑父菜单，重新读取确认 `parentId=195`，侧栏层级为「系统管理 → 系统配置 → 授权范围审核」。
- 关联现有资源：模块 `20140`，查询 `20141 / oauth2_scope_audit_query`，通过 `20142 / oauth2_scope_audit_pass`，拒绝 `20143 / oauth2_scope_audit_reject`。重新读取菜单及资源树，绑定状态均为 1。
- 实际从侧栏点击进入审核页，列表 HTTP 200 / `code=0000`、总数 0，原 `4033` 已解除；未提交任何审核记录，也没有修改角色分配。
- 前端原查询权限误用 `_query_list`，真实资源是 `_query`。审核页面与专用 mock 已统一为 `_query`，新增按钮权限及只读查询/拒绝写入回归；修前 3 项失败，修后本文件 15 项、相关定向 33 项通过，格式/diff 与改动路径 TypeScript 检查通过。
- 当前真实页面的查询、重置按钮已显示，实际点击查询再次返回 `0000`，无错误提示。源码修复未提交、部署；共享环境菜单配置已保存。真实通过/拒绝及生效回填仍待专用申请验证。
- 专用 mock 的审核节点同步移入 `system_config.children`，合同测试断言不再位于系统管理直系，保留原路径、编码和资源。层级回归修前失败，修后 15 项合同测试通过。

### 真实敏感词管理员操作验收

用户要求继续下一个后，复用 ego-browser 操作 `localhost:3000/system/config/sensitive-word`，请求落到真实测试站；使用独立 TaskSpace 44 / p1，完成后已关闭。本节为用户继续授权后的写入结果，上方只读与 mock 记录保留为此前阶段证据。

- 新增唯一测试词 `Codex验收唯一词_20261008_a11945`，列表记录 ID `3`，初始为违法违禁 / 包含 / 替换。
- 编辑同 ID 为锚定正则 `^Codex验收唯一词_20261008_a11945[0-9]{2}$`、广告导流 / 正则 / 断开连接；列表正确回显。只匹配专用标记，未使用通配正则。
- 停用、重新启用均保存成功，页面开关正确回显。敏感词、分类、匹配方式、触发策略、状态五条件组合查询：启用命中 1 条，禁用命中 0 条；请求 `queryFilter` 与界面条件一致，重置后恢复列表。
- 清理时先停用该记录，再经二次确认删除 ID `3`；最后按唯一标记查询为 0 条。新增、编辑、状态更新、查询和删除接口均 HTTP 200，实际页面完成预期更新，无遗留测试记录。
- 整个页面操作期间捕获的 `error` / `unhandledrejection` 均为 0。本次未注入真实后端故障，不据此宣称真实失败重试通过；既有本地 mock 故障回归证据仍适用。
- 当前账号具有管理员写权限，不能证明真实只读权限。已询问专用只读账号；验收时应确认实际返回资源仅含 `sensitive_word_query`，查询可用而新增、编辑、删除、启停受限，不修改共享管理员角色。

### 真实登录方式管理与自动跳转故障核对

通过 ego-browser TaskSpace 45 / p1 操作 `localhost:3000/system/config/auth-method`，请求落到真实测试站；完成后已关闭空间。本次仅操作独立测试项，结束核对原列表恢复。

- 新增 CUSTOM OAuth2 项 `7`，名称 `Codex验收IdP_20261008_a11945`，使用假测试 Client ID/Secret 与 `https://codex-idp-a11945.example.invalid/` 授权、Token、UserInfo 端点；`scope=openid profile`、自动注册/绑定关闭、排序 999。新增默认停用，成功弹窗回显 `https://testagent.xspaceagi.com/api/auth/idp/callback?provider=7`。
- 编辑时 CAS/OAuth2/微信类型控件锁定，Secret 输入为空。修改名称及授权端点后保存，请求省略 `config.clientSecret`；重新打开表单核对名称与 `/authorize-v2` 端点持久化，Secret 仍为空，自动注册/绑定仍关闭。
- 仅该测试项启用后随即停用；自动跳转始终为 0。二次确认删除 ID `7`，列表恢复原 ID `5 / 1 / 2 / 4`，其显示摘要及开关状态与操作前完全一致，无遗留测试项。页面 `error` / `unhandledrejection` 均为 0。
- 当前全部项自动跳转已关闭，因此用相同页面登录态探测幂等取消：`POST https://testagent.xspaceagi.com/api/system/idp/auto-redirect`，JSON `{"id":null}`。返回 HTTP 200、`code=5000`、`message=系统开小差啦，请稍后重试`；重新读取列表成功，原 4 项及临时项的 `autoRedirect` 均仍为 0。
- 当日重新读取[测试后端 OpenAPI](https://test-nvwa-api.xspaceagi.com/v3/api-docs)，1205 路径，`AuthIdpAutoRedirectDto.id` 明确说明“传空表示取消自动跳转”，operation 同样说明 id 为空表示取消。因此可以确认合法取消请求的后端故障仍存在；具体内部异常需后端日志定位，不能仅凭业务错误码推断。
- 未测试共享租户的自动跳转正向设置：该设置影响所有未登录用户，`?local=1` 与独立 Ego Space 不隔离租户。设置、唯一性及停用清除仍需隔离租户；真实第三方认证、绑定/解绑仍需实际提供方测试身份。本次不据此宣称这些闭环完成。

### 三方应用 scope 真实审核与失败重试闭环

通过同一个 ego-browser TaskSpace 47 / p1 在个人空间 `752` 创建独立三方应用 `503`，名称 `Codex授权审核验收_20261008_a11945`。主页与回调为唯一 `.invalid` HTTPS 地址，全程未发布、未调用 OAuth authorize/token，未展示或复制密钥；详情按既有逻辑读取认证信息。验收后经列表二次确认删除 `/api/user-project/oauth2/delete/503`，HTTP 200，按唯一名称查询列表已无该项，空间已关闭。审核记录是否随应用删除清理及保存期限未验证。

- 保存 `scopes=[profile,user:space]`，真实设置返回 `0000 / Pending`，生效 `scopes=[profile]`、待审 `pendingScopes=[profile,user:space]`。审核列表只有本次新建项，申请 ID `1`、类型 ThirdApp、projectId `503`。
- 通过申请 1 后重新进入详情，真实设置为 `0000 / Approved`，生效范围为 `profile + user:space`，`pendingScopes=null`。
- 再保存移除 `user:space` 的申请，真实设置为 `Pending`，待审值为 `profile`，生效值继续为 `profile + user:space`。拒绝申请 ID `2`，原因“Codex 20261008 独立验收：拒绝本次移除申请，保留已生效范围。”；重新进入详情为 `0000 / Rejected`、待审值清空、生效范围不变，页面警告和接口均正确回填原因。
- 发现 `handleApprove` 原本没有消费拒绝，实际静态确认链会泄漏为全局未处理拒绝。仅给审核页补 catch；失败不成功提示、不刷新，保留申请供再次确认。`handleReject` 原有 catch/false 行为保持。
- 新增 `tests/oauthScopeAuditBoundary.test.tsx` 两项实际 handler 失败/重试回归；旧实现通过 handler 用例明确失败，拒绝用例通过；修后与 `release0930RemainingMock.test.ts` 合计 17 项通过，Prettier/diff 检查通过。
- 实际审核页面针对本次申请，用当前 Page 的 `Network.setBlockedURLs` 精确阻断 `/approve/1`、`/reject/2`，仅模拟浏览器请求故障；每项均在 finally 清空阻断后再重试，后端真实审核写入只发生在恢复后的成功请求。通过失败时提示“网络错误”、确认框关闭、Pending 记录保留；重新确认后“已通过”。拒绝失败时提示“网络错误”、弹窗/原因/Pending 记录保留；原原因重试成功后关闭。两项过程中 `error / unhandledrejection` 均为 0。
- 本节覆盖 ThirdApp 的真实接口闭环；全栈应用类型仍以现有本地 mock 与详情保存回归为证据，不能据本节判定该类型真实联调已完成。新增源码未提交、推送或部署。

## 原任务继续收尾结果（10 月 7 日 19:01 更新）

本节补充下文首轮合并与启动记录。开发仍在主目录、`feat-dong.0930-remaining`；本轮新增源码已本地提交，未推送、未部署。

- `3bff7096c`：LicenseFeatureGate 将 `invalid-response` 显式映射到真实翻译键；无效响应撤销授权，重试恢复。License 定向回归 6 文件 / 103 项通过，其中实际页面边界 19 项；提交钩子通过。
- `f4c07db23`：补齐 IM 开发验收的未知状态、缺省字段、二进制/SVG 与产物读取失败场景；修复 StrictMode 并发首屏提前消耗 mock 故障的问题。独立页根高度兜底只匹配 `embedded=false`，嵌入模式规则保留。
- IM 任务和页签定向回归 56 项通过、锁定 TypeScript 5.6.3 检查通过；宿主适配现有 8 项通过，提交钩子通过。未重复未变更的全量会话门禁。

### IM 页面及产物

恢复原 Ego Space 4 验收：通知权限实测 `granted`，无需用户再次处理。独立预览使用固定 IM pin、完整适配补丁与宿主 overlay；仅此临时预览显式打开 DEV 任务 mock，不改变主服务 3197 的真实/本地模式配置。

| 页面场景 | 实际结果 |
| --- | --- |
| 正常任务、会话切换 | 五种状态显示；群聊 5 条与单聊 1 条隔离，切换清理旧产物，关闭/重开面板正常 |
| 空列表、无权限 | 分别显示空态/权限拒绝，无旧任务泄漏或误报空态 |
| 首屏与产物列表失败 | 实际失败提示出现；页面重试分别恢复 5 条任务、3 个产物 |
| 读取与下载失败 | 文本预览失败后同按钮重试成功；图片下载失败后重试得到 658 字节 PNG，列表保留且错误消失 |
| 文本/图片产物 | 文字按纯文本呈现；TXT 浏览器下载 412 字节，PNG 预览及下载为 240×120、658 字节；失效附件不提供操作 |
| 未知状态、缺省字段 | 显示“状态未知 / 未命名任务 / 未知智能体 / 更新时间未知” |
| 二进制 / SVG | 不支持预览时提示返回下载，无图片元素；实际下载 DAT 为 `[0,65,255,16]` 四字节，SVG 为 114 字节 |
| 长内容与滚动 | 面板宽 319、内容宽不溢出；根高由内容撑高 6542 修复为视口 850，面板内高 742、内部滚动，文档滚动为 0、顶部导航保留 |
| 关闭 DEV mock | `VITE_IM_TASKS_MOCK=0` 的实际页面中任务 tab、添加菜单和面板均不出现；验收后恢复临时预览开关 |

高度缺口在独立运行路径得到复现及修复；不据此宣称主站嵌入布局已发生同一问题，也不将独立 mock 当作真实任务 provider 或成员授权。

### 最终微应用输入与构建

- 资料库 pin 仍为 `18ae973c890c699c678b086ad1da3b95275a3c86`，IM pin 仍为 `b09ac90fa3b8f82806595440ae62a1412f6dd192`。
- 标准固定输入 `sync:micro-apps` 成功，IM `tsc -b && vite build` 通过；资料库 72 条存量类型诊断对照一致、新增 0。
- IM adapter 指纹为 `7f43cf3db2d56d25c452e376b6af3c6bbb777f17b6223305da2ee8f62f8267d4`，manifest/version 与最终源码输入一致，builtAt 为 `2026-10-07T11:00:58.569Z`。
- 正式 4 个 JS、4 个 source map 不含任务 fixture 模块本体及数据，任务面板/controller/runtime 保留。source map 的原始 runtime 源码仍有未执行的 mock import 字符串，未将其误称为完全无该字符串。

原始 IM 预览、下载及构建证据存于临时 `nuwax-im-0930-audit-yi0etT`、`nuwax-im-fixture-edge-QjF38x` 目录。以上是本地微应用产物证据，主应用生产构建、共享环境部署和客户端包尚未据此通过。

### 真实环境只读联调与仍待完成项

提供的验收账号经完整协议确认流程已成功登录 `https://testagent.xspaceagi.com`。本轮未保存账号或密码；真实站当前部署与本地新增源码分别记账。

五个真实 GET 均 HTTP 200、业务 `success=true / code=0000`：公开及管理 IdP 列表均 4 种（CAS、OAuth2、OAuth2、微信），管理项均启用且 `autoRedirect=0`，公开 `autoRedirectIdpId=null`；当前账号绑定数 0；scope 返回 13 项；租户 `openImageCaptcha=0 / openCaptcha=0`。只输出白名单摘要，未改配置、绑定、审核记录或发码。

最新 OpenAPI 1205 个路径中未列 License 接口；源码真实 License provider 仍不可用。签发/输入格式、受控功能名单及原第 12 条具体资料库 BUG 尚待明确。第三方登录/绑定真实闭环、真实验证码开启、scope 审核、Ask SSE 和 IM provider/成员授权仍需联调条件，未因上述读取成功而计作完成。

客户端专用目录已恢复到 `/Users/apple/.codex/worktrees/release0930-client-compat/nuwax-client`，分支 `codex/release0930-client-compat@76bfc5a34`；本轮未动正在交付的 Beta 工作区。前端/dist pin 同步与客户端构建、安装验收仍待单独执行。

客户端只读核查：旧前端 pin 到本轮 `hostBridge / client-shell` 契约未变，现有桥已提供会话同步、IM 通知/未读及深链，本轮 License 文件读取和 IM Blob 下载未引入新 IPC。当前范围未发现必须新增的客户端源码适配；实际下载保存仍需安装包验证。桌面登录仍跳过 IdP、设置仍隐藏绑定入口，这是尚未确认的历史默认。若本期桌面也启用 SSO/绑定，须补认证窗口、回跳及受信会话交接，不能仅靠更新前端 pin 判作完成。若 License 受控名单包含原生/本地服务能力，客户端管控也须另行设计。

## 输入与归属

- 原执行对话：`01a0facb-fb4f-7150-b077-d16b2afd4c94`「核对 Claude Code 计划开发进度」。本轮管理对话：`01a1156a-0746-7bc0-8a71-58425faae6c5`。
- 当前开发工作区：主目录 `/Users/apple/workspace/nuwax`，分支 `feat-dong.0930-remaining`。合并与首轮验收曾在恢复的独立目录进行；按用户后续要求已将该分支切到主目录，独立目录保留 detached 备份，不继续开发。
- 目标基线：`b53bd7c2576aca1484d6581ece5816af74122efa`。备份：`codex/backup-remaining0930-before-feature-20261007`。
- 来源：`origin/feat-2026.9.30@bcce97e0d67ebebb83464846395c045c4172dbe4`，本轮 fetch 后 gitlab 同名版本线相同。
- 资料库 gitlink：`18ae973c890c699c678b086ad1da3b95275a3c86`；IM gitlink：`b09ac90fa3b8f82806595440ae62a1412f6dd192`。

主目录原分支 `feat-dong.0930@895f7725b` 保留；其唯一未提交版本文件改动已单独保存为 stash `d38e8c89a5cf93e0a83cdd5afa01456b29aed274`，并保存原文件与差异副本，未覆盖到任务分支。合并提交 `186beecef304b266d7dad59f7f6e45bcdf29380c` 的两个父提交分别为目标基线与 feature 最新输入；切换主目录前重新 fetch，远端仍为上述来源 SHA。子模块使用冻结 gitlink 重建，未执行会升级 pin 的生产构建前置脚本。本轮只本地合并、提交、运行。

## 冲突与运行中发现的问题

1. IM `adapter.patch` 从旧 pin 与新 pin 的实际适配源码归并，再相对新 pin 生成补丁。唯一源码冲突为上传参数，接收新版进度回调并保留鉴权代次保护；任务页签、会话关联及产物能力保留。IM 与资料库补丁在对应干净 pin 上复放检查通过。
2. `src/constants/version.ts` 保留 remaining 原值。它是构建烤哈希，未用上游生成值替换；主目录原 WIP 另行保存。
3. 资料库表格调用适配层的弹层矩形尺寸，新版调用方需要 width/height，旧 overlay 未返回。`toRepoPortalRect` 按左右/上下边界补齐宽高，不改变坐标平移行为。
4. 账号解绑被业务拒绝时，确认框 Promise 泄漏未处理异常。页面消费已经由请求层提示的失败，保留绑定，不报成功，用户可以重新确认重试。新增回归验证拒绝后重试成功。
5. 验证码首次发码/点击重发的无接收方调用未消费拒绝。保留发送链的失败提示、倒计时恢复和换图，在 UI 调用边界消费拒绝；阿里云验证码的异步结果路径保留。
6. E2E 的用户菜单点击可能落在 Popover 入场动画阶段。等待动画稳定，并断言实际登出请求数量；没有通过隐藏错误浮层让失败场景假通过。
7. License 领域状态及错误类别直接拼接为翻译键，不符合真实运行时的 camelCase 规则，页面显示原始键。页面和导入弹窗统一做显式映射，五语言键同步迁移；保留领域枚举与 provider 错误类型。

## 本轮验证

| 检查 | 结果与范围 |
| --- | --- |
| 会话门禁 | 111 文件 / 1085 用例通过 |
| 分层依赖 | 3011 modules / 13122 dependencies，无新增违规，97 项存量豁免 |
| 定向回归 | 原 14 文件 / 166 项中的 164 项首次通过；2 项 License 并行超时，17 项 License 实际页面用例单独复跑全通过 |
| 账号绑定修复 | 9 项组件回归通过，含拒绝后可重试、不误报成功、不提前刷新 |
| 微应用宿主 | 2 文件 / 19 项通过 |
| 微应用构建/升级管线 | 60 项通过 |
| 固定输入微应用重建 | 资料库、IM 构建成功；资料库与上游类型基线均为 72 项，无新增适配诊断；IM 正式构建含类型检查 |
| 业务真实页面操作、本地供数 | 敏感词 4、登录方式管理 2、IdP/账号绑定 6、scope 6、验证码 6，共 24 项通过；各组最终结果来自同一工作区与浏览器空间，失败后修复并复跑受影响组 |
| Ask Question 会话 E2E | 响应驱动六项通过，含必答、取消/Esc、跳过、连续题与刷新恢复 |
| License 回归 | 实际页面 18 项与五语言翻译契约 5 项，共 23 项通过 |
| License 浏览器 | 8 项通过：导入失败保留输入/旧快照、重试成功、四种状态的实际文案、读取失败与恢复、只读账号隐藏导入 |
| TypeScript 全库 | 355 项诊断，全库未通过；合入路径唯一诊断在原有 common 请求错误处理，基线已有相同逻辑，本次该文件仅新增静默 API 路径。手工业务修复路径无诊断 |

开发服务：`http://localhost:3197/login?local=1`，专用 `release0930Mock` 模式。浏览器复用 Ego TaskSpace 30 / p1，所有业务操作通过实际页面，控制面仅用于本地供数、权限或故障注入。演示账号 `13800009300` / `MockPass2468!`，只用于本地 fixture。

原始日志保存在本轮管理工作目录 `work/remaining0930-integration/`，该目录不属于产品源码。构建 manifest 保存在工作区 `public/micro-apps/manifest.json`，是本地生成物。

## 合入前质量三问

- 内聚：首条消息占位/释放与请求代次集中在 `src/hooks/useInitialConversationAutoSend.ts`；本轮发码失败的状态恢复留在 VerifyCode 发送链，UI 调用边界消费拒绝。账号解绑错误与列表生命周期留在 AccountBind。
- 分层：页面经 `features/conversation/react/workspaceFileChange.ts` 消费领域判断；资料库坐标契约由 `micro-frontends/repo-web/overlay/src/hostRuntime.ts` 统一返回。分层门禁无新增违规。
- 维护：`src/pages/AppDevPro/utils/normalizeUserAppLogSources.ts` 集中响应归一化；微应用补丁可在固定输入复放并有实际构建；失败后重试由回归与页面操作验证。两处同类 Promise 问题已补入仓库质量规则。

## 继续范围与缺口

沿用[原剩余需求清单](../../plans/20260929-release0930-remaining-checklist.md)，优先继续 IM 与 License 剩余页面验收。真实 License API、签发格式、受控功能名单及资料库具体 BUG 尚未确定；Ask SSE、IdP、验证码真实开启和共享部署分别联调。客户端使用 `codex/release0930-client-compat` 专用分支，不混入正在进行的客户端 Beta 交付。

本地 mock 页面通过不能作为真实后端、测试环境部署、生产主应用构建或客户端安装包验收证据。

## 2026-10-08 客户端跟进分支合并

目标分支 `feat-dong.0930-remaining`；输入固定为 `codex/client-followups-20261007` 的 `ceaf30f80` 与 `origin/codex/client-qa-hotfixes-20261007` 的 `307a3d6b2`。保留两个分支的祖先关系，远端重复的三项桌面修复不重复实现。主区已有 `src/constants/version.ts` 修改不进入本次源码合并。

处理四处冲突：会话 React 桥出口和终端刷新断言各保留一份；资料库矩形保留相同尺寸计算与解释；IM 适配补丁保留已有任务/产物模块，并针对 `f3a568275c0b3ed21537df98a7eedd6bdbf6b070` 重新生成完整差异。补丁继续保留 `vite.config.ts` 的上游配置重命名。两项 IM 生命周期测试改为 archive 完整固定版本前端目录，以覆盖补丁涉及的测试配置。

质量三问结论：

- 内聚通过：跨设备启动后的项目重拉和分页竞态收敛都留在 `src/layouts/DynamicMenusLayout/NewHomeSection/components/ProjectPanel/index.tsx:928`，卸载取消定时器与事件订阅；账号姓名测量/观察器清理集中在 `src/layouts/DynamicMenusLayout/SidebarNavLayout/useSidebarUserNameVisibility.ts:9`。工作流排列接入既有 proxy、dirty 与防抖保存链（`src/pages/Antv-X6/v3/indexV3.tsx:1206`）。
- 分层通过：桌面桥契约集中于 `src/types/interfaces/hostBridge.ts:1`，页面通过会话 React 出口消费领域策略（`src/features/conversation/react/openDesktopEvent.ts:1`）；架构门无新增违规，97 项存量豁免。
- 维护通过：类型门按文件/代码/完整消息/次数比较，不扩大空基线；`scripts/check-types.mjs:484` 与 19 项负向自测覆盖新增债务、缺失输入及配置弱化。固定 pin 的微应用构建不自动升级，IM 补丁在实际固定输入上应用、类型检查与构建。

验证结果（合并后的组合源码）：

| 检查 | 结果 |
| --- | --- |
| 全量 Vitest | 373 文件，3534 项通过，6 项跳过；最终使用 4 workers。首轮高并发的 12 项超时在 2 workers 定向复跑 69 项通过；两项源码快照遗漏修正后，最终全量通过 |
| 会话门禁 | 111 文件 / 1085 项通过 |
| 类型门及自测 | nodes / conversation / workspace / contracts 均 0 诊断；门禁自测 19 项通过。域外 288 项存量诊断不作为全库通过结论 |
| 架构检查 | 3014 modules / 13126 dependencies，无新增违规，97 项存量豁免 |
| 微应用构建/升级合同 | 60 项通过 |
| 固定输入微应用构建 | repo `18ae973c890c699c678b086ad1da3b95275a3c86`、message `f3a568275c0b3ed21537df98a7eedd6bdbf6b070` 均成功；repo 上游/适配均 72 项诊断，新增 0；message 执行 `tsc -b && vite build` |
| 最终 IM 前端测试 | 固定 pin + 最终适配 + overlay 后 1452 项通过 |
| ego-browser 页面 E2E | 正常完成、会话恢复、终端输出、迟到分片、未结束工具收敛，runtime/legacy 两数据线 × V2 渲染，共 10 项通过；会话状态级 console error 为 0 |

浏览器使用 ego-browser TaskSpace 48 / p1，完成后已关闭。

范围边界：本次完成两个已有分支的前端源码整合；未推送、部署或执行客户端安装包验收。真实 License、IdP 自动跳转取消接口的后端问题及原待办联调边界仍按各自验收记录处理。

## 2026-10-08 全栈 scope 与桌面三方登录补充

本节覆盖上方历史桌面隐藏默认。用户确认 C1 只调用原 `/api/user/logout`，不联动 CAS；C2 本期支持桌面三方登录；C3 设置页验证码范围、C4 敏感词替换字符契约由后端补充。IM、Ask Question、资料库暂不继续开发验收。用户授权先部署 PC Web 测试版，便于后端联调。

全栈应用真实闭环：个人空间 752 新建专用 UserApp 245 / 统一项目 507。申请 3 新增 `user:space`，待审时生效范围保留 `profile`；只改地址请求不带 scopes，保留同一申请，通过后地址及 `profile + user:space` 生效。申请 4 移除 scope，待审改回生效范围后同一申请显示“无变化”，后端保留待审记录；再次申请移除并拒绝后，生效值保留、原因正确回填。拒绝额外验证浏览器阻断请求后保留原因和弹窗，恢复请求可重试，无未处理拒绝。专用应用通过真实删除接口返回 `0000`，唯一名称过滤列表为空；没有发布或业务 OAuth 授权，审核历史不作删除断言。

桌面前端实现使用现有 `hostBridge.auth` 契约，运行时业务域负责授权与 Cookie 回调，成功后返回当前 gateway 或 direct 安全路径。后端中间页保持业务域，错误回跳解开本次 redirect 包装，不循环。设置按可用 IdP/身份展示绑定入口。客户端网关配套策略在独立分支 `codex/desktop-idp-20261008`，基线 `3b990c1c3e964e8d59a39a0f14e5bf73ce561bf2`，现有 Beta 工作区未改动。

验证证据：认证与桥工具 6 文件 / 153 项、绑定组件 1 文件 / 9 项，共 162 项通过；架构检查 3016 modules / 13132 dependencies，无新增违规（97 项存量豁免）；全库 TypeScript 仍有历史诊断，本轮改动路径未发现诊断。客户端网关纯策略 16 项通过，check:pin 通过。ego-browser TaskSpace 49 / p1 的普通 Web IdP/绑定 6 项通过，另用模拟宿主验证桌面 direct 手动登录深链回跳与 beginLogin 失败后保留表单、按钮恢复，各阶段页面异常和未处理拒绝为 0。浏览器模拟桥不证明原生 Cookie、真实 IdP 或安装包验收。

提测质量三问：

- 内聚通过：桌面授权/返回状态与 origin 校验集中于 `src/utils/idpNavigation.ts:46`、`:101`；登录与绑定页面只消费结果。已合并批次的项目重拉、工作流保存、微应用适配继续按上节走查结果。
- 分层通过：页面经 `hostBridge` 和认证导航工具调用宿主；`src/utils/authNavigation.ts:14` 负责后端页面来源，未新增 IPC 或页面到原生实现依赖。架构检查无新增违规。
- 维护通过：重复点击、迟到宿主响应、非法来源、嵌套错误 redirect 及同步失败有边界回归；`src/pages/Login/index.tsx:327` 与绑定边界消费异步拒绝。客户端仅保留受信业务域顶层认证导航，iframe/XHR 原策略有对照断言。

静态与定向回归无阻断；标准隔离提测脚本负责最终组合源码质量门与生产构建。部署、真实后端联调及客户端安装包分别记账，完成部署后补版本证据。

提测升级预检发现 IM 远端 main 前进到 `140784225e5d2605a538ac8df07d4bf0e36edf5c`，旧补丁在 ChatWindow 导入与 tsconfig.test 上下文不能直接复放。相对新 main 重制完整差异，保留新版 useCallback、测试条目与原宿主适配；没有新增 IM 需求。新 pin 的固定构建（`tsc -b && vite build`）通过，最终适配前端 1584 项通过，微应用构建/升级管线 60 项通过。资料库本地原固定 pin 类型基线仍为 72 / 72，新增 0；提测脚本继续按正常升级流程处理其远端输入。

临时 Electron profile 补验：实际 frontend 导航工具、客户端 preload、ticket Cookie 镜像与请求头策略，在两个本地 host 的业务域/gateway 和独立 IdP 服务间完成 direct/gateway × 登录/绑定/绑定失败/登录失败，共 8 项。state Cookie 在业务域 callback 可见，成功后 HttpOnly ticket 回正确源，外部 IdP 无业务票据/网关能力/桥，绑定失败保留会话，登录失败不复用旧票据。此验收使用 fixture IPC 连接现有上下文/清 Cookie/镜像工具，不包含实际设备注册与服务生命周期，也不替代真实身份或安装包。

补验发现 direct 模式的未标记错误回跳会提前停在普通登录页，遗漏包装 redirect 解码。新增 direct 登录/绑定包装错误两项先复现失败，再修复普通错误逃生与桌面包装的判断顺序；认证工具最终 3 文件 / 76 项通过（导航 34、authIdp 21、authNavigation 21），其余认证/桥/绑定 89 项沿用前述通过结果。本地 Electron 8 项在修复后全通过。旧网关策略在本次 BrowserWindow 环境也通过四项成功场景，未把该对照当作原生回归复现；策略允许的明确 frame 上下文由 16 项纯策略断言覆盖。
