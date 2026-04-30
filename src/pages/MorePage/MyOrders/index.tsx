import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import {
  OrderStatusEnum,
  OrderTypeEnum,
} from '@/types/interfaces/subscription';
import { copyTextToClipboard } from '@/utils/clipboard';
import { CopyOutlined } from '@ant-design/icons';
import { Button, Drawer, Modal, Segmented, Tag, Tooltip, message } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

// Mock 订单数据
const MOCK_ORDERS = [
  {
    id: 1,
    orderNo: 'ORD20260426001',
    productName: '专业版订阅 × 1个月',
    orderType: OrderTypeEnum.Subscription,
    amount: 299,
    originalPrice: undefined,
    payMethod: '微信支付',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-26 10:30:00',
  },
  {
    id: 2,
    orderNo: 'ORD20260425002',
    productName: '积分包C × 1',
    orderType: OrderTypeEnum.Credits,
    amount: 499,
    originalPrice: 599,
    payMethod: '支付宝',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-25 14:20:00',
  },
  {
    id: 3,
    orderNo: 'ORD20260424003',
    productName: '智能文档摘要订阅 × 1月',
    orderType: OrderTypeEnum.Subscription,
    amount: 19.9,
    originalPrice: undefined,
    payMethod: '微信支付',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-24 09:15:00',
  },
  {
    id: 4,
    orderNo: 'ORD20260423004',
    productName: '积分包B × 1',
    orderType: OrderTypeEnum.Credits,
    amount: 199,
    originalPrice: 229,
    payMethod: '余额支付',
    status: OrderStatusEnum.Paid,
    createdAt: '2026-04-23 16:00:00',
  },
  {
    id: 5,
    orderNo: 'ORD20260419008',
    productName: '智能客服对话订阅 × 1月',
    orderType: OrderTypeEnum.Subscription,
    amount: 9.9,
    originalPrice: undefined,
    payMethod: undefined,
    status: OrderStatusEnum.Pending,
    createdAt: '2026-04-19 22:10:00',
  },
  {
    id: 6,
    orderNo: 'ORD20260417010',
    productName: '数据可视化工具订阅 × 1月',
    orderType: OrderTypeEnum.Subscription,
    amount: 49.9,
    originalPrice: undefined,
    payMethod: undefined,
    status: OrderStatusEnum.Pending,
    createdAt: '2026-04-17 12:20:00',
  },
  {
    id: 7,
    orderNo: 'ORD20260414013',
    productName: '邮件智能撰写订阅 × 1月',
    orderType: OrderTypeEnum.Subscription,
    amount: 24.9,
    originalPrice: undefined,
    payMethod: undefined,
    status: OrderStatusEnum.Pending,
    createdAt: '2026-04-14 20:30:00',
  },
  {
    id: 8,
    orderNo: 'ORD20260412015',
    productName: '代码分析工具订阅 × 1月',
    orderType: OrderTypeEnum.Subscription,
    amount: 59.9,
    originalPrice: undefined,
    payMethod: undefined,
    status: OrderStatusEnum.Refunded,
    createdAt: '2026-04-12 17:45:00',
  },
  {
    id: 9,
    orderNo: 'ORD20260409018',
    productName: 'AI绘画助手订阅 × 1月',
    orderType: OrderTypeEnum.Subscription,
    amount: 29.9,
    originalPrice: undefined,
    payMethod: undefined,
    status: OrderStatusEnum.Refunded,
    createdAt: '2026-04-09 21:00:00',
  },
  {
    id: 10,
    orderNo: 'ORD20260407020',
    productName: '积分包A × 1',
    orderType: OrderTypeEnum.Credits,
    amount: 99,
    originalPrice: 129,
    payMethod: undefined,
    status: OrderStatusEnum.Pending,
    createdAt: '2026-04-07 15:50:00',
  },
];

