# 实施计划：release0930-remaining（9.30 版本剩余前端需求）

- 对应意图：[plans/20260928-release0930-remaining-intent.md](./20260928-release0930-remaining-intent.md)
  - 原 F1–F4 接口字段已列在 intent；IM 一期已有独立规格，license 的操作与管控边界待确认。
- 状态：scope 修复、问答型 mock 已验；业务 mock 与 IM 源码已完成，剩余页面验收正在推进。
- 分支：`feat-dong.0930-remaining`
- worktree：`.claude/worktrees/remaining-0930`

## 2026-10-02 本轮安排（当前）

用户确认范围为「本次版本剩余未完成内容」15 条中的前端，接口未 ready 可 mock。本轮纳入第 1、2、5、10、12、13、14、15 条；独立 IM、资料库前端不再排除。已合入版本线并推送 `429da126d`，未部署。

| 顺序 | 剩余任务 | 准备情况 / 完成标准 |
| --- | --- | --- |
| R1 | scope 待审保存缺陷 | 已定位两个详情页；保存比较 `draftScopesOf(setting)` 与编辑值。只改地址不传 scopes，改回生效值也须传；提示按本次请求判断 |
| R2 | 本批业务 mock 与页面验收 | 独立启用本地 BASE_URL 与可重置 fixture；覆盖 F1/F2/F3/F4 真实页面、权限、失败与请求体；真实服务配置保持默认 |
| R3 | 问答型 Ask Question mock | 使用 ChatBot 身份及已有 v2 契约，收到回答后才续跑；验取消/跳过、连续 requestId、等待和刷新恢复。会话改动跑门禁与 E2E |
| R4 | IM 关联任务与产物 | 按会话关联女娲任务推进只读页签，见[一期规格](../specs/release0930-im-tasks.md)及[实施计划](./20261002-release0930-im-tasks-plan.md)；真实成员授权/provider 后续对齐 |
| R5 | 资料库 BUG | 定位本条具体复现清单，核对当前子模块；明确前端缺陷直接修复并按对应场景验收 |
| R6 | license 配置与功能管控 | 确认配置操作、状态/有效期及受控功能后出规格与细化计划；缺接口先按明确合同 mock |

- R1 是已证实的小修，不为其重建完整规格链；R4/R6 的未定义产品规则不得由 mock 自行决定。
- R2/R3 可先完成前端验收，不等菜单种子、真实 IdP 或问答型后端准备完毕。真实联调单独记录，不与 mock 通过混淆。
- 子模块实现需记录各自提交及主仓 gitlink；当前主检出的其他工作保持不动。
- 本轮对齐文档不触发部署。后续合入/提测按实际差异质量走查，不能沿用旧“可快进”“96 文件”的描述。

本轮进度：R1 两详情页 18 项回归及 6 项详情/审核页面验收通过；R3 六项响应驱动页面验收通过，会话门禁 111 文件 / 1082 用例全绿。R2 已通过敏感词与登录管理等 12 项，IdP/验证码组待继续。R4 独立前端 1355 项测试和正式 platform 构建通过，root 页面验收被通知权限弹窗暂停。R5/R6 已提出具体 BUG 清单与配置操作问题，答案到达后继续；不自行扩大范围。

## 2026-09-29 实施记录（历史）

以下为原实施计划与开发者记录；范围、依赖与下一步以上方当前安排及最新 intent/checklist 为准。

## 0. 9.29 接口复核

**swagger 与 9.28 快照对比**

- 本期涉及的接口路径与 DTO 均无变化：敏感词、登录方式、外部登录、账号绑定、scope 审核、图形验证码。
- 新增的 28 个接口是 `OAuth2 门面-*`（第 6 条，后端对外接口）和 IM 默认智能体，前端不涉及。

**测试环境实测**

- 菜单：
  - `sensitive_word_config`、`auth_method_config` 已种子，各带 5 个资源码。
  - 两者 path 仍为空。
