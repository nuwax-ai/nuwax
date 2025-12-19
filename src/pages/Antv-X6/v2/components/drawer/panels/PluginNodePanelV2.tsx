/**
 * V2 插件节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import {
  ApiOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Empty, Form, Input, Tag, Tooltip, Typography } from 'antd';
import React from 'react';

import type {
  ChildNodeV2,
  InputAndOutConfigV2,
  NodePreviousAndArgMapV2,
} from '../../../types';
import OutputArgsDisplayV2 from '../../common/OutputArgsDisplayV2';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

import './PluginNodePanelV2.less';

const { Text } = Typography;

// ==================== 类型定义 ====================

export interface PluginNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

// ==================== 组件实现 ====================

const PluginNodePanelV2: React.FC<PluginNodePanelV2Props> = ({
  node,
  referenceData,
}) => {
  const form = Form.useFormInstance();
  const pluginId = node.typeId || node.nodeConfig?.pluginId;
  const toolName = node.nodeConfig?.toolName || node.name;
  const inputArgs: InputAndOutConfigV2[] =
    Form.useWatch('inputArgs', form) || [];
  const outputArgs: InputAndOutConfigV2[] =
    Form.useWatch('outputArgs', form) || [];

  return (
    <div className="plugin-node-panel-v2">
      {/* 插件信息 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>插件信息</Text>
        </div>
        {pluginId ? (
          <div className="plugin-node-panel-v2-info">
            <div className="plugin-node-panel-v2-info-icon">
              <ApiOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
            <div className="plugin-node-panel-v2-info-content">
              <Text strong>{toolName}</Text>
              {node.description && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {node.description}
                </Text>
              )}
            </div>
            <Button
              type="link"
              size="small"
              onClick={() => {
                form.setFieldsValue({
                  nodeConfig: {
                    ...form.getFieldValue('nodeConfig'),
                    pluginId: undefined,
                    toolName: undefined,
                  },
                });
              }}
              style={{ marginLeft: 'auto' }}
            >
              更换
            </Button>
          </div>
        ) : (
          <div className="plugin-node-panel-v2-empty">
            <Empty
              description="暂未选择插件"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  form.setFieldsValue({
                    nodeConfig: {
                      ...form.getFieldValue('nodeConfig'),
                      pluginId: 'plugin-id',
                    },
                  })
                }
              >
                选择插件
              </Button>
            </Empty>
          </div>
        )}
      </div>

      {/* 插件基本信息编辑 */}
      <Form.Item
        name={['nodeConfig', 'pluginId']}
        label="插件 ID"
        rules={[{ required: true, message: '请输入插件 ID' }]}
      >
        <Input placeholder="请输入插件 ID" />
      </Form.Item>
      <Form.Item name={['nodeConfig', 'toolName']} label="插件名称">
        <Input placeholder="用于展示的插件名称" />
      </Form.Item>

      {/* 输入参数 */}
      {inputArgs.length > 0 && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>输入参数</Text>
            <Tooltip title="为插件的输入参数设置值或引用变量">
              <InfoCircleOutlined style={{ color: '#999' }} />
            </Tooltip>
          </div>
          <div className="plugin-node-panel-v2-inputs">
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

export default PluginNodePanelV2;
