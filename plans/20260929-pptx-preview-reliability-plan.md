# PPT 文件预览可靠性方案（2026-09-29）

- 来源：ZCode 会话 `sess_48d1c777-3016-4e90-ba96-b9a9b8fb05f9`，标题「调研资料库 PPT 预览方案修复预览失败」。
- 状态：用户已接受方案，首期实施中；生成治理与共享引擎为后续阶段。
- 核查基线：主前端 `b6fc92fe7542817f37b405a9cd39d58e074e15c9`；资料库子模块 `188224f8bc7bf917eb32e1109ccd0ca3a5c4d498`。
- 目标：文件树和工作区外文件都能可靠打开 PPTX，按原顺序呈现页面；遇到损坏或不支持内容时给出明确结果和下载入口。

## 一、推荐结论

**先修当前白屏的明确原因，再推进资料库模型引擎的共享。**

1. 首期在主前端补「PPTX 结构检查、兼容处理、渲染结果校验」，恢复现有问题文件的预览，并补齐请求与生命周期处理。
2. 找到实际文件生成管线后，修正包内部件清单的生成规则，阻止继续产出相同问题文件。
3. 后续若要统一两边的预览能力，从资料库的 `parsePptxToModel` 路径抽共享只读引擎；先解决属性注入、并发上下文和缩放问题，再切换默认引擎。

这个顺序的依据是：**当前文件只修部件声明就能让现有库输出 45 页；更换整个渲染器不是修复该文件的必要条件。** 资料库的模型解析仍有复用价值，但直接复制旧 HTML 入口会丢失表格等内容。

## 二、对原调研的修正

### 2.1 文件确实有 45 页

样本：`/Users/apple/Downloads/cd067101163f63dc21cbb841ec63f13e.pptx`，1,372,636 bytes。

SHA256：`18bdca0e040e24f7a552cce8892dd067197dbc1bcd0d9634e88180340ef3dbc3`。

`presentation.xml` 的 `p:sldIdLst` 有 45 项，按关系顺序指向 `slide1.xml` 至 `slide45.xml`，所有页面目标存在。原报告用 `/class="pptx-slide/g` 统计，误把父容器 `pptx-slides` 算为一页，因此得到 46。应按模型数组或精确 `.pptx-slide` DOM 选择器统计。

### 2.2 白屏直接原因已经找到

`[Content_Types].xml` 声明了 45 份 `slideMaster`，但 ZIP 中只有 `slideMaster1.xml`，其余 44 个声明指向不存在的部件。

`pptx-preview@1.0.7` 读取第二份母版时发生：

```text
part: ppt/slideMasters/slideMaster2.xml
TypeError: Cannot read properties of undefined (reading 'async')
```

库内部吞掉异常，页面和版式尚未装载，Promise 却成功返回。主前端再直接置为 `success`，形成空白预览。

原报告对 `ma14:` / `p:fld` 的判断只是猜测。本次实验保留这些内容，仅删除 44 个悬空声明，旧库立即恢复 45 页。也不能继续把文件称作结构完全正常：有效页面关系正常，但部件声明存在不一致。

### 2.3 两条资料库解析路径不能混用

资料库实际导入路径是：

```text
parsePptxToModel → 资料库自己的图片上传与建页流程 → renderSlidesToHtml
```

主前端只读预览可复用解析和渲染能力，无需接入上传、建页、快照和编辑业务。

旧 `parsePptxToHtml` 仅处理部分文本、图片、形状；不解析组合与连接线，表格所在的 `graphicFrame` 也是空占位。模型路径才支持组合、连接线和表格。

| 本次离线复跑 | 页数 | 说明 |
| --- | --: | --- |
| 原文件 → 原版 `pptx-preview@1.0.7` | 0 | Promise 成功，实际页面为空 |
| 原文件 → 资料库旧 HTML 入口 | 45 | 页数正确，但不代表表格等内容完整 |
| 原文件 → 资料库模型入口 | 45 | 464 个形状、653 个文本元素、9 个表格 |
| 模型 → `renderSlidesToHtml` | 45 | 需另做浏览器视觉验收 |
| 仅修悬空声明的临时副本 → 原版旧库 | 45 | 版式 1 份，页面 wrapper 45 个 |

