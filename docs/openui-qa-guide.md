# 生成式 UI（Nuwax OpenUI）测试指南

> 面向测试同学的功能说明、测试场景与示例提示词。读完即可上手验收。

---

## 一、功能简介

生成式 UI（OpenUI）让 Agent 根据用户的自然语言需求，**实时生成可交互的界面**——卡片、数据看板、图表、表单、状态面板等**单页自包含界面**，并在对话中直接展示与操作。生成的 UI 会**固化为项目文件**，支持持久化、预览、重启恢复，以及表单提交回传到对话。

一句话：**用户说「帮我做个看板/表单/卡片」，Agent 直接生成能看能点的界面，而不是丢一段代码或截图。**

> **能力边界（重要）**：OpenUI 做的是「**单个自包含的结构化信息界面**」，**不是**多页应用或网站。详见下文「二、能力象限：什么该走 / 不该走 OpenUI」。判断一个需求 Bug 与否之前，先确认它是否属于 OpenUI 该承担的范围。

---

## 二、能力象限：什么该走 / 不该走 OpenUI

> 这一节是判断「Agent 路由对不对」「某个现象是不是 Bug」的前提。OpenUI（官方 thesysdev/openui v0.5）与本接入方案的边界一致：**模型只组合标准组件、绝不执行任意代码；无路由、无多页。**

### 2.0 三象限速查

| 象限 | 内容 | 示例需求 | 正确路由 |
| --- | --- | --- | --- |
| ✅ **首选** | 单个自包含、用标准组件（KPI 卡/图表/表格/表单/文本/图像）表达的结构化信息界面 | 数据看板、指标卡、销售报表、监控面板、反馈表单、状态页 | 走 `nuwax_render_openui` |
| ❌ **不推荐** | 多页应用/网站/客户端路由；游戏/重交互/像素级定制布局；自由文档/富文本长文；需任意 JS/外部脚本/裸 HTML | 多页官网、带路由的管理后台、小游戏、画布编辑器、 Markdown 长文 | **不走 OpenUI**，写普通代码/文件 |
| ⚖️ **灰区** | 介于两者之间 | 「做个能看的汇总」「把数据摆一摆」 | 用下面两问判断 |

### 2.0.1 灰区判断两问

拿不准时问自己两句：

1. **交付物是不是「单个自包含界面」**（而不是可以在多个页面间导航的应用）？
2. **能否用「结构化数据 + 标准组件」表达**，不需要任意 JS、外部脚本或像素级自由布局？

两个都答「是」→ 走 OpenUI；否则 → 写普通代码/文件。 **拿不准时，优先选 Host 真能在对话内渲染的那条路**——绝不要因为需求含糊就默默退化成裸 `*.html` 文件（那是 Host 无法渲染的旁路，属于 Bug）。

### 2.0.2 为什么不能是「整页应用 / 多页应用」

- OpenUI Lang 是受限 DSL：**禁止** `<script>`、`eval()`、动态 `import()`、`Function()`、`javascript:` 等任意代码（MCP `policy.ts` 强制拦截）。
- **单 Artifact = 单界面**：没有路由、没有跨页导航；唯一的"导航"原语是 `@OpenUrl`（新标签打开外部链接）。
- 布局是**标准组件组合**，不提供像素级自由排版。

> 因此「帮我做个多页官网」「做个小游戏」「做个带路由的后台」这类需求，Agent **正确**的做法是不用 OpenUI、直接写代码——这不是「没触发 OpenUI 的 Bug」。

---

## 三、技术方案简介（测试背景）

理解以下几点，有助于判断「某个现象是 Bug 还是预期」。

### 2.1 MCP 工具（Agent 调用）

