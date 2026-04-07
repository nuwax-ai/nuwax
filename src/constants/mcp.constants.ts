import { dict } from '@/services/i18nRuntime';
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
  { value: FilterDeployEnum.All, label: dict('PC.Common.Global.all') },
  {
    value: FilterDeployEnum.Deployed,
    label: dict('PC.Constants.Mcp.deployed'),
  },
];

// MCP更多操作
export const MCP_MORE_ACTION = [
  {
    type: McpMoreActionEnum.Stop_Service,
    label: dict('PC.Constants.Mcp.stopService'),
  },
  {
    type: McpMoreActionEnum.Service_Export,
    label: dict('PC.Constants.Mcp.serviceExport'),
  },
  { type: McpMoreActionEnum.Log, label: dict('PC.Common.Global.log') },
  {
    type: McpMoreActionEnum.Del,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
  },
];

// MCP安装方式列表
export const MCP_INSTALL_TYPE_LIST = [
  { value: McpInstallTypeEnum.NPX, label: 'npx' },
  { value: McpInstallTypeEnum.UVX, label: 'uvx' },
  { value: McpInstallTypeEnum.SSE, label: 'sse' },
  { value: McpInstallTypeEnum.STREAMABLE_HTTP, label: 'streamableHttp' },
  {
    value: McpInstallTypeEnum.COMPONENT,
    label: dict('PC.Constants.Space.componentLibrary'),
  },
];

// MCP服务配置组件列表
export const MCP_COLLAPSE_COMPONENT_LIST: {
  type: AgentComponentTypeEnum;
  label: string;
}[] = [
  {
    type: AgentComponentTypeEnum.Agent,
    label: dict('PC.Constants.Mcp.typeAgent'),
  },
  {
    type: AgentComponentTypeEnum.Plugin,
    label: dict('PC.Constants.Mcp.typePlugin'),
  },
  {
    type: AgentComponentTypeEnum.Workflow,
    label: dict('PC.Constants.Mcp.typeWorkflow'),
  },
  {
    type: AgentComponentTypeEnum.Knowledge,
    label: dict('PC.Constants.Mcp.typeKnowledge'),
  },
  {
    type: AgentComponentTypeEnum.Table,
    label: dict('PC.Constants.Mcp.typeDataTable'),
  },
];

// MCP编辑head菜单列表
export const MCP_EDIT_HEAD_MENU_LIST = [
  {
    value: McpEditHeadMenusEnum.Overview,
    label: dict('PC.Constants.Mcp.menuOverview'),
  },
  {
    value: McpEditHeadMenusEnum.Tool,
    label: dict('PC.Constants.Mcp.menuTool'),
  },
  {
    value: McpEditHeadMenusEnum.Resource,
    label: dict('PC.Constants.Mcp.menuResource'),
  },
  {
    value: McpEditHeadMenusEnum.Prompt,
    label: dict('PC.Constants.Mcp.menuPrompt'),
  },
];

// MCP管理分段器列表
export const MCP_MANAGE_SEGMENTED_LIST = [
  {
    value: McpManageSegmentedEnum.Custom,
    label: dict('PC.Constants.Mcp.segCustom'),
  },
  {
    value: McpManageSegmentedEnum.Official,
    label: dict('PC.Constants.Mcp.segOfficial'),
  },
];
