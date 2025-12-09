/**
 * V2 自定义节点注册
 *
 * 注册工作流中使用的自定义节点类型
 * 完全独立，不依赖 v1 任何代码
 */

import { Graph, Path } from '@antv/x6';
import { register } from '@antv/x6-react-shape';
import React from 'react';
import { NODE_BACKGROUND_COLOR_MAP_V2 } from '../constants';
import type { ChildNodeV2, RunResultItemV2 } from '../types';
import { NodeShapeEnumV2, RunResultStatusEnumV2 } from '../types';

// ==================== 节点组件 ====================

interface NodeComponentProps {
  node: {
    getData: () => ChildNodeV2 & {
      isFocus?: boolean;
      runResults?: RunResultItemV2[];
      isEditingName?: boolean;
    };
    getSize: () => { width: number; height: number };
  };
}

/**
 * 通用节点组件
 */
const GeneralNodeComponent: React.FC<NodeComponentProps> = ({ node }) => {
  const data = node.getData();
  const size = node.getSize();
  const backgroundColor =
    NODE_BACKGROUND_COLOR_MAP_V2[data.type] ||
    NODE_BACKGROUND_COLOR_MAP_V2.default;

  // 运行状态样式
  const runResults = data.runResults || [];
  const lastResult = runResults[runResults.length - 1];
  const isRunning = lastResult?.status === RunResultStatusEnumV2.EXECUTING;
  const isError = lastResult?.status === RunResultStatusEnumV2.FAILED;
  const isSuccess = lastResult?.status === RunResultStatusEnumV2.FINISHED;

  const borderColor = isError
    ? '#ff4d4f'
    : isSuccess
    ? '#52c41a'
    : isRunning
    ? '#1890ff'
    : '#d9d9d9';
  const boxShadow = isRunning ? '0 0 10px rgba(24, 144, 255, 0.5)' : 'none';

  return (
    <div
      style={{
        width: size.width,
        height: size.height,
        backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        boxSizing: 'border-box',
        boxShadow,
        transition: 'all 0.3s',
        cursor: 'pointer',
      }}
    >
      {/* 节点图标 */}
      <div
        style={{
          width: 24,
          height: 24,
          marginRight: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        {typeof data.icon === 'string' ? (
          <img src={data.icon} alt="" style={{ width: 20, height: 20 }} />
        ) : (
          data.icon || '📦'
        )}
      </div>

      {/* 节点名称 */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 14,
          color: '#333',
        }}
      >
        {data.name}
      </div>

      {/* 运行状态指示器 */}
      {isRunning && (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#1890ff',
            animation: 'pulse 1s infinite',
          }}
        />
      )}
      {isSuccess && <div style={{ color: '#52c41a', fontSize: 12 }}>✓</div>}
      {isError && <div style={{ color: '#ff4d4f', fontSize: 12 }}>✗</div>}
    </div>
  );
};

/**
 * 循环节点组件
 */
const LoopNodeComponent: React.FC<NodeComponentProps> = ({ node }) => {
  const data = node.getData();
  const size = node.getSize();

  return (
    <div
      style={{
        width: size.width,
        height: size.height,
        backgroundColor: '#f0fff4',
        border: '2px dashed #52c41a',
        borderRadius: 12,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* 循环节点标题 */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 16 }}>🔄</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
          {data.name}
        </span>
        <span style={{ fontSize: 12, color: '#999' }}>
          {data.nodeConfig?.loopType === 'FIXED'
            ? `循环 ${data.nodeConfig?.loopTimes || 0} 次`
            : '条件循环'}
        </span>
      </div>

      {/* 循环体区域（子节点会渲染在这里） */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 20,
          right: 20,
          bottom: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: 8,
          border: '1px solid rgba(82, 196, 26, 0.3)',
        }}
      />
    </div>
  );
};

/**
 * 条件分支节点组件
 */
