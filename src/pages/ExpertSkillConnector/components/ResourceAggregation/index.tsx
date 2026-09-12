/**
 * 通用资源聚合内容区
 * @description 专家/技能/连接器三个页面共用的内容组件：
 * 工具栏（主tab/二级tab/搜索/更多）+ 卡片网格 + 滚动加载
 */

import ConditionRender from '@/components/ConditionRender';
import ConnectorConnectModal from '@/components/business-component/ConnectorConnectModal';
import ConnectorDeviceAuthModal from '@/components/business-component/ConnectorDeviceAuthModal';
import type { ExpertSummonCardInfo } from '@/components/business-component/ExpertSummonCard';
import ExpertSummonModal from '@/components/business-component/ExpertSummonModal';
import PaymentSubscriptionModal from '@/components/business-component/PaymentSubscriptionModal';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useConnectorConnect from '@/hooks/useConnectorConnect';
import useSelectSkillHandoff from '@/hooks/useSelectSkillHandoff';
import useSubscription from '@/hooks/useSubscription';
import useSummonExpertHandoff from '@/hooks/useSummonExpertHandoff';
import {
  apiCollectAgent,
  apiPublishedAgentInfo,
  apiUnCollectAgent,
} from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import {
  apiPublishedSkillEnable,
  apiPublishedSkillUnEnable,
} from '@/services/square';
import { apiConnectorConnectionToggleStatus } from '@/services/systemManage';
import { jumpTo } from '@/utils/router';
import { Empty, message } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useModel } from 'umi';
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
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 初始状态优先从 URL 恢复（刷新/分享可还原筛选状态）
  const initialParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const source = searchParams.get('source');
    return {
      source:
        source === 'team'
          ? ('team' as const)
          : source === 'connected'
          ? ('connected' as const)
          : source === 'enabled'
          ? ('enabled' as const)
          : ('system' as const),
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
   * 团队空间维度：专家/技能的二级 tab 为空间列表（无「全部」，选中空间即
   * 数据维度，category 存空间 id 字符串）；连接器团队维度保留首位「全部」
   * 页签（scope=space 聚合全部空间，选中具体空间才按该空间查询）；
   * 系统广场维度保持「全部」+ 分类
   */
  const isSpaceScopedTeam = source === 'team' && resourceType !== 'connector';
  const displayCategories = isSpaceScopedTeam
    ? categories.filter((item) => item.key !== '')
    : categories;

  /**
   * 列表请求用的空间 ID：团队维度 = 当前选中空间
   * （连接器「全部」页签 category 为空串 → undefined，走 scope 聚合）
   */
  const listSpaceId = useMemo(() => {
    if (source !== 'team') return undefined;
    const id = Number(category);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }, [source, category]);

  // 团队维度：空间列表到达后默认选中第一个空间
  // （URL 恢复的分类 key 不在空间列表中时同样回落，避免列表空转；
  // 连接器维度「全部」在首位，初始空串即命中，不会触发回落）
  useEffect(() => {
    if (source !== 'team' || displayCategories.length === 0) return;
    if (!displayCategories.some((item) => item.key === category)) {
      setCategory(displayCategories[0].key);
    }
  }, [source, displayCategories, category]);

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

  // 是否开启订阅功能（与广场同口径：租户配置 enableSubscription）
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;

  /**
   * 付费专家统一专家卡弹窗条目（未订阅的付费专家点「召唤」/「付费」角标
   * 且详情复核确认后才置值弹卡；null 即关闭）
   */
  const [expertPaymentItem, setExpertPaymentItem] =
    useState<ResourceItem | null>(null);

  /**
   * 付费专家拦截（与添加能力弹窗「聘请」同口径）：列表接口的
   * paymentRequired/subscribed 可能滞后（如已订阅免费套餐），先按详情接口
   * （/agent/:id）复核——确认「付费且未订阅」才弹统一专家卡（卡内订阅+
   * 召唤自闭环），否则回写卡片角标状态后放行 proceed；详情异常时保守
   * 按列表口径弹卡
   */
  const interceptPaidExpert = useCallback(
    (item: ResourceItem, proceed: () => void) => {
      const { agentId } = item;
      if (!agentId) {
        // 数据异常兜底：缺智能体 ID 无法复核（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] payment intercept skipped: missing agentId, item =',
          item.id,
        );
        return;
      }
      const openExpertCard = () => setExpertPaymentItem(item);
      void apiPublishedAgentInfo(agentId)
        .then((res) => {
          const detail = res?.code === SUCCESS_CODE ? res.data : undefined;
          if (!detail || (detail.paymentRequired && !detail.subscribed)) {
            openExpertCard();
          } else {
            // 回写角标状态（详情口径为权威）后放行
            updateItem(item.id, { subscribed: !!detail.subscribed });
            proceed();
          }
        })
        .catch(openExpertCard);
    },
    [updateItem],
  );

  /** 专家卡片「召唤」：携带专家信息透传并跳转 /home 首页 */
  const { summon } = useSummonExpertHandoff();
  const handleSummon = useCallback(
    (item: ResourceItem) => {
      const { agentId, name, icon } = item;
      if (!agentId) {
        // 数据异常兜底：缺智能体 ID 无法召唤（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] summon skipped: missing agentId, item =',
          item.id,
        );
        return;
      }
      // 订阅功能开启且需付费未订阅（与添加能力弹窗「聘请」同口径）：先按
      // 详情复核，确认付费未订阅则弹统一专家卡（卡内订阅后召唤自闭环），
      // 复核出已订阅则回写角标直接放行召唤
      if (isEnableSubscription && item.paymentRequired && !item.subscribed) {
        interceptPaidExpert(item, () => summon({ agentId, name, icon }));
        return;
      }
      summon({ agentId, name, icon });
    },
    [summon, isEnableSubscription, interceptPaidExpert],
  );

  /**
   * 专家卡片「付费」角标点击：已订阅保持跳转智能体详情页；付费未订阅
   * （与添加能力弹窗「聘请」同口径）先按详情复核——确认后弹统一专家卡，
   * 复核出已订阅则回写角标仍跳详情页
   */
  const handlePaymentClick = useCallback(
    (item: ResourceItem) => {
      const { agentId } = item;
      if (!agentId) {
        // 数据异常兜底：缺智能体 ID 无法跳转（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] payment click skipped: missing agentId, item =',
          item.id,
        );
        return;
      }
      const jumpDetail = () => jumpTo(`/agent/${agentId}`);
      if (item.subscribed) {
        jumpDetail();
        return;
      }
      interceptPaidExpert(item, jumpDetail);
    },
    [interceptPaidExpert],
  );

  /**
   * 统一专家卡弹窗内召唤放行：卡内完成订阅（subscribed=true）时就地更新
   * 卡片「已订阅」角标，再按「召唤」既有口径透传跳 /home 首页
   */
  const handleExpertCardSummon = useCallback(
    (_expert: ExpertSummonCardInfo, subscribed?: boolean) => {
      const item = expertPaymentItem;
      if (!item) {
        return;
      }
      setExpertPaymentItem(null);
      if (subscribed) {
        updateItem(item.id, { subscribed: true });
      }
      const { agentId, name, icon } = item;
      if (agentId) {
        summon({ agentId, name, icon });
      }
    },
    [expertPaymentItem, updateItem, summon],
  );

  /** 技能卡片「立即使用」：携带技能信息透传并跳转 /home 首页 */
  const { select } = useSelectSkillHandoff();

  // ---------------- 技能付费订阅（对齐广场技能卡片 / 会话页弹窗） ----------------
  /** 技能订阅套餐弹窗开关 */
  const [paySkillOpen, setPaySkillOpen] = useState<boolean>(false);

  // 技能订阅（套餐列表 + 我的订阅 + 下单，与广场技能卡片同源 hook）
  const {
    createSubscriptionOrder,
    querySkillSubscriptionPlans,
    loadingTargetPricing,
    targetSubscriptionPlans,
    mySubscriptionInfo,
    loadingMySubscription,
  } = useSubscription();

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
      // 订阅功能开启且需付费未订阅（与广场技能卡片同口径）：拦截选择，
      // 查询该技能订阅套餐与「我的订阅」后改弹订阅套餐弹窗
      if (isEnableSubscription && item.paymentRequired && !item.subscribed) {
        querySkillSubscriptionPlans(item.skillId);
        setPaySkillOpen(true);
        return;
      }
      select({ skillId: item.skillId, name: item.name, icon: item.icon });
    },
    [select, isEnableSubscription, querySkillSubscriptionPlans],
  );

  /**
   * 收藏/取消收藏请求中的卡片 id（请求飞行中拦截重复点击——收藏图标
   * 为无 loading 态的裸图标区，与广场卡片一致；用 ref 存储保持回调
   * 引用稳定，不触发卡片列表整体重渲染）
   */
  const collectingRef = useRef<Set<string>>(new Set());

  /**
   * 专家卡片「收藏/取消收藏」（系统广场/团队空间两维度通用，与广场智能体
   * 卡片同口径）：POST /api/user/agent/collect|unCollect/{agentId}，
   * 成功后就地更新卡片 collected 与统计行收藏数（±1），不整页重拉
   */
  const handleToggleCollect = useCallback(
    async (item: ResourceItem) => {
      if (!item.agentId) {
        // 数据异常兜底：缺智能体 ID 无法收藏（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] toggle collect skipped: missing agentId, item =',
          item.id,
        );
        return;
      }
      if (collectingRef.current.has(item.id)) return;
      collectingRef.current.add(item.id);
      try {
        const nextCollected = !item.collected;
        const res = nextCollected
          ? await apiCollectAgent(item.agentId)
          : await apiUnCollectAgent(item.agentId);
        if (res?.code === SUCCESS_CODE) {
          // 统计行收藏数同步 ±1（无统计或无收藏项时保持原样）
          const collectStatIndex = (item.stats || []).findIndex(
            (stat) => stat.type === 'star',
          );
          const nextStats =
            collectStatIndex >= 0
              ? item.stats?.map((stat, idx) =>
                  idx === collectStatIndex
                    ? {
                        ...stat,
                        value:
                          Number(stat.value || 0) + (nextCollected ? 1 : -1),
                      }
                    : stat,
                )
              : item.stats;
          updateItem(item.id, {
            collected: nextCollected,
            stats: nextStats,
          });
        } else {
          message.error(res?.message || '操作失败，请稍后重试');
        }
      } finally {
        collectingRef.current.delete(item.id);
      }
    },
    [updateItem],
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
    deviceCtx,
    closeDeviceAuthModal,
    handleDeviceConnected,
  } = useConnectorConnect({
    // "已连接的"维度无空间上下文，连接/断开按系统口径（不带 spaceId）
    source: source === 'team' ? 'team' : 'system',
    spaceId: listSpaceId,
    updateItem,
  });

  /** 启用开关切换请求中的卡片 id（Switch loading 防重复点击） */
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  /**
   * 连接器卡片「启用开关」：POST /api/connector/connections/{连接器id}/status
   * （连接器 id 为提供方主键，非连接 id）；成功后就地更新
   * connectionEnabled 驱动开关回弹，不动筛选与分页（避免整页重拉）
   */
  const handleToggleEnabled = useCallback(
    async (item: ResourceItem, enabled: boolean) => {
      if (!item.connectorId) {
        // 数据异常兜底：缺连接器 id 无法寻址（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] toggle enabled skipped: missing connectorId, item =',
          item.id,
        );
        return;
      }
      setTogglingIds((prev) => [...prev, item.id]);
      try {
        const res = await apiConnectorConnectionToggleStatus(
          item.connectorId,
          enabled,
        );
        if (res?.code === SUCCESS_CODE) {
          updateItem(item.id, { connectionEnabled: enabled });
        } else {
          message.error(res?.message || '切换启用状态失败');
        }
      } finally {
        setTogglingIds((prev) => prev.filter((id) => id !== item.id));
      }
    },
    [updateItem],
  );

  /** 技能启用开关切换请求中的卡片 id（Switch loading 防重复点击） */
  const [skillTogglingIds, setSkillTogglingIds] = useState<string[]>([]);

  /**
   * 技能卡片「启用开关」：POST /api/published/skill/enable|unEnable/{skillId}
   * （开启/关闭双接口，按技能 ID 寻址）；成功后就地更新 skillEnabled 驱动
   * 开关回弹，不动筛选与分页（与连接器启用开关同口径；「我启用的」维度
   * 关闭后卡片就地展示未启用态，刷新后自然移出该维度）。
   * 开启时若需付费未订阅（与「立即使用」同口径）：不调启用接口（开关
   * 回弹），先弹订阅套餐弹窗，订阅完成后用户再开启
   */
  const handleToggleSkillEnabled = useCallback(
    async (item: ResourceItem, enabled: boolean) => {
      if (!item.skillId) {
        // 数据异常兜底：缺技能 ID 无法寻址（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] toggle skill enabled skipped: missing skillId, item =',
          item.id,
        );
        return;
      }
      if (
        enabled &&
        isEnableSubscription &&
        item.paymentRequired &&
        !item.subscribed
      ) {
        querySkillSubscriptionPlans(item.skillId);
        setPaySkillOpen(true);
        return;
      }
      setSkillTogglingIds((prev) => [...prev, item.id]);
      try {
        const res = enabled
          ? await apiPublishedSkillEnable(item.skillId)
          : await apiPublishedSkillUnEnable(item.skillId);
        if (res?.code === SUCCESS_CODE) {
          updateItem(item.id, { skillEnabled: enabled });
        } else {
          message.error(res?.message || '切换启用状态失败');
        }
      } finally {
        setSkillTogglingIds((prev) => prev.filter((id) => id !== item.id));
      }
    },
    [updateItem, isEnableSubscription, querySkillSubscriptionPlans],
  );

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

  // 团队空间维度等待空间 ID 加载（选中空间默认值尚未确定）；
  // 连接器维度「全部」页签无 spaceId 也可请求（scope 聚合），不等待
  const waitingSpace = isSpaceScopedTeam && !listSpaceId;
  // 首屏加载（非滚动加载更多）才显示整屏 Loading
  const initialLoading = (loading || waitingSpace) && list.length === 0;

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'flex-1')}>
      <ResourceToolbar
        resourceType={resourceType}
        source={source}
        onSourceChange={(next) => {
          setSource(next);
          // 系统广场（分类 key）、团队空间（空间 id）、已连接的（分类 key）
          // 各维度 key 命名空间不同，切换后清空选中回到"全部"；
          // 专家/技能·团队维度会由上方 effect 重新默认选第一个空间
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
                  // 专家卡片：hover 浮现的收藏图标（两维度通用，位置/样式
                  // 与广场智能体卡片同款），点击收藏/取消收藏后就地更新
                  onToggleCollect={
                    resourceType === 'expert' ? handleToggleCollect : undefined
                  }
                  // 付费角标点击：先弹统一专家卡（与添加能力弹窗「聘请」
                  // 同口径，详情复核后卡内订阅+召唤自闭环；已订阅跳详情页）
                  onPaymentClick={
                    resourceType === 'expert' ? handlePaymentClick : undefined
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
                  // 「启用开关」：连接器卡片调连接启用状态接口（仅已连接
                  // 状态生效）；技能卡片调技能启用/取消启用接口
                  // （enable/{skillId}、unEnable/{skillId}）
                  onToggleEnabled={
                    resourceType === 'connector'
                      ? handleToggleEnabled
                      : resourceType === 'skill'
                      ? handleToggleSkillEnabled
                      : undefined
                  }
                  toggling={
                    resourceType === 'connector'
                      ? togglingIds.includes(item.id)
                      : resourceType === 'skill' &&
                        skillTogglingIds.includes(item.id)
                  }
                  showUse={resourceType === 'skill'}
                  // 底部统计行仅专家卡片展示（技能本就无统计；
                  // 连接器工具数统计已下线）
                  showStats={resourceType === 'expert'}
                  // 付费角标：专家卡片（右下角「付费/已订阅」Tag）与技能卡片
                  // （左上角「付费」Ribbon）均在订阅功能开启时展示
                  showPayment={
                    (resourceType === 'expert' || resourceType === 'skill') &&
                    isEnableSubscription
                  }
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

      {/* 连接器「连接」扫码弹窗（认证方式 oauth2_device，与连接器详情抽屉
          同款）：弹窗内部自动 authorize 拿二维码并轮询授权结果，授权成功
          后就地更新卡片为已连接（成功提示弹窗内完成） */}
      {resourceType === 'connector' && (
        <ConnectorDeviceAuthModal
          open={deviceCtx !== null}
          service={deviceCtx?.item.service || ''}
          spaceId={source === 'team' ? listSpaceId : undefined}
          onClose={closeDeviceAuthModal}
          onConnected={handleDeviceConnected}
        />
      )}

      {/* 技能付费订阅套餐弹窗（技能维度，与广场技能卡片同款）：未订阅的
          付费技能点「选择」时弹出，订阅下单走统一支付流程 */}
      {resourceType === 'skill' && (
        <ConditionRender condition={isEnableSubscription}>
          <PaymentSubscriptionModal
            open={paySkillOpen}
            targetType="Skill"
            loading={loadingTargetPricing || loadingMySubscription}
            // 套餐列表
            plans={targetSubscriptionPlans}
            // 当前订阅信息
            currentSubscribedInfo={
              mySubscriptionInfo?.currentSubscription ?? null
            }
            onClose={() => setPaySkillOpen(false)}
            onSubscribe={createSubscriptionOrder}
          />
        </ConditionRender>
      )}

      {/* 专家付费统一专家卡弹窗（专家维度，与添加能力弹窗「聘请」同款）：
          未订阅的付费专家点「召唤」或「付费」角标且详情复核确认后弹出，
          卡内订阅+召唤自闭环；放行后就地更新角标并透传跳 /home */}
      {resourceType === 'expert' && (
        <ConditionRender condition={isEnableSubscription}>
          <ExpertSummonModal
            open={!!expertPaymentItem}
            expert={
              expertPaymentItem
                ? {
                    targetId: expertPaymentItem.agentId as number,
                    name: expertPaymentItem.name,
                    icon: expertPaymentItem.icon,
                    description: expertPaymentItem.description,
                    // 使用次数取统计行 user 项（无值卡内不展示）
                    userCount: expertPaymentItem.stats?.find(
                      (stat) => stat.type === 'user',
                    )?.value as number | undefined,
                    // 拦截时已按详情复核确认付费未订阅
                    paymentRequired: true,
                    subscribed: false,
                  }
                : null
            }
            onClose={() => setExpertPaymentItem(null)}
            onSummon={handleExpertCardSummon}
          />
        </ConditionRender>
      )}
    </div>
  );
};

export default ResourceAggregation;
