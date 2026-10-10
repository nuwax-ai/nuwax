/**
 * 登录方式管理（系统管理 › 系统配置）
 *
 * - 列表：GET /api/system/idp/list（不分页）
 * - 新增默认停用；停用联动取消「未登录自动跳转」；自动跳转租户内唯一
 * - 删除：仍有用户绑定时后端拒绝，由全局请求层提示原因
 * - 权限：auth_method_query / _add / _modify / _delete / _enable（含自动跳转）
 */
import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiAuthIdpAutoRedirect,
  apiAuthIdpCreate,
  apiAuthIdpDelete,
  apiAuthIdpList,
  apiAuthIdpUpdate,
  apiAuthIdpUpdateStatus,
} from '@/services/authIdp';
import { dict } from '@/services/i18nRuntime';
import { AuthIdpTypeEnum, type AuthIdpInfo } from '@/types/interfaces/authIdp';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Modal, Switch, Tag, Tooltip, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';
import AuthMethodFormModal from './AuthMethodFormModal';
import {
  getOAuth2ProviderOptions,
  getTypeOptions,
  getWechatModeOptions,
  labelOf,
  TYPE_COLOR,
} from './constants';
import styles from './index.less';
import { toAuthIdpSavePayload, type AuthIdpFormValues } from './utils';

/** 配置摘要：只展示可识别的非敏感信息 */
const ConfigSummary: React.FC<{ record: AuthIdpInfo }> = ({ record }) => {
  const config = record.config ?? {};
  const items: [string, string | undefined][] = [];
  if (record.type === AuthIdpTypeEnum.Cas) {
    items.push([
      dict('PC.Pages.SystemAuthMethod.casServerUrl'),
      config.serverUrl,
    ]);
    const count = Object.keys(config.fieldMapping ?? {}).length;
    items.push([
      dict('PC.Pages.SystemAuthMethod.fieldMapping'),
      count
        ? dict('PC.Pages.SystemAuthMethod.mappingCount', count)
        : dict('PC.Pages.SystemAuthMethod.mappingNone'),
    ]);
  }
  if (record.type === AuthIdpTypeEnum.OAuth2) {
    items.push([
      dict('PC.Pages.SystemAuthMethod.provider'),
      labelOf(getOAuth2ProviderOptions(), config.provider),
    ]);
    items.push(['Client ID', config.clientId]);
  }
  if (record.type === AuthIdpTypeEnum.Wechat) {
    items.push([
      dict('PC.Pages.SystemAuthMethod.wechatMode'),
      labelOf(getWechatModeOptions(), config.mode),
    ]);
    items.push(['AppID', config.appId]);
  }
  return (
    <div className={styles.summary}>
      {items.map(([label, value]) => (
        <span key={label}>
          <span className={styles['summary-label']}>{label}</span>
          <span className={styles['summary-value']}>{value || '--'}</span>
        </span>
      ))}
    </div>
  );
};

