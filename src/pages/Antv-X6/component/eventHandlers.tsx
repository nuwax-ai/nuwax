import { BindEventHandlers } from '@/types/interfaces/graph';
import { message } from 'antd';
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
}: BindEventHandlers) => {
  // 快捷键绑定：复制选中的单元格
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells(); // 获取当前选中的单元格
    if (cells.length) {
      graph.copy(cells); // 如果有选中的单元格，则执行复制操作
    }
    return false; // 阻止默认行为
  });

  // 快捷键绑定：剪切选中的单元格
  // graph.bindKey(['meta+x', 'ctrl+x'], () => {
  //   const cells = graph.getSelectedCells(); // 获取当前选中的单元格
  //   if (cells.length) {
  //     graph.cut(cells); // 如果有选中的单元格，则执行剪切操作
  //   }
  //   return false; // 阻止默认行为
  // });

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

        // 查看当前的边是否是loop或者他的子节点
        if (sourceNode.type === 'Loop' || targetNode.type === 'Loop') {
          if (
            sourceNode.type === 'Loop' &&
            targetNode.loopNodeId &&
            targetNode.loopNodeId === sourceNode.id
          ) {
            sourceNode.innerStartNodeId = -1;
            changeCondition(sourceNode, _targetNodeId);
            graph.removeCells([_cell]); // 新增行：实际移除边元素
            return;
          }
          if (
            targetNode.type === 'Loop' &&
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
          sourceNode.type === 'Condition' ||
          sourceNode.type === 'IntentRecognition' ||
          sourceNode.type === 'QA'
        ) {
          const _index: string = _cell.getSourcePortId() as string;

          // 修改当前的数据
          const newNodeParams = JSON.parse(JSON.stringify(sourceNode));
          if (sourceNode.type === 'Condition') {
            for (let item of newNodeParams.nodeConfig.conditionBranchConfigs) {
              if (_index.includes(item.uuid)) {
                item.nextNodeIds = item.nextNodeIds.filter((item: number) => {
                  return item !== Number(_targetNodeId);
                });
              }
            }
          } else if (sourceNode.type === 'QA') {
            if (newNodeParams.nodeConfig.answerType === 'SELECT') {
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
        } else {
          changeEdge('delete', _targetNodeId as string, sourceNode, '0');
        }
      } else {
        if (
          _cell.getData().type === 'Start' ||
          _cell.getData().type === 'End'
        ) {
          message.warning('不能删除开始节点和结束节点');
          return;
        }
        // 删除节点
        removeNode(_cell.id);
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
