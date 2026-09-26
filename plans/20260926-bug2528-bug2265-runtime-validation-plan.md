# #2528 / #2265 当前会话链核验与补修计划

## 基线与范围

- 基线：`7a9aa308118128096ecf8c36464d1f3f781fb89e`，独立分支 `codex/bugs-runtime-20260926`。
- #2528：无 FINAL 的异常关闭后，详情返回 FAILED / COMPLETE / CANCEL 时发送按钮恢复；迟到的旧连接查询不能终结新轮。
- #2265：连续断网恢复三次后仍能恢复 sub / 详情轮询；重叠连接的 60 秒静默 watchdog 相互独立。
- 不改沙箱契约、首页创建或 AppDevPro。发现已有修复已完整则保留，只有可重复缺口才补代码。

## 执行

1. 读实际 runtime onClose、sub 恢复 Hook、真实 SSE utility 和已有回归测试，确认历史补修仍在基线。
2. 在独立 worktree 生成 Umi 临时配置，运行 `npm run test:conversation` 与 SSE / runtime 直接回归；环境初始化失败不计作产品回归。
3. 使用共享 browser TaskSpace 22 的独立 Page 与本地 dev 3012，走真实 UnifiedChatSession 页面及实际 HTTP SSE。验正常完成、ERROR、无 FINAL 的网络错误、sub 重连、停止和迟到保护；浏览器受控网络验证要明确与现网区别。
4. 若复现缺口，先加入直接命中因果路径的测试，再最小修复、复验会话质量门；不重做已修代码。
5. 提交任务内文件；报告源码、定向测试、浏览器受控验收和现网/真机验收边界，附可重复证据。

## 验收与限制

- 必跑完整 `test:conversation`；mock 与受控 HTTP SSE 通过不能直接关闭禅道。
- 真环境需当前部署版本、执行中会话和真实断网时间线；无法取得时写明，不把脚本构造的终态当原单交付。
- 不推送、不部署、不修改禅道。

## 2026-09-26 实测后补修

- 三次 HTTP SSE 断流后均成功自动恢复（分别 30.76s / 5.72s / 5.74s），但其后停止会话时出现 `server=CANCEL / active=true / poll=9`。
- 根因：runtime `stop` 只中断 live 槽位，未中断正在接管的 sub；停止 API 成功后也未把 CANCEL 写回绑定层，页面合成活跃态仍被 EXECUTING 快照撑住，而已订阅 sub 使轮询暂停。
- 最小补修：同时关闭 live/sub；停止请求成功后经统一终态入口写 CANCEL，停止请求迟到用会话/轮次所有权拦住。失败响应不伪造成功终态。
- 先在原代码加入 sub-stop 与旧 stop 请求迟到的直接回归，确认红灯后补修，再跑必需会话门与同一受控页面的 sub-stop 复验。
- 当前独立 dev 实际为 localhost:3000（仓库配置覆盖 PORT），完成真实 /home 联通验收后停止该进程，释放端口给 root。

## 独立复审追加：停止后同 ID 新轮的迟到 sub close

- 停止会 abort sub，SSE 的关闭回调延迟约 500ms；停止成功后立即发送同 ID 新轮时，旧 close 的状态/快照请求仍可能写 CANCEL 给新轮。
- 先覆盖旧 close 到达前新轮开始、新轮已结束，以及状态查询/快照等待期间开始新轮四条回归，要求旧快照/终态/轮询恢复均被丢弃。
- 复用现有 snapshot consistency generation，在订阅开始捕获并在所有异步边界核验所有权；本地新轮负责释放旧订阅标记，旧 close 不得清新订阅。保留无新轮时失败 stop 的 close 恢复轮询。
- 定向红绿后运行必需 test:conversation，补充此前验收报告的范围，交独立复审。
