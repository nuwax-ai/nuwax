import { TableActions, XProTable } from '@/components/ProComponents';
import { apiApiKeyStats } from '@/services/account';
import type { ApiKeyInfo, ApiKeyStatsInfo } from '@/types/interfaces/account';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Typography } from 'antd';
import React from 'react';

const { Title } = Typography;

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
      render: (_, record) => (
        <TableActions
          type="link"
          record={record}
          actions={[
            {
              key: 'view',
              label: '查看记录',
              onClick: () => {
                // 暂时不实现
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Modal
      title={<Title level={4}>调用统计 - {record?.name}</Title>}
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
          request={async () => {
            if (!record?.accessKey) return { data: [], success: true };
            const res = await apiApiKeyStats(record.accessKey);
            return {
              data: res.data || [],
              success: res.success,
            };
          }}
          columns={columns}
          rowKey="path"
          search={false}
          toolBarRender={false}
          showQueryButtons={false}
          scroll={{ y: 400 }}
          pagination={{
            pageSize: 10,
          }}
        />
      </div>
    </Modal>
  );
};

export default ApiKeyStatsModal;
