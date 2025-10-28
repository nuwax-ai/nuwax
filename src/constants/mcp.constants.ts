import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  FilterDeployEnum,
  McpEditHeadMenusEnum,
  McpInstallTypeEnum,
  McpManageSegmentedEnum,
  McpMoreActionEnum,
} from '@/types/enums/mcp';

// 过滤部署状态
export const FILTER_DEPLOY = [
  { value: FilterDeployEnum.All, label: '全部' },
  { value: FilterDeployEnum.Deployed, label: '已部署' },
];

// MCP更多操作
export const MCP_MORE_ACTION = [
  { type: McpMoreActionEnum.Stop_Service, label: '停止服务' },
  { type: McpMoreActionEnum.Service_Export, label: '服务导出' },
  { type: McpMoreActionEnum.Del, label: '删除', isDel: true },
];

// MCP安装方式列表
export const MCP_INSTALL_TYPE_LIST = [
  { value: McpInstallTypeEnum.NPX, label: 'npx' },
  { value: McpInstallTypeEnum.UVX, label: 'uvx' },
  { value: McpInstallTypeEnum.SSE, label: 'sse' },
  { value: McpInstallTypeEnum.COMPONENT, label: '组件库' },
];

// MCP服务配置组件列表
export const MCP_COLLAPSE_COMPONENT_LIST: {
  type: AgentComponentTypeEnum;
  label: string;
}[] = [
  {
    type: AgentComponentTypeEnum.Plugin,
    label: '插件',
  },
  {
    type: AgentComponentTypeEnum.Workflow,
    label: '工作流',
  },
  {
    type: AgentComponentTypeEnum.Knowledge,
    label: '知识库',
  },
  {
    type: AgentComponentTypeEnum.Table,
    label: '数据表',
  },
];

// MCP编辑head菜单列表
export const MCP_EDIT_HEAD_MENU_LIST = [
  { value: McpEditHeadMenusEnum.Overview, label: '概览' },
  { value: McpEditHeadMenusEnum.Tool, label: '工具' },
  { value: McpEditHeadMenusEnum.Resource, label: '资源' },
  { value: McpEditHeadMenusEnum.Prompt, label: '提示词' },
];

// MCP管理分段器列表
export const MCP_MANAGE_SEGMENTED_LIST = [
  { value: McpManageSegmentedEnum.Custom, label: '自定义服务' },
  { value: McpManageSegmentedEnum.Official, label: '官方服务' },
];
