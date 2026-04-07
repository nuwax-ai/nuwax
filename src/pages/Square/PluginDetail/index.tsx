import { dict } from '@/services/i18nRuntime';
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
      title: dict('PC.Pages.Square.PluginDetail.paramName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.Square.PluginDetail.paramDescription'),
      dataIndex: 'description',
      key: 'description',
      width: 260,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.Square.PluginDetail.paramType'),
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
    },
    {
      title: dict('PC.Pages.Square.PluginDetail.inputMethod'),
      dataIndex: 'inputType',
      key: 'inputType',
      width: 120,
    },
    {
      title: dict('PC.Pages.Square.PluginDetail.required'),
      dataIndex: 'require',
      key: 'require',
      width: 100,
      align: 'center',
      render: (text) =>
        text
          ? dict('PC.Pages.Square.PluginDetail.yes')
          : dict('PC.Pages.Square.PluginDetail.no'),
    },
    {
      title: dict('PC.Pages.Square.PluginDetail.defaultValue'),
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
    },
    {
      title: dict('PC.Pages.Square.PluginDetail.enabled'),
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (text) =>
        text
          ? dict('PC.Pages.Square.PluginDetail.yes')
          : dict('PC.Pages.Square.PluginDetail.no'),
    },
  ];

  // 出参配置columns
  const outputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: dict('PC.Pages.Square.PluginDetail.paramName'),
      dataIndex: 'name',
      key: 'name',
      width: 430,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.Square.PluginDetail.paramDescription'),
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.Square.PluginDetail.paramType'),
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
      <div className={cx(styles['main-container'], 'scroll-container')}>
        <span className={cx(styles.title)}>
          {dict('PC.Pages.Square.PluginDetail.pluginDescription')}
        </span>
        <p className={cx(styles.desc, 'text-ellipsis-2')}>
          {pluginInfo?.description}
        </p>
        <Divider style={{ margin: '20px 0' }} />
        <span className={cx(styles.title)}>
          {dict('PC.Pages.Square.PluginDetail.inputConfig')}
        </span>
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
        <span className={cx(styles.title)}>
          {dict('PC.Pages.Square.PluginDetail.outputConfig')}
        </span>
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
            <Empty description={dict('PC.Common.Global.emptyData')} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SpacePluginDetail;
