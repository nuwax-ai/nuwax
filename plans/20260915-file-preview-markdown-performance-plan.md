# 实施计划：文件预览 Markdown 重复解析修复

- 依据：2026-09-15 两份 Performance trace；第二份 13 次长任务均包含文件预览表格渲染，Markdown 累计约 8 秒，期间无目录或文档下载请求。后续 Chrome MCP 独立页面采样又证实工具执行期间存在目录与正文周期刷新、预览 DOM 重建。
- 状态：重复渲染、刷新重建及执行中会话进入优化已完成本地验证；Markdown 依赖补丁已正式应用。浏览器首次进入的端到端复测尚未完成。用户已授权修复，不新增业务功能。

## 改动文件清单

| 文件 | 动作 | 说明 |
| --- | --- | --- |
| `src/components/business-component/FilePreview/index.tsx` | 修改 | 缓存 Markdown 子树；支持正文后台刷新，取消旧请求并识别空正文 |
| `src/components/business-component/FilePreview/index.test.tsx` | 新增 | 用真实解析器验证解析次数、DOM 保留、内容更新与异步请求边界 |
| `src/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView.tsx` | 修改 | Markdown 保持稳定身份，以独立信号通知 FilePreview 唯一加载正文 |
| `src/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView.test.tsx` | 新增 | 验证目录刷新、代码视图、跨会话和媒体刷新契约 |

## 实施顺序

1. 先补测试，验证现有组件在显示状态和父级变化时会重复解析。
2. 缓存 Markdown 子树；正文、图片基础路径或表格译文变化时正确失效。
3. 根据 Chrome MCP 新证据消除 Markdown 时间戳 key/src 与双加载方，保留其他文件类型刷新行为。
4. 执行定向测试、会话回归与分层检查，记录结果。

## 证明成立的测试

- 初次显示及显示延迟结束只解析一次；连续 13 次无关父级更新不增加解析次数。
- 正文变化重新解析；相同正文不重复解析，原有 DOM 与滚动位置保留。
- 图片基础路径变化时更新图片地址。
- 表格译文变化正常生效；表格、代码、内嵌 HTML 和公式仍可展示。
- 同源后台刷新保持可见性、DOM 与滚动位置；真实空文件正确清空；失败重试恢复加载状态。
- 切换文件、连续刷新和卸载时旧请求失效；代码视图与预览视图各自保持正确数据来源。
- 跨会话的同路径文件重新挂载；媒体仍按时间戳刷新。
- 不发送、停止、确认或修改生产会话；用户再次明确生产数据边界后，停止所有生产页面交互，只进行本地验证。

## 风险与回退

- 缓存仅属于单个组件实例，不建立保留历史文档的全局缓存。
- 缓存依赖包含实际显示的表格译文，避免语言切换留下旧标签。
- 保留现有解析插件和目录刷新频率；Markdown 用稳定身份和 refreshKey 重新读取，HTML/Office/媒体保持原刷新语义。
- 目录接口仍未正确透传单层参数；本次没有修改网关或全局 ToolCall 失效策略，因此不承诺减少目录请求量或大文档首次解析耗时。
- 如需回退，只撤销本计划对应的代码改动，保留用户已有配置改动。

## 验证记录

