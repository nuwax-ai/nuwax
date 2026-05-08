import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Row, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  apiGetSubscriptionPlanList,
  apiGetSubscriptionPlanStats,
} from '../services/subscription';
import {
  SubscriptionPlanBizTypeEnum,
  SubscriptionPlanInfo,
  SubscriptionPlanStatsResult,
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

  const handleToggle = (id: number, enabled: boolean) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, enabled } : p)));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listRes] = await Promise.all([
          apiGetSubscriptionPlanStats({
            bizType: SubscriptionPlanBizTypeEnum.SYSTEM,
            bizId: '-1',
          }),
          apiGetSubscriptionPlanList({
            status: -1,
            keyword: '',
          }),
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

  // 新增套餐
  const handleCreatePlan = () => {
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
        {plans.map((plan) => (
          <Col span={6} key={plan.id}>
            <PlanItemCard plan={plan} onToggle={handleToggle} />
          </Col>
        ))}
      </Row>

      <CreatePlanModal
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default Plans;
