/**
 * V2 事件处理器
 * 
 * 绑定键盘快捷键和图形事件
 * 支持撤销/重做功能
 * 
 * 完全独立，不依赖 v1 任何代码
 */

import type { Graph, Node, Edge } from '@antv/x6';
import type { MessageInstance } from 'antd/es/message/interface';
import type { HookAPI as ModalHookAPI } from 'antd/es/modal/useModal';

import type { ChildNodeV2, EdgeV2 } from '../types';
import { NodeTypeEnumV2 } from '../types';
import { NON_DELETABLE_NODE_TYPES_V2, LOOP_RELATED_NODE_TYPES_V2 } from '../constants';
import { canDeleteEdge } from '../utils/graphV2';

// ==================== 类型定义 ====================

export interface EventHandlersV2Options {
  graph: Graph;
  onNodeCopy: (node: ChildNodeV2) => void;
  onNodeDelete: (nodeId: number, node?: ChildNodeV2) => void;
  onEdgeDelete: (sourceId: string, targetId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  modal: ModalHookAPI;
  message: MessageInstance;
}

// ==================== 事件处理器 ====================

/**
 * 绑定事件处理器
 */
export function bindEventHandlersV2(options: EventHandlersV2Options): () => void {
  const {
    graph,
    onNodeCopy,
    onNodeDelete,
    onEdgeDelete,
    onUndo,
    onRedo,
    modal,
    message,
  } = options;

  // ==================== 复制粘贴 ====================

  // Ctrl/Cmd + C: 复制
  graph.bindKey(['meta+c', 'ctrl+c'], () => {
    const cells = graph.getSelectedCells();
    if (cells.length) {
      graph.copy(cells);
    }
    return false;
  });

  // Ctrl/Cmd + V: 粘贴
  graph.bindKey(['meta+v', 'ctrl+v'], () => {
    if (!graph.isClipboardEmpty()) {
      const cells = graph.getSelectedCells();
      if (cells.length > 0) {
        const node = cells[0];
        const data = node.getData() as ChildNodeV2;

        // 检查是否可以粘贴
        if (LOOP_RELATED_NODE_TYPES_V2.includes(data?.type)) {
          message.error('不能粘贴循环相关节点');
          return false;
        }

        if (data?.type === NodeTypeEnumV2.Start) {
          message.error('不能粘贴开始节点');
          return false;
        }

        if (data?.type === NodeTypeEnumV2.End) {
          message.error('不能粘贴结束节点');
          return false;
        }

        // 执行复制
        onNodeCopy(data);
      }
      graph.cleanSelection();
    }
    return false;
  });

  // ==================== 撤销重做 ====================

  // Ctrl/Cmd + Z: 撤销
  graph.bindKey(['meta+z', 'ctrl+z'], () => {
    if (graph.canUndo()) {
      graph.undo();
      onUndo();
    }
    return false;
  });

  // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y: 重做
  graph.bindKey(['meta+shift+z', 'ctrl+shift+z', 'meta+y', 'ctrl+y'], () => {
    if (graph.canRedo()) {
      graph.redo();
      onRedo();
    }
    return false;
  });

  // ==================== 删除 ====================

  // Delete / Backspace: 删除选中的元素
  graph.bindKey(['delete', 'backspace'], () => {
    const cells = graph.getSelectedCells();
    
    if (cells.length === 0) {
      return false;
    }

    const cell = cells[0];

    // 判断是删除节点还是边
    if (cell.isEdge()) {
      handleDeleteEdge(cell as Edge);
    } else if (cell.isNode()) {
      handleDeleteNode(cell as Node);
    }

    return false;
  });

  /**
   * 处理删除边
   */
  function handleDeleteEdge(edge: Edge): void {
    const sourceNode = edge.getSourceNode()?.getData() as ChildNodeV2;
    const targetNode = edge.getTargetNode()?.getData() as ChildNodeV2;

    if (!sourceNode || !targetNode) {
      return;
    }

    // 检查是否可以删除
    if (!canDeleteEdge(sourceNode, targetNode)) {
      message.warning('不能删除循环节点内部连线');
      return;
    }

    // 特殊处理：循环节点与子节点的连线
    if (sourceNode.type === NodeTypeEnumV2.Loop) {
      if (targetNode.loopNodeId === sourceNode.id && 
          targetNode.id === sourceNode.innerStartNodeId) {
        message.warning('不能删除循环节点与开始节点的连线');
        return;
      }
    }

    if (targetNode.type === NodeTypeEnumV2.Loop) {
      if (sourceNode.loopNodeId === targetNode.id && 
          sourceNode.id === targetNode.innerEndNodeId) {
        message.warning('不能删除循环节点与结束节点的连线');
        return;
      }
    }

    // 执行删除
    onEdgeDelete(edge.getSourceCellId(), edge.getTargetCellId());
    graph.removeCells([edge]);
  }

  /**
   * 处理删除节点
   */
  function handleDeleteNode(node: Node): void {
    const data = node.getData() as ChildNodeV2;

    if (!data) {
      return;
    }

    // 检查是否为不可删除的节点类型
    if (NON_DELETABLE_NODE_TYPES_V2.includes(data.type)) {
      message.warning('不能删除开始节点和结束节点');
      return;
    }

    // 循环节点需要确认
    if (data.type === NodeTypeEnumV2.Loop) {
      modal.confirm({
        title: '确定要删除循环节点吗？',
        content: '删除循环节点将同时删除其内部的所有节点',
        okText: '确认',
        cancelText: '取消',
        onOk: () => {
          onNodeDelete(data.id, data);
          graph.removeCells([node]);
        },
      });
      return;
    }

    // 循环内部节点
    if (data.loopNodeId) {
      onNodeDelete(data.id, data);
      graph.removeCells([node]);
      return;
    }

    // 普通节点
    onNodeDelete(data.id);
    graph.removeCells([node]);
  }

  // ==================== 全选 ====================

  // Ctrl/Cmd + A: 全选
  graph.bindKey(['meta+a', 'ctrl+a'], () => {
    const nodes = graph.getNodes();
    graph.select(nodes);
    return false;
  });

  // ==================== 保存 ====================

  // Ctrl/Cmd + S: 保存（阻止默认行为，由外部处理）
  graph.bindKey(['meta+s', 'ctrl+s'], () => {
    // 阻止默认的保存行为，实际保存由自动保存机制处理
    return false;
  });

  // ==================== ESC ====================

  // ESC: 取消选择
  graph.bindKey('escape', () => {
    graph.cleanSelection();
    return false;
  });

  // ==================== 方向键移动 ====================

  // 方向键: 移动选中的节点
  const moveStep = 10;

  graph.bindKey('up', () => {
    moveSelectedNodes(0, -moveStep);
    return false;
  });

  graph.bindKey('down', () => {
    moveSelectedNodes(0, moveStep);
    return false;
  });

  graph.bindKey('left', () => {
    moveSelectedNodes(-moveStep, 0);
    return false;
  });

  graph.bindKey('right', () => {
    moveSelectedNodes(moveStep, 0);
    return false;
  });

  function moveSelectedNodes(dx: number, dy: number): void {
    const cells = graph.getSelectedCells();
    cells.forEach((cell) => {
      if (cell.isNode()) {
        const pos = cell.getPosition();
        cell.setPosition(pos.x + dx, pos.y + dy);
      }
    });
  }

  // ==================== 缩放 ====================

  // Ctrl/Cmd + +: 放大
  graph.bindKey(['meta+=', 'ctrl+=', 'meta+shift+=', 'ctrl+shift+='], () => {
    const zoom = graph.zoom();
    if (zoom < 3) {
      graph.zoom(0.1);
    }
    return false;
  });

  // Ctrl/Cmd + -: 缩小
  graph.bindKey(['meta+-', 'ctrl+-'], () => {
    const zoom = graph.zoom();
    if (zoom > 0.2) {
      graph.zoom(-0.1);
    }
    return false;
  });

  // Ctrl/Cmd + 0: 重置缩放
  graph.bindKey(['meta+0', 'ctrl+0'], () => {
    graph.zoomTo(1);
    return false;
  });

  // ==================== 清理函数 ====================

  return () => {
    // 清理快捷键绑定
    graph.unbindKey(['meta+c', 'ctrl+c']);
    graph.unbindKey(['meta+v', 'ctrl+v']);
    graph.unbindKey(['meta+z', 'ctrl+z']);
    graph.unbindKey(['meta+shift+z', 'ctrl+shift+z', 'meta+y', 'ctrl+y']);
    graph.unbindKey(['delete', 'backspace']);
    graph.unbindKey(['meta+a', 'ctrl+a']);
    graph.unbindKey(['meta+s', 'ctrl+s']);
    graph.unbindKey('escape');
    graph.unbindKey(['up', 'down', 'left', 'right']);
    graph.unbindKey(['meta+=', 'ctrl+=', 'meta+shift+=', 'ctrl+shift+=']);
    graph.unbindKey(['meta+-', 'ctrl+-']);
    graph.unbindKey(['meta+0', 'ctrl+0']);
  };
}

export default bindEventHandlersV2;
