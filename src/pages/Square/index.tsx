import squareBannerImage from '@/assets/images/square_banner_image.png';
import Loading from '@/components/Loading';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import useSpaceSquare from '@/hooks/useSpaceSquare';
import {
  apiPublishedAgentList,
  apiPublishedPluginList,
  apiPublishedTemplateList,
  apiPublishedWorkflowList,
} from '@/services/square';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import { Page } from '@/types/interfaces/request';
import {
  SquarePublishedItemInfo,
  SquarePublishedListParams,
} from '@/types/interfaces/square';
import { getURLParams } from '@/utils/common';
import { Empty, Input } from 'antd';
import { SearchProps } from 'antd/es/input';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';
import SingleAgent from './SingleAgent';
import SquareComponentInfo from './SquareComponentInfo';
import TemplateItem from './TemplateItem';

const cx = classNames.bind(styles);

/**
 * 广场
 */
const Square: React.FC = () => {
  // 配置信息
  const [configInfo, setConfigInfo] = useState<TenantConfigInfo>();
  const [loading, setLoading] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('智能体');
  const categoryNameRef = useRef<string>('');
  // 分类类型，默认智能体
  const categoryTypeRef = useRef<SquareAgentTypeEnum>(
    SquareAgentTypeEnum.Agent,
  );

  // 接口地址， 默认智能体列表
  const apiUrlRef = useRef<(data: SquarePublishedListParams) => void>(
    apiPublishedAgentList,
  );

  const {
    squareComponentList,
    setSquareComponentList,
    handleClick,
    handleToggleCollectSuccess,
  } = useSpaceSquare();

  // 广场-已发布列表接口
  const { run: runSquareList } = useRequest(apiUrlRef.current, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      setSquareComponentList(result?.records || []);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 初始化配置信息
  const initValues = () => {
    const params = getURLParams() as {
      cate_type: string;
      cate_name: string;
    };
    const { cate_type, cate_name } = params;
    // 分类类型
    categoryTypeRef.current = cate_type as SquareAgentTypeEnum;
    // 分类名称
    categoryNameRef.current = cate_name ?? cate_type;
    // 分类类型
    switch (cate_type) {
      case SquareAgentTypeEnum.Agent:
        setTitle('智能体');
        apiUrlRef.current = apiPublishedAgentList;
        break;
      case SquareAgentTypeEnum.Plugin:
        setTitle('插件');
        apiUrlRef.current = apiPublishedPluginList;
        break;
      case SquareAgentTypeEnum.Workflow:
        setTitle('工作流');
        apiUrlRef.current = apiPublishedWorkflowList;
        break;
      case SquareAgentTypeEnum.Template:
        setTitle('模板');
        apiUrlRef.current = apiPublishedTemplateList;
        break;
    }
  };

  // 查询列表
  const handleQuery = (page: number = 1, keyword: string = '') => {
    setLoading(true);
    const data = {
      page,
      pageSize: 100,
      // 分类名称
      category: categoryNameRef.current,
      kw: keyword,
    };

    runSquareList(data);
  };

  useEffect(() => {
    // 配置信息
    const info = localStorage.getItem(TENANT_CONFIG_INFO);
    if (info) {
      setConfigInfo(JSON.parse(info));
    }
    initValues();
    setSquareComponentList([]);
    // 查询列表
    handleQuery();

    const unlisten = history.listen(({ location }: { location: Location }) => {
      if (location.pathname === '/square') {
        initValues();
        setSquareComponentList([]);
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

  // 搜索
  const onSearch: SearchProps['onSearch'] = (value) => {
    handleQuery(1, value);
  };

  return (
    <div
      className={cx(
        styles.container,
        'h-full',
        'flex',
        'flex-col',
        'overflow-y',
      )}
    >
      <header className={cx(styles.header, 'relative')} onClick={handleLink}>
        <img
          className={cx('absolute', styles['banner-image'])}
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
      <div
        className={cx(
          'flex',
          'items-center',
          'content-between',
          styles['title-box'],
        )}
      >
        <h6 className={cx(styles['theme-title'])}>{title}</h6>
        <Input.Search
          placeholder="搜索"
          allowClear
          onSearch={onSearch}
          style={{ width: 200 }}
        />
      </div>
      {loading ? (
        <Loading />
      ) : squareComponentList?.length > 0 ? (
        <div className={cx(styles['list-section'])}>
          {squareComponentList.map((item, index) => {
            if (categoryTypeRef.current === SquareAgentTypeEnum.Agent) {
              return (
                <SingleAgent
                  key={index}
                  publishedItemInfo={item}
                  onToggleCollectSuccess={handleToggleCollectSuccess}
                  onClick={() => handleClick(item.targetId, item.targetType)}
                />
              );
            } else if (
              categoryTypeRef.current === SquareAgentTypeEnum.Template
            ) {
              return (
                <TemplateItem
                  key={index}
                  publishedItemInfo={item}
                  onClick={() => handleClick(item.targetId, item.targetType)}
                />
              );
            } else {
              return (
                <SquareComponentInfo
                  key={index}
                  publishedItemInfo={item}
                  onToggleCollectSuccess={handleToggleCollectSuccess}
                  onClick={() => handleClick(item.targetId, item.targetType)}
                />
              );
            }
          })}
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
