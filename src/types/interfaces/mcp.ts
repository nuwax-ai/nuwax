import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  DeployStatusEnum,
  McpEditHeadMenusEnum,
  McpExecuteTypeEnum,
  McpInstallTypeEnum,
  McpPermissionsEnum,
} from '@/types/enums/mcp';
import type { CreatorInfo } from '@/types/interfaces/agent';
import type {
  BindConfigWithSub,
  CustomPopoverItem,
} from '@/types/interfaces/common';

// MCP配置组件信息
export interface McpConfigComponentInfo {
  // 组件名称
  name: string;
  // 组件图标
  icon: string;
  // 组件描述
  description: string;
  // 组件类型,可用值:Plugin,Workflow,Knowledge,Database
  type: AgentComponentTypeEnum;
  // 关联的组件ID
  targetId: number;
  // 组件原始配置
  targetConfig?: string;
  toolName?: string;
}

// MCP配置信息
export interface McpConfigInfo {
  // MCP服务配置，installType为npx、uvx、sse时有效
  serverConfig: string;
  // MCP组件配置，installType为component时有效
  components: McpConfigComponentInfo[];
  // MCP工具列表，无需前端传递
  tools: {
    // 工具名称
    name: string;
    // 工具描述
    description: string;
    // 输入参数
    inputArgs: BindConfigWithSub[];
    // 输出参数
    outputArgs: BindConfigWithSub[];
  }[];
  // MCP资源列表，无需前端传递
  resources: {
    uri: string;
    // 名称
    name: string;
    // 描述
    description: string;
    mimeType: string;
    annotations: {
      audience: string[];
      priority: number;
    }[];
    // 输入参数
    inputArgs: BindConfigWithSub[];
  }[];
  prompts: {
    // 	名称
    name: string;
    // 描述
    description: string;
    // 输入参数
    inputArgs: BindConfigWithSub[];
    // 输出参数
    outputArgs: BindConfigWithSub[];
  }[];
}

// MCP服务更新请求参数
export interface McpUpdateParams {
  /*MCP ID */
  id?: number;

  /*MCP名称 */
  name: string;

  /*MCP描述 */
  description: string;

  /*MCP图标 */
  icon?: string;

  /*MCP配置 */
  mcpConfig: McpConfigInfo;

  /*是否部署 */
  withDeploy?: boolean;
}

// MCP服务详情
export interface McpDetailInfo {
  // MCP ID
  id: number;
  // 空间ID
  spaceId: number;
  // 创建者ID
  creatorId: number;
  // MCP名称
  name: string;
  // MCP描述
  description: string;
  // MCP图标
  icon: string;
  // MCP安装方式,可用值:NPX,uvx,SSE,COMPONENT
  installType: McpInstallTypeEnum;
  // MCP部署状态,可用值:Initialization,Deploying,Deployed,DeployFailed,Stopped
  deployStatus: DeployStatusEnum;
  // MCP配置
  mcpConfig?: McpConfigInfo;
  // MCP部署时间
  deployed: string;
  // MCP修改时间
  modified: string;
  // MCP创建时间
  created: string;
  // 创建者信息
  creator: CreatorInfo;
  // 权限列表
  permissions: McpPermissionsEnum[];
}

// MCP试运行请求参数
export interface McpTestParams {
  // 请求ID
  requestId: string;
  // MCP ID
  id: number;
  // 执行类型,可用值:TOOL,RESOURCE,PROMPT
  executeType: McpExecuteTypeEnum;
  // MCP工具/资源/提示词名称
  name: string;
  // 参数
  params: object;
}

// MCP试运行结果
export interface McpTestResult {
  // 执行结果状态
  success: boolean;
  // 执行结果
  result: string;
  // 执行日志
  logs: string[];
  // 执行错误信息
  error: string;
  // 请求ID
  requestId: string;
  // 请求耗时
  costTime: number;
}

// MCP服务创建请求参数
export interface McpCreateParams {
  // 空间ID
  spaceId: number;
  // MCP名称
  name: string;
  // MCP描述
  description: string;
  // MCP图标
  icon: string;
  // MCP安装方式,可用值:NPX,uvx,SSE,COMPONENT
  installType: McpInstallTypeEnum;
  // MCP配置
  mcpConfig: McpConfigInfo;
  // 是否部署
  withDeploy?: boolean;
}

// 组件库单个组件项
export interface McpComponentItemProps {
  mcpInfo: McpDetailInfo;
  onClick: () => void;
  onClickMore: (item: CustomPopoverItem) => void;
}

// 服务导出弹窗组件属性
export interface ServerExportModalProps {
  mcpId?: number;
  // mcp服务名称
  name?: string;
  open: boolean;
  onCancel: () => void;
}

// 创建、编辑MCP服务header组件公共属性
export interface McpHeaderCommonProps {
  spaceId: number;
  saveLoading?: boolean;
  saveDeployLoading?: boolean;
  onSave: () => void;
  onSaveAndDeploy: () => void;
}

// 创建MCP服务header组件
export interface McpHeaderProps extends McpHeaderCommonProps {
  onCancel: () => void;
}

// 编辑MCP服务header组件
export interface McpEditHeaderProps extends McpHeaderCommonProps {
  mcpInfo?: McpDetailInfo;
  currentMenu: McpEditHeadMenusEnum;
  onChooseMenu: (mode: McpEditHeadMenusEnum) => void;
}

// Mcp组件列表
export interface McpCollapseComponentListProps {
  textClassName?: string;
  type: AgentComponentTypeEnum;
  list: McpConfigComponentInfo[];
  onDel: (targetId: number, type: AgentComponentTypeEnum) => void;
}

// 智能体模型组件，插件、工作流、触发器等组件通用显示组件
export interface McpCollapseComponentItemProps {
  componentInfo: McpConfigComponentInfo;
  defaultImage?: string;
  extra?: React.ReactNode;
}
