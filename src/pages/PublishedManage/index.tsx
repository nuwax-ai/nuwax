import {
  ActionItem,
  LimitedTooltip,
  TableActions,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiPublishList } from '@/services/publishManage';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { PublishListInfo } from '@/types/interfaces/publishManage';
import { openBusinessRouteWindow } from '@/utils/hostBridge/openBusinessRouteWindow';
import { buildWorkflowRoute } from '@/utils/router';
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
 * 已发布管理目标类型对应的多语言文案。
 * 下拉筛选与表格展示共用，避免表格回显原始枚举值。
 */
const getPublishedManageTargetTypeText = (targetType?: string): string => {
  switch (targetType) {
    case SquareAgentTypeEnum.Agent:
      return dict('PC.Pages.PublishedManage.typeAgent');
    case SquareAgentTypeEnum.UserApp:
      return dict('PC.Pages.PublishedManage.typeUserApp');
    case SquareAgentTypeEnum.ThirdApp:
      return dict('PC.Pages.PublishedManage.typeThirdApp');
    case SquareAgentTypeEnum.NormalProject:
      return dict('PC.Pages.PublishedManage.typeNormalProject');
    case SquareAgentTypeEnum.Plugin:
      return dict('PC.Pages.PublishedManage.typePlugin');
    case SquareAgentTypeEnum.Workflow:
      return dict('PC.Pages.PublishedManage.typeWorkflow');
    case SquareAgentTypeEnum.Skill:
      return dict('PC.Pages.PublishedManage.typeSkill');
    default:
      return '--';
  }
};

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
      url = buildWorkflowRoute(
        record.spaceId,
        record.targetId,
        record.workflowType,
        { publishId: record.id },
      );
    } else if (record.targetType === SquareAgentTypeEnum.Skill) {
      url = `/space/${record.spaceId}/published/skill-details/${record.targetId}?publishId=${record.id}`;
    } else if (record.targetType === SquareAgentTypeEnum.UserApp) {
      url = `/space/${record.spaceId}/app-project-detail/${record.targetId}`;
    } else if (record.targetType === SquareAgentTypeEnum.ThirdApp) {
      url = `/space/${record.spaceId}/third-app-detail/${record.targetId}`;
    } else if (record.targetType === SquareAgentTypeEnum.NormalProject) {
      url = `/space/${record.spaceId}/normal-project-detail/${record.targetId}`;
    }

    if (url) {
      void openBusinessRouteWindow(url);
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
          text: getPublishedManageTargetTypeText(SquareAgentTypeEnum.Agent),
        },
        [SquareAgentTypeEnum.UserApp]: {
          text: getPublishedManageTargetTypeText(SquareAgentTypeEnum.UserApp),
        },
        [SquareAgentTypeEnum.ThirdApp]: {
          text: getPublishedManageTargetTypeText(SquareAgentTypeEnum.ThirdApp),
        },
        [SquareAgentTypeEnum.NormalProject]: {
          text: getPublishedManageTargetTypeText(
            SquareAgentTypeEnum.NormalProject,
          ),
        },
        [SquareAgentTypeEnum.Plugin]: {
          text: getPublishedManageTargetTypeText(SquareAgentTypeEnum.Plugin),
        },
        [SquareAgentTypeEnum.Workflow]: {
          text: getPublishedManageTargetTypeText(SquareAgentTypeEnum.Workflow),
        },
        [SquareAgentTypeEnum.Skill]: {
          text: getPublishedManageTargetTypeText(SquareAgentTypeEnum.Skill),
        },
      },
      render: (_, record) =>
        getPublishedManageTargetTypeText(record.targetType),
    },
    {
      title: dict('PC.Pages.PublishedManage.description'),
      dataIndex: 'description',
      width: 200,
      hideInSearch: true,
      render: (_, record) => <LimitedTooltip text={record.description} />,
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
