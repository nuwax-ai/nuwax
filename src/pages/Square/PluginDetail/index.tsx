import { apiPublishedPluginInfo } from '@/services/plugin';
import { BindConfigWithSub } from '@/types/interfaces/agent';
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
      onSuccess: (result: PublishPluginInfo) => {
        console.log(result);
        return result;
      },
    },
  );

  useEffect(() => {
    if (!pluginId) return;
    runPluginInfo(54);
  }, [pluginId]);
  console.log(pluginInfo);

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center',
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
      className: 'flex items-center',
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
        {pluginInfo?.id && (
          <PluginHeader
            pluginInfo={pluginInfo as PublishPluginInfo}
            onSave={() => {}}
            onTryRun={() => {}}
            onPublish={() => {}}
          />
        )}
        <div className={cx(styles['main-container'], 'overflow-y')}>
          <h3>插件描述</h3>
          <p className={cx(styles.desc, 'text-ellipsis-2')}>
            {pluginInfo?.description}
          </p>
          <Divider style={{ margin: '12px 0' }} />
          <h3>入参配置</h3>
          <Table
            className={cx(styles['table-wrap'], 'overflow-hide')}
            columns={inputColumns}
            dataSource={pluginInfo?.inputArgs || []}
            pagination={false}
          />
          <h3>出参配置</h3>
          {pluginInfo?.outputArgs?.length > 0 ? (
            <Table<BindConfigWithSub>
              className={cx(styles['table-wrap'], 'overflow-hide')}
              columns={outputColumns}
              dataSource={pluginInfo?.outputArgs || []}
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

export default SpacePluginDetail;
