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
import { ICON_AGENT, ICON_WORKFLOW_SQUARE } from '@/constants/images.constants';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { EcosystemDataTypeEnum } from '@/types/interfaces/ecosystem';

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

export const ECO_TYPE_TITLE_MAP = {
  [EcosystemDataTypeEnum.PLUGIN]: dict('PC.Common.Global.plugin'),
  [EcosystemDataTypeEnum.TEMPLATE]: dict('PC.Common.Global.template'),
  [EcosystemDataTypeEnum.MCP]: 'MCP',
};
