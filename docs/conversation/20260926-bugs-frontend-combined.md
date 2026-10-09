# 罗东近60天 Bug：前端合流

## 提交与位置

- 工作树：`/Users/apple/workspace/nuwax-bugs-sandbox-layout-20260926`。
- 分支：`codex/bugs-frontend-combined-20260926`；基线 `7a9aa3081`。
- `47509ffb2`：G5 #2461，共享 home/chat 面板与拖拽布局。
- `74ea8ab97`（原 `5c70207a2`）：#2528，停止同时关闭 live/sub，业务成功同步 CANCEL，旧 stop 请求不取消新轮。
- `bc6f8c6d8`（原 `bd32fea56`）：旧 sub 关闭及迟到终态/快照不得污染同 ID 新轮。

## 最终门禁

- `test:conversation`：103 文件，937 项通过。
- 终端/VNC 定向：5 文件，11 项通过。
- `lint:arch`：零新违规，97 项既有基线忽略。
- development 构建通过；生成 dist 与 version 文件不入源码提交。
- TypeScript：基线/合流各 544 条错误，标准化错误签名无新增。
- `git diff --check` 通过。
- 独立评审：G5 与运行时补修均无剩余 Important；曾发现的旧 sub 回调竞态已有红绿回归与独立复审。

## 验收说明

- G5 实页验证胶囊、详情、真实文件树、搜索保活及 600/800/1200px 布局/鼠标拖拽。见同目录 `20260926-bug2461-shared-panels-validation.md`。
- #2528/#2265 已有 HTTP SSE 正常/异常关闭、三次受控断流恢复、停止恢复 sub 后立即同 ID 发送新轮的 UI 证据。真实机器连续断网三次未验，受控 HTTP close 不等于设备断网。见 `20260926-bug2528-bug2265-validation.md`。
- #2443：当前云端首页首发完成；原图为 zlk-computer，当前正常选择链以数据库数字配置 ID 为身份，未发现名字/UUID被用作配置ID。原账号请求尚未取得，未盲改后端 Long。
- 客户端独立合流在 `/Users/apple/workspace/nuwax-client-bugs-combined-20260926`，源码 `63181189`、白屏 `726793ce`，报告 HEAD `85a1b04c`；商业 1753 项通过/18 跳过、main/renderer 构建通过，真实 Electron fixture 通过。见其 `docs/acceptance/20260926-client-bugs-combined.md`。

本批源码完成隔离提交；未覆盖共享 checkout 的 ticket 等在途改动，未推送、部署、发包或关闭工单。原 Windows 白屏现场、真实安装包菜单/语言、Mac IME/项目终端，以及健康容器中的 terminal/VNC 成功连接仍需对应环境补验。
