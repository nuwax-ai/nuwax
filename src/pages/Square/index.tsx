import squareBannerImage from '@/assets/images/square_banner_image2.png';
import ButtonToggle from '@/components/ButtonToggle';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import PageCard from '@/components/PageCard';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import { getSquareTemplateSegmentedList } from '@/constants/square.constants';
import useSpaceSquare from '@/hooks/useSpaceSquare';
import {
  apiPublishedAgentList,
  apiPublishedPluginList,
  apiPublishedTemplateList,
  apiPublishedWorkflowList,
} from '@/services/square';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  SquareAgentTypeEnum,
  SquareTemplateTargetTypeEnum,
} from '@/types/enums/square';
import type { TenantConfigInfo } from '@/types/interfaces/login';
import { Page } from '@/types/interfaces/request';
import {
  SquarePublishedItemInfo,
  SquarePublishedListParams,
  SquareSearchParams,
} from '@/types/interfaces/square';
import { Empty, Input } from 'antd';
import { SearchProps } from 'antd/es/input';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useModel, useRequest } from 'umi';
import styles from './index.less';
import SingleAgent from './SingleAgent';
import SquareComponentInfo from './SquareComponentInfo';
import TemplateItem from './TemplateItem';
const cx = classNames.bind(styles);

/**
 * 广场
 */
