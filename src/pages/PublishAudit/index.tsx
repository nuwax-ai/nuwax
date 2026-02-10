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
import React, { useCallback, useRef, useState } from 'react';
import RejectAuditModal from './components/RejectAuditModal';

const cx = classNames.bind(styles);

/**
 * 发布审核
 */
const PublishAudit: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const [openRejectAuditModal, setOpenRejectAuditModal] = useState(false);
  const [rejectAuditId, setRejectAuditId] = useState<number>();

  // 中间变量用于判断是否是点击重置按钮（参考 LogProTable 模式）
  const isReset = useRef(false);

  // 查看详情
  const handleView = useCallback(async (record: PublishApplyListInfo) => {
    let url = '';

    // 智能体
    if (record.targetType === SquareAgentTypeEnum.Agent) {
      if (record.targetSubType === 'PageApp') {
        const { code, data: projectInfo } = await apiPageGetProjectInfoByAgent(
          record.targetId,
        );
        if (code === SUCCESS_CODE && projectInfo) {
          url = `/space/${record.spaceId}/app-dev/${projectInfo.projectId}`;
        }
      } else {
        url = `/space/${record.spaceId}/agent/${record.targetId}?applyId=${record.id}`;
      }
    } else if (record.targetType === SquareAgentTypeEnum.Plugin) {
      if (record.pluginType === 'CODE') {
        url = `/space/${record.spaceId}/plugin/${record.targetId}/cloud-tool?applyId=${record.id}`;
      } else {
        url = `/space/${record.spaceId}/plugin/${record.targetId}?applyId=${record.id}`;
      }
    } else if (record.targetType === SquareAgentTypeEnum.Workflow) {
      url = `/space/${record.spaceId}/workflow/${record.targetId}?applyId=${record.id}`;
    } else if (record.targetType === SquareAgentTypeEnum.Skill) {
      url = `/space/${record.spaceId}/skill-details/${record.targetId}?applyId=${record.id}`;
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
      const actions: ActionItem<PublishApplyListInfo>[] = [];

      if (record.publishStatus === PublishStatusEnum.Applying) {
        actions.push({
          key: 'pass',
          label: '通过',
          onClick: handlePassAudit,
        });
        actions.push({
          key: 'reject',
          label: '拒绝',
          onClick: (r) => handleRejectAudit(r.id),
        });
      }

      actions.push({
        key: 'view',
        label: '查看',
        onClick: handleView,
      });

      return actions;
    },
    [handlePassAudit, handleRejectAudit, handleView],
  );

  const columns: ProColumns<PublishApplyListInfo>[] = [
    {
      title: '发布名称',
      dataIndex: 'name',
      width: 200,
      fixed: 'left',
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

  const request = async (_params: Record<string, any>) => {
    let params = _params;

    // 判断是否是点击重置按钮（参考 LogProTable 模式）
    if (isReset.current) {
      isReset.current = false;
      // 重置表单
      formRef.current?.resetFields();
      // 设置默认值：状态为"待审核"
      formRef.current?.setFieldsValue({
        publishStatus: PublishStatusEnum.Applying,
      });
      // 覆盖查询参数
      params = {
        current: params.current,
        pageSize: params.pageSize,
        publishStatus: PublishStatusEnum.Applying,
      };
    }

    const { current, pageSize, name, targetType, publishStatus } = params;
    const response = await apiPublishApplyList({
      pageNo: current || 1,
      pageSize: pageSize || 10,
      queryFilter: {
        targetType: targetType || undefined,
        publishStatus: publishStatus || undefined,
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
    isReset.current = true;
    // 重置表格状态
    actionRef.current?.reset?.();
    // 设置分页参数
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 10 });
    // 重新加载
    actionRef.current?.reload();
  };

  return (
    <WorkspaceLayout title="发布审核" hideScroll>
      <XProTable<PublishApplyListInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        request={request}
        onReset={handleReset}
      />
      <RejectAuditModal
        open={openRejectAuditModal}
        id={rejectAuditId}
        onCancel={() => setOpenRejectAuditModal(false)}
        onConfirm={() => {
          setOpenRejectAuditModal(false);
          actionRef.current?.reload();
        }}
      />
    </WorkspaceLayout>
  );
};

export default PublishAudit;
