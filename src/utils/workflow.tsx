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
import { ChildNode, Edge } from '@/types/interfaces/graph';

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
    case 'KnowledgeBase':
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
    case 'KnowledgeBase':
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

// 递归获取节点的边
export const getEdges = (nodes: ChildNode[]): Edge[] => {
  // 查找出有边的普通节点
  const edges = nodes
    .filter((node) => node.nextNodeIds && node.nextNodeIds.length > 0)
    .flatMap((node) =>
      (node.nextNodeIds || []).map((item) => ({
        source: node.id,
        target: item,
      })),
    );
  // 筛选出意图识别和条件分支
  const edges2 = nodes
    .filter(
      (node) => node.type === 'Condition' || node.type === 'IntentRecognition',
    )
    .flatMap((item) => {
      if (item.type === 'Condition') {
        // 对于条件节点，遍历所有条件分支配置
        return (
          item.nodeConfig.conditionBranchConfigs?.flatMap((item2) => {
            // 对于每个nextNodeId，创建一个新的边对象
            return (
              item2.nextNodeIds.map((nextNodeId) => ({
                source: `${item.id}-${item2.uuid}`, // 使用当前条件分支的索引作为source的一部分
                target: nextNodeId, // 使用nextNodeId作为target
              })) || []
            );
          }) || []
        );
      } else {
        console.log(item.nodeConfig);
        // 对于意图识别节点，直接返回单条边
        return (
          item.nodeConfig.intentConfigs?.flatMap((item2) => {
            if (!item2.nextNodeIds) item2.nextNodeIds = [];
            // 对于每个nextNodeId，创建一个新的边对象
            return (
              item2.nextNodeIds.map((nextNodeId) => ({
                source: `${item.id}-${item2.uuid}`, // 使用当前条件分支的索引作为source的一部分
                target: nextNodeId, // 使用nextNodeId作为target
              })) || []
            );
          }) || []
        );
      }
    });

  const edgeList = [...edges, ...edges2];

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

export const generatePorts = (data: ChildNode) => {
  let outputPorts;

  const basePortSize = 5; // 设置基础端口大小为5

  if (data.type === 'Condition' || data.type === 'IntentRecognition') {
    const configs =
      data.nodeConfig?.conditionBranchConfigs ||
      data.nodeConfig?.intentConfigs ||
      [];
    outputPorts = configs.map((item) => ({
      group: 'out',
      id: `${data.id}-${item.uuid}-out`, // 给每个端口一个唯一的名称
      zIndex: 99, // 确保连接桩的层级高于边
      attrs: {
        circle: {
          r: basePortSize, // 使用较小的基础端口大小
          magnet: true,
          stroke: '#5F95FF',
          strokeWidth: 2,
          fill: 'transparent', // 保持透明以增大点击区域但不影响外观大小
        },
      },
    }));
  } else {
    outputPorts = [
      {
        group: 'out',
        id: `${data.id}-out`,
        zIndex: 99, // 确保连接桩的层级高于边
        attrs: {
          circle: {
            r: basePortSize, // 使用较小的基础端口大小
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 2,
            fill: 'transparent', // 保持透明以增大点击区域但不影响外观大小
          },
        },
      },
    ];
  }

  return {
    groups: {
      out: {
        position: 'right',
        attrs: {
          circle: {
            r: basePortSize, // 统一端口大小
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff', // 这里可以使用非透明颜色来匹配视觉效果
          },
        },
        connectable: {
          source: true,
          target: false,
        },
      },
      in: {
        position: 'left',
        attrs: {
          circle: {
            r: basePortSize, // 统一端口大小
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 1,
            fill: '#fff', // 这里可以使用非透明颜色来匹配视觉效果
          },
        },
        connectable: {
          source: false,
          target: true,
        },
      },
    },
    items: [
      ...outputPorts, // 添加所有输出端口
      {
        group: 'in',
        id: `${data.id}-in`,
        zIndex: 99, // 确保连接桩的层级高于边
        attrs: {
          circle: {
            r: basePortSize, // 使用较小的基础端口大小
            magnet: true,
            stroke: '#5F95FF',
            strokeWidth: 2,
            fill: 'transparent', // 保持透明以增大点击区域但不影响外观大小
          },
        },
      }, // 默认的输入端口
    ],
  };
};

/**
 * 控制连接桩（ports）的显示与隐藏及大小变化
 * @param ports - 查询到的所有连接桩元素
 * @param show - 是否显示连接桩
 * @param enlargePortId - 放大的特定连接桩ID（可选）
 */
export const modifyPorts = (
  ports: NodeListOf<SVGElement>,
  show: boolean,
  enlargePortId?: string,
) => {
  for (let i = 0, len = ports.length; i < len; i += 1) {
    const port = ports[i];
    const portId = port.getAttribute('port');

    if (show && portId) {
      port.style.visibility = 'visible';
      if (enlargePortId && portId === enlargePortId) {
        // 放大并填充指定的连接桩
        port.setAttribute('r', '10'); // 放大指定的连接桩
        port.setAttribute('fill', '#5F95FF'); // 设置填充颜色为黑色（或任何其他颜色）
      } else {
        port.setAttribute('r', '5'); // 其他连接桩保持默认大小
        port.setAttribute('fill', 'none'); // 清除填充，保留空心效果
      }
    } else {
      port.style.visibility = 'hidden';
    }
  }
};

//