- scope 审核：管理员调 `page-query` 仍返回 4033。
- scope 全集共 12 个，其中 6 个敏感。
- 三方登录链路：
  - `/api/auth/idp/authorize?provider=1` 302 到 GitHub 授权页，链路通。
  - `/api/auth/idp/logout` 302 到 `/login?local=1`，即后端登出落点自带逃生参数。
- 租户配置：`openImageCaptcha=0`，`openCaptcha=0`。

## 1. 复用对照

原则：列表的增删改查不新造组件，照已有页面的骨架写。

| 需求点 | 复用组件 | 照抄的参照页面 |
| --- | --- | --- |
| 列表、分页、筛选 | `XProTable`：LightFilter、默认分页、`showQueryButtons` | `SystemManagement/Content/Space`（服务端分页的 request 映射） |
| 新增按钮、状态开关列 | `WorkspaceLayout` 的 `rightSlot` + antd `Switch`，操作后 `reload` | `SubscriptionCredits/CreditPackages` |
| 行操作（编辑、删除） | `TableActions`：`confirm` 内置二次确认，`disabled` 接权限 | `CreditPackages`、`UserManage` |
| 新增/编辑弹窗，按类型切换字段 | `XModalForm` + `ProFormText/Select/Radio/Switch/Digit` + `Form.useWatch('type')`，编辑时锁定类型 | `SystemConfig/SandboxConfig/components/SandboxModal` |
| 图标上传 | `UploadAvatar` | `SystemConfig/CategoryManage/components/CategoryModal` |
| 只读字段复制 | `CopyIconButton` | — |
| 按钮权限 | `useModel('menuModel').hasPermission(code)` | `Content/Space` |
| 审核列表、驳回原因 | `XProTable` 状态筛选默认待审；驳回原因用单字段 `XModalForm` | `PublishAudit`（含 `RejectAuditModal`） |
| 个人设置子页 | `layouts/Setting`：左侧菜单 + 右侧面板 | `Setting/ResetPassword` |

只新造 3 个组件，都是现有组件覆盖不到的：

- `ImageCaptcha`：图形验证码输入，登录页、验证码页、两个设置页共 4 处使用。
- `OAuthScopeSetting`：scope 勾选 + 审核状态，两个应用详情页共用。
- `IdpLoginButtons`：登录页三方按钮，登录页私有。

分层按 `docs/engineering-conventions.md`：

- 接口按域放 `src/services/`，类型放 `src/types/interfaces/`。
- 跨页复用的纯函数放 `src/utils/`，配测试。
- 页面之间不互相 import。

## 2. 前置依赖

| # | 事项 | 阻塞什么 | 状态 |
| --- | --- | --- | --- |
| D1 | 回填菜单 path：`sensitive_word_config` → `/system/config/sensitive-word`，`auth_method_config` → `/system/config/auth-method` | 菜单点击跳转。开发不受影响，可直接输 URL 访问 | 待后端 |
| D2 | 种子 scope 审核菜单与资源码，并授权给管理员。建议菜单 `oauth2_scope_audit`，path `/system/oauth2/scope-audit`，资源码 `oauth2_scope_audit_query_list` / `_pass` / `_reject` | F3b 的数据和按钮权限（当前返回 4033） | 待后端 |
| D3 | `OAuth2ScopeApplyVo` 补申请人名称，目前只有 `applyUserId` | F3b 申请人列，先显示 ID，不阻塞 | 待后端 |
| D4 | 在测试环境临时打开 `openImageCaptcha` | F4 验收。环境共享，会影响所有人登录，需约好时段 | 待约 |
| D5 | 三方登录全链路只能在部署后的测试环境验：Cookie 鉴权，IdP 回调登记在 testagent 域 | F2b/F2c 验收 | 部署前需你确认 |

## 3. 分块实施

