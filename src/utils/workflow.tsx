import {
  ICON_END,
  ICON_NEW_AGENT,
  ICON_START,
  ICON_WORKFLOW_CODE,
  ICON_WORKFLOW_CONDITION,
  ICON_WORKFLOW_DATABASE,
  ICON_WORKFLOW_DOCUMENT_EXTRACTION,
  ICON_WORKFLOW_HTTP_REQUEST,
  ICON_WORKFLOW_INTENT_RECOGNITION,
  ICON_WORKFLOW_KNOWLEDGE_BASE,
  ICON_WORKFLOW_LLM,
  ICON_WORKFLOW_LONG_TERM_MEMORY,
  ICON_WORKFLOW_LOOP,
  ICON_WORKFLOW_OUTPUT,
  ICON_WORKFLOW_PLUGIN,
  ICON_WORKFLOW_QA,
  ICON_WORKFLOW_TEXT_PROCESSING,
  ICON_WORKFLOW_VARIABLE,
  ICON_WORKFLOW_WORKFLOW,
} from '@/constants/images.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ChildNode, Edge } from '@/types/interfaces/graph';
// 引用默认图标
import Database from '@/assets/images/database_image.png';
import Knowledge from '@/assets/images/knowledge_image.png';
import Plugin from '@/assets/images/plugin_image.png';
import {
  default as Model,
  default as Trigger,
  default as Variable,
  default as Workflow,
} from '@/assets/images/workflow_image.png';

const imageList = {
  Database,
  Knowledge,
  Plugin,
  Workflow,
  Trigger,
  Variable,
  Model,
};
// 根据type返回图片，用作技能和知识库等节点中的
export const getImg = (data: AgentComponentTypeEnum) => {
  return imageList[data];
};
// 根据type返回图片
export const returnImg = (type: string) => {
  switch (type) {
    case 'Start':
      return <ICON_START />;
    case 'End':
      return <ICON_END />;
    case 'Output':
      return <ICON_WORKFLOW_OUTPUT />;
    case 'Code':
      return <ICON_WORKFLOW_CODE />;
    case 'Condition':
      return <ICON_WORKFLOW_CONDITION />;
    case 'Database':
      return <ICON_WORKFLOW_DATABASE />;
    case 'DocumentExtraction':
      return <ICON_WORKFLOW_DOCUMENT_EXTRACTION />;
    case 'HTTPRequest':
      return <ICON_WORKFLOW_HTTP_REQUEST />;
    case 'IntentRecognition':
      return <ICON_WORKFLOW_INTENT_RECOGNITION />;
    case 'Knowledge':
      return <ICON_WORKFLOW_KNOWLEDGE_BASE />;
    case 'LLM':
      return <ICON_WORKFLOW_LLM />;
    case 'LongTermMemory':
      return <ICON_WORKFLOW_LONG_TERM_MEMORY />;
    case 'Loop':
      return <ICON_WORKFLOW_LOOP />;
    case 'Plugin':
      return <ICON_WORKFLOW_PLUGIN />;
    case 'QA':
      return <ICON_WORKFLOW_QA />;
    case 'TextProcessing':
      return <ICON_WORKFLOW_TEXT_PROCESSING />;
    case 'Variable':
      return <ICON_WORKFLOW_VARIABLE />;
    case 'Workflow':
      return <ICON_WORKFLOW_WORKFLOW />;
    default:
      return <ICON_NEW_AGENT />;
  }
};

// 根据type返回背景色
export const returnBackgroundColor = (type: string) => {
  switch (type) {
    case 'Start':
    case 'End':
      return '#EEEEFF';
    case 'Code':
    case 'Loop':
    case 'Condition':
    case 'IntentRecognition':
      return '#C8FFFF';
    case 'Knowledge':
    case 'Database':
    case 'Variable':
    case 'LongTermMemory':
      return '#FFF0DF';
    case 'QA':
    case 'DocumentExtraction':
    case 'TextProcessing':
    case 'HTTPRequest':
      return '#B7DAF7';

    case 'LLM':
      return '#E9EBED';
    case 'Plugin':
      return '#E7E1FF';
    case 'Workflow':
      return '#D0FFDB';
    case 'Output':
      return '#E7E1FF';
    default:
      return '#EEEEFF';
  }
};

const handleSpecialNodes = (node: ChildNode): Edge[] => {
  let edges: Edge[] = [];

  if (node.type === 'Condition') {
    edges =
      node.nodeConfig.conditionBranchConfigs?.flatMap((config) =>
        config.nextNodeIds.map((nextNodeId) => ({
          source: `${node.id}-${config.uuid}`,
          target: nextNodeId,
        })),
      ) || [];
  } else if (node.type === 'IntentRecognition') {
    edges =
      node.nodeConfig.intentConfigs?.flatMap((config) => {
        if (!config.nextNodeIds) config.nextNodeIds = [];
        return config.nextNodeIds.map((nextNodeId) => ({
          source: `${node.id}-${config.uuid}`,
          target: nextNodeId,
        }));
      }) || [];
  }

  return edges;
};

