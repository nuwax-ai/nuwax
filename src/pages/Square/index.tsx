import squareImage from '@/assets/images/square_image.png';
import {
  apiPublishedAgentList,
  apiPublishedPluginList,
} from '@/services/square';
import { SquareAgentTypeEnum } from '@/types/enums/square';
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
  const [agentList, setAgentList] = useState<PublishedAgentInfo[]>([]);
  const [title, setTitle] = useState<string>('智能体');
  // 广场-已发布智能体列表接口
  const { run: runAgent } = useRequest(apiPublishedAgentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: Page<PublishedAgentInfo>) => {
      setAgentList(result?.records || []);
    },
  });

  // 已发布插件列表接口（广场以及弹框选择中全部插件）
  const { run: runPlugin } = useRequest(apiPublishedPluginList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: Page<PublishedAgentInfo>) => {
      setAgentList(result?.records || []);
    },
  });

  const handleQuery = () => {
    const params = getURLParams();
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
    handleQuery();
    const unlisten = history.listen(() => {
      handleQuery();
    });

    return () => {
      unlisten();
    };
  }, []);

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <header className={cx(styles.header, 'relative')}>
        <img className={'absolute'} src={squareImage as string} alt="" />
        <div className={cx(styles['cover-box'], 'h-full', 'relative')}>
          <h3>人人都是智能设计师</h3>
          <p>新一代AI应用设计、开发、实践平台</p>
          <p>无需代码，轻松创建，适合各类人群，支持多种端发布及API</p>
        </div>
      </header>
      <h6 className={cx(styles['theme-title'])}>{title}</h6>
      {agentList?.length > 0 ? (
        <div className={cx(styles['list-section'])}>
          {agentList.map((item, index) => (
            <SingleAgent key={index} publishedAgentInfo={item} />
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
