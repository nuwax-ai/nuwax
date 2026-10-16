# 特殊端口连线维护

端口解析和分支写回集中在 [workflowProxyV3.ts](../services/workflowProxyV3.ts)，AgentFlow 特殊节点通过 extensionRegistry handler 扩展；不要在页面复制解析规则。

| 类型 | 连线写回位置 |
| --- | --- |
| 普通节点 | `nextNodeIds` |
| 条件 | `conditionBranchConfigs[].nextNodeIds` |
| 意图识别 / RouteDecision | `intentConfigs[].nextNodeIds` |
| 选择式问答 / HumanInteraction | `options[].nextNodeIds` |
| 异常处理 | `exceptionHandleConfig.exceptionHandleNodeIds` |

维护约束：

- 连线创建、删除、撤销重做和 `syncFromGraph` 都要保留完整 sourcePort / targetPort；删除节点同步清理分支引用。
- 判断端口后缀使用完整的 `-in` / `-out` 语义，不能用 `includes('in')` / `includes('out')`，否则 `route` 与 UUID 会被误判。不要先剥端口再让另一层猜回。
- 图本地坐标与客户端坐标只转换一次，不能按数值是否落在容器范围内猜坐标系。
- React shape 的 HTML 可能覆盖 SVG 端口；端口交互使用 X6 magnet 事件，按真实 port 属性定位。
- 条件、意图、问答和异常分支需验证保存后重新加载仍有连线，不能只看画布是否连上。

回归入口为 `agentFlow/__tests__/edgeConnect.test.ts`、`edgeSync.test.ts`、`startInsertHandlers.test.ts` 及 `services/__tests__/workflowProxyV3.test.ts`（均相对 v3 目录）。