| 工具 | 作用 | 边界 |
| --- | --- | --- |
| `nuwax_render_openui` | **生成/更新 UI**，把界面数据写到项目 `data/{artifactId}.openui.json` | 只负责「渲染可视化界面」 |
| `nuwax_get_openui_reference` | **写作参考**：OpenUI Lang 语法、组件签名、表格接线示例 | 只读；复杂看板/表单前应先调 |
| `nuwax_get_openui_update_guide` | **更新指引**：如何改已有 `*.openui.json`（复用 artifactId 或手改 + 维护 digest） | 只读；用户说「改标题/改这个文件」时应先调 |
| `nuwax_ask_question` | **向用户提问**（弹出表单收集输入/决策） | 只负责「提问」，不渲染 OpenUI |

> `render_openui` 与 `ask_question` 互不替代、不可混淆。防混淆的边界声明由 `openui-mcp` 承担。  
> OpenUI Lang **专用数据源扩展名**是 **`*.openui.json`**（规范路径 `data/{artifactId}.openui.json`）。**不要**落盘裸 `.openui` 或其它后缀冒充 OpenUI 数据源。

### 2.2 程序与数据分离（关键设计）

生成的 UI 由两部分组成，**分别处理**：

- **统一预览入口**：`public/static/file-preview.html` 识别 OpenUI 后按需加载 `file-path-bootstrap.js` + `runtime.js` + `runtime.css`；普通文件不会下载 Runtime 重资源。
- **OpenUI 数据**（动态）：`data/{artifactId}.openui.json`，纯结构化数据（OpenUI Lang `document.source`、digest、展示模式等）。

当前各入口的渲染路径（便于区分「Bug」与「已知差异」）：

| 入口 | 实际渲染方式 |
| --- | --- |
| **sidecar** / **文件树预览** | 固化 html 外壳加载 `.openui.json` → `postMessage` 注入 → 渲染 |
| **inline** | 同文档内联 Renderer（与 markdown 同树）；通过 CSS Layer / 宿主复位与 `ds-markdown` 样式隔离 |

### 2.3 三种展示入口

| 入口 | 说明 | 触发方式 |
| --- | --- | --- |
| **inline** | 在对话消息内直接展示（卡片/表单/紧凑看板） | 默认；`presentation.mode = inline`，Agent 生成后自动出现 |
| **sidecar** | 全屏页面预览 | Agent 以 `presentation.mode = sidecar` 生成后，对话内出现摘要卡，点「打开预览」 |
| **文件树预览** | 点击 `data/` 下的 `.openui.json` 文件；默认预览，可切代码 | 文件树点击 |

### 2.4 持久化、digest 与更新方式

- **持久化**：UI 数据落盘到 `{项目根}/data/{artifactId}.openui.json`，文件名即 `artifactId`，专用后缀 `.openui.json`。重启会话时自动扫描 `data/` 加载，UI 可恢复。
- **完整性校验**：每个文件带 `document.digest`（`sha256:` + 64 位十六进制），须与 `document.source` 内容一致；格式非法或与内容不一致时拒绝渲染。
- **两种合法更新方式**（都不禁止）：
  1. **推荐**：再调 `nuwax_render_openui`，传入**同一** `artifactId`，由工具重写文件并自动重算 digest。
  2. **直接编辑** `.openui.json`：可改 `title` / `document.source` 等；若改了 `source`，必须同步更新 `document.digest`，勿删 `type` / `schemaVersion` / `artifactId` 等必填字段。
- **表单回传**：UI 内的表单提交（`onAction`）→ 经 chat 接口以结构化文本发回 → 作为下一条消息进入原会话 → Agent 据此继续。与 `ask-question` 的回传机制一致。

### 2.5 OpenUI Lang 可达性（Orphaned，易踩坑）

OpenUI Lang 里每个变量（除 `root` 外）必须被引用，且能从 `root` 到达。只定义 `usersData = [...]` 却没接到 `Table` / `Col` / `Stack` 上，工具会报错：

```text
Orphaned statements: usersData
```

这是**校验拒绝**（不是「静默丢弃」）。正确路径：数据变量 → `Col` → `Table` → `root`。复杂表格前 Agent 应先调 `nuwax_get_openui_reference`（`profile=dashboard`）。

