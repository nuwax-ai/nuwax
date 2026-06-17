# 决策记录

## 2026-03-30

### D-001 首屏词典加载

- 决策：在 `getInitialState` 中先执行 `initI18n()`
- 原因：确保核心页面渲染前已有可用词典
- 影响：首次加载会多一次 i18n 查询请求

### D-002 语言切换生效策略

- 决策：语言保存成功后整页刷新
- 原因：符合“前端无感”，避免引入运行时全局状态切换复杂度
- 影响：切换时会触发一次页面重载

### D-003 语言保存接口过渡方案

- 决策：`saveUserLang(lang)` 单点适配，当前复用 `apiUserUpdate`
- 原因：后端专用接口未交付，需保证 SAAS 计划可落地
- 影响：专用接口上线后仅替换 service 层实现

### D-004 词典失败兜底

- 决策：缓存优先，其次英文最小词典
- 原因：保证接口异常时页面可用
- 影响：极端情况下文案将回退到英文

### D-005 接口返回结构兼容

- 决策：i18n 查询与语言列表读取同时兼容 `直接数据` 与 `ReqResult.data` 两种结构
- 原因：当前代码中接口消费模式存在混用，先做运行时兼容降低联调风险
- 影响：后端结构统一后可收敛为单一解析逻辑

### D-006 多语言管理页面首版范围

- 决策：先落地查询列表页并接入系统配置路由，增删改接口留待后续补齐
- 原因：当前输入仅确认了查询接口，管理侧新增/修改接口未完全确定
- 影响：可先满足菜单入口和可视化查询，后续迭代 CRUD

### D-007 存量页面覆盖策略（关键）

- 决策：新增“运行时自动翻译兜底层”，用于覆盖尚未逐页改造的页面/组件
- 原因：用户反馈大量存量页面未完成 `dict(key)` 接入，需要短期提升覆盖率
- 影响：
  - 优点：无需逐文件改造即可提升英文界面可见覆盖
  - 风险：可能出现少量误替换，已通过忽略选择器降低风险，后续继续优化

### D-008 key 命名规范（一次性切换）

- 决策：统一采用 `{Client}.{Scope}.{Domain}.{key}`，并将既有 `System.*` 一次性切换为 `PC.*`
- 原因：避免双轨长期并存，减少后续维护与联调成本
- 影响：
  - 前端 `dict()` 与最小词典均按新规范维护
  - 后端词典需同步产出新 key，旧 key 不再作为正式兼容路径

### D-009 运行时 legacy key 处理策略

- 决策：`dict()` 不再翻译 `System.*`，仅记录日志并原样返回
- 原因：强约束团队停止新增/依赖旧 key
- 影响：联调期间若后端仍返回 `System.*`，界面会暴露 key 并出现日志，便于快速定位整改

### D-010 i18n 治理守门

- 决策：增量门禁增加三条规则：禁止新增硬编码中文、禁止新增 `System.*`、校验 `dict` key 格式
- 原因：避免方案落地后再次回流不合规代码
- 影响：门禁失败会阻断提交，需要先修复 i18n 规范问题

### D-011 全量扫描留痕

- 决策：新增全量扫描脚本，按模块产出 inventory 报告
- 原因：存量页面规模大，需要量化治理基线并用于分批排期
- 影响：每轮改造后可重复执行并对比问题总量变化

### D-012 本地中英文默认词典文件化

- 决策：将前端默认词典拆分为本地 `en-us/zh-cn` 两套文件，并作为运行时正式兜底源
- 原因：用户明确要求“本地要有对应的中英文语言文件作为默认”
- 影响：
  - 词典维护从“常量内联”转为“语言文件可管理”
  - 后端接口失败时，前端可按当前语言落到对应本地词典

### D-013 平台维护导入默认源

