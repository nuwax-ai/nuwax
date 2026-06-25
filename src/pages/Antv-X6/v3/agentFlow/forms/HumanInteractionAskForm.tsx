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
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  Radio,
  RadioChangeEvent,
  Select,
  Space,
  Switch,
} from 'antd';
import React from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import { outPutConfigs } from '../../ParamsV3';
import { FormList, InputAndOut } from '../../component/commonNode';

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
  const { referenceList } = useModel('workflowV3');

  const replyMode =
    Form.useWatch('replyMode', { form, preserve: true }) || 'text';

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

  /** 切换回复模式，同步 answerType / options */
  const changeReplyMode = (mode: 'text' | 'options' | 'form') => {
    let options = form.getFieldValue('options');
    if (mode === 'options' && (!options || !options.length)) {
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
    if (mode === 'text' || mode === 'form') {
      options = options?.map((item: any) => ({
        ...item,
        nextNodeIds: [],
      }));
    }

    form.setFieldsValue({
      replyMode: mode,
      answerType:
        mode === 'options' ? AnswerTypeEnum.SELECT : AnswerTypeEnum.TEXT,
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
          name="replyMode"
          label={t('PC.Pages.AgentFlowNode.replyModeLabel', '回复模式')}
          initialValue="text"
        >
          <Radio.Group
            onChange={(e: RadioChangeEvent) => changeReplyMode(e.target.value)}
          >
            <Space direction="vertical">
              <Radio value="text">
                {t('PC.Pages.AgentFlowNode.replyModeTextReply', '文本回复')}
              </Radio>
              <Radio value="options">
                {t('PC.Pages.AgentFlowNode.replyModeOptionsReply', '选项回复')}
              </Radio>
              <Radio value="form">
                {t('PC.Pages.AgentFlowNode.replyModeFormReply', '表单回复')}
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="answerType" hidden>
          <Input />
        </Form.Item>
      </div>

      {replyMode === 'options' && (
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

      {replyMode === 'form' && (
        <div className="node-item-style">
          <Form.List name="formFields">
            {(fields, { add, remove }) => (
              <>
                <div className="dis-sb margin-bottom">
                  <span className="node-title-style">
                    {t('PC.Pages.AgentFlowNode.formFieldsTitle', '表单字段')}
                  </span>
                  <Button
                    icon={<PlusOutlined />}
                    size="small"
                    type="text"
                    onClick={() =>
                      add({ label: '', type: 'input', required: false })
                    }
                  />
                </div>
                {fields.map(({ key, name }) => {
                  const fieldType = formFieldTypes[name]?.type || 'input';
                  return (
                    <div key={key} className="margin-bottom">
                      <div className="dis-sb margin-bottom">
                        <span className="node-title-grey-style">
                          {t(
                            'PC.Pages.AgentFlowNode.formFieldIndex',
                            '字段 {{index}}',
                          ).replace('{{index}}', String(name + 1))}
                        </span>
                        <DeleteOutlined
                          className="ml-10"
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
                      >
                        <Switch size="small" />
                      </Form.Item>
                    </div>
                  );
                })}
              </>
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
