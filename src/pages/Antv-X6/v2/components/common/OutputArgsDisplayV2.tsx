/**
 * V2 输出参数展示组件
 * 只读展示节点的输出参数
 */

import { Tag, Tree, Typography } from 'antd';
import React from 'react';

import type { InputAndOutConfigV2 } from '../../types';

import './OutputArgsDisplayV2.less';

const { Text } = Typography;

export interface OutputArgsDisplayV2Props {
  /** 输出参数列表 */
  outputArgs: InputAndOutConfigV2[];
}

/**
 * 转换参数数据为 Tree 可用的格式
 */
const convertArgsToTreeData = (args: InputAndOutConfigV2[]): any[] => {
  return args.map((arg) => {
    const children = arg.children || arg.subArgs;
    return {
      key: arg.key || arg.name,
      title: (
        <div className="output-args-display-v2-item">
          <span className="output-args-display-v2-name">{arg.name}</span>
          <Tag color="#C9CDD4" className="output-args-display-v2-tag">
            {arg.dataType}
          </Tag>
        </div>
      ),
      children: children ? convertArgsToTreeData(children) : undefined,
    };
  });
};

const OutputArgsDisplayV2: React.FC<OutputArgsDisplayV2Props> = ({
  outputArgs,
}) => {
  if (!outputArgs || outputArgs.length === 0) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        暂无输出参数
      </Text>
    );
  }

  const treeData = convertArgsToTreeData(outputArgs);

  return (
    <div className="output-args-display-v2">
      <Tree
        treeData={treeData}
        defaultExpandAll
        selectable={false}
        blockNode
        className="output-args-display-v2-tree"
      />
    </div>
  );
};

export default OutputArgsDisplayV2;