- 失败测试先行：旧代码在初次显示 + 13 次父级更新中解析 15 次；一次正文更新解析 4 次。两条解析次数断言失败，图片路径和译文更新断言通过。
- 修复后：初次显示 + 13 次父级更新仅解析 1 次；正文变化仅新增 1 次解析。
- 定向回归：`pnpm exec vitest run src/components/business-component/FilePreview/index.test.tsx src/components/business-component/ExternalFilePreview/index.test.tsx src/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView.test.tsx`，3 个文件、20 个测试通过。
- 最终会话回归：`pnpm run test:conversation`，84 个文件、742 个测试通过（47.86 秒）。
- 最终类型检查：全库 `tsc --noEmit` 仍有 517 处错误；本次 FilePreview 和 useFileTreePreviewView 源码及测试路径无类型报错。按仓库规则，不将全库 tsc 作为门禁。
- 分层检查：`lint:arch` 被 2 条既有 `SpaceProjectManage → AppDevPro` 跨页面依赖阻断；对应导入在 HEAD 已存在，本次源码改动不新增导入或依赖边。
- `git diff --check` 通过；仅格式化本次修改文件，保留原有 `config/config.development.ts` 改动。
- Chrome MCP 可正常录制，采集到 85.48 秒 trace；DOMSize insight 报告多次 570–873 毫秒的布局计算。另一次 109.218 秒观察记录 39 次 Markdown DOM 新建，前 25 次正文字符数相同（字符数相同不等于已证明正文逐字相同）。
- 独立页面资源记录显示工具执行期间约每 2 秒下载 Markdown（542,150 字节）及目录（约 694,666 字节），证实原 trace 未覆盖的刷新路径。
- MCP 的原始 trace 导出被其工作区路径限制拒绝；已使用返回的 insight 与页面 observer 数据完成分析，observer 结果保存在本次 trace-analysis 目录。
- 最终修复没有在生产页面录制前后对照；依据为真实解析器与 hook 的本地回归，不将解析次数换算为未经测量的页面耗时。不执行生产会话 E2E；本次未提交或合并代码。

## 追加：被动复测与首次加载（2026-09-16）

- 9 月 15 日用户恢复执行后，被动观察已有页面：右侧真实 Markdown 为 284,547 字符；后台仍有目录和正文请求，约 129.691 秒内未重建预览根节点，原节点保持连接，最长观测长任务 196 毫秒。React fiber 可见新 refreshKey 实现已加载。两个采样窗口任务不同，不据此计算固定加速比例。
- 此次 Performance stop 导出遇到 V8 字符串长度上限，不能把已读到的 observer 摘要描述成成功导出的完整 trace。9 月 16 日 MCP 浏览器只剩空白页，未重新打开生产会话。
- 首次加载仍需同步解析全文并布局大量 DOM。下一步分成解析热点和首次布局分别验证，不用延时或更大的 debounce 掩盖。
- 新增 `patches/vfile-location@5.0.3.patch`，只把 next 的 CR/LF 重复后缀扫描改为顺序扫描。最初在 package.json 登记 pnpm 补丁，后迁移至 pnpm-workspace.yaml 的顶层 patchedDependencies，兼容新版 pnpm；锁文件通过离线冻结锁校验，未升级任何依赖。
- 新增 `tests/vfileLocation.test.ts`，覆盖 CR/LF/CRLF、UTF-16、非法偏移和逆序查询。当时工作区 4 文件、33 项定向回归通过；其中行索引测试加载的还是正式目录中尚未打补丁的原包，作为语义基线。
- `/tmp` 隔离 fixture 使用 pnpm 真正安装同一补丁，完成 1,372 文档、480,456 次与原包的语义比较，全部通过。70 万字符 / 1 万 LF 行索引约 85.26 → 1.14 毫秒；CRLF 文档约 0.35 → 1.18 毫秒（绝对回退不足 1 毫秒）。
- 同一中文合成文档（311,376 字符 / 553,296 字节）做完整 Markdown 解析：同进程交替顺序、剔除首轮预热，各 7 次中位数为 591.41 → 558.38 毫秒；两版生成 HTML 的 SHA-256 完全一致。该测量不含浏览器布局，不是冷启动或生产端到端耗时。此前独立进程测量受负载干扰明显，不能据此宣传性能提升。
- 当时本机 HTTP 测试服务、直接打开本地静态页、向既有 pnpm store 应用补丁三个动作均被自动审批服务返回 503 阻断；未绕过。后续正式依赖安装已获准并完成，见本轮验证；浏览器验证仍未完成。
- 首次布局后续需在隔离静态页验证屏幕外内容跳过布局的收益与锚点/查找/打印行为，再决定布局层改动。尚未修改该层 CSS，不能声称首次进入卡顿已完全修复。

## 追加：进入正在执行的会话（2026-09-16）

