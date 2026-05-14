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
import {
  SubscriptionPlanInfo,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Form, InputNumber, message, Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiCreateAgentSubscriptionOrder,
  apiDeleteAgentSubscriptionPlan,
  apiGetAgentSubscriptionOrderCashier,
  apiGetAgentSubscriptionPlanList,
  apiUpdateAgentSubscriptionPlan,
  apiUpdateAgentSubscriptionPlanSort,
} from '../services/agent-subscription-plan';
import CreatePlanModal from './CreatePlanModal';
import SubscriptionPlanCard from './SubscriptionPlanCard';
import styles from './index.less';

interface SubscriptionSettingProps {
  agentId: number;
  spaceId: number;
  visible: boolean;
}

/**
 * 可拖拽排序的套餐卡片
 */
const SortablePlanCard: React.FC<{
  id: UniqueIdentifier;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles['plan-sortable-item']}
      data-dragging={isDragging}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
};

/**
 * 订阅设置
 */
const SubscriptionSetting: React.FC<SubscriptionSettingProps> = ({
  agentId,
  spaceId,
  visible,
}) => {
  const [form] = Form.useForm();
  // 套餐列表
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  // 保存中
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

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // 查询订阅计划列表
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

  // 修改订阅计划（上线/下线）
  const {
    run: runUpdateAgentSubscriptionPlan,
    loading: updatingSubscriptionPlan,
  } = useRequest(apiUpdateAgentSubscriptionPlan, {
    manual: true,
    loadingDelay: 300,
    onSuccess: () => {
      loadAgentPlans();
      message.success('套餐状态修改成功');
    },
  });

  // 删除订阅计划
  const { run: runDeletePlan } = useRequest(apiDeleteAgentSubscriptionPlan, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.deleteSuccess'));
      loadAgentPlans();
    },
  });

  // 更新智能体套餐排序
  const { run: runUpdatePlanSort } = useRequest(
    apiUpdateAgentSubscriptionPlanSort,
    {
      manual: true,
    },
  );

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

  /**
   * 切换套餐状态（上线/下线）
   */
  const handleTogglePlanStatus = (
    plan: SubscriptionPlanInfo,
    checked: boolean,
  ) => {
    if (!plan.id) {
      return;
    }
    runUpdateAgentSubscriptionPlan({
      ...plan,
      status: checked
        ? SubscriptionPlanStatusEnum.Online
        : SubscriptionPlanStatusEnum.Offline,
    });
  };

  /**
   * 删除套餐（二次确认）
   */
  const handleDeletePlan = (plan: SubscriptionPlanInfo) => {
    if (!plan.id) {
      return;
    }
    modalConfirm(dict('PC.Common.Global.confirmDelete'), plan.name || '', () =>
      runDeletePlan(plan.id as number),
    );
  };

  /**
   * 点击套餐卡片
   */
  const handleClickPlanCard = async (plan: SubscriptionPlanInfo) => {
    if (!plan.id || plan.status !== SubscriptionPlanStatusEnum.Online) {
      return;
    }

    // 创建订阅订单
    try {
      const orderInfo = await apiCreateAgentSubscriptionOrder(plan.id);
      const orderId = orderInfo?.data?.id;
      if (!orderId) {
        message.error('创建订阅订单失败');
        return;
      }

      const res = await apiGetAgentSubscriptionOrderCashier(orderId);
      if (!res?.data?.cashierUrl) {
        message.error('获取收银台地址失败');
        return;
      }

      window.open(res?.data?.cashierUrl, '_blank');
    } catch (error) {
      console.error('点击套餐卡片失败:', error);
    }
  };

  /**
   * 套餐拖拽排序
   */
  const handlePlanDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = plans.findIndex(
      (item) => String(item.id) === String(active.id),
    );
    const newIndex = plans.findIndex(
      (item) => String(item.id) === String(over.id),
    );
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reorderedPlans = arrayMove(plans, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        sort: index + 1,
      }),
    );
    setPlans(reorderedPlans);

    try {
      await runUpdatePlanSort(
        reorderedPlans
          .filter((item) => typeof item.id === 'number')
          .map((item) => ({
            id: item.id as number,
            sort: item.sort,
          })),
      );
      message.success('排序已更新');
    } catch (error) {
      message.error(dict('PC.Common.Global.operationFailed'));
      loadAgentPlans();
    }
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
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {dict('PC.Pages.Agent.subscriptionSetting')}
        </h2>
        <ConditionRender condition={plans.length > 0}>
          <span
            className={styles['count-text']}
          >{`共 ${plans.length} 个套餐`}</span>
        </ConditionRender>
      </div>

      {/* 设置面板 */}
      <div className={styles['setting-panel']}>
        <div className={styles['enable-row']}>
          <div className={styles['enable-info']}>
            <div className={styles['enable-title']}>开启付费模式</div>
            <div className={styles['enable-desc']}>
              开启后，用户需要付费才能使用服务
            </div>
          </div>
          <Switch
            checked={subscriptionEnabled}
            onChange={handleToggleSubscriptionMode}
          />
        </div>

        <ConditionRender condition={subscriptionEnabled}>
          {/* 定价类型 */}
          <Form form={form} layout="vertical">
            <div className={styles['form-row']}>
              <div className={styles['form-left']}>
                <div className={styles['field-label']}>定价类型</div>
                <Button className={styles['mode-btn']} type="default">
                  ☆ 订阅模式
                </Button>
              </div>
              <div className={styles['form-right']}>
                <Form.Item
                  name="trialCount"
                  label="默认试用次数"
                  initialValue={0}
                  className={styles['trial-form-item']}
                >
                  <InputNumber min={0} className={styles['trial-input']} />
                </Form.Item>
                <Button type="primary" loading={saving} onClick={handleSave}>
                  {dict('PC.Common.Global.save')}
                </Button>
                <div className={styles['trial-hint']}>
                  新用户可免费体验的次数，设为 0 则不提供试用
                </div>
              </div>
            </div>
          </Form>
        </ConditionRender>
      </div>

      <ConditionRender condition={subscriptionEnabled}>
        <div className={styles['list-header']}>
          <h3 className={styles['list-title']}>套餐列表</h3>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreateModal}
          >
            添加套餐
          </Button>
        </div>

        {/* 套餐列表 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handlePlanDragEnd}
        >
          <SortableContext items={plans.map((plan) => String(plan.id))}>
            <div className={styles['plan-grid']}>
              {plans.map((plan) => (
                <div key={plan.id} className={styles['plan-grid-item']}>
                  <SortablePlanCard id={String(plan.id)}>
                    <SubscriptionPlanCard
                      plan={plan}
                      updateLoading={updatingSubscriptionPlan}
                      onClick={() => handleClickPlanCard(plan)}
                      onToggle={(_, checked) =>
                        handleTogglePlanStatus(plan, checked)
                      }
                      onEdit={handleEditPlan}
                      onDelete={() => handleDeletePlan(plan)}
                    />
                  </SortablePlanCard>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ConditionRender>

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