const getLoopEdges = (node: ChildNode) => {
  const edgeList = [];

  if (node.innerStartNodeId) {
    edgeList.push({
      source: `${node.id}-loop`,
      target: node.innerStartNodeId,
    });
  }
  if (node.innerEndNodeId) {
    edgeList.push({
      source: node.innerEndNodeId,
      target: `${node.id}-loop`,
    });
  }

  return edgeList;
};

// 递归获取节点的边
export const getEdges = (nodes: ChildNode[]): Edge[] => {
  // 筛选出普通节点和特定类型的节点（Condition 和 IntentRecognition）
  const edges = nodes.flatMap((node: ChildNode) => {
    if (
      (node.type === 'Condition' || node.type === 'IntentRecognition') &&
      node.nodeConfig
    ) {
      return handleSpecialNodes(node);
    } else if (node.nextNodeIds && node.nextNodeIds.length > 0) {
      return node.nextNodeIds.map((item) => ({
        source: node.id,
        target: item,
      }));
    } else if (node.type === 'Loop') {
      return getLoopEdges(node);
    }
    return [];
  });

  const edgeList = [...edges];

  // 使用 Set 来移除重复的边
  const uniqueEdges = new Set<string>();
  const resultEdges: Edge[] = [];

  edgeList.forEach((edge) => {
    const edgeKey = `${edge.source}-${edge.target}`;
    if (!uniqueEdges.has(edgeKey)) {
      uniqueEdges.add(edgeKey);
      resultEdges.push(edge);
    }
  });

  return resultEdges;
};
export const generatePorts = (data: ChildNode, height?: number) => {
  const basePortSize = 3;
  const isLoopNode = data.type === 'Loop'; // 新增 Loop 节点判断

  // 默认端口配置
  const defaultPortConfig = (
    group: 'in' | 'out',
    idSuffix: string,
    yPosition?: number | string,
  ) => ({
    group,
    id: `${data.id}-${idSuffix}`,
    zIndex: 99,
    attrs: {
      circle: {
        r: basePortSize,
        magnet: true,
        stroke: '#5F95FF',
        strokeWidth: 2,
        fill: '#5F95FF',
      },
    },
    args: yPosition ? { y: yPosition } : {},
  });

  let inputPorts = [defaultPortConfig('in', 'in')];
  let outputPorts = [defaultPortConfig('out', 'out')];

  switch (data.type) {
    case 'Start':
      inputPorts = [];
      break;
    case 'End':
      outputPorts = [];
      break;
    case 'Condition':
    case 'IntentRecognition': {
      // 假设 heights 数组与 conditionBranchConfigs 的顺序一致
      const configs =
        data.nodeConfig?.conditionBranchConfigs ||
        data.nodeConfig.intentConfigs ||
        [];
      inputPorts = [
        { ...defaultPortConfig('in', `in`, height ? height / 2 : '50%') },
      ];

      outputPorts = configs.map((item, index) => ({
        ...defaultPortConfig('out', `${item.uuid || index}-out`),
        args: {
          y: index * 40 + 100, // 根据需要调整垂直位置
        },
      }));
      break;
    }
    default:
      break;
  }

  return {
    groups: {
      // 通用端口组配置
      in: {
        position: 'left',
        attrs: { circle: { r: basePortSize } },
        connectable: {
          source: false, // 禁止作为连接源
          target: true, // 允许作为连接目标
          ...(isLoopNode && {
            source: true, // Loop 的左侧允许内部连出
            target: true, // 同时允许外部连入
          }),
        },
      },
      out: {
        position: 'right',
        attrs: { circle: { r: basePortSize } },
        connectable: {
          source: true, // 允许作为连接源
          target: false, // 禁止作为连接目标
          ...(isLoopNode && {
            target: true, // Loop 的右侧允许内部连入
          }),
        },
      },
    },
    items: [...outputPorts, ...inputPorts],
  };
};

// 计算当前的数据的长度
export const getLength = (
  oldData: ChildNode,
  newData: ChildNode,
  key: 'conditionBranchConfigs' | 'intentConfigs',
) => {
  const _oldLength = oldData.nodeConfig?.[key]?.length || 0;
  const _newLength = newData.nodeConfig?.[key]?.length || 0;
  if (_oldLength !== _newLength) {
    return _newLength;
  } else {
    return null;
  }
};

/**
 * 控制连接桩（ports）的显示与隐藏及大小变化
 * @param ports - 查询到的所有连接桩元素
 * @param show - 是否显示连接桩
 * @param enlargePortId - 放大的特定连接桩ID（可选）
 */
export const modifyPorts = (
  ports: NodeListOf<SVGElement>,
  isEnter: boolean,
  enlargePortId?: string,
) => {
  ports.forEach((port) => {
    const portId = port.getAttribute('port')!;
    const isTarget = portId === enlargePortId;

    // 始终显示连接桩
    port.style.visibility = 'visible';

    // 调整大小
    if (isEnter && isTarget) {
      port.setAttribute('width', '12'); // 放大尺寸
      port.setAttribute('height', '12');
      port.style.fill = '#5F95FF'; // 悬停颜色
    } else {
      port.setAttribute('width', '8'); // 默认尺寸
      port.setAttribute('height', '8');
      port.style.fill = '#A2B1C3'; // 默认颜色
    }
  });
};

//