主前端子模块与独立资料库工作区的解析器文件相同，上述资料库结果两边一致。归一化副本与原件的 ZIP 条目集合相同，内容变化只有 `[Content_Types].xml`。

## 三、首期实施方案

### 3.1 预览前检查与兼容处理

新增纯工具 `src/utils/pptxPackage.ts`，输入 `ArrayBuffer`，输出预览 buffer、期望页序与诊断信息。

处理规则：

1. 验证 ZIP / OOXML 类型，识别旧二进制 `.ppt`、损坏包、加密或不支持的包。
2. 从 `presentation.xml` 和关系表确定页面顺序、期望页数，检查内部关系目标；规范解析相对 Target，区分 External 关系。目标缺失的内部关系仍是有效的损坏证据，不能把它从引用集合中删掉。
3. 首期只处理本例对应的 `slideMaster` Override：**仅移除实体不存在、且未被内部关系或母版列表引用的冗余母版声明**，其他类型不自动删除。
4. 页面列表/母版列表断链、重复或丢失，或确实被引用的部件缺失，报告结构损坏；不能通过删声明把它伪装成修复成功。
5. 没有需要兼容的声明时返回原 buffer；需要处理时只生成内存中的预览副本，原件及下载内容保持原始 bytes。
6. 直接声明 `jszip` 依赖并锁定；不能依赖旧预览库的传递安装。

首期优先选择已通过本例验证的应用侧兼容工具，便于写结构测试、记录诊断，并减少对第三方压缩产物的耦合。`pnpm patch` 定点修库是性能更好的备选，不需要重新打包；但不能全局跳过缺失部件，需由同样的结构预检提供「缺失且未引用的母版」白名单，并让真正异常向外报告。

兼容处理仅在出现上述明确结构问题时重组 ZIP，并缓存本次结果。它会增加一次包读取/重组成本，必须用大文件验收后设定适用预算；不能每次 resize 都重复处理。

### 3.2 预览成功条件

在 `FilePreview` 的 PPTX 分支增加结果校验：

- 第三方 Promise resolve 只是过程完成，不能直接视为预览成功。
- 渲染页数必须与 `sldIdLst` 中的期望页数一致，且页面顺序一致。
- 期望有页面却输出 0 页：转为明确失败态，不显示成功空白容器。
- 缺页或局部不支持：显示诊断/部分预览状态；保留原页位置和页号，不悄悄跳过页面。
- 合法空白页应保留；不能仅因某页没有文本而判失败。
- 失败、超限、旧 `.ppt` 和部分预览状态持续提供原文件下载及重试。

现有 `pptxFallbackRenderer.ts` 没有调用，且未知页数默认写成 6；它不能作为可靠兜底。页数未知就显示未知。

### 3.3 文件加载与生命周期

新增服务层 loader `src/services/filePreview.ts`，首期仅接入 PPTX 分支：

- URL / Blob / File / ArrayBuffer 统一得到二进制数据。
- URL 复用 `getBusinessFileRequestAuth`，检查 `response.ok`，支持 AbortSignal 与显式刷新缓存策略。
- 请求代次贯穿下载、兼容处理、解析、挂载和回调；切换到 B 后，A 的成功或失败均不得覆盖 B。
- 实例创建后即可登记清理；加载中卸载也能释放资源。取消不显示为文件错误。
- 缓存限制在当前预览实例/会话；认证身份变化、文件版本变化、显式刷新时失效。
- 普通 resize 复用已加载 buffer，不新增下载；首期旧库若仍需重渲染，应记录成本。后续模型引擎完成只缩放、无需重解析。
- 将现有文件体积保护接入 Office 路径，补充 ZIP 条目、解压后字节和媒体解码预算；预算值由目标设备压测确定。