const AuthMethod: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const actionRef = useRef<ActionType>();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AuthIdpInfo | null>(null);
  // 正在切换的「行:列」，防止重复点击
  const [pendingKey, setPendingKey] = useState<string>();
  const canEnable = hasPermission('auth_method_enable');

  // 通过菜单再次进入时刷新
  useEffect(() => {
    if ((location.state as any)?._t) actionRef.current?.reload();
  }, [location.state]);

  const openModal = (record: AuthIdpInfo | null) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleFinish = async (values: AuthIdpFormValues) => {
    try {
      const payload = toAuthIdpSavePayload(values);
      const res = editing
        ? await apiAuthIdpUpdate(payload)
        : await apiAuthIdpCreate(payload);
      if (res.code !== SUCCESS_CODE) return false;
      setModalOpen(false);
      actionRef.current?.reload();
      if (editing) {
        message.success(dict('PC.Common.Global.saveSuccess'));
      } else if (values.type === AuthIdpTypeEnum.Wechat) {
        // 微信无需在提供方登记回调地址，只告知默认停用
        message.success(dict('PC.Pages.SystemAuthMethod.createdTitle'));
      } else {
        // 新增默认停用；回调地址需先登记到 IdP 侧
        Modal.success({
          title: dict('PC.Pages.SystemAuthMethod.createdTitle'),
          content: (
            <>
              <p>{dict('PC.Pages.SystemAuthMethod.createdDesc')}</p>
              {res.data?.callbackUrl && (
                <Typography.Paragraph code copyable>
                  {res.data.callbackUrl}
                </Typography.Paragraph>
              )}
            </>
          ),
        });
      }
      return true;
    } catch {
      // 业务错误已由全局请求层提示
      return false;
    }
  };

  const runToggle = async (key: string, request: () => Promise<unknown>) => {
    setPendingKey(key);
    try {
      await request();
      message.success(dict('PC.Common.Global.saveSuccess'));
      // 启停联动自动跳转、自动跳转租户内唯一：整表刷新拿最新状态
      actionRef.current?.reload();
    } catch {
      // 请求层已提示失败；消费事件 Promise 的拒绝，保留原状态供重试。
    } finally {
      setPendingKey(undefined);
    }
  };

  const handleDelete = async (record: AuthIdpInfo) => {
    try {
      await apiAuthIdpDelete(record.id);
      message.success(dict('PC.Common.Global.deleteSuccess'));
      actionRef.current?.reload();
    } catch {
      // 请求层已提示失败；保留列表，关闭确认框后可重新确认删除。
    }
  };

  const typeOptions = getTypeOptions();

  const columns: ProColumns<AuthIdpInfo>[] = [
    {
      title: dict('PC.Pages.SystemAuthMethod.name'),
      dataIndex: 'name',
      width: 220,
      render: (_, record) => (
        <div className={styles['name-cell']}>
          {record.icon ? (
            <img className={styles['name-icon']} src={record.icon} alt="" />
          ) : (
            <span className={styles['name-fallback']}>
              {record.name?.slice(0, 1)}
            </span>
          )}
          <Typography.Text ellipsis={{ tooltip: record.name }}>
            {record.name}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: dict('PC.Pages.SystemAuthMethod.type'),
      dataIndex: 'type',
      width: 140,
      render: (_, record) => (
        <Tag color={TYPE_COLOR[record.type] ?? 'default'}>
          {labelOf(typeOptions, record.type)}
        </Tag>
      ),
    },
    {
      title: dict('PC.Pages.SystemAuthMethod.configInfo'),
      dataIndex: 'config',
      width: 340,
      ellipsis: false,
      render: (_, record) => <ConfigSummary record={record} />,
    },
    {
      title: dict('PC.Pages.SystemAuthMethod.status'),
      dataIndex: 'enabled',
      width: 90,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.enabled === 1}
          disabled={!canEnable}
          loading={pendingKey === `${record.id}:enabled`}
          onChange={(checked) =>
            runToggle(`${record.id}:enabled`, () =>
              apiAuthIdpUpdateStatus({
                id: record.id,
                enabled: checked ? 1 : 0,
              }),
            )
          }
        />
      ),
    },
    {
      title: (
        <Tooltip title={dict('PC.Pages.SystemAuthMethod.autoRedirectTip')}>
          {dict('PC.Pages.SystemAuthMethod.autoRedirect')}
        </Tooltip>
      ),
      dataIndex: 'autoRedirect',
      width: 160,
      render: (_, record) =>
        record.enabled === 1 ? (
          <Switch
            size="small"
            checked={record.autoRedirect === 1}
            disabled={!canEnable}
            loading={pendingKey === `${record.id}:autoRedirect`}
            onChange={(checked) =>
              runToggle(`${record.id}:autoRedirect`, () =>
                apiAuthIdpAutoRedirect({ id: checked ? record.id : null }),
              )
            }
          />
        ) : (
          <Typography.Text type="secondary">
            {dict('PC.Pages.SystemAuthMethod.notEnabled')}
          </Typography.Text>
        ),
    },
    {
      title: dict('PC.Common.Global.action'),
      valueType: 'option',
      fixed: 'right',
      align: 'center',
      width: 140,
      render: (_, record) => (
        <TableActions<AuthIdpInfo>
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              disabled: !hasPermission('auth_method_modify'),
              onClick: openModal,
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              disabled: !hasPermission('auth_method_delete'),
              confirm: {
                title: dict('PC.Common.Global.confirmDelete'),
                description: dict('PC.Pages.SystemAuthMethod.deleteDesc'),
              },
              onClick: handleDelete,
            },
          ]}
        />
      ),
    },
  ];

  const request = async () => {
    const res = await apiAuthIdpList();
    const list = res.data ?? [];
    return {
      data: list,
      total: list.length,
      success: res.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.authMethodConfig')}
      hideScroll
      rightSlot={
        hasPermission('auth_method_add') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal(null)}
          >
            {dict('PC.Pages.SystemAuthMethod.addButton')}
          </Button>
        )
      }
    >
      <XProTable<AuthIdpInfo>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={request}
        search={false}
        pagination={false}
        scroll={{ x: 1090 }}
        showQueryButtons={false}
        hideToolbar
      />
      <AuthMethodFormModal
        open={modalOpen}
        record={editing}
        onCancel={() => setModalOpen(false)}
        onFinish={handleFinish}
      />
    </WorkspaceLayout>
  );
};

export default AuthMethod;