### 2.6 整体流程

```
用户输入（自然语言）
      │
      ▼
（可选）nuwax_get_openui_reference / nuwax_get_openui_update_guide
      │
      ▼
Agent 调用 nuwax_render_openui  ──▶  写入 data/{artifactId}.openui.json
      │
      ▼
前端按入口渲染：
  · inline → 内联 Renderer（CSS 与 ds-markdown 隔离）
  · sidecar / 文件树预览 → 固化 html 外壳 + 数据
      │
      ▼
用户操作表单  ──▶  onAction  ──▶  chat 接口回传  ──▶  Agent 下一轮
```

---

## 四、核心功能点（验收维度）

| # | 功能点 | 关键验收 |
| --- | --- | --- |
| 1 | UI 生成与渲染 | Agent 正确生成；三类 UI（卡片/看板/表单）渲染正确、可交互 |
| 2 | inline / sidecar 展示 | 对话内 inline 正常；sidecar 摘要卡可点「打开预览」进全屏 |
| 3 | 持久化 | `data/{id}.openui.json` 落盘；重启后 UI 恢复；**无**裸 `.openui` 冒充数据源 |
| 4 | 文件树预览 | 点击 `.openui.json` 默认加载固化 html 预览；可切到代码视图 |
| 5 | 表单提交回传 | 提交内容回到原会话；用户气泡干净（无内部标记） |
| 6 | 工具边界 | `ask_question` 与 `render_openui` 不互替；更新前可用 `update_guide` |
| 7 | 数据完整性 | 篡改 `.openui.json`（不改 digest）后加载被拦截；手改 source 未改 digest 有明确提示 |
| 8 | 复用更新 | 同一 `artifactId` 再次生成可覆盖已有 UI |
| 9 | Orphaned / 表格接线 | 员工表类需求不因未引用 `usersData` 反复失败；失败时有可操作提示 |
| 10 | 能力象限路由 | 看板/表单类（首选象限）走 `render_openui`；多页/游戏/富文本类（不推荐象限）正确不走 OpenUI、写普通代码；灰区不退化成裸 `*.html` |

---

## 五、测试场景与示例提示词

> 提示词可直接复制到对话输入框。预期结果作为通过标准。
>
> **场景分组**：场景 1–11 属于「✅ 首选象限」（该走 OpenUI）；场景 12 起属于「❌ 不推荐象限」（不该走 OpenUI，验证 Agent 不会硬套）。判断依据见「二、能力象限」。

### ✅ 首选象限（应走 OpenUI）

### 场景 1 — inline 数据看板（dashboard）

**提示词：**

```
帮我做一个本月销售数据看板：包含「总营收」「订单数」两个指标卡，再加一个 Top5 产品销量的柱状图。
```

**预期：**

- Agent 调用 `nuwax_render_openui`（复杂看板可先调 `nuwax_get_openui_reference`）
- 对话内出现可交互看板（inline）
- 指标卡数值展示正常；柱状图坐标轴/柱高/图例正确
- 项目 `data/` 目录下生成 `{artifactId}.openui.json`（**不是** `xxx.openui`）

**通过标准：** 看板完整渲染、数据合理、无报错；落盘文件存在且后缀为 `.openui.json`。

---

### 场景 2 — inline 表单 + 提交回传（form / onAction）

**提示词：**

```
做一个用户反馈表单：包含姓名（文本）、满意度（1-5 单选）、反馈内容（多行文本）、提交按钮。
```

**操作：** 填写表单 → 点提交。

**预期：**

- 表单在对话内 inline 渲染，字段/控件/校验正常
- 提交后，填写内容作为**下一条用户消息**出现在原会话
- Agent 能读取提交内容并继续响应
- 用户消息气泡里**只有提交内容**，不含 `<!-- ... -->` 等内部标记；复制出来是干净文本

**通过标准：** 提交内容正确回传；气泡展示干净；Agent 能基于回传继续。

