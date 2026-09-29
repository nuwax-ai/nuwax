# 意图：9.30 版本剩余未完成内容（前端部分）

- 日期：2026-09-28 　发起人：dongdada29（前端）
- 状态：草案（开放问题回填或默认值获认可后置「已接受」）
- 依据：
  - 飞书《8 月需求》「本次版本剩余未完成内容」15 条：https://xspaceagi.feishu.cn/wiki/Dmvqwr0api83PCkt7ZGc8UUgnle
  - 《三方登录（CAS / OAuth2 / 微信）前端对接文档》（2026-09-28 16:15 版）：https://testagent.xspaceagi.com/repo/doc/DCmphdX8GiJPzGze
  - 管理端原型（登录方式管理、敏感词管控）：https://agent.nuwax.com/static/file-preview.html?sk=aa9a637288b748698f88080325202c94
  - 测试环境 swagger（`/v3/api-docs`）与测试环境实测（菜单种子、接口返回）
- 开发位置：worktree `.claude/worktrees/remaining-0930`，分支 `feat-dong.0930-remaining`（基于 `feat-dong.0930@393b56dbb4`）

## 范围判定（15 条逐条）

| # | 条目 | 文档负责人 | 本仓前端 |
| --- | --- | --- | --- |
| 1 | 敏感词管控（触发策略：断开连接、替换）【数据集团】 | 罗东 / 雷林周 | ✅ F1 |
| 2 | 登录方式管理：CAS（可多个、仅启用一个）/ OAuth2（可多个）/ 微信【苏州明基】 | 罗东 / 雷林周 | ✅ F2 |
| 3 | 项目开发接入资料库提示词 | 冯飞 | ❌ 提示词 |
| 4 | 资料库给项目的接口优化（默认计划字段） | 冯飞 | ❌ 后端 |
| 5 | 项目 OAuth scope 授权管理 | 雷林周 | ✅ F3：接口含「项目申请」与「管理员审核」，需要前端页面；文档未列前端负责人，默认本分支承担 |
| 6 | OAuth2 对外接口 | 冯飞 | ❌ 后端 |
| 7 | 全栈应用接入技能 + 接入文档 | 冯飞 | ❌ 技能 |
| 8 | 技能推送策略 / 技能管理 skill | 雷林周 | ❌ 后端 |
| 9 | 已启用连接器注入上下文 | 冯飞 | ❌ 后端 |
| 10 | IM 消息完善 | 冯飞 | ❌ IM 为独立应用（菜单指向 `/instant-message`），不在本仓 |
| 11 | 技能维护 | 冯飞 | ❌ 技能 |
| 12 | 资料库 BUG 修复 | 冯飞 | ❌ 资料库为独立应用（菜单指向 `/repo/`），不在本仓 |
| 13 | 商业版 license 配置与功能管控 | 冯飞 | ❓ swagger 无 license 接口（Q15） |
| 14 | MCP Ask Question 放到问答型智能体【苏州明基】 | 冯飞 | 🔍 F5 仅联调验证 |
| 15 | 登录图片验证码【数据集团】 | 雷林周 | ✅ F4 |

## 问题

- 管理员无法维护敏感词，也无法配置 CAS / OAuth2 / 微信登录方式。
- 用户不能用三方账号登录或绑定三方账号。
- 三方应用 / 全栈应用无法申请 OAuth scope，管理员也无处审核。
- 登录与发送验证码不支持图形验证码，客户要求开启。

## 功能拆分与预期结果

### F1 敏感词管控（系统管理 › 系统配置 › 敏感词管控）

- 接口：`POST /api/system/sensitive/word/{page|create|update|updateStatus|delete/{id}}`。`list`、`check` 两个接口本期不用。
- 字段：
  - `word`：包含匹配存明文，正则匹配存表达式
  - `category`：ILLEGAL 违法违禁 / ADVERTISING 广告导流 / PRIVACY_LEAK 隐私泄露 / COMPETITOR 竞品词
  - `matchType`：CONTAIN 包含 / REGEX 正则
  - `action`：DISCONNECT 断开连接 / REPLACE 替换
  - `status`：1 启用 / 0 禁用，新增默认启用
- 页面（按原型）：
  - 筛选：关键词搜索 + 分类，右上角「新增敏感词」
  - 列表列：敏感词（正则用等宽标签）、分类（彩色标签）、匹配方式、触发策略、状态开关、操作（编辑、删除）
  - 删除需二次确认，列表分页
