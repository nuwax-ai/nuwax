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
import { Button, Form, Input, InputNumber, Switch } from 'antd';
import React from 'react';

const { TextArea } = Input;

const EvalGateForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const evalItems = Form.useWatch('evalItems', { form, preserve: true }) || [];

  return (
    <div className="af-panel">
      <div className="af-section">
        <Form.Item
          name="modelId"
          label={t('PC.Pages.AgentFlowNode.evalModelLabel', '评估模型')}
          className="af-field"
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
          className="af-field"
        >
          <Switch />
        </Form.Item>
      </div>

      <div className="af-section">
        <div className="af-section-title">
          {t('PC.Pages.AgentFlowNode.evalItemsTitle', '评估项目')}
        </div>
        <Form.List name="evalItems">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <div key={key} className="af-card">
                  <div className="af-card-header">
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
                  </div>
                  <Form.Item
                    name={[name, 'name']}
                    label={t(
                      'PC.Pages.AgentFlowNode.evalItemNameLabel',
                      '项目名称',
                    )}
                    rules={[{ required: true, max: 32 }]}
                    className="af-field"
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
                    className="af-field"
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
                    className="af-field"
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
            className="af-weight-total"
          >
            <span>
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
          className="af-field"
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
          className="af-field"
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
          className="af-field"
        >
          <InputNumber min={1} max={10} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="evalFailMsg"
          label={t('PC.Pages.AgentFlowNode.evalFailMsgLabel', '超限未通过提示')}
          className="af-field"
        >
          <TextArea
            rows={2}
            placeholder={t(
              'PC.Pages.AgentFlowNode.evalFailMsgPlaceholder',
              '智能体输出结果评估未通过，请仔细甄别',
            )}
          />
        </Form.Item>
      </div>

      <div className="af-section">
        <div className="af-section-title">
          {t('PC.Pages.AgentFlowNode.evalBranchesTitle', '评估分支')}
        </div>
        <Form.List name="branches">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <div key={key} className="af-inline-row">
                  <Form.Item
                    name={[name, 'name']}
                    rules={[{ required: true, max: 32 }]}
                  >
                    <Input
                      placeholder={t(
                        'PC.Pages.AgentFlowNode.branchNamePlaceholder',
                        '分支名称',
                      )}
                      style={{ width: 120 }}
                    />
                  </Form.Item>
                  <Form.Item name={[name, 'desc']}>
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
                  add({ uuid, name: '', desc: '', nextNodeIds: [] });
                }}
              >
                {t('PC.Pages.AgentFlowNode.evalBranchAdd', '+ 添加不通过分支')}
              </Button>
            </>
          )}
        </Form.List>
      </div>
    </div>
  );
};

export default EvalGateForm;
