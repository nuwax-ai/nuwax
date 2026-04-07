import { TableActions, XProTable } from '@/components/ProComponents';
import type { ActionItem } from '@/components/ProComponents/TableActions';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiSystemResourceAgentDelete,
  apiSystemResourceAgentList,
} from '@/services/systemManage';
import { PublishStatusEnum } from '@/types/enums/common';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { AccessControlEnum } from '@/types/enums/systemManage';
import { SystemAgentInfo } from '@/types/interfaces/systemManage';
import {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { message, Switch } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';
import TargetAuthModal from '../components/TargetAuthModal';
import { apiSystemResourceAgentAccess } from '../content-manage';

/**
 * 智能体管理页面
 */
const Agent: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();
  // 管控状态切换 loading 状态
  const [accessControlLoadingMap, setAccessControlLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // 授权弹窗相关状态
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [currentAgentInfo, setCurrentAgentInfo] =
    useState<SystemAgentInfo | null>(null);

  const handleReset = useCallback(() => {
    // 重置表单
    formRef.current?.resetFields();
    // 重置表格状态
    actionRef.current?.reset?.();
    // 设置分页参数:第1页,每页15条
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
    // 重新加载
    actionRef.current?.reload();
  }, []);

  useEffect(() => {
    // 当通过菜单切换页面时（location.state._t 变化），触发刷新
    const state = location.state as any;
    if (state?._t) {
      handleReset();
    }
  }, [location.state, handleReset]);

  /**
   * 查看智能体详情
   */
  const handleView = useCallback((record: SystemAgentInfo) => {
    window.open(`/space/${record.spaceId}/agent/${record.id}`);
  }, []);

  /**
   * 处理授权
   */
  const handleAuth = useCallback((record: SystemAgentInfo) => {
    setCurrentAgentInfo(record);
    setAuthModalOpen(true);
  }, []);

  /**
   * 删除智能体
   */
  const handleDelete = useCallback(async (record: SystemAgentInfo) => {
    const response = await apiSystemResourceAgentDelete({ id: record.id });
    if (response.code === SUCCESS_CODE) {
      message.success(dict('PC.Pages.SystemContentAgent.deleteSuccess'));
      actionRef.current?.reload();
    } else {
      message.error(
        response.message || dict('PC.Pages.SystemContentAgent.deleteFailed'),
      );
    }
  }, []);

  /**
   * 切换管控状态
   */
  const handleAccessControlChange = useCallback(
    async (record: SystemAgentInfo, checked: boolean) => {
      const newStatus = checked ? 1 : 0;
      setAccessControlLoadingMap((prev) => ({
        ...prev,
        [record.id]: true,
      }));
      try {
        const response = await apiSystemResourceAgentAccess(
          record.id,
          newStatus,
        );
        if (response.code === SUCCESS_CODE) {
          actionRef.current?.reload();
        }
      } finally {
        setAccessControlLoadingMap((prev) => ({
          ...prev,
          [record.id]: false,
        }));
      }
    },
    [],
  );

  /**
   * 操作列配置
   */
  const getActions = useCallback(
    (record: SystemAgentInfo): ActionItem<SystemAgentInfo>[] => {
      const actions: ActionItem<SystemAgentInfo>[] = [
        {
          key: 'view',
          label: dict('PC.Pages.SystemContentAgent.view'),
          disabled: !hasPermission('content_agent_query_detail'),
          onClick: handleView,
        },
      ];

      // 当 accessControl 为 1 并且发布状态为已发布并且发布范围为系统广场时，显示授权项
      if (
        record.accessControl === AccessControlEnum.Filter &&
        record.publishStatus === PublishStatusEnum.Published &&
        record.publishScope === PluginPublishScopeEnum.Tenant
      ) {
        actions.push({
          key: 'auth',
          label: dict('PC.Pages.SystemContentAgent.authorize'),
          disabled: !hasPermission('content_agent_access_control'),
          onClick: handleAuth,
        });
      }

      actions.push({
        key: 'delete',
        label: dict('PC.Pages.SystemContentAgent.delete'),
        confirm: {
          title: dict(
            'PC.Pages.SystemContentAgent.deleteConfirmTitle',
            record.name,
          ),
          description: dict(
            'PC.Pages.SystemContentAgent.deleteConfirmDescription',
          ),
        },
        disabled: !hasPermission('content_agent_delete'),
        onClick: handleDelete,
      });

      return actions;
    },
    [hasPermission, handleView, handleAuth, handleDelete],
  );

  /**
   * 表格列定义
   */
  const columns: ProColumns<SystemAgentInfo>[] = [
    {
      title: dict('PC.Pages.SystemContentAgent.columnName'),
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      fieldProps: {
        placeholder: dict('PC.Pages.SystemContentAgent.searchName'),
        allowClear: true,
      },
    },
    {
      title: dict('PC.Pages.SystemContentAgent.columnDescription'),
      dataIndex: 'description',
      width: 250,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.SystemContentAgent.columnCreator'),
      dataIndex: 'creatorName',
      width: 120,
      ellipsis: true,
      hideInSearch: false,
    },
    {
      title: dict('PC.Pages.SystemContentAgent.columnPublishStatus'),
      dataIndex: 'publishStatus',
      align: 'center',
      width: 100,
      hideInSearch: true,
      render: (_, record: SystemAgentInfo) => {
        const statusMap: Record<PublishStatusEnum, string> = {
          [PublishStatusEnum.Developing]: dict(
            'PC.Pages.SystemContentAgent.statusDeveloping',
          ),
          [PublishStatusEnum.Applying]: dict(
            'PC.Pages.SystemContentAgent.statusApplying',
          ),
          [PublishStatusEnum.Published]: dict(
            'PC.Pages.SystemContentAgent.statusPublished',
          ),
          [PublishStatusEnum.Rejected]: dict(
            'PC.Pages.SystemContentAgent.statusRejected',
          ),
        };
        return statusMap[record.publishStatus] || '--';
      },
    },
    {
      title: dict('PC.Pages.SystemContentAgent.columnCreated'),
      dataIndex: 'created',
      align: 'center',
      width: 170,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: dict('PC.Pages.SystemContentAgent.columnAccessControl'),
      tooltip: dict('PC.Pages.SystemContentAgent.accessControlTooltip'),
      dataIndex: 'accessControl',
      align: 'center',
      width: 100,
      fixed: 'right',
      valueEnum: {
        [AccessControlEnum.NoFilter]: {
          text: dict('PC.Pages.SystemContentAgent.accessControlOff'),
          status: 'Default',
        },
        [AccessControlEnum.Filter]: {
          text: dict('PC.Pages.SystemContentAgent.accessControlOn'),
          status: 'Processing',
        },
      },
      valueType: 'select',
      render: (_, record: SystemAgentInfo) => {
        const accessControlSwitchEnabled =
          record.publishStatus === PublishStatusEnum.Published &&
          record.publishScope === PluginPublishScopeEnum.Tenant;
        return (
          <Switch
            checked={record.accessControl === AccessControlEnum.Filter}
            disabled={!accessControlSwitchEnabled}
            loading={accessControlLoadingMap[record.id] || false}
            onChange={(checked) => handleAccessControlChange(record, checked)}
          />
        );
      },
    },
    {
      title: dict('PC.Pages.SystemContentAgent.columnAction'),
      valueType: 'option',
      fixed: 'right',
      align: 'center',
      width: 160,
      render: (_, record) => (
        <TableActions<SystemAgentInfo>
          record={record}
          actions={getActions(record)}
        />
      ),
    },
  ];

  /**
   * ProTable request 函数
   */
  const request = async (params: {
    pageSize?: number;
    current?: number;
    name?: string;
    creatorName?: string;
    accessControl?: AccessControlEnum;
  }) => {
    const response = await apiSystemResourceAgentList({
      pageNo: params.current || 1,
      pageSize: params.pageSize || 15,
      name: params.name,
      creatorName: params.creatorName,
      accessControl: params.accessControl,
    });

    return {
      data: response.data.records,
      total: response.data.total,
      success: response.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SystemContentAgent.pageTitle')}
      hideScroll
    >
      <XProTable<SystemAgentInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        request={request}
        onReset={handleReset}
        showQueryButtons={hasPermission('content_agent_query_list')}
      />
      {/* 授权弹窗 */}
      <TargetAuthModal
        open={authModalOpen}
        targetId={currentAgentInfo?.agentId || 0}
        targetName={currentAgentInfo?.name}
        targetType="agent"
        onCancel={() => {
          setAuthModalOpen(false);
          setCurrentAgentInfo(null);
        }}
      />
    </WorkspaceLayout>
  );
};

export default Agent;
