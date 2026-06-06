/**
 * RouteDecision 节点属性面板
 *
 * v2 变更：新增 modelId（识别模型）
 */

import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Space } from 'antd';
import React from 'react';

const { TextArea } = Input;
const fieldStyle: React.CSSProperties = { marginBottom: 8 };

const RouteDecisionForm: React.FC<NodeDisposeProps> = () => {
  return (
    <div className="model-node-style">
      <Form.Item
        name="modelId"
        label={t('PC.Pages.AgentFlowNode.routeModelLabel', '识别模型')}
        style={fieldStyle}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder={t(
            'PC.Pages.AgentFlowNode.routeModelPlaceholder',
            '选择识别模型',
          )}
        />
      </Form.Item>

      <Form.Item
        name="extraPrompt"
        label={t(
          'PC.Pages.AgentFlowNode.routeDecisionExtraPromptLabel',
          '系统提示词',
        )}
        tooltip={t(
          'PC.Pages.AgentFlowNode.routeDecisionExtraPromptTooltip',
          '指导 AI 如何做路由决策',
        )}
        style={fieldStyle}
      >
        <TextArea
          rows={4}
          placeholder={t(
            'PC.Pages.AgentFlowNode.routeDecisionExtraPromptPlaceholder',
            '描述路由决策规则...',
          )}
        />
      </Form.Item>

      <div className="node-title-style" style={{ marginTop: 12 }}>
        {t('PC.Pages.AgentFlowNode.routeDecisionRoutesTitle', '路由分支')}
      </div>
      <Form.List name="routes">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <div
                key={key}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 6,
                  padding: 8,
                  marginBottom: 8,
                }}
              >
                <Space
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {t(
                      'PC.Pages.AgentFlowNode.routeDecisionRouteIndex',
                      '路由 {{index}}',
                    ).replace('{{index}}', String(name + 1))}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </Space>
                <Form.Item
                  name={[name, 'routeName']}
                  label={t(
                    'PC.Pages.AgentFlowNode.routeDecisionRouteNameLabel',
                    '分支名称',
                  )}
                  rules={[{ required: true, max: 32 }]}
                  style={fieldStyle}
                >
                  <Input
                    placeholder={t(
                      'PC.Pages.AgentFlowNode.routeDecisionRouteNamePlaceholder',
                      '路由名称',
                    )}
                  />
                </Form.Item>
                <Form.Item
                  name={[name, 'description']}
                  label={t(
                    'PC.Pages.AgentFlowNode.routeDecisionRouteDescriptionLabel',
                    '分支描述',
                  )}
                  style={fieldStyle}
                >
                  <TextArea
                    rows={2}
                    placeholder={t(
                      'PC.Pages.AgentFlowNode.routeDecisionRouteDescriptionPlaceholder',
                      '什么情况下走这条分支...',
                    )}
                  />
                </Form.Item>
              </div>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={() => {
                const uuid = `${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 9)}`;
                add({ uuid, routeName: '', description: '', nextNodeIds: [] });
              }}
            >
              {t('PC.Pages.AgentFlowNode.routeDecisionRouteAdd', '+ 添加路由')}
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default RouteDecisionForm;
