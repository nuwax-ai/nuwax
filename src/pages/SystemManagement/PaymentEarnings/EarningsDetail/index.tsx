import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { apiSystemRevenueDetail } from '@/services/systemManage';
import type { SystemRevenueDetailInfo } from '@/types/interfaces/systemManage';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { history, useSearchParams } from 'umi';
import { getRevenueTypeMap } from '../constants';

const EarningsDetail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const developerName = searchParams.get('developerName');
  const developerId = searchParams.get('developerId');

  // 获取收益类型的配置
  const typeMap = useMemo(() => getRevenueTypeMap(), []);

  const columns: ProColumns<SystemRevenueDetailInfo>[] = [
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Detail.colOrderNo',
      ),
      dataIndex: 'bizNo',
      search: false,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Detail.colItemName',
      ),
      dataIndex: 'remark',
      search: false,
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Detail.colEarningsAmount',
      ),
      dataIndex: 'amount',
      search: false,
      render: (_, record) => (
        <span
          style={{
            color: record.amount >= 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: 600,
          }}
        >
          {record.amount >= 0 ? '+' : ''}¥
          {(record.amount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Detail.colEarningsType',
      ),
      dataIndex: 'type',
      search: false,
      render: (_, record) => {
        const config = (typeMap as any)[record.type as string] || {
          color: 'default',
          text: record.type,
        };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Detail.colEarningsTime',
      ),
      dataIndex: 'created',
      valueType: 'date',
      fieldProps: {
        placeholder: '请选择日期',
      },
      render: (_, record) =>
        record.created ? formatDateTime(record.created) : '-',
    },
  ];

  return (
    <WorkspaceLayout
      title={dict(
        'PC.Pages.SystemManagement.PaymentEarnings.Detail.subtitle',
        developerName,
      )}
      back={true}
      onBack={() => history.back()}
    >
      <XProTable<SystemRevenueDetailInfo>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const { current, pageSize, created, ...rest } = params;
          const dt = created
            ? Number(dayjs(created).format('YYYYMMDD'))
            : undefined;

          const res = await apiSystemRevenueDetail({
            userId: Number(developerId),
            dt,
            pageNum: current || 1,
            pageSize: pageSize || 15,
            ...rest,
          });

          return {
            data: res.data?.records || [],
            success: res.success,
            total: res.data?.total || 0,
          };
        }}
      />
    </WorkspaceLayout>
  );
};

export default EarningsDetail;
