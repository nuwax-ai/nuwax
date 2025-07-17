import { apiPublishedPluginInfo } from '@/services/plugin';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { BindConfigWithSub } from '@/types/interfaces/common';
import type { PublishPluginInfo } from '@/types/interfaces/plugin';
import type { TableColumnsType } from 'antd';
import { Divider, Empty, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useParams, useRequest } from 'umi';
import PluginHeader from './PluginHeader';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 测试插件头部组件
 */
const SpacePluginDetail: React.FC = ({}) => {
  const { pluginId } = useParams();

  // 查询插件信息
  const { run: runPluginInfo, data: pluginInfo } = useRequest(
    apiPublishedPluginInfo,
    {
      manual: true,
      debounceInterval: 300,
    },
  );

  useEffect(() => {
    if (!pluginId) return;
    runPluginInfo(pluginId);
  }, [pluginId]);

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

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      {pluginInfo?.id && (
        <PluginHeader
          targetInfo={pluginInfo as PublishPluginInfo}
          targetType={SquareAgentTypeEnum.Plugin}
        />
      )}
      <div className={cx(styles['main-container'], 'overflow-y')}>
        <span className={cx(styles.title)}>插件描述</span>
        <p className={cx(styles.desc, 'text-ellipsis-2')}>
          {pluginInfo?.description}
        </p>
        <Divider style={{ margin: '20px 0' }} />
        <span className={cx(styles.title)}>入参配置</span>
        <Table
          className={cx(styles['table-wrap'], 'overflow-hide')}
          columns={inputColumns}
          dataSource={pluginInfo?.inputArgs || []}
          virtual
          pagination={false}
          expandable={{
            // 初始时，是否展开所有行
            defaultExpandAllRows: true,
          }}
        />
        <span className={cx(styles.title)}>出参配置</span>
        {pluginInfo?.outputArgs?.length > 0 ? (
          <Table<BindConfigWithSub>
            className={cx(styles['table-wrap'], 'overflow-hide')}
            columns={outputColumns}
            dataSource={pluginInfo?.outputArgs || []}
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

export default SpacePluginDetail;
