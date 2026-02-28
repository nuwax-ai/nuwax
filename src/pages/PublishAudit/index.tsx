import {
  ActionItem,
  TableActions,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiPageGetProjectInfoByAgent } from '@/services/pageDev';
import { apiPassAudit, apiPublishApplyList } from '@/services/publishManage';
import styles from '@/styles/systemManage.less';
import { PublishStatusEnum } from '@/types/enums/common';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { PublishApplyListInfo } from '@/types/interfaces/publishManage';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';
import RejectAuditModal from './components/RejectAuditModal';

const cx = classNames.bind(styles);

/**
 * 发布审核
 */
const PublishAudit: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();
  const [openRejectAuditModal, setOpenRejectAuditModal] = useState(false);
  const [rejectAuditId, setRejectAuditId] = useState<number>();

  // 标记当前请求是否是初始化或重置请求，用于在 request 中覆盖状态为默认值
  const isInitializeOrReset = useRef<boolean>(false);

  // 查看详情
  const handleView = useCallback(async (record: PublishApplyListInfo) => {
    const {
      spaceId,
      targetId,
      id: applyId,
      targetType,
      targetSubType,
      pluginType,
    } = record;

    let url = '';

    // 智能体
    if (targetType === SquareAgentTypeEnum.Agent) {
      if (targetSubType === 'PageApp') {
        const { code, data: projectInfo } = await apiPageGetProjectInfoByAgent(
          targetId,
        );
        if (code === SUCCESS_CODE && projectInfo) {
          url = `/space/${spaceId}/app-dev/${projectInfo.projectId}`;
        }
      } else {
        url = `/space/${spaceId}/agent/${targetId}?applyId=${applyId}`;
      }
    } else if (targetType === SquareAgentTypeEnum.Plugin) {
      if (pluginType === 'CODE') {
        url = `/space/${spaceId}/plugin/${targetId}/cloud-tool?applyId=${applyId}`;
      } else {
        url = `/space/${spaceId}/plugin/${targetId}?applyId=${applyId}`;
      }
    } else if (targetType === SquareAgentTypeEnum.Workflow) {
      url = `/space/${spaceId}/workflow/${targetId}?applyId=${applyId}`;
    } else if (targetType === SquareAgentTypeEnum.Skill) {
      url = `/space/${spaceId}/skill-details/${targetId}?applyId=${applyId}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // 通过审核
  const handlePassAudit = useCallback(async (record: PublishApplyListInfo) => {
    const res = await apiPassAudit({ id: record.id });
    if (res.code === SUCCESS_CODE) {
      message.success('通过审核成功');
      // 恢复到初始化状态，便于在request中覆盖状态为默认值：待审核
      isInitializeOrReset.current = true;
      actionRef.current?.reload();
    }
  }, []);

  // 拒绝审核
  const handleRejectAudit = useCallback((id: number) => {
    setRejectAuditId(id);
    setOpenRejectAuditModal(true);
  }, []);

  // 操作列配置
  const getActions = useCallback(
    (record: PublishApplyListInfo): ActionItem<PublishApplyListInfo>[] => {
      return [
        {
          key: 'pass',
          label: '通过',
          isShow: record.publishStatus === PublishStatusEnum.Applying,
          disabled: !hasPermission('publish_audit_pass'),
          onClick: handlePassAudit,
        },
        {
          key: 'reject',
          label: '拒绝',
          isShow: record.publishStatus === PublishStatusEnum.Applying,
          disabled: !hasPermission('publish_audit_reject'),
          onClick: (r) => handleRejectAudit(r.id),
        },
        {
          key: 'view',
          label: '查看',
          disabled: !hasPermission('publish_audit_query_detail'),
          onClick: handleView,
        },
      ];
    },
    [hasPermission, handlePassAudit, handleRejectAudit, handleView],
  );

  const columns: ProColumns<PublishApplyListInfo>[] = [
    {
      title: '发布名称',
      dataIndex: 'name',
      width: 200,
      fieldProps: { placeholder: '请输入插件工作流或智能体名称' },
      ellipsis: true,
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
      ellipsis: true,
    },
    {
      title: '版本信息',
      dataIndex: 'remark',
      width: 200,
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: '发布者',
      dataIndex: ['applyUser', 'userName'],
      width: 150,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'publishStatus',
      width: 100,
      valueType: 'select',
      // 默认待审核
      initialValue: PublishStatusEnum.Applying,
      valueEnum: {
        [PublishStatusEnum.Applying]: { text: '待审核' },
        [PublishStatusEnum.Published]: { text: '通过' },
        [PublishStatusEnum.Rejected]: { text: '拒绝' },
      },
      render: (_, record) => {
        const publishStatus = record.publishStatus;
        let statusText = '';
        let dotStyle = '';
        switch (publishStatus) {
          case PublishStatusEnum.Published:
            statusText = '通过';
            dotStyle = styles['dot-green'];
            break;
          case PublishStatusEnum.Rejected:
            statusText = '拒绝';
            dotStyle = styles['dot-red'];
            break;
          case PublishStatusEnum.Applying:
            statusText = '待审核';
            dotStyle = styles['dot-blue'];
            break;
          default:
            statusText = '--';
        }
        return (
          <span>
            <span className={cx(styles.dot, dotStyle)}></span>
            {statusText}
          </span>
        );
      },
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
      width: 150,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <TableActions<PublishApplyListInfo>
          record={record}
          actions={getActions(record)}
        />
      ),
    },
  ];

  // 请求处理
  const request = async (_params: Record<string, any>) => {
    let { current, pageSize, name, targetType, publishStatus } = _params;

    // 如果是由“重置”触发的请求，则强制将状态重置为“待审核”
    if (isInitializeOrReset.current) {
      isInitializeOrReset.current = false;
      publishStatus = PublishStatusEnum.Applying;
    }
    const response = await apiPublishApplyList({
      pageNo: current || 1,
      pageSize: pageSize || 15,
      queryFilter: {
        targetType: targetType || undefined,
        publishStatus: publishStatus || PublishStatusEnum.Applying,
        kw: name || '',
      },
    });

    return {
      data: response.data.records,
      total: response.data.total,
      success: response.code === SUCCESS_CODE,
    };
  };

  // 重置处理（参考 LogProTable 的 handleReset 模式）
  const handleReset = () => {
    // 标记本次为“重置”操作（用于在 request 中强制状态为待审核）
    isInitializeOrReset.current = true;
    // 交给 ProTable 自己做表单和分页的 reset，会自动触发一次 request
    // 重置到默认值，包括表单
    actionRef.current?.reset?.();
  };

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    handleReset();
  }, [location.state]);

  return (
    <WorkspaceLayout title="发布审核" hideScroll>
      <XProTable<PublishApplyListInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        request={request}
        onReset={handleReset}
        showQueryButtons={hasPermission('publish_audit_query_list')}
      />
      <RejectAuditModal
        open={openRejectAuditModal}
        id={rejectAuditId}
        onCancel={() => setOpenRejectAuditModal(false)}
        onConfirm={() => {
          setOpenRejectAuditModal(false);
          // 恢复到初始化状态，便于在request中覆盖状态为默认值：待审核
          isInitializeOrReset.current = true;
          actionRef.current?.reload();
        }}
      />
    </WorkspaceLayout>
  );
};

export default PublishAudit;
