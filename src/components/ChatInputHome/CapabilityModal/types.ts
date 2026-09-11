/**
 * 添加能力弹窗类型定义
 * @description 技能/连接器/专家/资料库 × 系统广场/团队空间 各维度列表接口形态不同，
 * 弹窗内部通过适配层统一归一化为下列结构（数据层方案参考
 * pages/ExpertSkillConnector 的双适配器模式，在本组件内独立实现，不直接复用）
 */

import { SquareAgentTypeEnum } from '@/types/enums/square';

/** 能力类型：技能 / 连接器 / 专家 / 资料库 */
export type CapabilityTypeEnum = 'skill' | 'connector' | 'expert' | 'knowledge';

/** 数据源：系统广场 / 团队空间 */
export type CapabilitySourceEnum = 'system' | 'team';

/** 归一化后的能力卡片数据（展示 + 选中回传） */
export interface CapabilityItem {
  /** 唯一标识（能力类型+数据源+原始标识，用于 React key、选中回传与置顶持久化） */
  key: string;
  /** 能力类型 */
  resourceType: CapabilityTypeEnum;
  /** 数据源 */
  source: CapabilitySourceEnum;
  /** 原始标识：连接器为 service，资料库为页面 id，其余为数字 ID */
  rawId: number | string;
  /** 资料库页面短链标识（会话 selectedDocs 寻址用） */
  slugId?: string;
  /** 本体 ID（系统广场发布条目才有，挂载能力时消费方需要） */
  targetId?: number;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 图标（URL 或 SvgIcon 名称，为空时卡片渲染首字回退头像） */
  icon?: string;
  /** 分类（卡片分类标签） */
  category?: string;
  /** 标签（连接器） */
  tags?: string[];
  /** 用户数（系统广场条目统计） */
  userCount?: number;
  /** 连接器实际连接状态；未返回时不推断。 */
  connected?: boolean;
  /** 连接器认证方式（oauth2/api_key/bearer/custom/no_auth），连接/断开分流用 */
  authType?: string;
  /** 资料格式；未返回时仅从文件扩展名推导。 */
  fileType?: string;
  /** 资料库文档类型（knowledge 项；随 selectedDocs 的 pageType 发送） */
  pageType?: string;
  /** 是否需要付费（系统广场条目；选中付费未订阅技能时上层需拉起订阅弹窗） */
  paymentRequired?: boolean;
  /** 是否已订阅（系统广场条目） */
  subscribed?: boolean;
}

/** 二级分类 pill（system 维度为内容分类，team 维度为空间） */
export interface CapabilityCategoryInfo {
  /** 分类标识，空串表示"全部" */
  key: string;
  /** 分类名称 */
  label: string;
}

/** 能力类型 -> 已发布分类接口根节点类型（系统广场维度取二级分类用） */
export const CAPABILITY_TYPE_TO_CATEGORY_TYPE: Record<
  CapabilityTypeEnum,
  SquareAgentTypeEnum
> = {
  expert: SquareAgentTypeEnum.Agent,
  skill: SquareAgentTypeEnum.Skill,
  connector: SquareAgentTypeEnum.Plugin,
  knowledge: SquareAgentTypeEnum.Knowledge,
};
