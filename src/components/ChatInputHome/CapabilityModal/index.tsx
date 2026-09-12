/**
 * 添加能力弹窗
 * @description 技能/连接器/专家/资料库 四类能力 × 系统广场/团队空间 双数据源的
 * 能力选择弹窗：左侧类型导航 + 数据源 tab（技能另有「我启用的」页签）+ 搜索 +
 * 二级分类 pill（资料库另有「最近访问」页签置于空间 pill 最前）+ 列表区。
 * 技能维度列表整体复用 SkillListView（接口/分页/启用开关/付费拦截内聚）；
 * 其余维度为弹窗内两列卡片网格（滚动加载 / 键盘导航）。
 * 数据层参考 pages/ExpertSkillConnector 的适配器方案在本组件内独立实现，
 * 不直接依赖 pages 层代码。
 *
 * 用法：
 * ```tsx
 * <CapabilityModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   onSelect={(item) => console.log(item.resourceType, item.targetId ?? item.rawId)}
 * />
 * ```
 */

import type { ConnectorListSourceType } from '@/components/business-component/ConnectorListView';
import ConnectorListView from '@/components/business-component/ConnectorListView';
import type {
  ExpertListItem,
  ExpertListSourceType,
} from '@/components/business-component/ExpertListView';
import ExpertListView from '@/components/business-component/ExpertListView';
import type {
  SkillListItem,
  SkillListSourceType,
} from '@/components/business-component/SkillListView';
import SkillListView from '@/components/business-component/SkillListView';
import { t } from '@/services/i18nRuntime';
import {
  CloseOutlined,
  FileTextOutlined,
  LinkOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, InputRef, Menu, Modal, Spin, Tabs } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CapabilityCard from './CapabilityCard';
import useAgentUsedList from './hooks/useAgentUsedList';
import useCapabilityCategories from './hooks/useCapabilityCategories';
import useCapabilityResources from './hooks/useCapabilityResources';
import useConnectedConnectors from './hooks/useConnectedConnectors';
import useRecentRepoPages from './hooks/useRecentRepoPages';
import useSkillEnabledList from './hooks/useSkillEnabledList';
import styles from './index.less';
import type {
  CapabilityItem,
  CapabilityItemSourceEnum,
  CapabilitySourceEnum,
  CapabilityTypeEnum,
} from './types';

const cx = classNames.bind(styles);

/** 卡片网格列数（键盘 ↑↓ 按行移动的步长） */
const GRID_COLUMNS = 2;

/** 搜索防抖时长 */
const SEARCH_DEBOUNCE = 400;

/** 技能维度占位空列表（列表由 SkillListView 自理，displayList 恒空） */
const EMPTY_LIST: CapabilityItem[] = [];

/** 左侧能力类型导航配置（图标使用带色板的 tinted 容器渲染） */
const RESOURCE_MENUS: {
  type: CapabilityTypeEnum;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'skill',
    labelKey: 'PC.Components.CapabilityModal.menuSkill',
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m15 7 5-5 2 2-5 5M14 10l-4 4M8 13l3 3-5 5a2.1 2.1 0 0 1-3-3l5-5Z" />
        <path d="M9.5 8.5a4.5 4.5 0 0 0-5.7-6.1l2.7 2.7-1.4 1.4-2.7-2.7a4.5 4.5 0 0 0 6.1 5.7l6 6a4.5 4.5 0 0 0 5.7 6.1l-2.7-2.7 1.4-1.4 2.7 2.7a4.5 4.5 0 0 0-6.1-5.7l-6-6Z" />
      </svg>
    ),
  },
  {
    type: 'connector',
    labelKey: 'PC.Components.CapabilityModal.menuConnector',
    icon: <LinkOutlined />,
  },
  {
    type: 'expert',
    labelKey: 'PC.Components.CapabilityModal.menuExpert',
    icon: <TeamOutlined />,
  },
  {
    type: 'knowledge',
    labelKey: 'PC.Components.CapabilityModal.menuKnowledge',
    icon: <FileTextOutlined />,
  },
];

