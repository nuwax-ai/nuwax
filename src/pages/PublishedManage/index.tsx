import {
  ActionItem,
  TableActions,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
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
        label: dict('PC.Pages.PublishedManage.view'),
        disabled: !hasPermission('published_manage_query_detail'),
        onClick: handleView,
      },
      {
        key: 'offShelf',
        label: dict('PC.Pages.PublishedManage.offShelf'),
        disabled: !hasPermission('published_manage_offline'),
        onClick: (r) => handleOffShelf(r.id),
      },
    ];
  }, [hasPermission, handleView, handleOffShelf]);

  const columns: ProColumns<PublishListInfo>[] = [
    {
      title: dict('PC.Pages.PublishedManage.publishName'),
      dataIndex: 'name',
      width: 200,
      fieldProps: {
        placeholder: dict('PC.Pages.PublishedManage.searchNamePlaceholder'),
      },
    },
    {
      title: dict('PC.Pages.PublishedManage.type'),
      dataIndex: 'targetType',
      width: 100,
      valueType: 'select',
      valueEnum: {
        [SquareAgentTypeEnum.Agent]: {
          text: dict('PC.Pages.PublishedManage.typeAgent'),
        },
        // [SquareAgentTypeEnum.PageApp]: { text: '网页应用' },
        [SquareAgentTypeEnum.Plugin]: {
          text: dict('PC.Pages.PublishedManage.typePlugin'),
        },
        [SquareAgentTypeEnum.Workflow]: {
          text: dict('PC.Pages.PublishedManage.typeWorkflow'),
        },
        [SquareAgentTypeEnum.Skill]: {
          text: dict('PC.Pages.PublishedManage.typeSkill'),
        },
      },
    },
    {
      title: dict('PC.Pages.PublishedManage.description'),
      dataIndex: 'description',
      width: 200,
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.PublishedManage.versionInfo'),
      dataIndex: 'remark',
      width: 200,
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.PublishedManage.publisher'),
      dataIndex: ['publishUser', 'userName'],
      width: 150,
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.PublishedManage.publishTime'),
      dataIndex: 'created',
      width: 180,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: dict('PC.Pages.PublishedManage.actions'),
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
      message.error(
        response.message || dict('PC.Pages.PublishedManage.fetchDataFailed'),
      );
    }

    return {
      data: response.data.records,
      total: response.data.total,
      success: response.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.PublishedManage.pageTitle')}
      hideScroll
    >
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
