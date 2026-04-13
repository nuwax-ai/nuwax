import agentImage from '@/assets/images/agent_image.png';
import avatarImage from '@/assets/images/avatar.png';
import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { ANIMATION_DURATION } from '@/constants/layout.constants';
import User from '@/layouts/DynamicMenusLayout/User';
import Setting from '@/layouts/Setting';
import { dict } from '@/services/i18nRuntime';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  EllipsisOutlined,
  LoadingOutlined,
  RightOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, Outlet, useModel, useParams } from 'umi';
import ConversationItem from './ConversationItem';
import styles from './index.less';

// 绑定 classNames，便于动态样式组合
const cx = classNames.bind(styles);

/**
 * Layout 主布局组件
 * 负责响应式菜单、历史会话、消息、设置弹窗的布局与展示
 */
const BaseTemplate: React.FC = () => {
  const { id: cId, agentId } = useParams();
  const { setOpenAdmin, isMobile } = useModel('layout');
  // 状态管理
  const { userInfo, getUserInfo } = useModel('userInfo');

  // 查询会话记录
  const { conversationList, runHistory, loadingHistory, loadingHistoryEnd } =
    useModel('conversationHistory');

  const {
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    closeAppSidebar,
    appAgentDetail,
    createAppNewConversation,
  } = useModel('useOpenApp');

  const { runTenantConfig } = useModel('tenantConfigInfo');

  /** 手机端且侧栏展开时收起侧栏（用于点主内容区、新建会话、历史项等） */
  const closeSidebarIfMobileOpen = useCallback(() => {
    if (isMobile && isAppSidebarVisible) {
      closeAppSidebar();
    }
  }, [isMobile, isAppSidebarVisible, closeAppSidebar]);

  // =========================== footer 渐变 ===========================
  const historyListRef = useRef<HTMLDivElement | null>(null);
  // 底部渐变显示状态
  const [showFooterTopGradient, setShowFooterTopGradient] =
    useState<boolean>(false);

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
        {/* 智能体图标 + 收起导航按钮 */}
        <div className={styles.sidebarTop}>
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
          </ConditionRender>
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
        </div>

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
          {loadingHistory ? (
            <div
              className={cx('flex', 'items-center', 'content-center', 'h-full')}
            >
              <LoadingOutlined />
            </div>
          ) : (
            <>
              <div className={cx(styles['history-title'])}>
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
                      <>
                        <div className={cx(styles['no-used'])}>
                          {dict('PC.Pages.OpenApp.lookRight')}
                        </div>
                        <div className={cx(styles['no-used'])}>
                          {dict('PC.Pages.OpenApp.firstConversationTip')}
                        </div>
                      </>
                    )}
              </div>
            </>
          )}

          {/* 底部渐变 */}
          <ConditionRender condition={showFooterTopGradient}>
            <div className={cx(styles['footer-top-gradient'])} />
          </ConditionRender>
        </div>

        {/* 用户区域，固定在底部 */}
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
          <div className={cx('cursor-pointer', styles['user-avatar'])}>
            <img src={userInfo?.avatar || (avatarImage as string)} alt="" />
          </div>
          <span className={cx('flex-1', 'text-ellipsis', styles['user-name'])}>
            {userInfo?.nickName || userInfo?.userName}
          </span>
          <User isAppDetails={true}>
            <EllipsisOutlined className={styles.moreIcon} />
          </User>
        </footer>
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
    </div>
  );
};

export default BaseTemplate;