- 决策：统一导出 `I18N_IMPORT_DEFAULTS` 与服务层读取函数（`getI18nImportDefaults/getI18nImportDefaultMap`）
- 原因：满足“也作为多语言平台维护导入默认”的需求，避免后续重复造源
- 影响：
  - 平台导入能力实现时可直接复用现有默认词典
  - 导入数据源与运行时兜底源保持一致，降低语义偏差

### D-014 词典缓存按语言隔离

- 决策：新增缓存语言标识 `LANG_MAP_CACHE_LANG`，读取缓存时按当前语言匹配
- 原因：避免语言切换后误用旧语言缓存，导致文案串语言
- 影响：启动阶段缓存命中更准确，极端情况下回退更稳定

### D-015 翻译函数命名收敛为 `t`

- 决策：新增 `t()` 作为标准翻译调用入口，`dict()` 保留兼容
- 原因：统一调用习惯，降低业务代码阅读和迁移成本
- 影响：
  - 新改造代码统一使用 `t(...)`
  - 存量 `dict(...)` 后续按批次逐步收敛，不做一次性大改

### D-016 Antv 特殊分支文案兼容

- 决策：`commonNode` 中“兜底分支提示文案”判定使用双条件：`t(newKey)` + 既有中文字面量（Unicode 形式）兼容
- 原因：历史流程数据中已落库中文文案，直接切换为新 key 文案可能导致判定失效
- 影响：
  - 旧数据与新数据均可识别
  - 后续可在数据迁移完成后移除中文兼容判断

### D-017 选项常量本地化收敛策略（EditAgent）

- 决策：在 `EditAgent` 组件侧对 `CALL_METHOD_OPTIONS/OUTPUT_WAY_OPTIONS/BIND_CARD_STYLE_LIST/AGENT_VARIABLES_INPUT_OPTIONS` 进行本地 `t(...)` 映射，不直接消费常量内中文字面量
- 原因：常量层仍有存量中文，直接透传会导致页面仍显示未翻译文案并增加批量改造耦合
- 影响：
  - 页面可先完成多语言接入，且不阻塞后续常量层统一改造
  - 后续常量层完成多语言后，可回收组件内映射逻辑，降低重复定义

### D-018 变量输入类型 key 复用策略

- 决策：`CreateVariables/index.tsx` 与 `CreateVariableModal/index.tsx` 统一复用 `PC.Pages.AgentArrangeCreateVariableModal.inputType*` 一组 key
- 原因：两处展示的是同一业务枚举（`InputTypeEnum`），分裂 key 会增加维护与联调成本
- 影响：
  - 词典维护单源化，新增输入类型时只需补一组 key
  - 列表页与弹窗文案保持一致，避免术语漂移

### D-019 引导问题与事件绑定参数区文案分域

- 决策：`GuidQuestionSetModal` 与 `EventBindModal` 保持独立 Domain key（分别使用 `AgentArrangeGuidQuestionSetModal` / `AgentArrangeEventBindModal`），不强制复用同一组 key
- 原因：两者语义相近但业务上下文不同，后续可能出现差异化提示与校验文案
- 影响：
  - 允许后续按场景独立演进文案，不引入跨模块联动风险
  - 维护成本略增，但通过统一命名规则降低检索成本

### D-020 页面设置动作标签不依赖常量文本

- 决策：`PageSettingModal` 左侧动作标签改为按 `PageSettingEnum` 映射 `t(...)`，不直接渲染 `PAGE_SETTING_ACTIONS.label`
- 原因：`PAGE_SETTING_ACTIONS` 仍为中文常量，直接消费会导致页面多语言漏接
- 影响：
  - UI 文案统一可翻译
  - 常量层后续 i18n 改造可独立进行，不阻塞页面层

### D-021 事件插入模板文案 key 化

- 决策：`AgentArrangeConfig/index.tsx` 中“插入系统提示词”拼接模板里的中文片段统一改为 i18n key（含动态参数占位）
- 原因：该模板会直接写入用户可见内容，硬编码中文会导致英文环境下体验断层
- 影响：
  - 系统提示词插入内容可随语言切换保持一致
  - 模板可维护性提升，后续修改无需改代码字符串

