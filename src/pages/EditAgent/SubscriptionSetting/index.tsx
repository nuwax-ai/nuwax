import ConditionRender from '@/components/ConditionRender';
import {
  apiQueryToolPricing,
  apiUpdateToolPricing,
} from '@/pages/SpaceResource/services/resource';
import {
  ResourcePricingConfigInfo,
  ResourcePricingStatus,
  ToolPricingTargetType,
} from '@/pages/SpaceResource/types/resource';
import { dict } from '@/services/i18nRuntime';
import {
  apiDeletePricingPlan,
  apiTogglePricingPlan,
} from '@/services/subscriptionService';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  PricingCycleEnum,
  PricingPlanInfo,
} from '@/types/interfaces/subscription';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, InputNumber, Switch, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { apiGetAgentSubscriptionPlanList } from '../services/agent-subscription-plan';
import CreatePlanModal from './CreatePlanModal';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SubscriptionSettingProps {
  agentId: number;
  spaceId: number;
  visible: boolean;
}

/**
 * 订阅设置
 */
const SubscriptionSetting: React.FC<SubscriptionSettingProps> = ({
  agentId,
  spaceId,
  visible,
}) => {
  const [form] = Form.useForm();
  const [plans, setPlans] = useState<PricingPlanInfo[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  // 订阅模式是否开启
  const [subscriptionEnabled, setSubscriptionEnabled] =
    useState<boolean>(false);
  // 创建套餐模态框是否打开
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  // 智能体资源定价配置
  const [agentResourcePricingConfig, setAgentResourcePricingConfig] =
    useState<ResourcePricingConfigInfo | null>(null);

  const { run: loadAgentSubscriptionPlans } = useRequest(
    apiGetAgentSubscriptionPlanList,
    {
      manual: true,
      onSuccess: (res: RequestResponse<PricingPlanInfo[]>) =>
        setPlans(res?.data ?? []),
    },
  );

  const handleLoadAgentSubscriptionPlans = () => {
    loadAgentSubscriptionPlans({
      agentId,
    });
  };

  const { run: runTogglePlan } = useRequest(apiTogglePricingPlan, {
    manual: true,
    onSuccess: () => {
      handleLoadAgentSubscriptionPlans();
    },
  });

  const { run: runDeletePlan } = useRequest(apiDeletePricingPlan, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.deleteSuccess'));
      handleLoadAgentSubscriptionPlans();
    },
  });

  // 查询当前智能体定价状态（用于回填开关）
  const { run: loadPricingStatus } = useRequest(apiQueryToolPricing, {
    manual: true,
    onSuccess: (data: ResourcePricingConfigInfo) => {
      setAgentResourcePricingConfig(data);
      const enabled = data?.status === ResourcePricingStatus.ENABLED;
      setSubscriptionEnabled(enabled);
      form.setFieldsValue({
        trialCount: data?.trialCount || 0,
      });
    },
  });

  // 更新定价配置
  const { run: runUpdatePricingConfig } = useRequest(apiUpdateToolPricing, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.operationSuccess'));
    },
    onError: () => {
      message.error(dict('PC.Common.Global.operationFailed'));
    },
  });

  useEffect(() => {
    if (visible) {
      handleLoadAgentSubscriptionPlans();
      loadPricingStatus({
        targetType: ToolPricingTargetType.AGENT,
        targetId: String(agentId),
      });
    }
  }, [visible, agentId]);

  // 保存定价配置（可试用次数）
  const handleSave = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();
    setSaving(true);
    try {
      await runUpdatePricingConfig({
        targetType: ToolPricingTargetType.AGENT,
        targetId: String(agentId),
        spaceId,
        pricingType: agentResourcePricingConfig?.pricingType,
        trialCount: Number(values.trialCount || 0),
      });
    } finally {
      setSaving(false);
    }
  };

  // 打开创建套餐模态框
  const handleOpenCreateModal = () => {
    setCreateModalOpen(true);
  };

  // 切换订阅模式
  const handleToggleSubscriptionMode = (checked: boolean) => {
    const previous = subscriptionEnabled;
    setSubscriptionEnabled(checked);

    try {
      runUpdatePricingConfig({
        targetType: ToolPricingTargetType.AGENT,
        targetId: String(agentId),
        spaceId,
        pricingType: agentResourcePricingConfig?.pricingType,
        status: checked
          ? ResourcePricingStatus.ENABLED
          : ResourcePricingStatus.DISABLED,
      });
    } catch (error) {
      setSubscriptionEnabled(previous);
    }
  };

  const getCycleLabel = (cycle: PricingCycleEnum) => {
    if (cycle === 'monthly') {
      return '/月';
    }
    if (cycle === 'quarterly') {
      return '/季';
    }
    if (cycle === 'yearly') {
      return '/年';
    }
    return '';
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.header)}>
        <h2 className={cx(styles.title)}>
          {dict('PC.Pages.Agent.subscriptionSetting')}
        </h2>
        <ConditionRender condition={plans.length > 0}>
          <span
            className={cx(styles.countText)}
          >{`共 ${plans.length} 个套餐`}</span>
        </ConditionRender>
      </div>

      <div className={cx(styles.settingPanel)}>
        <div className={cx(styles.enableRow)}>
          <div className={cx(styles.enableInfo)}>
            <div className={cx(styles.enableTitle)}>开启付费模式</div>
            <div className={cx(styles.enableDesc)}>
              开启后，用户需要付费才能使用服务
            </div>
          </div>
          <Switch
            checked={subscriptionEnabled}
            onChange={handleToggleSubscriptionMode}
          />
        </div>

        {/* 定价类型 */}
        <Form form={form} layout="vertical">
          <div className={cx(styles.formRow)}>
            <div className={cx(styles.formLeft)}>
              <div className={cx(styles.fieldLabel)}>定价类型</div>
              <Button className={cx(styles.modeBtn)} type="default">
                ☆ 订阅模式
              </Button>
            </div>
            <div className={cx(styles.formRight)}>
              <Form.Item
                name="trialCount"
                label="默认试用次数"
                initialValue={0}
                className={cx(styles.trialFormItem)}
              >
                <InputNumber min={0} className={cx(styles.trialInput)} />
              </Form.Item>
              <Button type="primary" loading={saving} onClick={handleSave}>
                {dict('PC.Common.Global.save')}
              </Button>
              <div className={cx(styles.trialHint)}>
                新用户可免费体验的次数，设为 0 则不提供试用
              </div>
            </div>
          </div>
        </Form>
      </div>

      <div className={cx(styles.listHeader)}>
        <h3 className={cx(styles.listTitle)}>套餐列表</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleOpenCreateModal}
        >
          添加套餐
        </Button>
      </div>

      <div className={cx(styles.planGrid)}>
        {plans.map((plan) => (
          <div key={plan.id} className={cx(styles.planCard)}>
            <div className={cx(styles.cardTopLine)} />
            <div className={cx(styles.cardHeader)}>
              <div className={cx(styles.planName)}>{plan.name}</div>
              <span className={cx(styles.packageTag)}>包千价</span>
            </div>
            <div className={cx(styles.planDesc)}>{plan.description || '-'}</div>
            <div className={cx(styles.priceBox)}>
              <span className={cx(styles.currency)}>¥</span>
              <span className={cx(styles.priceValue)}>{plan.price}</span>
              <span className={cx(styles.priceUnit)}>
                {getCycleLabel(plan.cycle)}
              </span>
            </div>
            <div className={cx(styles.planMeta)}>
              {plan.benefits?.[0] || '不限次数'}
            </div>
            <div className={cx(styles.cardFooter)}>
              <Switch
                size="small"
                checked={plan.enabled}
                onChange={(checked) => runTogglePlan(plan.id, checked)}
              />
              <div className={cx(styles.footerActions)}>
                <Button size="small">编辑</Button>
                <Button
                  size="small"
                  danger
                  onClick={() => runDeletePlan(plan.id)}
                >
                  删除
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreatePlanModal
        agentId={agentId}
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onCreated={handleLoadAgentSubscriptionPlans}
      />
    </div>
  );
};

export default SubscriptionSetting;
