import EcosystemCard from '@/components/EcosystemCard';
import InfiniteScrollDiv from '@/components/InfiniteScrollDiv';
import Loading from '@/components/Loading';
import { ECO_MCP_TAB_ITEMS } from '@/constants/ecosystem.constants';
import { getClientConfigList } from '@/services/ecosystem';
import {
  ClientConfigVo,
  EcosystemDataTypeEnum,
  EcosystemSubTabTypeEnum,
  EcosystemTabTypeEnum,
} from '@/types/interfaces/ecosystem';
import { Page } from '@/types/interfaces/request';
import { Empty, Input, Tabs } from 'antd';
import classNames from 'classnames';
import { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const { Search } = Input;

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
  const handleSuccess = (result: Page<ClientConfigVo>) => {
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

  // 客户端配置列表查询
  const { run: runMcpList } = useRequest(getClientConfigList, {
    manual: true,
    debounceInterval: 300,
    // 设置显示 loading 的延迟时间，避免闪烁
    loadingDelay: 300,
    onSuccess: (result: Page<ClientConfigVo>) => {
      handleSuccess(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 客户端配置列表查询 - 数据列表查询
  const handleMcptList = (
    current: number = 1,
    type: EcosystemTabTypeEnum = activeTab,
    keyword: string = searchKeyword,
  ) => {
    // 根据标签页类型确定查询参数
    let subTabType: number;
    switch (type) {
      case EcosystemTabTypeEnum.ALL:
        subTabType = EcosystemSubTabTypeEnum.ALL;
        break;
      case EcosystemTabTypeEnum.ENABLED:
        subTabType = EcosystemSubTabTypeEnum.ENABLED;
        break;
      default:
        subTabType = EcosystemSubTabTypeEnum.ALL;
    }
    const params = {
      queryFilter: {
        dataType: EcosystemDataTypeEnum.MCP,
        subTabType,
        keyword,
      },
      current,
      pageSize: 20,
    };
    runMcpList(params);
  };

  useEffect(() => {
    setLoading(true);
    handleMcptList();
  }, []);

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    handleMcptList(1, activeTab, value);
  };

  // 滚动加载更多
  const handleScroll = () => {
    handleMcptList(page);
  };

  // 标签页切换
  const handleTabChange = (value: string) => {
    const _value = value as EcosystemTabTypeEnum;
    setActiveTab(_value);
    handleMcptList(1, _value);
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
            className={cx(styles.tabs)}
            activeKey={activeTab}
            items={ECO_MCP_TAB_ITEMS}
            onChange={handleTabChange}
          />
          <Search
            className={cx(styles.searchInput)}
            placeholder="搜索MCP"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            // 点击搜索图标、清除图标，或按下回车键时的回调
            onSearch={handleSearch}
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
