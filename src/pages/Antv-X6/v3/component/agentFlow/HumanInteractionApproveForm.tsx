/**
 * HumanInteraction:approve 属性面板
 *
 * v2 变更：
 * - approveConfig 嵌套 → 扁平字段
 * - 固定 approve/reject → 动态 branches
 * - 新增 confirmRole、approvalMode、instruction、channels 等
 */

import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, InputNumber, Radio, Select, Switch } from 'antd';
import React from 'react';

const { TextArea } = Input;

const HumanInteractionApproveForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const confirmRole =
    Form.useWatch('confirmRole', { form, preserve: true }) || 'user';

  return (
    <div className="af-panel">
      <div className="af-section">
        <Form.Item
          name="confirmRole"
          label={t('PC.Pages.AgentFlowNode.confirmRoleLabel', '确认角色')}
          initialValue="user"
          className="af-field"
        >
          <Radio.Group>
            <Radio.Button value="user">
              {t('PC.Pages.AgentFlowNode.confirmRoleUser', '使用者确认')}
            </Radio.Button>
            <Radio.Button value="external">
              {t('PC.Pages.AgentFlowNode.confirmRoleExternal', '外部確認')}
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="approvalMode"
          label={t('PC.Pages.AgentFlowNode.approvalModeLabel', '审核模式')}
          initialValue="approve_reject"
          className="af-field"
        >
          <Select
            options={[
              {
                label: t(
                  'PC.Pages.AgentFlowNode.approvalModeApproveReject',
                  '通过 / 拒绝',
                ),
                value: 'approve_reject',
              },
              {
                label: t(
                  'PC.Pages.AgentFlowNode.approvalModeEditApprove',
                  '可编辑后通过',
                ),
                value: 'edit_approve',
              },
              ...(confirmRole === 'user'
                ? [
                    {
                      label: t(
                        'PC.Pages.AgentFlowNode.approvalModeAlwaysPass',
                        '仅通知（自动通过）',
                      ),
                      value: 'always_pass',
                    },
                  ]
                : []),
            ]}
          />
        </Form.Item>

        <Form.Item
          name="instruction"
          label={t('PC.Pages.AgentFlowNode.instructionLabel', '审核说明')}
          className="af-field"
        >
          <TextArea
            rows={3}
            placeholder={t(
              'PC.Pages.AgentFlowNode.instructionPlaceholder',
              '向审核人说明需要确认的内容...',
            )}
          />
        </Form.Item>
      </div>

      <div className="af-section">
        <div className="af-section-title">
          {t('PC.Pages.AgentFlowNode.approveBranchesTitle', '输出分支')}
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
                {t('PC.Pages.AgentFlowNode.approveBranchAdd', '+ 添加分支')}
              </Button>
            </>
          )}
        </Form.List>
      </div>

      {confirmRole === 'external' && (
        <div className="af-section">
          <div className="af-section-title">
            {t('PC.Pages.AgentFlowNode.channelsTitle', '确认通道')}
          </div>
          <Form.List name="channels">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <div key={key} className="af-inline-row">
                    <Form.Item name={[name, 'type']}>
                      <Select
                        style={{ width: 120 }}
                        options={[{ label: 'Webhook', value: 'webhook' }]}
                      />
                    </Form.Item>
                    <Form.Item name={[name, 'enabled']} valuePropName="checked">
                      <Switch />
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
                  onClick={() => add({ type: 'webhook', enabled: true })}
                >
                  {t('PC.Pages.AgentFlowNode.channelAdd', '+ 添加通道')}
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item
            name="channelTimeout"
            label={t(
              'PC.Pages.AgentFlowNode.channelTimeoutLabel',
              '等待超时（秒）',
            )}
            initialValue={300}
            className="af-field"
          >
            <InputNumber min={30} max={86400} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="escalation"
            label={t('PC.Pages.AgentFlowNode.escalationLabel', '超时处理')}
            initialValue="skip"
            className="af-field"
          >
            <Select
              options={[
                {
                  label: t(
                    'PC.Pages.AgentFlowNode.escalationSkip',
                    '跳过（自动通过）',
                  ),
                  value: 'skip',
                },
                {
                  label: t(
                    'PC.Pages.AgentFlowNode.escalationReject',
                    '自动拒绝',
                  ),
                  value: 'reject',
                },
                {
                  label: t(
                    'PC.Pages.AgentFlowNode.escalationRetry',
                    '重新通知审核人',
                  ),
                  value: 'retry',
                },
                {
                  label: t(
                    'PC.Pages.AgentFlowNode.escalationAbort',
                    '中止工作流',
                  ),
                  value: 'abort',
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="channelRetry"
            label={t('PC.Pages.AgentFlowNode.channelRetryLabel', '重试次数')}
            initialValue={3}
            className="af-field"
          >
            <InputNumber min={0} max={10} style={{ width: '100%' }} />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default HumanInteractionApproveForm;
