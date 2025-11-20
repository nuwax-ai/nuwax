import { VariableTreeNode } from '../types';

// 将变量树节点转换为 Tree 组件格式
export const transformToTreeDataForTree = (
  nodes: VariableTreeNode[],
): any[] => {
  return nodes.map((node) => {
    return {
      title: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {/* <span style={{ fontSize: '12px', opacity: 0.8 }}>
            {node.variable?.type
              ? getVariableTypeIcon(node.variable.type)
              : '📝'}
          </span> */}
          <span
            style={{
              flex: 1,
              fontSize: '14px',
            }}
          >
            {node.label}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#8c8c8c',
            }}
          >
            {node.variable?.type || 'unknown'}
          </span>
        </div>
      ),
      key: node.key,
      value: node.value,
      selectable: true, // 所有节点都可选择
      disabled: false, // 不禁用任何节点
      children: node.children
        ? transformToTreeDataForTree(node.children)
        : undefined,
    };
  });
};
