import squareBannerImage from '@/assets/images/square_banner_image2.png';
import ButtonToggle from '@/components/ButtonToggle';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import PageCard from '@/components/PageCard';
import { TENANT_CONFIG_INFO } from '@/constants/home.constants';
import useSpaceSquare from '@/hooks/useSpaceSquare';
import {
  apiPublishedAgentList,
  apiPublishedPluginList,
  apiPublishedSkillCollect,
  apiPublishedSkillList,
  apiPublishedSkillUnCollect,
  apiPublishedTemplateList,
  apiPublishedWorkflowList,
} from '@/services/square';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  FilterOfficialEnum,
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
import { Empty, Input, message, Select } from 'antd';
import { SearchProps } from 'antd/es/input';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useLocation, useModel, useRequest } from 'umi';
import styles from './index.less';
import SingleAgent from './SingleAgent';
import SquareComponentInfo from './SquareComponentInfo';
import TemplateItem from './TemplateItem';
const cx = classNames.bind(styles);

/**
 * 广场
 */
const Square: React.FC = () => {
  const { templateList } = useModel('squareModel');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  const templateListTabs = templateList?.map((item: any) => ({
    label: item.description,
    value: item.name,
  }));

  const location = useLocation();
  // 配置信息
  const [configInfo, setConfigInfo] = useState<TenantConfigInfo>();
  const [loading, setLoading] = useState<boolean>(false);
  // 标题
  const [title, setTitle] = useState<string>('智能体');

  // 过滤官方标识
  const [filterOfficial, setFilterOfficial] = useState<FilterOfficialEnum>(
    FilterOfficialEnum.All,
  );
  // 过滤官方标识内容
  const FILTER_OFFICIAL = [
    { value: FilterOfficialEnum.All, label: '全部' },
    { value: FilterOfficialEnum.Official, label: '仅查看官方' + title },
  ];

  // 分类名称
  const categoryNameRef = useRef<string>('');
  // 分类类型，默认智能体
  const categoryTypeRef = useRef<SquareAgentTypeEnum>(
    SquareAgentTypeEnum.Agent,
  );

  // 模板模式下，目标类型tabs激活的key
  const activeKeyRef = useRef<SquareTemplateTargetTypeEnum>();

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

  // 滚动容器与内容区域，用于自动补全加载
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const {
    squareComponentList,
    setSquareComponentList,
    handleClick,
    handleToggleCollectSuccess,
  } = useSpaceSquare();
  // 获取租户配置信息

  const handleClickSkill = (item: SquarePublishedItemInfo) => {
    const agentId = tenantConfigInfo?.defaultTaskAgentId;
    if (!agentId) {
      // 站点默认通用型智能体未配置
      message.warning('站点默认通用型智能体未配置');
      return;
    }
    history.push(
      `/agent/${agentId}?skillId=${
        item.targetId
      }&skillName=${encodeURIComponent(item.name)}`,
    );
  };

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
    categoryNameRef.current = cate_name;

    // 分类类型
    switch (cate_type) {
      case SquareAgentTypeEnum.Agent:
        setTitle('智能体');
        apiUrlRef.current = apiPublishedAgentList;
        break;
      case SquareAgentTypeEnum.PageApp:
        setTitle('网页应用');
        apiUrlRef.current = apiPublishedAgentList;
        break;
      case SquareAgentTypeEnum.Skill:
        setTitle('技能');
        apiUrlRef.current = apiPublishedSkillList;
        break;
      case SquareAgentTypeEnum.Plugin:
        setTitle('插件');
        apiUrlRef.current = apiPublishedPluginList;
        break;
      case SquareAgentTypeEnum.Workflow:
        setTitle('工作流');
        apiUrlRef.current = apiPublishedWorkflowList;
        break;
      // 模板模式下，根据分类名称设置标题
      case SquareAgentTypeEnum.Template:
        {
          switch (cate_name) {
            case SquareTemplateTargetTypeEnum.PageApp:
              setTitle('网页应用');
              break;
            case SquareTemplateTargetTypeEnum.ChatBot:
              setTitle('智能体');
              break;
            case SquareTemplateTargetTypeEnum.Workflow:
              setTitle('工作流');
              break;
            case SquareTemplateTargetTypeEnum.Skill:
              setTitle('技能');
              break;
            default:
              setTitle('模板');
              break;
          }
          apiUrlRef.current = apiPublishedTemplateList;
        }
        break;
    }
  };

  // 查询列表
  const handleQuery = (
    pageIndex: number = 1,
    kw: string = keyword,
    official: FilterOfficialEnum = filterOfficial,
  ) => {
    const data: SquarePublishedListParams & {
      category?: any;
      targetType?: any;
      targetSubType?: any;
      official?: boolean;
    } = {
      page: pageIndex,
      pageSize: 48,
      // 分类名称
      category: categoryNameRef.current,
      kw,
    };

    // 智能体
    if (categoryTypeRef.current === SquareAgentTypeEnum.Agent) {
      data.targetType = AgentComponentTypeEnum.Agent;
    }

    // 网页应用
    if (categoryTypeRef.current === SquareAgentTypeEnum.PageApp) {
      data.targetType = AgentComponentTypeEnum.Agent;
      data.targetSubType = AgentComponentTypeEnum.PageApp;
    }

    /**
     * 模板模式下，需要设置目标类型和目标子类型【特殊处理】
     */
    if (categoryTypeRef.current === SquareAgentTypeEnum.Template) {
      // 智能体和网页应用需要设置目标子类型
      data.category = activeKeyRef.current;

      // 如果是模板下的智能体或者网页应用
      if (
        categoryNameRef.current === SquareTemplateTargetTypeEnum.ChatBot ||
        categoryNameRef.current === SquareTemplateTargetTypeEnum.PageApp
      ) {
        data.targetType = AgentComponentTypeEnum.Agent;
        data.targetSubType = categoryNameRef.current;
      } else if (categoryNameRef.current) {
        // 工作流、技能
        data.targetType = categoryNameRef.current;
      }
    }

    // 设置过滤官方标识
    if (official === FilterOfficialEnum.Official) {
      data.official = true;
    }

    runSquareList(data);
  };

  // 滚动加载下一页
  const handleScroll = useCallback(() => {
    // 下一页页码
    const nextPage = page + 1;
    // 滚动时，不改变关键词
    handleQuery(nextPage);
  }, [page, handleQuery]);

  // 初始化加载
  const effectLoadFn = () => {
    setKeyword('');
    setSquareComponentList([]);
    activeKeyRef.current = undefined;
    setLoading(true);
    // 查询列表
    handleQuery(1, '', FilterOfficialEnum.All);
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
    // 设置默认过滤官方标识
    setFilterOfficial(FilterOfficialEnum.All);
    initValues(params);
    effectLoadFn();
  }, [location]);

  /**
   * 检查列表内容是否填满容器，如果未填满且还有更多数据，则自动加载下一页
   */
  const checkAndAutoFill = useCallback(() => {
    if (
      !containerRef.current ||
      !contentRef.current ||
      loading ||
      !hasMore ||
      !squareComponentList ||
      squareComponentList.length === 0
    ) {
      return;
    }

    const containerHeight = containerRef.current.clientHeight;
    const contentHeight = contentRef.current.scrollHeight;

    // 如果内容没填满容器，继续加载
    if (contentHeight <= containerHeight) {
      handleScroll();
    }
  }, [loading, hasMore, squareComponentList, handleScroll]);

  // 数据更新后检查是否需要自动补充加载
  useEffect(() => {
    const timer = window.setTimeout(checkAndAutoFill, 100);
    return () => window.clearTimeout(timer);
  }, [squareComponentList, checkAndAutoFill]);

  // 窗口大小变化时重新检查
  useEffect(() => {
    const handleResize = () => {
      checkAndAutoFill();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [checkAndAutoFill]);

  // 点击打开页面
  const handleLink = () => {
    if (configInfo?.squareBannerLinkUrl) {
      window.open(configInfo.squareBannerLinkUrl, '_blank');
    }
  };

  // 搜索
  const onSearch: SearchProps['onSearch'] = (value) => {
    setLoading(true);
    setSquareComponentList([]);
    setPage(1);
    setHasMore(false);
    handleQuery(1, value);
  };

  // 切换标签页 targetType: 组件类型，agent: 智能体，plugin: 插件，workflow: 工作流，template: 模板
  const handleTabClick = (targetType: React.Key) => {
    setLoading(true);
    setSquareComponentList([]);
    setPage(1);
    setHasMore(false);
    const _activeKey = targetType as SquareTemplateTargetTypeEnum;
    activeKeyRef.current = _activeKey;
    handleQuery(1, keyword);
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
          {categoryTypeRef.current === SquareAgentTypeEnum.Template &&
            categoryNameRef.current && (
              <Select
                options={templateListTabs}
                value={activeKeyRef.current}
                style={{ width: 160, marginLeft: 10 }}
                placeholder="请选择分类"
                allowClear
                onChange={(value) => handleTabClick(value as React.Key)}
              />
            )}
          <ButtonToggle
            style={{ marginLeft: 10 }}
            options={FILTER_OFFICIAL}
            value={filterOfficial}
            onChange={(value) => {
              const val = value as FilterOfficialEnum;
              setFilterOfficial(val);
              setLoading(true);
              setSquareComponentList([]);
              setPage(1);
              setHasMore(false);
              handleQuery(1, keyword, val);
            }}
          />
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

      <div
        id="scrollableDiv"
        ref={containerRef}
        className="scroll-container-hide"
      >
        <InfiniteScrollDiv
          scrollableTarget="scrollableDiv"
          list={squareComponentList}
          hasMore={hasMore}
          showLoader={!loading}
          onScroll={handleScroll}
        >
          <div ref={contentRef}>
            {loading ? (
              <Loading className={cx(styles['min-height-300'])} />
            ) : squareComponentList?.length > 0 ? (
              <div className={cx(styles['list-section'])}>
                {squareComponentList.map((item, index) => {
                  // 智能体模式下，显示智能体、网页应用组件
                  if (
                    categoryTypeRef.current === SquareAgentTypeEnum.Agent ||
                    categoryTypeRef.current === SquareAgentTypeEnum.PageApp
                  ) {
                    return (
                      <SingleAgent
                        key={index}
                        publishedItemInfo={item}
                        onToggleCollectSuccess={handleToggleCollectSuccess}
                        onClick={() =>
                          handleClick(item.targetId, item.targetType, item)
                        }
                        onStartUse={() =>
                          handleClick(item.targetId, item.targetType, item)
                        }
                      />
                    );
                  } else if (
                    // 技能模式下，显示技能组件
                    categoryTypeRef.current === SquareAgentTypeEnum.Skill
                  ) {
                    return (
                      <SingleAgent
                        showUserCount={false}
                        showConvCount={false}
                        key={index}
                        publishedItemInfo={item}
                        onToggleCollectSuccess={handleToggleCollectSuccess}
                        collectApi={apiPublishedSkillCollect}
                        unCollectApi={apiPublishedSkillUnCollect}
                        onClick={() =>
                          handleClick(item.targetId, item.targetType, item)
                        }
                        onStartUse={() => handleClickSkill(item)}
                      />
                    );
                  }
                  // 模板模式下，根据分类名称显示不同的组件
                  else if (
                    categoryTypeRef.current === SquareAgentTypeEnum.Template
                  ) {
                    // 模板下的网页应用
                    if (
                      categoryNameRef.current ===
                      SquareTemplateTargetTypeEnum.PageApp
                    ) {
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
                      // 模板下的智能体、工作流、技能
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
                    // } else if (
                    //   categoryTypeRef.current === SquareAgentTypeEnum.Skill
                    // ) {
                    //   // 技能
                    //   return (
                    //     <PageCard
                    //       key={index}
                    //       coverImg={item.coverImg}
                    //       name={item.name}
                    //       avatar={item.publishUser?.avatar}
                    //       userName={
                    //         item.publishUser?.nickName ||
                    //         item.publishUser?.userName
                    //       }
                    //       created={item.created}
                    //       onClick={() =>
                    //         handleClick(item.targetId, item.targetType, item)
                    //       }
                    //     />
                    //   );
                  } else {
                    // 插件、工作流
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
                className={cx(
                  'flex',
                  'flex-1',
                  'items-center',
                  'content-center',
                )}
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
          </div>
        </InfiniteScrollDiv>
      </div>
    </div>
  );
};

export default Square;
