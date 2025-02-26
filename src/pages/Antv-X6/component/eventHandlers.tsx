import { BindEventHandlers } from '@/types/interfaces/graph';
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
      const node = cells[0].getData();
      node.nodeConfig.extension.y = node.nodeConfig.extension.y + 32;
      node.nodeConfig.extension.x = node.nodeConfig.extension.x + 32;
      copyNode(node);
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
        // 获取连接点的节点id
        const _targetNodeId = _cell.getTargetNode()?.id;
        console.log(sourceNode);
        if (
          sourceNode.type === 'Condition' ||
          sourceNode.type === 'IntentRecognition'
        ) {
          const sourcePort = _cell.getSourcePortId();
          // 获取当前连接桩的输出端口
          const _index: string = sourcePort?.split('-')[1] as string;
          // 修改当前的数据
          const newNodeParams = JSON.parse(JSON.stringify(sourceNode));
          if (sourceNode.type === 'Condition') {
            for (let item of newNodeParams.nodeConfig.conditionBranchConfigs) {
              if (_index === item.uuid) {
                item.nextNodeIds = item.nextNodeIds.filter((item: number) => {
                  return item !== Number(_targetNodeId);
                });
              }
            }
          } else {
            for (let item of newNodeParams.nodeConfig.intentConfigs) {
              if (_index === item.uuid) {
                item.nextNodeIds = item.nextNodeIds.filter((item: number) => {
                  return item !== Number(_targetNodeId);
                });
              }
            }
          }
          changeCondition(newNodeParams);
        } else {
          // 移除边
          changeEdge('delete', _targetNodeId as string, sourceNode, '0');
        }
      } else {
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
