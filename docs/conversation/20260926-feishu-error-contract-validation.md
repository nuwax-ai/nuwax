# F3 前端 ERROR 合同兼容验收

## 范围与任务卡

- 输入：已有 SSE `ERROR / completed:true / data:null / requestId / error` 合同。
- 处理：默认 runtime 与 legacy 会话路径立即收敛 FAILED、释放 active/awaiting；onClose 不使用旧详情 COMPLETE 覆盖；安全错误文本保留已有回答且不重复追加，requestId 缺省时保留当前值。
- **仅前端修改**。后端未发 ERROR 而仅持续心跳的空流仍未处理，需后端负责人；本任务不能宣称修复 Java 吞错。

## 源码与测试证据

- 默认 runtime 原始合同回归发现 FAILED→COMPLETE，修复后 4 文件 67 项绿（`/tmp/nuwax-feishu-error-contract-green.log`）。
- legacy 同样漏正文且 close 查询旧终态；新增既有 model 两条真实形状回归，源码修复复用同一 domain 投影。
- legacy 正确 MESSAGE/text 载荷修复前 2 红/31 绿（`/tmp/nuwax-feishu-legacy-error-red.log`）；修复后与 runtime/close/domain 共 4 文件 97 项绿（`/tmp/nuwax-feishu-legacy-error-green.log`）。父代理另跑 combined 全量会话与分层门。
- 合同测试覆盖空正文/已有正文、重复 ERROR、requestId、active/awaiting 释放及 close 不查询旧详情。

## 浏览器证据与边界

- 已登录 ld，TaskSpace 23 p3，生产组件 `http://localhost:3000/home/chat/1694831/1596`。
- 浏览器内存 fixture 替换下一次 chat SSE，发送实际形状 ERROR 后关闭流；页面安全英文错误文案可见，底部“运行错误”，输入 `contenteditable=true`。
- 证据：`/Users/apple/workspace/bug-batch-20260926/evidence/feishu-file-refresh/error-contract-ui.json` 与同名 png。
- 此为生产组件＋合同 fixture，不是真 Java 部署 E2E。未调用后端 chat，未修改真实文件。
