import {
  default as agentImage,
  default as pageImage,
} from '@/assets/images/agent_image.png';
import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import mcpImage from '@/assets/images/mcp_image.png';
import modelImage from '@/assets/images/model_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import variableImage from '@/assets/images/variable_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import SvgIcon from '@/components/base/SvgIcon';
import { ICON_AGENT, ICON_WORKFLOW_SQUARE } from '@/constants/images.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { EcosystemMarketEnum } from '@/types/enums/ecosystemMarket';
import {
  EcosystemDataTypeEnum,
  EcosystemTabTypeEnum,
} from '@/types/interfaces/ecosystem';
import { TabsProps } from 'antd';

// 生态市场应用列表（layout二级菜单）
export const ECOSYSTEM_MARKET_LIST = [
  {
    type: EcosystemMarketEnum.MCP,
    icon: <SvgIcon name="icons-nav-mcp" />,
    text: 'MCP',
  },
  {
    type: EcosystemMarketEnum.Plugin,
    icon: <SvgIcon name="icons-nav-plugins" />,
    text: '插件',
  },
  {
    type: EcosystemMarketEnum.Template,
    icon: <SvgIcon name="icons-nav-template" />,
    text: '模板',
  },
];

// 组件列表常量数据
export const COMPONENT_LIST: {
  type: AgentComponentTypeEnum;
  defaultImage: string;
  text: string;
}[] = [
  {
    type: AgentComponentTypeEnum.Plugin,
    defaultImage: pluginImage,
    text: '插件',
  },
  {
    type: AgentComponentTypeEnum.Knowledge,
    defaultImage: knowledgeImage,
    text: '知识库',
  },
  {
    type: AgentComponentTypeEnum.Workflow,
    defaultImage: workflowImage,
    text: '工作流',
  },
  {
    type: AgentComponentTypeEnum.Table,
    defaultImage: databaseImage,
    text: '数据表',
  },
  {
    type: AgentComponentTypeEnum.Model,
    defaultImage: modelImage,
    text: '模型',
  },
  {
    type: AgentComponentTypeEnum.Agent,
    defaultImage: agentImage,
    text: '智能体',
  },
  {
    type: AgentComponentTypeEnum.Variable,
    defaultImage: variableImage,
    text: '变量',
  },
  {
    type: AgentComponentTypeEnum.MCP,
    defaultImage: mcpImage,
    text: 'MCP',
  },
  {
    type: AgentComponentTypeEnum.Page,
    defaultImage: pageImage,
    text: '应用页面',
  },
];

export const TAG_ICON_LIST: Partial<
  Record<AgentComponentTypeEnum, React.ReactNode>
> = {
  [AgentComponentTypeEnum.Workflow]: <ICON_WORKFLOW_SQUARE />,
  [AgentComponentTypeEnum.Agent]: <ICON_AGENT />,
};

export const TabTypeEnum: {
  ALL: EcosystemTabTypeEnum;
  ENABLED: EcosystemTabTypeEnum;
  SHARED: EcosystemTabTypeEnum;
} = {
  ALL: EcosystemTabTypeEnum.ALL,
  ENABLED: EcosystemTabTypeEnum.ENABLED,
  SHARED: EcosystemTabTypeEnum.SHARED,
};

export const TabItems: TabsProps['items'] = [
  {
    key: TabTypeEnum.ALL,
    label: '全部',
  },
  {
    key: TabTypeEnum.ENABLED,
    label: `已启用`,
  },
  {
    key: TabTypeEnum.SHARED,
    label: `我的分享`,
  },
];

// 生态市场MCP标签列表
export const ECO_MCP_TAB_ITEMS: TabsProps['items'] = [
  {
    key: EcosystemTabTypeEnum.ALL,
    label: '全部',
  },
  {
    key: EcosystemTabTypeEnum.ENABLED,
    label: '已启用',
  },
];

// MCP分类
export const ECO_MCP_CATEGORY_OPTIONS = [
  { label: '全部', value: 'All' },
  { label: '生活服务', value: 'LifeServices' },
  { label: '电脑操作', value: 'ComputerOperations' },
  { label: '个人知识', value: 'PersonalKnowledge' },
  { label: '商业效率', value: 'BusinessEfficiency' },
  { label: '社交媒体', value: 'SocialMedia' },
  { label: '电商平台', value: 'E-commercePlatforms' },
  { label: '金融服务', value: 'FinancialServices' },
  { label: '技术开发', value: 'TechnologyDevelopment' },
  { label: '其他', value: 'Other' },
];

export const ECO_TYPE_TITLE_MAP = {
  [EcosystemDataTypeEnum.PLUGIN]: '插件',
  [EcosystemDataTypeEnum.TEMPLATE]: '模板',
  [EcosystemDataTypeEnum.MCP]: 'MCP',
};
