/**
 * V2 条件分支节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Button, Typography, Space, Card, Select, Input } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import { conditionOptionsV2 } from '../../../constants/stencilConfigV2';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

const { Text } = Typography;

export interface ConditionNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const ConditionNodePanelV2: React.FC<ConditionNodePanelV2Props> = ({ node, referenceData }) => {
  return (
    <div className="node-panel-v2">
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>条件分支配置</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            设置条件，满足条件时执行对应分支
          </Text>
        </div>

        <Form.List name="conditionBranchConfigs">
          {(fields, { add, remove }) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {fields.map((field, index) => (
                <Card
                  key={field.key}
                  size="small"
                  title={
                    <Form.Item
                      {...field}
                      name={[field.name, 'branchType']}
                      noStyle
                    >
                      <Select
                        style={{ width: 100 }}
                        options={[
                          { label: '如果', value: 'IF' },
                          { label: '否则如果', value: 'ELSE_IF' },
                          { label: '否则', value: 'ELSE' },
                        ]}
                      />
                    </Form.Item>
                  }
                  extra={
                    index > 0 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    )
                  }
                >
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) =>
                      prev?.conditionBranchConfigs?.[field.name]?.branchType !==
                      cur?.conditionBranchConfigs?.[field.name]?.branchType
                    }
                  >
                    {({ getFieldValue }) => {
                      const branchType = getFieldValue([
                        'conditionBranchConfigs',
                        field.name,
                        'branchType',
                      ]);

                      if (branchType === 'ELSE') {
                        return (
                          <Text type="secondary">
                            当以上条件都不满足时执行此分支
                          </Text>
                        );
                      }

                      return (
                        <Form.List name={[field.name, 'conditionArgs']}>
                          {(condFields, { add: addCond, remove: removeCond }) => (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {condFields.map((condField, condIndex) => (
                                <Space key={condField.key} align="start">
                                  <Form.Item
                                    {...condField}
                                    name={[condField.name, 'firstArg', 'bindValue']}
                                    noStyle
                                  >
                                    <VariableSelectorV2
                                      referenceData={referenceData}
                                      placeholder="选择变量"
                                      style={{ width: 100 }}
                                    />
                                  </Form.Item>

                                  <Form.Item
                                    {...condField}
                                    name={[condField.name, 'compareType']}
                                    noStyle
                                  >
                                    <Select
                                      placeholder="条件"
                                      options={conditionOptionsV2}
                                      style={{ width: 100 }}
                                    />
                                  </Form.Item>

                                  <Form.Item
                                    {...condField}
                                    name={[condField.name, 'secondArg', 'bindValue']}
                                    noStyle
                                  >
                                    <Input
                                      placeholder="值"
                                      style={{ width: 80 }}
                                    />
                                  </Form.Item>

                                  {condIndex > 0 && (
                                    <Button
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() => removeCond(condField.name)}
                                    />
                                  )}
                                </Space>
                              ))}
                              <Button
                                type="dashed"
                                size="small"
                                onClick={() => addCond()}
                                icon={<PlusOutlined />}
                              >
                                添加条件
                              </Button>
                            </div>
                          )}
                        </Form.List>
                      );
                    }}
                  </Form.Item>
                </Card>
              ))}

              <Button
                type="dashed"
                onClick={() =>
                  add({
                    branchType: fields.length === 0 ? 'IF' : 'ELSE_IF',
                    conditionArgs: [{}],
                    uuid: Date.now().toString(),
                  })
                }
                icon={<PlusOutlined />}
              >
                添加分支
              </Button>
            </div>
          )}
        </Form.List>
      </div>
    </div>
  );
};

export default ConditionNodePanelV2;
