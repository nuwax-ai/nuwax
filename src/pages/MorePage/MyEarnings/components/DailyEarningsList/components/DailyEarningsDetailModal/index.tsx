import XModalForm from '@/components/ProComponents/XModalForm';
import XProTable from '@/components/ProComponents/XProTable';
import { apiListDailyRevenueDetail } from '@/services/subscriptionService';
import type { DailyRevenueDetailRecord } from '@/types/interfaces/subscription';
import type { ProColumns } from '@ant-design/pro-components';
import { useInfiniteScroll } from 'ahooks';
import { Spin } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef } from 'react';
import styles from './index.less';

interface DailyEarningsDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  targetId?: number | string;
}

const DailyEarningsDetailModal: React.FC<DailyEarningsDetailModalProps> = ({
  visible,
  onCancel,
  targetId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, loading, loadingMore, noMore, reload } = useInfiniteScroll(
    (d) => {
      const pageNum = d ? Math.floor(d.list.length / 20) + 1 : 1;
      return apiListDailyRevenueDetail({
        targetId: targetId!,
        pageNum,
        pageSize: 20,
      }).then((res) => ({
        list: res.data || [],
        // 如果返回的数据少于 20 条，说明没有更多了
        noMore: (res.data || []).length < 20,
      }));
    },
    {
      target: containerRef,
      isNoMore: (d) => d?.noMore,
      manual: true,
    },
  );

  useEffect(() => {
    if (visible && targetId) {
      reload();
    }
  }, [visible, targetId]);

  const columns: ProColumns<DailyRevenueDetailRecord>[] = [
    {
      title: '收益金额',
      dataIndex: 'amount',
      width: 120,
      render: (val) => (
        <span className={styles['amount-plus']}>
          +¥{Number(val).toFixed(2)}
        </span>
      ),
    },
    {
      title: '来源',
      dataIndex: 'remark',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'created',
      width: 180,
      render: (val) => dayjs(val as string).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <XModalForm
      title="收益明细"
      open={visible}
      onOpenChange={(v) => !v && onCancel()}
      submitter={{
        render: () => null,
      }}
      width={720}
      modalProps={{
        destroyOnHidden: true,
        className: styles['detail-modal'],
        footer: null,
      }}
    >
      <div ref={containerRef} className={styles['detail-scroll-container']}>
        <XProTable<DailyRevenueDetailRecord>
          columns={columns}
          dataSource={data?.list || []}
          loading={loading && !loadingMore}
          pagination={false}
          search={false}
          toolBarRender={false}
          showQueryButtons={false}
          fullHeight={false}
          rowKey="id"
          size="middle"
        />
        <div className={styles['load-more-status']}>
          {loadingMore && <Spin size="small" tip="加载中..." />}
          {noMore && data?.list && data.list.length > 0 && (
            <span className={styles['no-more-text']}>没有更多了</span>
          )}
        </div>
      </div>
    </XModalForm>
  );
};

export default DailyEarningsDetailModal;
