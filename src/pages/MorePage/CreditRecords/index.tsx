import CreditsPurchaseModal from '@/components/business-component/CreditsBalance/CreditsPurchaseModal';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { CREDIT_TYPE_VALUE_ENUM_MAP } from '@/constants/subscription.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetCreditFlows } from '@/services/subscriptionService';
import { type CreditRecordInfo } from '@/types/interfaces/subscription';
import type { FormInstance, ProColumns } from '@ant-design/pro-components';
import { Statistic, Tag } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history } from 'umi';
import styles from './index.less';

const CreditRecords: React.FC = () => {
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [dataSource, setDataSource] = useState<CreditRecordInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filterValues, setFilterValues] = useState<any>(null);
  const lastIdRef = useRef<number | undefined>(undefined);
  const loadingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<FormInstance>();

  // 获取数据
  const fetchData = useCallback(
    async (isFirst = false, searchParams?: any) => {
      if (loadingRef.current || (!isFirst && !hasMore)) return;

      try {
        setLoading(true);
        loadingRef.current = true;

        if (isFirst) {
          setDataSource([]);
          setHasMore(true);
          lastIdRef.current = undefined;
        }

        const queryParams =
          searchParams !== undefined ? searchParams : filterValues;
        const res = await apiGetCreditFlows({
          lastId: isFirst ? undefined : lastIdRef.current,
          pageSize: 30,
          ...queryParams,
        });

        if (res.success && res.data) {
          const newData = res.data;
          if (isFirst) {
            setDataSource(newData);
            lastIdRef.current =
              newData.length > 0 ? newData[newData.length - 1].id : undefined;
          } else {
            setDataSource((prev) => [...prev, ...newData]);
            if (newData.length > 0) {
              lastIdRef.current = newData[newData.length - 1].id;
            }
          }

          setHasMore(newData.length > 0);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [hasMore, filterValues],
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
      // 仅在真实滚动且非重置/回到顶部（scrollTop > 0）时触发触底加载，避免布局重排和重置操作引起多次重复调用
      if (
        target.scrollTop > 0 &&
        target.scrollHeight - target.scrollTop - target.clientHeight < 50
      ) {
        fetchData();
      }
    };

    tableBody.addEventListener('scroll', onScroll);
    return () => tableBody.removeEventListener('scroll', onScroll);
  }, [fetchData]);

  const columns: ProColumns<CreditRecordInfo>[] = [
    {
      title: dict('PC.Pages.MorePage.CreditRecords.filterCreditType'),
      dataIndex: 'creditType',
      key: 'creditType',
      valueType: 'select',
      valueEnum: CREDIT_TYPE_VALUE_ENUM_MAP,
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
      title: dict('PC.Pages.MorePage.CreditRecords.filterCreditType'),
      dataIndex: 'creditTypeName',
      key: 'creditTypeName',
      search: false,
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
    <WorkspaceLayout
      title={dict('PC.Pages.MorePage.CreditRecords.pageTitle')}
      back={true}
      onBack={() => history.push('/more-page/my-subscriptions')}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <XProTable<CreditRecordInfo>
          rowKey="id"
          formRef={formRef}
          columns={columns}
          onSubmit={(values) => {
            setDataSource([]);
            setHasMore(true);
            lastIdRef.current = undefined;
            setFilterValues(values);
            fetchData(true, values);
          }}
          onReset={() => {
            formRef.current?.resetFields();
            setDataSource([]);
            setHasMore(true);
            lastIdRef.current = undefined;
            setFilterValues(null);
            fetchData(true, null);
          }}
          search={{
            filterType: 'light',
          }}
          toolBarRender={false}
          dataSource={dataSource}
          loading={loading}
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