### F1 敏感词管控（`/system/config/sensitive-word`）

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/services/sensitiveWord.ts` | 增 | page / create / update / updateStatus / delete |
| `src/types/interfaces/sensitiveWord.ts` | 增 | 实体、DTO，分类/匹配/策略枚举 |
| `src/pages/SystemManagement/SystemConfig/SensitiveWord/index.tsx` | 增 | 骨架照 CreditPackages，request 映射照 Content/Space |
| `src/pages/SystemManagement/SystemConfig/SensitiveWord/SensitiveWordFormModal.tsx` | 增 | 用 `XModalForm` |
| `src/routes/index.ts` | 改 | 在 `config` 下加路由 |

- **请求映射**：ProTable 的 `{ current, pageSize, word, category }` 转成 `{ queryFilter: { word, category }, current, pageSize }`；响应取 `data.records` / `data.total`。
- **列表列**：
  - 敏感词：Tag，正则用等宽字体
  - 分类：Tag，颜色按原型（ILLEGAL red、ADVERTISING orange、PRIVACY_LEAK purple、COMPETITOR default）
  - 匹配方式、触发策略
  - 状态：Switch
  - 操作
- **正则不做前端校验**：后端是 Java 正则，常用的 `(?i)` 内联标志在 JS 里非法，前端校验会误拒。以后端报错为准。
- **编辑与状态分开**：编辑走 update，DTO 不含 status；状态只通过列内开关调 updateStatus。
- **权限**：

  | 资源码                 | 控制                |
  | ---------------------- | ------------------- |
  | `sensitive_word_query` | `showQueryButtons`  |
  | `_add`                 | 新增按钮            |
  | `_modify`、`_delete`   | 行操作的 `disabled` |
  | `_enable`              | 开关的 `disabled`   |

- **不做**：替换字符（Q2），检测试用。

### F2a 登录方式管理（`/system/config/auth-method`）

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/services/authIdp.ts` | 增 | 管理端：list / create / update / updateStatus / auto-redirect / delete；登录与绑定：`/api/auth/idp/list`、identity list / unbind |
| `src/types/interfaces/authIdp.ts` | 增 | `AuthIdpVo`、`AuthIdpSaveDto`，三类 config，`AuthIdpLoginItemVo`、`UserIdentityVo` |
| `src/pages/SystemManagement/SystemConfig/AuthMethod/index.tsx` | 增 | 列表 |
| `src/pages/SystemManagement/SystemConfig/AuthMethod/AuthMethodFormModal.tsx` | 增 | 骨架照 SandboxModal，图标照 CategoryModal |
| `src/pages/SystemManagement/SystemConfig/AuthMethod/utils.ts` + `utils.test.ts` | 增 | 表单与 DTO 互转 |
| `src/routes/index.ts` | 改 | 加路由 |

- **列表**：接口不分页，XProTable 用 `search={false}`、`pagination={false}`。列如下：
  - 名称：图标 + 名称
  - 类型：Tag
  - 配置摘要：CAS 显示服务地址和「映射 N 项」；OAuth2 显示提供方和 Client ID；微信显示形态和 AppID
  - 状态：Switch
  - 未登录自动跳转：Switch。未启用的行禁用；打开传 `{id}`，关闭传 `{id:null}`。成功后整表 reload，因为自动跳转租户内唯一，会顶掉原来那项。
  - 操作：编辑、删除（带 confirm）。有用户绑定时后端拒绝删除，全局 toast 会展示原因。
- **弹窗字段（按类型切换）**：
  - 通用：
    - 类型：Radio，编辑时禁用
    - 名称
    - 图标：`UploadAvatar`
    - 排序：Digit
    - 自动注册/绑定：Switch，附「开启即信任该 IdP 的邮箱/手机号」提示
  - CAS：服务地址（必填，url 校验）；字段映射 userName / nickName / email / phone
  - OAuth2：
    - 提供方（必填）：飞书 / 企微 / 钉钉 / GitHub / 自定义
    - Client ID（必填）
    - Client Secret：新建必填，编辑时留空表示不修改
    - 企微 agentId：仅企微显示，必填
    - 自定义另需：授权端点、token 端点、userinfo 端点、scope（均必填），PKCE 开关，凭证方式 post/basic，字段映射（占位符显示默认值）
  - 微信：形态 QRCODE/OA（必填），AppID（必填），AppSecret（新建必填，编辑时留空不改）
