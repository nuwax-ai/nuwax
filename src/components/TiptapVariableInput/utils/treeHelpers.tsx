import { VariableTreeNode, VariableType } from '../types';

/**
 * 根据变量类型生成默认示例数据
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getDefaultExample = (type: VariableType): any => {
  return null;
};

/**
 * 格式化示例数据为显示字符串
 */
const formatExample = (example: any, type: VariableType): string => {
  if (example === null || example === undefined) {
    const defaultExample = getDefaultExample(type);
    if (defaultExample === null) return '';
    return String(defaultExample);
  }

  if (typeof example === 'string') {
    return example;
  }

  if (typeof example === 'object') {
    try {
      return JSON.stringify(example);
    } catch {
      return String(example);
    }
  }

  return String(example);
};

// 将变量树节点转换为 Tree 组件格式
export const transformToTreeDataForTree = (
  nodes: VariableTreeNode[],
): any[] => {
  return nodes.map((node) => {
    const variable = node.variable;
    const type = variable?.type || 'unknown';
    const example =
      variable?.example !== undefined
        ? variable.example
        : getDefaultExample(type as VariableType);
    const exampleText =
      example !== null && example !== undefined
        ? formatExample(example, type as VariableType)
        : '';

    return {
      title: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            width: '100%',
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {node.label}
          </span>
          {exampleText && (
            <span
              style={{
                fontSize: '11px',
                color: '#52c41a',
                fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                opacity: 0.8,
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={exampleText}
            >
              {exampleText}
            </span>
          )}
          <span
            style={{
              fontSize: '11px',
              color: '#8c8c8c',
              flexShrink: 0,
            }}
          >
            {type}
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
