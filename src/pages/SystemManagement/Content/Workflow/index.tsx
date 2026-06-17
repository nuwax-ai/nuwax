/**
 * 工作流管理页面
 */
import { TableActions, XProTable } from '@/components/ProComponents';
import type { ActionItem } from '@/components/ProComponents/TableActions';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import {
  apiSystemResourceWorkflowDelete,
  apiSystemResourceWorkflowList,
} from '@/services/systemManage';
import { SystemWorkflowInfo } from '@/types/interfaces/systemManage';
import {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useModel } from 'umi';

const Workflow: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();

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
   * 查看工作流详情
   */
  const handleView = useCallback((record: SystemWorkflowInfo) => {
    window.open(`/space/${record.spaceId}/workflow/${record.id}`);
  }, []);

  /**
   * 删除工作流
   */
  const handleDelete = useCallback(async (record: SystemWorkflowInfo) => {
    const response = await apiSystemResourceWorkflowDelete({ id: record.id });
    if (response.code === SUCCESS_CODE) {
      message.success(t('PC.Pages.SystemContentWorkflow.deleteSuccess'));
      actionRef.current?.reload();
    } else {
      message.error(
        response.message || t('PC.Pages.SystemContentWorkflow.deleteFailed'),
      );
    }
  }, []);

  /**
   * 操作列配置
   */
  const getActions = useCallback(
    (record: SystemWorkflowInfo): ActionItem<SystemWorkflowInfo>[] => [
      {
        key: 'view',
        label: t('PC.Pages.SystemContentWorkflow.view'),
        disabled: !hasPermission('content_workflow_query_detail'),
        onClick: handleView,
      },
      {
        key: 'delete',
        label: t('PC.Pages.SystemContentWorkflow.delete'),
        confirm: {
          title: t(
            'PC.Pages.SystemContentWorkflow.deleteConfirmTitle',
            record.name,
          ),
          description: t(
            'PC.Pages.SystemContentWorkflow.deleteConfirmDescription',
          ),
        },
        disabled: !hasPermission('content_workflow_delete'),
        onClick: handleDelete,
      },
    ],
    [hasPermission, handleView, handleDelete],
  );

  /**
   * 表格列定义
   */
  const columns: ProColumns<SystemWorkflowInfo>[] = [
    {
      title: t('PC.Pages.SystemContentWorkflow.columnName'),
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      fieldProps: {
        placeholder: t('PC.Pages.SystemContentWorkflow.searchName'),
        allowClear: true,
      },
    },
    {
      title: t('PC.Pages.SystemContentWorkflow.columnDescription'),
      dataIndex: 'description',
      width: 250,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: t('PC.Pages.SystemContentWorkflow.columnCreator'),
      dataIndex: 'creatorName',
      width: 120,
      ellipsis: true,
      hideInSearch: false,
    },
    {
      title: t('PC.Pages.SystemContentWorkflow.columnCreated'),
      dataIndex: 'created',
      align: 'center',
      width: 170,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: t('PC.Pages.SystemContentWorkflow.columnAction'),
      valueType: 'option',
      fixed: 'right',
      align: 'center',
      width: 180,
      render: (_, record) => (
        <TableActions<SystemWorkflowInfo>
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
  }) => {
    const response = await apiSystemResourceWorkflowList({
      pageNo: params.current || 1,
      pageSize: params.pageSize || 15,
      name: params.name,
      creatorName: params.creatorName,
    });

    return {
      data: response.data.records,
      total: response.data.total,
      success: response.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={t('PC.Pages.SystemContentWorkflow.pageTitle')}
      hideScroll
    >
      <XProTable<SystemWorkflowInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        request={request}
        onReset={handleReset}
        showQueryButtons={hasPermission('content_workflow_query_list')}
      />
    </WorkspaceLayout>
  );
};

export default Workflow;
