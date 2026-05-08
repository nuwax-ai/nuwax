import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Row, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiDeleteSubscriptionPlan,
  apiGetSubscriptionPlanList,
  apiGetSubscriptionPlanStats,
  apiUpdateSubscriptionPlan,
} from '../services/subscription';
import {
  SubscriptionPlanBizTypeEnum,
  SubscriptionPlanInfo,
  SubscriptionPlanStatsResult,
  SubscriptionPlanStatusEnum,
} from '../types/subscription';
import CreatePlanModal from './CreatePlanModal';
import PlanItemCard from './PlanItemCard';
import PlanStatCard from './PlanStatCard';

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

  // 计算新增套餐默认排序：取 plans 中最大 sort 与 plans.length 的最大值
  const createPlanSort = useMemo(() => {
    const maxSort = plans.reduce((max, item) => {
      const currentSort = item.sort ?? 0;
      return Math.max(max, currentSort);
    }, 0);

    return Math.max(maxSort, plans.length);
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
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <PlanStatCard
            title={dict('PC.Pages.SystemPlans.statTotalSubscriptions')}
            value={stats?.totalCount ?? 0}
          />
        </Col>
        <Col span={6}>
          <PlanStatCard
            title={dict('PC.Pages.SystemPlans.statDailyNew')}
            value={
              <span style={{ color: '#52c41a' }}>{stats?.todayCount ?? 0}</span>
            }
          />
        </Col>
        <Col span={6}>
          <PlanStatCard
            title={dict('PC.Pages.SystemPlans.statMonthlyNew')}
            value={
              <span style={{ color: '#52c41a' }}>{stats?.monthCount ?? 0}</span>
            }
          />
        </Col>
      </Row>

      {/* 套餐列表 */}
      <Row gutter={[16, 16]}>
        {plans.map((planInfo) => (
          <Col span={6} key={planInfo.id}>
            <PlanItemCard
              planInfo={planInfo}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Col>
        ))}
      </Row>

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