JSZip 的完整异步结果仍占内存，压缩文件大小不能直接当作内存占用上限；这是加入解压预算的依据。[JSZip 官方限制说明](https://stuk.github.io/jszip/documentation/limitations.html)

### 3.4 修正实际生成管线

生成/导出阶段应从实际写入的部件产生 `[Content_Types]`，并在产出前核验：

- Override 所指部件存在。
- 有效内部关系目标存在。
- 页面列表中的页面存在，顺序和页数一致。
- 共用一份母版时，只声明该母版，不能按页面数生成不存在的母版声明。

**实际生成本样本的代码位置尚未定位。** 当前资料库 `pptxWriter.ts` 只声明一份母版，没有证据证明它产生了这 44 个悬空声明。生成侧修复要根据真实管线落实；前端兼容层可独立先交付。

## 四、资料库引擎共享方案

作为第二阶段能力统一方案，采用 `parsePptxToModel` 作为唯一解析入口，抽取只读模型/几何/渲染模块。资料库和主前端消费同一固定版本，维护一份源码。

建议由资料库仓库维护共享模块，导出明确的预览 API，再由主前端按固定版本消费。初次接入可使用已固定 gitlink 的源码入口，后续发布共享包；应显式管理 exports 与依赖。不能复制两份文件后宣称已实现共享。

抽取前需要完成以下修正：

| 问题 | 已有依据 | 处理要求 |
| --- | --- | --- |
| HTML 属性注入 | 字体 typeface 的无害标记实验，两个 HTML 出口都可生成额外 DOM 属性 | 文本/样式使用 React 或 DOM 属性赋值；保留 HTML 时统一属性转义、CSS/URL 校验与 HTML/SVG 白名单 |
| 多文稿上下文串用 | `themeCtx` / `tblStyleEls` 为模块单例，加载过程包含 await | 改为每次解析独立上下文；验证不同主题的并发文件互不污染 |
| 缩放不一致 | 元素坐标为百分比，字号为固定 pt | 固定逻辑画布尺寸，整体按比例缩放；文本、形状、表格同步缩放 |
| 缺页静默忽略 | 缺 slide XML / spTree 时 continue | 返回原始页序、每页状态和 warnings；缺失页保留占位 |
| 大型文稿占用 | 全 ZIP / 模型 / HTML / 全页 DOM | 先挂载当前页与少量相邻页；限制缓存和资源预算，分批解析并允许取消 |
| 拆包依赖 | `pptx.ts` 与 `board.ts` 双向引用 | 分离几何和只读能力；按资料库实际消费导出，不引入编辑、协作和建页业务 |

DOMParser 解析出的内容并不自动安全；插入活动页面之前需要处理危险属性和元素。[MDN 安全说明](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#security_considerations)

当前能力边界：模型路径支持普通文本、图片、形状、组合、连接线和表格；原生 OOXML 图表、SmartArt、OLE、动画、旧 `.ppt` 不能视为已支持。EMF 只解出部分内嵌位图，真实 WMF 解码和完整字体/母版元素继承也有缺口。

复杂对象应显示可定位的兼容提示。若业务要求更完整的 Office 保真，再评估具备权限、缓存和字体管理的服务端转换。资料库现有 `slidePdf.ts` 只是对前端模型截图成 PDF，会继承解析缺失，不能当作独立保真兜底。

默认切换前用真实样本比较两种引擎。切换期间提供版本回滚开关，每次只运行所选引擎；样本验收和线上观察通过后再移除 `pptx-preview`。

## 五、改动边界与顺序

| 阶段 | 拟改范围 | 完成条件 |
| --- | --- | --- |
| 首期 1 | `src/utils/pptxPackage.ts` + 结构测试 + jszip 依赖/锁文件 | 原样本识别 45 页与 44 个冗余声明；原件不变；有效缺失部件不会被掩盖 |
| 首期 2 | `src/services/filePreview.ts` + FilePreview PPTX 分支与测试 + 必要 I18n 文案 | 两个入口恢复预览；HTTP/取消/切文件/重试/下载正确，0 页不会进入 success |
| 生成治理 | 实际生成管线的部件清单与输出校验 | 新生成文件无悬空部件声明；回归含一份/多份母版样本 |
| 共享引擎 | 资料库共享模块 + 主前端轻量适配器 | 模型路径、安全、上下文、缩放与诊断过门；真实浏览器比较通过 |
| 默认切换 | 固定引擎版本与回滚配置 | 验收通过再移除旧依赖与无调用的旧 fallback |

解析工具保持纯函数与浏览器解析依赖，不调用业务服务；HTTP 与鉴权放 services，React 展示放 business-component，遵守仓库分层约束。

## 六、验证和验收

### 已完成的证据

- 恢复会话原始问题和工具实验记录；核对当前主前端与子模块源码。
- 原文件 OOXML 页序/关系/部件检查。
- 原版旧库、临时诊断版、两份资料库解析器的 jsdom 复跑。
- 仅修声明的临时副本恢复 45 页，其他 ZIP 部件内容完全相同。
- 无害字体标记验证 HTML 属性跨界通路。

上述证据证明结构原因和解析输出；**尚未证明实际浏览器与桌面 WebView 中的视觉保真。**

### 实施后必须通过

1. 结构测试：本例、正常包、缺失有效关系目标、页序与文件名顺序不同、空白页、坏 ZIP、旧 `.ppt`、超预算。
2. 组件测试：URL / Blob / File / ArrayBuffer，403/404，A 慢 B 快，加载中卸载，取消，重试，0 页，部分预览，下载原件。
3. 刷新/resize：显式刷新重新加载；普通尺寸变化不新增网络请求；旧请求回调不覆盖新文件。
4. 源码门：目标 Vitest、`pnpm run lint:arch`、改动路径零新增类型错误。若触及会话硬约束路径，再跑完整 `test:conversation` 和对应 E2E。
5. 真实登录验收：文件树、工作区外文件、实际桌面 WebView；原问题文件、基础文稿、不同母版、表格、组合、图表、特殊字体、EMF、大文稿。
6. 视觉检查：确认 45 页页序；逐页检查关键内容，尤其本样本 9 个表格。用 PowerPoint/LibreOffice 输出作为对照，检查裁剪、字号、母版位置、颜色与缺对象。
7. 性能：测首次下载、首屏、解析/兼容耗时、resize 网络数和峰值内存，据此定资源预算。

根脚本 `build:dev` / `build:prod` 的 prebuild 会先升级微应用并可能更新/暂存 gitlink。正式实现验证应在已核对的隔离 checkout 中使用固定依赖和微应用版本，避免把本方案与上游升级混为一批。

## 七、回退

- 兼容处理通过配置开关回退；失败时转入可下载的明确状态，不重新接受 0 页为成功。
- 下载始终使用原件；不覆盖用户 PPTX。
- 共享引擎默认切换使用独立开关，固定版本可回滚；回退期保留首期的结构/页数校验和加载防护。
- 当前工作区已有其他 WIP，实施时建立本任务的可恢复提交边界，并按明确路径暂存。

## 依据位置与实验记录

- [FilePreview 当前 PPTX 分支](/Users/apple/workspace/nuwax/src/components/business-component/FilePreview/index.tsx:946)
- [资料库真实模型导入入口](/Users/apple/workspace/nuwax/submodules/nuwax-repo-web/src/components/PageTree.tsx:164)
- [旧 HTML 与模型解析 API](/Users/apple/workspace/nuwax/submodules/nuwax-repo-web/src/lib/pptx.ts:1014)
- [模型表格解析](/Users/apple/workspace/nuwax/submodules/nuwax-repo-web/src/lib/pptx.ts:2149)
- [字体 HTML 序列化](/Users/apple/workspace/nuwax/submodules/nuwax-repo-web/src/lib/pptx.ts:2962)
- [文件业务鉴权策略](/Users/apple/workspace/nuwax/src/utils/businessAuth.ts:121)
- [现有降级工具](/Users/apple/workspace/nuwax/src/utils/pptxFallbackRenderer.ts:27)
- [资料库前端 PDF 导出](/Users/apple/workspace/nuwax/submodules/nuwax-repo-web/src/lib/slidePdf.ts:1)
- [原文件离线复跑日志](/tmp/pptx-audit-20260929-lq4cejyo/run.stdout.log)
- [归一化副本离线复跑日志](/tmp/pptx-audit-20260929-lq4cejyo/normalization.stdout.log)

实验日志位于本机临时目录；关键事实和结果已收录在本方案，后续实施应将回归样本和验证逻辑纳入正式测试。
