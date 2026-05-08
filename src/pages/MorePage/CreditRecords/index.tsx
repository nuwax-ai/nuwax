import CreditsPurchaseModal from '@/components/business-component/CreditsBalance/CreditsPurchaseModal';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { apiGetCreditFlows } from '@/services/subscriptionService';
import {
  CreditTypeEnum,
  type CreditRecordInfo,
} from '@/types/interfaces/subscription';
import type { ProColumns } from '@ant-design/pro-components';
import { Statistic, Tag, message } from 'antd';
import dayjs from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

const CreditRecords: React.FC = () => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [dataSource, setDataSource] = useState<CreditRecordInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterValues, setFilterValues] = useState<any>(null); // 初始为 null，表示未执行过查询
  const lastIdRef = useRef<number | undefined>(undefined);
  const loadingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取数据
  const fetchData = useCallback(
    async (isFirst = false) => {
      if (loadingRef.current || (!hasMore && !isFirst)) return;

      try {
        setLoading(true);
        loadingRef.current = true;

        const res = await apiGetCreditFlows({
          creditType: CreditTypeEnum.PURCHASE,
          lastId: isFirst ? undefined : lastIdRef.current,
          pageSize: 20,
        });

        if (res.success && res.data) {
          const newData = res.data;
          if (isFirst) {
            setDataSource(newData);
          } else {
            setDataSource((prev) => [...prev, ...newData]);
          }

          if (newData.length > 0) {
            lastIdRef.current = newData[newData.length - 1].id;
          }

          setHasMore(newData.length === 20);
        }
      } catch (error) {
        console.error(error);
        message.error(dict('PC.Toast.Global.fetchFailed'));
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [hasMore],
  );

  // 初始加载
  useEffect(() => {
    fetchData(true);
  }, []);

  // 监听滚动加载
  useEffect(() => {
    const tableBody = containerRef.current?.querySelector('.ant-table-body');
    if (!tableBody) return;

    const onScroll = (e: Event) => {
      const target = e.target as HTMLDivElement;
      // 距离底部 50px 时加载
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
        fetchData();
      }
    };

    tableBody.addEventListener('scroll', onScroll);
    return () => tableBody.removeEventListener('scroll', onScroll);
  }, [fetchData]);

  // 前端过滤逻辑
  const displayData = useMemo(() => {
    // 如果没有过滤条件，直接返回原数据
    if (!filterValues) return dataSource;

    const { startDate, endDate, operationType } = filterValues;
    return dataSource.filter((item) => {
      // 日期过滤
      if (startDate && dayjs(item.created).isBefore(dayjs(startDate), 'day')) {
        return false;
      }
      if (endDate && dayjs(item.created).isAfter(dayjs(endDate), 'day')) {
        return false;
      }
      // 类型过滤
      if (operationType && item.operationType !== Number(operationType)) {
        return false;
      }
      return true;
    });
  }, [dataSource, filterValues]);

  const columns: ProColumns<CreditRecordInfo>[] = [
    {
      title: dict('PC.Pages.MorePage.CreditRecords.filterStartDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      valueType: 'date',
      hideInTable: true,
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.filterEndDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      valueType: 'date',
      hideInTable: true,
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.filterChangeType'),
      dataIndex: 'operationType',
      key: 'operationType',
      valueType: 'select',
      valueEnum: {
        1: { text: dict('PC.Pages.MorePage.CreditRecords.filterIncrease') },
        2: { text: dict('PC.Pages.MorePage.CreditRecords.filterDecrease') },
      },
      hideInTable: true,
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colTime'),
      dataIndex: 'created',
      key: 'created',
      search: false,
      valueType: 'dateTime',
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colType'),
      dataIndex: 'creditTypeName',
      key: 'creditTypeName',
      search: false,
      render: (_, record) => {
        const isIncrease = record.operationType === 1;
        return (
          <Tag
            className={
              isIncrease ? styles.typeTagIncrease : styles.typeTagDecrease
            }
          >
            {record.operationTypeName}
          </Tag>
        );
      },
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colAmount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => {
        const isIncrease = record.operationType === 1;
        return (
          <Statistic
            value={record.amount}
            prefix={isIncrease ? '+' : '-'}
            valueStyle={{
              color: isIncrease ? '#52c41a' : '#ff4d4f',
              fontSize: '14px',
              fontWeight: '600',
            }}
          />
        );
      },
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colRemaining'),
      dataIndex: 'afterAmount',
      key: 'afterAmount',
      search: false,
      valueType: 'digit',
    },
    {
      title: dict('PC.Pages.MorePage.CreditRecords.colNote'),
      dataIndex: 'remark',
      key: 'remark',
      search: false,
      ellipsis: true,
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.CreditRecords.pageTitle')}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <XProTable<CreditRecordInfo>
          rowKey="id"
          columns={columns}
          // onSubmit 仅在点击“查询”按钮时触发
          onSubmit={(values) => {
            setFilterValues(values);
          }}
          onReset={() => {
            setFilterValues(null);
          }}
          search={{
            layout: 'vertical',
            defaultCollapsed: false,
            collapseRender: false,
          }}
          toolBarRender={false}
          dataSource={displayData}
          loading={loading && dataSource.length === 0}
          pagination={false}
        />
      </div>

      <CreditsPurchaseModal
        open={purchaseOpen}
        onCancel={() => setPurchaseOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default CreditRecords;
