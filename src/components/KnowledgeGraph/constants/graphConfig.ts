/**
 * 知识图谱 G6 配置
 */
import G6 from '@antv/g6';
import { CONTENT_NODE_SIZE, OBJECT_NODE_SIZE, ROOT_NODE_SIZE } from './colors';

// 注册自定义节点 - 圆形节点，统一半透明背景
G6.registerNode(
  'custom-node',
  {
    draw(cfg, group) {
      const nodeType = (cfg?.nodeType as string) || 'content';
      const label = (cfg?.label as string) || '';

      // 根据节点类型设置大小和字体
      let size: number;
      let fontSize: number;
      let padding: number;

      switch (nodeType) {
        case 'root':
          size = ROOT_NODE_SIZE;
          fontSize = 14;
          padding = 16;
          break;
        case 'object':
          size = OBJECT_NODE_SIZE;
          fontSize = 12;
          padding = 12;
          break;
        default:
          size = CONTENT_NODE_SIZE;
          fontSize = 11;
          padding = 10;
      }

      const radius = size / 2;
      // 文字最大宽度 = 圆圈直径 - padding * 2
      const maxTextWidth = size - padding * 2;

      // 根据字体大小估算最大字符数（中文字符宽度约等于字体大小）
      const maxChars = Math.floor(maxTextWidth / fontSize);
      // 截断标签
      const displayLabel =
        label.length > maxChars ? label.slice(0, maxChars) + '...' : label;

      // 主节点 - 圆形，半透明背景
      const keyShape = group!.addShape('circle', {
        attrs: {
          x: 0,
          y: 0,
          r: radius,
          fill: 'rgba(79, 70, 229, 0.15)', // 统一半透明紫色背景
          stroke: 'rgba(79, 70, 229, 0.3)',
          lineWidth: 1.5,
          cursor: 'pointer',
        },
        name: 'node-keyShape',
      });

      // 标签文字
      group!.addShape('text', {
        attrs: {
          x: 0,
          y: 0,
          text: displayLabel,
          fontSize,
          fill: '#4F46E5', // 深紫色文字
          textAlign: 'center',
          textBaseline: 'middle',
          fontWeight: 500,
          cursor: 'pointer',
        },
        name: 'node-label',
      });

      return keyShape;
    },

    // 设置状态样式
    setState(name, value, item) {
      const group = item!.getContainer();
      const keyShape = group!.find((e) => e.get('name') === 'node-keyShape');

      if (!keyShape) return;

      // 从节点的 size 属性中获取半径
      const model = item!.getModel();
      const size = model.size || 60;
      const radius = size / 2;

      if (name === 'hover') {
        // 如果已经是选中或高亮状态，不应用 hover 效果
        if (item!.hasState('selected') || item!.hasState('highlight')) {
          return;
        }
        if (value) {
          keyShape.attr({
            fill: 'rgba(79, 70, 229, 0.25)',
            stroke: 'rgba(79, 70, 229, 0.5)',
          });
        } else {
          keyShape.attr({
            fill: 'rgba(79, 70, 229, 0.15)',
            stroke: 'rgba(79, 70, 229, 0.3)',
          });
        }
      }

      if (name === 'selected') {
        if (value) {
          keyShape.attr({
            fill: '#4F46E5',
            stroke: '#4F46E5',
            lineWidth: 2,
          });
          // 文字变白色
          const labelShape = group!.find((e) => e.get('name') === 'node-label');
          if (labelShape) {
            labelShape.attr('fill', '#fff');
          }
        } else {
          keyShape.attr({
            fill: 'rgba(79, 70, 229, 0.15)',
            stroke: 'rgba(79, 70, 229, 0.3)',
            lineWidth: 1.5,
          });
          // 文字恢复原色
          const labelShape = group!.find((e) => e.get('name') === 'node-label');
          if (labelShape) {
            labelShape.attr('fill', '#4F46E5');
          }
        }
      }

      // 关联节点高亮状态
      if (name === 'highlight') {
        if (value) {
          // 添加外圈光晕
          const halo = group!.find(
            (e) => e.get('name') === 'node-highlight-halo',
          );
          if (!halo) {
            group!.addShape('circle', {
              attrs: {
                x: 0,
                y: 0,
                r: radius + 5,
                fill: 'transparent',
                stroke: 'rgba(79, 70, 229, 0.3)',
                lineWidth: 2,
              },
              name: 'node-highlight-halo',
            });
          }
          keyShape.attr({
            fill: 'rgba(79, 70, 229, 0.5)',
            stroke: 'rgba(79, 70, 229, 0.6)',
            lineWidth: 2,
          });
          // 文字变白色
          const labelShape = group!.find((e) => e.get('name') === 'node-label');
          if (labelShape) {
            labelShape.attr('fill', '#fff');
          }
        } else {
          // 移除外圈光晕
          const halo = group!.find(
            (e) => e.get('name') === 'node-highlight-halo',
          );
          if (halo) {
            halo.remove();
          }
          keyShape.attr({
            fill: 'rgba(79, 70, 229, 0.15)',
            stroke: 'rgba(79, 70, 229, 0.3)',
            lineWidth: 1.5,
          });
          // 文字恢复原色
          const labelShape = group!.find((e) => e.get('name') === 'node-label');
          if (labelShape) {
            labelShape.attr('fill', '#4F46E5');
          }
        }
      }
    },

    // 更新节点时重新绘制
    update(cfg, item) {
      const group = item!.getContainer();
      const labelShape = group!.find((e) => e.get('name') === 'node-label');
      const label = (cfg?.label as string) || '';

      // 从配置中获取节点类型，默认为content
      const nodeType = (cfg?.nodeType as string) || 'content';
      let fontSize: number;
      let padding: number;
      let size: number;

      switch (nodeType) {
        case 'root':
          size = ROOT_NODE_SIZE;
          fontSize = 14;
          padding = 16;
          break;
        case 'object':
          size = OBJECT_NODE_SIZE;
          fontSize = 12;
          padding = 12;
          break;
        default:
          size = CONTENT_NODE_SIZE;
          fontSize = 11;
          padding = 10;
      }

      const maxTextWidth = size - padding * 2;
      const maxChars = Math.floor(maxTextWidth / fontSize);
      const displayLabel =
        label.length > maxChars ? label.slice(0, maxChars) + '...' : label;

      if (labelShape) {
        labelShape.attr('text', displayLabel);
      }
    },
  },
  'single-node',
);

