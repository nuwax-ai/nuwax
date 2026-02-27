import SvgIcon from '@/components/base/SvgIcon';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiCreateSandboxConfig,
  apiDeleteSandboxConfig,
  apiGetSandboxConfigList,
  apiGetSandboxGlobalConfig,
  apiTestSandboxConnectivity,
  apiToggleSystemSandboxConfig,
  apiUpdateSandboxConfig,
  apiUpdateSandboxGlobalConfig,
} from '@/services/systemManage';
import { SandboxConfigItem as SandboxItem } from '@/types/interfaces/systemManage';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Button,
  Form,
  InputNumber,
  message,
  Modal,
  Space,
  Spin,
  Tooltip,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';
import SandboxModal from './components/SandboxModal';
import styles from './index.less';

const cx = classNames.bind(styles);

const SandboxConfig: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const tableActionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentRecord, setCurrentRecord] = useState<SandboxItem | null>(null);
  const [globalConfigLoading, setGlobalConfigLoading] = useState(false);
  const [savingLoading, setSavingLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [sandboxList, setSandboxList] = useState<SandboxItem[]>([]);
  const [form] = Form.useForm();
  const [testingIds, setTestingIds] = useState<Set<number | string>>(new Set());
  const location = useLocation();

  // 获取全局配置
  const fetchGlobalConfig = async () => {
    form.resetFields();
    setGlobalConfigLoading(true);
    try {
      const res = await apiGetSandboxGlobalConfig();
      if (res.code === SUCCESS_CODE && res.data) {
        form.setFieldsValue(res.data);
      }
    } finally {
      setGlobalConfigLoading(false);
    }
  };

  // 获取沙盒列表
  const fetchSandboxList = async () => {
    setTableLoading(true);
    try {
      const res = await apiGetSandboxConfigList();
      if (res.code === SUCCESS_CODE) {
        setSandboxList(res.data || []);
      }
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalConfig();
    fetchSandboxList();
  }, []);

  // 监听 location.state 变化
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      fetchGlobalConfig();
      fetchSandboxList();
    }
  }, [location.state]);

  const handleGlobalSave = async () => {
    try {
      const values = await form.validateFields();
      setSavingLoading(true);
      const res = await apiUpdateSandboxGlobalConfig(values);
      if (res.code === SUCCESS_CODE) {
        message.success('保存成功');
      }
    } finally {
      setSavingLoading(false);
    }
  };

  const handleTestConnectivity = async (id: number | string) => {
    setTestingIds((prev) => new Set(prev).add(id));
    try {
      const res = await apiTestSandboxConnectivity(id);
      if (res.code === SUCCESS_CODE) {
        message.success('测试成功，沙盒连接正常');
      } else {
        message.error(`测试失败：${res.message || '连接异常'}`);
      }
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // 启用/停用沙盒配置
  const handleToggleSandbox = (record: SandboxItem) => {
    const actionText = record.isActive ? '停用' : '启用';
    Modal.confirm({
      title: `${actionText}确认`,
      content: `确定要${actionText}沙盒${record.name}吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        const res = await apiToggleSystemSandboxConfig(record.id);
        if (res.code === SUCCESS_CODE) {
          message.success(`${actionText}成功`);
          fetchSandboxList();
        }
      },
    });
  };

  // 新增/编辑沙盒提交
  const handleSandboxSubmit = async (values: any) => {
    try {
      const payload =
        modalMode === 'add'
          ? { scope: 'GLOBAL', ...values }
          : { ...(currentRecord || {}), ...values };
      const apiCall =
        modalMode === 'add' ? apiCreateSandboxConfig : apiUpdateSandboxConfig;
      const res = await apiCall(payload);
      if (res.code === SUCCESS_CODE) {
        message.success(modalMode === 'add' ? '添加成功' : '保存成功');
        setModalVisible(false);
        fetchSandboxList();
        return true;
      }
    } catch (error) {
      console.error(error);
    }
    return false;
  };

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
            <div className={styles.address}>
              {record.configValue?.hostWithScheme}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '使用情况',
      dataIndex: 'usage',
      render: (_: any, record: SandboxItem) => {
        // 由于正式结构中没有当前使用人数，这里暂时硬编码一个比例或者显示最大用户数
        const percent =
          record.configValue.maxUsers > 0
            ? ((record.usingCount || 0) / record.configValue.maxUsers) * 100
            : 0;
        return (
          <div className={styles['usage-cell']}>
            <div className={styles['usage-text']}>
              <span className={styles.current}>{record.usingCount}</span>
              <span className={styles.total}>
                / {record.configValue.maxUsers}
              </span>
            </div>
            <div className={styles['progress-bar']}>
              <div
                className={cx(styles['progress-inner'], {
                  [styles.active]: record.online,
                })}
                style={{
                  width: `${percent}%`,
                  background: record.online ? '#52c41a' : '#f0f2f5',
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
      title: '在线状态',
      dataIndex: 'online',
      minWidth: 120,
      render: (_, record) => (
        <div
          className={cx(styles['status-tag'], {
            [styles.online]: record.online,
            [styles.offline]: !record.online,
          })}
        >
          <span className={styles.dot} />
          {record.online ? <span>在线</span> : <span>离线</span>}
        </div>
      ),
    },
    {
      title: '启用状态',
      dataIndex: 'isActive',
      minWidth: 120,
      render: (_, record) => (
        <div
          className={cx(styles['status-tag'], {
            [styles.online]: record.isActive,
            [styles.offline]: !record.isActive,
          })}
        >
          <span className={styles.dot} />
          {record.isActive ? <span>已启用</span> : <span>已停用</span>}
        </div>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 190,
      render: (_, record) => (
        <div className={styles['action-btns']}>
          <Tooltip title={record.isActive ? '停用' : '启用'}>
            <div
              className={cx(styles['action-btn'], {
                [styles.disabled]: !hasPermission('sandbox_config_modify'),
              })}
              onClick={() => {
                if (!hasPermission('sandbox_config_modify')) return;
                handleToggleSandbox(record);
              }}
            >
              {record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
            </div>
          </Tooltip>
          <Tooltip title="连通性测试">
            <div
              className={cx(styles['action-btn'], {
                [styles['btn-loading']]: testingIds.has(record.id),
              })}
              onClick={() =>
                !testingIds.has(record.id) && handleTestConnectivity(record.id)
              }
            >
              {testingIds.has(record.id) ? (
                <Spin size="small" />
              ) : (
                <ThunderboltOutlined />
              )}
            </div>
          </Tooltip>
          <Tooltip title="编辑">
            <div
              className={cx(styles['action-btn'], {
                [styles.disabled]: !hasPermission('sandbox_config_modify'),
              })}
              onClick={() => {
                if (!hasPermission('sandbox_config_modify')) return;
                setModalMode('edit');
                setCurrentRecord(record);
                setModalVisible(true);
              }}
            >
              <EditOutlined />
            </div>
          </Tooltip>
          <Tooltip title="删除">
            <div
              className={cx(styles['action-btn'], {
                [styles.disabled]: !hasPermission('sandbox_config_delete'),
              })}
              onClick={() => {
                if (!hasPermission('sandbox_config_delete')) return;
                Modal.confirm({
                  title: '删除确认',
                  content: '确定要删除此沙盒吗？',
                  okText: '确定',
                  cancelText: '取消',
                  onOk: async () => {
                    const res = await apiDeleteSandboxConfig(record.id);
                    if (res.code === SUCCESS_CODE) {
                      message.success('删除成功');
                      fetchSandboxList();
                    }
                  },
                });
              }}
            >
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
        hasPermission('sandbox_config_add') && (
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
        )
      }
    >
      <div className={styles['sandbox-container']}>
        {/* 全局配置区域 */}
        <div className={styles['config-section']}>
          <Spin spinning={globalConfigLoading}>
            <div className={styles['config-header']}>
              <div className={styles['section-title']}>全局配置</div>
              {hasPermission('sandbox_config_save') && (
                <Button
                  type="primary"
                  loading={savingLoading}
                  onClick={handleGlobalSave}
                >
                  保存
                </Button>
              )}
            </div>
            <Form form={form} layout="inline">
              <Form.Item label="每用户内存">
                <Space>
                  <Form.Item name="perUserMemoryGB" noStyle initialValue={4}>
                    <InputNumber
                      min={1}
                      max={999999}
                      precision={0}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                  <span style={{ color: '#999' }}>GB</span>
                </Space>
              </Form.Item>
              <Form.Item label="每用户CPU核心" style={{ marginLeft: 40 }}>
                <Space>
                  <Form.Item name="perUserCpuCores" noStyle initialValue={2}>
                    <InputNumber
                      min={1}
                      max={999999}
                      precision={0}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                  <span style={{ color: '#999' }}>核</span>
                </Space>
              </Form.Item>
            </Form>
          </Spin>
        </div>

        <div className={styles['table-card']}>
          <XProTable<SandboxItem>
            actionRef={tableActionRef}
            columns={columns}
            dataSource={sandboxList}
            loading={tableLoading}
            rowKey="id"
            search={false}
            pagination={false}
            showQueryButtons={false}
          />
          <div className={styles['footer-info']}>
            <span>共 {sandboxList.length} 个沙盒</span>
            <span>{sandboxList.filter((i) => i.online).length} 个在线</span>
          </div>
        </div>
      </div>

      <SandboxModal
        open={modalVisible}
        mode={modalMode}
        initialData={currentRecord}
        onCancel={() => setModalVisible(false)}
        onFinish={handleSandboxSubmit}
      />
    </WorkspaceLayout>
  );
};

export default SandboxConfig;
