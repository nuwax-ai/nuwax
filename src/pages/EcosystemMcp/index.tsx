import EcosystemCard, { EcosystemCardProps } from '@/components/EcosystemCard';
import EcosystemDetailDrawer from '@/components/EcosystemDetailDrawer';
import InfiniteScrollDiv from '@/components/InfiniteScrollDiv';
import Loading from '@/components/Loading';
import {
  ECO_MCP_CATEGORY_OPTIONS,
  ECO_MCP_TAB_ITEMS,
  TabTypeEnum,
} from '@/constants/ecosystem.constants';
import {
  apiEcoMarketClientConfigList,
  disableClientConfig,
  getClientConfigDetail,
  updateAndEnableClientConfig,
} from '@/services/ecosystem';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  ClientConfigQueryRequest,
  ClientConfigVo,
  EcosystemDataTypeEnum,
  EcosystemDetailDrawerData,
  EcosystemSubTabTypeEnum,
  EcosystemTabTypeEnum,
  EcosystemUseStatusEnum,
} from '@/types/interfaces/ecosystem';
import { Page } from '@/types/interfaces/request';
import { Empty, Input, message, Select, Tabs } from 'antd';
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
  const [categoryCode, setCategoryCode] = useState<string>(
    ECO_MCP_CATEGORY_OPTIONS[0].value,
  );
  const [activeTab, setActiveTab] = useState<EcosystemTabTypeEnum>(
    EcosystemTabTypeEnum.ALL,
  );
  const [loading, setLoading] = useState(false);
  const [mcpList, setMcpList] = useState<ClientConfigVo[]>([]);
  // 当前页码
  const [page, setPage] = useState<number>(1);
  // 是否有更多数据
  const [hasMore, setHasMore] = useState<boolean>(true);
  // 当前选中的MCP
  const [selectedDetailInfo, setSelectedDetailInfo] =
    useState<ClientConfigVo | null>(null);
  // 详情抽屉是否可见
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);

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
  const { run: runMcpList } = useRequest(apiEcoMarketClientConfigList, {
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
  const handleMcpList = (
    current: number = 1,
    type: EcosystemTabTypeEnum = activeTab,
    keyword: string = searchKeyword,
    category: string = categoryCode,
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

    const queryFilter: ClientConfigQueryRequest = {
      dataType: EcosystemDataTypeEnum.MCP,
      subTabType,
      // 名称，模糊查询
      name: keyword,
    };

    const params = {
      // 如果分类为全部，则不传分类编码
      queryFilter:
        category === 'All'
          ? queryFilter
          : { ...queryFilter, categoryCode: category },
      current,
      pageSize: 24,
    };
    runMcpList(params);
  };

  useEffect(() => {
    setLoading(true);
    handleMcpList();
  }, []);

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    handleMcpList(1, activeTab, value);
  };

  // 滚动加载更多
  const handleScroll = () => {
    handleMcpList(page);
  };

  // 标签页切换
  const handleTabChange = (value: string) => {
    const _value = value as EcosystemTabTypeEnum;
    setActiveTab(_value);
    setLoading(true);
    handleMcpList(1, _value);
  };

  // 分类切换
  const handleChangeCategory = (value: string) => {
    setCategoryCode(value);
    setLoading(true);
    handleMcpList(1, activeTab, searchKeyword, value);
  };

  /**
   * 将后端数据转换为卡片数据
   */
  const convertToCard = (config: ClientConfigVo): EcosystemCardProps => {
    // 根据分享状态确定标签
    const isMyShare = activeTab === TabTypeEnum.SHARED;
    const isAll = activeTab === TabTypeEnum.ALL;
    return {
      icon: config.icon || '',
      title: config.name || '未命名插件',
      description: config.description || '暂无描述',
      isNewVersion: config.isNewVersion,
      author: config.author || '',
      targetType: config.targetType as AgentComponentTypeEnum,
      dataType: config.dataType,
      configParamJson: config.serverConfigParamJson,
      localConfigParamJson: config.localConfigParamJson,
      isEnabled: isAll
        ? config.useStatus === EcosystemUseStatusEnum.ENABLED
        : undefined,
      shareStatus: isMyShare ? config.shareStatus : undefined, // 仅在我的分享中使用
      publishDoc: config.publishDoc,
    };
  };

  /**
   * 处理插件卡片点击事件
   */
  const handleCardClick = async (config: ClientConfigVo) => {
    // 获取详细信息
    if (config.uid) {
      try {
        const detail = await getClientConfigDetail(config.uid);
        if (detail) {
          setSelectedDetailInfo(detail);
          setDrawerVisible(true);
        }
      } catch (error) {
        message.error('获取插件详情失败');
      }
    }
  };

  const convertToDetailDrawer = (
    config: ClientConfigVo,
  ): EcosystemDetailDrawerData => {
    return {
      icon: config.icon || '',
      title: config.name || '未命名插件',
      description: config.description || '暂无描述',
      // isNewVersion: true,
      isNewVersion: config.isNewVersion || false,
      author: config.author || '',
      ownedFlag: config.ownedFlag,
      targetType: config.targetType as AgentComponentTypeEnum,
      dataType: config.dataType as EcosystemDataTypeEnum,
      // 配置信息
      serverConfigJson: config.serverConfigJson,
      configParamJson: config.serverConfigParamJson,
      localConfigParamJson: config.localConfigParamJson,
      isEnabled: config.useStatus === EcosystemUseStatusEnum.ENABLED,
      publishDoc: config.publishDoc,
    };
  };

  /**
   * 处理详情抽屉关闭
   */
  const handleDetailClose = () => {
    setSelectedDetailInfo(null);
    setDrawerVisible(false);
  };

  /**
   * 更新配置处理函数
   */
  const handleUpdateAndEnable = async (
    values: any[],
    configJson?: string,
  ): Promise<boolean> => {
    if (!selectedDetailInfo) return false;
    let result = null;
    try {
      result = await updateAndEnableClientConfig({
        uid: selectedDetailInfo.uid as string,
        configParamJson: JSON.stringify(values),
        configJson,
      });
    } catch (error) {
      message.error('操作失败');
      return false;
    }

    if (result) {
      setDrawerVisible(false);
      message.success('启用成功');
      handleMcpList();
      return true;
    }
    return false;
  };

  /**
   * 停用插件处理函数
   */
  const handleDisable = async (): Promise<boolean> => {
    if (!selectedDetailInfo?.uid) return false;

    let result = null;

    try {
      // 如果是已发布状态，调用下线接口
      result = await disableClientConfig(selectedDetailInfo.uid);
    } catch (error) {
      message.error('停用失败');
      return false;
    }
    if (result) {
      message.success('已成功停用');
      setDrawerVisible(false);
      handleMcpList();
      return true;
    }
    return false;
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
          <Select
            options={ECO_MCP_CATEGORY_OPTIONS}
            value={categoryCode}
            onChange={(value) => handleChangeCategory(value)}
            className={cx(styles['select-category'])}
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
          <div
            className={cx('flex-1', 'overflow-y', styles['main-container'])}
            id="scrollableDiv"
          >
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
                    {...convertToCard(config)}
                    onClick={async () => await handleCardClick(config)}
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
      {/* 插件详情抽屉 */}
      <EcosystemDetailDrawer
        visible={drawerVisible}
        data={
          selectedDetailInfo
            ? convertToDetailDrawer(selectedDetailInfo)
            : undefined
        }
        onClose={handleDetailClose}
        onUpdateAndEnable={handleUpdateAndEnable}
        onDisable={handleDisable}
      />
    </>
  );
}
