/**
 * V2 开始节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import InputArgsEditorV2 from '../../common/InputArgsEditorV2';

const { Text } = Typography;

export interface StartNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const StartNodePanelV2: React.FC<StartNodePanelV2Props> = ({ node }) => {
  return (
    <div className="node-panel-v2">
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>输入参数</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            定义工作流的输入参数
          </Text>
        </div>

        <Form.Item name="inputArgs" noStyle>
          <InputArgsEditorV2
            placeholder="添加输入参数"
            allowSystemVariable
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default StartNodePanelV2;