- **`utils.ts` 转换规则**：
  - `toSavePayload`：只带当前类型的 config 段；secret 为空或为 `******` 时不传；fieldMapping 去掉空键。
  - `fromVo`：编辑回显时 secret 置空，不回填掩码。
- **回调地址**：编辑态只读展示 `callbackUrl` 并可复制。新建成功后用返回的 `callbackUrl` 弹提示，请去 IdP 侧登记。
- **不做**：图标填外链 URL（只做上传）。

### F2b 登录页三方登录与自动跳转

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/utils/authIdp.ts` + `authIdp.test.ts` | 增 | 纯函数，见下 |
| `src/pages/Login/IdpLoginButtons/index.tsx` + `index.less` | 增 | 分隔线「其他登录方式」+ 图标 + 名称按钮 |
| `src/pages/Login/index.tsx` | 改 | 拉列表、自动跳转、idpError、挂载按钮 |
| `src/utils/router.ts` | 改 | 数字 redirect 时暂存当前业务路径 |
| `src/utils/loginNavigation.ts` + test | 改 | 服务端路由整页跳转 |
| `src/layouts/DynamicMenusLayout/User/index.tsx` | 改 | 登出落点改为 `/login?local=1` |

- **`utils/authIdp.ts` 纯函数**：
  - `filterIdpByUa(items, ua)`：UA 含 `MicroMessenger` 时，微信只留 OA；否则微信只留 QRCODE；其他类型不过滤。
  - `buildIdpAuthorizeUrl(id, redirect)`：拼 `BASE_URL` 前缀。
  - `buildIdentityBindUrl(id, redirect)`：同上。
  - `resolveIdpRedirect(param)`：
    - 相对路径原样用。
    - 数字或空值：取 `router.ts` 暂存的路径，没有则用 `/`。
    - `//x`、绝对地址等非法值：用 `/`。
  - `shouldAutoRedirect({ autoRedirectIdpId, search, isDesktop })`。
- **登录页取数**：进页并行拉 tenant config（已有逻辑）和 idp 列表。idp 列表用 `skipErrorHandler`，失败时静默。两者都就绪才渲染表单，避免跳转前表单闪一下。
- **自动跳转**：
  - 条件：有 `autoRedirectIdpId`，且 URL 中无 `local`、无 `idpError`，桌面与 Web 共用此规则。
  - 满足时用 `location.replace` 跳到 authorize 地址。
- **点击三方按钮**：未勾选协议时，复用现有的协议确认弹窗，确认后再整页跳转。
- **错误展示**：`idpError` 用 `Alert` 显示纯文本。
- **桌面宿主**：10.08 C2 已确认支持；列表、按钮与租户自动跳转共用 Web 规则，授权/回调按 `specs/release0930-desktop-idp.md` 处理受信 Cookie 与 direct/gateway 返回。
- **会话过期后的回跳**：线上浏览器会话过期走 `redirectToLogin(-1)`，带回的 redirect 是数字。整页跳 IdP 后数字偏移失效，所以 `redirectToLogin` 收到数字时顺手把当前路径写进 sessionStorage，供 `resolveIdpRedirect` 使用。改动约 5 行。
- **`navigateAfterLogin`**：redirect 以 `/auth/`、`/api/` 开头时拼 `BASE_URL` 整页跳转，用于「绑定已有账号」登录后回到后端中间页。其他情况不变，也不放开任意绝对地址（防开放重定向）。
- **登出**：落点改为 `/login?local=1`，与后端 `/api/auth/idp/logout` 的落点一致，防止登出后又被自动跳转带回 IdP。10.08 C1 已确认继续原有 `/api/user/logout`，不联动 CAS。

