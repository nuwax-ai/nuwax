/**
 * Agent 节点属性面板
 *
 * v2 变更：
 * - autoWirePrevOutput → contextPassMode (auto/manual)
 * - 移除 agentMode 选择（固定 Platform，无子工作流）
 * - 移除 agentInputs → contextParams.extraParams
 * - 新增 systemPrompt
 */

import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Segmented, Space } from 'antd';
import React from 'react';

const fieldStyle: React.CSSProperties = { marginBottom: 8 };
const { TextArea } = Input;

const AgentNodeForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const contextPassMode =
    Form.useWatch('contextPassMode', { form, preserve: true }) || 'auto';

  return (
    <div className="model-node-style">
      <Form.Item
        name="contextPassMode"
        label={t('PC.Pages.AgentFlowNode.contextPassModeLabel', '上下文传递')}
        initialValue="auto"
        style={fieldStyle}
      >
        <Segmented
          options={[
            {
              label: t('PC.Pages.AgentFlowNode.contextPassAuto', '自动'),
              value: 'auto',
            },
            {
              label: t('PC.Pages.AgentFlowNode.contextPassManual', '手动'),
              value: 'manual',
            },
          ]}
        />
      </Form.Item>

      {contextPassMode === 'manual' && (
        <>
          <Form.Item
            name={['contextParams', 'baseParam']}
            label={t('PC.Pages.AgentFlowNode.baseParamLabel', '基础参数')}
            style={fieldStyle}
          >
            <Input placeholder="user_input" />
          </Form.Item>
          <Form.List name={['contextParams', 'extraParams']}>
            {(fields, { add, remove }) => (
              <>
                <div className="node-title-style" style={{ marginTop: 8 }}>
                  {t('PC.Pages.AgentFlowNode.extraParamsTitle', '自定义参数')}
                </div>
                {fields.map(({ key, name }) => (
                  <Space
                    key={key}
                    style={{ display: 'flex', marginBottom: 4 }}
                    align="baseline"
                  >
                    <Form.Item
                      name={[name, 'name']}
                      rules={[{ required: true, max: 32 }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="param" style={{ width: 100 }} />
                    </Form.Item>
                    <Form.Item
                      name={[name, 'value']}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        placeholder="{{variable}}"
                        style={{ width: 180 }}
                      />
                    </Form.Item>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  block
                  onClick={() =>
                    add({ name: '', valueType: 'literal', value: '' })
                  }
                >
                  {t('PC.Pages.AgentFlowNode.extraParamsAdd', '+ 添加参数')}
                </Button>
              </>
            )}
          </Form.List>
        </>
      )}

      <Form.Item
        name="agentId"
        label={t('PC.Pages.AgentFlowNode.agentIdLabel', '智能体')}
        style={fieldStyle}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder={t(
            'PC.Pages.AgentFlowNode.agentIdPlaceholder',
            '选择智能体',
          )}
        />
      </Form.Item>

      <Form.Item
        name="systemPrompt"
        label={t('PC.Pages.AgentFlowNode.systemPromptLabel', '补充提示词')}
        tooltip={t(
          'PC.Pages.AgentFlowNode.systemPromptTooltip',
          '约束输出格式等，支持 {{变量}} 引用',
        )}
        style={fieldStyle}
      >
        <TextArea
          rows={3}
          placeholder={t(
            'PC.Pages.AgentFlowNode.systemPromptPlaceholder',
            '可添加提示词约束智能体输出格式...',
          )}
        />
      </Form.Item>
    </div>
  );
};

export default AgentNodeForm;
