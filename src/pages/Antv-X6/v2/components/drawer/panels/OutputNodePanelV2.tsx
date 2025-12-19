/**
 * V2 过程输出节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Radio, Typography } from 'antd';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import PromptEditorV2 from '../../common/PromptEditorV2';

const { Text } = Typography;

export interface OutputNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const OutputNodePanelV2: React.FC<OutputNodePanelV2Props> = ({ node, referenceData }) => {
  return (
    <div className="node-panel-v2">
      {/* 输出类型 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>输出类型</Text>
        </div>
        <Form.Item name="outputType" initialValue="STREAM">
          <Radio.Group>
            <Radio value="STREAM">流式输出</Radio>
            <Radio value="BLOCK">非流式输出</Radio>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 输出内容 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>输出内容</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            配置要输出的内容，支持变量引用
          </Text>
        </div>
        <Form.Item
          name="content"
          rules={[{ required: true, message: '请输入输出内容' }]}
        >
          <PromptEditorV2
            placeholder="输入输出内容，使用 {{ }} 引用变量"
            referenceData={referenceData}
            rows={6}
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default OutputNodePanelV2;
