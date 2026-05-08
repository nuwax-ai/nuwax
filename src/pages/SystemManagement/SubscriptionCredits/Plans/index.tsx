import WorkspaceLayout from '@/components/WorkspaceLayout';
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
import { Button, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiDeleteSubscriptionPlan,
  apiGetSubscriptionPlanList,
  apiGetSubscriptionPlanStats,
  apiUpdateSubscriptionPlan,
  apiUpdateSubscriptionPlanSort,
} from '../services/subscription';
import {
  SubscriptionPlanBizTypeEnum,
  SubscriptionPlanInfo,
  SubscriptionPlanStatsResult,
  SubscriptionPlanStatusEnum,
} from '../types/subscription';
import CreatePlanModal from './CreatePlanModal';
import styles from './index.less';
import PlanItemCard from './PlanItemCard';
import PlanStatCard from './PlanStatCard';

/**
 * 可拖拽排序的套餐卡片Props
 * @param id 套餐ID
 * @param children 子组件
 */
interface SortablePlanCardProps {
  id: UniqueIdentifier;
  children: React.ReactNode;
}

/**
 * 可拖拽排序的套餐卡片
 * @param id 套餐ID
 * @param children 子组件
 * @returns
 */
const SortablePlanCard: React.FC<SortablePlanCardProps> = ({
  id,
  children,
}) => {
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
 * 基础订阅套餐管理页面
 * @returns
 */
const Plans: React.FC = () => {
  // 套餐列表
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  // 统计信息
  const [stats, setStats] = useState<SubscriptionPlanStatsResult | null>(null);
  // 新增套餐弹窗
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // 当前编辑中的套餐
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanInfo | null>(
    null,
  );

  // 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // 计算新增套餐默认排序：取 plans 中最大 sort 与 plans.length 的最大值
  const createPlanSort = useMemo(() => {
    const maxSort = plans.reduce((max, item) => {
      const currentSort = item.sort ?? 0;
      return Math.max(max, currentSort);
    }, 0);

    return Math.max(maxSort, plans.length) + 1;
  }, [plans]);

  // 查询指定对象的订阅统计
  const { run: runPlanList } = useRequest(apiGetSubscriptionPlanList, {
    manual: true,
    onSuccess: (data: SubscriptionPlanInfo[]) => {
      setPlans(data);
    },
    onError: () => {
      message.error(dict('PC.Common.Toast.operationFailed'));
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          apiGetSubscriptionPlanStats({
            bizType: SubscriptionPlanBizTypeEnum.SYSTEM,
            bizId: '-1',
          }),
          apiGetSubscriptionPlanList(),
        ]);

        const statsData = statsRes?.data;
        setStats(statsData ?? null);

        const listData = listRes?.data ?? [];
        setPlans(listData);
      } catch (error) {
        message.error(dict('PC.Common.Toast.operationFailed'));
      }
    };

    // 查询数据
    fetchData();
  }, []);

  // 切换套餐上架状态
  const handleToggle = async (id: number, enabled: boolean) => {
    const targetPlan = plans.find((plan) => plan.id === id);
    if (!targetPlan) {
      return;
    }

    try {
      await apiUpdateSubscriptionPlan({
        ...targetPlan,
        status: enabled
          ? SubscriptionPlanStatusEnum.Online
          : SubscriptionPlanStatusEnum.Offline,
      });

      setPlans((prev) =>
        prev.map((p) => ({
          ...p,
          status:
            p.id === id
              ? enabled
                ? SubscriptionPlanStatusEnum.Online
                : SubscriptionPlanStatusEnum.Offline
              : p.status,
        })),
      );
    } catch {
      message.error(dict('PC.Common.Toast.operationFailed'));
    }
  };

  // 编辑套餐
  const handleEdit = (planInfo: SubscriptionPlanInfo) => {
    setEditingPlan(planInfo);
    setCreateModalOpen(true);
  };

  // 删除套餐（二次确认）
  const handleDelete = (id: number) => {
    modalConfirm(
      '确认删除',
      '删除后不可恢复，确定要删除该套餐吗？',
      async () => {
        try {
          await apiDeleteSubscriptionPlan(id);
          message.success('删除成功');
          setPlans((prev) => prev.filter((p) => p.id !== id));
        } catch {
          message.error(dict('PC.Common.Toast.operationFailed'));
        }
      },
    );
  };

  // 新增套餐
  const handleCreatePlan = () => {
    setEditingPlan(null);
    setCreateModalOpen(true);
  };

  // 拖拽排序
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
      await apiUpdateSubscriptionPlanSort(
        reorderedPlans
          .filter((item) => typeof item.id === 'number')
          .map((item) => ({
            id: item.id as number,
            sort: item.sort,
          })),
      );
      message.success('排序已更新');
    } catch {
      message.error(dict('PC.Common.Toast.operationFailed'));
      runPlanList();
    }
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.subsPlans')}
      rightSlot={
        <Button
          type="primary"
          onClick={handleCreatePlan}
          icon={<PlusOutlined />}
        >
          {dict('PC.Pages.SystemPlans.createPlan')}
        </Button>
      }
    >
      {/* 统计信息 */}
      <div className={styles['plan-grid']}>
        <div className={styles['plan-grid-item']}>
          <PlanStatCard
            title={dict('PC.Pages.SystemPlans.statTotalSubscriptions')}
            value={stats?.totalCount ?? 0}
          />
        </div>
        <div className={styles['plan-grid-item']}>
          <PlanStatCard
            title={dict('PC.Pages.SystemPlans.statDailyNew')}
            value={
              <span style={{ color: '#52c41a' }}>{stats?.todayCount ?? 0}</span>
            }
          />
        </div>
        <div className={styles['plan-grid-item']}>
          <PlanStatCard
            title={dict('PC.Pages.SystemPlans.statMonthlyNew')}
            value={
              <span style={{ color: '#52c41a' }}>{stats?.monthCount ?? 0}</span>
            }
          />
        </div>
      </div>

      {/* 套餐列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handlePlanDragEnd}
      >
        <SortableContext items={plans.map((planInfo) => String(planInfo.id))}>
          <div className={styles['plan-grid']}>
            {plans.map((planInfo) => (
              <div key={planInfo.id} className={styles['plan-grid-item']}>
                <SortablePlanCard id={String(planInfo.id)}>
                  <PlanItemCard
                    planInfo={planInfo}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </SortablePlanCard>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <CreatePlanModal
        open={createModalOpen}
        sort={createPlanSort}
        planInfo={editingPlan}
        onSuccess={() => runPlanList()}
        onCancel={() => {
          setCreateModalOpen(false);
          setEditingPlan(null);
        }}
      />
    </WorkspaceLayout>
  );
};

export default Plans;
