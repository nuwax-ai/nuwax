import {
  ICON_END,
  ICON_NEW_AGENT,
  ICON_START,
  ICON_WORKFLOW_CODE,
  ICON_WORKFLOW_CONDITION,
  ICON_WORKFLOW_DATABASE,
  ICON_WORKFLOW_DATABASEADD,
  ICON_WORKFLOW_DATABASEDELETE,
  ICON_WORKFLOW_DATABASEQUERY,
  ICON_WORKFLOW_DATABASEUPDATE,
  ICON_WORKFLOW_DOCUMENT_EXTRACTION,
  ICON_WORKFLOW_HTTP_REQUEST,
  ICON_WORKFLOW_INTENT_RECOGNITION,
  ICON_WORKFLOW_KNOWLEDGE_BASE,
  ICON_WORKFLOW_LLM,
  ICON_WORKFLOW_LONG_TERM_MEMORY,
  ICON_WORKFLOW_LOOP,
  ICON_WORKFLOW_LOOPBREAK,
  ICON_WORKFLOW_LOOPCONTINUE,
  ICON_WORKFLOW_MCP,
  ICON_WORKFLOW_OUTPUT,
  ICON_WORKFLOW_PLUGIN,
  ICON_WORKFLOW_QA,
  ICON_WORKFLOW_TEXT_PROCESSING,
  ICON_WORKFLOW_VARIABLE,
  ICON_WORKFLOW_WORKFLOW,
} from '@/constants/images.constants';
import {
  DEFAULT_NODE_CONFIG_MAP,
  EXCEPTION_NODES_TYPE,
} from '@/pages/Antv-X6/v3/constants/node.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  AnswerTypeEnum,
  HttpContentTypeEnum,
  HttpMethodEnum,
  NodeShapeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import {
  NodeSizeGetTypeEnum,
  PortGroupEnum,
  VariableConfigTypeEnum,
} from '@/types/enums/node';
import {
  ChildNode,
  Edge,
  GraphNodeSize,
  GraphNodeSizeGetParams,
  NodeMetadata,
} from '@/types/interfaces/graph';

import {
  ConditionBranchConfigs,
  IntentConfigs,
  NodeConfig,
  outputOrInputPortConfig,
  PortConfig,
  PortsConfig,
  QANodeOption,
} from '@/types/interfaces/node';
import { FileListItem } from '@/types/interfaces/workflow';
// 引用默认图标
import Agent from '@/assets/images/agent_image.png';
import Table from '@/assets/images/database_image.png';
import Knowledge from '@/assets/images/knowledge_image.png';
import Plugin from '@/assets/images/plugin_image.png';
import {
  default as Model,
  default as Page,
  default as Trigger,
  default as Variable,
  default as Workflow,
} from '@/assets/images/workflow_image.png';
import PlusIcon from '@/assets/svg/plus_icon.svg';

// import { getWidthAndHeight } from '@/utils/updateNode';
import { Graph, Node } from '@antv/x6';
import { FormInstance } from 'antd';
import {
  adjustParentSize,
  generatePortGroupConfig,
  showExceptionHandle,
  showExceptionPort,
} from './graphV3';

// 根据节点动态给予宽高
export const getWidthAndHeight = (node: ChildNode) => {
  const { type, nodeConfig } = node;
  const extension = nodeConfig?.extension || {};
  const { defaultWidth, defaultHeight } =
    DEFAULT_NODE_CONFIG_MAP[type as keyof typeof DEFAULT_NODE_CONFIG_MAP] ||
    DEFAULT_NODE_CONFIG_MAP.default;
  const hasExceptionHandleItem = EXCEPTION_NODES_TYPE.includes(type);
  const exceptionHandleItemHeight = 32;
  const extraHeight = hasExceptionHandleItem ? exceptionHandleItemHeight : 0;
  if (
    type === NodeTypeEnum.QA ||
    type === NodeTypeEnum.Condition ||
    type === NodeTypeEnum.IntentRecognition
  ) {
    return {
      width: defaultWidth,
      height: (extension.height || defaultHeight) + extraHeight,
    };
  }
  if (type === NodeTypeEnum.Loop) {
    return {
      width:
        extension.width && extension.width > defaultWidth
          ? extension.width
          : defaultWidth,
      height: (extension.height || defaultHeight) + extraHeight,
    };
  }

  // 通用节点
  return {
    width: defaultWidth,
    height: defaultHeight + extraHeight,
  }; // 通用节点的默认大小
};

