/**
 * EvalGate 节点属性面板
 *
 * v2 变更：
 * - evalValidators → evalItems（加权评分）
 * - evalOnMaxRetry → evalFailMsg
 * - 新增 modelId、passThreshold、evalOutput
 * - 新增 branches 动态分支
 */

import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Space, Switch } from 'antd';
import React from 'react';

const fieldStyle: React.CSSProperties = { marginBottom: 8 };
const { TextArea } = Input;

const EvalGateForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const evalItems = Form.useWatch('evalItems', { form, preserve: true }) || [];

  // 权重校验 — 用于 Form.List 级别自定义 validator
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateWeight = (_: any, _value: number) => {
    const items = form.getFieldValue('evalItems') || [];
    const total = items.reduce(
      (sum: number, item: any) => sum + (Number(item?.weight) || 0),
      0,
    );
    if (total !== 100) {
      return Promise.reject(
        new Error(
          t('PC.Pages.AgentFlowNode.evalWeightError', '权重合计需等于 100%'),
        ),
      );
    }
    return Promise.resolve();
  };

  return (
    <div className="model-node-style">
      <Form.Item
        name="modelId"
        label={t('PC.Pages.AgentFlowNode.evalModelLabel', '评估模型')}
        style={fieldStyle}
      >
        <InputNumber
          style={{ width: '100%' }}
          placeholder={t(
            'PC.Pages.AgentFlowNode.evalModelPlaceholder',
            '选择评估模型',
          )}
        />
      </Form.Item>

      <Form.Item
        name="autoWirePrevOutput"
        label={t(
          'PC.Pages.AgentFlowNode.shareContextLabel',
          '共用上游智能体上下文',
        )}
        valuePropName="checked"
        initialValue={true}
        style={fieldStyle}
      >
        <Switch />
      </Form.Item>

      <div className="node-title-style" style={{ marginTop: 12 }}>
        {t('PC.Pages.AgentFlowNode.evalItemsTitle', '评估项目')}
      </div>
      <Form.List name="evalItems">
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
                      'PC.Pages.AgentFlowNode.evalItemIndex',
                      '评估项 {{index}}',
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
                  name={[name, 'name']}
                  label={t(
                    'PC.Pages.AgentFlowNode.evalItemNameLabel',
                    '项目名称',
                  )}
                  rules={[{ required: true, max: 32 }]}
                  style={fieldStyle}
                >
                  <Input
                    placeholder={t(
                      'PC.Pages.AgentFlowNode.evalItemNamePlaceholder',
                      '准确性',
                    )}
                  />
                </Form.Item>
                <Form.Item
                  name={[name, 'weight']}
                  label={t(
                    'PC.Pages.AgentFlowNode.evalItemWeightLabel',
                    '权重',
                  )}
                  rules={[{ required: true }]}
                  style={fieldStyle}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    addonAfter="%"
                    style={{ width: '100%' }}
                    placeholder="0"
                  />
                </Form.Item>
                <Form.Item
                  name={[name, 'description']}
                  label={t(
                    'PC.Pages.AgentFlowNode.evalItemDescLabel',
                    '评估标准',
                  )}
                  style={fieldStyle}
                >
                  <TextArea
                    rows={2}
                    placeholder={t(
                      'PC.Pages.AgentFlowNode.evalItemDescPlaceholder',
                      '评估标准描述',
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
                add({ uuid, name: '', weight: 0, description: '' });
              }}
            >
              {t('PC.Pages.AgentFlowNode.evalItemAdd', '+ 添加评估项')}
            </Button>
          </>
        )}
      </Form.List>

      {evalItems.length > 0 && (
        <Form.Item
          label={t('PC.Pages.AgentFlowNode.evalWeightTotalLabel', '权重合计')}
          style={{ ...fieldStyle, marginTop: 8 }}
        >
          <span style={{ fontWeight: 600 }}>
            {evalItems.reduce(
              (sum: number, item: any) => sum + (Number(item?.weight) || 0),
              0,
            )}
            %
          </span>
        </Form.Item>
      )}

      <Form.Item
        name="passThreshold"
        label={t('PC.Pages.AgentFlowNode.passThresholdLabel', '通过阈值')}
        initialValue={80}
        style={fieldStyle}
      >
        <InputNumber
          min={0}
          max={100}
          addonAfter={t('PC.Pages.AgentFlowNode.passThresholdSuffix', '分')}
          style={{ width: '100%' }}
        />
      </Form.Item>

      <Form.Item
        name="evalOutput"
        label={t('PC.Pages.AgentFlowNode.evalOutputLabel', '评估过程输出')}
        valuePropName="checked"
        initialValue={true}
        style={fieldStyle}
      >
        <Switch />
      </Form.Item>

      <Form.Item
        name="evalMaxRetry"
        label={t(
          'PC.Pages.AgentFlowNode.evalMaxRetryLabel',
          '最多循环评估次数',
        )}
        initialValue={3}
        style={fieldStyle}
      >
        <InputNumber min={1} max={10} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        name="evalFailMsg"
        label={t('PC.Pages.AgentFlowNode.evalFailMsgLabel', '超限未通过提示')}
        style={fieldStyle}
      >
        <TextArea
          rows={2}
          placeholder={t(
            'PC.Pages.AgentFlowNode.evalFailMsgPlaceholder',
            '智能体输出结果评估未通过，请仔细甄别',
          )}
        />
      </Form.Item>

      <div className="node-title-style" style={{ marginTop: 12 }}>
        {t('PC.Pages.AgentFlowNode.evalBranchesTitle', '评估分支')}
      </div>
      <Form.List name="branches">
        {(fields, { add, remove }) => (
          <>
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
                  <Input
                    placeholder={t(
                      'PC.Pages.AgentFlowNode.branchNamePlaceholder',
                      '分支名称',
                    )}
                    style={{ width: 120 }}
                  />
                </Form.Item>
                <Form.Item name={[name, 'desc']} style={{ marginBottom: 0 }}>
                  <Input
                    placeholder={t(
                      'PC.Pages.AgentFlowNode.branchDescPlaceholder',
                      '描述',
                    )}
                    style={{ width: 160 }}
                  />
                </Form.Item>
                {name > 0 && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => remove(name)}
                  />
                )}
              </Space>
            ))}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={() => {
                const uuid = `${Date.now()}-${Math.random()
                  .toString(36)
                  .substring(2, 9)}`;
                add({ uuid, name: '', desc: '', nextNodeIds: [] });
              }}
            >
              {t('PC.Pages.AgentFlowNode.evalBranchAdd', '+ 添加不通过分支')}
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

export default EvalGateForm;
