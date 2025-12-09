/**
 * V2 工作流节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Typography, Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import InputArgsEditorV2 from '../../common/InputArgsEditorV2';

const { Text } = Typography;

export interface WorkflowNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const WorkflowNodePanelV2: React.FC<WorkflowNodePanelV2Props> = ({ node, referenceData }) => {
  const workflowId = node.typeId;

  return (
    <div className="node-panel-v2">
      {/* 工作流信息 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>工作流信息</Text>
        </div>
        {workflowId ? (
          <div className="workflow-info">
            <Text>工作流 ID: {workflowId}</Text>
            <Text type="secondary">{node.description}</Text>
          </div>
        ) : (
          <Empty
            description="暂未选择工作流"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              选择工作流
            </Button>
          </Empty>
        )}
      </div>

      {/* 输入参数 */}
      {workflowId && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>输入参数</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              配置工作流的输入参数
            </Text>
          </div>
          <Form.Item name="inputArgs" noStyle>
            <InputArgsEditorV2
              referenceData={referenceData}
              placeholder="添加输入参数"
            />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default WorkflowNodePanelV2;