const NODE_BOTTOM_PADDING = 10;
const NODE_BOTTOM_PADDING_AND_BORDER = NODE_BOTTOM_PADDING + 1;

const EXCEPTION_PORT_COLOR = '#e67e22';
const PORT_COLOR = '#5147FF';
const imageList = {
  Agent,
  Table,
  Knowledge,
  Plugin,
  Workflow,
  Trigger,
  Variable,
  Model,
  Page,
} as Partial<{
  [key in AgentComponentTypeEnum]: string;
}>;

export const getShape = (type: NodeTypeEnum) => {
  if (type === NodeTypeEnum.Loop) {
    return NodeShapeEnum.Loop;
  }
  return NodeShapeEnum.General;
};
// 根据type返回图片，用作技能和知识库等节点中的
export const getImg = (data: AgentComponentTypeEnum) => {
  return imageList[data];
};
// 根据type返回图片
export const returnImg = (type: NodeTypeEnum): React.ReactNode => {
  switch (type) {
    case NodeTypeEnum.Start:
    case NodeTypeEnum.LoopStart:
      return <ICON_START />;
    case NodeTypeEnum.End:
    case NodeTypeEnum.LoopEnd:
      return <ICON_END />;
    case NodeTypeEnum.Output:
      return <ICON_WORKFLOW_OUTPUT />;
    case NodeTypeEnum.Code:
      return <ICON_WORKFLOW_CODE />;
    case NodeTypeEnum.Condition:
      return <ICON_WORKFLOW_CONDITION />;
    // case 'Database':
    //   return <ICON_WORKFLOW_DATABASE />;
    case NodeTypeEnum.DocumentExtraction:
      return <ICON_WORKFLOW_DOCUMENT_EXTRACTION />;
    case NodeTypeEnum.HTTPRequest:
      return <ICON_WORKFLOW_HTTP_REQUEST />;
    case NodeTypeEnum.IntentRecognition:
      return <ICON_WORKFLOW_INTENT_RECOGNITION />;
    case NodeTypeEnum.Knowledge:
      return <ICON_WORKFLOW_KNOWLEDGE_BASE />;
    case NodeTypeEnum.LLM:
      return <ICON_WORKFLOW_LLM />;
    case NodeTypeEnum.LongTermMemory:
      return <ICON_WORKFLOW_LONG_TERM_MEMORY />;
    case NodeTypeEnum.Loop:
      return <ICON_WORKFLOW_LOOP />;
    case NodeTypeEnum.LoopContinue:
      return <ICON_WORKFLOW_LOOPCONTINUE />;
    case NodeTypeEnum.LoopBreak:
      return <ICON_WORKFLOW_LOOPBREAK />;
    case NodeTypeEnum.Plugin:
      return <ICON_WORKFLOW_PLUGIN />;
    case NodeTypeEnum.QA:
      return <ICON_WORKFLOW_QA />;
    case NodeTypeEnum.TextProcessing:
      return <ICON_WORKFLOW_TEXT_PROCESSING />;
    case NodeTypeEnum.Variable:
    case NodeTypeEnum.VariableAggregation:
      return <ICON_WORKFLOW_VARIABLE />;
    case NodeTypeEnum.Workflow:
      return <ICON_WORKFLOW_WORKFLOW />;
    case NodeTypeEnum.TableDataAdd:
      return <ICON_WORKFLOW_DATABASEADD />;
    case NodeTypeEnum.TableDataDelete:
      return <ICON_WORKFLOW_DATABASEDELETE />;
    case NodeTypeEnum.TableDataUpdate:
      return <ICON_WORKFLOW_DATABASEUPDATE />;
    case NodeTypeEnum.TableDataQuery:
      return <ICON_WORKFLOW_DATABASEQUERY />;
    case NodeTypeEnum.TableSQL:
      return <ICON_WORKFLOW_DATABASE />;
    case NodeTypeEnum.MCP:
      return <ICON_WORKFLOW_MCP />;
    default:
      return <ICON_NEW_AGENT />;
  }
};

