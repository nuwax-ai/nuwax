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
import { SubscriptionPlanInfo } from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { dict } from '@/services/i18nRuntime';
import {
  apiDeletePricingPlan,
  apiTogglePricingPlan,
} from '@/services/subscriptionService';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, InputNumber, Switch, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { apiGetAgentSubscriptionPlanList } from '../services/agent-subscription-plan';
import CreatePlanModal from './CreatePlanModal';
import SubscriptionPlanCard from './SubscriptionPlanCard';
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
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  // 订阅模式是否开启
  const [subscriptionEnabled, setSubscriptionEnabled] =
    useState<boolean>(false);
  // 创建套餐模态框是否打开
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  // 当前编辑套餐
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanInfo | null>(
    null,
  );

  // 智能体资源定价配置
  const [agentResourcePricingConfig, setAgentResourcePricingConfig] =
    useState<ResourcePricingConfigInfo | null>(null);

  const { run: loadAgentSubscriptionPlans } = useRequest(
    apiGetAgentSubscriptionPlanList,
    {
      manual: true,
      onSuccess: (data: SubscriptionPlanInfo[]) => setPlans(data),
    },
  );

  /**
   * 加载智能体套餐列表
   */
  const loadAgentPlans = () => {
    loadAgentSubscriptionPlans({
      agentId,
    });
  };

  const { run: runTogglePlan } = useRequest(apiTogglePricingPlan, {
    manual: true,
    onSuccess: () => {
      loadAgentPlans();
    },
  });

  const { run: runDeletePlan } = useRequest(apiDeletePricingPlan, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.deleteSuccess'));
      loadAgentPlans();
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
      loadAgentPlans();
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
    setEditingPlan(null);
    setCreateModalOpen(true);
  };

  /**
   * 打开编辑套餐弹窗
   */
  const handleEditPlan = (plan: SubscriptionPlanInfo) => {
    setEditingPlan(plan);
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

      {/* 设置面板 */}
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

      {/* 套餐列表 */}
      <div className={cx(styles.planGrid)}>
        {plans.map((plan) => (
          <SubscriptionPlanCard
            key={plan.id}
            plan={plan}
            onToggle={(planId, checked) => runTogglePlan(planId, checked)}
            onEdit={handleEditPlan}
            onDelete={(planId) => runDeletePlan(planId)}
          />
        ))}
      </div>

      {/* 创建套餐模态框 */}
      <CreatePlanModal
        agentId={agentId}
        open={createModalOpen}
        editPlan={editingPlan}
        onCancel={() => {
          setCreateModalOpen(false);
          setEditingPlan(null);
        }}
        onCreated={loadAgentPlans}
      />
    </div>
  );
};

export default SubscriptionSetting;
