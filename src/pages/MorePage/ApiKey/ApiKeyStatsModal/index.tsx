import { TableActions, XProTable } from '@/components/ProComponents';
import { apiApiKeyStats } from '@/services/account';
import type { ApiKeyInfo, ApiKeyStatsInfo } from '@/types/interfaces/account';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Modal } from 'antd';
import React from 'react';
import { history } from 'umi';

interface ApiKeyStatsModalProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 弹窗显隐控制 */
  onOpenChange: (open: boolean) => void;
  /** 当前选中的密钥信息 */
  record?: ApiKeyInfo;
}

/**
 * 格式化数字为千分位字符串
 */
const formatNumber = (num: any) => {
  const n = Number(num);
  if (isNaN(n)) return '0';
  return new Intl.NumberFormat('en-US').format(n);
};

/**
 * API KEY 调用统计弹窗
 */
const ApiKeyStatsModal: React.FC<ApiKeyStatsModalProps> = ({
  open,
  onOpenChange,
  record,
}) => {
  const columns: ProColumns<ApiKeyStatsInfo>[] = [
    {
      title: '接口名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: 200,
    },
    {
      title: '接口地址',
      dataIndex: 'path',
      key: 'path',
      ellipsis: true,
      width: 300,
    },
    {
      title: '调用总次数',
      key: 'totalCount',
      align: 'center',
      render: (_, record) => (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          {formatNumber(record.total?.totalCount)}
        </span>
      ),
    },
    {
      title: '本月调用',
      key: 'monthCount',
      align: 'center',
      render: (_, record) => (
        <span style={{ color: '#52c41a', fontSize: '16px' }}>
          {formatNumber(record.month?.totalCount)}
        </span>
      ),
    },
    {
      title: '今日调用',
      key: 'todayCount',
      align: 'center',
      render: (_, record) => (
        <span style={{ color: '#1890ff', fontSize: '16px' }}>
          {formatNumber(record.today?.totalCount)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, statsRecord) => (
        <TableActions
          type="link"
          record={statsRecord}
          actions={[
            {
              key: 'view',
              label: '查看记录',
              onClick: () => {
                onOpenChange(false);
                history.push(
                  `/more-page/api-key-logs?targetId=${record?.id}&requestId=${statsRecord.key}`,
                );
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Modal
      title="调用统计"
      open={open}
      onCancel={() => onOpenChange(false)}
      width={1000}
      footer={[
        <Button key="close" onClick={() => onOpenChange(false)}>
          关闭
        </Button>,
      ]}
      destroyOnHidden
    >
      <div style={{ minHeight: 480 }}>
        <XProTable<ApiKeyStatsInfo>
          request={async (params) => {
            const { current = 1, pageSize = 15 } = params;
            if (!record?.accessKey) return { data: [], success: true };
            const res = await apiApiKeyStats(record.accessKey);
            const data = res.data || [];
            const total = data.length;

            const startIndex = (current - 1) * pageSize;
            const slicedData = data.slice(startIndex, startIndex + pageSize);

            return {
              data: slicedData,
              success: res.success,
              total,
            };
          }}
          columns={columns}
          rowKey="path"
          search={false}
          toolBarRender={false}
          showQueryButtons={false}
          scroll={{ y: 400 }}
        />
      </div>
    </Modal>
  );
};

export default ApiKeyStatsModal;