- 权限（测试环境已种子）：`sensitive_word_query / _add / _modify / _delete / _enable`。
- 异常：
  - 正则非法：前端用 `new RegExp` 预校验，只作提示。后端是 Java 正则，方言与 JS 不同，最终以后端为准。
  - 重复词：以后端报错为准。
- 验收：
  - 增删改、启停后列表即时一致，筛选和分页正确。
  - 无权限时对应按钮隐藏或禁用。

### F2 登录方式管理与三方登录

**F2a 管理页（系统管理 › 系统配置 › 登录方式管理）**

- 接口：`GET /api/system/idp/list`；`POST /api/system/idp/{create|update|updateStatus|auto-redirect|delete/{id}}`。
- 列表列（按原型）：
  - 名称（含图标）、类型
  - 配置摘要：CAS 显示服务地址 + 映射 N 项；OAuth2 显示提供方 + Client ID；微信显示形态 + AppID
  - 状态开关
  - 未登录自动跳转开关：只有启用项可以打开，未启用项显示「未启用」
  - 操作：编辑、删除
- 表单字段以接口为准，与原型的差异见 Q5：
  - 通用：
    - 类型：新建时选择，编辑时锁定
    - 名称
    - 图标：走 `/api/file/upload` 上传，或填外链，可空
    - 排序
    - 自动注册/绑定：开关附风险提示「开启即信任该 IdP 的邮箱/手机号」
  - CAS：
    - 服务地址（必填）
    - 字段映射：`userName / nickName / email / phone` ← CAS 属性名
  - OAuth2：
    - 提供方（必填）：飞书 / 企业微信 / 钉钉 / GitHub / 自定义
    - Client ID（必填，企微为 corpid）
    - Client Secret：新建必填，编辑时留空表示不修改
    - 企微 agentId（企微必填）
    - 自定义提供方另需：授权端点、token 端点、userinfo 端点、scope（均必填），PKCE、凭证方式 post/basic、字段映射（占位显示默认值）
  - 微信：
    - 形态（必填）：网站扫码 QRCODE / 公众号 OA
    - AppID（必填）
    - AppSecret：新建必填，编辑时留空不改
  - 回调地址：取列表的 `callbackUrl`，只读并可复制。新建保存后才有，需提示去 IdP 侧登记。
- 规则：
  - 新增后默认停用。
  - 停用会联动取消自动跳转。
  - 自动跳转在租户内唯一，打开一项即替换原来那项，操作后刷新列表。
  - 删除时如果仍有用户绑定，后端会拒绝，前端展示返回的 message。
  - CAS 同时只能启用一个（Q4）。
- 权限（已种子）：`auth_method_query / _add / _modify / _delete / _enable`。`_enable` 同时覆盖启停和自动跳转。

**F2b 登录页**

- 拉取按钮列表：
  - 调 `GET /api/auth/idp/list`（免登录），`items` 为空时不渲染三方按钮区。
  - 微信按 UA 过滤：含 `MicroMessenger` 时只保留 OA，否则只保留 QRCODE。
- 点击按钮：
  - 整页跳转 `/api/auth/idp/authorize?provider={id}&redirect={目标}`。
  - 目标取登录页的 `?redirect=`（即原业务页）。
  - 缺省时用 `/`；是数字偏移时也用 `/`，因为数字偏移是 SPA 历史回退，整页跳转后失效。
  - 对接文档示例传 `location.pathname + search`，会回到登录页本身，不采用。
- 自动跳转：
  - 条件：`autoRedirectIdpId` 非空，且 URL 中既无 `local` 也无 `idpError`。
  - 满足时用 `location.replace` 跳到同上地址，不渲染登录表单。
  - `?local=1` 是逃生门，显示正常登录页。
  - 列表接口失败时回落到正常登录页。
- 错误展示：
  - `?idpError=` 解码后以文本展示。
  - 带 idpError 时不自动跳转，否则 IdP 故障时会死循环。
- 登录后回跳：
  - `/auth/bind-or-register?token=…` 是后端渲染的页面（测试环境实测标题「关联账号」），不是 SPA 路由。
  - 现有 `navigateAfterLogin` 用 `history.replace`，会落到 404。
  - 改为：对 `/auth/`、`/api/` 前缀做整页跳转（Q7）。
  - 不注册该 SPA 路由。
- 登出：见 Q6。

**F2c 用户设置 › 账号绑定（设置弹窗新增一项）**

