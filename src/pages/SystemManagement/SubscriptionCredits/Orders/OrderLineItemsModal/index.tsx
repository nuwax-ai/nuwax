import { XProTable } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import type { BillOrderItem } from '@/types/interfaces/subscription';
import { formatDateTimeYmdHms } from '@/utils/dateUtils';
import type { ProColumns } from '@ant-design/pro-components';
import { Empty, Modal } from 'antd';
import React, { useMemo } from 'react';

export interface OrderLineItemsModalProps {
  /** 是否展示弹窗 */
  open: boolean;
  /** 关闭弹窗（含遮罩、右上角关闭） */
  onCancel: () => void;
  /** 订单明细行 */
  items: BillOrderItem[];
}

/**
 * 系统管理 - 订阅订单「订单明细」弹窗：表格展示 BillOrderItem 列表。
 */
const OrderLineItemsModal: React.FC<OrderLineItemsModalProps> = ({
  open,
  onCancel,
  items,
}) => {
  const columns = useMemo((): ProColumns<BillOrderItem>[] => {
    return [
      {
        title: dict('PC.Pages.SystemSubsOrders.orderLineItemId'),
        dataIndex: 'id',
        key: 'id',
        width: 100,
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.orderId'),
        dataIndex: 'orderId',
        key: 'orderId',
        width: 100,
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.orderLineItemTargetId'),
        dataIndex: 'targetId',
        key: 'targetId',
        width: 110,
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.orderLineItemTargetType'),
        dataIndex: 'targetType',
        key: 'targetType',
        width: 120,
        align: 'center',
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.orderLineItemTargetName'),
        dataIndex: 'targetName',
        key: 'targetName',
        ellipsis: true,
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.orderLineItemPrice'),
        dataIndex: 'price',
        key: 'price',
        width: 90,
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.orderLineItemCount'),
        dataIndex: 'count',
        key: 'count',
        width: 70,
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.orderLineItemCreated'),
        dataIndex: 'created',
        key: 'created',
        width: 170,
        render: (_: unknown, row: BillOrderItem) =>
          formatDateTimeYmdHms(row.created),
      },
      {
        title: dict('PC.Pages.SystemSubsOrders.orderLineItemSnapshot'),
        dataIndex: 'snapshot',
        key: 'snapshot',
        width: 260,
        render: (_: unknown, row: BillOrderItem) => {
          const v = row.snapshot;
          if (v === undefined || v === null) return '-';
          const text = typeof v === 'string' ? v : JSON.stringify(v, null, 2);
          return (
            <pre
              style={{
                margin: 0,
                maxHeight: 200,
                overflow: 'auto',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {text}
            </pre>
          );
        },
      },
    ];
  }, []);

  return (
    <Modal
      title={dict('PC.Pages.SystemSubsOrders.orderLineItems')}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={960}
      destroyOnHidden
    >
      {!items.length ? (
        <Empty
          description={dict('PC.Pages.SystemSubsOrders.orderLineItemsEmpty')}
        />
      ) : (
        <XProTable<BillOrderItem>
          rowKey="id"
          size="small"
          search={false}
          pagination={false}
          showQueryButtons={false}
          fullHeight={false}
          options={false}
          dataSource={items}
          scroll={{ x: 'max-content' }}
          columns={columns}
        />
      )}
    </Modal>
  );
};

export default OrderLineItemsModal;
