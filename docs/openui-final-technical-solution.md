# Nuwax OpenUI 最终技术方案

> 状态：PC Web 实施基线  
> 更新时间：2026-07-22  
> 范围：OpenUI Artifact、静态 Runtime、inline/sidecar/文件预览、表单 Action，以及未来 AG-UI/A2UI 边界

## 1. 决策摘要

OpenUI 采用“程序与数据分离”的文件化方案：

```text
Agent
  ↓ MCP
nuwax-openui-mcp
  ├─ Prompt / Schema / DSL 校验
  └─ data/{artifactId}.openui.json
                    ↓
Nuwax PC Web Host
  ├─ Chat inline（同文档 Renderer + CSS 隔离）
  ├─ Sidecar → postMessage → openui-runtime
  └─ 文件树预览 → postMessage → openui-runtime
```

最终决策：

1. `.openui.json` 是 OpenUI 的持久数据源，生命周期跟随项目文件，无 TTL。
2. MCP 不再启动 HTTP 页面服务，不维护内存 Artifact、localhost URL 或 lanproxy 页面转发。
3. PC 的 sidecar / 文件预览加载 `public/static/openui-runtime/index.html`；**Chat inline 使用同文档 `@openuidev` Renderer**，并通过 CSS Layer / 宿主隔离避免被 `ds-markdown` 覆盖（不强制统一 iframe）。
4. Runtime 只解析可信 Host 通过 `postMessage` 发送的 OpenUI 数据，不自行读取项目文件。
5. 表单 `onAction` 复用 ask-question 的恢复消息路径，经 `messageQueue.rawSend` 回到原会话。
6. 本期不修改 `agent-platform`，不实施移动端原生 Renderer。

## 2. Artifact 文件协议

文件固定存放为：

```text
{projectRoot}/data/{artifactId}.openui.json
```

文件契约为 `nuwax.openui-file/v1`，包含 Artifact ID、标题、展示模式、OpenUI Lang、工具绑定、fallback、摘要和创建/更新时间，不包含页面 URL 或过期时间。

`nuwax_render_openui` 的 `artifactId` 可选：省略时创建 UUID；提供已有 ID 时原子覆盖同名文件，保留 `createdAt` 并更新 `updatedAt`。工具返回 `nuwax.openui-ref/v1`：

```json
{
  "type": "nuwax.openui-ref",
  "schemaVersion": "nuwax.openui-ref/v1",
  "artifactId": "550e8400-e29b-41d4-a716-446655440000",
  "path": "data/550e8400-e29b-41d4-a716-446655440000.openui.json",
  "title": "销售订单看板",
  "presentation": { "mode": "inline", "autoOpen": false },
  "digest": "sha256:...",
  "operation": "created"
}
```

Host 必须校验 `path` 与 Artifact ID 完全对应，并验证文件内 ID、Schema 和 digest。

## 3. MCP 生命周期与目录解析

OpenUI MCP 必须作为会话级非持久 MCP 运行。项目目录解析顺序：

1. `NUWAX_OPENUI_PROJECT_ROOT`；
2. MCP `roots/list` 返回的第一个有效本地文件根；
3. MCP 进程继承的 `process.cwd()`。

无法确认项目目录或 cwd 指向 MCP 安装目录时拒绝写入。为避免 NuwaClaw 工具发现阶段误写目录，文件仓库在会话首次调用 `nuwax_render_openui` 时延迟初始化并扫描 `data/*.openui.json`；损坏文件只记录诊断。写入使用临时文件和原子 rename，相同 Artifact ID 允许覆盖。

NuwaClaw 的 OpenUI 模板不再设置 `persistent`、端口、Host、Base URL 或 sidecar 环境变量。

## 4. 固化 Web Runtime

Nuwax 仓库固定包含：

```text
public/static/openui-runtime/
├── index.html
├── runtime.js
└── runtime.css
```

Runtime 固化当前 Renderer、Parser、表达式、图表、表单校验、日期规范化、i18n、响应式样式、Action bridge 和错误界面。Nuwax 将 `@nuwax-ai/openui-runtime` 作为固定版本依赖，通过 `pnpm sync:openui-runtime` 从已安装 npm 包的 `dist/` 同步 JS/CSS；同步过程不依赖本机存在 `nuwax-openui-mcp` 源码仓库。运行时资源独立成包，使 MCP server 包（`@nuwax-ai/openui-mcp`）保持轻量、启动时不再加载 react-dom 等渲染栈。

Host 读取 `.openui.json` 时使用 `cache: no-store` 和 digest 查询参数，校验后发送：

```text
OPENUI_READY
OPENUI_LOAD
OPENUI_RESIZE
OPENUI_ACTION
OPENUI_ACTION_RESULT
OPENUI_ERROR
```

