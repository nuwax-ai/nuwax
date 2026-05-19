import type { StatMetricItem } from '@/components/business-component/StatMetricCard';
import StatMetricCardList from '@/components/business-component/StatMetricCard';
import { apiGetAgentSubscriptionPlanStats } from '@/pages/EditAgent/services/agent-subscription-plan';
import {
  SubscriptionPlanPeriodEnum,
  SubscriptionPlanStatsResult,
  SubscriptionPlanSubscriberInfo,
  UserSubscriberStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { dict } from '@/services/i18nRuntime';
import { formatDateTimeYmdHms } from '@/utils/dateUtils';
import { formatInteger } from '@/utils/numberFormat';
import { Table, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

interface SubscriptionStatsProps {
  agentId: number;
  visible: boolean;
}

const periodLabelMap: Record<SubscriptionPlanPeriodEnum, string> = {
  [SubscriptionPlanPeriodEnum.MONTH]: dict(
    'PC.Pages.AgentEdit.SubscriptionStats.periodMonth',
  ),
  [SubscriptionPlanPeriodEnum.QUARTER]: dict(
    'PC.Pages.AgentEdit.SubscriptionStats.periodQuarter',
  ),
  [SubscriptionPlanPeriodEnum.YEAR]: dict(
    'PC.Pages.AgentEdit.SubscriptionStats.periodYear',
  ),
  [SubscriptionPlanPeriodEnum.FOREVER]: dict(
    'PC.Pages.AgentEdit.SubscriptionStats.periodForever',
  ),
};

const subscriberStatusLabelMap: Record<UserSubscriberStatusEnum, string> = {
  [UserSubscriberStatusEnum.ACTIVE]: dict(
    'PC.Pages.AgentEdit.SubscriptionStats.statusActive',
  ),
  [UserSubscriberStatusEnum.EXPIRED]: dict(
    'PC.Pages.AgentEdit.SubscriptionStats.statusExpired',
  ),
  [UserSubscriberStatusEnum.CANCELLED]: dict(
    'PC.Pages.AgentEdit.SubscriptionStats.statusCancelled',
  ),
};

/**
 * 智能体订阅统计
 */
const SubscriptionStats: React.FC<SubscriptionStatsProps> = ({
  agentId,
  visible,
}) => {
  // 订阅统计结果
  const [statsResult, setStatsResult] =
    useState<SubscriptionPlanStatsResult | null>(null);
  // 当前页码
  const [pageNum, setPageNum] = useState<number>(1);
  // 每页条数
  const [pageSize, setPageSize] = useState<number>(10);

  // 查询智能体订阅统计
  const { run: runLoadStats, loading } = useRequest(
    apiGetAgentSubscriptionPlanStats,
    {
      manual: true,
      onSuccess: (data: SubscriptionPlanStatsResult) => {
        setStatsResult(data || null);
      },
      onError: () => {
        message.error(dict('PC.Common.Global.operationFailed'));
      },
    },
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    // 查询智能体订阅统计
    runLoadStats({
      agentId,
      pageNum,
      pageSize,
    });
  }, [visible, agentId, pageNum, pageSize]);

  // 表格列配置
  const columns: ColumnsType<SubscriptionPlanSubscriberInfo> = useMemo(
    () => [
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colId'),
        dataIndex: 'id',
        width: 150,
      },
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colPlanName'),
        dataIndex: 'planName',
        ellipsis: true,
      },
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colPeriod'),
        dataIndex: 'period',
        width: 110,
        render: (period: SubscriptionPlanPeriodEnum) =>
          periodLabelMap[period] || '-',
      },
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colUsedCount'),
        dataIndex: 'callUsedCount',
        width: 120,
      },
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colStatus'),
        dataIndex: 'status',
        width: 110,
        render: (status: UserSubscriberStatusEnum) =>
          subscriberStatusLabelMap[status] || '-',
      },
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colSubscriberId'),
        dataIndex: ['subscriber', 'id'],
        width: 100,
        render: (subscriberId?: number) =>
          subscriberId !== undefined && subscriberId !== null
            ? subscriberId
            : '-',
      },
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colSubscriberName'),
        dataIndex: ['subscriber', 'name'],
        width: 120,
        ellipsis: true,
        render: (subscriberName?: string) => subscriberName || '-',
      },
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colStartTime'),
        dataIndex: 'startTime',
        width: 200,
        render: (startTime: string) => formatDateTimeYmdHms(startTime),
      },
      {
        title: dict('PC.Pages.AgentEdit.SubscriptionStats.colEndTime'),
        dataIndex: 'endTime',
        width: 200,
        render: (endTime: string) => formatDateTimeYmdHms(endTime),
      },
    ],
    [],
  );

  /** 订阅概览三项指标（数值已格式化为字符串，供 StatMetricCardList 展示） */
  const subscriptionMetrics = useMemo((): StatMetricItem[] => {
    return [
      {
        key: 'totalCount',
        label: dict('PC.Pages.AgentEdit.SubscriptionStats.totalSubscriptions'),
        value: formatInteger(statsResult?.totalCount ?? 0),
      },
      {
        key: 'todayCount',
        label: dict('PC.Pages.AgentEdit.SubscriptionStats.todayNew'),
        value: formatInteger(statsResult?.todayCount ?? 0),
      },
      {
        key: 'monthCount',
        label: dict('PC.Pages.AgentEdit.SubscriptionStats.monthNew'),
        value: formatInteger(statsResult?.monthCount ?? 0),
      },
    ];
  }, [statsResult]);

  return (
    <div className={styles.container}>
      <StatMetricCardList
        items={subscriptionMetrics}
        loading={loading}
        showTooltip={false}
      />

      <div className={styles['table-card']}>
        <Table<SubscriptionPlanSubscriberInfo>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={statsResult?.subscribers || []}
          pagination={{
            current: pageNum,
            pageSize,
            total: statsResult?.total || 0,
            showSizeChanger: true,
            onChange: (currentPage, currentPageSize) => {
              setPageNum(currentPage);
              setPageSize(currentPageSize);
            },
          }}
        />
      </div>
    </div>
  );
};

export default SubscriptionStats;
