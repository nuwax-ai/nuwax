import agentImage from '@/assets/images/agent_image.png';
import avatarImage from '@/assets/images/avatar.png';
import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { MOBILE_BREAKPOINT } from '@/constants/layout.constants';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import ConversationItem from '@/layouts/DynamicMenusLayout/HomeSection/ConversationItem';
import User from '@/layouts/DynamicMenusLayout/User';
import Setting from '@/layouts/Setting';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import {
  ClockCircleOutlined,
  EllipsisOutlined,
  LoadingOutlined,
  PlusCircleOutlined,
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
import styles from './index.less';

// 绑定 classNames，便于动态样式组合
const cx = classNames.bind(styles);

/**
 * Layout 主布局组件
 * 负责响应式菜单、历史会话、消息、设置弹窗的布局与展示
 */
const BaseTemplate: React.FC = () => {
  const { id: cId, agentId } = useParams();
  // 导航风格管理（使用统一主题系统）
  const { navigationStyle, layoutStyle } = useUnifiedTheme();
  const { isSecondMenuCollapsed, setOpenAdmin, setIsMobile } =
    useModel('layout');
  // 状态管理
  const { userInfo, getUserInfo } = useModel('userInfo');

  // 查询会话记录
  const { conversationList, runHistory, loadingHistory, loadingHistoryEnd } =
    useModel('conversationHistory');

  const {
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    setIsAppSidebarMode,
    appAgentDetail,
  } = useModel('useOpenApp');

  // =========================== footer 渐变 ===========================
  const historyListRef = useRef<HTMLDivElement | null>(null);
  // 底部渐变显示状态
  const [showFooterTopGradient, setShowFooterTopGradient] =
    useState<boolean>(true);
  // const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);

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

  /**
   * 检查是否为移动端设备
   * 使用 useCallback 优化，避免重复创建函数
   */
  const checkIsMobile = useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  useEffect(() => {
    // 获取用户信息
    getUserInfo();

    // 查询会话记录
    runHistory({
      agentId,
      limit: 20,
    });
  }, [agentId]);

  /**
   * 监听窗口尺寸变化，判断是否为移动端
   * 使用防抖优化性能
   */
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkIsMobile, 100); // 100ms 防抖
    };

    window.addEventListener('resize', handleResize);
    checkIsMobile(); // 初始化判断

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [checkIsMobile]);

  /**
   * 主容器样式类名（使用独立的布局风格类）
   * 包含导航风格和布局风格类
   */
  const mainContainerClassName = useMemo(
    () =>
      cx(
        'flex',
        'h-full',
        styles.container,
        `xagi-layout-${layoutStyle}`, // 布局风格类（独立于Ant Design）
        `xagi-nav-${navigationStyle}`, // 导航风格类
      ),
    [layoutStyle, navigationStyle],
  );

  /**
   * 页面容器样式类名（使用独立的布局风格类）
   * 根据导航风格动态调整
   */
  const pageContainerClassName = useMemo(
    () =>
      cx(
        'flex-1',
        styles[
          `xagi-layout-${isSecondMenuCollapsed ? 'collapsed' : 'expanded'}`
        ],
        styles['page-container'],
        styles[`xagi-layout-${layoutStyle}`],
        styles[`xagi-nav-${navigationStyle}`],
      ),
    [layoutStyle, navigationStyle, isSecondMenuCollapsed],
  );

  // 新建会话
  const handleNewSession = useCallback(() => {
    history.push(`/app/details/${agentId}`);
  }, [agentId]);

  // 查看全部历史会话
  const handleViewAllHistory = () => {
    history.push(`/app/history/conversation/${agentId}`);
  };

  // 会话跳转
  const handleLink = (id: number, agentId: number) => {
    history.push(`/app/chat/${id}/${agentId}`);
  };

  // 设置为初始化应用侧边栏模式（默认是关闭的）
  useEffect(() => {
    setIsAppSidebarMode(true);
  }, []);

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
      handleNewSession();
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [handleNewSession, isMacSystem]);

  // 图片错误处理
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = agentImage;
  };

  return (
    <div className={mainContainerClassName}>
      {/* 侧边菜单栏区域 */}
      <div
        className={cx(styles.agentSidebarContainer, {
          [styles.agentSidebarContainerCollapsed]: !isAppSidebarVisible,
        })}
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
            title="收起导航"
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
        <button
          className={styles.newSessionBtn}
          type="button"
          onClick={handleNewSession}
        >
          <span className={styles.newSessionText}>
            <PlusCircleOutlined />
            新建会话
          </span>
          <div className={cx('flex', 'items-center', 'gap-4')}>
            <span className={styles.shortcutTag}>
              {!isMacSystem ? '⌘' : 'ctrl'}
            </span>
            <span className={styles.shortcutTag}>J</span>
          </div>
        </button>

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
                <span className={cx(styles.title)}>
                  <ClockCircleOutlined />
                  历史会话
                </span>

                <ConditionRender condition={conversationList?.length}>
                  <span
                    className={cx(styles['more-conversation'])}
                    onClick={handleViewAllHistory}
                  >
                    查看全部 <RightOutlined />
                  </span>
                </ConditionRender>
              </div>

              {/* 历史会话列表 */}
              <div
                ref={historyListRef}
                className={cx('flex-1', 'overflow-y')}
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
                        <div className={cx(styles['no-used'])}>右边看👉</div>
                        <div className={cx(styles['no-used'])}>
                          在会话框中输入指令开始你的第一次会话吧～
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
          <User>
            <EllipsisOutlined className={styles.moreIcon} />
          </User>
        </footer>
      </div>

      {/* 主内容区 */}
      <div
        className={`${pageContainerClassName} scroll-container`}
        id="page-container-selector"
      >
        {/* <header
          className={cx(styles.contentHeader, {
            [styles.contentHeaderVisible]: !isSidebarVisible,
          })}
        >
          <div className={styles.contentHeaderLeft}>
            <ConditionRender condition={!!tenantConfigInfo?.siteLogo}>
              <div className={cx(styles['logo-container'])}>
                <img
                  src={tenantConfigInfo?.siteLogo}
                  className={cx(styles.logo)}
                  alt=""
                />
              </div>
            </ConditionRender>
          </div>
          <Tooltip title="展开导航" placement="bottom">
            <button
              type="button"
              className={styles.expandBtn}
              onClick={toggleSidebarVisible}
            >
              <SvgIcon name="icons-nav-sidebar" style={{ fontSize: 16 }} />
            </button>
          </Tooltip>
        </header> */}
        <Outlet />
      </div>

      {/* 设置弹窗 */}
      <Setting />
    </div>
  );
};

export default BaseTemplate;