### D-022 分类管理类型标签本地化策略

- 决策：`CategoryManage` 不直接依赖 `segmentedOptions` 静态中文文案，改为运行时 `t(...)` 生成标签并透传给弹窗
- 原因：分类标签会被页面标题、弹窗标题、成功提示复用，若保留中文常量会造成多语言链路断点
- 影响：
  - “类型标签 -> 标题/提示”链路全程可翻译
  - 后续新增分类类型时，只需补一组 key 即可复用

### D-023 沙盒状态动作文案参数化

- 决策：`SandboxConfig` 启用/停用相关提示统一使用参数化 key（`{0}` 动作词，`{1}` 资源名）
- 原因：减少重复 key 与重复字符串拼接，保持启停流程文案一致
- 影响：
  - 变更动作词时只需调整单个动作 key
  - 中英文模板结构统一，便于后续扩展更多动作

### D-024 绑定用户弹窗左右搜索分键

- 决策：`BindUser` 左侧“检索用户”与右侧“检索已绑定用户”使用独立 key，不合并为通用搜索 placeholder
- 原因：两侧语义与数据源不同（左侧全量搜索，右侧已绑定范围搜索），后续文案可能独立演进
- 影响：
  - 文案更精确，避免误导用户搜索范围
  - 后续调整一侧提示不会影响另一侧

### D-025 MenuPermission 模态分域命名

- 决策：`MenuPermission` 下 `DataPermissionModal` 与 `MenuPermissionModal` 使用独立 Domain（`SystemMenuDataPermissionModal` / `SystemMenuPermissionModal`）
- 原因：两个弹层职责不同（数据授权 vs 菜单授权），共享同域会导致 key 膨胀与语义混淆
- 影响：
  - key 检索与联调更直观，便于按弹层拆分排查
  - 后续继续扩展任一弹层文案时，不会影响另一弹层 key 结构

### D-026 Antv-X6 v3 布局文案复用策略

- 决策：`Antv-X6 v3` 布局层优先复用已有 `AntvX6ControlPanel`、`AntvX6ErrorList`、`AntvX6Stencil` key，仅为 Header 增补缺失的状态/操作 key
- 原因：v2/v3 在缩放、错误面板、节点选择等文案语义一致，复用可减少重复词条与翻译维护成本
- 影响：
  - 词典规模增长可控，跨版本术语一致
  - Header 场景新增的“保存失败/重试/快捷键提示”保持独立 key，避免污染通用 key 语义

### D-027 Antv 运行态文案分层复用

- 决策：`registerCustomNodes` 复用 `AntvX6RegisterNodes.*` 现有 key，`runResult` 新增独立 `AntvX6RunResult.*` key 承载分页/筛选/批变量文案
- 原因：节点配置文案与运行结果面板语义不同，强行复用会造成 key 命名不清晰和后续扩展冲突
- 影响：
  - 节点运行态标题（运行中/成功/失败/请答复问题）保持单一来源
  - 运行结果面板可独立扩展“总数/筛选/批处理”而不影响节点配置域

### D-028 Antv Library 文案优先复用

- 决策：`library/pluginNode` 优先复用现有 `AntvX6Library.*`、`AntvX6Data.*`、`AntvX6RegisterNodes.input` key，不新增重复语义 key
- 原因：这些文案在 v2/v3 与不同节点组件中语义一致，新增并行 key 会增加词典冗余和维护成本
- 影响：
  - 词典增量最小化，降低翻译同步成本
  - 相同术语在不同节点面板保持一致表达

### D-029 Antv 常量映射统一 key 化