// 根据type返回背景色
export const returnBackgroundColor = (type: NodeTypeEnum) => {
  switch (type) {
    case NodeTypeEnum.Start:
    case NodeTypeEnum.End:
      return '#EEEEFF';
    case NodeTypeEnum.Code:
    case NodeTypeEnum.Loop:
    case NodeTypeEnum.LoopContinue:
    case NodeTypeEnum.LoopBreak:
    case NodeTypeEnum.Condition:
    case NodeTypeEnum.IntentRecognition:
      return '#ebf9f9';
    case NodeTypeEnum.Knowledge:
    // case 'Database':
    case NodeTypeEnum.Variable:
    case NodeTypeEnum.VariableAggregation:
    case NodeTypeEnum.LongTermMemory:
    case NodeTypeEnum.MCP:
      return '#FFF0DF';
    case NodeTypeEnum.QA:
    case NodeTypeEnum.DocumentExtraction:
    case NodeTypeEnum.TextProcessing:
    case NodeTypeEnum.HTTPRequest:
      return '#fef9eb';

    case NodeTypeEnum.LLM:
      return '#E9EBED';
    case NodeTypeEnum.Plugin:
      return '#E7E1FF';
    case NodeTypeEnum.Workflow:
      return '#D0FFDB';
    case NodeTypeEnum.Output:
      return '#E7E1FF';
    default:
      return '#EEEEFF';
  }
};

export const getNodeSize = ({
  data,
  ports,
  type,
}: GraphNodeSizeGetParams): GraphNodeSize => {
  const isLoopNode = data.type === NodeTypeEnum.Loop;
  const { width: defaultWidth, height: defaultHeight } =
    getWidthAndHeight(data);

  const offsetY =
    ports[ports.length - 1]?.args?.offsetY ||
    defaultHeight - NODE_BOTTOM_PADDING_AND_BORDER;
  const nodeHeight = isLoopNode
    ? defaultHeight
    : offsetY + NODE_BOTTOM_PADDING_AND_BORDER;
  return {
    type,
    width: defaultWidth,
    height: nodeHeight,
  };
};

