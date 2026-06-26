/**
 * HumanInteraction（询问用户）属性面板
 *
 * 独立维护，对照 Workflow QuestionsNode；字段对齐 QA 扁平结构。
 * 样式对齐 Workflow V3：node-title-style + node-item-style
 */

import ExpandableInputTextarea from '@/components/ExpandTextArea';
import { ModelSelected } from '@/components/ModelSetting';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { t } from '@/services/i18nRuntime';
import { AnswerTypeEnum } from '@/types/enums/common';
import { InputItemNameEnum } from '@/types/enums/node';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Radio,
  RadioChangeEvent,
  Select,
  Space,
} from 'antd';
import React from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import { outPutConfigs } from '../../ParamsV3';
import { FormList, InputAndOut } from '../../component/commonNode';
import './HumanInteractionAskForm.less';

const { TextArea } = Input;

const FORM_FIELD_TYPE_OPTIONS = [
  { label: t('PC.Pages.AgentFlowNode.formTypeRadio', '单选'), value: 'radio' },
  {
    label: t('PC.Pages.AgentFlowNode.formTypeCheckbox', '多选'),
    value: 'checkbox',
  },
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
  {
    label: t('PC.Pages.AgentFlowNode.formTypeFile', '文件上传'),
    value: 'file',
  },
];

const HumanInteractionAskForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const { referenceList } = useModel('workflowV3');

  const answerType =
    Form.useWatch('answerType', { form, preserve: true }) ||
    AnswerTypeEnum.TEXT;

  const inputArgs =
    Form.useWatch(InputItemNameEnum.inputArgs, { form, preserve: true }) || [];

  const formFieldTypes =
    Form.useWatch('formFields', { form, preserve: true }) || [];

  const promptVariables = transformToPromptVariables(
    (inputArgs as InputAndOutConfig[]).filter(
      (item) => !['', null, undefined].includes(item.name),
    ),
    referenceList?.argMap,
  );

  /** 切换回答类型，同步 options（answerType 为权威字段） */
  const changeAnswerType = (type: AnswerTypeEnum) => {
    let options = form.getFieldValue('options');
    if (type === AnswerTypeEnum.SELECT && (!options || !options.length)) {
      options = [
        { uuid: uuidv4(), index: 0, content: '', nextNodeIds: [] },
        {
          uuid: uuidv4(),
          index: 1,
          content: t('PC.Pages.AntvX6CommonNode.otherBranchHint'),
          nextNodeIds: [],
        },
      ];
    }
    if (type !== AnswerTypeEnum.SELECT) {
      options = options?.map((item: any) => ({
        ...item,
        nextNodeIds: [],
      }));
    }

    form.setFieldsValue({
      answerType: type,
      options,
    });
    form.submit();
  };

  return (
    <div className="node-title-style">
      <ModelSelected form={form} />

      <div className="node-item-style">
        <InputAndOut
          title={t('PC.Pages.AgentFlowNode.inputRefVarsLabel', '引用变量')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>

      <div className="node-item-style">
        <ExpandableInputTextarea
          title={t('PC.Pages.AgentFlowNode.askQuestionLabel', '提问模版')}
          inputFieldName="question"
          onExpand
          placeholder={t(
            'PC.Pages.AgentFlowNode.askQuestionPlaceholder',
            '向用户提出的问题...',
          )}
          variables={promptVariables}
        />
      </div>

      <div className="node-item-style">
        <Form.Item
          name="answerType"
          label={t('PC.Pages.AgentFlowNode.replyModeLabel', '回复模式')}
          initialValue={AnswerTypeEnum.TEXT}
        >
          <Radio.Group
            onChange={(e: RadioChangeEvent) => changeAnswerType(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value={AnswerTypeEnum.TEXT}>
                {t('PC.Pages.AgentFlowNode.replyModeTextReply', '文本回复')}
              </Radio>
              <Radio value={AnswerTypeEnum.SELECT}>
                {t('PC.Pages.AgentFlowNode.replyModeOptionsReply', '选项回复')}
              </Radio>
              <Radio value={AnswerTypeEnum.FORM}>
                {t('PC.Pages.AgentFlowNode.replyModeFormReply', '表单回复')}
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
      </div>

      {answerType === AnswerTypeEnum.SELECT && (
        <div className="node-item-style">
          <FormList
            title={t('PC.Pages.AgentFlowNode.askOptionsTitle', '选项内容')}
            form={form}
            field="content"
            inputItemName={InputItemNameEnum.options}
            hasUuid
            showIndex
          />
        </div>
      )}

      {answerType === AnswerTypeEnum.FORM && (
        <div className="node-item-style">
          <Form.List name="formFields">
            {(fields, { add, remove }) => (
              <div className="ask-form-fields">
                <div className="node-title-style">
                  {t('PC.Pages.AgentFlowNode.formFieldsTitle', '表单字段')}
                </div>
                <div className="ask-form-fields__hint">
                  {t(
                    'PC.Pages.AgentFlowNode.formFieldsHint',
                    '定义用户需要填写的表单字段',
                  )}
                </div>

                {fields.map(({ key, name }) => {
                  const fieldType = formFieldTypes[name]?.type || 'input';
                  return (
                    <div key={key} className="ask-form-field-card">
                      <div className="ask-form-field-card__row">
                        <Form.Item
                          name={[name, 'label']}
                          noStyle
                          rules={[{ required: true }]}
                        >
                          <Input
                            className="ask-form-field-card__name"
                            placeholder={t(
                              'PC.Pages.AgentFlowNode.formFieldLabel',
                              '字段名称',
                            )}
                          />
                        </Form.Item>
                        <Form.Item
                          name={[name, 'type']}
                          noStyle
                          initialValue="input"
                        >
                          <Select
                            className="ask-form-field-card__type"
                            options={FORM_FIELD_TYPE_OPTIONS}
                          />
                        </Form.Item>
                        <Form.Item
                          name={[name, 'required']}
                          noStyle
                          valuePropName="checked"
                          initialValue={false}
                        >
                          <Checkbox className="ask-form-field-card__required">
                            {t(
                              'PC.Pages.AgentFlowNode.formFieldRequired',
                              '必填',
                            )}
                          </Checkbox>
                        </Form.Item>
                        <CloseOutlined
                          className="ask-form-field-card__del"
                          onClick={() => remove(name)}
                        />
                      </div>

                      <Form.Item name={[name, 'description']} noStyle>
                        <Input
                          className="ask-form-field-card__desc"
                          placeholder={t(
                            'PC.Pages.AgentFlowNode.formFieldDescriptionPlaceholder',
                            '填写说明（提示用户输入什么内容）',
                          )}
                        />
                      </Form.Item>

                      {(fieldType === 'radio' || fieldType === 'checkbox') && (
                        <Form.Item
                          name={[name, 'options']}
                          noStyle
                          getValueProps={(value) => ({
                            value: Array.isArray(value)
                              ? value.join('\n')
                              : value || '',
                          })}
                          normalize={(value) =>
                            typeof value === 'string'
                              ? value.split('\n')
                              : value
                          }
                        >
                          <TextArea
                            className="ask-form-field-card__options"
                            rows={2}
                            placeholder={t(
                              'PC.Pages.AgentFlowNode.formFieldOptionsPlaceholder',
                              '每行一个选项',
                            )}
                          />
                        </Form.Item>
                      )}
                    </div>
                  );
                })}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  className="ask-form-fields__add"
                  onClick={() =>
                    add({
                      label: '',
                      type: 'input',
                      required: false,
                      description: '',
                    })
                  }
                >
                  {t('PC.Pages.AgentFlowNode.formFieldAddBtn', '添加字段')}
                </Button>
              </div>
            )}
          </Form.List>
        </div>
      )}

      <div className="node-item-style">
        <Form.Item
          name="contextWriteKey"
          label={t('PC.Pages.AgentFlowNode.contextWriteKeyLabel', '上下文写入')}
          tooltip={t(
            'PC.Pages.AgentFlowNode.contextWriteKeyHint',
            '输出写入的上下文键名，如 user_reply',
          )}
        >
          <Input
            placeholder={t(
              'PC.Pages.AgentFlowNode.contextWriteKeyPlaceholder',
              '如 user_reply',
            )}
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default HumanInteractionAskForm;