### F2c 设置 › 账号绑定

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/layouts/Setting/AccountBind/index.tsx` + `index.less` | 增 | 已绑定列表 + 可绑定按钮 |
| `src/layouts/Setting/index.tsx` | 改 | 新增菜单项；支持 URL 参数打开弹窗 |
| `src/types/enums/menus.ts`、`src/constants/menus.constants.tsx` | 改 | 加 `Account_Bind` |

- **已绑定列表**：登录方式名、外部用户名、脱敏标识、最近登录时间、绑定时间，每行可解绑（`modalConfirm`）。
- **解绑被拒**（唯一登录方式且未设密码）：全局 toast 已经展示后端文案，不另做引导。
- **可绑定列表**：从 idp 列表中去掉已绑定的项，再做同样的 UA 过滤。点击后整页跳 `buildIdentityBindUrl(id, 当前路径 + '?setting=account-bind')`。
- **回跳后打开弹窗**：Setting 挂载时读取 `setting=account-bind`，打开弹窗并定位到账号绑定，然后 `history.replace` 去掉该参数。URL 带 `idpError` 时 toast 提示。
- **菜单项显隐**：设置弹窗打开时拉 idp 列表；租户没有登录方式、用户也没有绑定时隐藏该菜单项。

### F3 项目 OAuth scope

**F3a 开发者侧：申请**

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/services/oauth2Scope.ts` | 增 | scope 全集 + 审核三个接口 |
| `src/types/interfaces/oauth2Scope.ts` | 增 | — |
| `src/utils/oauth2Scope.ts` + test | 增 | 见下 |
| `src/pages/SpaceProjectManage/components/OAuthScopeSetting/index.tsx` | 增 | `Checkbox.Group`：scope 名 + 说明，敏感项加标记；审核中显示申请值，被拒显示原因 |
| `src/pages/SpaceProjectManage/services/thirdAppOauth2.ts` | 改 | 只改类型：保存参数加 `scopes?`，响应加审核三字段 |
| `src/pages/SpaceProjectManage/ThirdAppDetail/index.tsx` | 改 | OAuth 卡片下挂组件，保存时带 scopes |
| `src/pages/SpaceProjectManage/AppProjectDetail/index.tsx` | 改 | 同上 |

- **`utils/oauth2Scope.ts`**：
  - `normalizeScopes`：空数组视为 `[profile]`。
  - `scopesChanged`：集合比较，忽略顺序。
  - `diffScopes`：给出新增和移除两部分。
- **数据来源**：ThirdAppDetail 现在用的 info 接口没有审核字段，进页时额外调已有的 `apiThirdAppOauth2SettingGet`。AppProjectDetail 已经在调 setting 接口，只需扩展类型。
- **勾选初值**：状态为 Pending 时取 `pendingScopes`，否则取 `scopes`。
- **保存**：
  - 勾选有变化才带 `scopes`，否则不传。这样只改主页或回调地址时不会生成审核单。
  - 带了 scopes 时提示「已提交审核」。
  - 用保存接口的响应刷新审核状态。

**F3b 管理员侧：审核（`/system/oauth2/scope-audit`）**

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/pages/SystemManagement/OAuth2ScopeAudit/index.tsx` | 增 | 骨架照 PublishAudit |
| `src/routes/index.ts` | 改 | 加路由 |

- **分页**：服务端分页，参数是 `pageNo/pageSize`，与敏感词接口不同。
- **状态筛选**：默认 Pending，用 `form.initialValues`，比 PublishAudit 的 ref 方案省代码。
- **列表列**：
  - 应用名
  - 类型：三方应用 / 全栈应用
  - Client ID
  - 申请人：暂显示 ID（D3）
  - scope 变化：新增绿色、移除红色，用 `diffScopes`
  - 状态
  - 申请时间、审核时间
  - 拒绝原因
- **操作**：只有 Pending 的行显示。
  - 通过：带 confirm。
  - 驳回：弹 `XModalForm`，原因必填（与发布审核一致；接口本身允许为空）。

### F4 登录图形验证码

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/components/business-component/ImageCaptcha/index.tsx` + `index.less` | 增 | 见下 |
| `src/services/account.ts` | 改 | 加 `apiImageCaptcha` |
| `src/types/interfaces/login.ts` | 改 | 登录/发码参数加 `captchaId`、`captchaCode`；`TenantConfigInfo` 加 `openImageCaptcha` |
| `src/pages/Login/index.tsx` | 改 | 两种登录模式都挂验证码 |
| `src/pages/VerifyCode/index.tsx` | 改 | 首发与重发 |
| `src/layouts/Setting/ResetPassword/index.tsx`、`SettingEmail/index.tsx` | 改 | 发码前校验 |