---

### 场景 3 — sidecar 全屏页面

> 注意：sidecar **不是**从 inline 卡片上再点一次打开。只有 Agent 以 `presentation.mode = sidecar` 生成时，对话里才会出现摘要卡 +「打开预览」。 **通过前提：** 工具列表里必须出现 `nuwax_render_openui`（代理后常见名如 `nuwax-openui__nuwax_render_openui`）。仅 `nuwax_validate_openui` / `nuwax_get_openui_update_guide` **不算**渲染成功，Host 不会出任何 UI。

**提示词：**

```
帮我做一页全屏销售数据看板（要用 sidecar / 全屏页面预览，不要塞在对话气泡里）：包含总营收、订单数两个指标，再加一个 Top5 产品销量柱状图
```

**操作：** 确认工具调用含 `nuwax_render_openui` 且 `presentation.mode=sidecar`、`autoOpen=true`；若未自动弹出，点摘要卡「打开预览」。

**预期：**

- 工具轨迹含 `nuwax_render_openui`（不是只 validate）
- 对话内出现 sidecar 摘要卡（标题 +「打开预览」按钮），而不是直接塞满对话的大块 inline UI
- `autoOpen: true` 时 Host 应自动打开全屏预览；否则点击「打开预览」后进入全屏页面预览
- UI 完整加载，布局/样式正常
- 页面内交互（筛选、点击、表单）正常

**通过标准：** 必须有 render 工具调用；摘要卡入口正确；全屏页面能加载并正常交互。仅 validate 通过不算本场景通过。

---

### 场景 4 — 持久化与重启恢复

**前置：** 触发场景 1，生成至少一个 UI。

**操作：**

1. 到项目根目录 `data/` 下，确认存在 `{artifactId}.openui.json`
2. 重启会话 / 刷新页面

**预期：**

- 落盘文件存在，文件名为 UUID + `.openui.json`
- 重启后，历史 UI 仍可加载展示（从 `data/` 扫描恢复）
- 文件树出现该 `.openui.json`
- **不应**出现仅用于「给人看」的裸 `employee_data.openui` 一类文件作为唯一产物

**通过标准：** 文件落盘；重启后 UI 可恢复；数据源后缀正确。

---

### 场景 5 — 文件树预览

**操作：** 在文件树中点击 `data/` 目录下的某个 `.openui.json` 文件。

**预期：**

- 默认进入「预览」模式：预览面板加载固化的 html 外壳，渲染出对应 UI
- Header 出现「预览 / 代码」切换（与 html、markdown 相同）
- 切到「代码」可查看 JSON 源码；切回「预览」恢复 UI
- 渲染效果与原生成的 UI 一致
- 支持的交互（表单、筛选等）在预览中可用

**通过标准：** 点开 `.openui.json` 默认看到完整 UI 而非原始 JSON；可切换到代码视图查看源文件。

---

### 场景 5b — 误用裸 `.openui` 的预览表现（回归）

**操作（任选其一）：**

1. 若历史会话里出现过 `employee_data.openui` 之类文件：在文件树点开它
2. 或临时复制一份合法 `*.openui.json` 内容，另存为 `demo.openui` 再点开

**预期：**

- 若内容是合法 `nuwax.openui-file`：允许嗅探渲染出 UI（或经 URL 拉取后渲染）
- 若内容不是合法 OpenUI 文件：提示应使用 **`*.openui.json`** 作为 OpenUI Lang 数据源（不要只显示泛化的「不支持 openui」）
- 切到「代码」仍可查看文件文本

**通过标准：** 错误扩展名有明确指引；合法内容可预览或可看代码。

---

### 场景 6 — 卡片/内容（basic）

**提示词：**

```
做一张项目迭代状态卡片：展示当前迭代名、进度百分比、负责人、状态标签。
```

**预期：** 对话内出现结构清晰的卡片，字段对齐、样式正常。

