import EcosystemCard from '@/components/EcosystemCard';
import InfiniteScrollDiv from '@/components/InfiniteScrollDiv';
import Loading from '@/components/Loading';
import { ECO_MCP_TAB_ITEMS } from '@/constants/ecosystem.constants';
import { EcosystemTabTypeEnum } from '@/types/interfaces/ecosystem';
import { Page } from '@/types/interfaces/request';
import { Empty, Tabs } from 'antd';
import Search from 'antd/es/input/Search';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 生态市场 MCP 页面
 * 下个版本开发，当前显示占位页面
 */
export default function EcosystemMcp() {
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<EcosystemTabTypeEnum>(
    EcosystemTabTypeEnum.ALL,
  );
  const [loading, setLoading] = useState(false);
  const [mcpList, setMcpList] = useState<any[]>([]);
  // 当前页码
  const [page, setPage] = useState<number>(1);
  // 是否有更多数据
  const [hasMore, setHasMore] = useState<boolean>(true);

  // 查询列表成功后处理数据
  const handleSuccess = (result: Page<any>) => {
    const { records, pages, current } = result;
    const data = records || [];
    setMcpList((prev) => {
      return current === 1 ? data : [...prev, ...data];
    });
    // 如果当前页码大于等于总页数，则不再加载更多数据
    setHasMore(current < pages);
    // 更新页码
    setPage(current + 1);
    setLoading(false);
  };

  /**
   * 页面初始化时模拟加载数据
   * 这里用 setTimeout 模拟异步请求，实际开发中应调用后端接口
   */
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      // 使用模拟数据结构，避免类型错误
      handleSuccess({
        records: [],
        pages: 1,
        current: 1,
        total: 0,
        size: 0,
        orders: [],
        optimizeCountSql: false,
        searchCount: false,
        optimizeJoinOfCountSql: false,
        maxLimit: 0,
        countId: '',
      });
      setLoading(false);
    }, 1000);
  }, []);

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
  };

  // 查询列表
  const handleQuery = (pageIndex: number = 1) => {
    const params = {
      page: pageIndex,
      pageSize: 20,
    };
    // todo: 查询列表
    console.log(params);
  };

  // 滚动加载更多
  const handleScroll = () => {
    handleQuery(page);
  };

  return (
    <>
      <div
        className={cx(
          styles.container,
          'flex',
          'flex-col',
          'h-full',
          'overflow-hide',
        )}
      >
        <h3 className={cx(styles.title)}>MCP</h3>
        <header className={cx(styles.header)}>
          <Tabs
            activeKey={activeTab}
            onChange={(value: string) =>
              setActiveTab(value as EcosystemTabTypeEnum)
            }
            className={cx(styles.tabs)}
            items={ECO_MCP_TAB_ITEMS}
          />
          <Search
            className={cx(styles.searchInput)}
            placeholder="搜索MCP"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            onClear={() => handleSearch('')}
            allowClear
          />
        </header>
        {loading ? (
          <Loading />
        ) : mcpList.length ? (
          <div className={cx('flex-1', 'overflow-y')} id="scrollableDiv">
            <InfiniteScrollDiv
              scrollableTarget="scrollableDiv"
              list={mcpList}
              hasMore={hasMore}
              onScroll={handleScroll}
            >
              <div className={cx(styles['list-section'])}>
                {mcpList?.map((config) => (
                  <EcosystemCard
                    key={config?.uid}
                    {...config}
                    // onClick={() => handleCardClick(config)}
                  />
                ))}
              </div>
            </InfiniteScrollDiv>
          </div>
        ) : (
          <div
            className={cx('flex', 'flex-1', 'items-center', 'content-center')}
          >
            <Empty description="暂无数据" />
          </div>
        )}
      </div>
    </>
  );
}
