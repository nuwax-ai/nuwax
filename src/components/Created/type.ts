import type { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type { MenuProps } from 'antd';
/**  提前定义一些东西   */
export interface ButtonList {
  label: string;
  key: AgentComponentTypeEnum;
}

export interface CreatedProp {
  // 只展示当前空间
  isSpaceOnly?: boolean;
  // 打开当前的弹窗
  open: boolean;
  /** 盖住其它 Modal 时请显式调高（例如在表单 Modal 之上选工具列表） */
  modalZIndex?: number;
  onCancel: () => void;
  // 选中的头部的tag
  checkTag: AgentComponentTypeEnum;
  // 点击添加后,通知父组件添加节点
  onAdded: (val: CreatedNodeItem) => void;
  addComponents?: AgentAddComponentStatusInfo[];
  tabs?: { label: string; key: AgentComponentTypeEnum }[];
  // 隐藏顶部
  hideTop?: AgentComponentTypeEnum[];
  addSkillLoading?: boolean | undefined;
  disableCollect?: boolean; // 是否禁用收藏
  // 是否显示更多菜单，默认显示
  showMoreMenus?: boolean;
  /** 群组智能体选择器：仅查询当前空间智能体，不过滤 ChatBot 子类型 */
  isGroupAgentPicker?: boolean;
  /**
   * AgentFlow 智能体节点选器：请求 agentTypes = ChatBot / General / Custom
   */
  isAgentFlowAgentPicker?: boolean;
}

export type MenuItem = Required<MenuProps>['items'][number];
