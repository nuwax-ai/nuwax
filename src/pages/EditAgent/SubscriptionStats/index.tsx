import { apiGetAgentSubscriptionPlanStats } from '@/pages/EditAgent/services/agent-subscription-plan';
import {
  SubscriptionPlanPeriodEnum,
  SubscriptionPlanStatsResult,
  SubscriptionPlanSubscriberInfo,
  UserSubscriberStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { dict } from '@/services/i18nRuntime';
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
  [SubscriptionPlanPeriodEnum.MONTH]: '月',
  [SubscriptionPlanPeriodEnum.QUARTER]: '季度',
  [SubscriptionPlanPeriodEnum.YEAR]: '年',
  [SubscriptionPlanPeriodEnum.FOREVER]: '永久',
};

const subscriberStatusLabelMap: Record<UserSubscriberStatusEnum, string> = {
  [UserSubscriberStatusEnum.ACTIVE]: '生效中',
  [UserSubscriberStatusEnum.EXPIRED]: '已过期',
  [UserSubscriberStatusEnum.CANCELLED]: '已取消',
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
        title: '用户ID',
        dataIndex: 'userId',
        width: 100,
      },
      {
        title: '套餐名称',
        dataIndex: 'planName',
        ellipsis: true,
      },
      {
        title: '订阅周期',
        dataIndex: 'period',
        width: 110,
        render: (period: SubscriptionPlanPeriodEnum) =>
          periodLabelMap[period] || '-',
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 110,
        render: (status: UserSubscriberStatusEnum) =>
          subscriberStatusLabelMap[status] || '-',
      },
      {
        title: '开始时间',
        dataIndex: 'startTime',
        width: 170,
      },
      {
        title: '结束时间',
        dataIndex: 'endTime',
        width: 170,
        render: (endTime: string) => endTime || '-',
      },
      {
        title: '已用次数',
        dataIndex: 'callUsedCount',
        width: 100,
      },
    ],
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles['stat-grid']}>
        <div className={styles['stat-card']}>
          <div className={styles['stat-title']}>总订阅数</div>
          <div className={styles['stat-value']}>
            {statsResult?.totalCount ?? 0}
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-title']}>今日新增</div>
          <div className={styles['stat-value']}>
            {statsResult?.todayCount ?? 0}
          </div>
        </div>
        <div className={styles['stat-card']}>
          <div className={styles['stat-title']}>本月新增</div>
          <div className={styles['stat-value']}>
            {statsResult?.monthCount ?? 0}
          </div>
        </div>
      </div>

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