const MyOrders: React.FC = () => {
  const [orderType, setOrderType] = useState<string>('消费订单');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<
    (typeof MOCK_ORDERS)[0] | null
  >(null);

  const statusConfig = useMemo(
    () => ({
      [OrderStatusEnum.Paid]: {
        color: 'success',
        label: dict('PC.Pages.MorePage.MyOrders.statusPaid'),
      },
      [OrderStatusEnum.Pending]: {
        color: 'warning',
        label: dict('PC.Pages.MorePage.MyOrders.statusPending'),
      },
      [OrderStatusEnum.Refunded]: {
        color: 'default',
        label: dict('PC.Pages.MorePage.MyOrders.statusRefunded'),
      },
    }),
    [],
  );

  // 状态计数
  const statusCounts = useMemo(() => {
    const counts = { all: 0, pending: 0, paid: 0, cancelled: 0 };
    MOCK_ORDERS.forEach((o) => {
      counts.all++;
      if (o.status === OrderStatusEnum.Pending) counts.pending++;
      else if (o.status === OrderStatusEnum.Paid) counts.paid++;
      else counts.cancelled++;
    });
    return counts;
  }, []);

  // 筛选后的订单
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return MOCK_ORDERS;
    return MOCK_ORDERS.filter((o) => {
      if (statusFilter === 'pending')
        return o.status === OrderStatusEnum.Pending;
      if (statusFilter === 'paid') return o.status === OrderStatusEnum.Paid;
      return o.status === OrderStatusEnum.Refunded;
    });
  }, [statusFilter]);

  const handleCopyOrderNo = (orderNo: string) => {
    copyTextToClipboard(orderNo, () => {
      message.success(dict('PC.Pages.MorePage.MyOrders.copied'));
    });
  };

  const handleViewDetail = (order: (typeof MOCK_ORDERS)[0]) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const handleGoPay = () => {
    message.success(
      dict('PC.Pages.MorePage.MyOrders.paySuccess') || '支付成功',
    );
  };

  const handleCancelOrder = () => {
    Modal.confirm({
      title:
        dict('PC.Pages.MorePage.MyOrders.cancelConfirm') ||
        '确定要取消该订单吗？',
      onOk: () => {
        message.success(
          dict('PC.Pages.MorePage.MyOrders.cancelSuccess') || '订单已取消',
        );
      },
    });
  };

  const filterButtons = [
    {
      key: 'all',
      label: `${dict('PC.Pages.MorePage.MyOrders.filterAll')} ${
        statusCounts.all
      }`,
    },
    {
      key: 'pending',
      label: `${dict('PC.Pages.MorePage.MyOrders.filterPending')} ${
        statusCounts.pending
      }`,
    },
    {
      key: 'paid',
      label: `${dict('PC.Pages.MorePage.MyOrders.filterPaid')} ${
        statusCounts.paid
      }`,
    },
    {
      key: 'cancelled',
      label: `${dict('PC.Pages.MorePage.MyOrders.filterCancelled')} ${
        statusCounts.cancelled
      }`,
    },
  ];

  return (
    <WorkspaceLayout title={dict('PC.Pages.MorePage.MyOrders.pageTitle')}>
      {/* 头部：订单类型切换 + 总数 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Segmented
            value={orderType}
            onChange={(val) => setOrderType(val as string)}
            options={[
              dict('PC.Pages.MorePage.MyOrders.consumptionOrders'),
              dict('PC.Pages.MorePage.MyOrders.salesOrders'),
            ]}
          />
          <span className={styles.totalCount}>
            {dict(
              'PC.Pages.MorePage.MyOrders.totalCount',
              String(MOCK_ORDERS.length),
            )}
          </span>
        </div>
      </div>

      {/* 状态筛选按钮 */}
      <div className={styles.filterBar}>
        {filterButtons.map((btn) => (
          <Button
            key={btn.key}
            className={
              statusFilter === btn.key
                ? styles.filterBtnActive
                : styles.filterBtn
            }
            type={statusFilter === btn.key ? 'primary' : 'default'}
            size="small"
            onClick={() => setStatusFilter(btn.key)}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* 订单卡片列表 */}
      <div className={styles.orderList}>
        {filteredOrders.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderCardHeader}>
              <div className={styles.productInfo}>
                <div className={styles.productName}>{order.productName}</div>
                <div className={styles.orderNo}>
                  {order.orderNo}
                  <Tooltip title={dict('PC.Common.Global.copy')}>
                    <Button
                      type="text"
                      size="small"
                      icon={<CopyOutlined />}
                      className={styles.copyBtn}
                      onClick={() => handleCopyOrderNo(order.orderNo)}
                    />
                  </Tooltip>
                </div>
              </div>
              <div className={styles.amountSection}>
                <div className={styles.amount}>
                  <span className={styles.amountPrefix}>¥</span>
                  {order.amount}
                </div>
                {order.originalPrice && (
                  <div className={styles.originalPrice}>
                    ¥{order.originalPrice}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.orderCardFooter}>
              <div className={styles.orderMeta}>
                <span>{order.createdAt}</span>
                {order.payMethod && <span>{order.payMethod}</span>}
              </div>
              <div className={styles.orderActions}>
                <Tag
                  className={styles.statusTag}
                  color={statusConfig[order.status]?.color}
                >
                  {statusConfig[order.status]?.label}
                </Tag>
                {order.status === OrderStatusEnum.Paid && (
                  <Button size="small" onClick={() => handleViewDetail(order)}>
                    {dict('PC.Pages.MorePage.MyOrders.viewDetail')}
                  </Button>
                )}
                {order.status === OrderStatusEnum.Pending && (
                  <>
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => handleGoPay()}
                    >
                      {dict('PC.Pages.MorePage.MyOrders.goPay')}
                    </Button>
                    <Button size="small" onClick={() => handleCancelOrder()}>
                      {dict('PC.Pages.MorePage.MyOrders.cancelOrder')}
                    </Button>
                  </>
                )}
                {order.status === OrderStatusEnum.Refunded && (
                  <Button size="small" onClick={() => handleViewDetail(order)}>
                    {dict('PC.Pages.MorePage.MyOrders.viewDetail')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 订单详情 Drawer */}
      <Drawer
        title={dict('PC.Pages.MorePage.MyOrders.orderDetail') || '订单详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={400}
      >
        {selectedOrder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                {dict('PC.Pages.MorePage.MyOrders.detailOrderNo')}
              </div>
              <div style={{ fontSize: 14 }}>{selectedOrder.orderNo}</div>
            </div>
            <div>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                {dict('PC.Pages.MorePage.MyOrders.detailProduct')}
              </div>
              <div style={{ fontSize: 14 }}>{selectedOrder.productName}</div>
            </div>
            <div>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                {dict('PC.Pages.MorePage.MyOrders.detailAmount')}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                ¥{selectedOrder.amount}
              </div>
            </div>
            <div>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                {dict('PC.Pages.MorePage.MyOrders.detailPayMethod')}
              </div>
              <div style={{ fontSize: 14 }}>
                {selectedOrder.payMethod || '-'}
              </div>
            </div>
            <div>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                {dict('PC.Pages.MorePage.MyOrders.detailTime')}
              </div>
              <div style={{ fontSize: 14 }}>{selectedOrder.createdAt}</div>
            </div>
            <div>
              <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>
                {dict('PC.Pages.MorePage.MyOrders.detailStatus')}
              </div>
              <Tag color={statusConfig[selectedOrder.status]?.color}>
                {statusConfig[selectedOrder.status]?.label}
              </Tag>
            </div>
          </div>
        )}
      </Drawer>
    </WorkspaceLayout>
  );
};

export default MyOrders;
