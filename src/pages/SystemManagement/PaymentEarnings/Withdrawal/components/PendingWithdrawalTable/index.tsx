import { XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiListWithdrawals } from '@/services/subscriptionService';
import type { WithdrawalInfo } from '@/types/interfaces/subscription';
import { WithdrawalStatusEnum } from '@/types/interfaces/subscription';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import React from 'react';

interface PendingWithdrawalTableProps {
  actionRef: React.MutableRefObject<ActionType | undefined>;
  columns: ProColumns<WithdrawalInfo>[];
  mockData: WithdrawalInfo[];
}

const PendingWithdrawalTable: React.FC<PendingWithdrawalTableProps> = ({
  actionRef,
  columns,
  mockData,
}) => {
  return (
    <XProTable<WithdrawalInfo>
      rowKey="id"
      actionRef={actionRef}
      columns={columns}
      request={async (params) => {
        try {
          const res = await apiListWithdrawals({
            keyword: params.developerName,
            status: WithdrawalStatusEnum.Pending,
            pageNum: params.current,
            pageSize: params.pageSize,
          });
          if (res?.code === SUCCESS_CODE && res.data?.list?.length) {
            return {
              data: res.data.list,
              total: res.data.total,
              success: true,
            };
          }
        } catch {}
        const pending = mockData.filter(
          (w) => w.status === WithdrawalStatusEnum.Pending,
        );
        return {
          data: pending,
          total: pending.length,
          success: true,
        };
      }}
    />
  );
};

export default PendingWithdrawalTable;
