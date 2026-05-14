import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  BillOrderInfo,
  BillOrderStatusEnum,
} from '@/types/interfaces/subscription';
import { formatDate } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiGetOrderRevenueList,
  apiGetOrderRevenueStats,
} from '../services/order-revenue';
import { BillRevenueStatsInfo } from '../types/order-revenue';
import OrderDetailDrawer from './OrderDetailDrawer';

/**
 * 业务订单查询
 */
const SubsOrders: React.FC = () => {
  // 详情弹窗是否可见
  const [detailsVisible, setDetailsVisible] = useState(false);
  // 当前选中的订单
  const [currentRecord, setCurrentRecord] = useState<BillOrderInfo>();
  // 统计信息
  const [statsInfo, setStatsInfo] = useState<BillRevenueStatsInfo>();

  // 关闭详情弹窗
  const handleCloseDetails = useCallback(() => {
    setDetailsVisible(false);
    setCurrentRecord(undefined);
  }, []);

  // 收益统计（按月过滤，按用户排行）
  const { run: fetchStatsInfo, loading: statsLoading } = useRequest(
    apiGetOrderRevenueStats,
    {
      manual: true,
      onSuccess: (res: BillRevenueStatsInfo) => {
        setStatsInfo(res);
      },
    },
  );

  useEffect(() => {
    fetchStatsInfo();
  }, []);

  // 订单状态配置
  const statusConfig = useMemo(
    () => ({
      [BillOrderStatusEnum.PAID]: {
        color: 'success',
        label: dict('PC.Pages.MorePage.MyOrders.statusPaid'),
      },
      [BillOrderStatusEnum.PENDING]: {
        color: 'warning',
        label: dict('PC.Pages.MorePage.MyOrders.statusPending'),
      },
      [BillOrderStatusEnum.CANCELLED]: {
        color: 'default',
        label: dict('PC.Pages.MorePage.MyOrders.statusRefunded'),
      },
    }),
    [],
  );

  // 订单列表列配置
  const columns: ProColumns<BillOrderInfo>[] = [
    {
      title: dict('PC.Pages.SystemSubsOrders.orderId'),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      width: 180,
      render: (_, record) => String(record.id ?? '-'),
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.userId'),
      dataIndex: 'userId',
      key: 'userId',
      ellipsis: true,
      render: (_, record) => String(record.userId ?? '-'),
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.bizType'),
      dataIndex: 'bizType',
      key: 'bizType',
      search: false,
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      search: false,
      render: (_, record) => record.description || '-',
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.amount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      render: (_, record) => (
        <span style={{ fontWeight: 600 }}>
          {dict('PC.Common.Global.currencySymbol')}
          {record.amount ?? 0}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.orderStatus'),
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      search: false,
      render: (_, record) => {
        const cfg = statusConfig[record.orderStatus];
        return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
      },
      valueEnum: {
        [BillOrderStatusEnum.PAID]: {
          text: dict('PC.Pages.MorePage.MyOrders.statusPaid'),
        },
        [BillOrderStatusEnum.PENDING]: {
          text: dict('PC.Pages.MorePage.MyOrders.statusPending'),
        },
        [BillOrderStatusEnum.CANCELLED]: {
          text: dict('PC.Pages.MorePage.MyOrders.statusRefunded'),
        },
      },
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.payStatus'),
      dataIndex: 'payStatus',
      key: 'payStatus',
      search: false,
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.created'),
      dataIndex: 'created',
      key: 'created',
      search: false,
      render: (_, record) =>
        record.created ? formatDate(record.created) : '-',
    },
    {
      title: dict('PC.Pages.SystemSubsOrders.modified'),
      dataIndex: 'expireAt',
      key: 'expireAt',
      search: false,
      render: () => '-',
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 100,
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'detail',
              label: dict('PC.Pages.SystemSubsOrders.viewDetail'),
              onClick: (r) => {
                setCurrentRecord(r);
                setDetailsVisible(true);
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <WorkspaceLayout title={dict('PC.Routes.subsOrders')}>
        {/* 统计卡 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemSubsOrders.totalRevenue')}
                value={statsLoading ? '-' : statsInfo?.totalRevenue || 0}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemSubsOrders.monthRevenue')}
                value={statsLoading ? '-' : statsInfo?.monthRevenue || 0}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemSubsOrders.todayRevenue')}
                value={statsLoading ? '-' : statsInfo?.todayRevenue || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={dict('PC.Pages.SystemSubsOrders.pendingAmount')}
                value={statsLoading ? '-' : statsInfo?.pendingAmount || 0}
                precision={0}
                prefix={dict('PC.Common.Global.currencySymbol')}
              />
            </Card>
          </Col>
        </Row>

        {/* 订单列表 */}
        <XProTable<BillOrderInfo>
          rowKey="id"
          columns={columns}
          request={async (params) => {
            try {
              const res = await apiGetOrderRevenueList({
                keyword: params.userId,
                bizType: params.bizType,
                orderStatus: params.orderStatus,
                payStatus: params.payStatus,
                pageNum: params.current,
                pageSize: params.pageSize,
              });
              if (res?.code === SUCCESS_CODE) {
                const list = res.data || [];
                return {
                  data: list,
                  total: list.length,
                  success: true,
                };
              }
            } catch {}
            return {
              data: [],
              total: 0,
              success: false,
            };
          }}
        />
      </WorkspaceLayout>
      <OrderDetailDrawer
        open={detailsVisible}
        record={currentRecord}
        onClose={handleCloseDetails}
      />
    </>
  );
};

export default SubsOrders;
