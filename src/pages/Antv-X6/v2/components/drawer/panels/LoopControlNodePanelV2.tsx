/**
 * V2 循环控制节点配置面板（继续循环/终止循环）
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Typography } from 'antd';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import { NodeTypeEnumV2 } from '../../../types';

const { Text, Paragraph } = Typography;

export interface LoopControlNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const LoopControlNodePanelV2: React.FC<LoopControlNodePanelV2Props> = ({ node }) => {
  const isBreak = node.type === NodeTypeEnumV2.LoopBreak;

  return (
    <div className="node-panel-v2">
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>{isBreak ? '终止循环' : '继续循环'}</Text>
        </div>
        <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
          {isBreak
            ? '当执行到此节点时，将立即退出当前循环，继续执行循环后的节点。'
            : '当执行到此节点时，将跳过本次循环的剩余部分，直接进入下一次循环。'}
        </Paragraph>
      </div>

      <div className="node-panel-v2-section">
        <Text type="warning" style={{ fontSize: 12 }}>
          注意：此节点只能在循环体内部使用
        </Text>
      </div>
    </div>
  );
};

export default LoopControlNodePanelV2;