- 决策：`node.constants.ts` 中所有用户可见 label 映射（分支类型、异常处理、重试次数、回答类型、变量配置类型）统一改为 `t(...)`
- 原因：常量层是多个节点组件共享入口，若保留中文硬编码会在不同页面重复泄漏未接入文案
- 影响：
  - 常量驱动的 UI 文案能够与页面层保持同一翻译链路
  - 后续新增节点类型只需在 key 与词典层补齐，不再新增中文字面量

### D-030 Antv 自动保存日志语言策略

- 决策：`useAutoSave.ts` 日志输出统一使用英文，版本冲突用户提示使用 i18n key 输出
- 原因：日志文本需要统一英文，且版本冲突提示属于用户可感知错误信息，需可翻译
- 影响：
  - 控制台日志更符合全局日志规范
  - 冲突提示在中英文环境下均可读且语义一致

### D-031 图编辑生命周期日志统一为英文

- 决策：`useBeforeUnload.ts` 与 `GraphContainer.tsx` 的保存/建边相关日志统一改为英文描述
- 原因：这两处日志在联调和问题排查中出现频率高，需要与系统日志规范保持一致
- 影响：
  - 调试输出语义统一，便于跨团队排查
  - 不改变业务行为，仅调整日志文本语言

### D-032 Antv Hook 维护注释统一英文

- 决策：`useBeforeUnload.ts` 的文件头说明、接口注释和关键逻辑注释统一改为英文
- 原因：该模块处于高频联调区域，注释语言应与日志和工程规范一致，避免中英混杂
- 影响：
  - 提升跨团队阅读一致性，不影响运行逻辑
  - 后续同类 hook 改造可复用该注释规范

### D-033 Antv 持久化与历史提示统一 key 化

- 决策：`useNodeOperations`、`useWorkflowHistory`、`useWorkflowPersistence` 的用户可见提示统一切换为 `t(...)`，并由 `PC.Pages.AntvX6NodeOperations.* / AntvX6History.* / AntvX6Persistence.*` 承载
- 原因：这些 Hook 中存在高频操作提示（新增/复制/删除失败、撤销/重做不可用、版本冲突确认），若保留硬编码会持续在多语言扫描中反复出现
- 影响：
  - 节点操作、历史操作、冲突弹窗链路进入统一词典管理
  - 后端联调时只需补齐同名 key，不需要页面侧再写临时兼容文案

### D-034 AppDev 聊天与日志组件统一 `t(...)`

- 决策：`useAppDevChat`、`PlanProcess`、`DevLogConsole` 统一使用 `t(...)`，并新增 `AppDevChat/AppDevDevLogConsole` 域 key，不再新增 `dict(...)` 调用
- 原因：AppDev 是当前存量热点模块，且用户明确要求统一 `t(...)` 规范；聊天链路和日志面板属于高频可见文本，必须优先 key 化
- 影响：
  - 聊天错误处理、停止服务确认、日志面板文案进入统一词典管理
  - 后续 AppDev 页面接入可沿用同域 key，避免散落在 `Common` 或临时域

### D-035 ThemeConfig 联动提示参数化

- 决策：`SystemThemeConfig` 中“自动切换深浅色导航栏/背景匹配”提示改为参数化 key（`{0}` 模式，`{1}` 导航模式）
- 原因：该页面存在多处模板字符串拼接中文，后续若扩展为英文或新增主题模式会造成重复逻辑和翻译风险
- 影响：
  - 联动提示逻辑与文案解耦，后续新增模式仅补词典
  - 页面层避免继续拼接硬编码文本，符合 `t(...)` 单点输出规范

### D-036 TaskManage 状态映射集中化

- 决策：`CenterProTable` 的任务状态文案与操作文案统一归到 `SystemTaskCenterProTable` 域，不在状态分支和列定义中保留中文字面量
- 原因：状态映射与表头/操作项分散在同一文件，之前每次新增状态或按钮都可能漏掉多语言接入
- 影响：
  - 状态映射、表头、操作、确认提示都可统一从词典维护
  - 后续 `CreateTimedTask` 可复用同域 key，减少词典分散

