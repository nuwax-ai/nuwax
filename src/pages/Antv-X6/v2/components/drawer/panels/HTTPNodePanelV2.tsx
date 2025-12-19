/**
 * V2 HTTP请求节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Input, Select, InputNumber, Typography, Collapse, Tabs } from 'antd';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import PromptEditorV2 from '../../common/PromptEditorV2';
import KeyValueEditorV2 from '../../common/KeyValueEditorV2';

const { Text } = Typography;
const { Panel } = Collapse;

export interface HTTPNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
];

const CONTENT_TYPE_OPTIONS = [
  { label: 'application/json', value: 'application/json' },
  { label: 'application/x-www-form-urlencoded', value: 'application/x-www-form-urlencoded' },
  { label: 'multipart/form-data', value: 'multipart/form-data' },
  { label: 'text/plain', value: 'text/plain' },
];

const HTTPNodePanelV2: React.FC<HTTPNodePanelV2Props> = ({ node, referenceData }) => {
  const method = Form.useWatch('method');

  return (
    <div className="node-panel-v2">
      {/* 请求方法 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>请求方法</Text>
        </div>
        <Form.Item
          name="method"
          rules={[{ required: true, message: '请选择请求方法' }]}
          initialValue="GET"
        >
          <Select options={METHOD_OPTIONS} style={{ width: '100%' }} />
        </Form.Item>
      </div>

      {/* 请求URL */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>请求 URL</Text>
        </div>
        <Form.Item
          name="url"
          rules={[
            { required: true, message: '请输入请求 URL' },
            { type: 'url', message: '请输入有效的 URL' },
          ]}
        >
          <PromptEditorV2
            placeholder="https://api.example.com/endpoint"
            referenceData={referenceData}
            rows={2}
          />
        </Form.Item>
      </div>

      {/* Content-Type */}
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>Content-Type</Text>
          </div>
          <Form.Item name="contentType" initialValue="application/json">
            <Select options={CONTENT_TYPE_OPTIONS} style={{ width: '100%' }} />
          </Form.Item>
        </div>
      )}

      {/* 请求配置 */}
      <div className="node-panel-v2-section">
        <Tabs
          items={[
            {
              key: 'headers',
              label: 'Headers',
              children: (
                <Form.Item name="headers" noStyle>
                  <KeyValueEditorV2
                    placeholder={{ key: 'Header名', value: 'Header值' }}
                    referenceData={referenceData}
                  />
                </Form.Item>
              ),
            },
            {
              key: 'queries',
              label: 'Query参数',
              children: (
                <Form.Item name="queries" noStyle>
                  <KeyValueEditorV2
                    placeholder={{ key: '参数名', value: '参数值' }}
                    referenceData={referenceData}
                  />
                </Form.Item>
              ),
            },
            {
              key: 'body',
              label: 'Body',
              children: (
                <Form.Item name="body" noStyle>
                  <KeyValueEditorV2
                    placeholder={{ key: '字段名', value: '字段值' }}
                    referenceData={referenceData}
                  />
                </Form.Item>
              ),
            },
          ]}
        />
      </div>

      {/* 超时设置 */}
      <Collapse ghost>
        <Panel header="高级设置" key="advanced">
          <Form.Item label="超时时间(秒)" name="timeout" initialValue={30}>
            <InputNumber min={1} max={300} style={{ width: '100%' }} />
          </Form.Item>
        </Panel>
      </Collapse>
    </div>
  );
};

export default HTTPNodePanelV2;
