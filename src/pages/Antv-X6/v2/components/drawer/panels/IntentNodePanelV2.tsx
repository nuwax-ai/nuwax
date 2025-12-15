/**
 * V2 意图识别节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Space, Typography } from 'antd';
import React from 'react';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

const { Text } = Typography;

export interface IntentNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const IntentNodePanelV2: React.FC<IntentNodePanelV2Props> = ({
  node,
  referenceData,
}) => {
  return (
    <div className="node-panel-v2">
      {/* 输入文本 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>输入文本</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            选择要进行意图识别的文本变量
          </Text>
        </div>
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => {
            const prevBindValueType = prevValues?.inputArgs?.[0]?.bindValueType;
            const currentBindValueType =
              currentValues?.inputArgs?.[0]?.bindValueType;
            return prevBindValueType !== currentBindValueType;
          }}
        >
          {() => {
            const form = Form.useFormInstance();
            const bindValueType = form.getFieldValue([
              'inputArgs',
              0,
              'bindValueType',
            ]);
            return (
              <Form.Item
                name={['inputArgs', 0, 'bindValue']}
                rules={[{ required: true, message: '请选择输入文本' }]}
              >
                <VariableSelectorV2
                  referenceData={referenceData}
                  placeholder="选择文本变量"
                  form={form}
                  fieldName={['inputArgs', 0, 'bindValue']}
                  valueType={bindValueType}
                />
              </Form.Item>
            );
          }}
        </Form.Item>
      </div>

      {/* 意图配置 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>意图配置</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            配置可识别的意图选项
          </Text>
        </div>

        <Form.List name="intentConfigs">
          {(fields, { add, remove }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((field, index) => (
                <Card key={field.key} size="small">
                  <Space style={{ width: '100%' }} align="start">
                    <Text style={{ minWidth: 60 }}>意图 {index + 1}</Text>
                    <Form.Item
                      {...field}
                      name={[field.name, 'intent']}
                      noStyle
                      rules={[{ required: true, message: '请输入意图描述' }]}
                    >
                      <Input
                        placeholder="描述用户可能的意图"
                        style={{ width: 220 }}
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
                    intent: '',
                    uuid: Date.now().toString(),
                    nextNodeIds: [],
                  })
                }
                icon={<PlusOutlined />}
              >
                添加意图
              </Button>
            </div>
          )}
        </Form.List>
      </div>
    </div>
  );
};

export default IntentNodePanelV2;
