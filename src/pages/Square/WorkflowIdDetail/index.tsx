import ConditionRender from '@/components/ConditionRender';
import MoveCopyComponent from '@/components/MoveCopyComponent';
import { apiPublishedWorkflowInfo } from '@/services/plugin';
import { apiPublishTemplateCopy } from '@/services/publish';
import { AgentComponentTypeEnum, AllowCopyEnum } from '@/types/enums/agent';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { BindConfigWithSub } from '@/types/interfaces/common';
import type { PublishWorkflowInfo } from '@/types/interfaces/plugin';
import { PublishTemplateCopyParams } from '@/types/interfaces/publish';
import { jumpToWorkflow } from '@/utils/router';
import type { TableColumnsType } from 'antd';
import { Button, Divider, Empty, message, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import PluginHeader from '../PluginDetail/PluginHeader';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 工作流详情
 */
const WorkflowIdDetail: React.FC = ({}) => {
  const params = useParams();
  const workflowId = Number(params.workflowId);
  // 复制弹窗
  const [openMove, setOpenMove] = useState<boolean>(false);

  // 查询工作流信息
  const { run: runWorkflowInfo, data: workflowInfo } = useRequest(
    apiPublishedWorkflowInfo,
    {
      manual: true,
      debounceInterval: 300,
    },
  );

  // 智能体、工作流模板复制
  const { run: runCopyTemplate, loading: loadingCopyTemplate } = useRequest(
    apiPublishTemplateCopy,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (data: number, params: PublishTemplateCopyParams[]) => {
        message.success('模板复制成功');
        // 关闭弹窗
        setOpenMove(false);
        // 目标空间ID
        const { targetSpaceId } = params[0];
        // 跳转
        jumpToWorkflow(targetSpaceId, data);
      },
    },
  );

  useEffect(() => {
    if (workflowId) {
      runWorkflowInfo(workflowId);
    }
  }, [workflowId]);

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '参数描述',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      ellipsis: true,
    },
    {
      title: '参数类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 100,
    },
    {
      title: '传入方式',
      dataIndex: 'inputType',
      key: 'inputType',
      width: 100,
    },
    {
      title: '是否必须',
      dataIndex: 'require',
      key: 'require',
      width: 80,
      align: 'center',
      render: (text) => (text ? '是' : '否'),
    },
    {
      title: '默认值',
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
    },
    {
      title: '开启',
      dataIndex: 'enable',
      key: 'enable',
      width: 80,
      align: 'center',
      render: (text) => (text ? '是' : '否'),
    },
  ];

  // 出参配置columns
  const outputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      width: 430,
      ellipsis: true,
    },
    {
      title: '参数描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true,
    },
    {
      title: '参数类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
    },
  ];

  // 智能体、工作流模板复制
  const handlerConfirmCopyTemplate = (targetSpaceId: number) => {
    runCopyTemplate({
      targetType: AgentComponentTypeEnum.Workflow,
      targetId: workflowId,
      targetSpaceId,
    });
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      {workflowInfo?.id && (
        <PluginHeader
          targetInfo={workflowInfo as PublishWorkflowInfo}
          targetType={SquareAgentTypeEnum.Workflow}
        />
      )}
      <div className={cx(styles['main-container'], 'scroll-container')}>
        <div className={cx('flex', 'items-center', 'content-between')}>
          <span className={cx(styles.title)}>工作流描述</span>
          <ConditionRender
            condition={workflowInfo?.allowCopy === AllowCopyEnum.Yes}
          >
            <Button
              type="primary"
              className={cx(styles['copy-btn'])}
              onClick={() => setOpenMove(true)}
            >
              复制模板
            </Button>
            {/*智能体迁移弹窗*/}
            <MoveCopyComponent
              spaceId={workflowInfo?.spaceId || 0}
              loading={loadingCopyTemplate}
              type={ApplicationMoreActionEnum.Copy_To_Space}
              open={openMove}
              isTemplate={true}
              title={workflowInfo?.name}
              onCancel={() => setOpenMove(false)}
              onConfirm={handlerConfirmCopyTemplate}
            />
          </ConditionRender>
        </div>
        <p className={cx(styles.desc, 'text-ellipsis-2')}>
          {workflowInfo?.description}
        </p>
        <Divider style={{ margin: '20px 0' }} />
        <span className={cx(styles.title)}>入参配置</span>
        <Table
          className={cx(styles['table-wrap'], 'overflow-hide')}
          columns={inputColumns}
          dataSource={workflowInfo?.inputArgs || []}
          virtual
          scroll={{ x: 'max-content' }}
          pagination={false}
          expandable={{
            // 初始时，是否展开所有行
            defaultExpandAllRows: true,
          }}
        />
        <span className={cx(styles.title)}>出参配置</span>
        {workflowInfo?.outputArgs?.length > 0 ? (
          <Table<BindConfigWithSub>
            className={cx(styles['table-wrap'], 'overflow-hide')}
            columns={outputColumns}
            dataSource={workflowInfo?.outputArgs || []}
            virtual
            scroll={{ x: 'max-content' }}
            pagination={false}
            expandable={{
              // 初始时，是否展开所有行
              defaultExpandAllRows: true,
            }}
          />
        ) : (
          <div
            className={cx(
              styles['empty-container'],
              'flex',
              'flex-1',
              'items-center',
              'content-center',
            )}
          >
            <Empty description="暂无数据" />
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowIdDetail;
