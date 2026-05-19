import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { formatDateTimeYmdHms } from '@/utils/dateUtils';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, message, Switch } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'umi';
import {
  apiGetSubscriptionPlanList,
  apiGetSubscriptionPlanStats,
  apiUpdateSubscriptionPlan,
  apiUpdateSubscriptionPlanSort,
} from '../services/subscription';
import {
  SubscriptionPlanBizTypeEnum,
  SubscriptionPlanInfo,
  SubscriptionPlanPeriodEnum,
  SubscriptionPlanStatsResult,
  SubscriptionPlanStatusEnum,
} from '../types/subscription';
import CreatePlanModal from './CreatePlanModal';
import styles from './index.less';
import PlanStatCard from './PlanStatCard';

const PERIOD_LABEL_KEY: Partial<Record<SubscriptionPlanPeriodEnum, string>> = {
  [SubscriptionPlanPeriodEnum.MONTH]: 'PC.Pages.SystemPlans.periodMonth',
  [SubscriptionPlanPeriodEnum.QUARTER]: 'PC.Pages.SystemPlans.periodQuarter',
  [SubscriptionPlanPeriodEnum.YEAR]: 'PC.Pages.SystemPlans.periodYear',
  [SubscriptionPlanPeriodEnum.FOREVER]: 'PC.Pages.SystemPlans.periodForever',
};

/** 周期枚举 → i18n 文案 */
function getPeriodLabel(period: SubscriptionPlanPeriodEnum): string {
  const key = PERIOD_LABEL_KEY[period];
  return key ? dict(key) : String(period);
}

/**
 * 基础订阅套餐管理页面
 */
