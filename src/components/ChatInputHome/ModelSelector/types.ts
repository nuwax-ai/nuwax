import { ModelOptionDto } from '@/types/interfaces/agent';

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
  /** 外部预加载模型列表，传入后跳过按 agentId 拉取并隐藏增删改操作 */
  modelList?: ModelOptionDto[];
}