**通过标准：** 卡片信息完整、排版正常。

---

### 场景 7 — 工具边界（防混淆，重要）

用对照提示词，验证工具不会被 Agent 用错。

| 提示词 | 预期触发的工具 | 不应出现 |
| --- | --- | --- |
| 「我接下来该选 A 方案还是 B 方案？帮我问一下」 | `nuwax_ask_question`（提问表单） | 不应渲染 OpenUI 看板 |
| 「把上面的数据画成看板」 | `nuwax_render_openui`（渲染 UI） | 不应弹提问表单 |
| 「把刚才那个看板的标题改成 123」 | 宜先 `nuwax_get_openui_update_guide`，再 `nuwax_render_openui`（同 artifactId） | 不应只手改文件却弄坏 digest 后无法预览 |

**通过标准：** 提问走 `ask_question`，渲染/更新走 `render_openui`；更新路径可预览成功。

---

### 场景 8 — 数据完整性（digest 校验）

**操作 A（源与 digest 不一致）：**

1. 找到某个已生成的 `data/{id}.openui.json`
2. 手动改坏文件内容（例如改 `document.source` 或标题相关字段），**不要**同步改掉文件里的 `digest` 字段
3. 在文件树重新点开该文件（预览模式），或刷新后再次加载

**预期：**

- digest 校验失败，**拒绝渲染**，不会展示错乱界面
- 出现明确错误提示（如「界面渲染失败」或 digest 契约相关文案），而不是空白无反馈

**操作 B（digest 格式非法）：**

1. 将 `document.digest` 改成非 `sha256:` + 64 位十六进制的值（例如 `"broken"`）
2. 再点开预览

**预期：** 无法预览，并提示 digest 无效 / 需用 `nuwax_render_openui` 复用 artifactId 重新发布，或按规则重算 digest。

**通过标准：** 篡改后加载被拦截、有明确报错。

---

### 场景 9 — 重复生成（复用 artifactId 更新）

**前置：** 已有一个落盘的 `data/{artifactId}.openui.json`（可用场景 1 生成）。从文件名或对话记录记下该 `artifactId`。

**提示词：**

```
请更新刚才那个看板（复用同一个 artifactId）：把标题改成「本月销售看板（已更新）」，并给总营收加一个环比说明。
```

**预期：**

- Agent 可先调 `nuwax_get_openui_update_guide`，再调 `nuwax_render_openui` 复用同一 `artifactId`
- `data/{artifactId}.openui.json` 被原子覆盖（仍是同一文件名），内容已更新，`digest` 已刷新
- 对话内 / 文件树预览看到的是更新后的 UI，而不是另起一个全新文件

**通过标准：** 同名文件被更新；UI 展示新内容；不会无故多出一个无关的 `.openui.json`（允许 Agent 偶发新建，但应以「复用更新」为正确路径）。

---

### 场景 10 — 文件分享打开 `.openui.json`

**操作：**

1. 在文件树选中某个 `data/{id}.openui.json`
2. 使用文件分享，复制 `/static/file-preview.html?sk=...` 链接
3. 在无登录 / 新窗口打开该链接

**预期：**

- 打开后渲染完整 OpenUI 页面，而不是 JSON 源码高亮
- digest 被篡改时拒绝渲染
- 页面内表单提交不可回传原会话（只读提示 / 失败结果）

**通过标准：** 分享链接可独立打开 UI；普通 `.json` 分享仍走文本预览。

---

### 场景 11 — 员工信息表 / Orphaned 回归（高发）

**提示词：**

```
生成一个员工信息表，约 20 条模拟数据，列包含：姓名、部门、职位、入职日期、状态。
```

**预期：**

- Agent 成功调用 `nuwax_render_openui`（必要时先 `nuwax_get_openui_reference` profile=dashboard）
- 对话内出现表格 UI；落盘为 `data/{uuid}.openui.json`
- **不应**反复出现 `Orphaned statements: usersData`（或同类未引用变量）导致最终无 UI
- 若某次调用失败，工具错误文案应提示：把变量接到 Table/Col/Stack，或删除未用变量

