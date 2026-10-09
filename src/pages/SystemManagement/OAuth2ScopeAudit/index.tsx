/**
 * OAuth2 scope 变更审核（系统管理）
 *
 * 开发者在三方应用 / 全栈应用详情里提交 scope 变更后，由管理员在此审核：
 * 通过则目标 scope 写回生效；拒绝需填写原因（回传给申请人）。
 * 权限：oauth2_scope_audit_query / _pass / _reject
 */
import {
  TableActions,
  XModalForm,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiOAuth2ScopeApplyPage,
  apiOAuth2ScopeApprove,
  apiOAuth2ScopeReject,
} from '@/services/oauth2Scope';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  OAuth2ScopeApplyStatusEnum,
  type OAuth2ScopeApplyInfo,
} from '@/types/interfaces/oauth2Scope';
import { diffScopes } from '@/utils/oauth2Scope';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { ProFormTextArea } from '@ant-design/pro-components';
import { message, Tag, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';

const STATUS_META: Record<
  OAuth2ScopeApplyStatusEnum,
  { color: string; key: string }
> = {
  [OAuth2ScopeApplyStatusEnum.Pending]: {
    color: 'processing',
    key: 'statusPending',
  },
  [OAuth2ScopeApplyStatusEnum.Approved]: {
    color: 'success',
    key: 'statusApproved',
  },
  [OAuth2ScopeApplyStatusEnum.Rejected]: {
    color: 'error',
    key: 'statusRejected',
  },
};

const t = (key: string) => dict(`PC.Pages.SystemOAuth2ScopeAudit.${key}`);

/** scope 变化：新增绿、移除红（删除线） */
const ScopeDiff: React.FC<{ record: OAuth2ScopeApplyInfo }> = ({ record }) => {
  const { added, removed } = diffScopes(record.oldScopes, record.scopes);
  if (!added.length && !removed.length) {
    return <Typography.Text type="secondary">{t('noChange')}</Typography.Text>;
  }
  return (
    <span>
      {added.map((scope) => (
        <Tag key={`+${scope}`} color="green">
          + {scope}
        </Tag>
      ))}
      {removed.map((scope) => (
        <Tag key={`-${scope}`} color="red">
          <del>{scope}</del>
        </Tag>
      ))}
    </span>
  );
};

const OAuth2ScopeAudit: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();
  const [rejecting, setRejecting] = useState<OAuth2ScopeApplyInfo | null>(null);

  const handleReset = useCallback(() => {
    // 重置回默认筛选（状态为空，展示全部）
    actionRef.current?.reset?.();
  }, []);

  // 通过菜单再次进入时刷新
  useEffect(() => {
    if ((location.state as any)?._t) handleReset();
  }, [location.state, handleReset]);

  const handleApprove = async (record: OAuth2ScopeApplyInfo) => {
    try {
      await apiOAuth2ScopeApprove(record.id);
      message.success(t('approveSuccess'));
      actionRef.current?.reload();
    } catch {
      // 请求层已提示失败；消费确认操作的拒绝，保留记录供再次确认重试。
    }
  };

  const handleReject = async ({ reason }: { reason: string }) => {
    if (!rejecting) return false;
    try {
      await apiOAuth2ScopeReject(rejecting.id, reason.trim());
      message.success(t('rejectSuccess'));
      setRejecting(null);
      actionRef.current?.reload();
      return true;
    } catch {
      return false;
    }
  };

  const columns: ProColumns<OAuth2ScopeApplyInfo>[] = [
    {
      title: t('colApp'),
      dataIndex: 'projectName',
      width: 180,
      hideInSearch: true,
    },
    {
      title: t('colType'),
      dataIndex: 'projectType',
      width: 110,
      hideInSearch: true,
      render: (_, record) =>
        record.projectType === AgentComponentTypeEnum.UserApp
          ? t('typeUserApp')
          : t('typeThirdApp'),
    },
    {
      title: 'Client ID',
      dataIndex: 'clientId',
      width: 180,
      hideInSearch: true,
      copyable: true,
    },
    {
      title: t('colApplicant'),
      dataIndex: 'applyUserId',
      width: 100,
      hideInSearch: true,
    },
    {
      title: t('colScopeChange'),
      dataIndex: 'scopes',
      width: 280,
      hideInSearch: true,
      ellipsis: false,
      render: (_, record) => <ScopeDiff record={record} />,
    },
    {
      title: t('colStatus'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(STATUS_META).map(([status, meta]) => [
          status,
          { text: t(meta.key) },
        ]),
      ),
      render: (_, record) => {
        const meta = STATUS_META[record.status];
        return meta ? <Tag color={meta.color}>{t(meta.key)}</Tag> : '--';
      },
    },
    {
      title: t('colRejectReason'),
      dataIndex: 'rejectReason',
      width: 180,
      hideInSearch: true,
    },
    {
      title: t('colCreated'),
      dataIndex: 'created',
      width: 170,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: t('colReviewedAt'),
      dataIndex: 'reviewedAt',
      width: 170,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: dict('PC.Common.Global.action'),
      valueType: 'option',
      fixed: 'right',
      align: 'center',
      width: 130,
      render: (_, record) => (
        <TableActions<OAuth2ScopeApplyInfo>
          record={record}
          actions={[
            {
              key: 'approve',
              label: t('actionApprove'),
              visible: record.status === OAuth2ScopeApplyStatusEnum.Pending,
              disabled: !hasPermission('oauth2_scope_audit_pass'),
              confirm: {
                title: t('approveConfirm'),
                description: (r) => r.projectName,
              },
              onClick: handleApprove,
            },
            {
              key: 'reject',
              label: t('actionReject'),
              danger: true,
              visible: record.status === OAuth2ScopeApplyStatusEnum.Pending,
              disabled: !hasPermission('oauth2_scope_audit_reject'),
              onClick: (r) => setRejecting(r),
            },
          ]}
        />
      ),
    },
  ];

  const request = async (params: {
    current?: number;
    pageSize?: number;
    status?: OAuth2ScopeApplyStatusEnum;
  }) => {
    const res = await apiOAuth2ScopeApplyPage({
      pageNo: params.current || 1,
      pageSize: params.pageSize || 15,
      queryFilter: { status: params.status || undefined },
    });
    return {
      data: res.data?.records ?? [],
      total: res.data?.total ?? 0,
      success: res.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout title={dict('PC.Routes.oauth2ScopeAudit')} hideScroll>
      <XProTable<OAuth2ScopeApplyInfo>
        rowKey="id"
        actionRef={actionRef}
        formRef={formRef}
        columns={columns}
        request={request}
        onReset={handleReset}
        showQueryButtons={hasPermission('oauth2_scope_audit_query')}
      />
      <XModalForm<{ reason: string }>
        title={t('rejectTitle')}
        open={!!rejecting}
        width={480}
        isKeyPressSubmit={false}
        modalProps={{
          destroyOnHidden: true,
          onCancel: () => setRejecting(null),
        }}
        onFinish={handleReject}
      >
        <ProFormTextArea
          name="reason"
          label={t('rejectReason')}
          placeholder={t('rejectReasonPlaceholder')}
          fieldProps={{ maxLength: 200, showCount: true, rows: 4 }}
          rules={[
            {
              required: true,
              whitespace: true,
              message: t('rejectReasonRequired'),
            },
          ]}
        />
      </XModalForm>
    </WorkspaceLayout>
  );
};

export default OAuth2ScopeAudit;
