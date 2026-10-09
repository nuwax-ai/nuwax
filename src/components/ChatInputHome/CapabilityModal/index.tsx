/**
 * 添加能力弹窗
 * @description 技能/连接器/专家/资料库 四类能力 × 系统广场/团队空间 双数据源的
 * 能力选择弹窗：左侧类型导航 + 数据源 tab（技能另有「我启用的」页签）+ 搜索 +
 * 二级分类 pill（资料库另有「最近访问」页签置于空间 pill 最前）+ 列表区。
 * 键盘导航：Tab 在弹窗内按停靠点轮询（左侧导航 → 数据源页签 → 搜索 →
 * 关闭 → 分类 pill → 列表容器），各区方向键区内切换（分类 pill ←→、
 * 列表 ↑↓←→ 逐项 + Enter 触发选择/开启，仅列表区聚焦时生效），Esc 关闭；
 * 打开时默认聚焦弹窗根（无描边，同享列表方向键）。
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
  KnowledgeListItem,
  KnowledgeListSourceType,
} from '@/components/business-component/KnowledgeListView';
import KnowledgeListView from '@/components/business-component/KnowledgeListView';
import type {
  SkillListItem,
  SkillListSourceType,
} from '@/components/business-component/SkillListView';
import SkillListView from '@/components/business-component/SkillListView';
import { t } from '@/services/i18nRuntime';
import {
  CloseOutlined,
  LinkOutlined,
  SearchOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Input, InputRef, Menu, Modal, Tabs } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import useAgentUsedList from './hooks/useAgentUsedList';
import useCapabilityCategories from './hooks/useCapabilityCategories';
import useConnectedConnectors from './hooks/useConnectedConnectors';
import useRecentRepoPages from './hooks/useRecentRepoPages';
import useSkillEnabledList from './hooks/useSkillEnabledList';
import { CAPABILITY_MENU_ICON_SVGS } from './icons';
import styles from './index.less';
import type {
  CapabilityItem,
  CapabilityItemSourceEnum,
  CapabilitySourceEnum,
  CapabilityTypeEnum,
} from './types';

const cx = classNames.bind(styles);

/**
 * 内嵌列表卡片根节点选择器：SkillListView / ExpertListView /
 * ConnectorListView 的卡片均以 data-*-key 标识，弹窗键盘导航经 DOM 代理
 */
const EMBED_CARD_SELECTOR =
  '[data-skill-key], [data-expert-key], [data-connector-key], [data-knowledge-key]';

/** 内嵌列表键盘聚焦态全局类（卡片样式内聚在各列表组件，经 DOM 类注入） */
const EMBED_FOCUS_CLASS = 'capability-embed-card-focus';

/** 搜索防抖时长 */
const SEARCH_DEBOUNCE = 400;

/**
 * 左侧能力类型导航配置（图标使用带色板的 tinted 容器渲染）。
 * 技能/资料库图标取 ./icons 的 SVG 字符串单源——与会话输入框
 * 提及 chip（MentionEditor createMentionChip）共用，两处视觉一致
 */