- **组件**：
  - 受控值为 `{ captchaId, captchaCode }`，直接挂在 `Form.Item` 上。
  - 挂载即取图；点图片或「看不清？换一张」刷新。
  - `ref.refresh()` 刷新图片并清空输入，供提交失败后调用。
  - 仅在 `openImageCaptcha === 1` 时渲染，关闭时行为与现状完全一致。
- **登录页**：
  - 验证码放在账号/密码下方，两种模式都有。
  - 密码登录的参数加上验证码字段；`onError` 时刷新图片。
  - 验证码模式把值经 `location.state` 带给 VerifyCode，用于首次发送。
- **验证码页（VerifyCode）**：
  - 首次发送带上 state 里的值。
  - 「重新发送」上方内嵌 `ImageCaptcha`，重发前校验。
  - 发送失败时重置倒计时并刷新图片。现状是失败后仍要等满倒计时，验证码输错时尤其难受。
- **设置页**（重置密码、绑定邮箱）：发码按钮前内嵌验证码，逻辑同上。Q13 若确认这两类发码不需要，删掉这两处即可。
- **与阿里云验证码的关系**：两者相互独立。都开启时，阿里云回调里照常从表单读取图形验证码的值。

### F5 问答型智能体 Ask Question（仅验证）

- 后端就绪后，在问答型会话里走一遍「提问 → 作答 → 续跑」，预计前端零改动。
- 如果确实需要改动，就落在会话路径上，须跑 `npm run test:conversation`。

### 公共

- **i18n**：新增 key 覆盖五语言。
  - zh-CN、en-US、ja-JP 手写。
  - zh-TW、zh-HK 用 OpenCC（s2tw / s2hk）转换后人工过一遍用词。
  - 最后跑 `node scripts/check-hardcoded-i18n.js`。
- **路由名**：`PC.Routes.sensitiveWordConfig` / `authMethodConfig` / `oauth2ScopeAudit`。

## 4. 实施顺序

每块单独一个 commit，message 形如 `feat(system): …`。经你确认后再提交。

1. **F1**：9.29。纯管理页，本地连测试后端即可验证。
2. **F4**：9.29。改登录页，先于 F2b 做，避免同一文件并行冲突。
3. **F2a**：9.29。测试环境已有 4 个配置，验证时新建一个停用的测试项做增删改，不动现有项。
4. **F2b + F2c**：9.30 上午。
5. **F3a + F3b**：9.30 上午。F3b 的数据验证依赖 D2。
6. **合并与联调**：合并 `origin/feat-2026.9.30`（当前落后 3 个提交）→ 跑全量门禁 → 部署测试环境联调（D5，需你确认）→ 按联调结果修复。

## 5. 证明成立的测试

**新增测试**：

| 测试文件 | 覆盖内容 |
| --- | --- |
| `src/utils/authIdp.test.ts` | UA 过滤三种情况；authorize/bind URL 的拼接与编码；redirect 回退链（数字 → 暂存路径 → `/`，`//evil.com` 与绝对地址 → `/`）；自动跳转判定的 local / idpError / 桌面 / 无 id 四个分支 |
| `src/utils/loginNavigation.test.ts`（扩展） | `/auth/bind-or-register?token=…` 走整页跳转；普通路径仍是 SPA replace；外域绝对地址不跳 |
| `src/pages/SystemManagement/SystemConfig/AuthMethod/utils.test.ts` | 三种类型的 payload（secret 省略、fieldMapping 去空、只带当前类型的 config）；编辑回显不回填掩码 |
| `src/utils/oauth2Scope.test.ts` | 空数组视为 `[profile]`；比较忽略顺序；diff 正确 |

**回归门禁**：

