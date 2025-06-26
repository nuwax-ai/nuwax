import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { BindEventHandlers, ChildNode } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { cloneDeep } from '@/utils/common';
import {
  getPortGroup,
  isEdgeDeletable,
  showExceptionPort,
} from '@/utils/graph';
import { Edge } from '@antv/x6';
const isResistNodeType = [
  NodeTypeEnum.Start,
  NodeTypeEnum.End,
  NodeTypeEnum.LoopStart,
  NodeTypeEnum.LoopEnd,
];
/**
 * 绑定图形编辑器的事件处理器
 * @param graph - AntV X6 图形实例
 * @returns 清理函数，用于解除绑定或清理资源
 */
const bindEventHandlers = ({
  graph,
  changeEdge,
  copyNode,
  changeCondition,
  removeNode,
  modal,
  message,
}: BindEventHandlers) => {
  // 快捷键绑定：复制选中的单元格
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells(); // 获取当前选中的单元格
    if (cells.length) {
      graph.copy(cells); // 如果有选中的单元格，则执行复制操作
    }
    return false; // 阻止默认行为
  });

  // 快捷键绑定：粘贴已复制的单元格
  graph.bindKey(['meta+v', 'ctrl+v'], () => {
    if (!graph.isClipboardEmpty()) {
      // 检查剪贴板是否为空
      const cells = graph.getSelectedCells(); // 粘贴并偏移一定距离
      if (cells && cells.length > 0) {
        const node = cells[0].getData();
        if (
          node.type === 'Start' ||
          node.type === 'End' ||
          node.type === 'Loop'
        ) {
          message.error('不能粘贴开始、结束和循环节点');
          return;
        }
        copyNode(node);
      }
      graph.cleanSelection(); // 清除当前选择
      // graph.select(cells); // 选择新粘贴的单元格
      // const _cell = cells[0]
      // const sourceNode =_cell.getSourceNode()?.getData()
    }
    return false; // 阻止默认行为
  });

  const handleSpecialNodeEdge = (cells: any[]): void => {
    const _cell = cells[0];
    const _targetNodeId = _cell.getTargetNode()?.id;
    const sourceNode = _cell.getSourceNode()?.getData();
    const _index: string = _cell.getSourcePortId() as string;

    // 修改当前的数据
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
        changeEdge('delete', _targetNodeId as string, sourceNode, '0');
        graph.removeCells(cells); // 删除选中的单元格
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
    changeCondition(newNodeParams, _targetNodeId);
  };
  const _handleExceptionItemEdgeRemove = (
    edge: Edge,
    doSuccess: (newNodeParams: ChildNode) => void,
  ): boolean => {
    // 获取边的两个连接桩
    const sourcePort = edge.getSourcePortId();
    const sourceNode = edge.getSourceNode()?.getData();
    const targetNode = edge.getTargetNode()?.getData();

    // 处理节点的异常处理 out port 连边的逻辑
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
  // 快捷键绑定：删除选中的单元格
  graph.bindKey(['delete', 'backspace'], () => {
    const cells = graph.getSelectedCells(); // 获取当前选中的单元格
    if (cells.length) {
      const _cell = cells[0];
      // 判定是删除节点还是边
      if (_cell.isEdge()) {
        // 获取当前节点
        const sourceNode = _cell.getSourceNode()?.getData();
        const targetNode = _cell.getTargetNode()?.getData();
        // 获取连接点的节点id
        const _targetNodeId = _cell.getTargetNode()?.id;

        if (!isEdgeDeletable(sourceNode, targetNode)) {
          message.warning('不能删除循环节点连线');
          return;
        }
        const isException = _handleExceptionItemEdgeRemove(
          _cell as Edge,
          (updateNodeParams: ChildNode) => {
            graph.removeCells([_cell]);
            changeCondition(updateNodeParams, targetNode.id.toString());
          },
        );
        if (isException) return;

        // 查看当前的边是否是loop或者他的子节点
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
            changeCondition(sourceNode, _targetNodeId);
            graph.removeCells([_cell]); // 新增行：实际移除边元素
            return;
          }

          if (
            targetNode.type === NodeTypeEnum.Loop &&
            sourceNode.loopNodeId &&
            sourceNode.loopNodeId === targetNode.id
          ) {
            targetNode.innerEndNodeId = -1;
            changeCondition(targetNode, targetNode.id);
            graph.removeCells([_cell]); // 新增行：实际移除边元素
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
          changeEdge('delete', _targetNodeId as string, sourceNode, '0');
        }
      } else {
        if (isResistNodeType.includes(_cell.getData().type)) {
          message.warning('不能删除开始节点和结束节点');
          return;
        }

        // 如果是删除循环节点或删除循环的子节点
        if (
          _cell.getData().loopNodeId ||
          _cell.getData().type === NodeTypeEnum.Loop
        ) {
          if (_cell.getData().type === NodeTypeEnum.Loop) {
            // 弹出确认框
            modal.confirm({
              title: '确定要删除循环节点吗？',
              okText: '确认',
              cancelText: '取消',
              onOk: () => {
                removeNode(_cell.id, _cell.getData()); // 调用删除节点的函数
                graph.removeCells(cells); // 删除选中的单元格
              },
              onCancel: () => {
                return false; // 取消删除操作
              },
            });
            return;
          }
          // 删除节点
          removeNode(_cell.id, _cell.getData());
        } else {
          // 删除节点
          removeNode(_cell.id);
        }
      }
      graph.removeCells(cells); // 删除选中的单元格
    }

    return false; // 阻止默认行为
  });

  // 快捷键绑定：撤销上一步操作
  // graph.bindKey(['meta+z', 'ctrl+z'], () => {
  //   if (graph.canUndo()) {
  //     // 检查是否可以撤销
  //     graph.undo(); // 执行撤销操作
  //   }
  //   return false; // 阻止默认行为
  // });

  // 返回清理函数，用于在组件卸载时解除绑定或清理资源
  return () => {
    // 清理工作，如果有的话
  };
};

export default bindEventHandlers;
