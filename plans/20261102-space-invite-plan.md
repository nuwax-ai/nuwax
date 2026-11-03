# 计划：团队邀请二维码

## 目标与决定

- 分享会前交付：团队成员管理生成邀请、二维码与复制/下载、有效期、历史邀请与作废；区分 PC Web、手机浏览器 H5 与原生 App 扫码入口。
- 邀请人限 Owner/Admin；入团角色支持 User/Admin，默认 User。有效期默认 7 天，可选 1/30 天、自定义和永久；有效期在创建前设置。
- 测试接口实测返回 `/invite/space/:code`；复制与二维码始终使用后端原始 `inviteUrl`。二维码走 `/api/qr/{base64(inviteUrl)}`，按 UTF-8 编码并转义路径段。
- PC 浏览器使用 Web 登录与 IM；系统/第三方手机扫码进入 M 站并使用 M 站登录；App 内扫一扫识别本站邀请后进入原生页面与原生登录，不打开外部网页。
- 登录后有效邀请自动加入团队，并通过团队对应的 IM 会话打开群聊；已有成员直接进入。H5/原生使用 `POST /api/instant-message/spaces/{spaceId}/enter` 获取会话，PC 使用现有 IM 的 `spaceId` 直达入口。邀请码贯穿密码、验证码、首次设置密码及 IdP 回跳，不在前端硬编码群号。

## 本轮交付路径

本轮优先交付外部 PC Web 与 M 站 H5；原生 App 代码保留，打包和发版另行安排，不阻塞 PC/H5。

| 阶段 | 外部 PC 浏览器 | 手机系统/第三方扫码、手机浏览器 |
| --- | --- | --- |
| 统一邀请入口 | `/invite/space/{code}` | 同一入口，首屏分流到 `/m/#/subpackages/pages/space-invite/space-invite?code={code}` |
| 未登录 | `/login?redirect={编码后的PC邀请路径}` | `/m/#/subpackages/pages/login/login?redirect={编码后的移动邀请路径}` |
| 登录/设置密码成功 | 回到 `/invite/space/{code}` | 回到 `/m/#/subpackages/pages/space-invite/space-invite?code={code}`；IdP 经 M 站 `auth/idp-return` 校验 Cookie 后回到此处 |
| 入团 | 校验邀请后，非成员自动调用邀请加入接口 | 同左；保持 H5 页面和登录态 |
| 打开指定群 | `/instant-message?spaceId={邀请对应spaceId}`，由 PC IM 获取团队会话 | 调用 `POST /api/instant-message/spaces/{spaceId}/enter`，再到 `/m/#/pages/message/chat?convId={返回的convId}&convType=4&name=…&avatar=…` |

已有登录态跳过登录，已有成员跳过加入；无效/过期/作废邀请显示提示，加入或打开群聊失败允许重试。`code`、`spaceId`、`convId` 分别来自邀请链接、邀请详情和团队会话接口，不能互相替代；不得默认打开首页或最近的群。

PC 邀请页使用站内 `history.replace` 进入 IM，完整 query 交给宿主。测试环境的整页 `/instant-message?spaceId=…` 请求仍会被外层入口 302 到 `/instant-message/` 并丢失 query，不能使用 `location.replace` 触发这条旧入口；外部直接打开 IM URL 的网关规则仍需独立调整。

## 实施与验证

- 接入创建、列表、详情、加入、作废与二维码六个接口；后端状态/权限为准，消费异步失败，防止重复提交与跨团队旧响应覆盖。
- 回归邀请参数、二维码二进制/业务错误、登录回跳、过期/作废、重复入团、成员列表刷新和手机分流；运行受影响测试、构建与依赖检查，真实测试环境走查。
- 已完成：页面及接口接入；受影响的 140 项测试、依赖分层检查和生产配置构建通过；使用已有测试账号验证二维码展示、已有成员状态、手机匿名登录回跳与窄屏布局。
- 已补充：PC/H5 分流、平台对应登录、自动入团与指定 IM 群落点；Web 31 项、移动端 115 项相关测试及依赖分层检查通过，PC 生产配置构建通过；本地 H5 模拟接口浏览器走通密码登录及 4011→IdP→ 入团 → 指定群，邀请码和 int64 群号保留。
- 待完成：测试环境部署后与测试同学使用新账号验证真实链路。原生扫码代码已补充，Android 编译修正新代码的空值类型后仍受本机 AAR 依赖缓存缺失阻塞；真机验收与 App 发版留待后续。生产环境尚未发布。
