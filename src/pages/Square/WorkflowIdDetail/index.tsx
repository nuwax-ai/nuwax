import { apiPublishedWorkflowInfo } from '@/services/plugin';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PublishWorkflowInfo } from '@/types/interfaces/plugin';
import type { TableColumnsType } from 'antd';
import { Divider, Empty, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useParams, useRequest } from 'umi';
import PluginHeader from '../PluginDetail/PluginHeader';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 工作流详情
 */
const WorkflowIdDetail: React.FC = ({}) => {
  const { workflowId } = useParams();

  // 查询插件信息
  const { run: runWorkflowInfo, data: workflowInfo } = useRequest(
    apiPublishedWorkflowInfo,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result: PublishWorkflowInfo) => {
        console.log(result);
        return result;
      },
    },
  );

  useEffect(() => {
    if (!workflowId) return;
    runWorkflowInfo(workflowId);
  }, [workflowId]);
  console.log(workflowInfo);

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      // className: 'flex items-center',
    },
    {
      title: '参数描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '参数类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
    },
    {
      title: '传入方式',
      dataIndex: 'inputType',
      key: 'inputType',
      width: 120,
    },
    {
      title: '是否必须',
      dataIndex: 'require',
      key: 'require',
      width: 100,
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
      width: 70,
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
      // className: 'flex items-center',
    },
    {
      title: '参数描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '参数类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
    },
  ];

  return (
    <div className={cx('flex', 'h-full')}>
      <div
        className={cx(styles.container, 'flex', 'flex-col', 'flex-1', 'h-full')}
      >
        {workflowInfo?.id && (
          <PluginHeader
            targetInfo={workflowInfo as PublishWorkflowInfo}
            targetType={SquareAgentTypeEnum.Workflow}
          />
        )}
        <div className={cx(styles['main-container'], 'overflow-y')}>
          <span className={cx(styles.title)}>插件描述</span>
          <p className={cx(styles.desc, 'text-ellipsis-2')}>
            {workflowInfo?.description}
          </p>
          <Divider style={{ margin: '20px 0' }} />
          <span className={cx(styles.title)}>入参配置</span>
          <Table
            className={cx(styles['table-wrap'], 'overflow-hide')}
            columns={inputColumns}
            // bordered={false}
            dataSource={workflowInfo?.inputArgs || []}
            pagination={false}
          />
          <span className={cx(styles.title)}>出参配置</span>
          {workflowInfo?.outputArgs?.length > 0 ? (
            <Table<BindConfigWithSub>
              className={cx(styles['table-wrap'], 'overflow-hide')}
              columns={outputColumns}
              dataSource={workflowInfo?.outputArgs || []}
              pagination={false}
              expandable={{
                // childrenColumnName: 'subArgs',
                // 初始时，是否展开所有行
                defaultExpandAllRows: true,
                // expandedRowKeys: outputExpandedRowKeys,
                // expandIcon: () => null,
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
    </div>
  );
};

export default WorkflowIdDetail;
