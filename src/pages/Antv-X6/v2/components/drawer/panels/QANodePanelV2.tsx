/**
 * V2 问答节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Input, Radio, Button, InputNumber, Typography, Card, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import { AnswerTypeEnumV2 } from '../../../types';
import PromptEditorV2 from '../../common/PromptEditorV2';

const { Text } = Typography;
const { TextArea } = Input;

export interface QANodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const QANodePanelV2: React.FC<QANodePanelV2Props> = ({ node, referenceData }) => {
  const answerType = Form.useWatch('answerType');

  return (
    <div className="node-panel-v2">
      {/* 问题 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>问题</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            向用户提出的问题，支持变量引用
          </Text>
        </div>
        <Form.Item
          name="question"
          rules={[{ required: true, message: '请输入问题' }]}
        >
          <PromptEditorV2
            placeholder="输入问题，如：请问您需要什么帮助？"
            referenceData={referenceData}
            rows={3}
          />
        </Form.Item>
      </div>

      {/* 回答类型 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>回答类型</Text>
        </div>
        <Form.Item name="answerType" initialValue={AnswerTypeEnumV2.TEXT}>
          <Radio.Group>
            <Radio value={AnswerTypeEnumV2.TEXT}>文本回答</Radio>
            <Radio value={AnswerTypeEnumV2.SELECT}>选项回答</Radio>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 文本回答配置 */}
      {answerType === AnswerTypeEnumV2.TEXT && (
        <>
          <div className="node-panel-v2-section">
            <Form.Item
              label="提取字段"
              name="extractField"
              valuePropName="checked"
            >
              <Radio.Group>
                <Radio value={true}>是</Radio>
                <Radio value={false}>否</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          <div className="node-panel-v2-section">
            <Form.Item
              label="最大回复次数"
              name="maxReplyCount"
              initialValue={3}
            >
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
          </div>
        </>
      )}

      {/* 选项回答配置 */}
      {answerType === AnswerTypeEnumV2.SELECT && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>选项配置</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              配置用户可选择的选项
            </Text>
          </div>

          <Form.List name="options">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fields.map((field, index) => (
                  <Card key={field.key} size="small">
                    <Space style={{ width: '100%' }} align="start">
                      <Text>{index + 1}.</Text>
                      <Form.Item
                        {...field}
                        name={[field.name, 'content']}
                        noStyle
                        rules={[{ required: true, message: '请输入选项内容' }]}
                      >
                        <Input
                          placeholder="选项内容"
                          style={{ width: 240 }}
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
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      index: fields.length,
                      content: '',
                      uuid: Date.now().toString(),
                    })
                  }
                  icon={<PlusOutlined />}
                >
                  添加选项
                </Button>
              </div>
            )}
          </Form.List>
        </div>
      )}
    </div>
  );
};

export default QANodePanelV2;
