import XModalForm from '@/components/ProComponents/XModalForm';
import XProTable from '@/components/ProComponents/XProTable';
import { getRevenueTypeMap } from '@/pages/SystemManagement/PaymentEarnings/constants';
import { dict } from '@/services/i18nRuntime';
import { apiListDailyRevenueDetail } from '@/services/subscriptionService';
import type { DailyRevenueDetailRecord } from '@/types/interfaces/subscription';
import {
  AppstoreOutlined,
  BuildOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DailyEarningsDetailModalProps {
  visible: boolean;
  onCancel: () => void;
  dt?: string;
}

const REVENUE_ICON_CONFIG: Record<
  string,
  { icon: React.ReactNode; styleKey: string }
> = {
  PLAN: {
    icon: <AppstoreOutlined />,
    styleKey: 'tag-plan',
  },
  MODEL_CALL: {
    icon: <RobotOutlined />,
    styleKey: 'tag-model',
  },
  TOOL_CALL: {
    icon: <BuildOutlined />,
    styleKey: 'tag-tool',
  },
};

const DailyEarningsDetailModal: React.FC<DailyEarningsDetailModalProps> = ({
  visible,
  onCancel,
  dt,
}) => {
  const columns: ProColumns<DailyRevenueDetailRecord>[] = [
    {
      title: dict('PC.Pages.MorePage.MyEarnings.Detail.colAmount'),
      dataIndex: 'amount',
      width: 180,
      render: (_, record) => (
        <span className={styles['amount-plus']}>
          +¥
          {Number(record.amount)
            .toFixed(6)
            .replace(/\.?0+$/, '')}
        </span>
      ),
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.Detail.colSource'),
      dataIndex: 'remark',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.Detail.colType'),
      dataIndex: 'type',
      width: 140,
      render: (_, record) => {
        const typeMap = getRevenueTypeMap();
        const typeInfo = typeMap[record.type as keyof typeof typeMap];
        const iconInfo = REVENUE_ICON_CONFIG[record.type as string];

        if (!typeInfo || !iconInfo) return record.type;

        return (
          <div className={cx(styles.tag, styles[iconInfo.styleKey])}>
            <span className={styles.icon}>{iconInfo.icon}</span>
            <span>{typeInfo.text}</span>
          </div>
        );
      },
    },
    {
      title: dict('PC.Pages.MorePage.MyEarnings.Detail.colTime'),
      dataIndex: 'created',
      width: 180,
      valueType: 'dateTime',
    },
  ];

  return (
    <XModalForm
      title={dict('PC.Pages.MorePage.MyEarnings.Detail.modalTitle')}
      open={visible}
      onOpenChange={(v) => !v && onCancel()}
      submitter={{
        render: () => null,
      }}
      width={840}
      modalProps={{
        destroyOnHidden: true,
        className: styles['detail-modal'],
        footer: null,
      }}
    >
      <div className={styles['detail-table-container']}>
        <XProTable<DailyRevenueDetailRecord>
          columns={columns}
          request={async (params) => {
            if (!dt) return { data: [], total: 0, success: true };
            const res = await apiListDailyRevenueDetail({
              dt,
              pageNum: params.current || 1,
              pageSize: params.pageSize || 10,
            });
            return {
              data: res.data?.records || [],
              total: res.data?.total || 0,
              success: res.success,
            };
          }}
          params={{ dt }}
          scroll={{ y: 480 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
          }}
          search={false}
          toolBarRender={false}
          showQueryButtons={false}
          fullHeight={false}
          rowKey="id"
          size="middle"
        />
      </div>
    </XModalForm>
  );
};

export default DailyEarningsDetailModal;
