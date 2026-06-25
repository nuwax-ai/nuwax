/**
 * RouteDecision（路由决策）属性面板
 *
 * 独立维护，对照 Workflow IntentionNode；后端 type 映射为 IntentRecognition。
 * 样式对齐 Workflow V3：model-node-style + node-item-style + node-title-style
 */

import ExpandableInputTextarea from '@/components/ExpandTextArea';
import { ModelSelected } from '@/components/ModelSetting';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { t } from '@/services/i18nRuntime';
import { InputItemNameEnum } from '@/types/enums/node';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import React from 'react';
import { useModel } from 'umi';
import { outPutConfigs } from '../../ParamsV3';
import { InputAndOut } from '../../component/commonNode';

const { TextArea } = Input;

const RouteDecisionForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const { referenceList } = useModel('workflowV3');

  const inputArgs =
    Form.useWatch(InputItemNameEnum.inputArgs, { form, preserve: true }) || [];

  const promptVariables = transformToPromptVariables(
    (inputArgs as InputAndOutConfig[]).filter(
      (item) => !['', null, undefined].includes(item.name),
    ),
    referenceList?.argMap,
  );

  return (
    <div className="model-node-style">
      <Form.Item noStyle>
        <ModelSelected form={form} />
      </Form.Item>

      <div className="node-item-style">
        <InputAndOut
          title={t('PC.Pages.AgentFlowNode.routeInputLabel', '输入')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>

      <div className="node-item-style">
        <ExpandableInputTextarea
          title={t(
            'PC.Pages.AgentFlowNode.routeExtraPromptLabel',
            '补充提示词',
          )}
          inputFieldName="extraPrompt"
          onExpand
          placeholder={t(
            'PC.Pages.AgentFlowNode.routeDecisionExtraPromptPlaceholder',
            '描述路由决策规则...',
          )}
          variables={promptVariables}
        />
      </div>

      <div className="node-item-style">
        <Form.List name="intentConfigs">
          {(fields, { add, remove }) => (
            <>
              <div className="dis-sb margin-bottom">
                <span className="node-title-style">
                  {t('PC.Pages.AgentFlowNode.routeBranchesTitle', '路由分支')}
                </span>
                <Button
                  icon={<PlusOutlined />}
                  size="small"
                  type="text"
                  onClick={() => {
                    const uuid = `${Date.now()}-${Math.random()
                      .toString(36)
                      .substring(2, 9)}`;
                    add({
                      uuid,
                      intent: '',
                      description: '',
                      condition: '',
                      nextNodeIds: [],
                    });
                  }}
                />
              </div>
              {fields.map(({ key, name }) => (
                <div key={key} className="margin-bottom">
                  <div className="dis-sb margin-bottom">
                    <span className="node-title-grey-style">
                      {t(
                        'PC.Pages.AgentFlowNode.routeDecisionRouteIndex',
                        '路由 {{index}}',
                      ).replace('{{index}}', String(name + 1))}
                    </span>
                    <DeleteOutlined
                      className="ml-10"
                      onClick={() => remove(name)}
                    />
                  </div>
                  <Form.Item
                    name={[name, 'intent']}
                    label={t(
                      'PC.Pages.AgentFlowNode.routeDecisionRouteNameLabel',
                      '分支名称',
                    )}
                    rules={[{ required: true, max: 32 }]}
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
            </>
          )}
        </Form.List>
      </div>
    </div>
  );
};

export default RouteDecisionForm;
