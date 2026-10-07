# remaining 分支最新 feature 合并与启动验收

日期：2026-10-07。看板：NUW-17（原任务）、NUW-18（合并与启动）。

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
