import { dict } from '@/services/i18nRuntime';
import {
  apiGetAgentSubscriptionConfig,
  apiListPricingPlans,
  apiSaveAgentSubscriptionConfig,
} from '@/services/subscriptionService';
import type {
  AgentSubscriptionConfig,
  PricingPlanInfo,
} from '@/types/interfaces/subscription';
import { CloseOutlined } from '@ant-design/icons';
import {
  Button,
  Drawer,
  Form,
  InputNumber,
  Select,
  Switch,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface Props {
  agentId: number;
  spaceId: number;
  visible: boolean;
  onClose: () => void;
}

const SubscriptionSetting: React.FC<Props> = ({
  agentId,
  spaceId,
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [plans, setPlans] = useState<PricingPlanInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);

  const { run: loadPlans } = useRequest(() => apiListPricingPlans(spaceId), {
    manual: true,
    onSuccess: (res) => setPlans(res?.data ?? []),
  });

  const { run: loadConfig } = useRequest(
    () => apiGetAgentSubscriptionConfig(agentId),
    {
      manual: true,
      onSuccess: (res) => {
        const config: AgentSubscriptionConfig = res?.data ?? {
          enabled: false,
          trialCount: 0,
          planIds: [],
          description: '',
        };
        setSubscriptionEnabled(config.enabled);
        form.setFieldsValue({
          enabled: config.enabled,
          trialCount: config.trialCount,
          planIds: config.planIds,
          description: config.description,
        });
      },
    },
  );

  useEffect(() => {
    if (visible) {
      loadPlans();
      loadConfig();
    }
  }, [visible, agentId]);

  const handleSave = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();
    setSaving(true);
    try {
      await apiSaveAgentSubscriptionConfig(agentId, values);
      message.success(dict('PC.Pages.EditAgent.subscriptionSaveSuccess'));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const planOptions = plans.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Drawer
      title={dict('PC.Pages.AgentEdit.subscriptionSetting')}
      open={visible}
      onClose={onClose}
      width={400}
      destroyOnHidden
      closeIcon={<CloseOutlined />}
      footer={
        <div className={cx(styles.footer)}>
          <Button onClick={onClose}>
            {dict('PC.Components.CustomFormModal.cancel')}
          </Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {dict('PC.Common.Global.save')}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="enabled"
          label={dict('PC.Pages.EditAgent.subscriptionEnabled')}
          valuePropName="checked"
        >
          <Switch onChange={setSubscriptionEnabled} />
        </Form.Item>
        {subscriptionEnabled && (
          <>
            <Form.Item
              name="trialCount"
              label={dict('PC.Pages.EditAgent.trialCount')}
              initialValue={0}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="planIds"
              label={dict('PC.Pages.EditAgent.linkedPlans')}
            >
              <Select mode="multiple" options={planOptions} allowClear />
            </Form.Item>
            <Form.Item
              name="description"
              label={dict('PC.Pages.EditAgent.subscriptionDesc')}
            >
              <textarea
                className={cx(styles.textarea)}
                maxLength={300}
                rows={4}
                onChange={(e) =>
                  form.setFieldValue('description', e.target.value)
                }
              />
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  );
};

export default SubscriptionSetting;