- `npx vitest run`（全量）
- `npm run lint:arch`
- 改动文件的 tsc 零新增错误（与基线对比）
- 登录页不在会话质量门范围内。只有 F5 需要改会话时才跑 `test:conversation`。

**浏览器验收**（ego-browser）：

- F1、F2a、F3：本地 dev 连测试后端，需要先在 localhost 登录一次测试账号。
- F4：在 D4 约定的时段内验收。
- F2b、F2c：在测试环境走 GitHub/飞书登录、自动跳转与 `?local=1`、绑定/解绑、中间页回跳。
- 每项留截图。

## 6. 风险与回退

| 风险 | 缓解 | 回退 |
| --- | --- | --- |
| 登录页是全员入口，出回归会挡住所有人 | 新行为全部由数据驱动：idp 列表为空、`openImageCaptcha=0` 时渲染与现状一致；有单测，并在测试环境验收 | 单独 revert F4 或 F2b 的 commit |
| 自动跳转死循环 | `local`、`idpError` 双保险；登出落点带 `local=1`；桌面端不跳 | 后台关闭自动跳转即可恢复 |
| 在共享测试环境改配置影响他人 | 打开验证码约时段；登录方式只增删自建的测试项 | 验收后立即恢复 |
| scope 审核缺种子（4033） | 页面照常开发，数据验证放到 D2 之后 | 路由不进菜单，没有入口 |
| 与版本分支冲突 | 合并前先同步 `origin/feat-2026.9.30` | — |

## 7. 可砍项

- **F2c 账号绑定**：登录不依赖它，可以延后。但对接文档把它列为四块工作之一，默认做。
- **F4 设置页两处**：可以等 Q13 确认后再加。
- **F3a 改成文本框**：需求原文是「填上保存即可」，可以用文本框。勾选框多约 60 行，但能避免拼错 scope，默认用勾选。

## 偏离记录

1. **worktree 基线**：开工前把分支快进到 `feat-dong.0930@f04627d51b`（原基线之后该分支新增 5 个提交：推荐提示词、qiankun 微应用），避免合并时再追。
2. **`useImageCaptcha` hook**：原计划只做 `ImageCaptcha` 组件。发码场景（VerifyCode 重发、重置密码、绑定邮箱）不走表单整体校验，三处取值、校验、换图逻辑相同，因此在组件模块内加了这个 hook，而不是复制三份。
3. **`draftScopesOf`**：「审核中取待审目标，否则取生效值」两个详情页都要用，放进 `utils/oauth2Scope` 并补了单测。
4. **`replaceLoginStep` 保留普通登录模式**：计划未列。自查发现 `?local=1` / `?idpError` 进入验证码步骤后，点返回登录页会丢参数，被「未登录自动跳转」带走。现在跨步骤保留 `local=1`，已补单测。
5. **敏感词正则的前端校验**：计划里已写不做（Java 与 JS 正则方言不同），实现时如此。
6. **`@fontFamilyCode` 需加 `~` 转义**：该 token 是带引号的字符串，直接用会被当成单个字体名。新增样式都改为 `~'@{fontFamilyCode}'`；存量写法未改动。

## 实施结果（9.29）

| 块 | 状态 | 验证 |
| --- | --- | --- |
| F1 敏感词 | ✅ | 连测试后端走通增、正则、编辑、启停、筛选、删除，测试数据已清理 |
| F4 图形验证码 | ✅ | 开关关闭时登录页与现状一致；本页内模拟开启：未填拦截、请求体带 captchaId/captchaCode、失败后换图并清空。真实开启验收待 D4 |
| F2a 登录方式管理 | ✅ | 在测试后端对自建的自定义 OAuth2 项走通新增（回调地址提示）、编辑（secret 留空不传）、启停，之后已删除。**后端 `/api/system/idp/auto-redirect` 对 `{id:6}`、`{id:null}`、`{}` 都返回 5000「系统开小差啦」**，需后端修 |
| F2b 登录页三方登录 | ✅ | 按钮按 UA 过滤；点击 GitHub 正确 302 到 github.com；`idpError` 展示；本页内模拟 `autoRedirectIdpId`：会跳转，`?local=1` 与 `idpError` 都不跳 |
| F2c 账号绑定 | ✅ | `?setting=account-bind&idpError=…` 回跳后打开弹窗、定位到账号绑定、toast 报错并清掉参数；可绑定列表正确。真实绑定/解绑待 D5 |
| F3a scope 申请 | ✅ | 12 个 scope 渲染，profile 锁定，敏感项有标记；拦截请求体确认：勾选未变不带 scopes，勾选变了带 `["profile","chat:read"]`（请求在网络层中止，未写入他人应用） |
| F3b scope 审核 | ✅ 页面 / ⏳ 数据 | 真实接口仍 4033（D2）；本页内模拟数据下，差异 Tag、状态、仅待审行有操作均正确 |
| F5 Ask Question | ⏳ | 待后端问答型下发后联调 |