**通过标准：** 表格能稳定生成并预览；无「只定义数据未接线」导致的最终失败。

---

### ❌ 不推荐象限（不应走 OpenUI，验证 Agent 不会硬套）

> 这一组验证「路由不越界」：需求超出 OpenUI 能力象限时，Agent 应**直接写普通代码/文件**，而不是硬套 `nuwax_render_openui` 或退化成对话内无法渲染的旁路。判断依据见「二、能力象限」。

### 场景 12 — 多页应用 / 网站（超出象限）

**提示词：**

```
帮我做一个公司官网：要有首页、产品页、关于我们三个页面，顶部导航可以切换。
```

**预期：**

- Agent **不应**调用 `nuwax_render_openui`（多页 + 客户端路由超出 OpenUI 象限）
- Agent 应说明这类需求适合用普通前端代码实现，并直接产出代码/文件（如 HTML/框架工程）
- 对话内**不应**出现一个"假装是官网"的单块 OpenUI 卡片冒充多页应用

**通过标准：** Agent 识别出多页/路由需求并走普通代码路径；不硬套 OpenUI。

---

### 场景 13 — 重交互 / 游戏（超出象限）

**提示词：**

```
做一个贪吃蛇小游戏，用键盘控制，要有计分。
```

**预期：**

- Agent **不应**调用 `nuwax_render_openui`（重交互/游戏需任意 JS 与画布控制，超出象限）
- Agent 应直接写普通代码（如一个自包含 HTML/JS 文件）实现游戏
- 这是「**写代码是正确路径**」的场景，不要误判为「没触发 OpenUI 的 Bug」

**通过标准：** Agent 走普通代码路径实现；不硬套 OpenUI。

---

### ⚖️ 灰区（验证不退化成裸 HTML 旁路）

### 场景 14 — 模糊可视化需求（灰区，仍应走 OpenUI）

**提示词：**

```
把这个月各部门的费用数据给我摆一摆，让我一眼能看清。
```

**预期：**

- 需求措辞模糊（没说"看板/图表"），但真实意图是"单个自包含的可视化界面"→ 仍属首选象限
- Agent 应走 `nuwax_render_openui`（可先 `nuwax_get_openui_reference`），产出 `data/{artifactId}.openui.json`
- **不应**因为需求含糊就写裸 `sales.html` / `*.html` 文件（Host 无法渲染的旁路，属 Bug）

**通过标准：** 灰区需求仍走 OpenUI 并落盘 `.openui.json`；不退化成裸 HTML。

---

## 六、已知差异 / 限制

> 以下是当前版本的已知情况，**不是 Bug**，测试时请注意区分。

- **inline 渲染路径差异**：inline 使用**同文档内联 Renderer**；sidecar / 文件树预览走固化 Runtime iframe。这是有意保留的路径差异（inline 不统一 iframe）。
  - 样式：inline 宿主隔离集中在 `src/components/business-component/OpenUiArtifactView/openui-host-reset.css`（`@layer ds-markdown` / `@layer openui` 层序、宿主继承切断、对 `[data-openui-render-mode="renderer"]` 子树放行），避免被 `ds-markdown` / ChatArea 宽规则覆盖。
  - 测试时，inline 的通过标准是「能正确展示与交互，且不受 markdown 排版样式污染」，不必要求与 sidecar 走同一渲染路径。
- **inline 表单回传兜底**：inline 入口的表单提交已有超时兜底；sidecar / 文件预览（iframe 模式）下的 `onAction` 若 Host 未及时回传结果，UI 可能短暂等待。若遇到 iframe 模式提交后长时间无响应，请记录场景反馈。
- **允许直接编辑 `.openui.json`**：手改合法，但改 `source` 必须同步合法 `digest`；否则预览失败属于**操作未按契约**，不是 Runtime 随机坏掉。推荐仍用 `nuwax_render_openui` 复用 `artifactId` 更新。
- **裸 `.openui` 不是正式数据源**：正式产物永远是 `*.openui.json`。文件树对裸 `.openui` 仅做兼容嗅探/明确提示，不应鼓励 Agent 继续 invent 该后缀。

