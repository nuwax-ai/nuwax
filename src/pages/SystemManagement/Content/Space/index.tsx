/**
 * 空间管理页面
 *
 * 功能：
 * - 空间列表展示（ProTable）
 * - 支持名称、创建人模糊搜索
 * - 支持名称、创建时间、修改时间排序（接口排序）
 * - 操作列：查看、删除（使用 TableActions 组件）
 */
import { XProTable } from '@/components/ProComponents';
import TableActions, { ActionItem } from '@/components/TableActions';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiSystemResourceSpaceDelete,
  apiSystemResourceSpaceList,
} from '@/services/systemManage';
import { SystemSpaceInfo } from '@/types/interfaces/systemManage';
import {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { history, useLocation } from 'umi';

const Space: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();

  const handleReset = useCallback(() => {
    // 重置表单
    formRef.current?.resetFields();
    // 重置表格状态
    actionRef.current?.reset?.();
    // 设置分页参数:第1页,每页10条
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 10 });
    // 重新加载
    actionRef.current?.reload();
  }, []);

  useEffect(() => {
    // 当通过菜单切换页面时（history.location.state 变化），触发刷新
    const state = location.state as any;
    if (state?._t) {
      handleReset();
    }
  }, [location.state, handleReset]);

  /**
   * 查看空间详情
   */
  const handleView = useCallback((record: SystemSpaceInfo) => {
    history.push(`/space/${record.id}/team`);
  }, []);

  /**
   * 删除空间
   */
  const handleDelete = useCallback(async (record: SystemSpaceInfo) => {
    const response = await apiSystemResourceSpaceDelete({ id: record.id });
    if (response.code === SUCCESS_CODE) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error('删除失败');
    }
  }, []);

  /**
   * 操作列配置
   */
  const getActions = useCallback(
    (record: SystemSpaceInfo): ActionItem<SystemSpaceInfo>[] => [
      {
        key: 'view',
        label: '查看',
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
        onClick: handleDelete,
      },
    ],
    [handleView, handleDelete],
  );

  /**
   * 表格列定义
   */
  const columns: ProColumns<SystemSpaceInfo>[] = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      fieldProps: {
        placeholder: '请输入名称',
        allowClear: true,
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 250,
      ellipsis: true,
      hideInSearch: true, // 不参与搜索
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
        <TableActions<SystemSpaceInfo>
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
    const response = await apiSystemResourceSpaceList({
      pageNo: params.current || 1,
      pageSize: params.pageSize || 10,
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
    <WorkspaceLayout title="空间管理" hideScroll>
      <XProTable<SystemSpaceInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        request={request}
        onReset={handleReset}
      />
    </WorkspaceLayout>
  );
};

export default Space;
