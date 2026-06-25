/**
 * HumanInteraction:ask 属性面板
 *
 * v2 变更：
 * - answerType → replyMode（text/options/form）
 * - options 模式每个选项对应一个输出端口
 * - form 模式支持多字段类型
 * - 新增 timeout、contextWriteKey
 */

import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Radio, Select, Switch } from 'antd';
import React from 'react';

const { TextArea } = Input;

const FORM_FIELD_TYPE_OPTIONS = [
  {
    label: t('PC.Pages.AgentFlowNode.formTypeInput', '单行文本'),
    value: 'input',
  },
  {
    label: t('PC.Pages.AgentFlowNode.formTypeNumber', '数字'),
    value: 'number',
  },
  {
    label: t('PC.Pages.AgentFlowNode.formTypeTextarea', '多行文本'),
    value: 'textarea',
  },
  { label: t('PC.Pages.AgentFlowNode.formTypeRadio', '单选'), value: 'radio' },
  {
    label: t('PC.Pages.AgentFlowNode.formTypeCheckbox', '多选'),
    value: 'checkbox',
  },
  { label: t('PC.Pages.AgentFlowNode.formTypeFile', '文件'), value: 'file' },
];

const HumanInteractionAskForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const replyMode =
    Form.useWatch('replyMode', { form, preserve: true }) || 'text';

  const formFieldTypes =
    Form.useWatch('formFields', { form, preserve: true }) || [];

  return (
    <div className="af-panel">
      <div className="af-section">
        <Form.Item
          name={['askConfig', 'question']}
          label={t('PC.Pages.AgentFlowNode.askQuestionLabel', '提问模板')}
          className="af-field"
        >
          <TextArea
            rows={3}
            placeholder={t(
              'PC.Pages.AgentFlowNode.askQuestionPlaceholder',
              '向用户提出的问题...',
            )}
          />
        </Form.Item>

        <Form.Item
          name="replyMode"
          label={t('PC.Pages.AgentFlowNode.replyModeLabel', '回复模式')}
          initialValue="text"
          className="af-field"
        >
          <Radio.Group optionType="button">
            <Radio.Button value="text">
              {t('PC.Pages.AgentFlowNode.replyModeText', '文本')}
            </Radio.Button>
            <Radio.Button value="options">
              {t('PC.Pages.AgentFlowNode.replyModeOptions', '选项')}
            </Radio.Button>
            <Radio.Button value="form">
              {t('PC.Pages.AgentFlowNode.replyModeForm', '表单')}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>
      </div>

      {replyMode === 'options' && (
        <div className="af-section">
          <div className="af-section-title">
            {t('PC.Pages.AgentFlowNode.askOptionsTitle', '选项内容')}
          </div>
          <Form.List name={['askConfig', 'options']}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <div key={key} className="af-inline-row">
                    <Form.Item
                      name={[name, 'content']}
                      rules={[{ required: true }]}
                    >
                      <Input
                        placeholder={t(
                          'PC.Pages.AgentFlowNode.optionContentPlaceholder',
                          '选项内容',
                        )}
                        style={{ width: 220 }}
                      />
                    </Form.Item>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                    />
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
                    add({ uuid, content: '', nextNodeIds: [] });
                  }}
                >
                  {t('PC.Pages.AgentFlowNode.optionAdd', '+ 添加选项')}
                </Button>
              </>
            )}
          </Form.List>
        </div>
      )}

      {replyMode === 'form' && (
        <div className="af-section">
          <div className="af-section-title">
            {t('PC.Pages.AgentFlowNode.formFieldsTitle', '表单字段')}
          </div>
          <Form.List name="formFields">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => {
                  const fieldType = formFieldTypes[name]?.type || 'input';
                  return (
                    <div key={key} className="af-card">
                      <div className="af-card-header">
                        <span>
                          {t(
                            'PC.Pages.AgentFlowNode.formFieldIndex',
                            '字段 {{index}}',
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
                        name={[name, 'label']}
                        label={t(
                          'PC.Pages.AgentFlowNode.formFieldLabel',
                          '字段名称',
                        )}
                        rules={[{ required: true }]}
                        className="af-field"
                      >
                        <Input
                          placeholder={t(
                            'PC.Pages.AgentFlowNode.formFieldLabelPlaceholder',
                            '字段名',
                          )}
                        />
                      </Form.Item>
                      <Form.Item
                        name={[name, 'type']}
                        label={t(
                          'PC.Pages.AgentFlowNode.formFieldType',
                          '字段类型',
                        )}
                        initialValue="input"
                        className="af-field"
                      >
                        <Select options={FORM_FIELD_TYPE_OPTIONS} />
                      </Form.Item>
                      {(fieldType === 'radio' || fieldType === 'checkbox') && (
                        <Form.Item
                          name={[name, 'options']}
                          label={t(
                            'PC.Pages.AgentFlowNode.formFieldOptions',
                            '选项',
                          )}
                          className="af-field"
                        >
                          <TextArea
                            rows={2}
                            placeholder={t(
                              'PC.Pages.AgentFlowNode.formFieldOptionsPlaceholder',
                              '每行一个选项',
                            )}
                          />
                        </Form.Item>
                      )}
                      <Form.Item
                        name={[name, 'required']}
                        label={t(
                          'PC.Pages.AgentFlowNode.formFieldRequired',
                          '必填',
                        )}
                        valuePropName="checked"
                        initialValue={false}
                        className="af-field"
                      >
                        <Switch size="small" />
                      </Form.Item>
                    </div>
                  );
                })}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  block
                  onClick={() =>
                    add({ label: '', type: 'input', required: false })
                  }
                >
                  {t('PC.Pages.AgentFlowNode.formFieldAdd', '+ 添加字段')}
                </Button>
              </>
            )}
          </Form.List>
        </div>
      )}

      <div className="af-section">
        <Form.Item
          name={['askConfig', 'required']}
          label={t('PC.Pages.AgentFlowNode.askRequiredLabel', '是否必填')}
          valuePropName="checked"
          initialValue={true}
          className="af-field"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name={['askConfig', 'timeout']}
          label={t('PC.Pages.AgentFlowNode.askTimeoutLabel', '超时时间（秒）')}
          className="af-field"
        >
          <InputNumber
            min={30}
            max={3600}
            style={{ width: '100%' }}
            placeholder={t(
              'PC.Pages.AgentFlowNode.askTimeoutPlaceholder',
              '不限制',
            )}
          />
        </Form.Item>

        <div className="af-hint">
          {t(
            'PC.Pages.AgentFlowNode.contextWriteKeyHint',
            '上下文写入：user_reply',
          )}
        </div>
      </div>
    </div>
  );
};

export default HumanInteractionAskForm;