### D-037 SystemConfig 页面与表单拆分域

- 决策：`SystemConfig/index` 与 `BaseFormItem` 分别使用 `SystemConfig`、`SystemConfigBaseFormItem` 域管理 key
- 原因：页面级标题/提交提示与表单校验提示职责不同，分域能避免后续在同域中混杂页面与字段规则文案
- 影响：
  - 页面和表单文案维护边界清晰，后续新增校验规则无需污染页面域
  - 词典定位更直接，便于联调排查

### D-038 SpaceTaskCenter 定时任务页面独立域

- 决策：`SpaceTaskCenter/CreateTimedTask` 及其子组件统一归并到 `SpaceTaskCreateTimedTask` 与相关组件域，不复用 `SystemTaskCenterProTable` 文案域
- 原因：任务列表页和任务创建页语义重叠但交互不同（表单校验、提示文案、开关文案），强行复用会导致 key 语义不清晰
- 影响：
  - 创建/更新弹窗链路文案可独立扩展，不影响列表页词典
  - 后续移动端或其他入口复用创建弹窗时可直接复用同域 key

### D-039 AppDev 文件树菜单域拆分

- 决策：`AppDev` 文件树区域采用 `AppDevFileTreePanel`（面板态文案）与 `AppDevFileTreeContextMenu`（右键菜单文案）双域命名
- 原因：面板态（加载、展开、空态按钮）与菜单态（重命名、上传、删除）职责不同，拆分域可以避免后续 key 语义混杂
- 影响：
  - 文件树接入范围更清晰，后续新增菜单项无需污染面板域
  - 词典检索与治理报告定位更直接

### D-040 System Task CreateTimedTask 域独立与 `t(...)` 统一

- 决策：`SystemManagement/TaskManage/CreateTimedTask` 及子组件统一使用 `SystemTaskCreateTimedTask`、`SystemTaskSelectTarget`、`SystemTaskSelectTargetFormItem`、`SystemTaskSelectTargetFormItemTarget`、`SystemTaskTimedPeriodSelector` 域，且组件内统一改为 `t(...)`
- 原因：系统任务创建链路与空间任务创建链路语义相近但场景不同，需要独立域防止后续页面扩展时 key 语义混用；同时用户已明确要求停止新增 `dict(...)`
- 影响：
  - 系统任务创建弹窗文案独立维护，后续联调可按系统侧域补词典
  - `SelectTargetFormItem` 的 `dict(...)` 存量被消除，保持调用规范一致

### D-041 Created 列表子组件按组件域拆分

- 决策：`Created` 组件下首批子组件采用 `PC.Components.CreatedMcpItem.*`、`CreatedMcpTools.*`、`CreatedPageItem.*` 三个域，不放入 `Pages` 域
- 原因：这批组件是跨页面复用的通用构件，按组件域命名更符合 `{Client}.{Scope}.{Domain}.{key}` 规范，也便于后续在不同页面复用
- 影响：
  - `Created` 复用链路（组件库/页面库）的基础文案进入统一词典
  - 后续处理 `Created/index.tsx` 可继续沿用同前缀，避免 key 分散

### D-042 Created 标签名由类型映射驱动

- 决策：`Created/index.tsx` 不再直接依赖 `CREATED_TABS` 的 `label` 字面量展示文案，统一通过 `getCreatedTabLabel(type)` 映射到 `PC.Components.Created.tab*`
- 原因：`CREATED_TABS` 常量中存在历史中文标签，若直接渲染会导致英文环境无法生效；按类型映射可在不改全局常量的前提下先完成组件侧多语言接入
- 影响：
  - 分段标签、动态模板文案（如“创建{0}”“仅查看官方{0}”）可在中英文间稳定切换
  - 后续若常量层再改造为 key 模式，组件层可平滑收敛

### D-043 ChatInputHome 组件按子域拆分接入

