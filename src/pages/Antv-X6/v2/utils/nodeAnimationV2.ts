/**
 * V2 节点动画效果
 * 
 * 实现节点执行时的动画效果：
 * 1. 节点高亮
 * 2. 节点闪烁
 * 3. 脉冲效果
 * 4. 连线流动动画
 * 
 * 完全独立，不依赖 v1 任何代码
 */

import type { Graph, Node, Edge } from '@antv/x6';
import { NODE_ANIMATION_CONFIG_V2, EDGE_ANIMATION_CONFIG_V2 } from '../constants';

// ==================== 类型定义 ====================

export type AnimationType = 'highlight' | 'flash' | 'pulse' | 'running' | 'error';

export interface AnimationOptions {
  duration?: number;
  color?: string;
  repeat?: number;
  onComplete?: () => void;
}

// ==================== 节点动画 ====================

/**
 * 高亮节点
 */
export function highlightNode(
  node: Node,
  options: AnimationOptions = {}
): () => void {
  const config = NODE_ANIMATION_CONFIG_V2.highlight;
  const {
    duration = config.duration,
    color = config.color,
    onComplete,
  } = options;

  // 保存原始样式
  const originalAttrs = node.getAttrs();
  
  // 应用高亮样式
  node.attr('body', {
    stroke: color,
    strokeWidth: 3,
    filter: {
      name: 'dropShadow',
      args: {
        dx: 0,
        dy: 0,
        blur: 8,
        color: color,
        opacity: 0.5,
      },
    },
  });

  // 返回清理函数
  const cleanup = () => {
    node.setAttrs(originalAttrs);
    onComplete?.();
  };

  // 自动清理
  setTimeout(cleanup, duration);

  return cleanup;
}

/**
 * 闪烁节点
 */
export function flashNode(
  node: Node,
  options: AnimationOptions = {}
): () => void {
  const config = NODE_ANIMATION_CONFIG_V2.flash;
  const {
    duration = config.duration,
    color = config.color,
    repeat = 3,
    onComplete,
  } = options;

  let count = 0;
  let isHighlighted = false;
  const originalAttrs = node.getAttrs();
  const intervalTime = duration / (repeat * 2);

  const interval = setInterval(() => {
    if (isHighlighted) {
      node.setAttrs(originalAttrs);
    } else {
      node.attr('body', {
        stroke: color,
        strokeWidth: 3,
      });
    }
    isHighlighted = !isHighlighted;
    count++;

    if (count >= repeat * 2) {
      clearInterval(interval);
      node.setAttrs(originalAttrs);
      onComplete?.();
    }
  }, intervalTime);

  return () => {
    clearInterval(interval);
    node.setAttrs(originalAttrs);
  };
}

/**
 * 脉冲效果
 */
export function pulseNode(
  node: Node,
  options: AnimationOptions = {}
): () => void {
  const config = NODE_ANIMATION_CONFIG_V2.pulse;
  const {
    duration = config.duration,
    color = config.color,
    onComplete,
  } = options;

  const originalSize = node.getSize();
  const pulseSize = {
    width: originalSize.width * 1.1,
    height: originalSize.height * 1.1,
  };

  let isExpanded = false;
  const originalAttrs = node.getAttrs();

  // 创建脉冲动画
  const interval = setInterval(() => {
    if (isExpanded) {
      node.resize(originalSize.width, originalSize.height);
      node.setAttrs(originalAttrs);
    } else {
      node.resize(pulseSize.width, pulseSize.height);
      node.attr('body', {
        stroke: color,
        strokeWidth: 2,
      });
    }
    isExpanded = !isExpanded;
  }, duration / 2);

  // 返回清理函数
  return () => {
    clearInterval(interval);
    node.resize(originalSize.width, originalSize.height);
    node.setAttrs(originalAttrs);
    onComplete?.();
  };
}

/**
 * 运行中效果（持续高亮 + 脉冲边框）
 */
export function runningNode(
  node: Node,
  options: AnimationOptions = {}
): () => void {
  const config = NODE_ANIMATION_CONFIG_V2.running;
  const {
    color = config.color,
    onComplete,
  } = options;

  const originalAttrs = node.getAttrs();
  let opacity = 0.3;
  let increasing = true;

  // 应用基础样式
  node.attr('body', {
    stroke: color,
    strokeWidth: 2,
  });

  // 创建呼吸效果
  const interval = setInterval(() => {
    if (increasing) {
      opacity += 0.1;
      if (opacity >= 1) {
        increasing = false;
      }
    } else {
      opacity -= 0.1;
      if (opacity <= 0.3) {
        increasing = true;
      }
    }

    node.attr('body', {
      stroke: color,
      strokeWidth: 2,
      filter: {
        name: 'dropShadow',
        args: {
          dx: 0,
          dy: 0,
          blur: 10,
          color: color,
          opacity: opacity,
        },
      },
    });
  }, 100);

  return () => {
    clearInterval(interval);
    node.setAttrs(originalAttrs);
    onComplete?.();
  };
}

/**
 * 错误效果
 */