- 已绑定列表：
  - 数据来自 `GET /api/user/identity/list`，展示登录方式名、外部用户名、脱敏标识、最近登录时间、绑定时间。
  - 解绑调 `POST /api/user/identity/unbind/{id}`，需二次确认。
- 可绑定列表：
  - 取 `/api/auth/idp/list` 中尚未绑定的项，微信同样按 UA 过滤。
  - 点击后整页跳 `/api/user/identity/bind/{providerId}?redirect=…`。
- 解绑被拒：后端返回「请先设置账号密码后再解绑」时，引导切到「重置密码」。
- 既没有可用登录方式、也没有已绑定项时，隐藏整个入口。
- 回跳落点见 Q8。

**F2 验收（测试环境）**

- 三种类型都能配置并启停，自动跳转在租户内唯一。
- 登录页按钮按 UA 正确展示，点击能完成三方登录，失败时展示错误。
- 自动跳转生效，`?local=1` 能回到普通登录页。
- 未绑定账号能经中间页完成注册或绑定，并回到原目标页。
- 设置页能绑定和解绑。

### F3 项目 OAuth scope 授权

**F3a 开发者侧**

入口：三方应用详情（`ThirdAppDetail`）和全栈应用详情设置 Tab（`AppProjectDetail`）的 OAuth2 区。

- scope 勾选：
  - 数据来自 `GET /api/user-project/oauth2/scopes`，每项有 scope、说明、是否敏感。
  - 敏感项加标记。
- 状态展示：
  - 当前生效的 `scopes`。
  - `scopeApplyStatus` 为 Pending 时显示「审核中」和 `pendingScopes`。
  - 为 Rejected 时显示 `scopeRejectReason`。
- 提交：
  - 走 `POST /api/user-project/oauth2/setting/save` 的 `scopes` 字段。
  - 勾选没变时不传 `scopes`（null 表示不修改），避免只改主页或回调地址也生成审核单。
  - 空数组表示回落到平台默认的 profile。
- 提示文案：提交后需管理员审核，审核通过前仍按原范围生效。

**F3b 管理员侧：scope 变更审核页**

菜单位置见 Q11；暂无原型，按「发布审核」列表风格做。

- 列表：
  - 接口 `POST /api/system/oauth2/page-query`。注意分页参数是 `pageNo/pageSize`，与敏感词的 `current` 不同。
  - 筛选：状态、应用。
  - 列：应用名、类型（三方应用 / 全栈应用）、Client ID、申请人、原 scope → 申请 scope（差异高亮）、状态、申请时间、审核时间、拒绝原因。
- 操作（仅 Pending 可操作）：
  - 通过：`POST /api/system/oauth2/approve/{applyId}`。
  - 拒绝：`POST /api/system/oauth2/reject/{applyId}`，弹窗填写原因，原因会回传给申请人。

**F3 验收**

- 提交申请后显示审核中。
- 审核通过后生效范围更新；拒绝后开发者能看到原因。
- 只改主页或回调地址时不产生审核单。

### F4 登录图形验证码

- 开关：
  - 租户配置 `openImageCaptcha`（1 开 / 0 关），`/api/tenant/config` 已公开返回；系统设置里的开关项已存在，由后端配置驱动。
  - 前端 `TenantConfigInfo` 需补这个字段。
  - 它与阿里云验证码 `openCaptcha` 相互独立，可以同时开启。
- 取图：
  - `GET /api/user/captcha/image` 返回 `{ captchaId, image }`，`image` 为 base64 data uri。
  - 开关关闭时返回「图形验证码未开启」。
- 密码登录：
  - 表单加「验证码」输入框、验证码图片和「看不清？换一张」，按需求截图做。
  - 调 `passwordLogin` 时带上 `captchaId / captchaCode`。
- 发送验证码（`/api/user/code/send`）也带 `captchaId / captchaCode`，涉及以下场景：
  - 验证码登录的首次发送
  - 验证码页的重发
  - 设置里的重置密码、绑定邮箱（这两个是否需要待 Q13 确认）
- 规则：
  - 进入页面即取图。
  - 任何一次提交失败后刷新图片并清空输入，先按一次性处理（Q13）。
  - 验证码为空时前端拦截。
- 交互（Q14 默认方案）：
  - 登录页两种模式都内嵌验证码输入。
  - 进入验证码页后，首次发送沿用登录页输入的验证码。
  - 「重新发送」和设置页发码时弹小窗重新输入。
