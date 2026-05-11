import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { formatDateTime } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useMemo, useRef } from 'react';
import { apiGetCreditFlowList } from '../services/credit';
import {
  CreditFlowOperationTypeEnum,
  type UserCreditFlowInfo,
} from '../types/credit';

/**
 * 积分明细查询
 */
const CreditRecords: React.FC = () => {
  const lastIdMapRef = useRef<Record<number, number | undefined>>({
    1: undefined,
  });
  const queryKeyRef = useRef<string>('');

  const typeConfig = useMemo(
    () => ({
      [CreditFlowOperationTypeEnum.INCREASE]: {
        color: 'success',
        label: dict('PC.Pages.SystemCreditRecords.typeIncrease'),
      },
      [CreditFlowOperationTypeEnum.DECREASE]: {
        color: 'error',
        label: dict('PC.Pages.SystemCreditRecords.typeDecrease'),
      },
    }),
    [],
  );

  /**
   * 积分流水查询列配置
   */
  const columns: ProColumns<UserCreditFlowInfo>[] = [
    {
      title: dict('PC.Pages.SystemCreditRecords.recordId'),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 180,
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.bizNo'),
      dataIndex: 'batchNo',
      key: 'bizNo',
      ellipsis: true,
      width: 180,
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.userName'),
      dataIndex: 'userName',
      key: 'userName',
      ellipsis: true,
      render: (_, record) => record.user?.username || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.phone'),
      dataIndex: 'phone',
      key: 'phone',
      ellipsis: true,
      render: (_, record) => record.user?.phone || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.amount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => record.amount || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.operationType'),
      dataIndex: 'operationType',
      key: 'operationType',
      render: (_, record) => {
        const cfg = typeConfig[record.operationType];
        return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
      },
      valueEnum: {
        [CreditFlowOperationTypeEnum.INCREASE]: {
          text: dict('PC.Pages.SystemCreditRecords.operationTypeIncrease'),
        },
        [CreditFlowOperationTypeEnum.DECREASE]: {
          text: dict('PC.Pages.SystemCreditRecords.operationTypeDecrease'),
        },
      },
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.beforeAmount'),
      dataIndex: 'beforeAmount',
      key: 'beforeAmount',
      search: false,
      render: (_, record) => record.beforeAmount || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.afterAmount'),
      dataIndex: 'afterAmount',
      key: 'afterAmount',
      search: false,
      render: (_, record) => record.afterAmount || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.created'),
      dataIndex: 'created',
      key: 'created',
      search: false,
      render: (_, record) => formatDateTime(record.created),
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.remark'),
      dataIndex: 'remark',
      key: 'remark',
      search: false,
      ellipsis: true,
    },
  ];

  const requestCreditFlowList = async (params: {
    current?: number;
    pageSize?: number;
    userName?: string;
    phone?: string;
    operationType?: number;
  }) => {
    const current = Number(params.current || 1);
    const pageSize = Number(params.pageSize || 10);
    const usernamePhoneOrEmail = String(params.userName || params.phone || '');
    const queryKey = JSON.stringify({
      usernamePhoneOrEmail,
      operationType: params.operationType,
      pageSize,
    });

    // 查询条件改变时，重置游标分页映射。
    if (queryKeyRef.current !== queryKey) {
      queryKeyRef.current = queryKey;
      lastIdMapRef.current = { 1: undefined };
    }

    try {
      const lastId = lastIdMapRef.current[current];
      const res = await apiGetCreditFlowList({
        usernamePhoneOrEmail: usernamePhoneOrEmail || undefined,
        lastId,
        pageSize,
      });
      if (res?.code === SUCCESS_CODE) {
        const list = res.data || [];
        const nextPageLastId = list.length
          ? list[list.length - 1]?.id
          : undefined;
        lastIdMapRef.current[current + 1] = nextPageLastId;

        return {
          data: list,
          // 游标分页接口无 total，给 ProTable 一个可翻页总量。
          total: current * pageSize + (list.length === pageSize ? 1 : 0),
          success: true,
        };
      }
    } catch (error) {}
    return {
      data: [],
      total: 0,
      success: false,
    };
  };

  return (
    <WorkspaceLayout title={dict('PC.Routes.creditsRecordsQuery')}>
      <XProTable<UserCreditFlowInfo>
        rowKey="id"
        columns={columns}
        request={requestCreditFlowList}
      />
    </WorkspaceLayout>
  );
};

export default CreditRecords;