- 决策：`ChatInputHome` 按子组件域接入：`ChatInputHomeAtMentionIcon`、`ChatInputHomeManualComponentItem`、`ChatInputHomeMentionPopup`、`ChatInputHome`
- 原因：输入区包含多个可复用子模块（@ 提及弹窗、手动组件选择、主输入区提示），统一放在单域会导致 key 语义混杂
- 影响：
  - @ 提及链路、上传提示、会话按钮提示可独立扩展
  - 词典检索与回归定位更直接

### D-044 ManualComponentItem 关键词匹配双语兜底

- 决策：`ManualComponentItem` 图标识别不再写死中文关键词，改为 `t(...)` 当前语言关键词 + 英文关键词兜底
- 原因：组件名称/描述可能随语言变化，单语匹配会导致图标识别失效
- 影响：
  - 在中英文环境下都可识别网络/思考类组件
  - 避免继续引入中文硬编码常量

### D-045 MentionEditor 默认占位符分场景 key 化

- 决策：`MentionEditor` 默认占位符拆分为 `placeholderWithMention` 与 `placeholderWithoutMention` 两个 key
- 原因：启用 @ 提及时占位符包含额外引导语，禁用时应避免误导用户
- 影响：
  - 占位符语义在中英文环境下保持一致
  - 后续调整引导文案只需更新词典，不改组件逻辑

### D-046 SkillDetails 按页面子域拆分

- 决策：`SkillDetails` 相关文案按 `SkillDetailsMoreActionsMenu`、`SkillDetailsHeader`、`SkillDetails` 三个页面子域管理
- 原因：同一页面中“顶部操作菜单”“头部状态”“页面流程提示”职责不同，分域可避免 key 混杂
- 影响：
  - 词典定位与联调排查更快
  - 后续继续改造 `SkillDetails/index.tsx` 剩余分支时可复用同域规范

### D-047 SkillDetails 日志文本统一英文

- 决策：`SkillDetails/index.tsx` 中保存、导入、上传、导出、删除相关 `console.error` 文本统一英文
- 原因：日志规范要求英文输出，且便于跨团队排查
- 影响：
  - 不改变业务逻辑，仅改善日志可读性与一致性
  - 避免日志文本被 i18n 治理脚本重复命中

### D-048 ApiKey 弹窗按页面域拆分

- 决策：`MorePage/ApiKey` 文案按 `ApiKeyFormModal`、`ApiKeyStatsModal` 两个页面域管理
- 原因：创建/编辑弹窗与统计弹窗语义差异较大，拆分域可降低 key 冲突
- 影响：
  - 后续 `ApiKeyLogs` 可继续独立域接入，不与当前弹窗域混用
  - 词典维护粒度更清晰

### D-049 API Key 过期时间回显去文案耦合

- 决策：`ApiKeyFormModal` 不再用中文文案“永不过期”参与逻辑判断，改为仅校验时间字符串有效性与零时间哨兵值
- 原因：业务判断依赖文案会导致多语言下逻辑不稳定
- 影响：
  - 回显逻辑与展示文案解耦，降低语言切换风险
  - 减少中文硬编码在逻辑层的残留

### D-050 ApiKeyLogs 查询表单与结果表头统一 key 化

- 决策：`ApiKeyLogs/LogProTable` 的筛选项、列头、操作文案统一归并到 `ApiKeyLogsLogProTable` 域
- 原因：该文件包含高密度的查询字段和表格列配置，若不集中域管理，后续扩展容易遗漏多语言接入
- 影响：
  - 查询条件与表格展示文案保持同一词典来源
  - 后续新增筛选项可沿用同域规范，降低遗漏风险

### D-051 ApiKeyLogs 历史注释代码清理

- 决策：删除 `LogProTable` 中注释掉且包含中文提示的 `userId` 旧筛选代码块
- 原因：该代码块已停用且被治理脚本识别为中文存量，继续保留会干扰治理结果
- 影响：
  - 降低噪声，避免无效存量反复出现
  - 不影响现有功能路径