export interface CapabilityModalProps {
  /** 是否可见 */
  open: boolean;
  /** 关闭回调（Esc / 遮罩 / 选中完成后触发） */
  onClose: () => void;
  /** 选中能力回调（rawId 为原始标识，系统广场条目另有 targetId 本体 ID） */
  onSelect: (item: CapabilityItem) => void;
  /** 初始能力类型，默认技能；不在 resourceTypes 允许范围内时回落首个可用类型 */
  defaultResourceType?: CapabilityTypeEnum;
  /** 选中后是否自动关闭，默认 true */
  closeOnSelect?: boolean;
  /** 开放的能力类型列表，缺省全部；用于按入口收敛可选范围（如专家仅首页开放） */
  resourceTypes?: CapabilityTypeEnum[];
}

const CapabilityModal: React.FC<CapabilityModalProps> = ({
  open,
  onClose,
  onSelect,
  defaultResourceType = 'skill',
  closeOnSelect = true,
  resourceTypes,
}) => {
  /** 按入口开放范围过滤后的左侧导航（缺省=全部四类） */
  const menus = useMemo(
    () =>
      RESOURCE_MENUS.filter(
        (menu) => !resourceTypes || resourceTypes.includes(menu.type),
      ),
    [resourceTypes],
  );
  /** 初始能力类型：defaultResourceType 被过滤时回落首个可用类型 */
  const initialResourceType = menus.some(
    (menu) => menu.type === defaultResourceType,
  )
    ? defaultResourceType
    : menus[0]?.type ?? 'skill';

  // 能力类型 / 数据源（资料库=空间文档仓库，仅团队空间维度，初始即为 team）
  const [resourceType, setResourceType] =
    useState<CapabilityTypeEnum>(initialResourceType);
  const [source, setSource] = useState<CapabilitySourceEnum>(
    initialResourceType === 'knowledge' ? 'team' : 'system',
  );
  // 二级分类 key：system 维度为内容分类（空串=全部），team 维度为选中的空间 ID
  const [category, setCategory] = useState<string>('');

  // 搜索（输入值 + 防抖值）
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  // 搜索框展开态（设计稿为图标按钮，点击展开输入框）
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const searchInputRef = useRef<InputRef>(null);

  // 键盘聚焦项序号：-1 = 未聚焦（首次打开/切换筛选不预亮首卡，
  // 鼠标划过或键盘导航后才建立焦点）
  const [focusIndex, setFocusIndex] = useState<number>(-1);

  // 技能「我启用的」聚合视图：true 时列表切到 enable/list 全量数据
  // （系统广场/团队空间筛选全部失效，仅保留关键字），切回数据源 tab 时复位
  const [enabledView, setEnabledView] = useState<boolean>(false);
  // 专家「最近召唤」聚合视图：true 时列表切到 used/list 全量数据，复位同上
  const [usedView, setUsedView] = useState<boolean>(false);
  // 连接器「已连接」聚合视图：true 时列表切到 connected=true 全量数据，
  // 复位同上（断开最后一项后由回落 effect 自动退出）
  const [connectedView, setConnectedView] = useState<boolean>(false);
  // 资料库「最近访问」聚合视图：true 时列表切到 recently-accessed 全量数据
  // （跨全部空间，空间 pill 照常展示，「最近访问」pill 置于最前）；离开资料库
  // 维度或记录清空时复位（初始即资料库维度时默认进入）
  const [recentView, setRecentView] = useState<boolean>(
    initialResourceType === 'knowledge',
  );
  // 技能/专家维度（SkillListView / ExpertListView 内聚列表与付费拦截），
  // 其余维度走弹窗自实现
  const isSkill = resourceType === 'skill';
  const isExpert = resourceType === 'expert';
  const isConnector = resourceType === 'connector';

  // 分类字典（system：内容分类；team：空间列表，个人空间优先）
  const categories = useCapabilityCategories(resourceType, source);

  /**
   * 团队空间维度：分类 pill 即空间选择——专家/技能维度首位为"全部"（经
   * spaceIds 聚合全部空间的已发布条目）、连接器维度首位同为"全部"（经
   * scope=space 聚合），其余类型选中具体空间查该空间（个人空间优先）
   */
  const defaultSpaceId = useMemo(() => {
    const first = categories.find((item) => item.key);
    const id = first ? Number(first.key) : NaN;
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }, [categories]);

  // 团队维度全部空间 ID（专家"全部"页签的聚合查询参数）
  const teamSpaceIds = useMemo(
    () =>
      categories
        .map((item) => Number(item.key))
        .filter((id) => Number.isFinite(id) && id > 0),
    [categories],
  );

  // 专家/技能·团队维度：空间选择统一经 spaceIds 承载（"全部"=全部空间，具体空间=单元素）
  const publishedSpaceIds = useMemo(() => {
    if (
      source !== 'team' ||
      (resourceType !== 'expert' && resourceType !== 'skill')
    ) {
      return undefined;
    }
    if (!teamSpaceIds.length) return undefined;
    return category ? [Number(category)] : teamSpaceIds;
  }, [source, resourceType, category, teamSpaceIds]);

  const spaceId = useMemo(() => {
    // 资料库「最近访问」聚合视图：repo 树接口不寻址（跨全部空间），保持 undefined
    if (source !== 'team' || recentView) return undefined;
    // 专家/技能/连接器维度"全部"页签不回落单空间（专家/技能由 spaceIds
    // 聚合、连接器由 scope=space 聚合）；具体空间照常取分类
    if (
      resourceType === 'expert' ||
      resourceType === 'skill' ||
      resourceType === 'connector'
    ) {
      return category ? Number(category) : undefined;
    }
    return Number(category) || defaultSpaceId;
  }, [source, resourceType, category, defaultSpaceId, recentView]);

  // 归一化列表数据
  const { list, loading, error, hasMore, loadMore } = useCapabilityResources({
    resourceType,
    source,
    category,
    keyword,
    spaceId,
    spaceIds: publishedSpaceIds,
    pageSize: 20,
  });

  // 技能「我启用的」列表：技能维度激活时拉取——接入 SkillListView 后仅承担
  // 「我启用的」页签可见性判定与清空回落（列表渲染由组件自理），组件内开关
  // 变更经 onEnabledChange 通知此处 reload 同步
  const {
    list: enabledList,
    loaded: enabledLoaded,
    reload: reloadEnabledList,
  } = useSkillEnabledList(open && resourceType === 'skill');
  /** 「我启用的」页签仅技能维度且有启用技能时展示（首拉完成前不显示，防空闪） */
  const showEnabledTab =
    resourceType === 'skill' && enabledLoaded && enabledList.length > 0;

  // 专家「最近召唤」列表：专家维度激活时拉取——接入 ExpertListView 后仅
  // 承担「最近召唤」页签可见性判定与清空回落（列表渲染由组件自理）
  const { list: usedList, loaded: usedLoaded } = useAgentUsedList(
    open && resourceType === 'expert',
  );
  /** 「最近召唤」页签仅专家维度且有记录时展示（首拉完成前不显示，防空闪） */
  const showUsedTab =
    resourceType === 'expert' && usedLoaded && usedList.length > 0;

  // 资料库「最近访问」列表：资料库维度激活时拉取（门户最近访问接口，
  // 访问记录 ∪ 我编辑过，跨全部空间），同为聚合视图数据源
  const {
    list: recentList,
    loading: recentLoading,
    loaded: recentLoaded,
  } = useRecentRepoPages(open && resourceType === 'knowledge');
  /** 「最近访问」pill 仅资料库维度且有记录时展示（首拉完成前不显示，防空闪） */
  const showRecentTab =
    resourceType === 'knowledge' && recentLoaded && recentList.length > 0;

  // 连接器「已连接」列表：连接器维度激活时拉取（connected=true 全量，
  // 与 /expert-skill-connector 连接器页同口径），承担「已连接」页签可见性
  // 判定与聚合视图数据；连接/断开成功后经包装 updateItem 触发 reload 同步
  const {
    list: connectedList,
    loaded: connectedLoaded,
    reload: reloadConnectedList,
  } = useConnectedConnectors(open && resourceType === 'connector');
  /** 「已连接」页签仅连接器维度且有已连接项时展示（首拉完成前不显示，防空闪） */
  const showConnectedTab =
    resourceType === 'connector' && connectedLoaded && connectedList.length > 0;

  /** 连接器列表场景（ConnectorListView）：「已连接」聚合或当前数据源 */
  const connectorListType: ConnectorListSourceType = connectedView
    ? 'connected'
    : source;

  /** 连接器连接态变更（组件内闭环）：重拉「已连接」列表同步页签可见性与回落 */
  const handleConnectorConnectedChange = useCallback(() => {
    reloadConnectedList();
  }, [reloadConnectedList]);

  // 技能/专家维度列表分别接入 SkillListView / ExpertListView（付费拦截等
  // 均内聚），弹窗不再持有订阅/付费相关状态

  /** 技能列表场景（SkillListView）：「我启用的」聚合或当前数据源 */
  const skillListType: SkillListSourceType = enabledView ? 'enabled' : source;

  /**
   * 技能选中（SkillListView 付费拦截通过后回调）：映射回弹窗选中契约
   * （subscribed 已由组件按复核口径带上），按 closeOnSelect 收口
   */
  const handleSkillSelect = useCallback(
    (skillItem: SkillListItem) => {
      onSelect({
        key: skillItem.key,
        resourceType: 'skill',
        source: skillListType as CapabilityItemSourceEnum,
        rawId: skillItem.rawId,
        targetId: skillItem.targetId,
        name: skillItem.name,
        description: skillItem.description,
        icon: skillItem.icon,
        paymentRequired: skillItem.paymentRequired,
        subscribed: skillItem.subscribed,
      });
      if (closeOnSelect) {
        onClose();
      }
    },
    [skillListType, onSelect, onClose, closeOnSelect],
  );

  /** 技能启用变更（组件内闭环）：重拉「我启用的」同步页签可见性与回落 */
  const handleSkillEnabledChange = useCallback(() => {
    reloadEnabledList();
  }, [reloadEnabledList]);

  /** 专家列表场景（ExpertListView）：「最近召唤」聚合或当前数据源 */
  const expertListType: ExpertListSourceType = usedView ? 'used' : source;

  /**
   * 专家选中（ExpertListView 付费拦截通过后回调，含统一专家卡内召唤
   * 放行）：映射回弹窗选中契约，按 closeOnSelect 收口
   */
  const handleExpertSelect = useCallback(
    (expertItem: ExpertListItem) => {
      onSelect({
        key: expertItem.key,
        resourceType: 'expert',
        source: expertListType as CapabilityItemSourceEnum,
        rawId: expertItem.rawId,
        targetId: expertItem.targetId,
        name: expertItem.name,
        description: expertItem.description,
        icon: expertItem.icon,
        paymentRequired: expertItem.paymentRequired,
        subscribed: expertItem.subscribed,
        userCount: expertItem.userCount,
      });
      if (closeOnSelect) {
        onClose();
      }
    },
    [expertListType, onSelect, onClose, closeOnSelect],
  );

  /**
   * 列表数据分流（资料库维度）：「最近访问」聚合视图 = 全量数组按关键字
   * 客户端过滤（无分页）；否则为空间树的服务端分页列表。技能/专家/连接器
   * 维度由 SkillListView / ExpertListView / ConnectorListView 自理
   * （此处恒为空数组）。
   */
  const displayList = useMemo(() => {
    if (isSkill || isExpert || isConnector) {
      return EMPTY_LIST;
    }
    if (!recentView) {
      return list;
    }
    const kw = keyword.trim().toLowerCase();
    if (!kw) return recentList;
    return recentList.filter(
      (item) =>
        item.name?.toLowerCase().includes(kw) ||
        item.description?.toLowerCase().includes(kw),
    );
  }, [isSkill, isExpert, isConnector, recentView, list, recentList, keyword]);

  // 搜索防抖
  useEffect(() => {
    const timer = window.setTimeout(
      () => setKeyword(keywordInput),
      SEARCH_DEBOUNCE,
    );
    return () => window.clearTimeout(timer);
  }, [keywordInput]);

  /**
   * 切换数据源/能力类型时同步清空二级分类：跨维度的 category 语义不同
   * （system=内容分类、team=空间选择），携带旧值会先发出一次无效加载；
   * 切换类型导航时数据源自动回到系统广场（资料库=空间文档仓库，repo 树
   * 接口 spaceId 必传，强制团队空间源），并复位聚合视图（我启用的/最近召唤/
   * 最近访问）；进入资料库维度默认落在「最近访问」（无记录时由回落 effect
   * 切回首空间）
   */
  const handleSourceChange = useCallback((next: CapabilitySourceEnum) => {
    setEnabledView(false);
    setUsedView(false);
    setConnectedView(false);
    setRecentView(false);
    setSource(next);
    setCategory('');
  }, []);
  const handleResourceTypeChange = useCallback((next: CapabilityTypeEnum) => {
    setEnabledView(false);
    setUsedView(false);
    setConnectedView(false);
    setRecentView(next === 'knowledge');
    setResourceType(next);
    setSource(next === 'knowledge' ? 'team' : 'system');
    setCategory('');
  }, []);

  // team 维度兜底：分类不在字典中（含初始空值）时选中首位"全部"；
  // 资料库「最近访问」视图期间跳过（保持 category 为空，repo 树接口不触发）
  useEffect(() => {
    if (
      source === 'team' &&
      categories.length > 0 &&
      !recentView &&
      !connectedView
    ) {
      setCategory((current) =>
        categories.some((item) => item.key === current)
          ? current
          : categories[0].key,
      );
    }
  }, [source, categories, recentView, connectedView]);

  // 筛选条件变化时复位为未聚焦（切换页签/搜索后不预亮首卡）
  useEffect(() => {
    setFocusIndex(-1);
  }, [
    resourceType,
    source,
    category,
    keyword,
    enabledView,
    usedView,
    connectedView,
    recentView,
  ]);

  // 聚合列表清空后对应页签隐藏：当前停留在该视图时自动回落系统广场
  // （「我启用的」取消启用最后一项；「最近召唤」无移除操作，防御性兜底；
  // 「已连接」断开最后一项）
  useEffect(() => {
    if (enabledView && enabledLoaded && enabledList.length === 0) {
      setEnabledView(false);
    }
  }, [enabledView, enabledLoaded, enabledList.length]);
  useEffect(() => {
    if (usedView && usedLoaded && usedList.length === 0) {
      setUsedView(false);
    }
  }, [usedView, usedLoaded, usedList.length]);
  useEffect(() => {
    if (connectedView && connectedLoaded && connectedList.length === 0) {
      setConnectedView(false);
    }
  }, [connectedView, connectedLoaded, connectedList.length]);
  // 资料库「最近访问」清空时回落首空间 pill（复位 recentView 后由上方
  // team 维度兜底 effect 接管选中）
  useEffect(() => {
    if (recentView && recentLoaded && recentList.length === 0) {
      setRecentView(false);
    }
  }, [recentView, recentLoaded, recentList.length]);

  // 列表长度变化时收敛聚焦序号（避免越界）
  useEffect(() => {
    setFocusIndex((index) =>
      Math.min(index, Math.max(0, displayList.length - 1)),
    );
  }, [displayList.length]);

  // 弹窗打开时聚焦弹窗根节点，保证键盘事件可达（Esc/方向键/回车）
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => rootRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    // 关闭后复位交互状态（弹窗使用 destroyOnClose，此处兜底同步关闭态）
    setSearchOpen(false);
  }, [open]);

  // 搜索框展开后自动聚焦输入框
  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // 键盘聚焦项滚动跟随：仅键盘导航时滚动（鼠标 hover 同样会改 focusIndex，
  // 若跟随滚动会在加载新页/悬停底部卡片时把滚动条拽走）
  const listRef = useRef<HTMLDivElement | null>(null);
  const keyboardNavRef = useRef<boolean>(false);
  useEffect(() => {
    if (!keyboardNavRef.current) {
      return;
    }
    keyboardNavRef.current = false;
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [focusIndex, displayList]);

  /**
   * 连接器/资料库选中（无付费拦截，技能/专家拦截已内聚对应列表组件）
   */
  const handleSelect = useCallback(
    (item: CapabilityItem) => {
      onSelect(item);
      if (closeOnSelect) {
        onClose();
      }
    },
    [onSelect, onClose, closeOnSelect],
  );

  /** 键盘导航：↑↓ 按行移动（步长=列数）、←→ 逐项移动、Enter 选中、Esc 关闭 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) {
      return;
    }
    const inInput = e.target instanceof HTMLInputElement;
    // 输入框内左右键保留光标移动语义
    if (inInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      return;
    }
    // antd Tabs/Menu 自带方向键/回车导航：焦点落在其上时交还组件自身处理，
    // 避免与列表键盘导航双触发（Esc 仍统一走弹窗关闭）
    if (
      e.key !== 'Escape' &&
      e.target instanceof Element &&
      e.target.closest('[role="tab"], [role="menuitem"]')
    ) {
      return;
    }
    // 新增按钮保留原生 Enter/Space 激活语义，避免误选列表中的卡片。
    if (
      e.target instanceof HTMLButtonElement &&
      (e.key === 'Enter' || e.key === ' ')
    )
      return;
    const columns = listRef.current
      ? getComputedStyle(listRef.current).gridTemplateColumns.split(' ').length
      : GRID_COLUMNS;
    const last = Math.max(0, displayList.length - 1);
    // -1（未聚焦）起步：↓/→ 进入首项，↑/← 保持未聚焦，Enter 无选中项即空操作
    const actions: Record<string, (() => void) | undefined> = {
      ArrowDown: () =>
        setFocusIndex((i) => (i < 0 ? 0 : Math.min(i + columns, last))),
      ArrowUp: () =>
        setFocusIndex((i) => (i < 0 ? -1 : Math.max(i - columns, 0))),
      ArrowRight: () =>
        setFocusIndex((i) => (i < 0 ? 0 : Math.min(i + 1, last))),
      ArrowLeft: () => setFocusIndex((i) => (i < 0 ? -1 : Math.max(i - 1, 0))),
      Home: () => setFocusIndex(0),
      End: () => setFocusIndex(last),
      Enter: () => {
        const item = displayList[focusIndex];
        if (item) {
          handleSelect(item);
        }
      },
      Escape: () => onClose(),
    };
    const action = actions[e.key];
    if (action) {
      e.preventDefault();
      e.stopPropagation();
      // 方向键/Home/End 属于键盘导航，聚焦项需要滚动跟随
      if (e.key !== 'Enter' && e.key !== 'Escape') {
        keyboardNavRef.current = true;
      }
      action();
    }
  };

  // 视图层加载态/翻页标记（资料库维度；技能/专家/连接器由 SkillListView /
  // ExpertListView / ConnectorListView 自理）：「最近访问」为全量数组无分页,
  // 滚动加载与自动补拉仅在资料库空间树的分页视图生效
  const viewLoading = recentView ? recentLoading : loading;
  const viewHasMore = recentView ? false : hasMore;

  /** 滚动触底加载下一页（尾部追加，不改既有内容位置） */
  const handleListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 48 &&
      !viewLoading &&
      viewHasMore
    ) {
      loadMore();
    }
  };

  // 列表未填满容器且还有数据时自动补拉（首屏数据不足一屏的场景）
  useEffect(() => {
    const el = listRef.current;
    if (!el || viewLoading || !viewHasMore || displayList.length === 0) {
      return;
    }
    if (el.scrollHeight <= el.clientHeight) {
      loadMore();
    }
  }, [displayList, viewLoading, viewHasMore, loadMore]);

  // 团队空间维度等待空间字典/空间 ID 就绪,否则空结果会卡在加载态;
  // 「最近访问」聚合视图凭首拉完成判定（失败也会置 loaded,空态不卡加载）
  const waitingSpace =
    !recentView && source === 'team' && !spaceId && !publishedSpaceIds?.length;
  const initialLoading =
    displayList.length === 0 &&
    (recentView ? !recentLoaded || recentLoading : loading || waitingSpace);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={920}
      centered
      footer={null}
      closable={false}
      // Esc 由弹窗内容统一处理（含输入框聚焦场景）
      keyboard={false}
      maskClosable
      destroyOnHidden
      className={cx(styles['capability-modal'])}
    >
      <div
        ref={rootRef}
        tabIndex={-1}
        className={cx('flex', styles.root)}
        onKeyDown={handleKeyDown}
      >
        {/* 左侧：标题 + 能力类型导航 + 快捷键提示 */}
        <aside className={cx('flex', 'flex-col', styles.sidebar)}>
          <div className={cx(styles['sidebar-header'])}>
            <div className={cx(styles['sidebar-title'])}>
              {t('PC.Components.CapabilityModal.title')}
            </div>
            <div className={cx(styles['sidebar-subtitle'])}>
              {t('PC.Components.CapabilityModal.subtitle')}
            </div>
          </div>
          {/* 左侧导航走 antd Menu（选中态/键盘语义内置），图标沿用 tinted 容器 */}
          <Menu
            className={styles.menu}
            selectedKeys={[resourceType]}
            onClick={({ key }) =>
              handleResourceTypeChange(key as CapabilityTypeEnum)
            }
            items={menus.map((menu) => ({
              key: menu.type,
              label: t(menu.labelKey),
              icon: (
                <span
                  className={cx(
                    'flex',
                    'items-center',
                    'content-center',
                    styles['menu-icon'],
                    styles[`menu-icon-${menu.type}`],
                  )}
                >
                  {menu.icon}
                </span>
              ),
            }))}
          />
          <div className={cx('flex', 'items-center', styles['sidebar-hints'])}>
            <span>{t('PC.Components.CapabilityModal.hintNav')}</span>
            <i>·</i>
            <span>{t('PC.Components.CapabilityModal.hintSelect')}</span>
            <i>·</i>
            <span>{t('PC.Components.CapabilityModal.hintClose')}</span>
          </div>
        </aside>

        {/* 右侧：数据源 tab + 搜索（最上方右侧）+ 分类 pill + 卡片网格 */}
        <section className={cx('flex', 'flex-col', 'flex-1', styles.main)}>
          <header className={styles.header}>
            {resourceType === 'knowledge' ? (
              // 资料库=空间文档仓库，仅团队空间维度（repo 树接口 spaceId 必传），
              // 无数据源切换，仅展示静态标题
              <button type="button" className={styles['header-title']}>
                {t('PC.Components.CapabilityModal.menuKnowledge')}
              </button>
            ) : (
              // 数据源 tab 走 antd Tabs（指示线/键盘语义内置）；聚合页签
              // 仅对应维度且有数据时展示，均置于最前——专家「最近召唤」、
              // 技能「我启用的」、连接器「已连接」
              <Tabs
                className={styles.tabs}
                activeKey={
                  usedView
                    ? 'used'
                    : enabledView
                    ? 'enabled'
                    : connectedView
                    ? 'connected'
                    : source
                }
                onChange={(key) => {
                  if (key === 'used') {
                    setUsedView(true);
                    return;
                  }
                  if (key === 'enabled') {
                    setEnabledView(true);
                    return;
                  }
                  if (key === 'connected') {
                    setConnectedView(true);
                    return;
                  }
                  handleSourceChange(key as CapabilitySourceEnum);
                }}
                items={[
                  ...(showUsedTab
                    ? [
                        {
                          key: 'used',
                          label: t('PC.Components.CapabilityModal.mainTabUsed'),
                        },
                      ]
                    : []),
                  ...(showEnabledTab
                    ? [
                        {
                          key: 'enabled',
                          label: t(
                            'PC.Components.CapabilityModal.mainTabEnabled',
                          ),
                        },
                      ]
                    : []),
                  ...(showConnectedTab
                    ? [
                        {
                          key: 'connected',
                          label: t(
                            'PC.Components.CapabilityModal.mainTabConnected',
                          ),
                        },
                      ]
                    : []),
                  {
                    key: 'system',
                    label: t('PC.Components.CapabilityModal.mainTabSystem'),
                  },
                  {
                    key: 'team',
                    label: t('PC.Components.CapabilityModal.mainTabTeam'),
                  },
                ]}
              />
            )}
            {/* 右侧操作簇：搜索（常驻最上方右侧）+ 关闭 */}
            <div className={styles['header-actions']}>
              {searchOpen ? (
                <Input
                  ref={searchInputRef}
                  className={styles['search-input']}
                  allowClear
                  size="small"
                  prefix={<SearchOutlined />}
                  placeholder={t(
                    'PC.Components.CapabilityModal.searchPlaceholder',
                  )}
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  onBlur={() => {
                    if (!keywordInput) setSearchOpen(false);
                  }}
                />
              ) : (
                <Button
                  type="text"
                  size="small"
                  className={styles['search-btn']}
                  aria-label={t(
                    'PC.Components.CapabilityModal.searchPlaceholder',
                  )}
                  onClick={() => setSearchOpen(true)}
                  icon={<SearchOutlined />}
                />
              )}
              <Button
                type="text"
                size="small"
                className={styles['close-btn']}
                aria-label={t('PC.Components.CapabilityModal.close')}
                onClick={onClose}
                icon={<CloseOutlined />}
              />
            </div>
          </header>

          {/* 分类 pill 行：聚合视图（最近召唤/我启用的/已连接）跨系统/团队，
              分类不适用（隐藏整行）；资料库「最近访问」视图空间 pill 照常展示，
              「最近访问」pill 置于最前 */}
          {!usedView && !enabledView && !connectedView && (
            <div className={styles.toolbar}>
              <div className={styles.categories}>
                {resourceType === 'knowledge' && showRecentTab && (
                  <button
                    type="button"
                    aria-pressed={recentView}
                    className={cx(styles['category-pill'], {
                      [styles['category-pill-active']]: recentView,
                    })}
                    onClick={() => setRecentView(true)}
                  >
                    {t('PC.Components.CapabilityModal.mainTabRecent')}
                  </button>
                )}
                {categories.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={item.key === category && !recentView}
                    className={cx(styles['category-pill'], {
                      [styles['category-pill-active']]:
                        item.key === category && !recentView,
                    })}
                    onClick={() => {
                      setRecentView(false);
                      setCategory(item.key);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 技能/专家/连接器维度：列表整体交给 SkillListView / ExpertListView /
              ConnectorListView（接口/分页/开关/付费拦截/连接流程内聚）；
              聚合视图顶部补留白对齐其他维度 */}
          {isSkill ? (
            <SkillListView
              className={cx(styles['embed-list'], {
                [styles['list-enabled']]: enabledView,
              })}
              type={skillListType}
              keyword={keyword}
              category={category}
              spaceId={spaceId}
              spaceIds={publishedSpaceIds}
              onSelect={handleSkillSelect}
              onEnabledChange={handleSkillEnabledChange}
            />
          ) : isExpert ? (
            <ExpertListView
              className={cx(styles['embed-list'], {
                [styles['list-enabled']]: usedView,
              })}
              type={expertListType}
              keyword={keyword}
              category={category}
              spaceId={spaceId}
              spaceIds={publishedSpaceIds}
              onSelect={handleExpertSelect}
            />
          ) : isConnector ? (
            <ConnectorListView
              className={cx(styles['embed-list'], {
                [styles['list-enabled']]: connectedView,
              })}
              type={connectorListType}
              keyword={keyword}
              category={category}
              spaceId={spaceId}
              onConnectedChange={handleConnectorConnectedChange}
            />
          ) : (
            /* 滚动容器常驻（三态在容器内切换）：避免加载完成时 Spin/网格互换 DOM 造成整屏闪跳 */
            <div
              ref={listRef}
              role="listbox"
              // 未聚焦（-1）时不指向任何项，避免读屏误报首卡
              aria-activedescendant={
                focusIndex >= 0 ? `capability-option-${focusIndex}` : undefined
              }
              className={cx('flex-1', styles.list, {
                [styles['list-knowledge']]: resourceType === 'knowledge',
                // 聚合视图（已连接）无分类 pill 行，列表顶部补留白
                [styles['list-enabled']]: connectedView,
              })}
              onScroll={handleListScroll}
            >
              {initialLoading ? (
                <div
                  className={cx(
                    'flex',
                    'items-center',
                    'content-center',
                    styles['list-state'],
                  )}
                >
                  <Spin size="large" />
                </div>
              ) : displayList.length === 0 ? (
                <div
                  className={cx(
                    'flex',
                    'items-center',
                    'content-center',
                    styles['list-state'],
                  )}
                >
                  <Empty
                    description={t(
                      !recentView && error
                        ? 'PC.Components.CapabilityModal.loadFailed'
                        : 'PC.Common.Global.emptyData',
                    )}
                  />
                </div>
              ) : (
                <>
                  {displayList.map((item, index) => (
                    <CapabilityCard
                      key={item.key}
                      item={item}
                      index={index}
                      focused={index === focusIndex}
                      onSelect={handleSelect}
                      onHover={setFocusIndex}
                    />
                  ))}
                  {viewLoading && (
                    <div
                      className={cx(
                        'flex',
                        'items-center',
                        'content-center',
                        styles['list-loading'],
                      )}
                    >
                      {t('PC.Components.CapabilityModal.loading')}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>

      {/* 技能/专家的付费订阅弹窗、连接器的凭据/扫码连接弹窗均已随
          SkillListView / ExpertListView / ConnectorListView 内聚,
          弹窗内不再持有 */}
    </Modal>
  );
};

export default CapabilityModal;
