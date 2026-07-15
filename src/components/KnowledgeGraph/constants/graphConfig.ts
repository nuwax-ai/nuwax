/**
 * 知识图谱 G6 v5 配置
 */
import { CONTENT_NODE_SIZE, OBJECT_NODE_SIZE, ROOT_NODE_SIZE } from './colors';

export const getNodeSize = (nodeType?: string) => {
  switch (nodeType) {
    case 'root':
      return ROOT_NODE_SIZE;
    case 'object':
      return OBJECT_NODE_SIZE;
    default:
      return CONTENT_NODE_SIZE;
  }
};

const getNodeFontSize = (nodeType?: string) => {
  switch (nodeType) {
    case 'root':
      return 14;
    case 'object':
      return 12;
    default:
      return 11;
  }
};

const getNodePadding = (nodeType?: string) => {
  switch (nodeType) {
    case 'root':
      return 16;
    case 'object':
      return 12;
    default:
      return 10;
  }
};

const truncateLabel = (label: string, nodeType?: string) => {
  const size = getNodeSize(nodeType);
  const fontSize = getNodeFontSize(nodeType);
  const padding = getNodePadding(nodeType);
  const maxTextWidth = size - padding * 2;
  const maxChars = Math.floor(maxTextWidth / fontSize);
  return label.length > maxChars ? label.slice(0, maxChars) + '...' : label;
};

export const getNodeStyle = () => ({
  type: 'circle',
  style: {
    size: (d: any) => getNodeSize(d.data?.nodeType),
    fill: 'rgba(79, 70, 229, 0.15)',
    stroke: 'rgba(79, 70, 229, 0.3)',
    lineWidth: 1.5,
    cursor: 'pointer',
    labelText: (d: any) => truncateLabel(d.data?.label || '', d.data?.nodeType),
    labelFontSize: (d: any) => getNodeFontSize(d.data?.nodeType),
    labelFill: '#4F46E5',
    labelPlacement: 'center' as const,
    labelTextBaseline: 'middle' as const,
  },
  state: {
    hover: {
      fill: 'rgba(79, 70, 229, 0.25)',
      stroke: 'rgba(79, 70, 229, 0.5)',
    },
    selected: {
      fill: '#4F46E5',
      stroke: '#4F46E5',
      lineWidth: 2,
      labelFill: '#fff',
    },
    highlight: {
      fill: 'rgba(79, 70, 229, 0.5)',
      stroke: 'rgba(79, 70, 229, 0.6)',
      lineWidth: 2,
      labelFill: '#fff',
    },
  },
});

export const getEdgeStyle = () => ({
  type: 'line',
  style: {
    stroke: '#CBD5E1',
    lineWidth: 1.5,
    lineDash: [5, 5],
    endArrow: true,
    endArrowSize: 6,
    cursor: 'pointer',
    labelText: (d: any) => d.data?.label || '',
    labelFontSize: 11,
    labelFill: '#64748B',
    labelFontWeight: 500,
    labelAutoRotate: true,
    labelPadding: [4, 8],
    labelBackground: true,
    labelBackgroundFill: '#fff',
    labelBackgroundStroke: '#E2E8F0',
    labelBackgroundLineWidth: 1,
    labelBackgroundRadius: 6,
  },
  state: {
    hover: {
      stroke: '#1890ff',
      lineWidth: 2,
      labelFill: '#1890ff',
    },
    highlight: {
      stroke: '#4F46E5',
      lineWidth: 2,
    },
  },
});

export const getLayoutConfig = () => ({
  type: 'd3-force' as const,
  link: {
    distance: 120,
    strength: 0.2,
  },
  manyBody: {
    strength: -200,
  },
  collide: {
    radius: 40,
    strength: 0.8,
  },
  center: {
    strength: 0.05,
  },
});

export const getBehaviors = () => [
  'drag-canvas',
  'zoom-canvas',
  'drag-element',
];
