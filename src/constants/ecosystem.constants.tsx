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
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { EcosystemMarketEnum } from '@/types/enums/ecosystemMarket';
import { CustomPopoverItem } from '@/types/interfaces/common';
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
    text: dict('PC.Common.Global.plugin'),
  },
  {
    type: EcosystemMarketEnum.Template,
    icon: <SvgIcon name="icons-nav-template" />,
    text: dict('PC.Common.Global.template'),
    list: [
      {
        text: dict('PC.Common.Global.agent'),
        type: AgentComponentTypeEnum.Agent,
      },
      {
        text: dict('PC.Common.Global.workflow'),
        type: AgentComponentTypeEnum.Workflow,
      },
      {
        text: dict('PC.Constants.Ecosystem.webApp'),
        type: AgentComponentTypeEnum.PageApp,
      },
    ],
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
    text: dict('PC.Common.Global.plugin'),
  },
  {
    type: AgentComponentTypeEnum.Knowledge,
    defaultImage: knowledgeImage,
    text: dict('PC.Common.Global.knowledge'),
  },
  {
    type: AgentComponentTypeEnum.Workflow,
    defaultImage: workflowImage,
    text: dict('PC.Common.Global.workflow'),
  },
  {
    type: AgentComponentTypeEnum.Table,
    defaultImage: databaseImage,
    text: dict('PC.Common.Global.dataTable'),
  },
  {
    type: AgentComponentTypeEnum.Model,
    defaultImage: modelImage,
    text: dict('PC.Common.Global.model'),
  },
  {
    type: AgentComponentTypeEnum.Agent,
    defaultImage: agentImage,
    text: dict('PC.Common.Global.agent'),
  },
  {
    type: AgentComponentTypeEnum.Variable,
    defaultImage: variableImage,
    text: dict('PC.Constants.Common.variable'),
  },
  {
    type: AgentComponentTypeEnum.MCP,
    defaultImage: mcpImage,
    text: 'MCP',
  },
  {
    type: AgentComponentTypeEnum.Page,
    defaultImage: pageImage,
    text: dict('PC.Constants.Ecosystem.webApp'),
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
    label: dict('PC.Common.Global.all'),
  },
  {
    key: TabTypeEnum.ENABLED,
    label: dict('PC.Constants.Ecosystem.enabled'),
  },
  {
    key: TabTypeEnum.SHARED,
    label: dict('PC.Constants.Ecosystem.myShares'),
  },
];

// 生态市场MCP标签列表
export const ECO_MCP_TAB_ITEMS: TabsProps['items'] = [
  {
    key: EcosystemTabTypeEnum.ALL,
    label: dict('PC.Common.Global.all'),
  },
  {
    key: EcosystemTabTypeEnum.ENABLED,
    label: dict('PC.Constants.Ecosystem.enabled'),
  },
];

// MCP分类
export const ECO_MCP_CATEGORY_OPTIONS = [
  { label: dict('PC.Common.Global.all'), value: 'All' },
  {
    label: dict('PC.Constants.Ecosystem.catLifeServices'),
    value: 'LifeServices',
  },
  {
    label: dict('PC.Constants.Ecosystem.catComputerOps'),
    value: 'ComputerOperations',
  },
  {
    label: dict('PC.Constants.Ecosystem.catPersonalKnowledge'),
    value: 'PersonalKnowledge',
  },
  {
    label: dict('PC.Constants.Ecosystem.catBusinessEfficiency'),
    value: 'BusinessEfficiency',
  },
  {
    label: dict('PC.Constants.Ecosystem.catSocialMedia'),
    value: 'SocialMedia',
  },
  {
    label: dict('PC.Constants.Ecosystem.catEcommerce'),
    value: 'E-commercePlatforms',
  },
  {
    label: dict('PC.Constants.Ecosystem.catFinancialServices'),
    value: 'FinancialServices',
  },
  {
    label: dict('PC.Constants.Ecosystem.catTechDev'),
    value: 'TechnologyDevelopment',
  },
  { label: dict('PC.Common.Global.other'), value: 'Other' },
];

export const ECO_TYPE_TITLE_MAP = {
  [EcosystemDataTypeEnum.PLUGIN]: dict('PC.Common.Global.plugin'),
  [EcosystemDataTypeEnum.TEMPLATE]: dict('PC.Common.Global.template'),
  [EcosystemDataTypeEnum.MCP]: 'MCP',
};

/**
 * 生态市场模板分享状态选项列表
 */
export const ECO_TEMPLATE_SHARE_STATUS_OPTIONS = [
  {
    label: dict('PC.Common.Global.all'),
    value: -1,
  },
  {
    label: dict('PC.Common.Global.published'),
    value: 3,
  },
  {
    label: dict('PC.Constants.Ecosystem.underReview'),
    value: 2,
  },
  {
    label: dict('PC.Constants.Ecosystem.offline'),
    value: 4,
  },
];

// 生态市场更多操作列表
export const EcoMarketActionList: CustomPopoverItem[] = [
  {
    label: dict('PC.Common.Global.delete'),
    isDel: true,
  },
];