### D-052 Chat 文件操作提示集中到 Pages.Chat 域

- 决策：`Chat/index.tsx` 文件操作与导出链路文案统一使用 `PC.Pages.Chat.*`
- 原因：该页面包含大量文件树交互提示，分散在函数内难以维护，集中域有助于后续批量替换
- 影响：
  - 新建/删除/上传/导出的提示统一可配置
  - 顶部导航 tooltip 也进入同域，便于 QA 回归

### D-053 路由菜单名先英文收敛

- 决策：`routes/index.ts` 中 `api-key-logs` 菜单名先改为英文 `API Call Logs`
- 原因：路由配置层暂未接入统一 `t(...)`，先移除中文硬编码以减少治理存量
- 影响：
  - 不影响路由行为，仅变更菜单展示文本
  - 后续可在路由层统一 i18n 方案时再迁移为 key

### D-054 Chat 控制条与运行态提示归并到 Pages.Chat 域

- 决策：`Chat/index.tsx` 顶部控制条与运行态提示文案统一使用 `PC.Pages.Chat.*` key，包括预览页、文件预览、智能体电脑、历史加载、执行中、权限遮罩、复制模板
- 原因：该页面交互入口密集且跨多个条件分支，若不统一域管理，后续批量治理容易遗漏
- 影响：
  - 交互提示文案集中在同一词典域，联调与补词效率更高
  - 页面内剩余中文存量可按同域继续增量替换，避免新增散点硬编码

### D-055 AppDev 工具层中文引号文本统一英文化

- 决策：`AppDev` 的非 UI 运行日志、错误上下文模板、注释示例中的中文引号文本统一改为英文；UI 入口继续使用 `t(...)` key
- 原因：治理脚本按“引号内中文”统计，工具层历史文本会持续占用存量并掩盖真实 UI 漏接入
- 影响：
  - `src/pages/AppDev` 模块存量从 `44` 直接归零
  - 同时保留用户可见文案的 key 化方向（如 `uploadSizeLimitExceeded` 与 `AppDevDesignViewerTextAlign.*`）

### D-056 Antv-X6 先清治理存量再做 UI key 化补齐

- 决策：`Antv-X6` 本批优先将服务层/工具层/测试层的中文引号文本统一改为英文，先把治理存量清零；界面层后续继续按 key 模式补齐
- 原因：`Antv-X6` 是单模块最高存量（126），其中大量命中来自日志、默认文案与测试断言文本，先清理可快速降低全局噪声
- 影响：
  - `src/pages/Antv-X6` 模块从 `126` 下降至 `0`
  - 后续可以把精力集中到 `hooks`、`services`、`components/business-component` 等更高残留模块

### D-057 Hooks 先去中文命中、再补全 key 化

- 决策：对 `useAppDev*` 系列 hooks 先统一英文化消息文本与日志文本，优先降低治理存量；下一阶段再按页面域补齐 `t(...)` key
- 原因：hooks 层遗留文本多且分散，先批量清理可快速降低噪声并减少后续扫描干扰
- 影响：
  - `src/hooks` 从 `167` 下降到 `109`
  - 保留后续把用户可见提示迁移到 key 体系的空间，不阻断当前批量推进节奏

### D-058 Services 采用“先去中文命中”分层推进

- 决策：`services` 层先按子模块批量清理中文引号文本，优先移除通用服务与 AppDev 相关服务存量，再集中处理 `ecosystem.ts`
- 原因：`ecosystem.ts` 体量大且业务耦合高，先清外围可快速降低总量并减少后续联调噪声
- 影响：
  - `src/services` 从 `110` 下降到 `82`
  - 下一轮可将改造范围聚焦到单文件 `src/services/ecosystem.ts`

### D-059 ecosystem.ts 采用脚本化替换 + 人工二次校对