- 验收：
  - 开关打开后，不填或填错验证码无法登录、无法发码。
  - 开关关闭时不展示验证码，行为与现状一致。

### F5 联调验证：问答型智能体 Ask Question（第 14 条）

- `UnifiedChatSession` 挂载 `AgentInterventionChatLayer` 时不看智能体类型，Ask 相关代码里也没有按类型的门控。预计后端下发后前端无需改动。
- 后端就绪后，在问答型会话里走一遍「提问 → 作答 → 续跑」。
- 如果确实需要改动，就落在会话路径上，须跑 `test:conversation`。

## 本期不做

- 第 3、4、6、7、8、9、11 条：属于后端、提示词或技能工作。
- 第 10、12 条：IM 与资料库是独立应用，不在本仓。
- 第 13 条：待 Q15 确认。
- 敏感词检测试用工具：`/check` 接口存在，但原型里没有。
- 绑定/注册中间页 `/auth/bind-or-register`：后端已实现。
- 原型里有但接口不支持的字段：CAS 的 Client ID/Secret、部门/工号映射、敏感词替换字符。Q2/Q5 改判时再做。
- 移动端：nuwax-mobile 是独立仓。
- 《问题整理【9.28】》各条：其中 #32 推荐提示词正在主检出里进行。

## 受影响的能力面

- 路由和菜单：
  - `src/routes/index.ts` 新增系统管理下的敏感词、登录方式、scope 审核三个路由。
  - 菜单的 path 需要后端种子回填（Q1/Q11）。
- 系统管理新页面：`src/pages/SystemManagement/**`，并新增对应的 service。
- 登录链路：
  - 这是公开页面，nuwaclaw 桌面端 webview 也复用它。
  - 涉及 `src/pages/Login`、`src/pages/VerifyCode`、`src/utils/loginNavigation.ts`、`src/services/account.ts`、`src/types/interfaces/login.ts`、`src/hooks/useSendCode.ts`。
- 用户设置弹窗：
  - `src/layouts/Setting`：新增账号绑定；重置密码、绑定邮箱加验证码。
  - `SettingActionEnum`。
  - `models/layout`：支持按 URL 参数打开设置弹窗。
- 项目 OAuth：`src/pages/SpaceProjectManage/{ThirdAppDetail,AppProjectDetail,services/thirdAppOauth2.ts}`。
- 登出：`src/layouts/DynamicMenusLayout/User`，是否改动视 Q6。
- i18n：新增文案五语言齐全。
- 会话路径：默认不动，只有 Q3 需要处理断开提示时才会涉及。
- 对外暴露面：
  - 登录页和设置页新增整页跳转到 `/api/auth/idp/*` 与 `/api/user/identity/bind/*`。
  - 不新增前端公开路由。

## 约束

- 时间窗：9.30 发版，剩余约 2 天。第 1、15 条是数据集团需求，第 2、14 条是苏州明基需求。
- 鉴权方式：
  - 线上用 HttpOnly Cookie；本地 dev 用登录响应里的 Bearer Token。
  - 三方登录回调只种 Cookie、不返回 Token，所以三方登录和绑定的完整链路只能部署到测试环境后验收。
  - 管理页和图形验证码可以在本地连测试后端验证。
- 桌面端：
  - 登录统一在 webview `/login`。
  - 网关加载模式下，整页跳到业务域会离开网关源（Q9）。
- 质量门：
  - vitest 不能 import umi。UA 过滤、回跳目标、表单 payload 映射、scope 差异计算都抽成纯函数写单测。
  - tsc 不作门，但改动路径零新增错误。
  - `lint:arch` 需通过。
- 分支：
  - 当前落后 `origin/feat-2026.9.30` 3 个提交，合并前需同步。
  - 主检出里未提交的推荐提示词改动与本分支无关，不受影响。

## 开放问题

各项都有默认值，不阻塞开工；「影响」一列说明不确认会卡在哪里。

