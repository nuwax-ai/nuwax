import {
  FilterDeployEnum,
  McpInstallTypeEnum,
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
