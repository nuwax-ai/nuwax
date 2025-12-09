/**
 * V2 文本处理节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Radio, Input, Typography, Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import VariableSelectorV2 from '../../common/VariableSelectorV2';
import PromptEditorV2 from '../../common/PromptEditorV2';

const { Text } = Typography;

export interface TextProcessingNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const TextProcessingNodePanelV2: React.FC<TextProcessingNodePanelV2Props> = ({ node, referenceData }) => {
  const textHandleType = Form.useWatch('textHandleType');

  return (
    <div className="node-panel-v2">
      {/* 处理类型 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>处理类型</Text>
        </div>
        <Form.Item name="textHandleType" initialValue="CONCAT">
          <Radio.Group>
            <Radio value="CONCAT">文本拼接</Radio>
            <Radio value="SPLIT">文本分割</Radio>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 文本拼接 */}
      {textHandleType === 'CONCAT' && (
        <>
          <div className="node-panel-v2-section">
            <div className="node-panel-v2-section-header">
              <Text strong>拼接内容</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                输入要拼接的文本，支持变量引用
              </Text>
            </div>
            <Form.Item name="text">
              <PromptEditorV2
                placeholder="输入文本内容，使用 {{ }} 引用变量"
                referenceData={referenceData}
                rows={4}
              />
            </Form.Item>
          </div>

          <div className="node-panel-v2-section">
            <Form.Item label="连接符" name="join" initialValue="">
              <Input placeholder="输入连接符，如：, 或换行" />
            </Form.Item>
          </div>
        </>
      )}

      {/* 文本分割 */}
      {textHandleType === 'SPLIT' && (
        <>
          <div className="node-panel-v2-section">
            <div className="node-panel-v2-section-header">
              <Text strong>要分割的文本</Text>
            </div>
            <Form.Item
              name={['inputArgs', 0, 'bindValue']}
              rules={[{ required: true, message: '请选择文本变量' }]}
            >
              <VariableSelectorV2
                referenceData={referenceData}
                placeholder="选择文本变量"
              />
            </Form.Item>
          </div>

          <div className="node-panel-v2-section">
            <div className="node-panel-v2-section-header">
              <Text strong>分隔符</Text>
            </div>
            <Form.List name="splits">
              {(fields, { add, remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {fields.map((field, index) => (
                    <Space key={field.key}>
                      <Form.Item {...field} noStyle>
                        <Input
                          placeholder="输入分隔符"
                          style={{ width: 200 }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add('')}
                    icon={<PlusOutlined />}
                    size="small"
                  >
                    添加分隔符
                  </Button>
                </div>
              )}
            </Form.List>
          </div>
        </>
      )}
    </div>
  );
};

export default TextProcessingNodePanelV2;
