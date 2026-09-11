/**
 * 通用资源聚合内容区
 * @description 专家/技能/连接器三个页面共用的内容组件：
 * 工具栏（主tab/二级tab/搜索/更多）+ 卡片网格 + 滚动加载
 */

import ConnectorConnectModal from '@/components/business-component/ConnectorConnectModal';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import useConnectorConnect from '@/hooks/useConnectorConnect';
import useSelectSkillHandoff from '@/hooks/useSelectSkillHandoff';
import useSummonExpertHandoff from '@/hooks/useSummonExpertHandoff';
import { dict } from '@/services/i18nRuntime';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation } from 'umi';
import type {
  ResourceItem,
  ResourceSourceEnum,
  ResourceTypeEnum,
} from '../../types';
import ResourceToolbar from '../ResourceToolbar';
import ResourceCard from './components/ResourceCard';
import useResourceCategories from './hooks/useResourceCategories';
import useResourceList from './hooks/useResourceList';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 滚动容器 id 自增序号（保证多实例共存时 id 唯一） */
let scrollIdSeq = 0;

export interface ResourceAggregationProps {
  /** 资源类型 */
  resourceType: ResourceTypeEnum;
}

const ResourceAggregation: React.FC<ResourceAggregationProps> = ({
  resourceType,
}) => {
  const location = useLocation();

  // 初始状态优先从 URL 恢复（刷新/分享可还原筛选状态）
  const initialParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const source = searchParams.get('source');
    return {
      source: source === 'team' ? ('team' as const) : ('system' as const),
      category: searchParams.get('category') || '',
      keyword: searchParams.get('kw') || '',
    };
    // 仅挂载时读取一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 主 tab：系统广场/团队空间
  const [source, setSource] = useState<ResourceSourceEnum>(
    initialParams.source,
  );
  // 二级分类 key（空串=全部）
  const [category, setCategory] = useState<string>(initialParams.category);
  // 搜索关键字（输入值 + 防抖值）
  const [keywordInput, setKeywordInput] = useState<string>(
    initialParams.keyword,
  );
  const [keyword, setKeyword] = useState<string>(initialParams.keyword);

  // 分类字典
  const categories = useResourceCategories(resourceType, source);

  /**
   * 团队空间维度：二级 tab 为空间列表（无「全部」，选中空间即数据维度，
   * category 存空间 id 字符串，专家/技能/连接器三个页面同口径）；
   * 系统广场维度保持「全部」+ 分类
   */
  const isSpaceScopedTeam = source === 'team';
  const displayCategories = isSpaceScopedTeam
    ? categories.filter((item) => item.key !== '')
    : categories;

  /** 列表请求用的空间 ID：团队维度 = 当前选中空间 */
  const listSpaceId = useMemo(() => {
    if (source !== 'team') return undefined;
    const id = Number(category);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }, [source, category]);

  // 团队维度：空间列表到达后默认选中第一个空间
  // （URL 恢复的分类 key 不在空间列表中时同样回落，避免列表空转）
  useEffect(() => {
    if (!isSpaceScopedTeam || displayCategories.length === 0) return;
    if (!displayCategories.some((item) => item.key === category)) {
      setCategory(displayCategories[0].key);
    }
  }, [isSpaceScopedTeam, displayCategories, category]);

  // 归一化列表数据（团队维度 tab 即空间选择，分类过滤不适用，按 spaceId 请求）
  const { list, loading, hasMore, loadMore, updateItem } = useResourceList({
    resourceType,
    source,
    category: isSpaceScopedTeam ? '' : category,
    keyword,
    spaceId: listSpaceId,
    pageSize: 20,
  });

  // 搜索防抖 400ms
  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(keywordInput), 400);
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  /** 专家卡片「召唤」：携带专家信息透传并跳转 /home 首页 */
  const { summon } = useSummonExpertHandoff();
  const handleSummon = useCallback(
    (item: ResourceItem) => {
      if (!item.agentId) {
        // 数据异常兜底：缺智能体 ID 无法召唤（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] summon skipped: missing agentId, item =',
          item.id,
        );
        return;
      }
      summon({ agentId: item.agentId, name: item.name, icon: item.icon });
    },
    [summon],
  );

  /** 技能卡片「选择」：携带技能信息透传并跳转 /home 首页 */
  const { select } = useSelectSkillHandoff();
  const handleSelectSkill = useCallback(
    (item: ResourceItem) => {
      if (!item.skillId) {
        // 数据异常兜底：缺技能 ID 无法透传（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] select skill skipped: missing skillId, item =',
          item.id,
        );
        return;
      }
      select({ skillId: item.skillId, name: item.name, icon: item.icon });
    },
    [select],
  );

  /**
   * 连接器卡片「连接/断开」：共享 hook（与能力弹窗同源）——
   * 连接按认证方式分流（oauth2 → 授权弹窗；api_key/bearer/custom → 凭据弹窗），
   * 断开经连接列表按 service 寻址；成功后就地更新卡片连接状态
   */
  const {
    handleConnect,
    connectingIds,
    handleDisconnect,
    disconnectingIds,
    connectCtx,
    closeConnectModal,
    handleConnected,
  } = useConnectorConnect({
    source,
    spaceId: listSpaceId,
    updateItem,
  });

  // 筛选状态同步 URL（replace 不产生历史记录）
  useEffect(() => {
    const searchParams = new URLSearchParams();
    if (source !== 'system') {
      searchParams.set('source', source);
    }
    if (category) {
      searchParams.set('category', category);
    }
    if (keyword) {
      searchParams.set('kw', keyword);
    }
    const search = searchParams.toString();
    if (`?${search}` !== location.search) {
      history.replace({
        pathname: location.pathname,
        search: search ? `?${search}` : '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, category, keyword]);

  // 滚动容器与内容区域，用于不满屏自动补拉
  const scrollIdRef = useRef<string>(`esc-scroll-container-${++scrollIdSeq}`);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  /**
   * 检查列表内容是否填满容器，如果未填满且还有更多数据，则自动加载下一页
   */
  const checkAndAutoFill = useCallback(() => {
    if (
      !containerRef.current ||
      !contentRef.current ||
      loading ||
      !hasMore ||
      list.length === 0
    ) {
      return;
    }
    if (contentRef.current.scrollHeight <= containerRef.current.clientHeight) {
      loadMore();
    }
  }, [loading, hasMore, list, loadMore]);

  // 数据更新后检查是否需要自动补充加载
  useEffect(() => {
    const timer = window.setTimeout(checkAndAutoFill, 100);
    return () => window.clearTimeout(timer);
  }, [list, checkAndAutoFill]);

  // 窗口大小变化时重新检查
  useEffect(() => {
    const handleResize = () => checkAndAutoFill();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkAndAutoFill]);

  // 团队空间维度等待空间 ID 加载（选中空间默认值尚未确定）
  const waitingSpace = source === 'team' && !listSpaceId;
  // 首屏加载（非滚动加载更多）才显示整屏 Loading
  const initialLoading = (loading || waitingSpace) && list.length === 0;

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'flex-1')}>
      <ResourceToolbar
        resourceType={resourceType}
        source={source}
        onSourceChange={(next) => {
          setSource(next);
          // 系统广场（分类 key）与团队空间（空间 id）两套 key 命名空间不同，
          // 切换维度后清空选中；专家/技能·团队维度会由上方 effect 重新默认选第一个空间
          setCategory('');
        }}
        categories={displayCategories}
        activeCategory={category}
        onCategoryChange={setCategory}
        keyword={keywordInput}
        onKeywordChange={setKeywordInput}
        // 连接器页不展示"更多"入口（产品要求），专家/技能页保留
        showMore={resourceType !== 'connector'}
      />

      {initialLoading ? (
        <Loading />
      ) : list.length > 0 ? (
        <div
          className={cx('flex-1', 'scroll-container-hide')}
          id={scrollIdRef.current}
          ref={containerRef}
        >
          <InfiniteScrollDiv
            scrollableTarget={scrollIdRef.current}
            list={list}
            hasMore={hasMore}
            onScroll={loadMore}
          >
            <div className={cx(styles['list-section'])} ref={contentRef}>
              {list.map((item) => (
                <ResourceCard
                  key={item.id}
                  item={item}
                  showSummon={resourceType === 'expert'}
                  onSummon={
                    resourceType === 'expert' ? handleSummon : undefined
                  }
                  onSelect={
                    resourceType === 'skill' ? handleSelectSkill : undefined
                  }
                  // 连接器卡片「断开」：仅已连接状态生效，未连接的「连接」按钮保持占位
                  onDisconnect={
                    resourceType === 'connector' ? handleDisconnect : undefined
                  }
                  disconnecting={
                    resourceType === 'connector' &&
                    disconnectingIds.includes(item.id)
                  }
                  // 连接器卡片「连接」：仅未连接状态生效（oauth2 授权弹窗 / 凭据抽屉）
                  onConnect={
                    resourceType === 'connector' ? handleConnect : undefined
                  }
                  connecting={
                    resourceType === 'connector' &&
                    connectingIds.includes(item.id)
                  }
                  showUse={resourceType === 'skill'}
                  // 底部统计行仅专家卡片展示（技能本就无统计；
                  // 连接器工具数统计已下线）
                  showStats={resourceType === 'expert'}
                  // 连接器卡片：标题下方展示分类 + 连接状态，hover 右上角连接/断开按钮
                  showConnect={resourceType === 'connector'}
                />
              ))}
            </div>
          </InfiniteScrollDiv>
        </div>
      ) : (
        <div className={cx('flex', 'flex-1', 'items-center', 'content-center')}>
          <Empty description={dict('PC.Common.Global.emptyData')} />
        </div>
      )}

      {/* 连接器「连接」凭据弹窗（认证方式 api_key/bearer/custom；oauth2 走授权弹窗）：
          表单与提交链路同空间侧/管理侧凭据抽屉口径（原抽屉不变，本页按需求用弹窗），
          提交 POST /api/connector/connections/api-key，成功后就地更新卡片为已连接 */}
      {resourceType === 'connector' && (
        <ConnectorConnectModal
          open={connectCtx !== null}
          record={connectCtx?.record ?? null}
          fields={connectCtx?.fields ?? []}
          spaceId={source === 'team' ? listSpaceId : undefined}
          onClose={closeConnectModal}
          onConnected={handleConnected}
        />
      )}
    </div>
  );
};

export default ResourceAggregation;
