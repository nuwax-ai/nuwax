import WorkspaceLayout from '@/components/WorkspaceLayout';
import {
  CopyOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  KeyOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Divider,
  Input,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

/**
 * 状态枚举
 */
enum ApiKeyStatus {
  Active = 'active',
  Inactive = 'inactive',
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  status: ApiKeyStatus;
  createTime: string;
  lastUsedTime: string;
}

/**
 * API KEY 管理页面
 */
const ApiKeyPage: React.FC = () => {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Mock 数据列表
  const [apiKeys] = useState<ApiKeyItem[]>([
    {
      id: '1',
      name: 'Default Key',
      key: 'ak-72f8d9****c8e23f9a12',
      status: ApiKeyStatus.Active,
      createTime: '2025-01-10 12:00:00',
      lastUsedTime: '2026-03-24 10:45:12',
    },
    {
      id: '2',
      name: 'Test Environment',
      key: 'ak-9e1d8c****f2a71d8e92',
      status: ApiKeyStatus.Inactive,
      createTime: '2025-05-18 14:30:15',
      lastUsedTime: '2026-02-15 09:12:00',
    },
  ]);

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('API KEY 已成功复制到剪贴板');
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'API KEY',
      dataIndex: 'key',
      key: 'key',
      width: '40%',
      render: (text: string, record: ApiKeyItem) => {
        const visible = showKeys[record.id];
        return (
          <Space size={8} className="w-full">
            <Input.Password
              value={text}
              visibilityToggle={false}
              readOnly
              size="small"
              className={styles['key-input']}
            />
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
                onClick={() => copyToClipboard(text)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status: ApiKeyStatus) => (
        <Tag
          color={status === ApiKeyStatus.Active ? 'green' : 'default'}
          style={{ borderRadius: 4 }}
        >
          {status === ApiKeyStatus.Active ? '正常' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '18%',
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size={16}>
          <Typography.Link type="danger">删除</Typography.Link>
        </Space>
      ),
    },
  ];

  return (
    <WorkspaceLayout title="API KEY 管理">
      <div className={styles.container}>
        <Card className={styles['glass-card']}>
          <div
            className="flex items-center"
            style={{ gap: 12, marginBottom: 12 }}
          >
            <KeyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Title level={4} style={{ marginBottom: 0 }}>
              鉴权秘钥 (API KEY)
            </Title>
          </div>
          <Paragraph type="secondary" style={{ maxWidth: 640 }}>
            API KEY 是您与系统后端及外部 Agent 通信的安全令牌。请妥善保管好您的
            API KEY，避免泄露。泄漏可能导致用量被盗用。
          </Paragraph>

          <Divider style={{ margin: '24px 0' }} />

          <div className="flex justify-end" style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ borderRadius: 6 }}
            >
              创建新 KEY
            </Button>
          </div>

          <Table
            dataSource={apiKeys}
            columns={columns}
            rowKey="id"
            pagination={false}
            className={styles['api-table']}
          />
        </Card>
      </div>
    </WorkspaceLayout>
  );
};

export default ApiKeyPage;