| # | 问题 | 默认 | 待谁 | 影响 |
| --- | --- | --- | --- | --- |
| Q1 | `sensitive_word_config`、`auth_method_config` 已种子在「系统配置」下，但 path 为空。需求原文写的是「模型管理 → 敏感词管控」。 | 放「系统配置」下（与原型、种子一致）；前端路由定为 `/system/config/sensitive-word`、`/system/config/auth-method`，需后端回填 path | 雷林周 | F1/F2a 菜单能否跳转 |
| Q2 | 原型有「替换字符」字段（默认 `***`），接口没有。 | 本期不做，后端固定替换 | 雷林周 | F1 表单 |
| Q3 | 命中「断开连接」时，前端收到什么（SSE 错误码/文案，还是直接断开）？检测作用于用户输入、模型输出，还是两者都有？ | 前端不改会话，依赖现有错误展示 | 雷林周 | 会话是否需要改；改则须跑 `test:conversation` |
| Q4 | 「CAS 只能启用一个」：后端是否在 `updateStatus` 里校验？原型中两条 CAS 同时启用，与需求矛盾。 | 后端校验，前端展示报错 | 雷林周 | F2a |
| Q5 | 原型字段与接口不一致：CAS 有 Client ID/Secret、部门/工号；OAuth2 缺 Secret、缺企微 agentId、缺自定义端点，回调地址可编辑；微信缺形态。 | 以接口为准，回调地址只读 | 产品 / 罗东 | F2a 表单 |
| Q6 | 开启未登录自动跳转后，登出回到 `/login` 会立刻再跳 IdP；IdP 仍有会话时会被自动登回。`/api/auth/idp/logout` 何时使用？ | 9.29 实测：后端 logout 302 到 `/login?local=1`。前端登出落点也改为 `/login?local=1` 防止回跳；是否改成整页走后端 logout 做 CAS 单点登出，待确认 | 雷林周 | F2b 登出 |
| Q7 | 中间页路径前缀是否稳定为 `/auth/`？ | 前端对 `/auth/`、`/api/` 前缀整页跳转 | 雷林周 | F2b 绑定已有账号 |
| Q8 | 账号绑定的回跳：文档写 `/settings/account`，但本前端没有这个路由（设置是弹窗）。绑定失败时如何回传错误？ | 回跳「当前页 + `?setting=identity`」，自动打开设置弹窗的账号绑定页；失败沿用 `idpError` 参数 | 雷林周 | F2c |
| Q9 | 桌面客户端本期是否支持三方登录和自动跳转？ | 桌面宿主隐藏三方按钮，也不自动跳转 | 产品 | F2b |
| Q10 | 旧 CAS（系统设置里 `authType=2` 的 CAS 单点登录，加 `casLoginUrl` 等 4 项）与新「登录方式管理」并存，是否下线？ | 由后端移除这些配置项（系统设置由后端配置驱动） | 雷林周 | 避免出现两套 CAS 配置 |
| Q11 | scope 审核页的菜单挂在哪里？菜单和资源码未种子，测试环境管理员调 `page-query` 返回 4033。申请记录只有 `applyUserId`。 | 放系统管理下新菜单 `/system/oauth2-scope-audit`；请后端种子菜单与资源码，并补申请人名称 | 雷林周 | F3b 能否可见、申请人列 |
| Q12 | Pending 期间再次提交 scope，是覆盖还是报错？profile 是否恒含？三方应用详情用的 info 接口没有 `scopeApplyStatus/pendingScopes/scopeRejectReason`。 | 覆盖；profile 默认勾选且不可取消；前端改调 setting 接口 | 雷林周 | F3a |
| Q13 | 图形验证码是否也作用于 `RESET_PASSWORD / BIND_EMAIL` 的发码（登录态设置页）？验证码是否一次性？有效期多久？ | 两者都作用；按一次性处理 | 雷林周 | F4 范围 |
| Q14 | 验证码登录模式下图形验证码怎么交互？ | 按 F4 中的默认方案 | 罗东 | F4 |
| Q15 | 第 13 条 license 是否有前端工作？ | 本期不做 | 冯飞 | — |
| Q16 | 问答型智能体下发的 Ask 事件是否与任务型一致？ | 一致，仅需联调 | 冯飞 | F5 |
| Q17 | 登录页三方按钮没有原型。 | 表单下方加分隔线「其他登录方式」，下面放图标 + 名称按钮 | 罗东 | F2b 视觉 |

## 下一步

1. 确认开放问题的默认值，尤其是 Q1、Q3、Q5、Q6、Q9、Q11、Q13。
2. 用 grill-with-docs 细化，产出 `specs/release0930-remaining.md`。
3. 进 Plan 模式出 plan。
4. 按 F1 → F4 → F2a → F2b/F2c → F3 的顺序实现，理由：
   - 客户需求优先。
   - 可本地验证的先做。
   - F4 和 F2b 都改登录页，串行做。
   - F3 依赖菜单种子，放最后。
