/**
 * V2 工作流节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import {
  BranchesOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Empty, Form, Tag, Tooltip, Typography } from 'antd';
import React from 'react';

import type {
  ChildNodeV2,
  InputAndOutConfigV2,
  NodePreviousAndArgMapV2,
} from '../../../types';
import OutputArgsDisplayV2 from '../../common/OutputArgsDisplayV2';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

import './WorkflowNodePanelV2.less';

const { Text } = Typography;

// ==================== 类型定义 ====================

export interface WorkflowNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

// ==================== 组件实现 ====================

const WorkflowNodePanelV2: React.FC<WorkflowNodePanelV2Props> = ({
  node,
  referenceData,
}) => {
  const form = Form.useFormInstance();
  const workflowId = node.typeId;
  const workflowName = node.name;
  const inputArgs: InputAndOutConfigV2[] =
    Form.useWatch('inputArgs', form) || [];
  const outputArgs: InputAndOutConfigV2[] =
    Form.useWatch('outputArgs', form) || [];

  return (
    <div className="workflow-node-panel-v2">
      {/* 工作流信息 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>工作流信息</Text>
        </div>
        {workflowId ? (
          <div className="workflow-node-panel-v2-info">
            <div className="workflow-node-panel-v2-info-icon">
              <BranchesOutlined style={{ fontSize: 24, color: '#722ed1' }} />
            </div>
            <div className="workflow-node-panel-v2-info-content">
              <Text strong>{workflowName}</Text>
              {node.description && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {node.description}
                </Text>
              )}
            </div>
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
      {inputArgs.length > 0 && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>输入参数</Text>
            <Tooltip title="为工作流的输入参数设置值或引用变量">
              <InfoCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </div>
          <div className="workflow-node-panel-v2-inputs">
            {inputArgs.map((arg, index) => (
              <Form.Item
                key={arg.key || index}
                name={['inputArgs', index, 'bindValue']}
                label={
                  <span>
                    {arg.name}
                    {arg.require && (
                      <span style={{ color: '#ff4d4f' }}> *</span>
                    )}
                    <Tag color="#C9CDD4" style={{ marginLeft: 4 }}>
                      {arg.dataType}
                    </Tag>
                  </span>
                }
                tooltip={arg.description}
                rules={
                  arg.require
                    ? [{ required: true, message: `请输入 ${arg.name}` }]
                    : []
                }
              >
                <VariableSelectorV2
                  referenceData={referenceData}
                  placeholder={arg.description || `请输入 ${arg.name}`}
                />
              </Form.Item>
            ))}
          </div>
        </div>
      )}

      {/* 输出参数 */}
      {outputArgs.length > 0 && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>输出参数</Text>
          </div>
          <OutputArgsDisplayV2 outputArgs={outputArgs} />
        </div>
      )}
    </div>
  );
};

export default WorkflowNodePanelV2;
