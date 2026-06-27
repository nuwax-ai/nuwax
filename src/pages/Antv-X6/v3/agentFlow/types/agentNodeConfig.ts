/**
 * Agent 节点上下文参数配置（v2，待 UI 接入）
 * 对应 nodeConfig.contextParams / contextPassMode
 */

/** 额外上下文参数项 */
export interface ExtraParam {
  name: string;
  valueType: 'literal' | 'variable';
  value?: string;
  variableRef?: string;
}

/** Agent 节点上下文传递配置 */
export interface ContextParamConfig {
  baseParam?: string;
  upstreamOutputs?: string[];
  extraParams?: ExtraParam[];
}
