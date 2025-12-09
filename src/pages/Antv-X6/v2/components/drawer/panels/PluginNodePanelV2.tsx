/**
 * V2 插件节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Typography, Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import InputArgsEditorV2 from '../../common/InputArgsEditorV2';

const { Text } = Typography;

export interface PluginNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const PluginNodePanelV2: React.FC<PluginNodePanelV2Props> = ({ node, referenceData }) => {
  const pluginId = node.typeId || node.nodeConfig?.pluginId;
  const toolName = node.nodeConfig?.toolName;

  return (
    <div className="node-panel-v2">
      {/* 插件信息 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>插件信息</Text>
        </div>
        {pluginId ? (
          <div className="plugin-info">
            <Text>插件 ID: {pluginId}</Text>
            {toolName && <Text type="secondary">工具: {toolName}</Text>}
          </div>
        ) : (
          <Empty
            description="暂未选择插件"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              选择插件
            </Button>
          </Empty>
        )}
      </div>

      {/* 输入参数 */}
      {pluginId && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>输入参数</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              配置插件的输入参数
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

export default PluginNodePanelV2;
