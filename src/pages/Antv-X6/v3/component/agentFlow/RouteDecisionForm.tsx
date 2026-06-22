/**
 * RouteDecision 节点属性面板
 *
 * v2 变更：新增 modelId（识别模型）
 */

import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber } from 'antd';
import React from 'react';

const { TextArea } = Input;

const RouteDecisionForm: React.FC<NodeDisposeProps> = () => {
  return (
    <div className="af-panel">
      <div className="af-section">
        <Form.Item
          name="modelId"
          label={t('PC.Pages.AgentFlowNode.routeModelLabel', '识别模型')}
          className="af-field"
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
          className="af-field"
        >
          <TextArea
            rows={4}
            placeholder={t(
              'PC.Pages.AgentFlowNode.routeDecisionExtraPromptPlaceholder',
              '描述路由决策规则...',
            )}
          />
        </Form.Item>
      </div>

      <div className="af-section">
        <div className="af-section-title">
          {t('PC.Pages.AgentFlowNode.routeDecisionRoutesTitle', '路由分支')}
        </div>
        <Form.List name="routes">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <div key={key} className="af-card">
                  <div className="af-card-header">
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
                  </div>
                  <Form.Item
                    name={[name, 'routeName']}
                    label={t(
                      'PC.Pages.AgentFlowNode.routeDecisionRouteNameLabel',
                      '分支名称',
                    )}
                    rules={[{ required: true, max: 32 }]}
                    className="af-field"
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
                    className="af-field"
                  >
                    <TextArea
                      rows={2}
                      placeholder={t(
                        'PC.Pages.AgentFlowNode.routeDecisionRouteDescriptionPlaceholder',
                        '什么情况下走这条分支...',
                      )}
                    />
                  </Form.Item>
                  <Form.Item
                    name={[name, 'condition']}
                    label={t(
                      'PC.Pages.AgentFlowNode.routeDecisionRouteConditionLabel',
                      '条件比对',
                    )}
                    tooltip={t(
                      'PC.Pages.AgentFlowNode.routeDecisionRouteConditionTooltip',
                      '用于精确比对的条件表达式，如 {{var}} == value',
                    )}
                    className="af-field"
                  >
                    <TextArea
                      rows={2}
                      placeholder={t(
                        'PC.Pages.AgentFlowNode.routeDecisionRouteConditionPlaceholder',
                        '输入条件比对表达式，支持 {{变量}} 引用',
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
                  add({
                    uuid,
                    routeName: '',
                    description: '',
                    condition: '',
                    nextNodeIds: [],
                  });
                }}
              >
                {t(
                  'PC.Pages.AgentFlowNode.routeDecisionRouteAdd',
                  '+ 添加路由',
                )}
              </Button>
            </>
          )}
        </Form.List>
      </div>
    </div>
  );
};

export default RouteDecisionForm;