iframe 启用 `allow-scripts allow-same-origin`（ES module 在 null origin 下会触发 CORS，故需同源）。Host 校验 `event.source`、协议版本、随机 nonce、Artifact ID、路径和 Action ID。OpenUI 数据不能作为 HTML 或 `srcDoc` 执行。

高度不保存到 Artifact。sidecar / 文件预览的 Runtime 使用 `ResizeObserver` 测量根节点并发送 `OPENUI_RESIZE`，铺满宿主容器。Chat inline 为同文档 Renderer，高度由内容自然撑开。

## 5. PC Web 三种入口

| 入口 | 行为 |
| --- | --- |
| Chat inline | 工具消息内挂载同文档 Renderer；CSS 与 `ds-markdown` / 主站 reset 隔离 |
| Sidecar | PagePreview Host 加载统一 Runtime，不再访问本机页面 URL |
| 文件预览 | 完整识别 `{uuid}.openui.json`，读取、校验并加载统一 Runtime |
| 文件分享 | `/static/file-preview.html?sk=` 识别 `.openui.json`，同样校验 digest 后加载 Runtime；分享页只读，表单不可回传会话 |

`.openui.json` 在 Monaco 中按 JSON 高亮，普通 `.json` 不会被识别为 OpenUI。收到 Artifact Ref 后可直接按约定路径加载，不依赖文件树刷新；文件树刷新后也能长期发现 Artifact。

历史 `nuwax.openui/v1` 完整 Artifact 通过兼容适配器送入统一 Runtime，旧 `page.url` 和 TTL 不再参与渲染。

## 6. 表单 Action

Runtime 将 OpenUI `ActionEvent` 转换为 `nuwax.openui-action/v1`，包括 Action ID、Artifact ID、文件路径、Action 名称、表单值和提交时间。

发送路径严格复用 ask-question 思路：

```text
Runtime OPENUI_ACTION
  ↓
OpenUI Host 校验、幂等、提交状态
  ↓
buildOpenUiResumeMessage()
  ↓ { text, files? }
会话恢复消息处理器
  ↓
messageQueue.rawSend()
```

恢复消息由本地化摘要、结构化 JSON 和隐藏 Action ID 标记组成。Date 转为 ISO 字符串，清理不可序列化值、循环引用和危险对象键。Runtime 和 Host 不直接调用 chat API、MCP Mutation 或任意业务接口。

## 7. 安全与故障策略

- 文件名只允许 UUID 加 `.openui.json`，禁止目录穿越和自定义绝对路径。
- Host 校验 Schema、Artifact ID 和 SHA-256 digest。
- Runtime iframe（sidecar / 文件预览）与主站样式隔离，PC `reset.css` 不会覆盖 OpenUI。
- Chat inline Renderer 与 `ds-markdown` 同文档共存：`ds-markdown` 降入 `@layer ds-markdown`，OpenUI 使用 `@layer openui`；隔离规则集中在 `OpenUiArtifactView/openui-host-reset.css`（层序、revert-layer、宿主继承切断、容器放行）。
- 文件缺失、损坏、版本不支持、digest 不一致或 Runtime 超时时显示 fallback。
- Action ID 在单次渲染中去重；发送失败恢复交互状态。
- 密码等敏感表单内容不得写入浏览器日志。

## 8. AG-UI、A2UI 与移动端边界

OpenUI 描述一块生成式界面；AG-UI 描述 Agent run/message/tool/state/interrupt 事件。未来接入 AG-UI 时，可将 `nuwax.openui-ref/v1` 作为消息或工具事件载荷，将 `nuwax.openui-action/v1` 映射为 frontend action/continue，不修改文件协议。

A2UI 不与 OpenUI 同时作为当前默认 DSL。未来通过 Artifact Registry 增加新的文件类型、Schema 和 Runtime Adapter，避免改写稳定的 OpenUI 契约。

`nuwax-mobile` 后续使用 WebView 加载同一静态 Runtime：inline 可嵌入或展示摘要卡片，复杂 UI/sidecar 全屏打开；高度继续通过 Runtime bridge 上报，Action 交给移动端现有会话发送器。当前 PC 实施不包含移动端代码。

## 9. 验收基线

- 新建和覆盖正确写入 `data/{artifactId}.openui.json`。
- 重启 PC、NuwaClaw、MCP 后仍可恢复预览。
- inline、sidecar、文件预览使用同一 Runtime 且结果一致。
- 图表正常显示，无 `NaN%`；DatePicker 必填与多语言正确。
- Runtime 样式不受主站 reset 影响，inline 高度自动更新。
- sidecar 不访问 localhost 或 lanproxy。
- Action 经 `messageQueue.rawSend` 返回原会话且不重复发送。
