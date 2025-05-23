import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';

// 智能体、插件、工作流下架请求参数
export interface PublishOffShelfParams {
  // 类型，智能体、插件、工作流可以下架,可用值:Agent,Plugin,Workflow,Knowledge,Table
  targetType: AgentComponentTypeEnum;
  // 智能体、插件或工作流ID
  targetId: number;
  // 发布ID，下架时必填
  publishId: number;
}

// 查询指定智能体插件或工作流已发布列表请求参数
export interface PublishItemListParams {
  // 类型，智能体、插件、工作流可以下架,可用值:Agent,Plugin,Workflow,Knowledge,Table
  targetType: AgentComponentTypeEnum;
  // 智能体、插件或工作流ID
  targetId: number;
}

// 查询指定智能体插件或工作流已发布列表返回结果
export interface PublishItemInfo {
  /*发布ID，审核中无该ID，审核中下架按钮禁用 */
  publishId: number;

  /*发布状态,可用值:Developing,Applying,Published,Rejected */
  publishStatus: PublishStatusEnum;

  /*发布范围,Tenant 系统广场；Space空间广场,可用值:Space,Tenant,Global */
  scope: PluginPublishScopeEnum;

  /*空间ID,scope为空间广场时有效 */
  spaceId: number;

  /*是否允许复制,0不允许，1允许 */
  allowCopy: AllowCopyEnum;

  /*发布时间 */
  publishDate: string;

  /*描述信息 */
  description: string;
}

// 发布项
export interface PublishItem {
  /*发布范围，可选范围：Space 空间,Tenant 系统,可用值:Space,Tenant,Global */
  scope?: PluginPublishScopeEnum;

  /*发布空间ID */
  spaceId?: number;

  /*是否允许复制,0不允许；1允许 */
  allowCopy?: AllowCopyEnum;
}

// 提交发布申请请求参数
export interface PublishApplyParams {
  // 类型，智能体、插件、工作流可以下架,可用值:Agent,Plugin,Workflow,Knowledge,Table
  targetType: AgentComponentTypeEnum;

  /*发布目标ID，例如智能体ID；工作流ID；插件ID */
  targetId?: number;

  /*发布记录 */
  remark?: string;

  /*发布分类 */
  category?: string;

  /*发布项 */
  items?: PublishItem[];
}
