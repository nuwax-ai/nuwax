import { SandboxConfigItem } from '@/types/interfaces/systemManage';

/**
 * 电脑选项类型
 */
export interface ComputerOption {
  /** 电脑 ID，null 表示远程电脑（默认） */
  id: number | null;
  /** 电脑名称 */
  name: string;
  /** 是否在线 */
  online?: boolean;
  /** 是否启用 */
  isActive?: boolean;
  /** 原始配置数据 */
  raw?: SandboxConfigItem;
}

/**
 * ComputerTypeSelector 组件 Props
 */
export interface ComputerTypeSelectorProps {
  /** 当前选中的电脑 ID，null 表示远程电脑 */
  value?: number | null;
  /** 选择变化回调 */
  onChange?: (id: number | null, option: ComputerOption) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}
