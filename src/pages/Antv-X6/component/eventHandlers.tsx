import { Graph } from '@antv/x6';

/**
 * 绑定图形编辑器的事件处理器
 * @param graph - AntV X6 图形实例
 * @returns 清理函数，用于解除绑定或清理资源
 */
const bindEventHandlers = (graph: Graph) => {
  // 快捷键绑定：复制选中的单元格
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells(); // 获取当前选中的单元格
    if (cells.length) {
      graph.copy(cells); // 如果有选中的单元格，则执行复制操作
    }
    return false; // 阻止默认行为
  });

  // 快捷键绑定：剪切选中的单元格
  graph.bindKey(['meta+x', 'ctrl+x'], () => {
    const cells = graph.getSelectedCells(); // 获取当前选中的单元格
    if (cells.length) {
      graph.cut(cells); // 如果有选中的单元格，则执行剪切操作
    }
    return false; // 阻止默认行为
  });

  // 快捷键绑定：粘贴已复制的单元格
  graph.bindKey(['meta+v', 'ctrl+v'], () => {
    if (!graph.isClipboardEmpty()) {
      // 检查剪贴板是否为空
      const cells = graph.paste({ offset: 32 }); // 粘贴并偏移一定距离
      graph.cleanSelection(); // 清除当前选择
      graph.select(cells); // 选择新粘贴的单元格
    }
    return false; // 阻止默认行为
  });

  // 快捷键绑定：撤销上一步操作
  graph.bindKey(['meta+z', 'ctrl+z'], () => {
    if (graph.canUndo()) {
      // 检查是否可以撤销
      graph.undo(); // 执行撤销操作
    }
    return false; // 阻止默认行为
  });

  // 返回清理函数，用于在组件卸载时解除绑定或清理资源
  return () => {
    // 清理工作，如果有的话
  };
};

export default bindEventHandlers;
