import { SandboxSelectDto } from '@/types/interfaces/systemManage';

/**
 * 电脑选项类型
 */
export interface ComputerOption {
  /** 电脑 ID，空字符串或'remote'表示远程电脑（默认） */
  id: string;
  /** 电脑名称 */
  name: string;
  /** 电脑描述 */
  description?: string;
  /** 原始配置数据 */
  raw?: SandboxSelectDto;
}

/**
 * ComputerTypeSelector 组件 Props
 */
export interface ComputerTypeSelectorProps {
  /** 当前选中的电脑 ID，空字符串或'remote'表示远程电脑 */
  value?: string;
  /** 选择变化回调 */
  onChange?: (id: string, option: ComputerOption) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 智能体ID，用于保存/读取用户对每个智能体的选择 */
  agentId?: number;
  /** 是否为固定选择模式（sandboxServerId或sandboxId存在时） */
  fixedSelection?: boolean;
  /** 选中的电脑是否不可用（不在列表中） */
  unavailable?: boolean;
  /** 外部传入的电脑列表，传入后将禁用内部加载逻辑 */
  options?: ComputerOption[];
  /** 是否自动触发选择逻辑（默认：true） */
  autoSelect?: boolean;
  /** 是否在选中时自动保存到后端（默认：true） */
  saveOnSelect?: boolean;
  /** 是否为个人电脑（用于区分不可用状态提示） */
  isPersonalComputer?: boolean;
}
