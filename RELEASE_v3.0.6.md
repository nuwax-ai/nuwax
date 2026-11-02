# Release v3.0.6

基于 v3.0.5 至 main 的变更整理，可直接用于 GitHub/GitLab Release 描述。

---

### ✨ 新功能

- 会话工作区（files）：流式过程中编辑当前预览文件时只刷新正文；新增、删除、移动、重命名仍刷新文件树，内容变更与结构变更节流分离。
- AppDevPro：会话结束在文件树预览且不会切回应用预览时，自动按 task-result 定位打开产物；手动点击 task-result / 会话胶囊产物会进入文件树并打开预览。
- task-result 解析：Chat / AppDevPro 统一为「最后一个 task-result 中的第一个 file」。
- 导出下载（exportImportFile）：HTTP 业务失败时解析 Blob 响应体中的 message，避免只提示 status 文案。
- 登录与验证码（Login / VerifyCode）：增强验证码处理逻辑与状态管理。
- 桌面宿主桥（host-bridge）：区分普通浏览器链接与支付窗口打开行为。
- 应用列表（ApplicationItem）：新增智能体子类型隐藏操作项。
- 智能体详情：支持自动 / 审核模式切换相关能力修复与补齐。

### 🐛 Bug 修复

- 工作区文件操作绑定到当前活跃上下文，避免串会话。
- 更新日志（updater）：恢复全局列表重置后的列表标记，以及发版说明列表与段落间距。
- AntV X6：修复工作流属性面板列表输入中文 IME 被打断。
- 微应用构建链：构建阶段不再拉取远端；pin 拉取拆为独立命令并支持离线模式。
- 测试：排除仓内嵌套 worktree，避免误收集旧会话用例；技能滚动几何在首响前就绪。

### ♻️ 重构

- 会话文件树刷新与 task-result 打开链路在 Chat / EditAgent / ConversationAgent / AppDevPro 间对齐，页面保留各自会话结束差异逻辑。

### 📦 其它

- 升级 nuwax-im、nuwax-repo-web 等子模块指针。

---

**版本**：v3.0.6  
**基准**：v3.0.5 → main  
**日期**：2026-10-30