// 默认配置
export const defaultGraphConfig = {
  container: '',
  width: 1200,
  height: 800,
  modes: {
    default: ['drag-canvas', 'zoom-canvas', 'drag-node'],
  },
  defaultNode: {
    type: 'custom-node',
    // 隐藏默认 label，因为自定义节点内部已经绘制了
    labelCfg: {
      style: {
        opacity: 0,
      },
    },
  },
  defaultEdge: {
    type: 'line',
    style: {
      endArrow: {
        path: G6.Arrow.triangle(6, 8, 4),
        fill: '#94A3B8',
      },
      stroke: '#CBD5E1',
      lineWidth: 1.5,
      lineDash: [5, 5],
    },
    stateStyles: {
      highlight: {
        stroke: '#4F46E5',
        lineWidth: 2,
        endArrow: {
          path: G6.Arrow.triangle(6, 8, 4),
          fill: '#4F46E5',
        },
      },
    },
    labelCfg: {
      autoRotate: true,
      refY: 5,
      style: {
        fill: '#64748B',
        fontSize: 11,
        fontWeight: 500,
        background: {
          fill: '#fff',
          padding: [4, 8, 4, 8],
          radius: 6,
          stroke: '#E2E8F0',
          lineWidth: 1,
        },
      },
    },
  },
  layout: {
    type: 'force',
    preventOverlap: true,
    nodeSize: 80,
    linkDistance: 120,
    nodeStrength: -200,
    edgeStrength: 0.2,
    collideStrength: 0.8,
    animate: true,
    alphaDecay: 0.008,
    alphaMin: 0.001,
    alpha: 0.6,
    maxPreventOverlapIteration: 10000,
    damping: 0.85,
    gravity: 10,
    gravityRange: 200,
  },
  animate: true,
  fitView: false,
  fitViewPadding: [80, 80, 80, 80],
  fitCenter: false,
};
