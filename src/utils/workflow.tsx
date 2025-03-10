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
import { adjustParentSize } from '@/utils/graph';
import { Graph, Node } from '@antv/x6';
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

// 处理 Condition 和 IntentRecognition 节点的边
const handleSpecialNodes = (node: ChildNode, isLoopNode: boolean): Edge[] => {
  if (!node.nodeConfig) return [];
  // 是否是循环内的节点

  let configs;
  switch (node.type) {
    case 'Condition':
      configs = node.nodeConfig.conditionBranchConfigs;
      break;
    case 'IntentRecognition':
      configs = node.nodeConfig.intentConfigs;
      break;
    default:
      configs = node.nodeConfig.options;
      break;
  }

  return (
    configs?.flatMap((config) => {
      if (!config.nextNodeIds) config.nextNodeIds = [];
      return config.nextNodeIds.map((nextNodeId) => ({
        source: `${node.id}-${config.uuid}`,
        target: nextNodeId.toString(),
        zIndex: isLoopNode ? 15 : 1,
      }));
    }) || []
  );
};

// 处理 Loop 节点的边
const handleLoopEdges = (node: ChildNode): Edge[] => {
  const edges: Edge[] = [];

  if (node.innerStartNodeId && node.innerStartNodeId !== -1) {
    edges.push({
      source: `${node.id}-in`, // Loop 节点的 in 端口连接到内部起始节点
      target: node.innerStartNodeId.toString(),
      zIndex: 15, // 新增层级设置
    });
  }

  if (node.innerEndNodeId && node.innerEndNodeId !== -1) {
    edges.push({
      source: node.innerEndNodeId.toString(),
      target: `${node.id}-out`, // 内部结束节点连接到 Loop 节点的 out 端口
      zIndex: 15, // 新增层级设置
    });
  }

  return edges;
};

// 递归获取节点的边
export const getEdges = (nodes: ChildNode[]): Edge[] => {
  const allEdges: Edge[] = nodes.flatMap((node) => {
    let isLoopNode: boolean = false;
    if (node.loopNodeId) {
      isLoopNode = true;
    }
    if (
      node.type === 'Condition' ||
      node.type === 'IntentRecognition' ||
      (node.type === 'QA' && node.nodeConfig.answerType === 'SELECT')
    ) {
      return handleSpecialNodes(node, isLoopNode);
    } else if (node.type === 'Loop') {
      return handleLoopEdges(node);
    } else if (node.nextNodeIds && node.nextNodeIds.length > 0) {
      return node.nextNodeIds.map((nextNodeId) => {
        return {
          source: Number(node.id).toString(),
          target: Number(nextNodeId).toString(),
          zIndex: isLoopNode ? 15 : 1,
        };
      });
    }

    return [];
  });

  // 过滤目标节点不存在的边（新增过滤逻辑）
  const validEdges = allEdges.filter((edge) => {
    // 检查目标节点是否存在于节点列表中
    return nodes.some((n) => edge.target.includes(n.id.toString()));
  });
  console.log(validEdges);
  // 使用 Set 来移除重复的边
  const uniqueEdges = new Set<string>();
  const resultEdges: Edge[] = [];

  validEdges.forEach((edge) => {
    const edgeKey = `${edge.source}-${edge.target}`;
    if (!uniqueEdges.has(edgeKey)) {
      uniqueEdges.add(edgeKey);
      resultEdges.push(edge);
    }
  });

  return resultEdges;
};

// 处理条件分支，意图识别，问答的高度
export const getHeight = (
  type: 'Condition' | 'IntentRecognition' | 'QA',
  length: number,
) => {
  switch (type) {
    case 'Condition': {
      return 42 + 28 * length;
    }
    case 'IntentRecognition': {
      return 42 + 18 * length;
    }
    case 'QA': {
      return 110 + 18 * length;
    }
  }
};