const _handleExceptionOutputPort = (
  data: ChildNode,
  outputPorts: outputOrInputPortConfig[],
  generatePortConfig: (config: PortConfig) => outputOrInputPortConfig,
): outputOrInputPortConfig[] => {
  const xWidth = getWidthAndHeight(data).width;
  const baseY = outputPorts[outputPorts.length - 1]?.args?.offsetY;

  const itemHeight = 24;
  if (showExceptionPort(data, PortGroupEnum.exception)) {
    // 如果当前节点支持异常展示，则添加异常端口
    return [
      ...outputPorts,
      generatePortConfig({
        group: PortGroupEnum.exception,
        idSuffix: `exception-out`,
        yHeight: baseY + NODE_BOTTOM_PADDING + itemHeight / 2,
        offsetY: baseY + itemHeight + NODE_BOTTOM_PADDING_AND_BORDER,
        xWidth,
        color: EXCEPTION_PORT_COLOR,
      }),
    ];
  } else if (showExceptionHandle(data) && outputPorts.length >= 1) {
    if (outputPorts.length === 1) {
      //如果包括异常项 而且只一个输出port，则需要调整port位置
      outputPorts[outputPorts.length - 1].args.y =
        (baseY + itemHeight + NODE_BOTTOM_PADDING_AND_BORDER + 1) / 2;
    }
    outputPorts[outputPorts.length - 1].args.offsetY =
      baseY + itemHeight + NODE_BOTTOM_PADDING_AND_BORDER; //同步offsetY 方便在更新节点高度时使用
    return outputPorts;
  } else {
    return outputPorts;
  }
};
// 获取节点端口
export const generatePorts = (data: ChildNode): PortsConfig => {
  const basePortSize = 3;
  const defaultNodeHeaderHeight = DEFAULT_NODE_CONFIG_MAP.default.defaultHeight;
  const defaultNodeHeaderWidth = getWidthAndHeight(data).width;
  // 默认端口配置
  const generatePortConfig = ({
    group,
    idSuffix,
    color = PORT_COLOR,
    yHeight = (defaultNodeHeaderHeight - 1) / 2 + 1,
    xWidth = idSuffix === 'in' ? 0 : defaultNodeHeaderWidth,
    offsetY = defaultNodeHeaderHeight - NODE_BOTTOM_PADDING_AND_BORDER,
    offsetX = xWidth,
  }: PortConfig): outputOrInputPortConfig => {
    return {
      group,
      markup: [
        {
          tagName: 'circle',
          selector: 'circle',
          attrs: {
            // @ts-ignore
            magnet: true, // 显式声明磁吸源
            pointerEvents: 'auto',
          },
        },
        {
          tagName: 'image',
          selector: 'icon',
          attrs: {
            // @ts-ignore
            magnet: false,
          },
        },
        {
          tagName: 'circle', // 隐藏的感应区域
          selector: 'hoverCircle',
          attrs: {
            r: basePortSize + 10, // 感应区域更大
            opacity: 0, // 完全透明
            pointerEvents: 'visiblePainted', // 允许鼠标事件
            zIndex: -1, // 置于底层，避免覆盖主要元素
            // @ts-ignore
            magnet: false,
          },
        },
      ],
      id: `${data.id}-${idSuffix}`,
      zIndex: 99,
      magnet: true,
      attrs: {
        circle: {
          r: basePortSize,
          magnet: true, // 必须设为 true 才能作为连接磁点
          stroke: color,
          fill: color,
          magnetRadius: 30, // 减小磁吸半径
          zIndex: 2, // 圆在上
        },
        icon: {
          xlinkHref: PlusIcon,
          magnet: false,
          width: 0,
          height: 0,
          fill: '#fff',
          zIndex: -2, // 图标在下面
          pointerEvents: 'none',
          opacity: 0, // 设置为完全透明
        },
      },
      args: {
        x: xWidth,
        y: yHeight,
        offsetY,
        offsetX,
      },
    };
  };

  let inputPorts = [
    generatePortConfig({ group: PortGroupEnum.in, idSuffix: 'in' }),
  ];
  let outputPorts: Array<ReturnType<typeof generatePortConfig>> = [];

  switch (data.type) {
    case NodeTypeEnum.Start:
      inputPorts = []; // Start 节点没有输入端口
      outputPorts = [
        generatePortConfig({ group: PortGroupEnum.out, idSuffix: 'out' }),
      ];
      break;
    case NodeTypeEnum.End:
      inputPorts = [
        generatePortConfig({
          group: PortGroupEnum.in,
          idSuffix: 'in',
        }),
      ];
      outputPorts = []; // End 节点没有输出端口
      break;
    case NodeTypeEnum.Condition:
    case NodeTypeEnum.IntentRecognition: {
      // 假设 heights 数组与 conditionBranchConfigs 的顺序一致
      const configs =
        data.nodeConfig?.conditionBranchConfigs ||
        data.nodeConfig.intentConfigs ||
        [];
      const baseY = defaultNodeHeaderHeight; // 节点头部固定高度
      const itemHeight = data.type === NodeTypeEnum.Condition ? 32 : 24; // 每个条件项高度
      const step = data.type === NodeTypeEnum.Condition ? 16 : 12;
      inputPorts = [
        {
          ...generatePortConfig({
            group: PortGroupEnum.in,
            idSuffix: 'in',
          }),
        },
      ];
      outputPorts = configs.map((item, index) => ({
        ...generatePortConfig({
          group: PortGroupEnum.special,
          idSuffix: `${item.uuid || index}-out`,
          yHeight: baseY + (index + 1) * itemHeight - step,
          xWidth: getWidthAndHeight(data).width,
          offsetY: baseY + (index + 1) * itemHeight,
        }),
      }));
      break;
    }
    case NodeTypeEnum.QA: {
      const type = data.nodeConfig.answerType;
      const configs = data.nodeConfig?.options;
      const itemHeight = 24;
      const step = 12;
      let baseY = defaultNodeHeaderHeight; // 节点头部固定高度
      if (type === AnswerTypeEnum.SELECT) {
        baseY += itemHeight * 3; //第四项才输出port
        outputPorts = (configs || []).map((item, index) => ({
          ...generatePortConfig({
            group: PortGroupEnum.special,
            idSuffix: `${item.uuid || index}-out`,
            yHeight: baseY + (index + 1) * itemHeight - step,
            xWidth: getWidthAndHeight(data).width,
            offsetY: baseY + (index + 1) * itemHeight,
          }),
        }));
      } else {
        baseY += itemHeight * 2; //第三项才输出port
        outputPorts = [
          {
            ...generatePortConfig({
              group: PortGroupEnum.out,
              idSuffix: 'out',
              yHeight: baseY + itemHeight - step,
              xWidth: getWidthAndHeight(data).width,
              offsetY: baseY + itemHeight,
            }),
          },
        ];
      }
      break;
    }
    default:
      inputPorts = [
        generatePortConfig({
          group: PortGroupEnum.in,
          idSuffix: 'in',
        }),
      ];
      outputPorts = [
        generatePortConfig({ group: PortGroupEnum.out, idSuffix: 'out' }),
      ];
      break;
  }
  outputPorts = _handleExceptionOutputPort(
    data,
    outputPorts,
    generatePortConfig,
  ); // 处理异常输出端口
  return {
    groups: generatePortGroupConfig(basePortSize, data),
    items: [...inputPorts, ...outputPorts],
  };
};