export function errorNode(
  node: Node,
  options: AnimationOptions = {}
): () => void {
  const config = NODE_ANIMATION_CONFIG_V2.error;
  const {
    duration = config.duration,
    color = config.color,
    repeat = 2,
    onComplete,
  } = options;

  // 先闪烁，然后保持错误边框
  const flashCleanup = flashNode(node, {
    duration,
    color,
    repeat,
    onComplete: () => {
      // 保持错误边框
      node.attr('body', {
        stroke: color,
        strokeWidth: 2,
      });
      onComplete?.();
    },
  });

  return flashCleanup;
}

// ==================== 边动画 ====================

/**
 * 边流动动画
 */
export function flowEdge(
  edge: Edge,
  options: { speed?: number; color?: string } = {}
): () => void {
  const config = EDGE_ANIMATION_CONFIG_V2.flow;
  const { speed = config.duration, color = '#52c41a' } = options;

  const originalAttrs = edge.getAttrs();

  // 设置动画样式
  edge.attr('line', {
    stroke: color,
    strokeWidth: 2,
    strokeDasharray: '5 5',
    style: {
      animation: `ant-line ${speed}s infinite linear`,
    },
  });

  return () => {
    edge.setAttrs(originalAttrs);
  };
}

/**
 * 高亮边
 */
export function highlightEdge(
  edge: Edge,
  options: { color?: string; duration?: number } = {}
): () => void {
  const { color = '#52c41a', duration = 300 } = options;
  const originalAttrs = edge.getAttrs();

  edge.attr('line', {
    stroke: color,
    strokeWidth: 2,
  });

  const cleanup = () => {
    edge.setAttrs(originalAttrs);
  };

  setTimeout(cleanup, duration);

  return cleanup;
}

// ==================== 组合动画 ====================

/**
 * 执行路径动画（高亮一系列节点和边）
 */
export function animateExecutionPath(
  graph: Graph,
  path: { nodeId: string; edgeId?: string }[],
  options: { delay?: number; nodeAnimation?: AnimationType } = {}
): () => void {
  const { delay = 500, nodeAnimation = 'highlight' } = options;
  const cleanupFunctions: (() => void)[] = [];
  let currentIndex = 0;

  const animateNext = () => {
    if (currentIndex >= path.length) {
      return;
    }

    const { nodeId, edgeId } = path[currentIndex];
    
    // 动画节点
    const node = graph.getCellById(nodeId);
    if (node && node.isNode()) {
      let cleanup: () => void;
      switch (nodeAnimation) {
        case 'flash':
          cleanup = flashNode(node as Node);
          break;
        case 'pulse':
          cleanup = pulseNode(node as Node);
          break;
        case 'running':
          cleanup = runningNode(node as Node);
          break;
        default:
          cleanup = highlightNode(node as Node);
      }
      cleanupFunctions.push(cleanup);
    }

    // 动画边
    if (edgeId) {
      const edge = graph.getCellById(edgeId);
      if (edge && edge.isEdge()) {
        const cleanup = flowEdge(edge as Edge);
        cleanupFunctions.push(cleanup);
      }
    }

    currentIndex++;
    setTimeout(animateNext, delay);
  };

  animateNext();

  // 返回清理所有动画的函数
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

/**
 * 停止所有节点动画
 */
export function stopAllNodeAnimations(graph: Graph): void {
  const nodes = graph.getNodes();
  nodes.forEach(node => {
    // 重置到默认样式
    node.attr('body', {
      stroke: '#d9d9d9',
      strokeWidth: 1,
      filter: null,
    });
  });
}

/**
 * 停止所有边动画
 */
export function stopAllEdgeAnimations(graph: Graph): void {
  const edges = graph.getEdges();
  edges.forEach(edge => {
    edge.attr('line', {
      stroke: '#5147FF',
      strokeWidth: 1,
      strokeDasharray: '',
      style: {
        animation: 'none',
      },
    });
  });
}

/**
 * 重置所有动画
 */
export function resetAllAnimations(graph: Graph): void {
  stopAllNodeAnimations(graph);
  stopAllEdgeAnimations(graph);
}

// ==================== CSS 动画样式 ====================

/**
 * 注入 CSS 动画样式
 * 需要在应用初始化时调用一次
 */
export function injectAnimationStyles(): void {
  const styleId = 'v2-workflow-animations';
  
  // 检查是否已注入
  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes ant-line {
      to {
        stroke-dashoffset: -1000;
      }
    }

    @keyframes node-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }

    @keyframes node-glow {
      0%, 100% {
        filter: drop-shadow(0 0 5px rgba(82, 196, 26, 0.5));
      }
      50% {
        filter: drop-shadow(0 0 15px rgba(82, 196, 26, 0.8));
      }
    }

    .v2-node-running {
      animation: node-glow 1s ease-in-out infinite;
    }

    .v2-node-pulse {
      animation: node-pulse 0.5s ease-in-out;
    }
  `;

  document.head.appendChild(style);
}

export default {
  // 节点动画
  highlightNode,
  flashNode,
  pulseNode,
  runningNode,
  errorNode,
  
  // 边动画
  flowEdge,
  highlightEdge,
  
  // 组合动画
  animateExecutionPath,
  
  // 清理
  stopAllNodeAnimations,
  stopAllEdgeAnimations,
  resetAllAnimations,
  
  // 样式注入
  injectAnimationStyles,
};