// 获取节点端口
export const generatePorts = (data: ChildNode, height?: number) => {
  const basePortSize = 4;
  const isLoopNode = data.type === 'Loop'; // 判断是否为 Loop 节点

  // 默认端口配置
  const defaultPortConfig = (
    group: 'in' | 'out',
    idSuffix: string,
    yPosition?: number | string,
  ) => ({
    group,
    id: `${data.id}-${idSuffix}`,
    zIndex: 99,
    position: {
      name: 'absolute', // 确保使用绝对定位
    },
    magnet: true,
    args: yPosition !== undefined ? { y: yPosition } : {}, // 直接作为顶级属性
    attrs: {
      circle: {
        r: basePortSize,
        magnet: true,
        stroke: '#5F95FF',
        strokeWidth: 2,
        fill: '#5F95FF',
        pointerEvents: 'all', // 强制启用指针事件
        event: 'mouseenter', // 明确事件类型
        // 新增磁吸区域扩展
        magnetRadius: 50, // 将磁吸半径从默认15px增大到24px
      },
    },
  });

  let inputPorts = [defaultPortConfig('in', 'in')];
  let outputPorts = [defaultPortConfig('out', 'out')];

  switch (data.type) {
    case 'Start':
      inputPorts = []; // Start 节点没有输入端口
      break;
    case 'End':
      outputPorts = []; // End 节点没有输出端口
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
      const baseY = 32; // 节点头部固定高度
      const itemHeight = data.type === 'Condition' ? 28 : 18; // 每个条件项高度
      outputPorts = configs.map((item, index) => ({
        ...defaultPortConfig('out', `${item.uuid || index}-out`),
        args: {
          y: baseY + index * itemHeight + itemHeight / 2,
        },
      }));
      break;
    }
    case 'QA': {
      const type = data.nodeConfig.answerType;
      const configs = data.nodeConfig?.options;
      if (type === 'SELECT') {
        outputPorts = (configs || []).map((item, index) => ({
          ...defaultPortConfig('out', `${item.uuid || index}-out`),
          args: {
            y: 110 + index * 18 + 9,
          },
        }));
      } else {
        outputPorts = [{ ...defaultPortConfig('out', `out`, '50%') }];
      }
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
          source: isLoopNode, // Loop 节点的 in 端口允许作为 source
          target: true, // 非 Loop 节点的 in 端口只能作为 target
        },
      },
      out: {
        position: 'right',
        attrs: { circle: { r: basePortSize } },
        connectable: {
          source: true, // 非 Loop 节点的 out 端口只能作为 source
          target: isLoopNode, // Loop 节点的 out 端口允许作为 target
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
  key: 'conditionBranchConfigs' | 'intentConfigs' | 'options',
) => {
  console.log(key);
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

// 辅助函数：生成随机坐标
function getRandomPosition(maxWidth = 800, maxHeight = 600) {
  return {
    x: Math.random() * (maxWidth - 304), // 减去节点宽度以避免超出边界
    y: Math.random() * (maxHeight - 83), // 减去节点高度以避免超出边界
  };
}

// 生成主节点
export const createBaseNode = (node: ChildNode) => {
  const extension = node.nodeConfig?.extension || {};
  return {
    id: node.id,
    shape: node.type === 'Loop' ? 'loop-node' : 'general-Node',
    x: extension.x ?? getRandomPosition().x,
    y: extension.y ?? getRandomPosition().y,
    width: extension.width || 304,
    height: extension.height || 83,
    label: node.name,
    data: node,
    ports: generatePorts(node),
    zIndex: 3,
  };
};
// 生成循环的子节点
export const createChildNode = (parentId: string, child: ChildNode) => {
  const ext = child.nodeConfig?.extension || {};
  return {
    id: child.id.toString(),
    shape: 'general-Node',
    x: ext.x,
    y: ext.y,
    width: ext.width || 304,
    height: ext.height || 83,
    label: child.name,
    data: {
      ...child, // 先展开原有数据
      nodeConfig: {
        ...child.nodeConfig,
        extension: ext, // 保持扩展属性合并
      },
      parentId, // 最后显式覆盖parentId字段
    },
    ports: generatePorts(child),
    zIndex: 5,
  };
};

// 构造边
export const createEdge = (edge: Edge) => {
  const parseEndpoint = (endpoint: string, type: string) => {
    const isLoop = endpoint.includes('in') || endpoint.includes('out');
    const isNotGraent = endpoint.includes('-');
    return {
      cell: isLoop || isNotGraent ? endpoint.split('-')[0] : endpoint,
      port: isLoop ? endpoint : `${endpoint}-${type}`,
    };
  };

  return {
    shape: 'edge',
    router: { name: 'orth' },
    attrs: { line: { stroke: '#A2B1C3', strokeWidth: 1 } },
    source: parseEndpoint(edge.source, 'out'),
    target: parseEndpoint(edge.target, 'in'),
    zIndex: edge.zIndex,
  };
};

export const processLoopNode = (loopNode: Node, graph: Graph) => {
  const data = loopNode.getData();
  if (!data.innerNodes?.length) return;

  data.innerNodes.forEach((childDef: ChildNode) => {
    const child = createChildNode(data.id.toString(), childDef); // 创建子节点配置
    const childNode = graph.addNode(child); // 添加子节点到图中

    // 确保子节点的父节点 ID 被正确设置
    childNode.setData({
      ...childDef,
      parentId: loopNode.id, // 显式设置父节点 ID
    });

    // 将子节点添加到父节点中
    loopNode.addChild(childNode);
  });

  adjustParentSize(loopNode); // 初始调整父节点大小
};