// 计算当前的数据的长度
export const getLength = (
  oldData: ChildNode,
  newData: ChildNode,
  key: 'conditionBranchConfigs' | 'intentConfigs' | 'options',
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

// 辅助函数：生成随机坐标
function getRandomPosition(maxWidth = 800, maxHeight = 600) {
  return {
    x: Math.random() * (maxWidth - 300), // 减去节点宽度以避免超出边界
    y: Math.random() * (maxHeight - 83), // 减去节点高度以避免超出边界
  };
}

// 生成主节点
export const createBaseNode = (node: ChildNode): NodeMetadata => {
  const extension = node.nodeConfig?.extension || {};
  const isLoopChild = node.loopNodeId;
  const ports = generatePorts(node);
  const { width, height } = getNodeSize({
    data: node,
    ports: ports.items,
    type: NodeSizeGetTypeEnum.create,
  });
  return {
    id: node.id.toString(),
    shape: getShape(node.type),
    x: extension.x ?? getRandomPosition().x,
    y: extension.y ?? getRandomPosition().y,
    width,
    height,
    label: node.name,
    data: { ...node, parentId: null },
    ports: generatePorts(node),
    zIndex: isLoopChild ? 6 : 3,
  };
};
// 生成循环的子节点
export const createChildNode = (
  parentId: string | null,
  child: ChildNode,
): NodeMetadata => {
  const ext = child.nodeConfig?.extension || {};
  const ports = generatePorts(child);
  const { width, height } = getNodeSize({
    data: child,
    ports: ports.items,
    type: NodeSizeGetTypeEnum.create,
  });
  return {
    id: child.id.toString(),
    shape: getShape(child.type),
    x: ext.x,
    y: ext.y,
    width: width,
    height: height,
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
    zIndex: 6,
    inherit: false, // 禁止继承父节点层级设置
  };
};

// 构造边
export const createEdge = (edge: Edge) => {
  if (edge.source === edge.target) return;
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
    attrs: {
      line: {
        stroke: '#5147FF',
        strokeWidth: 1,
      },
    },
    source: parseEndpoint(edge.source, 'out'),
    target: parseEndpoint(edge.target, 'in'),
    zIndex: edge.zIndex || 1,
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

// 三个特殊节点处理nextIndex
export const handleSpecialNodesNextIndex = (
  node: ChildNode,
  uuid: string,
  id: number,
  targetNode?: ChildNode,
): ChildNode => {
  let configs: ConditionBranchConfigs[] | IntentConfigs[] | QANodeOption[];
  switch (node.type) {
    case 'Condition': {
      configs = node.nodeConfig
        ?.conditionBranchConfigs as ConditionBranchConfigs[];
      break;
    }
    case 'IntentRecognition': {
      configs = node.nodeConfig?.intentConfigs as IntentConfigs[];
      break;
    }
    case 'QA': {
      configs = node.nodeConfig?.options as QANodeOption[];
      break;
    }
    default: {
      configs = [];
      break;
    }
  }
  configs.forEach((config) => {
    const nextNodeIds = config.nextNodeIds || []; // 获取当前配置的 nextNodeIds 数组
    if (uuid.includes(config.uuid)) {
      if (targetNode) {
        // 这里需要将原来的nextNodeIds中和targetId相同的元素替换成id
        config.nextNodeIds = nextNodeIds.map((item: number) => {
          if (item === targetNode.id) {
            return id; // 替换为新的id
          } else {
            return item; // 保持不变
          }
        });
      } else {
        config.nextNodeIds = [...nextNodeIds, id];
      }
    }
  });

  const newNode = {
    ...node,
    nodeConfig: {
      ...node.nodeConfig,
      // 根据节点类型更新对应的配置数组
      ...(node.type === NodeTypeEnum.Condition && {
        conditionBranchConfigs: configs,
      }),
      ...(node.type === NodeTypeEnum.IntentRecognition && {
        intentConfigs: configs,
      }),
      ...(node.type === NodeTypeEnum.QA && { options: configs }),
    } as NodeConfig,
  };
  return newNode;
};

// 从特殊节点的配置中移除目标节点ID（handleSpecialNodesNextIndex的反向操作）
export const removeFromSpecialNodesNextIndex = (
  node: ChildNode,
  portId: string,
  targetId: number,
): ChildNode => {
  // 从 portId 中提取 uuid（格式: {nodeId}-{uuid}-out）
  const segments = portId.split('-');
  const uuid = segments.slice(1, -1).join('-'); // 移除 nodeId 和 out

  let configs: ConditionBranchConfigs[] | IntentConfigs[] | QANodeOption[];
  switch (node.type) {
    case 'Condition': {
      configs = node.nodeConfig
        ?.conditionBranchConfigs as ConditionBranchConfigs[];
      break;
    }
    case 'IntentRecognition': {
      configs = node.nodeConfig?.intentConfigs as IntentConfigs[];
      break;
    }
    case 'QA': {
      configs = node.nodeConfig?.options as QANodeOption[];
      break;
    }
    default: {
      configs = [];
      break;
    }
  }

  configs?.forEach((config) => {
    if (uuid.includes(config.uuid)) {
      // 从 nextNodeIds 中移除目标节点ID
      config.nextNodeIds = (config.nextNodeIds || []).filter(
        (id: number) => id !== targetId,
      );
    }
  });

  const newNode = {
    ...node,
    nodeConfig: {
      ...node.nodeConfig,
      // 根据节点类型更新对应的配置数组
      ...(node.type === NodeTypeEnum.Condition && {
        conditionBranchConfigs: configs,
      }),
      ...(node.type === NodeTypeEnum.IntentRecognition && {
        intentConfigs: configs,
      }),
      ...(node.type === NodeTypeEnum.QA && { options: configs }),
    } as NodeConfig,
  };
  return newNode;
};

// 三个特殊节点处理nextIndex
export const handleExceptionNodesNextIndex = ({
  sourceNode,
  id,
  targetNodeId,
}: {
  sourceNode: ChildNode;
  id: number;
  targetNodeId?: number;
}): ChildNode => {
  let exceptionHandleNodeIds: number[] = [
    ...(sourceNode.nodeConfig?.exceptionHandleConfig?.exceptionHandleNodeIds ||
      []),
  ];
  if (targetNodeId) {
    // 这里需要将原来的nextNodeIds中和targetId相同的元素替换成id
    exceptionHandleNodeIds = exceptionHandleNodeIds.map((item: number) => {
      if (item === targetNodeId) {
        return id; // 替换为新的id
      } else {
        return item; // 保持不变
      }
    });
  } else {
    exceptionHandleNodeIds = [...exceptionHandleNodeIds, id];
  }

  const newNode = {
    ...sourceNode,
    nodeConfig: {
      ...sourceNode.nodeConfig,
      exceptionHandleConfig: {
        ...sourceNode.nodeConfig.exceptionHandleConfig,
        exceptionHandleNodeIds,
      },
    } as NodeConfig,
  };
  return newNode;
};

// 连接桩和边便捷添加节点
export const QuicklyCreateEdgeConditionConfig = (
  newNodeData: ChildNode,
  targetNode: ChildNode,
) => {
  const nodeData = JSON.parse(JSON.stringify(newNodeData));
  let _arr =
    nodeData.nodeConfig?.conditionBranchConfigs ||
    nodeData.nodeConfig?.intentConfigs;

  // 如果配置数组不存在或为空，返回空结果（节点可能刚创建还没有配置）
  if (!_arr || _arr.length === 0) {
    console.warn(
      '[QuicklyCreateEdgeConditionConfig] 条件/意图配置为空，跳过连线',
    );
    return { nodeData, sourcePortId: '' };
  }

  _arr[0].nextNodeIds = [targetNode.id];
  // 获取端口的id
  let sourcePortId: string = `${nodeData.id}-${_arr[0].uuid}`;
  if (newNodeData.type === 'Condition') {
    nodeData.nodeConfig.conditionBranchConfigs = _arr;
  } else {
    nodeData.nodeConfig.intentConfigs = _arr;
  }
  return { nodeData, sourcePortId };
};

export const setFormDefaultValues = ({
  type,
  nodeConfig,
  form,
}: {
  type: NodeTypeEnum;
  nodeConfig: NodeConfig;
  form: FormInstance;
}) => {
  switch (type) {
    case NodeTypeEnum.HTTPRequest: {
      if (!nodeConfig.method) {
        form.setFieldValue('method', HttpMethodEnum.GET);
      }
      if (!nodeConfig.contentType) {
        form.setFieldValue('contentType', HttpContentTypeEnum.OTHER);
      }
      if (!nodeConfig.timeout) {
        form.setFieldValue('timeout', 30);
      }
      break;
    }
    case NodeTypeEnum.Variable: {
      if (!nodeConfig.configType) {
        form.setFieldValue('configType', VariableConfigTypeEnum.SET_VARIABLE);
      }
      break;
    }
    case NodeTypeEnum.QA: {
      if (!nodeConfig.answerType) {
        form.setFieldValue('answerType', AnswerTypeEnum.TEXT);
      }
      break;
    }
    default:
      break;
  }
};

export const handleDisplayValue = (value: any, dataType: string) => {
  if (dataType && dataType?.includes('File')) {
    // 文件类型
    const isMultiple = dataType?.startsWith('Array_') ?? false; // 是否是数组类型
    if (isMultiple) {
      return JSON.stringify(value?.map((item: any) => item?.url) || []); // 数组类型返回url数组
    } else {
      return value?.url; // 单个文件返回url
    }
  }
  if (typeof value !== 'string' && value !== null) {
    return JSON.stringify(value);
  }
  return value;
};

export const handleFileDataConvert = (
  sourceFileInfo: FileListItem | FileListItem[] | null = null,
  dataType: string,
): string | string[] => {
  let results;
  const isMultiple = dataType?.startsWith('Array_') ?? false;
  if (isMultiple) {
    results =
      Array.isArray(sourceFileInfo) && sourceFileInfo?.length > 0
        ? sourceFileInfo?.map((item: FileListItem) => item?.url)
        : [];
  } else {
    // 单个文件类型，需要检查 sourceFileInfo 是否为数组
    if (Array.isArray(sourceFileInfo)) {
      // 如果是数组但期望单个文件，取第一个元素
      results = sourceFileInfo?.[0]?.url || '';
    } else {
      // 单个文件对象
      results = sourceFileInfo?.url || '';
    }
  }
  return results;
};

export const getWorkflowTestRun = ({
  spaceId,
  workflowId,
}: {
  spaceId: number;
  workflowId: number;
}): string => {
  return localStorage.getItem(`testRun_${spaceId}_${workflowId}`) || '';
};

export const setWorkflowTestRun = ({
  spaceId,
  workflowId,
  value,
}: {
  spaceId: number;
  workflowId: number;
  value: string;
}) => {
  localStorage.setItem(`testRun_${spaceId}_${workflowId}`, value);
};

export const removeWorkflowTestRun = ({
  spaceId,
  workflowId,
}: {
  spaceId: number;
  workflowId: number;
}) => {
  if (localStorage.getItem('testRun')) {
    //清除历史数据
    localStorage.removeItem('testRun');
  }
  localStorage.removeItem(`testRun_${spaceId}_${workflowId}`);
};
