import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { copyTextToClipboard } from '@/utils/clipboard';
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, message, Space, Tag, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';
import { MOCK_API_KEYS } from './mock';

export interface ApiKeyItem {
  id: string;
  name: string;
  description: string;
  apiKey: string;
  status: 'active' | 'inactive' | 'expired';
  createTime: string;
  expireTime: string;
}

export const STATUS_MAP: Record<
  ApiKeyItem['status'],
  { color: string; text: string }
> = {
  active: { color: 'green', text: '活跃' },
  expired: { color: 'orange', text: '已过期' },
  inactive: { color: 'red', text: '停用' },
};

const { Text } = Typography;

const ApiKeyPage: React.FC = () => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(MOCK_API_KEYS);

  const toggleShowKey = (id: string) => {
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

  const columns: ProColumns<ApiKeyItem>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      search: false,
    },
    {
      title: 'API KEY',
      dataIndex: 'apiKey',
      key: 'apiKey',
      width: 320,
      render: (_, record) => {
        const visible = showKeys[record.id];
        return (
          <Space size={8}>
            <Text className="font-mono">
              {visible ? record.apiKey : maskApiKey(record.apiKey)}
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
                onClick={() => copyToClipboard(record.apiKey)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      search: false,
    },
    {
      title: '过期时间',
      dataIndex: 'expireTime',
      key: 'expireTime',
      search: false,
      render: (_, record) => (
        <Text type={record.expireTime === '永不过期' ? 'success' : undefined}>
          {record.expireTime}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      search: false,
      render: (_, record) => {
        const { color = 'default', text = '未知' } =
          STATUS_MAP[record.status] || {};
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      search: false,
      fixed: 'right',
      align: 'center',
      render: (_, record) => (
        <TableActions
          type="button"
          record={record}
          actions={[
            {
              key: 'edit',
              label: '编辑',
              icon: <EditOutlined />,
              onClick: (r) => {
                message.info(`正在编辑: ${r.name}`);
              },
            },
            {
              key: 'delete',
              label: '删除',
              icon: <DeleteOutlined />,
              danger: true,
              confirm: {
                title: (r) => `确认删除密钥 "${r.name}" 吗？`,
                description: '删除后将无法恢复，请谨慎操作。',
              },
              onClick: async (r) => {
                await new Promise((resolve) => {
                  setTimeout(resolve, 2000);
                });
                setApiKeys((prev) => prev.filter((item) => item.id !== r.id));
                message.success('删除成功');
              },
            },
          ]}
        />
      ),
    },
  ];

  return (
    <WorkspaceLayout title="API 密钥管理" tips="管理您的API密钥与访问权限">
      <XProTable<ApiKeyItem>
        dataSource={apiKeys}
        columns={columns}
        rowKey="id"
      />
    </WorkspaceLayout>
  );
};

export default ApiKeyPage;
