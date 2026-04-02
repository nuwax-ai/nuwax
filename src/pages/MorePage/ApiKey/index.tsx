import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { apiApiKeyDelete, apiApiKeyList } from '@/services/account';
import type { ApiKeyInfo } from '@/types/interfaces/account';
import { copyTextToClipboard } from '@/utils/clipboard';
import {
  BarChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'umi';
import ApiKeyFormModal from './ApiKeyFormModal';
import ApiKeyPermissionModal from './ApiKeyPermissionModal';
import ApiKeyStatsModal from './ApiKeyStatsModal';

export const STATUS_MAP: Record<number, { color: string; text: string }> = {
  1: { color: 'green', text: '启用' },
  0: { color: 'red', text: '停用' },
};

const { Text } = Typography;

const ApiKeyPage: React.FC = () => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ApiKeyInfo | undefined>();
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsRecord, setStatsRecord] = useState<ApiKeyInfo | undefined>();
  const [permissionOpen, setPermissionOpen] = useState(false);
  const [permissionRecord, setPermissionRecord] = useState<
    ApiKeyInfo | undefined
  >();
  const location: any = useLocation();

  useEffect(() => {
    if (location.state?._t) {
      actionRef.current?.reloadAndRest?.();
    }
  }, [location.state?._t]);

  const toggleShowKey = (id: string | number) => {
    setShowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string) => {
    copyTextToClipboard(text, () => {
      message.success('API KEY 已成功复制到剪贴板');
    });
  };

  // 脱敏处理
  const maskApiKey = (key: string) => {
    if (!key || key.length < 10) return key;
    return `${key.slice(0, 10)}••••••••••••••••••••${key.slice(-4)}`;
  };

  const columns: ProColumns<ApiKeyInfo>[] = [
    {
      title: '密钥名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      width: 300,
    },
    {
      title: 'API Key',
      dataIndex: 'accessKey',
      key: 'accessKey',
      search: false,
      width: 360,
      render: (_, record) => {
        const visible = showKeys[record.id];
        return (
          <Space size={8}>
            <Text className="font-mono">
              {visible ? record.accessKey : maskApiKey(record.accessKey)}
            </Text>
            <Tooltip title={visible ? '隐藏' : '显示'}>
              <Button
                type="text"
                size="small"
                icon={visible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => toggleShowKey(record.id)}
              />
            </Tooltip>
            <Tooltip title="复制">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(record.accessKey)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created',
      key: 'created',
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '过期时间',
      dataIndex: 'expire',
      key: 'expire',
      search: false,
      render: (_, record) => {
        const val = record.expire;
        const isNever =
          !val || val === '永不过期' || val === '0000-00-00 00:00:00';

        // 如果后端返回的是 ISO 格式字符串，使用 dayjs 格式化显示成标准的日期时间
        const display = val && !isNever ? dayjs(val).format('YYYY-MM-DD') : val;

        return (
          <Text type={isNever ? 'success' : undefined}>
            {isNever ? '永不过期' : display}
          </Text>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      search: false,
      valueEnum: STATUS_MAP,
      render: (_, record) => {
        const { color = 'default', text = '未知' } =
          STATUS_MAP[record.status] || {};
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      search: false,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <TableActions
          type="button"
          record={record}
          actions={[
            {
              key: 'stats',
              label: '调用统计',
              icon: <BarChartOutlined />,
              onClick: (r) => {
                setStatsRecord(r);
                setStatsOpen(true);
              },
            },
            {
              key: 'permission',
              label: '权限配置',
              icon: <SafetyCertificateOutlined />,
              onClick: (r) => {
                setPermissionRecord(r);
                setPermissionOpen(true);
              },
            },
            {
              key: 'edit',
              label: '编辑',
              icon: <EditOutlined />,
              onClick: (r) => {
                setCurrentRecord(r);
                setModalOpen(true);
              },
            },
            {
              key: 'delete',
              label: '删除',
              icon: <DeleteOutlined />,
              danger: true,
              confirm: {
                description: (r) =>
                  `密钥 "${r.name}" 删除后将无法恢复，请谨慎操作。`,
              },
              onClick: async () => {
                await apiApiKeyDelete(record.accessKey);
                actionRef.current?.reload();
                message.success('删除成功');
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <WorkspaceLayout
      title="API Key"
      tips="管理您的API密钥与访问权限"
      rightSlot={
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setCurrentRecord(undefined);
            setModalOpen(true);
          }}
        >
          新增 API Key
        </Button>
      }
    >
      <XProTable<ApiKeyInfo>
        key={location.state?._t || 'api-key-table'}
        actionRef={actionRef}
        request={async (params) => {
          const { current = 1, pageSize = 15 } = params;
          const result = await apiApiKeyList();
          const data = result.data || [];

          // 本地检索逻辑
          const filteredData = data.filter((item) => {
            const nameMatch = params.name
              ? item.name.toLowerCase().includes(params.name.toLowerCase())
              : true;
            return nameMatch;
          });

          const total = filteredData.length;
          const startIndex = (current - 1) * pageSize;
          const slicedData = filteredData.slice(
            startIndex,
            startIndex + pageSize,
          );

          return {
            data: slicedData,
            success: true,
            total,
          };
        }}
        columns={columns}
        rowKey="id"
      />
      <ApiKeyFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        record={currentRecord}
        onSuccess={() => {
          setModalOpen(false);
          actionRef.current?.reload();
        }}
      />
      <ApiKeyStatsModal
        open={statsOpen}
        onOpenChange={setStatsOpen}
        record={statsRecord}
      />
      <ApiKeyPermissionModal
        open={permissionOpen}
        onOpenChange={setPermissionOpen}
        record={permissionRecord}
        onSuccess={() => {
          actionRef.current?.reload();
        }}
      />
    </WorkspaceLayout>
  );
};

export default ApiKeyPage;