const Plans = () => {
  const location = useLocation();
  const actionRef = useRef<ActionType>();
  const isDraggingRef = useRef<boolean>(false);
  const originalDataRef = useRef<SubscriptionPlanInfo[] | null>(null);
  // 套餐列表（与 XProTable request + dataSource / postData 配合，拖拽时保持乐观顺序）
  const [plans, setPlans] = useState<SubscriptionPlanInfo[]>([]);
  // 统计信息
  const [stats, setStats] = useState<SubscriptionPlanStatsResult | null>(null);
  // 新增套餐弹窗
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
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

  const sortableItems = useMemo(
    () =>
      plans.filter((p) => typeof p.id === 'number').map((p) => String(p.id)),
    [plans],
  );

  /** XProTable 列表请求（与 CreditPackages 页相同：request + dataSource + postData） */
  const plansTableRequest = useCallback(async () => {
    try {
      const listRes = await apiGetSubscriptionPlanList();
      const listData = listRes?.data ?? [];
      return {
        data: listData,
        success: true,
        total: listData.length,
      };
    } catch {
      return { data: [], success: false, total: 0 };
    }
  }, []);

  // 顶部订阅统计卡片 + 套餐列表（菜单切换时 location.state 变化，需重新拉取）
  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const statsRes = await apiGetSubscriptionPlanStats({
          bizType: SubscriptionPlanBizTypeEnum.SYSTEM,
          bizId: '-1',
        });
        if (!cancelled) {
          setStats(statsRes?.data ?? null);
        }
      } catch {
        if (!cancelled) {
          message.error(dict('PC.Common.Toast.operationFailed'));
        }
      }
    };
    loadStats();
    actionRef.current?.reload();
    return () => {
      cancelled = true;
    };
  }, [location.state]);

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

      actionRef.current?.reload();
    } catch {
      message.error(dict('PC.Common.Toast.operationFailed'));
    }
  };

  // 编辑套餐
  const handleEdit = (planInfo: SubscriptionPlanInfo) => {
    setEditingPlan(planInfo);
    setCreateModalOpen(true);
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
      isDraggingRef.current = false;
      return;
    }

    const oldIndex = plans.findIndex(
      (item) => String(item.id) === String(active.id),
    );
    const newIndex = plans.findIndex(
      (item) => String(item.id) === String(over.id),
    );
    if (oldIndex < 0 || newIndex < 0) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;
    originalDataRef.current = [...plans];

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
      originalDataRef.current = null;
    } catch {
      message.error(dict('PC.Common.Toast.operationFailed'));
      if (originalDataRef.current) {
        setPlans(originalDataRef.current);
        originalDataRef.current = null;
      } else {
        actionRef.current?.reload();
      }
    } finally {
      isDraggingRef.current = false;
    }
  };

  // 套餐列表
  const columns: ProColumns<SubscriptionPlanInfo>[] = [
    {
      title: dict('PC.Pages.SystemRoleManage.columnSort'),
      key: 'dragHandle',
      align: 'center',
      width: 72,
      fixed: 'left',
      ellipsis: false,
      search: false,
      render: () => <DragHandle />,
    },
    {
      title: dict('PC.Pages.SystemPlans.colId'),
      dataIndex: 'id',
      width: 88,
      search: false,
      render: (v) => (v !== undefined && v !== null ? v : '-'),
    },
    {
      title: dict('PC.Pages.SystemPlans.colName'),
      dataIndex: 'name',
      width: 140,
      search: false,
    },
    {
      title: dict('PC.Pages.SystemPlans.colDesc'),
      dataIndex: 'description',
      width: 200,
      search: false,
    },
    {
      title: dict('PC.Pages.SystemPlans.colPrice'),
      dataIndex: 'price',
      width: 100,
      search: false,
      render: (_, r) =>
        typeof r.price === 'number' ? `¥${r.price}` : r.price ?? '-',
    },
    {
      title: dict('PC.Pages.SystemPlans.colPeriod'),
      dataIndex: 'period',
      width: 100,
      search: false,
      render: (_, r) => getPeriodLabel(r.period),
    },
    {
      title: dict('PC.Pages.SystemPlans.colCreditAmount'),
      dataIndex: 'creditAmount',
      width: 120,
      search: false,
      render: (_, r) =>
        r.creditAmount !== undefined && r.creditAmount !== null
          ? r.creditAmount.toLocaleString()
          : 0,
    },
    {
      title: dict('PC.Pages.SystemPlans.colCallLimit'),
      dataIndex: 'callLimitCount',
      width: 120,
      search: false,
      render: (_, r) => {
        const n = r.callLimitCount;
        if (n === -1) {
          return dict('PC.Pages.SystemPlans.colCallLimitUnlimited');
        }
        return n;
      },
    },
    {
      title: dict('PC.Pages.SystemPlans.colDailyGiftCredit'),
      dataIndex: 'dailyGiftCreditAmount',
      width: 140,
      search: false,
      render: (_, r) =>
        r.dailyGiftCreditAmount !== undefined &&
        r.dailyGiftCreditAmount !== null
          ? r.dailyGiftCreditAmount.toLocaleString()
          : 0,
    },
    {
      title: dict('PC.Pages.SystemPlans.colIsHot'),
      dataIndex: 'isHot',
      width: 80,
      search: false,
      render: (_, r) =>
        r.isHot ? dict('PC.Common.Global.yes') : dict('PC.Common.Global.no'),
    },
    {
      title: dict('PC.Pages.SystemPlans.colCreated'),
      dataIndex: 'created',
      width: 176,
      search: false,
      render: (_, r) => formatDateTimeYmdHms(r.created),
    },
    {
      title: dict('PC.Pages.SystemPlans.colModified'),
      dataIndex: 'modified',
      width: 176,
      search: false,
      render: (_, r) => formatDateTimeYmdHms(r.modified),
    },
    {
      title: dict('PC.Pages.SystemPlans.status'),
      dataIndex: 'status',
      width: 100,
      search: false,
      fixed: 'right',
      align: 'center',
      render: (_, r) => {
        return (
          <Switch
            checked={r.status === SubscriptionPlanStatusEnum.Online}
            onChange={(v) => handleToggle(r.id as number, v)}
          />
        );
      },
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      fixed: 'right',
      width: 80,
      search: false,
      align: 'center',
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              onClick: (plan) => handleEdit(plan),
            },
          ]}
        />
      ),
    },
  ];

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

      {/* 套餐列表（可拖拽排序） */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handlePlanDragEnd}
      >
        <SortableContext
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          <XProTable<SubscriptionPlanInfo>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            request={plansTableRequest}
            dataSource={plans}
            postData={(data: SubscriptionPlanInfo[]) => {
              if (!isDraggingRef.current) {
                setPlans(data ?? []);
              }
              return data ?? [];
            }}
            pagination={false}
            showIndex={false}
            fullHeight={false}
            options={false}
            showQueryButtons={false}
            scroll={{ x: 'max-content' }}
            components={{
              body: {
                row: Row,
              },
            }}
          />
        </SortableContext>
      </DndContext>

      {/* 新增套餐弹窗 */}
      <CreatePlanModal
        open={createModalOpen}
        sort={createPlanSort}
        planInfo={editingPlan}
        onSuccess={() => actionRef.current?.reload()}
        onCancel={() => {
          setCreateModalOpen(false);
          setEditingPlan(null);
        }}
      />
    </WorkspaceLayout>
  );
};

export default Plans;
