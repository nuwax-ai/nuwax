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
import React, { useCallback, useRef, useState } from 'react';
import OffshelfModal from './components/OffshelfModal';

/**
 * 已发布管理
 */
const PublishedManage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const [openOffshelfModal, setOpenOffshelfModal] = useState(false);
  const [offshelfId, setOffshelfId] = useState<number>();

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
        onClick: handleView,
      },
      {
        key: 'offShelf',
        label: '下架',
        onClick: (r) => handleOffShelf(r.id),
      },
    ];
  }, [handleView, handleOffShelf]);

  const columns: ProColumns<PublishListInfo>[] = [
    {
      title: '发布名称',
      dataIndex: 'name',
      width: 200,
      fixed: 'left',
      fieldProps: { placeholder: '请输入插件工作流或智能体名称' },
    },
    {
      title: '类型',
      dataIndex: 'targetType',
      width: 100,
      valueType: 'select',
      valueEnum: {
        [SquareAgentTypeEnum.Agent]: { text: '智能体' },
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
      pageSize: pageSize || 10,
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
