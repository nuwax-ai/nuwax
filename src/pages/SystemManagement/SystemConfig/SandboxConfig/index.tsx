import SvgIcon from '@/components/base/SvgIcon';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
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

  // Fetch global configuration
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

  // Fetch sandbox list
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

  // Watch location.state changes
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
        message.success(t('PC.Toast.Global.savedSuccessfully'));
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
        message.success(
          t('PC.Pages.SystemConfigSandboxConfig.connectivitySuccess'),
        );
      } else {
        message.error(
          t(
            'PC.Pages.SystemConfigSandboxConfig.connectivityFailed',
            res.message ||
              t('PC.Pages.SystemConfigSandboxConfig.connectionException'),
          ),
        );
      }
    } finally {
      setTestingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Enable/disable sandbox configuration
  const handleToggleSandbox = (record: SandboxItem) => {
    const actionText = record.isActive
      ? t('PC.Pages.SystemConfigSandboxConfig.disable')
      : t('PC.Pages.SystemConfigSandboxConfig.enable');
    Modal.confirm({
      title: t(
        'PC.Pages.SystemConfigSandboxConfig.toggleConfirmTitle',
        actionText,
      ),
      content: t(
        'PC.Pages.SystemConfigSandboxConfig.toggleConfirmContent',
        actionText,
        record.name,
      ),
      okText: t('PC.Common.Global.confirm'),
      cancelText: t('PC.Common.Global.cancel'),
      onOk: async () => {
        const res = await apiToggleSystemSandboxConfig(record.id);
        if (res.code === SUCCESS_CODE) {
          message.success(
            t('PC.Pages.SystemConfigSandboxConfig.toggleSuccess', actionText),
          );
          fetchSandboxList();
        }
      },
    });
  };

  // Submit add/edit sandbox
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
        message.success(
          modalMode === 'add'
            ? t('PC.Pages.SystemConfigSandboxConfig.addSuccess')
            : t('PC.Toast.Global.savedSuccessfully'),
        );
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
      title: t('PC.Pages.SystemConfigSandboxConfig.columnName'),
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
      title: t('PC.Pages.SystemConfigSandboxConfig.columnUsage'),
      dataIndex: 'usage',
      render: (_: any, record: SandboxItem) => {
        // Current user count is not fully returned by backend; use available values.
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
              {t(
                'PC.Pages.SystemConfigSandboxConfig.usagePercentInUse',
                String(Math.round(percent)),
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('PC.Pages.SystemConfigSandboxConfig.columnOnlineStatus'),
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
          {record.online ? (
            <span>{t('PC.Pages.SystemConfigSandboxConfig.online')}</span>
          ) : (
            <span>{t('PC.Pages.SystemConfigSandboxConfig.offline')}</span>
          )}
        </div>
      ),
    },
    {
      title: t('PC.Pages.SystemConfigSandboxConfig.columnActiveStatus'),
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
          {record.isActive ? (
            <span>{t('PC.Pages.SystemConfigSandboxConfig.enabled')}</span>
          ) : (
            <span>{t('PC.Pages.SystemConfigSandboxConfig.disabled')}</span>
          )}
        </div>
      ),
    },
    {
      title: t('PC.Pages.SystemConfigSandboxConfig.columnAction'),
      valueType: 'option',
      width: 190,
      render: (_, record) => (
        <div className={styles['action-btns']}>
          <Tooltip
            title={
              record.isActive
                ? t('PC.Pages.SystemConfigSandboxConfig.disable')
                : t('PC.Pages.SystemConfigSandboxConfig.enable')
            }
          >
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
          <Tooltip
            title={t('PC.Pages.SystemConfigSandboxConfig.connectivityTest')}
          >
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
          <Tooltip title={t('PC.Pages.SystemConfigSandboxConfig.edit')}>
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
          <Tooltip title={t('PC.Pages.SystemConfigSandboxConfig.delete')}>
            <div
              className={cx(styles['action-btn'], {
                [styles.disabled]: !hasPermission('sandbox_config_delete'),
              })}
              onClick={() => {
                if (!hasPermission('sandbox_config_delete')) return;
                Modal.confirm({
                  title: t(
                    'PC.Pages.SystemConfigSandboxConfig.deleteConfirmTitle',
                  ),
                  content: t(
                    'PC.Pages.SystemConfigSandboxConfig.deleteConfirmContent',
                  ),
                  okText: t('PC.Common.Global.confirm'),
                  cancelText: t('PC.Common.Global.cancel'),
                  onOk: async () => {
                    const res = await apiDeleteSandboxConfig(record.id);
                    if (res.code === SUCCESS_CODE) {
                      message.success(
                        t('PC.Pages.SystemConfigSandboxConfig.deleteSuccess'),
                      );
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
      title={t('PC.Pages.SystemConfigSandboxConfig.pageTitle')}
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
            {t('PC.Pages.SystemConfigSandboxConfig.addSandbox')}
          </Button>
        )
      }
    >
      <div className={styles['sandbox-container']}>
        {/* Global configuration section */}
        <div className={styles['config-section']}>
          <Spin spinning={globalConfigLoading}>
            <div className={styles['config-header']}>
              <div className={styles['section-title']}>
                {t('PC.Pages.SystemConfigSandboxConfig.globalConfig')}
              </div>
              {hasPermission('sandbox_config_save') && (
                <Button
                  type="primary"
                  loading={savingLoading}
                  onClick={handleGlobalSave}
                >
                  {t('PC.Common.Global.save')}
                </Button>
              )}
            </div>
            <Form form={form} layout="inline">
              <Form.Item
                label={t('PC.Pages.SystemConfigSandboxConfig.perUserMemory')}
              >
                <Space>
                  <Form.Item name="perUserMemoryGB" noStyle initialValue={4}>
                    <InputNumber
                      min={1}
                      max={999999}
                      precision={0}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                  <span style={{ color: '#999' }}>
                    {t('PC.Pages.SystemConfigSandboxConfig.unitGb')}
                  </span>
                </Space>
              </Form.Item>
              <Form.Item
                label={t('PC.Pages.SystemConfigSandboxConfig.perUserCpu')}
                style={{ marginLeft: 40 }}
              >
                <Space>
                  <Form.Item name="perUserCpuCores" noStyle initialValue={2}>
                    <InputNumber
                      min={1}
                      max={999999}
                      precision={0}
                      style={{ width: 100 }}
                    />
                  </Form.Item>
                  <span style={{ color: '#999' }}>
                    {t('PC.Pages.SystemConfigSandboxConfig.unitCore')}
                  </span>
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
            <span>
              {t(
                'PC.Pages.SystemConfigSandboxConfig.totalSandboxCount',
                String(sandboxList.length),
              )}
            </span>
            <span>
              {t(
                'PC.Pages.SystemConfigSandboxConfig.onlineSandboxCount',
                String(sandboxList.filter((i) => i.online).length),
              )}
            </span>
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
