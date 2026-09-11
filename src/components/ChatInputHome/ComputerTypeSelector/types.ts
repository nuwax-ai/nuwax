import { SandboxSelectDto } from '@/types/interfaces/systemManage';

/**
 * 电脑选项类型
 */
export interface ComputerOption {
  /** 电脑 ID，'-1' 表示云电脑 */
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
  /** 当前选中的电脑 ID，'-1' 表示云电脑 */
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
  /** 是否自动触发选择逻辑（默认：true） */
  autoSelect?: boolean;
  /**
   * 严格绑定模式（首页）：沙箱选择按 agent 绑定——切到某 agent 显示其自己的记忆，
   * 未绑定过回落云端默认，不继承上一个 agent 的选择；默认 false 保持既有行为。
   * 决策逻辑见 resolveAutoSelection.ts。
   */
  strictAgentMemory?: boolean;
  /** 是否在选中时自动保存到后端（默认：true） */
  saveOnSelect?: boolean;
  /** 是否为个人电脑（用于区分不可用状态提示） */
  isPersonalComputer?: boolean;
  /** 是否为只读模式：只允许查看，禁止手动切换 */
  readonly?: boolean;
  /**
   * 仅云端模式（workspacePath 策略：全栈应用等不支持个人电脑的场景）：
   * 列表只保留云电脑，已选个人电脑时由既有自动选择逻辑回落到 '-1'。
   */
  cloudOnly?: boolean;
}
