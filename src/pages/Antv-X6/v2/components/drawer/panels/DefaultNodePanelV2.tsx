/**
 * V2 默认节点配置面板
 * 用于未定义专用面板的节点类型
 * 完全独立，不依赖 v1 任何代码
 */

import { Alert, Descriptions, Form, Input, Typography } from 'antd';
import React from 'react';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';

const { TextArea } = Input;
const { Text } = Typography;

export interface DefaultNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const DefaultNodePanelV2: React.FC<DefaultNodePanelV2Props> = ({ node }) => {
  return (
    <div className="node-panel-v2">
      <Alert
        message="未知节点类型"
        description={`当前节点类型 "${
          node?.type || '未知'
        }" 暂无专用配置面板，您可以查看基础信息。`}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Descriptions
        title="节点信息"
        column={1}
        size="small"
        bordered
        style={{ marginBottom: 16 }}
      >
        <Descriptions.Item label="节点ID">
          <Text copyable>{node?.id || '-'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="节点类型">
          {node?.type || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="节点名称">
          {node?.name || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Form layout="vertical">
        <Form.Item label="节点描述">
          <TextArea
            value={node?.description || ''}
            placeholder="暂无描述"
            rows={3}
            disabled
          />
        </Form.Item>

        <Form.Item label="原始配置 (JSON)">
          <TextArea
            value={JSON.stringify(node, null, 2)}
            rows={10}
            disabled
            style={{ fontFamily: 'monospace', fontSize: 12 }}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default DefaultNodePanelV2;
