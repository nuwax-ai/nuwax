import agentImage from '@/assets/images/agent_image.png';
import avatarImage from '@/assets/images/avatar.png';
import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { EVENT_TYPE } from '@/constants/event.constants';
import { ANIMATION_DURATION } from '@/constants/layout.constants';
import User from '@/layouts/DynamicMenusLayout/User';
import Message from '@/layouts/Message';
import Setting from '@/layouts/Setting';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import { TaskStatus } from '@/types/enums/agent';
import { AgentDetailDto, CustomPageNavItem } from '@/types/interfaces/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import { LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { Badge } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  history,
  matchPath,
  Outlet,
  useLocation,
  useModel,
  useParams,
  useRequest,
} from 'umi';
import ConversationItem from './ConversationItem';
import styles from './index.less';

// 绑定 classNames，便于动态样式组合
const cx = classNames.bind(styles);

/**
 * Layout 主布局组件
 * 负责响应式菜单、历史会话、消息、设置弹窗的布局与展示
 */
const BaseTemplate: React.FC = () => {
  const location = useLocation();
  const { id: cId, agentId } = useParams();
  const {
    openAdmin,
    setOpenAdmin,
    isMobile,
    setOpenMessage,
    openMessage,
    unreadCount,
    setUnreadCount,
    runNotifyMessageUnreadCount,
  } = useModel('layout');

  // 状态管理
  const { userInfo, getUserInfo } = useModel('userInfo');

  // 查询会话记录
  const {
    conversationList,
    handleConversationUpdate,
    runHistory,
    loadingHistory,
    loadingHistoryEnd,
  } = useModel('conversationHistory');

  const {
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    closeAppSidebar,
    appAgentDetail,
    createAppNewConversation,
    handleSetAppAgentDetail,
    appAgentDetailLoading,
    setAppAgentDetailLoading,
  } = useModel('useOpenApp');

  const { runTenantConfig } = useModel('tenantConfigInfo');

  // =========================== footer 渐变 ===========================
  const historyListRef = useRef<HTMLDivElement | null>(null);
  // 首次进入页面时自动打开默认导航页，仅执行一次
  const hasAutoOpenedDefaultPageRef = useRef<boolean>(false);
  // 底部渐变显示状态
  const [showFooterTopGradient, setShowFooterTopGradient] =
    useState<boolean>(false);

  /** 手机端且侧栏展开时收起侧栏（用于点主内容区、新建会话、历史项等） */
  const closeSidebarIfMobileOpen = useCallback(() => {
    if (isMobile && isAppSidebarVisible) {
      closeAppSidebar();
    }
  }, [isMobile, isAppSidebarVisible, closeAppSidebar]);

  // 是否为 Mac 系统（用于快捷键文案和按键组合判断）
  const isMacSystem = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Mac|iPhone|iPad|iPod/i.test(
      navigator.platform || navigator.userAgent,
    );
  }, []);

  /**
   * 判断历史列表是否滚动到底部：
   * - 距离底部 <= threshold => 不显示底部渐变
   * - 否则显示渐变，提示还有内容可向上浏览
   */
  const handleHistoryScroll = useCallback(() => {
    if (loadingHistory) {
      setShowFooterTopGradient(false);
      return;
    }

    const el = historyListRef.current;
    if (!el) return;

    const threshold = 2;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowFooterTopGradient(distanceFromBottom > threshold);
  }, [loadingHistory]);

  useEffect(() => {
    // 获取用户信息
    getUserInfo();

    // 租户配置信息查询接口
    runTenantConfig();

    // 查询会话记录
    runHistory({
      agentId,
      limit: 8,
    });

    /**
     * 因为在global.less中设置了最小宽度为1200px，所以需要重置为unset
     */
    document.documentElement.style.minWidth = 'unset';
  }, [agentId]);

  // 已发布的智能体详情接口
  const { run: runDetail } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    loadingDelay: 300, // 300ms内不显示loading
    onSuccess: (result: AgentDetailDto) => {
      handleSetAppAgentDetail(result);
    },
    onError: () => {
      setAppAgentDetailLoading(false);
    },
  });

  useEffect(() => {
    /**
     * 如果智能体详情不存在，则查询智能体详情
     * 扩展页面：/app/open-iframe-page/
     * 全部历史会话页面：/app/history/conversation/
     */
    if (
      !appAgentDetail &&
      (location.pathname.includes('/app/open-iframe-page/') ||
        location.pathname.includes('/app/history/conversation/'))
    ) {
      setAppAgentDetailLoading(true);
      runDetail(agentId);
    }
  }, [agentId, location.pathname, appAgentDetail]);

  // 查看全部历史会话
  const handleViewAllHistory = () => {
    closeSidebarIfMobileOpen();
    history.push(`/app/history/conversation/${agentId}`);
  };

  // 会话跳转
  const handleLink = (id: number, agentId: number) => {
    closeSidebarIfMobileOpen();
    history.push(`/app/chat/${agentId}/${id}`);
  };

  // 页面导航跳转
  const handleOpenPage = (page: CustomPageNavItem) => {
    closeSidebarIfMobileOpen();
    const url = page.path ? `${process.env.BASE_URL}${page.path}` : '';
    if (url) {
      history.push(
        `/app/open-iframe-page/${agentId}?url=${encodeURIComponent(url)}`,
      );
    }
  };

  useEffect(() => {
    // 判断当前路径是否匹配某个动态路由
    const match = matchPath('/app/:agentId', location.pathname);
    if (!match) {
      return;
    }

    // 如果搜索参数中包含params=参数，则不自动打开默认页面
    if (location.search?.includes('params=')) {
      return;
    }

    // 从缓存sessionStorage中获取是否已经自动打开过默认页面
    const routeAgentId = match.params?.agentId;
    const autoOpenStorageKey = `openApp:autoOpenedDefaultPage:${routeAgentId}`;

    // 刷新后仍然保持“仅首次执行一次”的约束
    if (sessionStorage.getItem(autoOpenStorageKey) === '1') {
      hasAutoOpenedDefaultPageRef.current = true;
      return;
    }

    // 如果智能体详情不存在，则不自动打开默认页面
    // 或者已经自动打开过默认页面，则不自动打开默认页面
    if (!appAgentDetail || hasAutoOpenedDefaultPageRef.current) {
      return;
    }

    // 如果存在默认选中页面，则自动打开
    const _customPageMenus = appAgentDetail?.customPageMenus?.find(
      (item: CustomPageNavItem) => item.selected,
    );
    if (_customPageMenus) {
      hasAutoOpenedDefaultPageRef.current = true;
      sessionStorage.setItem(autoOpenStorageKey, '1');
      handleOpenPage(_customPageMenus);
    }
  }, [appAgentDetail, location.pathname]);

  /**
   * 监听新建会话快捷键：
   * - Mac: ⌘ + J
   * - Windows: Ctrl + J
   */
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const isNKey = event.key.toLowerCase() === 'j';
      if (!isNKey) return;

      const isShortcutPressed = isMacSystem ? event.metaKey : event.ctrlKey;
      if (!isShortcutPressed) return;

      event.preventDefault();
      createAppNewConversation(agentId);
      closeSidebarIfMobileOpen();
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [
    createAppNewConversation,
    isMacSystem,
    agentId,
    closeSidebarIfMobileOpen,
  ]);

  useEffect(() => {
    // 初始化查询未读消息数量
    runNotifyMessageUnreadCount();
    // 监听新消息事件
    eventBus.on(EVENT_TYPE.NewNotifyMessage, runNotifyMessageUnreadCount);

    return () => {
      eventBus.off(EVENT_TYPE.NewNotifyMessage, runNotifyMessageUnreadCount);
      setUnreadCount(0);
    };
  }, []);

  useEffect(() => {
    // 当弹层打开时，点击 iframe 会导致 window 失焦且 activeElement 指向 iframe，
    // 这里主动关闭弹层，补齐“点击外部关闭”在 iframe 场景下的缺失。
    if (!openAdmin && !openMessage) {
      return;
    }

    const handleWindowBlur = () => {
      window.setTimeout(() => {
        const activeElement = document.activeElement;
        if (!(activeElement instanceof HTMLIFrameElement)) {
          return;
        }

        // 关闭User组件的弹窗
        if (openAdmin) {
          setOpenAdmin(false);
        }
        // 关闭消息弹窗
        if (openMessage) {
          setOpenMessage(false);
        }
      }, 0);
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => {
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [openAdmin, openMessage]);

  useEffect(() => {
    // 如果会话列表中存在执行中的会话，则监听会话状态更新事件
    const _executingConversationList = conversationList?.find(
      (item: ConversationInfo) => item.taskStatus === TaskStatus.EXECUTING,
    );

    // 如果会话列表中不存在执行中的会话，则不监听会话状态更新事件
    if (!_executingConversationList) {
      return;
    }

    // 监听会话状态更新事件
    eventBus.on(EVENT_TYPE.ChatFinished, handleConversationUpdate);

    return () => {
      eventBus.off(EVENT_TYPE.ChatFinished, handleConversationUpdate);
    };
  }, [agentId, conversationList, handleConversationUpdate]);

  // 图片错误处理
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = agentImage;
  };

  /**
   * 侧栏定位：窄屏与主 Layout 一致使用 fixed 全屏，并通过 transform 显隐；
   * 桌面端仍用样式里的宽度与 collapsed 类。
   */
  const agentSidebarStyle = useMemo<React.CSSProperties>(() => {
    if (isMobile) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100%',
        transition: `transform ${ANIMATION_DURATION}ms ease-in-out`,
        zIndex: 999,
        pointerEvents: isAppSidebarVisible ? 'auto' : 'none',
        transform: isAppSidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
        backgroundColor: '#f5f5f5',
      };
    }
    return {
      position: 'relative',
      height: '100%',
    };
  }, [isMobile, isAppSidebarVisible]);

  // 当前页面导航url
  const currentIframeUrl = useMemo(() => {
    return new URLSearchParams(location.search).get('url') || '';
  }, [location.search]);

  // 规范化url，去除末尾的/，用于判断是否为当前页面
  const normalizeActiveUrl = useCallback((url: string) => {
    return (url || '').replace(/\/+$/, '');
  }, []);

  // 打开消息弹窗
  const handleOpenMessage = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setOpenMessage(true);
  };

  // 侧栏加载态：详情未就绪时也展示 loading，避免刷新首帧闪现按钮
  const showAppSidebarLoading = appAgentDetailLoading || !appAgentDetail;

  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      {/* 侧边菜单栏区域 */}
      <div
        className={cx(styles.agentSidebarContainer, {
          [styles.agentSidebarContainerCollapsed]:
            !isAppSidebarVisible && !isMobile,
        })}
        style={agentSidebarStyle}
      >
        {/* 加载中状态 */}
        {showAppSidebarLoading ? (
          <div
            className={cx(
              'flex',
              'items-center',
              'content-center',
              'py-8',
              'flex-1',
            )}
          >
            <LoadingOutlined />
          </div>
        ) : (
          <>
            {/* 智能体图标 + 收起导航按钮 */}
            <header className={styles.sidebarTop}>
              {/* 智能体图标 + 名称 */}
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'overflow-hide',
                  styles['gap-8'],
                )}
              >
                {/* 智能体图标 */}
                <ConditionRender condition={appAgentDetail}>
                  <div className={cx(styles['logo-container'])}>
                    <img
                      src={appAgentDetail?.icon || agentImage}
                      className={cx(styles.logo)}
                      alt=""
                      onError={handleError}
                    />
                  </div>
                  <span className="text-ellipsis">{appAgentDetail?.name}</span>
                </ConditionRender>
              </div>

              {/* 收起导航按钮 */}
              <TooltipIcon
                title={dict('PC.Pages.OpenApp.collapseNav')}
                className={styles.collapseBtn}
                icon={
                  <SvgIcon
                    name="icons-nav-sidebar"
                    style={{ fontSize: 16 }}
                    onClick={toggleAppSidebarVisible}
                  />
                }
                placement="right"
              />
            </header>

            {/* 新建会话按钮 */}
            <div
              className={styles.newSessionBtn}
              onClick={() => {
                createAppNewConversation(agentId);
                closeSidebarIfMobileOpen();
              }}
            >
              <span
                className={cx(styles.newSessionText, 'flex-1', 'overflow-hide')}
              >
                <SvgIcon name="icons-nav-new_chat" style={{ fontSize: 16 }} />
                <span className="text-ellipsis">
                  {dict('PC.Pages.OpenApp.newConversation')}
                </span>
              </span>
              <div className={cx('flex', 'items-center', 'gap-4')}>
                <span className={styles.shortcutTag}>
                  {isMacSystem ? '⌘' : 'ctrl'}
                </span>
                <span className={styles.shortcutTag}>J</span>
              </div>
            </div>

            {/* 页面导航 */}
            <div className={styles.pageNavList}>
              {appAgentDetail?.customPageMenus?.map(
                (item: CustomPageNavItem, index: number) => {
                  // 获取页面url: 如果path存在，则拼接base url
                  // path: "/page/6368147380375552-1590/prod/"
                  const url = item.path
                    ? `${process.env.BASE_URL}${item.path}`
                    : '';
                  // 判断是否为当前页面
                  const isActive =
                    location.pathname.includes('/app/open-iframe-page/') &&
                    normalizeActiveUrl(currentIframeUrl) ===
                      normalizeActiveUrl(url);

                  return (
                    <div
                      key={`${item.name}-${index}`}
                      className={cx(styles.pageNavItem, {
                        [styles['page-nav-item-active']]: isActive,
                      })}
                      onClick={() => handleOpenPage(item)}
                    >
                      <SvgIcon
                        name={item.icon}
                        style={{ fontSize: 16, borderRadius: '4px' }}
                      />
                      <span className="text-ellipsis">{item.name}</span>
                    </div>
                  );
                },
              )}
            </div>

            {/* 历史会话列表区域 */}
            <div
              className={cx(
                'relative',
                'flex-1',
                'flex',
                'flex-col',
                'overflow-hide',
              )}
            >
              <>
                <div
                  className={cx(styles['history-title'], {
                    [styles['exist-page-nav']]:
                      appAgentDetail?.customPageMenus?.length > 0,
                  })}
                >
                  <span className={cx(styles.title, 'flex-1', 'overflow-hide')}>
                    <SvgIcon name="icons-nav-time" style={{ fontSize: 16 }} />
                    <span className="text-ellipsis">
                      {dict('PC.Pages.OpenApp.historyConversation')}
                    </span>
                  </span>

                  <ConditionRender condition={conversationList?.length}>
                    <span
                      className={cx(styles['more-conversation'])}
                      onClick={handleViewAllHistory}
                    >
                      {dict('PC.Pages.OpenApp.viewAll')} <RightOutlined />
                    </span>
                  </ConditionRender>
                </div>

                {/* 历史会话列表 */}
                <div
                  ref={historyListRef}
                  className={cx(
                    'flex-1',
                    'overflow-y',
                    'scroll-container',
                    styles['history-list'],
                  )}
                  onScroll={handleHistoryScroll}
                >
                  {conversationList?.length
                    ? conversationList.map(
                        (item: ConversationInfo, index: number) => (
                          <ConversationItem
                            key={item.id}
                            isActive={cId === item.id?.toString()}
                            isFirst={index === 0}
                            onClick={() => handleLink(item.id, item.agentId)}
                            name={item.topic}
                            taskStatus={item.taskStatus}
                          />
                        ),
                      )
                    : loadingHistoryEnd && (
                        <div className={cx(styles['no-used'])}>
                          {dict('PC.Pages.OpenApp.firstConversationTip')}
                        </div>
                      )}
                </div>
              </>

              {/* 底部渐变 */}
              <ConditionRender condition={showFooterTopGradient}>
                <div className={cx(styles['footer-top-gradient'])} />
              </ConditionRender>
            </div>
          </>
        )}

        {/* 用户区域，固定在底部 */}
        <User isAppDetails={true} placement="topLeft">
          <footer
            className={cx(
              'flex',
              'items-center',
              'justify-between',
              'gap-4',
              styles['user-area'],
            )}
            onClick={() => setOpenAdmin(true)}
          >
            {/* 用户头像 */}
            <div className={cx('cursor-pointer', styles['user-avatar'])}>
              <img src={userInfo?.avatar || (avatarImage as string)} alt="" />
            </div>

            {/* 用户名称 */}
            <span
              className={cx('flex-1', 'text-ellipsis', styles['user-name'])}
            >
              {userInfo?.nickName || userInfo?.userName}
            </span>

            {/* 未读消息 */}
            <Badge count={unreadCount} size="small">
              <div
                className={cx(styles['active-icon-container'])}
                onClick={handleOpenMessage}
              >
                <SvgIcon
                  name="icons-nav-notification"
                  style={{ fontSize: 16 }}
                />
              </div>
            </Badge>
          </footer>
        </User>
      </div>

      {/* 主内容区：手机端侧栏打开时点右侧主区域收起侧栏 */}
      <div
        className={cx('flex-1', 'overflow-hide')}
        onClick={closeSidebarIfMobileOpen}
      >
        <Outlet />
      </div>

      {/* 设置弹窗 */}
      <Setting />

      {/* 消息弹窗 */}
      <Message className={styles.messageContainer} />
    </div>
  );
};

export default BaseTemplate;