- 决策：对 `src/services/ecosystem.ts` 使用脚本化批量替换字符串，再用人工补丁修正残留混合文本
- 原因：单文件命中量高（82），逐条手改效率低且易遗漏；脚本可快速收敛，人工校对可控风险
- 影响：
  - `src/services` 模块全部清零并从报告模块统计中消失
  - 该模式可复用于后续超大单文件（先脚本粗清，再人工校正）

### D-060 AppDevEmptyState 作为组件域样板先全量 key 化

- 决策：将 `AppDevEmptyState` 的默认 UI 文案一次性迁移到 `PC.Components.AppDevEmptyState.*`，组件内部默认值统一调用 `t(...)`
- 原因：该组件被 `AppDev` 多处页面复用，是 `business-component` 的高频入口，先做样板可放大覆盖面并统一后续调用习惯
- 影响：
  - 组件默认文案不再含硬编码中文，支持后端词典和本地默认词典双路径
  - 同步补齐中英文本地默认词典 key，满足“本地可导入、可兜底”的平台基线要求

### D-061 历史会话与页面预览统一归并 Components 域

- 决策：`HistoryConversationList` 与 `PagePreviewIframe` 的用户可见文案统一迁移到 `PC.Components.*` 域；内部日志文本统一英文
- 原因：两个组件分别承担会话管理与页面预览核心交互，且都存在历史中文硬编码与兜底文本，容易在跨页面复用时遗漏
- 影响：
  - 历史会话重命名/删除流、页面预览工具栏文案可由词典统一维护
  - 内部日志文本去中文后，治理扫描更聚焦“真实 UI 漏接入”而非调试噪声

### D-062 VNC 组件组采用“UI key 化 + 日志英文化”双轨治理

- 决策：`VncPreview` 及其子组件 `IdleWarningModal` 的用户文案全部接入 `t(...)`；`useUrlRetry` 与空闲检测日志统一改英文，不进入词典
- 原因：该组文件既有用户可见文案，也有高频调试日志。若全部进词典会引入低价值 key，若全部英文会损失 UI 多语言能力
- 影响：
  - 用户侧连接状态、错误提示、空闲提醒可统一多语言管理
  - 开发侧日志文本稳定英文，减少治理扫描噪声与维护成本

### D-063 FilePreview 错误映射集中 key 化

- 决策：`FilePreview` 中 `getLocalizedErrorMessage` 返回值全部迁移到 `PC.Components.FilePreview.*`，并同步覆盖页面态文案（空/载入/失败/不支持）
- 原因：该函数是文件预览错误提示的集中出口，不统一 key 化会导致多个文件类型分支持续漏接入
- 影响：
  - 文档/表格/PDF/PPT/图片与通用错误提示都可由词典统一管理
  - 页面态文案和错误态文案来源一致，便于后续联调与翻译补齐

### D-064 ThemeConfig 与 ConversationDetails 使用 Components 域分拆

- 决策：将 `ThemeConfig` 子面板按组件名拆分为独立域（`ThemeConfigNavigationStylePanel` / `ThemeConfigBackgroundImagePanel` / `ThemeConfigThemeColorPanel`），`ConversationDetails` 保持单域聚合
- 原因：主题配置面板可独立复用，拆分域有利于后续抽离；`ConversationDetails` 文案集中于单页面交互，聚合更利于维护
- 影响：
  - 既避免单域过大，也避免细碎 key 难追踪
  - 该策略可复用于其他“页面容器 + 可复用子面板”的组件体系

### D-065 hooks 返回消息统一纳入 Components 域

- 决策：`useDataResourceManagement` 的 `message.*` 与 `DataResourceOperationResult.message` 统一使用 `PC.Components.DataResourceManagement.*`
- 原因：该 Hook 既触发 UI 提示又向上游返回 message，若两套文本来源不同会导致展示不一致
- 影响：
  - 页面提示与上层结果处理读取同一词典来源，减少语义分叉
  - 后续替换真实 API 时可以复用同一 key，不需要重复改造文案层
