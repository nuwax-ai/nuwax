/**
 * 插件管理页面
 */
import { TableActions, XProTable } from '@/components/ProComponents';
import type { ActionItem } from '@/components/ProComponents/TableActions';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiSystemResourcePluginDelete,
  apiSystemResourcePluginList,
} from '@/services/systemManage';
import { SystemPluginInfo } from '@/types/interfaces/systemManage';
import {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useModel } from 'umi';

const Plugin: React.FC = () => {
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
   * 查看插件详情
   */
  const handleView = useCallback((record: SystemPluginInfo) => {
    window.open(`/space/${record.spaceId}/plugin/${record.id}/cloud-tool`);
  }, []);

  /**
   * 删除插件
   */
  const handleDelete = useCallback(async (record: SystemPluginInfo) => {
    const response = await apiSystemResourcePluginDelete({ id: record.id });
    if (response.code === SUCCESS_CODE) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(response.message || '删除失败');
    }
  }, []);

  /**
   * 操作列配置
   */
  const getActions = useCallback(
    (record: SystemPluginInfo): ActionItem<SystemPluginInfo>[] => [
      {
        key: 'view',
        label: '查看',
        disabled: !hasPermission('content_plugin_query_detail'),
        onClick: handleView,
      },
      {
        key: 'delete',
        label: '删除',
        type: 'danger',
        confirm: {
          title: (
            <span>
              确定要删除 <b>{record.name}</b> 吗？
            </span>
          ),
          description: '此操作无法撤销，所有相关数据将被永久删除。',
        },
        disabled: !hasPermission('content_plugin_delete'),
        onClick: handleDelete,
      },
    ],
    [hasPermission, handleView, handleDelete],
  );

  /**
   * 表格列定义
   */
  const columns: ProColumns<SystemPluginInfo>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      fieldProps: {
        placeholder: '请输入插件名称',
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
      title: '创建时间',
      dataIndex: 'created',
      align: 'center',
      width: 170,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      fixed: 'right',
      align: 'center',
      width: 180,
      render: (_, record) => (
        <TableActions<SystemPluginInfo>
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
    const response = await apiSystemResourcePluginList({
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
    <WorkspaceLayout title="插件管理" hideScroll>
      <XProTable<SystemPluginInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        request={request}
        onReset={handleReset}
        showQueryButtons={hasPermission('content_plugin_query_list')}
      />
    </WorkspaceLayout>
  );
};

export default Plugin;