门禁（9.29）：

- vitest 全量：336 个文件通过 / 2 个失败。失败的是 `micro-frontends/message/*Lifecycle.test.ts`：worktree 里未初始化 `submodules/nuwax-im`，`git archive` 失败。属于环境问题，与本分支改动无关。
- `test:conversation`：110 个文件 / 1064 个用例全绿。
- `lint:arch`：无新增违规。
- tsc：351 个存量错误，本分支改动的文件零新增。

## 交付状态与下一步（9.29 收工）

**已交付**：远端分支 `origin/feat-dong.0930-remaining`，已合入最新 `feat-dong.0930`（`2b4bece4f`）。

- 5 个功能/修复提交：`a07590c01` / `17f0463c4` / `9208ac73f` / `e935d8b33` / `4fad753af`。
- 可直接快进到 `feat-dong.0930`。
- 门禁：`test:conversation` 1073 全绿；`lint:arch` 无新增；vitest 仅 2 个存量微应用用例失败（worktree 缺子模块）。

**下一步**（按顺序）：

| # | 事项 | 负责 | 阻塞 |
| --- | --- | --- | --- |
| 1 | 本地验收剩余页面（地址直达，见下表）并反馈问题 | 你 | — |
| 2 | 把分支合入 `feat-dong.0930`（快进），再走 `deploy_sync_test.sh` 部署测试环境 | 你确认后我执行 | 1 |
| 3 | 后端修 `/api/system/idp/auto-redirect` 返回 5000 | 雷林周 | 「未登录自动跳转」开关 |
| 4 | 配置菜单：两个已有菜单补 path；新建「授权范围审核」菜单与资源码并授权管理员 | 你（后续专门配置）/ 雷林周 | 菜单点击跳转；F3b 真实数据（4033） |
| 5 | 部署后联调：GitHub/飞书真实登录、自动跳转与 `?local=1`、绑定/注册中间页、账号绑定解绑、scope 申请 → 审核闭环 | 我 | 2、3、4 |
| 6 | 约时段打开 `openImageCaptcha` 验收图形验证码（登录 / 验证码页重发 / 设置页发码） | 你约时段 | 2 |
| 7 | F5：问答型智能体 Ask Question 联调（预计零改动） | 我 + 冯飞 | 后端就绪 |
| 8 | 合入主干前按 `/quality-review` 走查本批次（96 文件） | 我 | 5 |

菜单配置值（供第 4 步）：

| 菜单 | 访问路径 | 资源码 |
| --- | --- | --- |
| `sensitive_word_config` 敏感词管控 | `/system/config/sensitive-word` | 已有 5 个 |
| `auth_method_config` 登录方式管理 | `/system/config/auth-method` | 已有 5 个 |
| 新建：授权范围审核 | `/system/oauth2/scope-audit` | `oauth2_scope_audit_query_list` / `_pass` / `_reject` |

**仍待确认**（intent 开放问题中影响上线的项）：

- Q6：登出是否整页走后端 `/api/auth/idp/logout` 做 CAS 单点登出（现为落 `/login?local=1`）。
- Q9 / C2：10.08 已确认本期支持桌面三方登录。
- Q13：图形验证码是否也作用于设置页的重置密码、绑定邮箱发码（现为作用）。