const RESOURCE_MENUS: {
  type: CapabilityTypeEnum;
  labelKey: string;
  icon: React.ReactNode;
}[] = [
  {
    type: 'skill',
    labelKey: 'PC.Components.CapabilityModal.menuSkill',
    icon: (
      <span
        className={styles['menu-raw-icon']}
        dangerouslySetInnerHTML={{ __html: CAPABILITY_MENU_ICON_SVGS.skill }}
      />
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
    icon: (
      <span
        className={styles['menu-raw-icon']}
        dangerouslySetInnerHTML={{
          __html: CAPABILITY_MENU_ICON_SVGS.knowledge,
        }}
      />
    ),
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
  /**
   * 初始是否进入连接器「已连接」聚合页签，默认 false（数据源页签）；
   * 仅连接器维度生效（其余维度传入无效）。会话工具栏已连接连接器
   * 头像组入口专用——其余入口（'/' 触发等）一律落默认数据源页签
   */
  defaultConnectedView?: boolean;
  /**
   * 初始是否进入专家「最近召唤」聚合页签，默认 false（数据源页签）；
   * 仅专家维度生效（其余维度传入无效）。@ 资源弹层专家 tab「更多」
   * 入口专用——无召唤记录时由清空回落 effect 自动退回数据源页签
   */
  defaultUsedView?: boolean;
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
  defaultConnectedView = false,
  defaultUsedView = false,
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
  // 专家「最近召唤」聚合视图：true 时列表切到 used/list 全量数据，复位
  // 同上；仅 @ 弹层专家 tab「更多」入口经 defaultUsedView 显式指定时
  // 初始进入（无记录时由清空回落 effect 自动退回数据源页签）
  const [usedView, setUsedView] = useState<boolean>(
    defaultUsedView && initialResourceType === 'expert',
  );
  // 连接器「已连接」聚合视图：true 时列表切到 connected=true 全量数据，
  // 复位同上（断开最后一项后由回落 effect 自动退出）；仅头像组入口经
  // defaultConnectedView 显式指定时初始进入，其余入口落默认数据源页签
  const [connectedView, setConnectedView] = useState<boolean>(
    defaultConnectedView && initialResourceType === 'connector',
  );
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
  const { list: recentList, loaded: recentLoaded } = useRecentRepoPages(
    open && resourceType === 'knowledge',
  );
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

  /** 资料库列表场景（KnowledgeListView）：「最近访问」聚合或指定空间树 */
  const knowledgeListType: KnowledgeListSourceType = recentView
    ? 'recent'
    : 'space';

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

  // 弹窗内容根节点：键盘事件挂载点（onKeyDown），列表停靠点见
  // [data-capability-list] 容器
  const rootRef = useRef<HTMLDivElement | null>(null);

  /** 内嵌列表卡片集合（四维度列表组件，DOM 顺序即列表顺序） */
  const getEmbedCards = () =>
    Array.from(
      rootRef.current?.querySelectorAll<HTMLElement>(EMBED_CARD_SELECTOR) ?? [],
    );

  // 内嵌卡片数量变化时收敛聚焦序号（避免越界；effects 后于 DOM 提交执行）
  useEffect(() => {
    const count = getEmbedCards().length;
    setFocusIndex((index) => Math.min(index, Math.max(0, count - 1)));
  });

  /**
   * Tab 轮询停靠点（focus trap）：焦点按「左侧类型导航 → 数据源页签 →
   * 搜索 → 关闭 → 分类 pill → 列表」在弹窗内循环（与视觉阅读顺序一致），
   * Shift 反向；不可用分组（资料库无数据源页签、聚合视图无分类 pill）自动
   * 跳过。Tab 只换区不操作，停靠时焦点落在各分组当前选中项，区内切换交给
   * 各分组自身方向键（antd Menu/Tabs 内置，分类 pill 由本组件接管 ←→）；
   * 列表停靠点为列表容器（与 aria-activedescendant 配对供读屏感知聚焦项），
   * ↑↓/Enter 走列表键盘导航。
   */
  const getFocusStops = (): {
    region: string | null;
    target: HTMLElement | null;
  }[] => {
    const root = rootRef.current;
    if (!root) {
      return [];
    }
    const pillsRow = root.querySelector('[data-capability-pills]');
    return [
      {
        // 左侧类型导航：当前选中项（异常时回落首项）
        region: '[role="menu"]',
        target:
          root.querySelector<HTMLElement>('.ant-menu-item-selected') ??
          root.querySelector<HTMLElement>('[role="menuitem"]'),
      },
      {
        // 数据源页签：当前激活 tab（资料库维度无页签行）
        region: '[role="tablist"]',
        target:
          resourceType === 'knowledge'
            ? null
            : root.querySelector<HTMLElement>(
                '[role="tab"][aria-selected="true"]',
              ) ?? root.querySelector<HTMLElement>('[role="tab"]'),
      },
      {
        // 搜索：展开态定位内层 input（antd Input 的 data-* 落在包装层），
        // 收起态属性在按钮自身（属性选择器直接命中，非后代组合器）
        region: '[data-capability-search]',
        target: root.querySelector<HTMLElement>(
          '[data-capability-search] input, button[data-capability-search]',
        ),
      },
      {
        region: '[data-capability-close]',
        target: root.querySelector<HTMLElement>('[data-capability-close]'),
      },
      {
        // 分类 pill：当前选中 pill（聚合视图/无分类时无目标即跳过分组）
        region: '[data-capability-pills]',
        target:
          pillsRow?.querySelector<HTMLElement>(
            `.${styles['category-pill-active']}`,
          ) ??
          pillsRow?.querySelector<HTMLElement>(`.${styles['category-pill']}`) ??
          null,
      },
      {
        // 列表：停靠列表容器（资料库网格 / 内嵌列表外层停靠容器）
        region: null,
        target:
          root.querySelector<HTMLElement>('[data-capability-list]') ?? root,
      },
    ];
  };

  /**
   * Tab 轮询步进：定位当前分区后移到上/下一停靠点，焦点不出弹窗。
   * Tab 只换区不操作——区内切换一律交给各分组自身方向键
   * （左侧导航 ↑↓ / 数据源页签与分类 pill ←→ / 列表容器 ↑↓←→，
   * 列表导航仅在焦点位于列表容器时生效）
   */
  const moveFocusStop = (backward: boolean) => {
    const stops = getFocusStops().filter((stop) => stop.target);
    if (!stops.length) {
      return;
    }
    const active = document.activeElement;
    const inRoot =
      !!active &&
      active !== document.body &&
      !!rootRef.current?.contains(active);
    // 当前分区 = activeElement 落入某停靠 region；列表分区 region 为空作
    // 兜底（root 内未命中其余分区的焦点一律按列表区处理，含初始根聚焦）
    let index = stops.findIndex(
      (stop) =>
        !!inRoot &&
        (stop.region
          ? !!active?.closest(stop.region)
          : stop.target === active || !!stop.target?.contains(active)),
    );
    if (index < 0) {
      index = stops.findIndex((stop) => !stop.region);
    }
    const next = backward
      ? (index - 1 + stops.length) % stops.length
      : (index + 1) % stops.length;
    stops[next].target?.focus();
  };

  // 弹窗打开时聚焦弹窗根节点：outline:none 无描边（避免开屏即显聚焦框），
  // 根节点同属列表区（方向键/回车即时可用），并保证键盘事件可达（Tab/Esc）
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
  const keyboardNavRef = useRef<boolean>(false);
  useEffect(() => {
    if (!keyboardNavRef.current) {
      return;
    }
    keyboardNavRef.current = false;
    getEmbedCards()[focusIndex]?.scrollIntoView?.({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusIndex]);

  // 内嵌列表键盘聚焦高亮：focusIndex 命中卡片时注入全局聚焦类（卡片样式
  // 内聚在各列表组件、无法经 props 传入，DOM 类切换为最小侵入方案；列表
  // 重渲染时 React 会整体重写 className，残留高亮随之自动失效）
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    root
      .querySelectorAll(`.${EMBED_FOCUS_CLASS}`)
      .forEach((el) => el.classList.remove(EMBED_FOCUS_CLASS));
    if (focusIndex >= 0) {
      getEmbedCards()[focusIndex]?.classList.add(EMBED_FOCUS_CLASS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusIndex]);

  /**
   * 资料选中（KnowledgeListView 直调,无付费拦截）：映射回弹窗选中契约
   * （slugId/pageType 随行带出供 chip 插入链路），按 closeOnSelect 收口
   */
  const handleKnowledgeSelect = useCallback(
    (doc: KnowledgeListItem) => {
      onSelect({
        key: doc.key,
        resourceType: 'knowledge',
        source: 'team',
        rawId: doc.rawId,
        slugId: doc.slugId,
        name: doc.name,
        pageType: doc.pageType,
      });
      if (closeOnSelect) {
        onClose();
      }
    },
    [onSelect, onClose, closeOnSelect],
  );

  /**
   * 键盘导航：Tab 弹窗内停靠点轮询（focus trap）只换区，区内切换交各分组
   * 自身方向键；列表 ↑↓←→ 逐项切换（↓/→ 下一项、↑/← 上一项）+ Home/End
   * 首末项 + Enter 触发卡片主操作（技能/专家选中、连接器开启开关），仅在
   * 焦点位于列表区（列表容器或弹窗根）时生效；Esc 任意位置统一关闭。
   * 技能/专家/连接器维度列表经 DOM 卡片代理，保留组件内付费拦截语义
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) {
      return;
    }
    // Tab：焦点在弹窗内轮询（Shift 反向；带修饰键的组合保留浏览器原生行为）
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      moveFocusStop(e.shiftKey);
      return;
    }
    // Esc：任意焦点位置（含输入框/菜单/页签）统一关闭弹窗
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    const inInput = e.target instanceof HTMLInputElement;
    // 输入框内左右键保留光标移动语义
    if (inInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      return;
    }
    // 分类 pill 行：←→ 循环切换、Home/End 首末项（移动即激活，
    // 与 antd Tabs 方向键行为一致）
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End'
    ) {
      const pillRow =
        e.target instanceof Element
          ? e.target.closest('[data-capability-pills]')
          : null;
      if (pillRow) {
        const pills = Array.from(
          pillRow.querySelectorAll<HTMLButtonElement>(
            `.${styles['category-pill']}`,
          ),
        );
        const current = pills.findIndex(
          (pill) => pill === document.activeElement,
        );
        let next: HTMLButtonElement | undefined;
        if (e.key === 'Home') {
          next = pills[0];
        } else if (e.key === 'End') {
          next = pills[pills.length - 1];
        } else if (current >= 0 && pills.length > 1) {
          const offset = e.key === 'ArrowRight' ? 1 : -1;
          next = pills[(current + offset + pills.length) % pills.length];
        }
        if (next && next !== document.activeElement) {
          next.focus();
          next.click();
        }
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }
    // antd Tabs/Menu 自带方向键/回车导航：焦点落在其上时交还组件自身处理，
    // 避免与列表键盘导航双触发
    if (
      e.target instanceof Element &&
      e.target.closest('[role="tab"], [role="menuitem"]')
    ) {
      return;
    }
    // 按钮保留原生 Enter/Space 激活语义，避免误选列表中的卡片。
    if (
      e.target instanceof HTMLButtonElement &&
      (e.key === 'Enter' || e.key === ' ')
    )
      return;
    // 列表键盘导航仅在焦点位于列表区（列表容器或弹窗根）时生效——其余
    // 分组的方向键只服务自身分组（分类 pill 上 ↑↓ 不联动列表）；弹窗根
    // 为开屏默认聚焦点（无描边），同享列表方向键
    const inListRegion =
      e.target === rootRef.current ||
      (e.target instanceof Element &&
        !!e.target.closest('[data-capability-list]'));
    if (!inListRegion) {
      return;
    }
    // 四维度：列表内聚在 SkillListView / ExpertListView / ConnectorListView /
    // KnowledgeListView，键盘导航经 DOM 卡片序号代理 + 聚焦类高亮；
    // Enter 触发卡片主操作（技能/专家/资料=整卡点击选中；连接器=卡内连接开关）
    {
      const cards = getEmbedCards();
      const last = cards.length - 1;
      if (last >= 0) {
        // 逐项切换：↓/→ 下一项、↑/← 上一项（-1 未聚焦起步：↓/→ 进首项）
        const actions: Record<string, (() => void) | undefined> = {
          ArrowDown: () =>
            setFocusIndex((i) => (i < 0 ? 0 : Math.min(i + 1, last))),
          ArrowUp: () =>
            setFocusIndex((i) => (i < 0 ? -1 : Math.max(i - 1, 0))),
          ArrowRight: () =>
            setFocusIndex((i) => (i < 0 ? 0 : Math.min(i + 1, last))),
          ArrowLeft: () =>
            setFocusIndex((i) => (i < 0 ? -1 : Math.max(i - 1, 0))),
          Home: () => setFocusIndex(0),
          End: () => setFocusIndex(last),
          Enter: () => {
            const card = cards[focusIndex];
            if (!card) {
              return;
            }
            if (isConnector) {
              card.querySelector<HTMLElement>('[role="switch"]')?.click();
              return;
            }
            card.click();
          },
        };
        const action = actions[e.key];
        if (action) {
          e.preventDefault();
          e.stopPropagation();
          if (e.key !== 'Enter') {
            keyboardNavRef.current = true;
          }
          action();
        }
      }
      return;
    }
  };
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
        {/* 左侧：标题 + 能力类型导航 */}
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
        </aside>

        {/* 右侧：数据源 tab + 搜索（最上方右侧）+ 分类 pill + 卡片网格 */}
        <section className={cx('flex', 'flex-col', 'flex-1', styles.main)}>
          <header className={styles.header}>
            {resourceType === 'knowledge' ? (
              // 资料库=空间文档仓库，仅团队空间维度（repo 树接口 spaceId 必传），
              // 无数据源切换，仅展示静态标题（纯展示不参与 Tab 轮询）
              <button
                type="button"
                tabIndex={-1}
                className={styles['header-title']}
              >
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
            {/* 右侧操作簇：搜索（常驻最上方右侧）+ 关闭；data-* 供 Tab 轮询定位 */}
            <div className={styles['header-actions']}>
              {searchOpen ? (
                <Input
                  ref={searchInputRef}
                  data-capability-search
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
                  data-capability-search
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
                data-capability-close
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
              {/* 分类 pill 行：roving tabindex（仅选中项可 Tab 停靠，←→ 组内
                  切换），data-* 供 Tab 轮询定位（aria-pressed 开关语义，
                  不用 tablist/tab 角色避免与数据源页签区域判定混淆） */}
              <div className={styles.categories} data-capability-pills>
                {resourceType === 'knowledge' && showRecentTab && (
                  <button
                    type="button"
                    aria-pressed={recentView}
                    tabIndex={recentView ? 0 : -1}
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
                    tabIndex={item.key === category && !recentView ? 0 : -1}
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

          {/* 四维度：列表整体交给 SkillListView / ExpertListView /
              ConnectorListView / KnowledgeListView（接口/分页/开关/付费
              拦截/连接流程内聚），外包停靠容器承载 Tab 轮询列表分组落点
              （子列表 flex:1 填充）；聚合视图顶部补留白对齐其他维度 */}
          <div
            className={styles['embed-list-wrap']}
            data-capability-list
            tabIndex={-1}
          >
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
              <KnowledgeListView
                className={cx(styles['embed-list'], {
                  [styles['list-enabled']]: recentView,
                })}
                type={knowledgeListType}
                keyword={keyword}
                spaceId={spaceId}
                onSelect={handleKnowledgeSelect}
              />
            )}
          </div>
        </section>
      </div>

      {/* 技能/专家的付费订阅弹窗、连接器的凭据/扫码连接弹窗均已随
          SkillListView / ExpertListView / ConnectorListView 内聚,
          弹窗内不再持有 */}
    </Modal>
  );
};

export default CapabilityModal;
