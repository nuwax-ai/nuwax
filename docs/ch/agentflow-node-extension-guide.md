# AgentFlow 节点扩展维护入口

本指南描述当前前端源码的扩展入口，不代表后端新增节点协议。既有 Agent、RouteDecision、HumanInteraction 已作为定义迁移样本；其余 Workflow 节点继续使用原配置工厂。

## 职责与落点

| 内容 | 维护位置 | 约束 |
| --- | --- | --- |
| 节点类型及配置字段 | `src/types/enums/common.ts`、`src/types/interfaces/node.ts` | 先确认后端能接受的类型与字段 |
| 调色板、默认名/配置、flowKinds/顺序、外观资源、可选后端类型 | `src/pages/Antv-X6/v3/config/nodeDefinitions.ts` | 纯数据与配置构造函数；不导入 React、表单或 API |
| 属性表单组件 | `src/pages/Antv-X6/v3/config/NodeRegistry.tsx` | UI 层注册；面板 map 自身决定是否存在 |
| 分支端口、连接增删、配置同步、重载边生成 | `src/pages/Antv-X6/v3/extensions/types.ts` 与 `agentFlow/handlers/*` | 通过 BranchNodeHandler 扩展；普通路径继续回落 |
| 分支 handler 注册 | `src/pages/Antv-X6/v3/agentFlow/register.ts` | AgentFlowCanvas 模块加载时完成幂等注册，早于子树首次 render；handler 单测显式注册并隔离状态 |
| 节点配置写入表单 | `src/pages/Antv-X6/v3/utils/nodeConfigForm.ts` | 集中适配 AntD 对不透明字段的类型差异；保留单次原生 `setFieldsValue` 的合并与校验语义 |

ParamsV3、flowKindConfig、nodeDefaultConfigFactory、nodeTypeMapping 与画布展示层消费同一份定义。新增已支持类型的元信息不再同时复制到这些消费者中。新的 SVG React 组件仍由画布展示层绑定纯资源键。

## 默认配置与流程兼容

`createDefaultConfig()` 每次创建新的可变配置，不能把某个节点实例的分支、输出参数或异常配置写回静态定义。调色板创建配置与离线默认配置可有不同职责：HumanInteraction 的调色板附带 Ask 模式，离线工厂仍保留既有默认字段。

RouteDecision 的后端类型为 IntentRecognition，HumanInteraction 为 QA；入参还原依赖 AgentFlow 上下文，普通 Workflow 保持后端类型。定义中的 `backendType` 只集中既有映射，不替代问答/路由配置的协议适配。

## 分支保存与重载

`WorkflowSaveService.buildPayload()` 从画布边重建连接，再序列化为后端数据；`workflowProxyV3.syncFromGraph()` 也用于历史恢复及保存回退。新增分支应同时验证这两条路径。

handler 的 `generateEdges()` 返回数组表示本节点的普通连线已处理（包括空数组），返回 `null` 或未提供方法表示继续普通 `nextNodeIds` 路径。目标有效性检查、去重和异常边仍由图工具管理。RouteDecision 保持专用路径；HumanInteraction 没有实际选项分支边时保留普通回落。

端口 UUID、完整 `-out` 后缀、OTHER 分支与历史 `route-default-out` 都是兼容边界。当前保存格式不持久化 X6 edge id，重载重新分配 id。新增协议或数据迁移须独立明确范围。

画布引用沿用 `GraphContainerRef.getGraphRef()`。AgentFlow 自动布局由 `WorkflowLayout` 转发到现有 `ControlPanel`；内置 Header 仍隐藏，避免与外部编辑页的顶部栏重复。入口回归使用真实 Layout/Header/ControlPanel，覆盖嵌入、全屏及普通 Workflow 不出现此按钮；隔离图 DOM 不应替换工具栏。

自动布局后的坐标由 `WorkflowSaveService.buildPayload()` 写入 `nodeConfig.extension`。位置实际变化时，必须同步代理的待保存状态并接到既有防抖保存链，才能同时覆盖自动保存和立即离页。调整布局入口时验证实际按钮 → 脏状态 → 保存请求及坐标、离页前保存，以及重复布局无变化时不重复保存；仅手工调用 `buildPayload()` 不足以证明保存会触发。代理 `getEdges()` 返回深拷贝的 `EdgeV3[]`，不要改成丢失源/目标端口字段的基础边类型。

节点表单填充统一通过 `setNodeConfigFieldsValue()`。`contextParams` 与 `askConfig` 的任意值需要保留到保存数据；不要删字段、补上遗漏字段的 `undefined`、序列化配置或拆成逐字段写入来消除第三方类型错误。适配器仅处理这两个字段的库声明差异，其余配置字段继续接受静态类型检查。

## 验证入口

节点测试先用满足实际契约的完整夹具，使用真实枚举、模型 ID 与分支条件字段。既有 legacy 字段可用测试局部精确类型表达；有意验证缺 UUID、缺配置、字符串节点 ID 或未知端口的数据时，注明异常并明确引入，不改变生产接口。异常用例要保留能区分普通回落的输入与断言，例如缺配置时仍携带已有 `nextNodeIds`。

对透传字段或测试观察字段使用始终执行的断言，字段缺失必须失败；不要通过条件守卫跳过断言。每次夹具类型清理都核对原有用例标题与行为覆盖，再执行类型门。

```sh
pnpm exec vitest run src/pages/Antv-X6/v3/config/__tests__ src/pages/Antv-X6/v3/agentFlow src/pages/Antv-X6/v3/extensions src/pages/Antv-X6/v3/flowKind src/pages/Antv-X6/v3/services/__tests__ tests/agentFlowCanvas.registration.test.tsx tests/workflowSaveService.test.ts tests/workflowNodeOperations.test.ts
pnpm run lint:arch
pnpm typecheck:nodes
```

回归须覆盖默认配置实例隔离、palette/flowKinds/类型映射、首次渲染前注册、真实保存 payload 到重载边的往返、删除分支边后的配置、普通回落与历史 default 端口；只翻转 node.type 的测试不足以证明连接兼容。TypeScript 全库仍有历史诊断，本域变更不得增加诊断；类型门及基线收缩见 [分域检查说明](../typecheck-domains.md)。

布局与表单边界回归分别在 `tests/workflowAutoArrange.test.tsx`、`tests/workflowNodeConfigForm.test.tsx`；端口 getter 回归在 `tests/workflowPortContracts.test.ts`。表单测试使用真实 AntD Form，验证未知值透传、深合并/数组替换、遗漏键保留、watch、变化字段清除错误及同值字段保留错误。

缺 UUID 的端口生成与重载差异、旧 askConfig 的后端归一、真实后端保存/重载验收仍需分别跟进；源码往返测试不等于账号及后端验收。
