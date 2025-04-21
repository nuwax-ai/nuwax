import squareBannerImage from '@/assets/images/square_banner_image.png';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import {
  apiPublishedAgentList,
  apiPublishedPluginList,
} from '@/services/square';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import type { Page } from '@/types/interfaces/request';
import type { PublishedAgentInfo } from '@/types/interfaces/square';
import { getURLParams } from '@/utils/common';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';
import SingleAgent from './SingleAgent';

const cx = classNames.bind(styles);

/**
 * 广场
 */
const Square: React.FC = () => {
  // 配置信息
  const [configInfo, setConfigInfo] = useState<TenantConfigInfo>();
  // 智能体列表
  const [agentList, setAgentList] = useState<PublishedAgentInfo[]>([]);
  const [title, setTitle] = useState<string>('智能体');

  // 广场-已发布智能体列表接口
  const { run: runAgent } = useRequest(apiPublishedAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<PublishedAgentInfo>) => {
      setAgentList(result?.records || []);
    },
  });

  // 已发布插件列表接口（广场以及弹框选择中全部插件）
  const { run: runPlugin } = useRequest(apiPublishedPluginList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<PublishedAgentInfo>) => {
      setAgentList(result?.records || []);
    },
  });

  const handleQuery = () => {
    const params = getURLParams() as {
      cate_type: string;
      cate_name: string;
    };
    const { cate_type, cate_name } = params;
    if (cate_type === SquareAgentTypeEnum.Agent) {
      setTitle('智能体');
      runAgent({
        page: 1,
        pageSize: 100,
        // 分类名称
        category: cate_name ?? cate_type,
      });
    } else {
      setTitle('插件');
      runPlugin({
        page: 1,
        pageSize: 100,
        // 分类名称
        category: cate_name ?? cate_type,
      });
    }
  };

  useEffect(() => {
    // 配置信息
    const info = localStorage.getItem(TENANT_CONFIG_INFO);
    setConfigInfo(JSON.parse(info));
    handleQuery();

    const unlisten = history.listen(({ location }) => {
      if (location.pathname === '/square') {
        handleQuery();
      }
    });

    return () => {
      unlisten();
    };
  }, []);

  // 点击打开页面
  const handleLink = () => {
    if (configInfo?.squareBannerLinkUrl) {
      window.open(configInfo.squareBannerLinkUrl, '_blank');
    }
  };

  const handleToggleCollectSuccess = (id: number, isCollect: boolean) => {
    const _agentList = agentList.map((item) => {
      if (item.targetId === id) {
        item.collect = isCollect;
        if (!item.statistics?.collectCount) {
          item.statistics.collectCount = 0;
        }
        item.statistics.collectCount = isCollect
          ? item.statistics.collectCount + 1
          : item.statistics.collectCount - 1;
      }
      return item;
    });
    setAgentList(_agentList);
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <header className={cx(styles.header, 'relative')} onClick={handleLink}>
        <img
          className={'absolute'}
          src={configInfo?.squareBanner || (squareBannerImage as string)}
          alt=""
        />
        <div className={cx(styles['cover-box'], 'h-full', 'relative')}>
          <h3>{configInfo?.squareBannerText || '人人都是智能设计师'}</h3>
          <p className={cx('text-ellipsis-2')}>
            {configInfo?.squareBannerSubText ||
              '新一代AI应用设计、开发、实践平台 \n 无需代码，轻松创建，适合各类人群，支持多种端发布及API'}
          </p>
        </div>
      </header>
      <h6 className={cx(styles['theme-title'])}>{title}</h6>
      {agentList?.length > 0 ? (
        <div className={cx(styles['list-section'])}>
          {agentList.map((item, index) => (
            <SingleAgent
              key={index}
              title={title}
              publishedAgentInfo={item}
              onToggleCollectSuccess={handleToggleCollectSuccess}
            />
          ))}
        </div>
      ) : (
        <div className={cx('flex', 'flex-1', 'items-center', 'content-center')}>
          <Empty description="暂无数据" />
        </div>
      )}
    </div>
  );
};

export default Square;
