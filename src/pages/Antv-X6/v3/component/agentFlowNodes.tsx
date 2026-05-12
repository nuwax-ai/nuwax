/**
 * AgentFlow 专用节点组件集合
 *
 * 包含：
 * - AgentNode               智能体节点（platform / subflow 两种模式）
 * - HumanInteractionNode    人类介入节点（ask / approve 两种模式）
 * - EvalGateNode            评估验证节点（N 个 validator + 失败回跳，骨架占位）
 * - ExternalConnectorNode   三方平台连接器（dify / n8n / coze / ragflow，骨架占位）
 *
 * 渲染入口由 `config/NodeRegistry.tsx` 统一管理。
 *
 * 当前阶段：节点 UI 骨架 + 关键字段表单；联调与流式回放在后端契约确定后补齐。
 */

import { t } from '@/services/i18nRuntime';
import {
  AgentNodeModeEnum,
  AnswerTypeEnum,
  EvalValidatorTypeEnum,
  ExternalConnectorProviderEnum,
  HitlApprovalActionEnum,
  HitlModeEnum,
} from '@/types/enums/common';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
} from 'antd';
import React from 'react';
import '../indexV3.less';

const { TextArea } = Input;

// 共用：表单项样式压缩
const fieldStyle: React.CSSProperties = { marginBottom: 8 };

/* -------------------------------------------------------------------------- */
/* Agent 节点                                                                 */
/* -------------------------------------------------------------------------- */

const AGENT_MODE_OPTIONS = [
  {
    label: t('PC.Pages.AgentFlowNode.agentModePlatform'),
    value: AgentNodeModeEnum.Platform,
  },
  {
    label: t('PC.Pages.AgentFlowNode.agentModeSubFlow'),
    value: AgentNodeModeEnum.SubFlow,
  },
];

const AgentNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const agentMode =
    Form.useWatch('agentMode', { form, preserve: true }) ||
    AgentNodeModeEnum.Platform;

  return (
    <div className="model-node-style">
      <Form.Item
        name="autoWirePrevOutput"
        label={t('PC.Pages.AgentFlowNode.autoWireLabel')}
        tooltip={t('PC.Pages.AgentFlowNode.autoWireTooltip')}
        valuePropName="checked"
        initialValue={true}
        style={fieldStyle}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="agentMode"
        label={t('PC.Pages.AgentFlowNode.agentModeLabel')}
        initialValue={AgentNodeModeEnum.Platform}
        style={fieldStyle}
      >
        <Radio.Group options={AGENT_MODE_OPTIONS} optionType="button" />
      </Form.Item>

      {agentMode === AgentNodeModeEnum.Platform ? (
        <Form.Item
          name="agentId"
          label={t('PC.Pages.AgentFlowNode.agentIdLabel')}
          style={fieldStyle}
        >
          {/* 暂用 InputNumber 占位；后端就绪后接入平台 Agent 列表 Select */}
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('PC.Pages.AgentFlowNode.agentIdPlaceholder')}
          />
        </Form.Item>
      ) : (
        <Form.Item
          name="subFlowId"
          label={t('PC.Pages.AgentFlowNode.subFlowIdLabel')}
          style={fieldStyle}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={t('PC.Pages.AgentFlowNode.subFlowIdPlaceholder')}
          />
        </Form.Item>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* HumanInteraction 节点                                                      */
/* -------------------------------------------------------------------------- */

const HITL_MODE_OPTIONS = [
  {
    label: t('PC.Pages.AgentFlowNode.hitlModeAsk'),
    value: HitlModeEnum.Ask,
  },
  {
    label: t('PC.Pages.AgentFlowNode.hitlModeApprove'),
    value: HitlModeEnum.Approve,
  },
];

const ANSWER_TYPE_OPTIONS = [
  {
    label: t('PC.Pages.AgentFlowNode.answerTypeText'),
    value: AnswerTypeEnum.TEXT,
  },
  {
    label: t('PC.Pages.AgentFlowNode.answerTypeSelect'),
    value: AnswerTypeEnum.SELECT,
  },
];

const APPROVE_ACTION_OPTIONS = [
  {
    label: t('PC.Pages.AgentFlowNode.approveActionApprove'),
    value: HitlApprovalActionEnum.Approve,
  },
  {
    label: t('PC.Pages.AgentFlowNode.approveActionEdit'),
    value: HitlApprovalActionEnum.Edit,
  },
  {
    label: t('PC.Pages.AgentFlowNode.approveActionReject'),
    value: HitlApprovalActionEnum.Reject,
  },
];

const HumanInteractionNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const hitlMode =
    Form.useWatch('hitlMode', { form, preserve: true }) || HitlModeEnum.Ask;
  const answerType =
    Form.useWatch(['askConfig', 'answerType'], { form, preserve: true }) ||
    AnswerTypeEnum.TEXT;

  return (
    <div className="model-node-style">
      <Form.Item
        name="hitlMode"
        label={t('PC.Pages.AgentFlowNode.hitlModeLabel')}
        initialValue={HitlModeEnum.Ask}
        style={fieldStyle}
      >
        <Radio.Group options={HITL_MODE_OPTIONS} optionType="button" />
      </Form.Item>

      {hitlMode === HitlModeEnum.Ask ? (
        <>
          <Form.Item
            name={['askConfig', 'question']}
            label={t('PC.Pages.AgentFlowNode.askQuestionLabel')}
            style={fieldStyle}
          >
            <TextArea
              rows={3}
              placeholder={t('PC.Pages.AgentFlowNode.askQuestionPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name={['askConfig', 'answerType']}
            label={t('PC.Pages.AgentFlowNode.askAnswerTypeLabel')}
            initialValue={AnswerTypeEnum.TEXT}
            style={fieldStyle}
          >
            <Radio.Group options={ANSWER_TYPE_OPTIONS} />
          </Form.Item>
          {answerType === AnswerTypeEnum.SELECT && (
            <Form.Item
              name={['askConfig', 'options']}
              label={t('PC.Pages.AgentFlowNode.askOptionsLabel')}
              style={fieldStyle}
              tooltip={t('PC.Pages.AgentFlowNode.askOptionsTooltip')}
            >
              {/* 占位：完整选项编辑用 FormList，骨架阶段先用 JSON */}
              <TextArea
                rows={3}
                placeholder='[{"index":0,"content":"A","uuid":"..."}]'
              />
            </Form.Item>
          )}
          <Form.Item
            name={['askConfig', 'answerKey']}
            label={t('PC.Pages.AgentFlowNode.askAnswerKeyLabel')}
            tooltip={t('PC.Pages.AgentFlowNode.askAnswerKeyTooltip')}
            style={fieldStyle}
          >
            <Input placeholder="userAnswer" />
          </Form.Item>
        </>
      ) : (
        <>
          <Form.Item
            name={['approveConfig', 'actions']}
            label={t('PC.Pages.AgentFlowNode.approveActionsLabel')}
            initialValue={[
              HitlApprovalActionEnum.Approve,
              HitlApprovalActionEnum.Edit,
              HitlApprovalActionEnum.Reject,
            ]}
            style={fieldStyle}
          >
            <Checkbox.Group options={APPROVE_ACTION_OPTIONS} />
          </Form.Item>
          <Form.Item
            name={['approveConfig', 'promptToReviewer']}
            label={t('PC.Pages.AgentFlowNode.approvePromptLabel')}
            style={fieldStyle}
          >
            <TextArea
              rows={3}
              placeholder={t('PC.Pages.AgentFlowNode.approvePromptPlaceholder')}
            />
          </Form.Item>
          <Form.Item
            name={['approveConfig', 'draftSource']}
            label={t('PC.Pages.AgentFlowNode.approveDraftSourceLabel')}
            tooltip={t('PC.Pages.AgentFlowNode.approveDraftSourceTooltip')}
            style={fieldStyle}
          >
            <Input placeholder="{{node.<prevId>.output}}" />
          </Form.Item>
        </>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* EvalGate 节点                                                              */
/* -------------------------------------------------------------------------- */

const EVAL_VALIDATOR_TYPE_OPTIONS = [
  {
    label: t('PC.Pages.AgentFlowNode.evalTypeRule'),
    value: EvalValidatorTypeEnum.Rule,
  },
  {
    label: t('PC.Pages.AgentFlowNode.evalTypeLlmJudge'),
    value: EvalValidatorTypeEnum.LlmJudge,
  },
];

const EVAL_ON_MAX_RETRY_OPTIONS = [
  { label: t('PC.Pages.AgentFlowNode.evalOnMaxRetryFail'), value: 'fail' },
  {
    label: t('PC.Pages.AgentFlowNode.evalOnMaxRetryContinue'),
    value: 'continue',
  },
  { label: t('PC.Pages.AgentFlowNode.evalOnMaxRetryHuman'), value: 'human' },
];

// 单个 validator 编辑区。type 决定 config 子表单形态。
const ValidatorItemFields: React.FC<{
  name: number;
  form: FormInstance;
}> = ({ name, form }) => {
  const validatorType =
    Form.useWatch(['evalValidators', name, 'type'], {
      form,
      preserve: true,
    }) ?? EvalValidatorTypeEnum.Rule;

  return (
    <>
      <Form.Item
        name={[name, 'name']}
        label={t('PC.Pages.AgentFlowNode.evalValidatorNameLabel')}
        rules={[{ required: true, max: 32 }]}
        style={fieldStyle}
      >
        <Input
          placeholder={t('PC.Pages.AgentFlowNode.evalValidatorNamePlaceholder')}
        />
      </Form.Item>
      <Form.Item
        name={[name, 'type']}
        label={t('PC.Pages.AgentFlowNode.evalValidatorTypeLabel')}
        initialValue={EvalValidatorTypeEnum.Rule}
        style={fieldStyle}
      >
        <Radio.Group
          options={EVAL_VALIDATOR_TYPE_OPTIONS}
          optionType="button"
        />
      </Form.Item>
      {validatorType === EvalValidatorTypeEnum.Rule ? (
        <Form.Item
          name={[name, 'config', 'rulePattern']}
          label={t('PC.Pages.AgentFlowNode.evalRulePatternLabel')}
          tooltip={t('PC.Pages.AgentFlowNode.evalRulePatternTooltip')}
          style={fieldStyle}
        >
          <Input placeholder="^订单号[:：]\\s*\\d+" />
        </Form.Item>
      ) : (
        <>
          <Form.Item
            name={[name, 'config', 'judgePrompt']}
            label={t('PC.Pages.AgentFlowNode.evalJudgePromptLabel')}
            rules={[{ required: true }]}
            style={fieldStyle}
          >
            <TextArea
              rows={3}
              placeholder={t(
                'PC.Pages.AgentFlowNode.evalJudgePromptPlaceholder',
              )}
            />
          </Form.Item>
          <Form.Item
            name={[name, 'config', 'modelId']}
            label={t('PC.Pages.AgentFlowNode.evalJudgeModelLabel')}
            style={fieldStyle}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name={[name, 'config', 'threshold']}
            label={t('PC.Pages.AgentFlowNode.evalJudgeThresholdLabel')}
            initialValue={0.7}
            style={fieldStyle}
          >
            <InputNumber
              min={0}
              max={1}
              step={0.05}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </>
      )}
      <Form.Item
        name={[name, 'onFail', 'reason']}
        label={t('PC.Pages.AgentFlowNode.evalOnFailReasonLabel')}
        rules={[{ required: true, max: 64 }]}
        style={fieldStyle}
      >
        <Input
          placeholder={t('PC.Pages.AgentFlowNode.evalOnFailReasonPlaceholder')}
        />
      </Form.Item>
      <Form.Item
        name={[name, 'onFail', 'targetNodeId']}
        label={t('PC.Pages.AgentFlowNode.evalOnFailTargetLabel')}
        tooltip={t('PC.Pages.AgentFlowNode.evalOnFailTargetTooltip')}
        rules={[{ required: true }]}
        style={fieldStyle}
      >
        <Input placeholder="agent_1" />
      </Form.Item>
      <Form.Item
        name={[name, 'onFail', 'appendPrompt']}
        label={t('PC.Pages.AgentFlowNode.evalOnFailAppendPromptLabel')}
        style={fieldStyle}
      >
        <TextArea
          rows={2}
          placeholder={t(
            'PC.Pages.AgentFlowNode.evalOnFailAppendPromptPlaceholder',
          )}
        />
      </Form.Item>
    </>
  );
};

const EvalGateNode: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <div className="model-node-style">
      <Form.Item
        name="evalMaxRetry"
        label={t('PC.Pages.AgentFlowNode.evalMaxRetryLabel')}
        initialValue={2}
        style={fieldStyle}
      >
        <InputNumber min={0} max={10} style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item
        name="evalOnMaxRetry"
        label={t('PC.Pages.AgentFlowNode.evalOnMaxRetryLabel')}
        initialValue="fail"
        style={fieldStyle}
      >
        <Select options={EVAL_ON_MAX_RETRY_OPTIONS} />
      </Form.Item>
      <div className="node-title-style" style={{ marginTop: 12 }}>
        {t('PC.Pages.AgentFlowNode.evalValidatorsTitle')}
      </div>
      <Form.List name="evalValidators">
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
                    {t('PC.Pages.AgentFlowNode.evalValidatorIndex').replace(
                      '{index}',
                      String(name + 1),
                    )}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                </Space>
                <ValidatorItemFields name={name} form={form} />
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
                  name: '',
                  type: EvalValidatorTypeEnum.Rule,
                  config: {},
                  onFail: { targetNodeId: '', appendPrompt: '', reason: '' },
                });
              }}
            >
              {t('PC.Pages.AgentFlowNode.evalValidatorAdd')}
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* ExternalConnector 节点                                                     */
/* -------------------------------------------------------------------------- */

const CONNECTOR_PROVIDER_OPTIONS = [
  { label: 'Dify', value: ExternalConnectorProviderEnum.Dify },
  { label: 'n8n', value: ExternalConnectorProviderEnum.N8n },
  { label: 'Coze', value: ExternalConnectorProviderEnum.Coze },
  { label: 'Ragflow', value: ExternalConnectorProviderEnum.Ragflow },
];

interface ProviderHints {
  endpointPlaceholder: string;
  payloadPlaceholder: string;
  authTooltipKey: string;
  defaultResponseMapping: Record<string, string>;
}

// provider → 默认 placeholder / 提示 / 响应映射，集中维护避免分散写
const PROVIDER_HINTS: Record<ExternalConnectorProviderEnum, ProviderHints> = {
  [ExternalConnectorProviderEnum.Dify]: {
    endpointPlaceholder: 'https://api.dify.ai/v1/workflows/run',
    payloadPlaceholder:
      '{"inputs": {"query": "{{context.userQuery}}"}, "user": "{{runId}}"}',
    authTooltipKey: 'PC.Pages.AgentFlowNode.connectorAuthDifyTooltip',
    defaultResponseMapping: {
      'context.connectorOutput': 'data.outputs.text',
    },
  },
  [ExternalConnectorProviderEnum.N8n]: {
    endpointPlaceholder: 'https://n8n.example.com/webhook/<id>',
    payloadPlaceholder: '{"query": "{{context.userQuery}}"}',
    authTooltipKey: 'PC.Pages.AgentFlowNode.connectorAuthN8nTooltip',
    defaultResponseMapping: {
      'context.connectorOutput': '$.result',
    },
  },
  [ExternalConnectorProviderEnum.Coze]: {
    endpointPlaceholder: 'https://api.coze.cn/v1/workflow/run',
    payloadPlaceholder:
      '{"workflow_id": "<id>", "parameters": {"query": "{{context.userQuery}}"}}',
    authTooltipKey: 'PC.Pages.AgentFlowNode.connectorAuthCozeTooltip',
    defaultResponseMapping: {
      'context.connectorOutput': 'data.output',
    },
  },
  [ExternalConnectorProviderEnum.Ragflow]: {
    endpointPlaceholder:
      'https://ragflow.example.com/v1/chats_openai/<chat_id>/chat/completions',
    payloadPlaceholder:
      '{"messages":[{"role":"user","content":"{{context.userQuery}}"}]}',
    authTooltipKey: 'PC.Pages.AgentFlowNode.connectorAuthRagflowTooltip',
    defaultResponseMapping: {
      'context.connectorOutput': 'choices[0].message.content',
    },
  },
};

const ExternalConnectorNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const provider =
    Form.useWatch('connectorProvider', { form, preserve: true }) ||
    ExternalConnectorProviderEnum.Dify;
  const hints = PROVIDER_HINTS[provider as ExternalConnectorProviderEnum];
  const responseMapping =
    (Form.useWatch(['connectorConfig', 'responseMapping'], {
      form,
      preserve: true,
    }) as Record<string, string> | undefined) || {};
  const responseMappingRows = Object.entries(responseMapping);

  const setResponseMappingRows = (rows: [string, string][]) => {
    const next = rows.reduce<Record<string, string>>(
      (acc, [contextKey, responsePath]) => {
        acc[contextKey] = responsePath;
        return acc;
      },
      {},
    );
    form.setFieldValue(['connectorConfig', 'responseMapping'], next);
  };

  const createUniqueContextKey = () => {
    const base = 'context.connectorOutput';
    if (!Object.prototype.hasOwnProperty.call(responseMapping, base)) {
      return base;
    }
    let index = responseMappingRows.length + 1;
    while (
      Object.prototype.hasOwnProperty.call(responseMapping, `${base}${index}`)
    ) {
      index += 1;
    }
    return `${base}${index}`;
  };

  return (
    <div className="model-node-style">
      <Form.Item
        name="autoWirePrevOutput"
        label={t('PC.Pages.AgentFlowNode.autoWireLabel')}
        tooltip={t('PC.Pages.AgentFlowNode.autoWireTooltip')}
        valuePropName="checked"
        initialValue={true}
        style={fieldStyle}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        name="connectorProvider"
        label={t('PC.Pages.AgentFlowNode.connectorProviderLabel')}
        initialValue={ExternalConnectorProviderEnum.Dify}
        style={fieldStyle}
      >
        <Select options={CONNECTOR_PROVIDER_OPTIONS} />
      </Form.Item>
      <Form.Item
        name={['connectorConfig', 'endpoint']}
        label={t('PC.Pages.AgentFlowNode.connectorEndpointLabel')}
        rules={[{ required: true, type: 'url' }]}
        style={fieldStyle}
      >
        <Input placeholder={hints.endpointPlaceholder} />
      </Form.Item>
      <Form.Item
        name={['connectorConfig', 'authRef']}
        label={t('PC.Pages.AgentFlowNode.connectorAuthRefLabel')}
        tooltip={t(hints.authTooltipKey)}
        rules={[{ required: true }]}
        style={fieldStyle}
      >
        <Input
          placeholder={t('PC.Pages.AgentFlowNode.connectorAuthRefPlaceholder')}
        />
      </Form.Item>
      <Form.Item
        name={['connectorConfig', 'payloadTemplate']}
        label={t('PC.Pages.AgentFlowNode.connectorPayloadTemplateLabel')}
        tooltip={t('PC.Pages.AgentFlowNode.connectorPayloadTemplateTooltip')}
        style={fieldStyle}
      >
        <TextArea rows={5} placeholder={hints.payloadPlaceholder} />
      </Form.Item>
      <div className="node-title-style" style={{ marginTop: 8 }}>
        {t('PC.Pages.AgentFlowNode.connectorResponseMappingTitle')}
      </div>
      {responseMappingRows.map(([contextKey, responsePath], index) => (
        <Space
          key={`${contextKey}-${index}`}
          style={{ display: 'flex', marginBottom: 4 }}
          align="baseline"
        >
          <Input
            value={contextKey}
            placeholder="context.connectorOutput"
            style={{ flex: 1 }}
            onChange={(event) => {
              const next = [...responseMappingRows];
              next[index] = [event.target.value, responsePath];
              setResponseMappingRows(next);
            }}
          />
          <span>←</span>
          <Input
            value={responsePath}
            placeholder="data.outputs.text"
            style={{ flex: 1 }}
            onChange={(event) => {
              const next = [...responseMappingRows];
              next[index] = [contextKey, event.target.value];
              setResponseMappingRows(next);
            }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              setResponseMappingRows(
                responseMappingRows.filter((_, i) => i !== index),
              )
            }
          />
        </Space>
      ))}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        block
        onClick={() => {
          const defaults = Object.entries(hints.defaultResponseMapping);
          const nextDefault = defaults.find(
            ([contextKey]) =>
              !Object.prototype.hasOwnProperty.call(
                responseMapping,
                contextKey,
              ),
          );
          const [contextKey, responsePath] = nextDefault || [
            createUniqueContextKey(),
            '',
          ];
          form.setFieldValue(['connectorConfig', 'responseMapping'], {
            ...responseMapping,
            [contextKey]: responsePath,
          });
        }}
      >
        {t('PC.Pages.AgentFlowNode.connectorResponseMappingAdd')}
      </Button>
    </div>
  );
};

export default {
  AgentNode,
  HumanInteractionNode,
  EvalGateNode,
  ExternalConnectorNode,
};
