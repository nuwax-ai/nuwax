export interface ModelSelectorProps {
  /** 智能体 ID */
  agentId?: number;
  /** 当前选中的模型 ID */
  selectedModelId?: number;
  /** 模型改变时的回调 */
  onModelSelect?: (modelId: number) => void;
  /** 智能体类型 */
  agentType?: string;
  /** 自定义类名 */
  className?: string;
}
