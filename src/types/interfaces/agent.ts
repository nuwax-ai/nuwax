import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type {
  PublishStatusEnum,
  TooltipTitleTypeEnum,
} from '@/types/enums/common';
import type { UpdateModeComponentEnum } from '@/types/enums/library';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import React from 'react';

// 知识库设置label
export interface LabelIconProps {
  label: string;
  title: React.ReactNode;
  type?: TooltipTitleTypeEnum;
}

// 智能体信息
export interface AgentInfo {
  id: string;
  userId: string;
  name: string;
  icon: string;
  description: string;
  modified: string;
  created: string;
  agentId: string;
  spaceId: string;
}

// 取消点赞智能体输入参数
export interface UnlikeParams {
  agentId: string;
}

// 取消收藏智能体输入参数
export interface UnCollectParams {
  agentId: string;
}

// 点赞智能体输入参数
export interface LikeAgentParams {
  agentId: string;
}

// 取消开发智能体收藏输入参数
export interface DevUnCollectAgentParams {
  agentId: string;
}

// 开发智能体收藏输入参数
export interface DevCollectAgentParams {
  agentId: string;
}

// 智能体收藏输入参数
export interface CollectAgentParams {
  agentId: string;
}

// 智能体收藏输入参数
export interface CollectAgentParams {
  agentId: string;
}

// 新增智能体输入参数
export interface AgentAddParams {
  spaceId: string;
  name: string;
  description: string;
  icon: string;
}

// 智能体迁移接口输入参数
export interface AgentTransferParams {
  agentId: string;
  targetSpaceId: string;
}

// 智能体发布申请输入参数
export interface AgentPublishApplyParams {
  agentId: string;
  channels: string[];
  remark: string[];
}

// 删除智能体输入参数
export interface AgentDeleteParams {
  agentId: string;
}

// 创建副本输入参数
export interface AgentCopyParams {
  agentId: string;
}

// 更新智能体基础配置信息输入参数
export interface AgentConfigUpdateParams {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  userPrompt: string;
  openSuggest: string;
  suggestPrompt: string;
  openingChatMsg: string;
  openingGuidQuestion: string;
  openLongMemory: string;
}

// 更新模型组件配置输入参数
export interface AgentComponentModelUpdateParams {
  id: string;
  name: string;
  icon: string;
  description: string;
  targetId: string;
  bindConfig: {
    mode: UpdateModeComponentEnum;
    // 	生成随机性;0-1
    temperature: string;
    // 累计概率: 模型在生成输出时会从概率最高的词汇开始选择;0-1
    topP: string;
    // 最大生成长度
    maxTokens: string;
    // 	上下文轮数
    contextRounds: string;
  };
  exceptionOut: string;
  fallbackMsg: string;
}

// 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
export interface AgentStatisticsInfo {
  targetId: string;
  // 用户人数
  userCount: string;
  // 会话次数
  convCount: string;
  // 收藏次数
  collectCount: string;
  // 点赞次数
  likeCount: string;
  // 引用次数
  referenceCount: string;
  // 调用总次数
  callCount: string;
  // 失败调用次数
  failCallCount: string;
  // 调用总时长
  totalCallDuration: string;
}

// 智能体配置信息
export interface AgentConfigInfo {
  id: string;
  uid: string;
  // 	商户ID
  tenantId: string;
  spaceId: string;
  creatorId: string;
  // Agent名称
  name: string;
  // Agent描述
  description: string;
  // 图标地址
  icon: string;
  // 系统提示词
  systemPrompt: string;
  // 用户消息提示词
  userPrompt: string;
  // 是否开启问题建议,可用值:Open,Close
  openSuggest: string;
  // 问题建议提示词
  suggestPrompt: string;
  // 首次打开聊天框自动回复消息
  openingChatMsg: string;
  // 首次打开引导问题
  openingGuidQuestion: string;
  // 是否开启长期记忆,可用值:Open,Close
  openLongMemory: string;
  // 发布状态,可用值:Developing,Applying,Published,Rejected
  publishStatus: PublishStatusEnum;
  modified: string;
  created: string;
  // 模型信息
  modelComponentConfig: AgentComponentInfo;
  // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
  agentStatistics: AgentStatisticsInfo;
  // 创建者信息
  creator: {
    userId: string;
    // 用户名
    userName: string;
    nickName: string;
    avatar: string;
  };
  space: SpaceInfo;
  devCollected: boolean;
}

// 智能体历史配置信息
export interface AgentConfigHistoryInfo {
  id: string;
  // 可用值:Agent,Plugin,Workflow
  targetType: string;
  targetId: string;
  // 操作类型,Add 新增, Edit 编辑, Publish 发布,可用值:Add,Edit,Publish,PublishApply,PublishApplyReject,OffShelf,AddComponent,EditComponent,DeleteComponent,AddNode,EditNode,DeleteNode
  type: string;
  // 当时的配置信息
  config: string;
  description: string;
  // 操作人
  opUser: {
    userId: string;
    userName: string;
    nickName: string;
    avatar: string;
  };
  modified: string;
  created: string;
}

// 智能体组件模型信息
export interface AgentComponentInfo {
  id: string;
  // 商户ID
  tenantId: string;
  // 组件名称
  name: string;
  // 组件图标
  icon: string;
  // 组件描述
  description: string;
  agentId: string;
  // 组件类型,可用值:Plugin,Workflow,Trigger,Knowledge,Variable,Database,Model
  type: AgentComponentTypeEnum;
  // 绑定组件配置，不同组件配置不一样
  bindConfig: string;
  // 关联的组件ID
  targetId: string;
  // 组件原始配置
  targetConfig: string;
  exceptionOut: string;
  fallbackMsg: string;
  modified: string;
  created: string;
}
