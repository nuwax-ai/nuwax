import { t } from '@/services/i18nRuntime';
import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { UpdateEdgeType } from '@/types/enums/node';
import { BindEventHandlers, ChildNode } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { cloneDeep } from '@/utils/common';
import { Edge } from '@antv/x6';
import {
  getPortGroup,
  isEdgeDeletable,
  showExceptionPort,
} from '../utils/graphV3';
const isResistNodeType = [
  NodeTypeEnum.Start,
  NodeTypeEnum.End,
  NodeTypeEnum.LoopStart,
  NodeTypeEnum.LoopEnd,
];
/**
 * Bind graph editor event handlers.
 * @param graph - AntV X6 graph instance
 * @returns cleanup function
 */
const bindEventHandlers = ({
  graph,
  changeEdgeConfigWithRefresh,
  copyNode,
  changeNodeConfigWithRefresh,
  removeNode,
  modal,
  message,
}: BindEventHandlers) => {
  // Store copied node data for repeated paste.
  let copiedNodeData: ChildNode | null = null;
  // Paste counter for cumulative offset.
  let pasteCount = 0;

  // Hotkey: copy selected cell.
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells();
    if (cells.length) {
      const node = cells[0];
      if (node.isNode()) {
        const nodeData = node.getData();
        // Skip non-copyable node types.
        if (
          nodeData.type === NodeTypeEnum.LoopStart ||
          nodeData.type === NodeTypeEnum.LoopEnd ||
          nodeData.type === NodeTypeEnum.Loop ||
          nodeData.type === NodeTypeEnum.Start ||
          nodeData.type === NodeTypeEnum.End
        ) {
          message.warning(
            t('PC.Pages.AntvX6EventHandlers.unsupportedCopyNodeType'),
          );
          // Clear cached node data to avoid invalid paste.
          copiedNodeData = null;
          pasteCount = 0;
          return false;
        }
        // Cache copied node data.
        copiedNodeData = cloneDeep(nodeData);
        // Reset paste count.
        pasteCount = 0;
        graph.copy(cells);
        message.success(t('PC.Pages.AntvX6EventHandlers.nodeCopied'));
      }
    }
    return false;
  });

  // Hotkey: paste copied cell.
  graph.bindKey(['meta+v', 'ctrl+v'], () => {
    // Prefer cached node data.
    if (copiedNodeData) {
      pasteCount++;
      const offset = pasteCount * 30;
      copyNode(copiedNodeData, { x: offset, y: offset });
    } else if (!graph.isClipboardEmpty()) {
      // Fallback to selected cell for compatibility.
      const cells = graph.getSelectedCells();
      if (cells && cells.length > 0) {
        const node = cells[0].getData();
        if (
          node.type === NodeTypeEnum.LoopStart ||
          node.type === NodeTypeEnum.LoopEnd ||
          node.type === NodeTypeEnum.Loop
        ) {
          message.error(t('PC.Pages.AntvX6EventHandlers.cannotPasteLoopNode'));
          return;
        }
        if (node.type === NodeTypeEnum.Start) {
          message.error(t('PC.Pages.AntvX6EventHandlers.cannotPasteStartNode'));
          return;
        }
        if (node.type === NodeTypeEnum.End) {
          message.error(t('PC.Pages.AntvX6EventHandlers.cannotPasteEndNode'));
          return;
        }
        copyNode(node);
      }
    } else {
      message.warning(t('PC.Pages.AntvX6EventHandlers.copyNodeFirst'));
    }
    return false;
  });

  const handleSpecialNodeEdge = (cells: any[]): void => {
    const _cell = cells[0];
    const _targetNodeId = _cell.getTargetNode()?.id;
    const sourceNode = _cell.getSourceNode()?.getData();
    const _index: string = _cell.getSourcePortId() as string;

    // Update current node data.
    const newNodeParams = JSON.parse(JSON.stringify(sourceNode));
    if (sourceNode.type === NodeTypeEnum.Condition) {
      for (let item of newNodeParams.nodeConfig.conditionBranchConfigs) {
        if (_index.includes(item.uuid)) {
          item.nextNodeIds = item.nextNodeIds.filter((item: number) => {
            return item !== Number(_targetNodeId);
          });
        }
      }
    } else if (sourceNode.type === NodeTypeEnum.QA) {
      if (newNodeParams.nodeConfig.answerType === AnswerTypeEnum.SELECT) {
        for (let item of newNodeParams.nodeConfig.options) {
          if (_index.includes(item.uuid)) {
            item.nextNodeIds = item.nextNodeIds.filter((item: number) => {
              return item !== Number(_targetNodeId);
            });
          }
        }
      } else {
        changeEdgeConfigWithRefresh({
          type: UpdateEdgeType.deleted,
          targetId: _targetNodeId as string,
          sourceNode,
          id: '0',
        });
        graph.removeCells(cells);
        return;
      }
    } else {
      for (let item of newNodeParams.nodeConfig.intentConfigs) {
        if (_index.includes(item.uuid)) {
          item.nextNodeIds = item.nextNodeIds.filter((item: number) => {
            return item !== Number(_targetNodeId);
          });
        }
      }
    }
    changeNodeConfigWithRefresh({
      nodeData: newNodeParams,
      targetNodeId: _targetNodeId?.toString(),
    });
  };
  const _handleExceptionItemEdgeRemove = (
    edge: Edge,
    doSuccess: (newNodeParams: ChildNode) => void,
  ): boolean => {
    // Read edge source/target ports.
    const sourcePort = edge.getSourcePortId();
    const sourceNode = edge.getSourceNode()?.getData();
    const targetNode = edge.getTargetNode()?.getData();

    // Handle exception out-port edge removal.
    const protGroup = getPortGroup(edge.getSourceNode(), sourcePort);
    if (showExceptionPort(sourceNode, protGroup)) {
      const newNodeParams: ChildNode = cloneDeep(sourceNode);
      const { exceptionHandleNodeIds = [] } =
        newNodeParams.nodeConfig?.exceptionHandleConfig || {};
      const newExceptionHandleNodeIds = exceptionHandleNodeIds.filter(
        (item: number) => item !== Number(targetNode.id),
      );
      const exceptionHandleConfig = {
        ...(newNodeParams.nodeConfig?.exceptionHandleConfig || {}),
        exceptionHandleNodeIds: newExceptionHandleNodeIds,
      };
      newNodeParams.nodeConfig.exceptionHandleConfig =
        exceptionHandleConfig as ExceptionHandleConfig;

      doSuccess(newNodeParams);
      return true;
    }

    return false;
  };
  // Hotkey: delete selected cell.
  graph.bindKey(['delete', 'backspace'], () => {
    const cells = graph.getSelectedCells();
    if (cells.length) {
      const _cell = cells[0];
      // Determine whether deleting an edge or a node.
      if (_cell.isEdge()) {
        const sourceNode = _cell.getSourceNode()?.getData();
        const targetNode = _cell.getTargetNode()?.getData();
        const _targetNodeId = _cell.getTargetNode()?.id;

        if (!isEdgeDeletable(sourceNode, targetNode)) {
          message.warning(
            t('PC.Pages.AntvX6EventHandlers.cannotDeleteLoopEdge'),
          );
          return;
        }
        const isException = _handleExceptionItemEdgeRemove(
          _cell as Edge,
          (updateNodeParams: ChildNode) => {
            graph.removeCells([_cell]);
            changeNodeConfigWithRefresh({
              nodeData: updateNodeParams,
              targetNodeId: targetNode.id.toString(),
            });
          },
        );
        if (isException) return;

        // Check whether edge belongs to loop or loop child nodes.
        if (
          sourceNode.type === NodeTypeEnum.Loop ||
          targetNode.type === NodeTypeEnum.Loop
        ) {
          if (
            sourceNode.type === NodeTypeEnum.Loop &&
            targetNode.loopNodeId &&
            targetNode.loopNodeId === sourceNode.id
          ) {
            sourceNode.innerStartNodeId = -1;
            changeNodeConfigWithRefresh({
              nodeData: sourceNode,
              targetNodeId: _targetNodeId?.toString(),
            });
            graph.removeCells([_cell]);
            return;
          }

          if (
            targetNode.type === NodeTypeEnum.Loop &&
            sourceNode.loopNodeId &&
            sourceNode.loopNodeId === targetNode.id
          ) {
            targetNode.innerEndNodeId = -1;
            changeNodeConfigWithRefresh({
              nodeData: targetNode,
              targetNodeId: targetNode.id.toString(),
            });
            graph.removeCells([_cell]);
            return;
          }
        }

        if (
          sourceNode.type === NodeTypeEnum.Condition ||
          sourceNode.type === NodeTypeEnum.IntentRecognition ||
          sourceNode.type === NodeTypeEnum.QA
        ) {
          handleSpecialNodeEdge(cells);
        } else {
          changeEdgeConfigWithRefresh({
            type: UpdateEdgeType.deleted,
            targetId: _targetNodeId as string,
            sourceNode,
            id: '0',
          });
        }
      } else {
        if (isResistNodeType.includes(_cell.getData().type)) {
          message.warning(
            t('PC.Pages.AntvX6EventHandlers.cannotDeleteStartEndNodes'),
          );
          return;
        }

        // Delete loop node or loop child node.
        if (
          _cell.getData().loopNodeId ||
          _cell.getData().type === NodeTypeEnum.Loop
        ) {
          if (_cell.getData().type === NodeTypeEnum.Loop) {
            modal.confirm({
              title: t(
                'PC.Pages.AntvX6EventHandlers.deleteLoopNodeConfirmTitle',
              ),
              okText: t('PC.Pages.AntvX6EventHandlers.confirm'),
              cancelText: t('PC.Pages.AntvX6EventHandlers.cancel'),
              onOk: () => {
                removeNode(_cell.id, _cell.getData());
                graph.removeCells(cells);
              },
              onCancel: () => {
                return false;
              },
            });
            return;
          }
          removeNode(_cell.id, _cell.getData());
        } else {
          removeNode(_cell.id);
        }
      }
      graph.removeCells(cells);
    }

    return false;
  });

  // Hotkey: undo previous operation.
  // graph.bindKey(['meta+z', 'ctrl+z'], () => {
  //   if (graph.canUndo()) {
  //     graph.undo();
  //   }
  //   return false;
  // });

  // Cleanup function.
  return () => {
    // no-op
  };
};

export default bindEventHandlers;
