/**
 * useWorkflowHistory - 工作流历史记录操作相关逻辑
 *
 * 从 indexV3.tsx 提取，负责管理：
 * - 撤销/重做快捷键绑定 (Cmd+Z / Cmd+Shift+Z)
 * - 撤销/重做按钮状态管理
 * - 历史变化后数据同步到 Proxy
 */

import type { GraphContainerRef } from '@/types/interfaces/graph';
import { Graph } from '@antv/x6';
import { message } from 'antd';
import { useEffect, useState } from 'react';
import { setHistoryProcessing } from '../component/graph';
import { workflowProxy } from '../services/workflowProxyV3';

export interface UseWorkflowHistoryParams {
  graphRef: React.RefObject<GraphContainerRef | null>;
  graphInstanceRef: React.MutableRefObject<Graph | null>;
  debouncedSaveFullWorkflow: () => void;
}

export interface HistoryState {
  canUndo: boolean;
  canRedo: boolean;
}

export interface UseWorkflowHistoryReturn {
  historyState: HistoryState;
  handleUndo: () => void;
  handleRedo: () => void;
}

export const useWorkflowHistory = ({
  graphRef,
  graphInstanceRef,
  debouncedSaveFullWorkflow,
}: UseWorkflowHistoryParams): UseWorkflowHistoryReturn => {
  const [historyState, setHistoryState] = useState<HistoryState>({
    canUndo: false,
    canRedo: false,
  });

  // 绑定快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInput) return;

      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const graph = graphRef.current?.getGraphRef();

      if (!graph) return;

      // Undo: Command + Z
      if (isCmdOrCtrl && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (graph.canUndo()) {
          setHistoryProcessing(true);
          graph.undo();
          // 延迟恢复记录，等待副作用（如自动布局、rerender）完成
          setTimeout(() => {
            setHistoryProcessing(false);
          }, 200);
        } else {
          message.warning('没有可撤销的操作');
        }
      }

      // Redo: Command + Shift + Z or Command + Y
      if (
        (isCmdOrCtrl && e.key.toLowerCase() === 'z' && e.shiftKey) ||
        (isCmdOrCtrl && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (graph.canRedo()) {
          setHistoryProcessing(true);
          graph.redo();
          // 延迟恢复记录
          setTimeout(() => {
            setHistoryProcessing(false);
          }, 200);
        } else {
          message.warning('没有可重做的操作');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graphRef]);

  // 监听 X6 历史记录变化
  useEffect(() => {
    // 轮询检查 graph 实例初始化
    const checkGraph = setInterval(() => {
      const graph = graphRef.current?.getGraphRef();
      if (graph) {
        graphInstanceRef.current = graph;
        clearInterval(checkGraph);

        // 更新撤销/重做按钮状态
        const updateHistoryState = () => {
          setHistoryState({
            canUndo: graph.canUndo(),
            canRedo: graph.canRedo(),
          });
        };

        // 同步数据到 Proxy（仅在 undo/redo 操作后调用）
        const syncGraphToProxy = () => {
          if (!workflowProxy) return;

          const nodes = graph.getNodes().map((n) => {
            const data = n.getData();
            const position = n.getPosition();
            const size = n.getSize();
            return {
              ...data,
              nodeConfig: {
                ...data.nodeConfig,
                extension: {
                  ...data.nodeConfig?.extension,
                  x: position.x,
                  y: position.y,
                  width: size.width,
                  height: size.height,
                },
              },
            };
          });
          const edges = graph.getEdges().map((e) => {
            const source = e.getSource() as any;
            const target = e.getTarget() as any;
            return {
              id: e.id,
              source: source?.cell || source,
              target: target?.cell || target,
              sourcePort: source?.port || undefined,
              targetPort: target?.port || undefined,
              zIndex: e.getZIndex(),
            };
          });
          // 同步时标记为 dirty，以便后续保存
          workflowProxy.syncFromGraph(nodes, edges as any, true);
          // 触发保存
          debouncedSaveFullWorkflow();
        };

        // 监听 history:change 只更新按钮状态，不同步数据
        // 这样可以避免在添加命令时触发同步导致 redo 栈被清空
        graph.on('history:change', updateHistoryState);

        // 仅在 undo/redo 操作后才同步数据到 Proxy
        graph.on('history:undo', () => {
          syncGraphToProxy();
        });
        graph.on('history:redo', () => {
          syncGraphToProxy();
        });

        // Initial state
        updateHistoryState();
      }
    }, 500);

    return () => clearInterval(checkGraph);
  }, [graphRef, graphInstanceRef, debouncedSaveFullWorkflow]);

  // 提供给外部调用的 undo/redo 方法
  const handleUndo = () => {
    const graph = graphRef.current?.getGraphRef();
    if (graph?.canUndo()) {
      setHistoryProcessing(true);
      graph.undo();
      // 延迟恢复记录，等待副作用（如自动布局、rerender）完成
      setTimeout(() => {
        setHistoryProcessing(false);
      }, 200);
    } else {
      message.warning('没有可撤销的操作');
    }
  };

  const handleRedo = () => {
    const graph = graphRef.current?.getGraphRef();
    if (graph?.canRedo()) {
      setHistoryProcessing(true);
      graph.redo();
      // 延迟恢复记录
      setTimeout(() => {
        setHistoryProcessing(false);
      }, 200);
    } else {
      message.warning('没有可重做的操作');
    }
  };

  return {
    historyState,
    handleUndo,
    handleRedo,
  };
};
