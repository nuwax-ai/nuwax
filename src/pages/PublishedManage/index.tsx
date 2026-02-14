import {
  ActionItem,
  TableActions,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiPublishList } from '@/services/publishManage';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { PublishListInfo } from '@/types/interfaces/publishManage';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { message } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';
import OffshelfModal from './components/OffshelfModal';

/**
 * 已发布管理
 */
const PublishedManage: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();
  const [openOffshelfModal, setOpenOffshelfModal] = useState(false);
  const [offshelfId, setOffshelfId] = useState<number>();

  const handleReset = useCallback(() => {
    // 重置表单
    formRef.current?.resetFields();
    // 重置表格状态
    actionRef.current?.reset?.();
    // 设置分页参数:第1页,每页10条
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
    // 重新加载
    actionRef.current?.reload();
  }, []);

  // 监听 location.state 变化
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      handleReset();
    }
  }, [location.state, handleReset]);

  // 查看详情
  const handleView = useCallback((record: PublishListInfo) => {
    let url = '';

    if (record.targetType === SquareAgentTypeEnum.Agent) {
      url = `/space/${record.spaceId}/agent/${record.targetId}?publishId=${record.id}`;
    } else if (record.targetType === SquareAgentTypeEnum.Plugin) {
      if (record.pluginType === 'CODE') {
        url = `/space/${record.spaceId}/plugin/${record.targetId}/cloud-tool?applyId=${record.id}`;
      } else {
        url = `/space/${record.spaceId}/plugin/${record.targetId}?publishId=${record.id}`;
      }
    } else if (record.targetType === SquareAgentTypeEnum.Workflow) {
      url = `/space/${record.spaceId}/workflow/${record.targetId}?publishId=${record.id}`;
    } else if (record.targetType === SquareAgentTypeEnum.Skill) {
      url = `/space/${record.spaceId}/skill-details/${record.targetId}?publishId=${record.id}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // 下架
  const handleOffShelf = useCallback((id: number) => {
    setOffshelfId(id);
    setOpenOffshelfModal(true);
  }, []);

  // 操作列配置
  const getActions = useCallback((): ActionItem<PublishListInfo>[] => {
    return [
      {
        key: 'view',
        label: '查看',
        disabled: !hasPermission('published_manage_query_detail'),
        onClick: handleView,
      },
      {
        key: 'offShelf',
        label: '下架',
        disabled: !hasPermission('published_manage_offline'),
        onClick: (r) => handleOffShelf(r.id),
      },
    ];
  }, [hasPermission, handleView, handleOffShelf]);

  const columns: ProColumns<PublishListInfo>[] = [
    {
      title: '发布名称',
      dataIndex: 'name',
      width: 200,
      fieldProps: { placeholder: '请输入插件工作流或智能体名称' },
    },
    {
      title: '类型',
      dataIndex: 'targetType',
      width: 100,
      valueType: 'select',
      valueEnum: {
        [SquareAgentTypeEnum.Agent]: { text: '智能体' },
        // [SquareAgentTypeEnum.PageApp]: { text: '网页应用' },
        [SquareAgentTypeEnum.Plugin]: { text: '插件' },
        [SquareAgentTypeEnum.Workflow]: { text: '工作流' },
        [SquareAgentTypeEnum.Skill]: { text: '技能' },
      },
    },
    {
      title: '描述信息',
      dataIndex: 'description',
      width: 200,
      hideInSearch: true,
    },
    {
      title: '版本信息',
      dataIndex: 'remark',
      width: 200,
      hideInSearch: true,
    },
    {
      title: '发布者',
      dataIndex: ['publishUser', 'userName'],
      width: 150,
      hideInSearch: true,
    },
    {
      title: '发布时间',
      dataIndex: 'created',
      width: 180,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <TableActions<PublishListInfo> record={record} actions={getActions()} />
      ),
    },
  ];

  const request = async (params: Record<string, any>) => {
    const { current, pageSize, name, targetType } = params;
    const response = await apiPublishList({
      pageNo: current || 1,
      pageSize: pageSize || 15,
      queryFilter: {
        targetType: targetType || undefined,
        kw: (name || '').trim(),
      },
    });

    if (response.code !== SUCCESS_CODE) {
      message.error(response.message || '获取数据失败');
    }

    return {
      data: response.data.records,
      total: response.data.total,
      success: response.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout title="已发布管理" hideScroll>
      <XProTable<PublishListInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        request={request}
        onReset={handleReset}
        showQueryButtons={hasPermission('published_manage_query_list')}
      />
      <OffshelfModal
        open={openOffshelfModal}
        id={offshelfId}
        onCancel={() => setOpenOffshelfModal(false)}
        onConfirm={() => {
          setOpenOffshelfModal(false);
          actionRef.current?.reload();
        }}
      />
    </WorkspaceLayout>
  );
};

export default PublishedManage;
