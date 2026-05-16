import { XModalForm } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { apiListWithdrawRecords } from '@/services/subscriptionService';
import {
  BillWithdrawRecordInfo,
  BillWithdrawStatusEnum,
} from '@/types/interfaces/subscription';
import { useRequest } from 'ahooks';
import { Empty, Spin, Statistic, Tag } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import styles from './index.less';

interface WithdrawRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WithdrawRecordModal: React.FC<WithdrawRecordModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [pageNum, setPageNum] = React.useState(1);
  const [recordList, setRecordList] = React.useState<BillWithdrawRecordInfo[]>(
    [],
  );
  const [hasMore, setHasMore] = React.useState(true);
  const pageSize = 20;

  const { loading, run: fetchRecords } = useRequest(apiListWithdrawRecords, {
    manual: true,
    onSuccess: (res) => {
      const newList = Array.isArray(res?.data?.records) ? res.data.records : [];
      setRecordList((prev) => [...prev, ...newList]);
      if (newList.length < pageSize) {
        setHasMore(false);
      }
    },
  });

  React.useEffect(() => {
    if (open) {
      setPageNum(1);
      setRecordList([]);
      setHasMore(true);
      fetchRecords({ pageNum: 1, pageSize });
    }
  }, [open, fetchRecords]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 20 && !loading && hasMore) {
      const nextPage = pageNum + 1;
      setPageNum(nextPage);
      fetchRecords({ pageNum: nextPage, pageSize });
    }
  };

  const statusConfig: Record<
    BillWithdrawStatusEnum,
    { color: string; label: string }
  > = {
    [BillWithdrawStatusEnum.PENDING_REVIEW]: {
      color: 'warning',
      label: dict('PC.Pages.MorePage.MyEarnings.withdrawStatusPendingReview'),
    },
    [BillWithdrawStatusEnum.APPROVED]: {
      color: 'success',
      label: dict('PC.Pages.MorePage.MyEarnings.withdrawStatusApproved'),
    },
    [BillWithdrawStatusEnum.REJECTED]: {
      color: 'error',
      label: dict('PC.Pages.MorePage.MyEarnings.withdrawStatusRejected'),
    },
    [BillWithdrawStatusEnum.PAID]: {
      color: 'success',
      label: dict('PC.Pages.MorePage.MyEarnings.withdrawStatusPaid'),
    },
  };

  return (
    <XModalForm
      title={dict('PC.Pages.MorePage.MyEarnings.withdrawRecordTitle')}
      open={open}
      onOpenChange={onOpenChange}
      submitter={false}
      modalProps={{
        width: 480,
        destroyOnHidden: true,
        styles: { body: { padding: '12px 0px 24px' } },
      }}
    >
      <div className={styles['record-list-container']} onScroll={handleScroll}>
        {recordList.length > 0 ? (
          <div className={styles['record-list']}>
            {recordList.map((record) => (
              <div key={record.id} className={styles['record-item']}>
                <div className={styles['record-main']}>
                  <div className={styles['record-header']}>
                    <Statistic
                      value={record.amount || 0}
                      precision={2}
                      prefix="¥"
                      valueStyle={{ fontSize: 16, fontWeight: 600 }}
                    />
                    <Tag
                      color={statusConfig[record.status]?.color || 'default'}
                    >
                      {statusConfig[record.status]?.label || record.status}
                    </Tag>
                  </div>
                  <div className={styles['record-time']}>
                    {dayjs(record.created).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                  {record.status === BillWithdrawStatusEnum.REJECTED &&
                    record.rejectReason && (
                      <div className={styles['record-reject-reason']}>
                        {dict(
                          'PC.Pages.SystemManagement.PaymentEarnings.Withdrawal.colRejectReason',
                        )}
                        ：{record.rejectReason}
                      </div>
                    )}
                </div>
              </div>
            ))}
            {loading && (
              <div className={styles['loading-more']}>
                <Spin size="small" />
              </div>
            )}
          </div>
        ) : loading ? (
          <div className={styles['loading-wrapper']}>
            <Spin />
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </XModalForm>
  );
};

export default WithdrawRecordModal;