const Square: React.FC = () => {
  const location = useLocation();
  // 配置信息
  const [configInfo, setConfigInfo] = useState<TenantConfigInfo>();
  const [loading, setLoading] = useState<boolean>(false);
  // 标题
  const [title, setTitle] = useState<string>('智能体');
  // 分类名称
  const categoryNameRef = useRef<string>('');
  // 分类类型，默认智能体
  const categoryTypeRef = useRef<SquareAgentTypeEnum>(
    SquareAgentTypeEnum.Agent,
  );
  // 模板模式下，目标类型tabs激活的key
  const [activeKey, setActiveKey] = useState<SquareTemplateTargetTypeEnum>(
    SquareTemplateTargetTypeEnum.All,
  );
  // 当前页码
  const [page, setPage] = useState<number>(1);
  // 是否有更多数据
  const [hasMore, setHasMore] = useState<boolean>(true);
  // 文档搜索关键词
  const [keyword, setKeyword] = useState<string>('');
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
  // 获取租户配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 查询列表成功后处理数据
  const handleSuccess = (result: Page<SquarePublishedItemInfo>) => {
    const { records, pages, current } = result;
    const data = records || [];
    setSquareComponentList((prev) => {
      return current === 1 ? data : [...prev, ...data];
    });
    // 如果当前页码大于等于总页数，则不再加载更多数据
    setHasMore(current < pages);
    // 更新页码
    setPage(current);
    setLoading(false);
  };

  // 广场-已发布列表接口
  const { run: runSquareList } = useRequest(apiUrlRef.current, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      handleSuccess(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 初始化配置信息
  const initValues = (params: SquareSearchParams) => {
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
  const handleQuery = (
    pageIndex: number = 1,
    kw: string = keyword,
    targetType?: AgentComponentTypeEnum,
    targetSubType?: 'ChatBot' | 'PageApp',
  ) => {
    const data: SquarePublishedListParams = {
      page: pageIndex,
      pageSize: 20,
      // 分类名称
      category: categoryNameRef.current,
      kw,
    };

    /**
     * 模板模式下，需要设置目标类型和目标子类型
     */
    if (targetType) {
      data.targetType = targetType;
    }

    if (targetSubType) {
      data.targetSubType = targetSubType;
    }

    runSquareList(data);
  };

  // 滚动加载下一页
  const handleScroll = () => {
    // 下一页页码
    const _page = page + 1;
    // 滚动时，不改变关键词
    handleQuery(_page, keyword);
  };

  // 初始化加载
  const effectLoadFn = () => {
    setKeyword('');
    setSquareComponentList([]);
    setActiveKey(SquareTemplateTargetTypeEnum.All);
    setLoading(true);
    // 查询列表
    handleQuery();
  };

  useEffect(() => {
    // 配置信息
    const info = localStorage.getItem(TENANT_CONFIG_INFO);
    if (info) {
      setConfigInfo(JSON.parse(info));
    }

    // 获取url search参数
    const searchParams = new URLSearchParams(location.search);
    const cate_type = searchParams.get('cate_type') || '';
    const cate_name = searchParams.get('cate_name') || '';

    const params: SquareSearchParams = {
      cate_type,
      cate_name,
    };
    initValues(params);
    effectLoadFn();
  }, [location]);

  // 点击打开页面
  const handleLink = () => {
    if (configInfo?.squareBannerLinkUrl) {
      window.open(configInfo.squareBannerLinkUrl, '_blank');
    }
  };

  // 处理模板下查询列表
  const handleTemplateQuery = (
    currentActiveKey: SquareTemplateTargetTypeEnum,
    value: string = '',
  ) => {
    switch (currentActiveKey) {
      case SquareTemplateTargetTypeEnum.All:
        handleQuery(1, value);
        break;
      case SquareTemplateTargetTypeEnum.Agent:
        handleQuery(1, value, AgentComponentTypeEnum.Agent, 'ChatBot');
        break;
      case SquareTemplateTargetTypeEnum.Workflow:
        handleQuery(1, value, AgentComponentTypeEnum.Workflow);
        break;
      case SquareTemplateTargetTypeEnum.Page:
        handleQuery(1, value, AgentComponentTypeEnum.Agent, 'PageApp');
        break;
      case SquareTemplateTargetTypeEnum.Skill:
        handleQuery(1, value, AgentComponentTypeEnum.Skill);
        break;
    }
  };

  // 搜索
  const onSearch: SearchProps['onSearch'] = (value) => {
    setLoading(true);
    setSquareComponentList([]);
    // 模板模式下
    if (categoryTypeRef.current === SquareAgentTypeEnum.Template) {
      // 处理模板下查询列表
      handleTemplateQuery(activeKey, value);
    } else {
      // 处理非模板下查询列表
      handleQuery(1, value);
    }
  };

  // 切换标签页 targetType: 组件类型，agent: 智能体，plugin: 插件，workflow: 工作流，template: 模板
  const handleTabClick = (targetType: React.Key) => {
    setLoading(true);
    setSquareComponentList([]);
    const _activeKey = targetType as SquareTemplateTargetTypeEnum;
    setActiveKey(_activeKey);
    // 处理模板下查询列表
    handleTemplateQuery(_activeKey, keyword);
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <header
        className={cx(styles.header)}
        onClick={handleLink}
        style={{
          backgroundImage: `url(${
            configInfo?.squareBanner || (squareBannerImage as string)
          })`,
        }}
      >
        <h3 className={cx('text-ellipsis-2')}>
          {configInfo?.squareBannerText || '人人都是智能设计师'}
        </h3>
        <p className={cx('text-ellipsis-2')}>
          {configInfo?.squareBannerSubText ||
            '新一代AI应用设计、开发、实践平台 \n 无需代码，轻松创建，适合各类人群，支持多种端发布及API'}
        </p>
      </header>
      <div
        className={cx(
          'flex',
          'items-center',
          'content-between',
          styles['title-box'],
        )}
      >
        <div className={cx('flex', 'items-center', 'gap-10')}>
          <h6 className={cx(styles['theme-title'])}>{title}</h6>
          {categoryTypeRef.current === SquareAgentTypeEnum.Template && (
            <ButtonToggle
              options={getSquareTemplateSegmentedList(
                tenantConfigInfo?.enabledSandbox,
              )}
              value={activeKey}
              onChange={(value) => handleTabClick(value as React.Key)}
            />
          )}
        </div>
        <Input.Search
          className={cx(styles['search-input'])}
          key={categoryNameRef.current}
          placeholder="搜索"
          allowClear
          value={keyword}
          onSearch={onSearch}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <div id="scrollableDiv" className="scroll-container-hide">
        <InfiniteScrollDiv
          scrollableTarget="scrollableDiv"
          list={squareComponentList}
          hasMore={hasMore}
          showLoader={!loading}
          onScroll={handleScroll}
        >
          {loading ? (
            <Loading className={cx(styles['min-height-300'])} />
          ) : squareComponentList?.length > 0 ? (
            <div className={cx(styles['list-section'])}>
              {squareComponentList.map((item, index) => {
                if (categoryTypeRef.current === SquareAgentTypeEnum.Agent) {
                  return (
                    <SingleAgent
                      key={index}
                      publishedItemInfo={item}
                      onToggleCollectSuccess={handleToggleCollectSuccess}
                      onClick={() =>
                        handleClick(item.targetId, item.targetType, item)
                      }
                    />
                  );
                } else if (
                  categoryTypeRef.current === SquareAgentTypeEnum.Template
                ) {
                  if (activeKey === SquareTemplateTargetTypeEnum.Page) {
                    return (
                      <PageCard
                        key={index}
                        coverImg={item.coverImg}
                        name={item.name}
                        avatar={item.publishUser?.avatar}
                        userName={
                          item.publishUser?.nickName ||
                          item.publishUser?.userName
                        }
                        created={item.created}
                        onClick={() =>
                          handleClick(item.targetId, item.targetType, item)
                        }
                      />
                    );
                  } else {
                    return (
                      <TemplateItem
                        key={index}
                        publishedItemInfo={item}
                        onClick={() =>
                          handleClick(item.targetId, item.targetType, item)
                        }
                      />
                    );
                  }
                } else if (
                  categoryTypeRef.current === SquareAgentTypeEnum.Skill
                ) {
                  return (
                    <PageCard
                      key={index}
                      coverImg={item.coverImg}
                      name={item.name}
                      avatar={item.publishUser?.avatar}
                      userName={
                        item.publishUser?.nickName || item.publishUser?.userName
                      }
                      created={item.created}
                      onClick={() =>
                        handleClick(item.targetId, item.targetType, item)
                      }
                    />
                  );
                } else {
                  return (
                    <SquareComponentInfo
                      key={index}
                      publishedItemInfo={item}
                      onToggleCollectSuccess={handleToggleCollectSuccess}
                      onClick={() =>
                        handleClick(item.targetId, item.targetType)
                      }
                    />
                  );
                }
              })}
            </div>
          ) : (
            <div
              className={cx('flex', 'flex-1', 'items-center', 'content-center')}
            >
              <Empty
                className={cx(
                  styles['min-height-300'],
                  'flex',
                  'flex-col',
                  'items-center',
                  'content-center',
                )}
                description="暂无数据"
              />
            </div>
          )}
        </InfiniteScrollDiv>
      </div>
    </div>
  );
};

export default Square;
