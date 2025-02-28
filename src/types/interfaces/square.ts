// 广场-已发布智能体列表输入参数
import type { KnowledgeDataTypeEnum } from '@/types/enums/library';
import type { SquareAgentTypeEnum } from '@/types/enums/square';
import type {
  AgentStatisticsInfo,
  CreatorInfo,
} from '@/types/interfaces/agent';

// 已发布插件列表输入参数
export interface PublishedPluginListParams {
  page: number;
  pageSize: number;
  // 分类名称
  category: string;
  // 关键字搜索
  kw: string;
  // 空间ID（可选）需要通过空间过滤时有用
  spaceId: number;
}

// 已发布知识库列表输入参数
export type PublishedKnowledgeListParams = PublishedPluginListParams;

// 广场-已发布智能体列表输入参数
export interface PublishedAgentListParams extends PublishedPluginListParams {
  dataType: KnowledgeDataTypeEnum;
}

// 已发布的智能体信息
export interface PublishedAgentInfo {
  spaceId: number;
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
  publishedAgentInfo: PublishedAgentInfo;
}
