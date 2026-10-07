# remaining 分支最新 feature 合并与启动验收

日期：2026-10-07。看板：NUW-17（原任务）、NUW-18（合并与启动）。

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