const ConditionNodeComponent: React.FC<NodeComponentProps> = ({ node }) => {
  const data = node.getData();
  const size = node.getSize();
  const branches = data.nodeConfig?.conditionBranchConfigs || [];

  return (
    <div
      style={{
        width: size.width,
        height: size.height,
        backgroundColor: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: 8,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          height: 36,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #91d5ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
        }}
      >
        <span style={{ marginRight: 8 }}>🔀</span>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{data.name}</span>
      </div>

      {/* 分支列表 */}
      <div style={{ padding: '4px 0' }}>
        {branches.map((branch, index) => (
          <div
            key={branch.uuid}
            style={{
              height: 28,
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              color: '#666',
            }}
          >
            <span
              style={{
                padding: '2px 6px',
                backgroundColor:
                  branch.branchType === 'ELSE' ? '#f5f5f5' : '#e6f7ff',
                borderRadius: 4,
                marginRight: 8,
              }}
            >
              {branch.branchType === 'IF'
                ? '如果'
                : branch.branchType === 'ELSE_IF'
                ? '否则如果'
                : '否则'}
            </span>
            {branch.branchType !== 'ELSE' && (
              <span style={{ color: '#999' }}>...</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== 注册节点 ====================

let isRegistered = false;

/**
 * 注册自定义节点
 */
export function registerCustomNodesV2(): void {
  if (isRegistered) {
    return;
  }

  // 注册通用节点
  register({
    shape: NodeShapeEnumV2.General,
    width: 220,
    height: 44,
    component: GeneralNodeComponent,
    ports: {
      groups: {
        in: {
          position: 'left',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5147FF',
              strokeWidth: 1,
              fill: '#fff',
            },
          },
        },
        out: {
          position: 'right',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5147FF',
              strokeWidth: 1,
              fill: '#fff',
            },
          },
        },
        special: {
          position: 'right',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#5147FF',
              strokeWidth: 1,
              fill: '#fff',
            },
          },
        },
        exception: {
          position: 'bottom',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#ff4d4f',
              strokeWidth: 1,
              fill: '#fff',
            },
          },
        },
      },
    },
  });

  // 注册循环节点
  register({
    shape: NodeShapeEnumV2.Loop,
    width: 660,
    height: 240,
    component: LoopNodeComponent,
    ports: {
      groups: {
        in: {
          position: 'left',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#52c41a',
              strokeWidth: 1,
              fill: '#fff',
            },
          },
        },
        out: {
          position: 'right',
          attrs: {
            circle: {
              r: 4,
              magnet: true,
              stroke: '#52c41a',
              strokeWidth: 1,
              fill: '#fff',
            },
          },
        },
      },
    },
  });

  isRegistered = true;
}

// ==================== 自定义连接器 ====================

/**
 * 创建曲线路径（用于连线）
 * 使用 SVG 路径字符串格式
 */
export function createCurvePathV2(
  sourcePoint: { x: number; y: number },
  targetPoint: { x: number; y: number },
  vertices: { x: number; y: number }[],
  options: any,
): string {
  let pathData = `M ${sourcePoint.x} ${sourcePoint.y}`;

  if (vertices && vertices.length > 0) {
    // 有中间点时使用折线
    vertices.forEach((vertex, index) => {
      if (index === 0) {
        const midX = (sourcePoint.x + vertex.x) / 2;
        pathData += ` C ${midX} ${sourcePoint.y} ${midX} ${vertex.y} ${vertex.x} ${vertex.y}`;
      } else {
        const prevVertex = vertices[index - 1];
        const midX = (prevVertex.x + vertex.x) / 2;
        pathData += ` C ${midX} ${prevVertex.y} ${midX} ${vertex.y} ${vertex.x} ${vertex.y}`;
      }
    });

    const lastVertex = vertices[vertices.length - 1];
    const midX = (lastVertex.x + targetPoint.x) / 2;
    pathData += ` C ${midX} ${lastVertex.y} ${midX} ${targetPoint.y} ${targetPoint.x} ${targetPoint.y}`;
  } else {
    // 直接连接 - 使用贝塞尔曲线
    const midX = (sourcePoint.x + targetPoint.x) / 2;
    pathData += ` C ${midX} ${sourcePoint.y} ${midX} ${targetPoint.y} ${targetPoint.x} ${targetPoint.y}`;
  }

  return Path.normalize(pathData);
}

/**
 * 注册自定义连接器
 */
export function registerCustomConnectorV2(): void {
  Graph.registerConnector('curveConnectorV2', createCurvePathV2, true);
}

export default {
  registerCustomNodesV2,
  registerCustomConnectorV2,
  createCurvePathV2,
};