- 用户补充：卡顿主要发生在进入会话且正在调用工具时。本轮优先处理进入恢复与工具轨迹，不操作生产会话。
- 已确认调用链：页面初始详情加载完成后，实际 features 层恢复 hook 挂载；ahooks 自动轮询与 entry effect 的 reloadHistory 会同时请求完整详情。增加真实 ahooks 回归，先证明重复请求，再让 entry effect 先决定是否订阅，保留恢复前历史就绪等待、失败退避和后续轮询。
- 已确认工具轨迹的每秒计时放在整轮组件内，连带重渲染正文和工具详情。将计时状态收窄到指标标签，真实工具归一化调用数作为回归证据。
- 恢复流每个事件分别排 rAF 读取 scrollHeight 并滚动。仅合并同帧滚动，所有协议事件仍完整处理；补充取消、切换会话与自动滚动开关的测试。
- 验证顺序：各项失败先行与定向测试 → 必跑会话合同回归 → 修改路径类型检查与差异检查。上述本地证据不等同于生产首次进入耗时，仍需被动采样确认剩余热点。

### 本轮验证

- 真实 ahooks 测试先出现 3 项失败，证实首次执行态、等待 user 落库与切入执行态会话时存在并发快照；entry 决策门控后 9 项通过。保留页面初始详情与恢复前 reload，只消除恢复 hook 内多余的首次自动轮询。
- 2 个工具节点在 3 秒计时更新中，归一化调用原为 6 → 18 次，计时标签隔离后保持 6 次；正文与已展开详情不因计时重新渲染，工具结果和终态仍正常更新。
- 滚动测试验证 20 个事件同步按序处理、仅排 1 帧；正常 EOF 保留最后一次置底，abort / 切会话 / 卸载取消待执行滚动。每帧保留原有 100ms 标记窗口，避免连续重放把用户滚动屏蔽时间无限延长。定向测试 21 项通过。
- 最终会话合同：86 文件、753 项通过（46.82 秒）；预览、滚动与当时的行索引语义测试 5 文件、54 项通过。全库 tsc 为既有 517 处错误，本任务修改路径零报错。
- Chrome MCP 本轮 list_pages 返回空内容，没有生产首入新 trace；未导航、刷新、发送或停止生产会话。
- 最终按原锁文件执行 pnpm --force --frozen-lockfile --offline --ignore-scripts 安装，下载数为 0，未升级依赖。实际 rehype-raw → hast-util-raw → hast-util-from-parse5 → vfile-location 链路已验证包含线性扫描实现。安装后的 5 文件、55 项定向测试通过，包括 14 项行索引语义与工作量校验。
- 补丁实际应用后再次完成会话合同：86 文件、753 项通过（63.50 秒）；最终 tsc 仍为 517 处基线错误、修改路径 0 处，格式和差异检查通过。本轮未运行生产会话 E2E，未提交或部署。

### 补丁发布要求

- 一起提交 pnpm-workspace.yaml、pnpm-lock.yaml、patches/vfile-location@5.0.3.patch；如果旧版 package.json 已提交，需同时删除其中的 pnpm.patchedDependencies 配置。在构建阶段用 pnpm 安装并生成 dist；线上静态资源服务器不手工修改依赖。
- 根 Dockerfile 当前仍为 yarn install / yarn build:prod，Yarn 不会应用 pnpm-workspace.yaml 中的 patchedDependencies。若发布使用此入口，须先将依赖安装步骤切换为 pnpm，或在实际构建入口明确应用补丁；本轮尚未修改此构建入口，实际发布入口未核实。
- 干净构建使用 pnpm install --frozen-lockfile。本机 pnpm 10.27.0 复用已有 node_modules 的增量安装出现已生成 patch_hash 目录但未应用补丁的情况；其构建遍历跳过未变化的祖先，没有触达间接依赖的补丁节点。仅看到安装成功或带 hash 的路径不构成生效证据。
- 新增 tests/vfileLocation.test.ts 工作量上界用例；原实现对 5,500 字符 / 500 行 LF 文档累计搜索 1,377,750 字符的 CR 后缀，超过 11,000 上界，因此可检测漏打补丁。构建前应执行 pnpm exec vitest run tests/vfileLocation.test.ts。旧缓存未正确应用时，可用 pnpm install --force --frozen-lockfile 重建安装图再验证；不需要升级依赖。
- 配置迁移验证：pnpm 10.27.0 的 config get patchedDependencies 已能直接读取 workspace 顶层配置；离线冻结锁文件校验通过，补丁 hash 和依赖版本未变，14 项补丁回归测试全部通过。package.json 不再保留旧 pnpm 字段。
