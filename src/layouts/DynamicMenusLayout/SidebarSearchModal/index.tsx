/**
 * 侧栏搜索弹窗（命令面板）
 * @description 主导航改造：顶栏「搜索」icon / ⌘K 打开。参考 Codex 命令面板形态：
 * 搜索输入 + 筛选 tab（全部/任务/操作）+ 最近任务（会话，接口 topic 搜索）
 * + 建议（新任务/打开工作空间/设置）+ 面板（切换侧边栏 ⌘B）。
 * 支持 ↑/↓ 选择、Enter 确认、Esc 关闭。
 */
import SvgIcon from '@/components/base/SvgIcon';
import useConversation from '@/hooks/useConversation';
import { MenuEnabledEnum } from '@/pages/SystemManagement/MenuPermission/types/menu-manage';
import { apiAgentConversationList } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import type { MenuItemDto } from '@/types/interfaces/menu';
import { isMac } from '@/utils/nuwaClawBridge';
import type { InputRef } from 'antd';
import { Input, Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useModel } from 'umi';
import { formatModifiedTime } from '../NewHomeSection/utils';
import { useSidebarCollapse } from '../useSidebarCollapse';
import styles from './index.less';

const cx = classNames.bind(styles);

const MOD_KEY = isMac() ? '⌘' : 'Ctrl';
const RECENT_LIMIT = 8;
const SEARCH_LIMIT = 20;

type SearchTab = 'all' | 'task' | 'action';

interface ConversationLike {
  id?: string | number;
  topic?: string;
  modified?: string;
  agentId?: string | number;
  agent?: { name?: string };
  devTargetType?: string;
  devTargetId?: string | number;
  devSpaceId?: string | number;
}

interface ActionItem {
  key: string;
  label: string;
  icon: string;
  shortcut?: string;
  run: () => void;
}