---

## 七、验收清单（Checklist）

> 提测/回归时逐项确认。

- [ ] inline 看板（dashboard）渲染正确、可交互
- [ ] inline 表单（form）渲染正确、校验生效
- [ ] inline 卡片（basic）渲染正确
- [ ] sidecar：摘要卡出现后点「打开预览」可进全屏
- [ ] 表单提交内容回传到原会话
- [ ] 用户消息气泡干净（无 `<!-- -->` 等内部标记，复制干净）
- [ ] `data/{artifactId}.openui.json` 正确落盘（无裸 `.openui` 作为唯一产物）
- [ ] 重启 / 刷新后历史 UI 可恢复
- [ ] 文件树点击 `.openui.json` 默认预览 UI，可切换到代码视图
- [ ] 误用裸 `.openui`：合法内容可嗅探预览或有明确「请用 \*.openui.json」提示
- [ ] 分享 `.openui.json` 打开 `/static/file-preview.html?sk=` 渲染为 UI（非 JSON 源码）
- [ ] 分享页表单不可提交回原会话（只读）
- [ ] `ask_question` 与 `render_openui` 不混淆
- [ ] 更新已有 UI：可走 update_guide + 同 artifactId render；预览仍可用
- [ ] 篡改 `.openui.json`（不改 digest）后加载被拦截
- [ ] digest 格式非法时有明确契约/修复提示
- [ ] 重复生成（复用 artifactId）能更新已有 UI（见场景 9）
- [ ] 员工信息表类需求不因 Orphaned statements 最终失败（见场景 11）
- [ ] **能力象限路由**：看板/表单类（首选象限）走 `render_openui` 并落盘 `.openui.json`（见场景 1/14）
- [ ] 多页应用/网站类需求**不**硬套 OpenUI，走普通代码（见场景 12）
- [ ] 游戏/重交互类需求**不**硬套 OpenUI，走普通代码（见场景 13）
- [ ] 灰区模糊可视化需求不退化成裸 `*.html` 旁路（见场景 14）

---

## 八、附录：涉及的关键目录 / 文件（排查用）

| 路径 | 说明 |
| --- | --- |
| `{项目根}/data/{artifactId}.openui.json` | 生成的 UI 数据（持久化产物；专用数据源后缀） |
| `public/static/file-preview.html` | 所有文件类型（含 OpenUI）的统一预览入口 |
| `public/static/openui-runtime/file-path-bootstrap.js` | Runtime 子页 `?file_path=` 同源拉取并 relay（nuwax 自维，不与分享 Host 共用） |
| `public/static/openui-runtime/runtime.js` | 渲染运行时（含样式、解析、组件库） |
| `public/static/file-preview.html` | 文件分享入口（含 `.openui.json` 特殊渲染） |
| `public/static/file-preview/file-preview-openui.js` | 分享页 OpenUI：类型识别、digest 校验、Runtime iframe Host |
| `public/static/file-preview/file-preview.js` | 分享页主流程（调度各类型预览，含调用 OpenUI Host） |
| `src/utils/openUiArtifact.ts` | Host 侧 `.openui.json` / 裸 `.openui` 识别与契约嗅探 |
| `nuwax-openui-mcp`（≥0.3.4） | `nuwax_render_openui`、`nuwax_validate_openui`、`nuwax_get_openui_reference`、`nuwax_get_openui_update_guide` |
| `nuwax-ask-question-mcp` | 提供 `nuwax_ask_question` 工具，负责提问 |

> 如遇问题，附上：使用的提示词、对应的 `data/*.openui.json` 文件、浏览器控制台报错截图，便于定位。
