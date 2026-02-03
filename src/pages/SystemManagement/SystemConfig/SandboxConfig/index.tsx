import SvgIcon from '@/components/base/SvgIcon';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import {
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Form, InputNumber, Space, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import SandboxModal, { SandboxItem } from './components/SandboxModal';
import styles from './index.less';

const cx = classNames.bind(styles);

const SandboxConfig: React.FC = () => {
  const tableActionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentRecord, setCurrentRecord] = useState<SandboxItem | null>(null);

  // 模拟数据
  const mockData: SandboxItem[] = [
    {
      id: 1,
      name: 'AGENT沙箱',
      address: ['sandbox-inner.nuwax.com:9...', 'sandbox-inner.nuwax.com:9...'],
      currentUsage: 8,
      totalCapacity: 30,
      status: 'offline',
    },
    {
      id: 2,
      name: '开发测试沙箱',
      address: ['sandbox-dev.nuwax.com:9086', 'sandbox-dev.nuwax.com:9088'],
      currentUsage: 15,
      totalCapacity: 20,
      status: 'online',
    },
    {
      id: 3,
      name: '备用沙箱服务器',
      address: ['sandbox-backup.nuwax.com...', 'sandbox-backup.nuwax.com...'],
      currentUsage: 3,
      totalCapacity: 50,
      status: 'offline',
    },
  ];

  const columns: ProColumns<SandboxItem>[] = [
    {
      title: '沙盒名称',
      dataIndex: 'name',
      render: (_: any, record: SandboxItem) => (
        <div className={styles['sandbox-item']}>
          <div className={styles['sandbox-icon']}>
            <SvgIcon name="icons-nav-cube" />
          </div>
          <div className={styles['sandbox-info']}>
            <div className={styles.name}>{record.name}</div>
            <div className={styles.id}>ID: {record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: '服务地址',
      dataIndex: 'address',
      render: (_, record) => (
        <div style={{ color: '#999', fontSize: 13 }}>
          {record.address.map((addr, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#448aff',
                  marginRight: 8,
                  opacity: 0.6,
                }}
              />
              {addr}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '使用情况',
      dataIndex: 'usage',
      render: (_: any, record: SandboxItem) => {
        const percent = (record.currentUsage / record.totalCapacity) * 100;
        return (
          <div className={styles['usage-cell']}>
            <div className={styles['usage-text']}>
              <span className={styles.current}>{record.currentUsage}</span>
              <span className={styles.total}>/ {record.totalCapacity}</span>
            </div>
            <div className={styles['progress-bar']}>
              <div
                className={cx(styles['progress-inner'], {
                  [styles.active]: record.status === 'online',
                })}
                style={{
                  width: `${percent}%`,
                  background:
                    record.status === 'online' ? '#52c41a' : '#f0f2f5',
                }}
              />
            </div>
            <div className={styles['usage-label']}>
              {Math.round(percent)}% 使用中
            </div>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, record) => (
        <div
          className={cx(styles['status-tag'], {
            [styles.online]: record.status === 'online',
            [styles.offline]: record.status === 'offline',
          })}
        >
          <span className={styles.dot} />
          {record.status === 'online' ? <span>在线</span> : <span>离线</span>}
        </div>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => (
        <div className={styles['action-btns']}>
          <Tooltip title="连通性测试">
            <div className={styles['action-btn']}>
              <ThunderboltOutlined />
            </div>
          </Tooltip>
          <Tooltip title="编辑">
            <div
              className={styles['action-btn']}
              onClick={() => {
                setModalMode('edit');
                setCurrentRecord(record);
                setModalVisible(true);
              }}
            >
              <EditOutlined />
            </div>
          </Tooltip>
          <Tooltip title={record.status === 'online' ? '下线' : '上线'}>
            <div className={styles['action-btn']}>
              {record.status === 'online' ? (
                <EyeInvisibleOutlined />
              ) : (
                <EyeOutlined />
              )}
            </div>
          </Tooltip>
          <Tooltip title="删除">
            <div className={styles['action-btn']}>
              <DeleteOutlined />
            </div>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <WorkspaceLayout
      title="沙盒配置"
      rightSlot={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setModalMode('add');
            setCurrentRecord(null);
            setModalVisible(true);
          }}
        >
          添加沙盒
        </Button>
      }
    >
      <div className={styles['sandbox-container']}>
        {/* 全局配置区域 */}
        <div className={styles['config-section']}>
          <div className={styles['config-header']}>
            <div className={styles['section-title']}>全局配置</div>
            <Button type="primary">保存</Button>
          </div>
          <Form layout="inline">
            <Form.Item label="每用户内存" initialValue={4}>
              <Space>
                <InputNumber min={1} style={{ width: 100 }} />
                <span style={{ color: '#999' }}>GB</span>
              </Space>
            </Form.Item>
            <Form.Item
              label="每用户CPU核心"
              initialValue={2}
              style={{ marginLeft: 40 }}
            >
              <Space>
                <InputNumber min={1} style={{ width: 100 }} />
                <span style={{ color: '#999' }}>核</span>
              </Space>
            </Form.Item>
          </Form>
        </div>

        {/* 沙盒列表区域 */}
        <div className={styles['table-card']}>
          <ProTable<SandboxItem>
            actionRef={tableActionRef}
            columns={columns}
            dataSource={mockData}
            rowKey="id"
            search={false}
            options={false}
            pagination={false}
          />
          <div className={styles['footer-info']}>
            <span>共 {mockData.length} 个沙盒</span>
            <span>
              {mockData.filter((i) => i.status === 'online').length} 个在线
            </span>
          </div>
        </div>
      </div>

      <SandboxModal
        open={modalVisible}
        mode={modalMode}
        initialData={currentRecord}
        onCancel={() => setModalVisible(false)}
        onFinish={async (values) => {
          console.log(values);
          setModalVisible(false);
          return true;
        }}
      />
    </WorkspaceLayout>
  );
};

export default SandboxConfig;
