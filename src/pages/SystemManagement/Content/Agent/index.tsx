import { TableActions, XProTable } from '@/components/ProComponents';
import type { ActionItem } from '@/components/ProComponents/TableActions';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
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
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(response.message || '删除失败');
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
          label: '查看',
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
          label: '授权',
          disabled: !hasPermission('content_agent_access_control'),
          onClick: handleAuth,
        });
      }

      actions.push({
        key: 'delete',
        label: '删除',
        confirm: {
          title: (
            <span>
              确定要删除 <b>{record.name}</b> 吗？
            </span>
          ),
          description: '此操作无法撤销，所有相关数据将被永久删除。',
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
      title: '名称',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      fieldProps: {
        placeholder: '请输入智能体名称',
        allowClear: true,
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 250,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      width: 120,
      ellipsis: true,
      hideInSearch: false,
    },
    {
      title: '发布状态',
      dataIndex: 'publishStatus',
      align: 'center',
      width: 100,
      hideInSearch: true,
      render: (_, record: SystemAgentInfo) => {
        const statusMap: Record<PublishStatusEnum, string> = {
          [PublishStatusEnum.Developing]: '待发布',
          [PublishStatusEnum.Applying]: '待审核',
          [PublishStatusEnum.Published]: '已发布',
          [PublishStatusEnum.Rejected]: '已拒绝',
        };
        return statusMap[record.publishStatus] || '--';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created',
      align: 'center',
      width: 170,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: '管控',
      tooltip: '若开启管控，发布到系统广场的智能体需授权才能使用',
      dataIndex: 'accessControl',
      align: 'center',
      width: 100,
      fixed: 'right',
      valueEnum: {
        [AccessControlEnum.NoFilter]: { text: '关闭', status: 'Default' },
        [AccessControlEnum.Filter]: { text: '开启', status: 'Processing' },
      },
      valueType: 'select',
      render: (_, record: SystemAgentInfo) => (
        <Switch
          checked={record.accessControl === AccessControlEnum.Filter}
          loading={accessControlLoadingMap[record.id] || false}
          onChange={(checked) => handleAccessControlChange(record, checked)}
        />
      ),
    },
    {
      title: '操作',
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
    <WorkspaceLayout title="智能体管理" hideScroll>
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