const SidebarSearchModal: React.FC = () => {
  const { openSearchModal, setOpenSearchModal, setOpenSetting } =
    useModel('layout');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { firstLevelMenus } = useModel('menuModel');
  const { handleCreateConversation } = useConversation();
  const { toggleCollapse } = useSidebarCollapse();
  const inputRef = useRef<InputRef>(null);

  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [recentList, setRecentList] = useState<ConversationLike[]>([]);
  const [resultList, setResultList] = useState<ConversationLike[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  /** 关弹窗 */
  const closeModal = useCallback(
    () => setOpenSearchModal(false),
    [setOpenSearchModal],
  );

  /** 打开时重置并拉取最近任务 */
  useEffect(() => {
    if (!openSearchModal) return;
    setKeyword('');
    setActiveTab('all');
    setSelectedIdx(0);
    setResultList([]);
    apiAgentConversationList({
      agentId: null,
      lastId: null,
      limit: RECENT_LIMIT,
    })
      .then((res) => setRecentList((res.data ?? []) as ConversationLike[]))
      .catch(() => setRecentList([]));
    setTimeout(() => inputRef.current?.focus(), 120);
  }, [openSearchModal]);

  // 关键词搜索（500ms 防抖）
  useEffect(() => {
    if (!openSearchModal) return;
    if (!keyword) {
      setResultList([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      apiAgentConversationList({
        agentId: null,
        lastId: null,
        limit: SEARCH_LIMIT,
        topic: keyword,
      })
        .then((res) => setResultList((res.data ?? []) as ConversationLike[]))
        .catch(() => setResultList([]))
        .finally(() => setSearching(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, openSearchModal]);

  /** 任务点击跳转（对齐 NewHomeSection 会话点击的分发逻辑） */
  const goConversation = useCallback(
    (item: ConversationLike) => {
      closeModal();
      const { id, agentId, devTargetType, devTargetId, devSpaceId } = item;
      if (devTargetType === 'Agent' && devSpaceId && id) {
        history.push(
          `/space/${devSpaceId}/agent-dev?agentId=${devTargetId}&conversationId=${id}`,
        );
      } else if (devTargetType === 'PageApp' && devSpaceId && devTargetId) {
        history.push(`/space/${devSpaceId}/app-dev/${devTargetId}`);
      } else if (devTargetType === 'UserApp' && devSpaceId && devTargetId) {
        // 全栈应用会话：跳全栈应用开发详情页，conversationId 用于恢复该会话
        history.push(
          `/space/${devSpaceId}/app-pro?appId=${devTargetId}&conversationId=${id}`,
        );
      } else {
        history.push('/home/chat/' + id + '/' + agentId);
      }
    },
    [closeModal],
  );

  /**
   * 工作空间入口是否对当前用户开放：与侧栏一致，以后端菜单树为准
   * （动态菜单 code=workspace / 静态菜单 code=space，且处于启用状态）。
   * 菜单未下发工作空间时（无权限租户），命令面板不再提供直跳入口，
   * 避免 URL 直达绕过菜单权限。
   */
  const hasWorkspaceMenu = useMemo(
    () =>
      firstLevelMenus.some(
        (menu: MenuItemDto) =>
          menu.status === MenuEnabledEnum.Enabled &&
          (menu.code === 'workspace' || menu.code === 'space'),
      ),
    [firstLevelMenus],
  );

  /** 操作项（建议 + 面板） */
  const actions = useMemo<ActionItem[]>(() => {
    const createTask = () => {
      closeModal();
      if (tenantConfigInfo) {
        handleCreateConversation(tenantConfigInfo.defaultAgentId);
      } else {
        history.push('/home');
      }
    };
    const list: ActionItem[] = [
      {
        key: 'new-task',
        label: dict(
          'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.actionNewTask',
        ),
        icon: 'icons-nav-new_chat',
        shortcut: `${MOD_KEY}N`,
        run: createTask,
      },
    ];
    if (hasWorkspaceMenu) {
      list.push({
        key: 'open-workspace',
        label: dict(
          'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.actionOpenWorkspace',
        ),
        icon: 'icons-nav-workspace',
        run: () => {
          closeModal();
          history.push('/space');
        },
      });
    }
    list.push({
      key: 'setting',
      label: dict(
        'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.actionSetting',
      ),
      icon: 'icons-nav-settings',
      run: () => {
        closeModal();
        setOpenSetting(true);
      },
    });
    return list;
  }, [
    closeModal,
    handleCreateConversation,
    setOpenSetting,
    tenantConfigInfo,
    hasWorkspaceMenu,
  ]);

  const panelActions = useMemo<ActionItem[]>(
    () => [
      {
        key: 'toggle-sidebar',
        label: dict(
          'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.panelToggleSidebar',
        ),
        icon: 'icons-common-caret_left',
        shortcut: `${MOD_KEY}B`,
        run: () => {
          closeModal();
          // 走统一入口：移动端切抽屉、桌面端折叠（含偏好持久化）
          toggleCollapse();
        },
      },
    ],
    [closeModal, toggleCollapse],
  );

  /** 当前 tab 下的平铺条目（键盘导航用） */
  const taskList = keyword ? resultList : recentList;
  const showTasks = activeTab !== 'action';
  const showActions = activeTab !== 'task';

  const flatItems = useMemo(() => {
    const items: Array<
      | { kind: 'task'; item: ConversationLike }
      | { kind: 'action'; action: ActionItem }
    > = [];
    if (showTasks) {
      taskList.forEach((item) => items.push({ kind: 'task', item }));
    }
    if (showActions) {
      actions.forEach((action) => items.push({ kind: 'action', action }));
      panelActions.forEach((action) => items.push({ kind: 'action', action }));
    }
    return items;
  }, [showTasks, showActions, taskList, actions, panelActions]);

  useEffect(() => setSelectedIdx(0), [keyword, activeTab]);

  const activate = useCallback(
    (idx: number) => {
      const entry = flatItems[idx];
      if (!entry) return;
      if (entry.kind === 'task') {
        goConversation(entry.item);
      } else {
        entry.action.run();
      }
    },
    [flatItems, goConversation],
  );

  /** 输入框键盘：↑/↓ 选择、Enter 确认 */
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      activate(selectedIdx);
    }
  };

  /** ⌘K 开关弹窗、⌘B 切换侧边栏（弹窗打开时） */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key?.toLowerCase();
      if (key === 'k') {
        e.preventDefault();
        setOpenSearchModal(!openSearchModal);
      } else if (key === 'b' && openSearchModal) {
        e.preventDefault();
        // 走统一入口：移动端切抽屉、桌面端折叠（含偏好持久化）
        toggleCollapse();
        closeModal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSearchModal, setOpenSearchModal, toggleCollapse, closeModal]);

  const renderTaskRow = (item: ConversationLike) => {
    const idx = flatItems.findIndex(
      (entry) => entry.kind === 'task' && entry.item === item,
    );
    return (
      <div
        key={item.id}
        className={cx(styles.row, { [styles.rowActive]: selectedIdx === idx })}
        onClick={() => goConversation(item)}
        onMouseEnter={() => setSelectedIdx(idx)}
      >
        <span className={cx(styles.rowIcon)}>
          <SvgIcon name="icons-nav-history-conversation" />
        </span>
        <span className={cx(styles.rowLabel)}>{item.topic || '--'}</span>
        <span className={cx(styles.rowTime)}>
          {formatModifiedTime(item.modified)}
        </span>
      </div>
    );
  };

  const renderActionRow = (action: ActionItem) => {
    const idx = flatItems.findIndex(
      (entry) => entry.kind === 'action' && entry.action.key === action.key,
    );
    return (
      <div
        key={action.key}
        className={cx(styles.row, { [styles.rowActive]: selectedIdx === idx })}
        onClick={() => action.run()}
        onMouseEnter={() => setSelectedIdx(idx)}
      >
        <span className={cx(styles.rowIcon)}>
          <SvgIcon name={action.icon} />
        </span>
        <span className={cx(styles.rowLabel)}>{action.label}</span>
        {action.shortcut && (
          <span className={cx(styles.rowTime)}>{action.shortcut}</span>
        )}
      </div>
    );
  };

  return (
    <Modal
      open={openSearchModal}
      onCancel={closeModal}
      footer={null}
      closable={false}
      width={640}
      style={{ top: 80 }}
      styles={{ body: { padding: 0 } }}
      destroyOnClose
    >
      <div className={cx(styles.container)}>
        <div className={cx(styles['input-wrap'])}>
          <Input
            ref={inputRef}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={dict(
              'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.placeholder',
            )}
            allowClear
            bordered={false}
          />
        </div>

        <div className={cx(styles.tabs)}>
          {(
            [
              ['all', 'tabAll'],
              ['task', 'tabTask'],
              ['action', 'tabAction'],
            ] as Array<[SearchTab, string]>
          ).map(([key, i18nKey]) => (
            <button
              key={key}
              type="button"
              className={cx(styles.tab, {
                [styles.tabActive]: activeTab === key,
              })}
              onClick={() => setActiveTab(key)}
            >
              {dict(
                `PC.Layouts.DynamicMenusLayout.SidebarSearchModal.${i18nKey}`,
              )}
            </button>
          ))}
        </div>

        <div className={cx(styles.body)}>
          {showTasks && (
            <>
              <div className={cx(styles.sectionTitle)}>
                {dict(
                  keyword
                    ? 'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.sectionResult'
                    : 'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.sectionRecent',
                )}
              </div>
              {searching ? (
                <div className={cx(styles.empty)}>
                  <Spin size="small" />
                </div>
              ) : taskList.length ? (
                taskList.map(renderTaskRow)
              ) : (
                <div className={cx(styles.empty)}>
                  {dict(
                    'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.empty',
                  )}
                </div>
              )}
            </>
          )}

          {showActions && (
            <>
              <div className={cx(styles.sectionTitle)}>
                {dict(
                  'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.sectionSuggest',
                )}
              </div>
              {actions.map(renderActionRow)}
              <div className={cx(styles.sectionTitle)}>
                {dict(
                  'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.sectionPanel',
                )}
              </div>
              {panelActions.map(renderActionRow)}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SidebarSearchModal;
