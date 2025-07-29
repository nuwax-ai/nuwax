import agentImage from '@/assets/images/agent_image.png';
import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import modelImage from '@/assets/images/model_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import variableImage from '@/assets/images/variable_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import {
  ICON_AGENT,
  ICON_PLUGIN_BOLD,
  ICON_PUBLISHED,
  ICON_TEMPLATE,
  ICON_WORKFLOW_SQUARE,
} from '@/constants/images.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { EcosystemMarketEnum } from '@/types/enums/ecosystemMarket';
import { EcosystemTabTypeEnum } from '@/types/interfaces/ecosystem';
import { TabsProps } from 'antd';

// 生态市场应用列表（layout二级菜单）
export const ECOSYSTEM_MARKET_LIST = [
  {
    type: EcosystemMarketEnum.Plugin,
    icon: <ICON_PLUGIN_BOLD />,
    text: '插件',
  },
  {
    type: EcosystemMarketEnum.Template,
    icon: <ICON_TEMPLATE />,
    text: '模板',
  },
  {
    type: EcosystemMarketEnum.MCP,
    icon: <ICON_PUBLISHED />,
    text: 'MCP',
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
];

export const TAG_ICON_LIST: Partial<
  Record<AgentComponentTypeEnum, React.ReactNode>
> = {
  [AgentComponentTypeEnum.Workflow]: (
    <ICON_WORKFLOW_SQUARE
      style={{
        width: 14,
        height: 14,
        display: 'inline-block',
        verticalAlign: '-0.3em',
        marginRight: 4,
      }}
    />
  ),
  [AgentComponentTypeEnum.Agent]: (
    <ICON_AGENT
      style={{
        width: 14,
        height: 14,
        display: 'inline-block',
        verticalAlign: '-0.3em',
        marginRight: 4,
      }}
    />
  ),
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
