import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { PluginTypeEnum } from '@/types/enums/plugin';
import type { SquareAgentTypeEnum } from '@/types/enums/square';
import type {
  AgentStatisticsInfo,
  CreatorInfo,
} from '@/types/interfaces/agent';
import React from 'react';

// 广场 - 已发布列表请求参数
export interface SquarePublishedListParams {
  // 目标类型，Agent,Plugin,Workflow,可用值:Agent,Plugin,Workflow,Knowledge,Table
  targetType: AgentComponentTypeEnum;
  // 页码，从1开始
  page: number;
  // 每页数量
  pageSize: number;
  // 分类名称
  category: string;
  // 关键字搜索
  kw?: string;
  // 空间ID（可选）需要通过空间过滤时有用
  spaceId?: number;
  // 只返回空间的组件
  justReturnSpaceData: boolean;
  // 空间ID列表（可选）,查询用户有权限的空间,限制访问空间,比如工作流查询全部知识库,要限制用户有权限的空间下的知识库
  authSpaceIds: number[];
  // 允许复制过滤（模板），1 允许
  allowCopy: AllowCopyEnum;
}

// 广场-已发布的组件单项信息
export interface SquarePublishedItemInfo {
  // 发布ID
  id: number;
  tenantId: number;
  spaceId: number;
  // ChatBot、PageApp
  agentType: 'ChatBot' | 'PageApp';
  // 目标对象（智能体、工作流、插件）ID,可用值:Agent,Plugin,Workflow,KNOWLEDGE
  targetType: SquareAgentTypeEnum;
  // 目标对象（智能体、工作流、插件）ID
  targetId: number;
  // 发布名称
  name: string;
  // 描述
  description: string;
  // 图标
  icon: string;
  remark: string;
  // 智能体发布修改时间
  modified: string;
  // 智能体发布创建时间
  created: string;
  // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
  statistics: AgentStatisticsInfo;
  // 发布者信息
  publishUser: CreatorInfo;
  // 分类名称
  category: string;
  // 是否允许复制, 1 允许
  allowCopy: AllowCopyEnum;
  // 可用值:HTTP,CODE
  pluginType: PluginTypeEnum;
  collect: boolean;
}

// 广场智能体与插件分类信息
export interface SquareCategoryInfo {
  // 类别名称
  key: string;
  // 类别描述
  label: string;
  type: SquareAgentTypeEnum;
  children?: SquareCategoryInfo[];
}

// 广场智能体信息
export interface SquareAgentInfo {
  // 类别名称
  name: string;
  // 类别描述
  description: string;
}

// 单个智能体组件
export interface SingleAgentProps {
  onClick: () => void;
  extra?: React.ReactNode;
  publishedItemInfo: SquarePublishedItemInfo;
  onToggleCollectSuccess: (id: number, isCollect: boolean) => void;
}

// 广场单个组件（插件、工作流等）
export type SquareComponentInfoProps = SingleAgentProps;

// 模板组件属性
export interface TemplateItemProps {
  publishedItemInfo: SquarePublishedItemInfo;
  onClick: () => void;
  extra?: React.ReactNode;
}

// 广场菜单项属性
export interface SquareMenuComponentInfo {
  name: string;
  icon: React.ReactNode;
  list: SquareAgentInfo[];
  type: SquareAgentTypeEnum;
}
