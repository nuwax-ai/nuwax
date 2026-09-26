import SvgIcon from '@/components/base/SvgIcon';
import ConversationPanelActions from '@/components/business-component/ConversationPanelActions';
import ExternalFilePreview from '@/components/business-component/ExternalFilePreview';
import FileTreePreviewPanel, {
  type FileTreePreviewPanelProps,
} from '@/components/business-component/FileTreePreviewPanel';
import UnifiedChatSession from '@/components/business-component/UnifiedChatSession';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import ResizableSplit from '@/components/ResizableSplit';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import DropdownChangeName from '@/pages/Chat/components/DropdownChangeName';
import { t } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import { ThemeNavigationStyleType } from '@/types/enums/theme';
import {
  loadChatPanelWidthPercent,
  saveChatPanelWidthPercent,
} from '@/utils/chatPanelWidthPreference';
import { isImmersiveShell } from '@/utils/hostBridge';
import classNames from 'classnames';
import React, { useState } from 'react';
import ConversationInstanceCacheSlot from '../ConversationInstanceCacheSlot';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 工作区外沙箱文件的独立预览目标（非空时右侧面板切换为独立预览） */
export interface ExternalFilePreviewTarget {
  cId: number;
  targetDir: string;
  relativePath: string;
}

interface LeftContentProps {
  pageCacheKey: string;
  isFileTreeVisible: boolean;
  effectiveAgent: any;
  isAppSidebarMode: boolean;
  headerProps: any;
  chatSessionProps: any;
  fileSidebarProps: FileTreePreviewPanelProps;
  externalFilePreview?: ExternalFilePreviewTarget | null;
  /** 退出工作区外文件独立预览，右侧面板回落工作区文件树 */
  onExternalFilePreviewBack?: () => void;
  /** 会话进度面板节点：挂 left 栏与 chat-section 平级（页面层组装数据与受控态） */
  chatPaneCapsule?: React.ReactNode;
}

// 内容区域
const LeftContent: React.FC<LeftContentProps> = ({
  pageCacheKey,
  isFileTreeVisible,
  effectiveAgent,
  isAppSidebarMode,
  headerProps,
  chatSessionProps,
  fileSidebarProps,
  externalFilePreview,
  onExternalFilePreviewBack,
  chatPaneCapsule,
}) => {
  const { effectiveNavigationStyle } = useUnifiedTheme();
  const alignBrowserStyle3Title =
    effectiveNavigationStyle === ThemeNavigationStyleType.STYLE3 &&
    !isImmersiveShell();
  // 拖拽分栏默认宽度（持久化偏好，仅作 ResizableSplit 初始值）
  const [chatPanelWidth] = useState<number>(loadChatPanelWidthPercent);

  // 右侧面板（文件树/终端/云电脑）渲染条件：通用型智能体 + 面板可见 + 未隐藏
  const showFileTreePanel =
    effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
    isFileTreeVisible &&
    !headerProps.hideTree;

  return (
    <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
      {/* 页面顶部: 标题区域 */}
      <header className={cx(styles['title-box'])}>
        <div
          className={cx(styles['title-container'], {
            [styles['title-container-collapsed']]: isAppSidebarMode,
          })}
        >
          <div
            className={cx('flex', 'items-center', 'gap-4', {
              [styles['browser-style3-title-leading']]: alignBrowserStyle3Title,
            })}
          >
            {/* 应用智能体模式下，显示内容导航按钮；hideMenu 时隐藏展开导航图标 */}
            <ConditionRender
              condition={
                isAppSidebarMode &&
                !headerProps.isAppSidebarVisible &&
                !headerProps.hideMenu
              }
            >
              <TooltipIcon
                title={t('PC.Pages.Chat.expandNavigation')}
                className={cx(styles['icon-box'])}
                icon={
                  <SvgIcon
                    name="icons-nav-sidebar"
                    style={{ fontSize: 16 }}
                    onClick={headerProps.toggleAppSidebarVisible}
                  />
                }
              />
            </ConditionRender>

            {/* 新建会话；hideNew 时隐藏新建会话图标 */}
            <ConditionRender
              condition={
                isAppSidebarMode &&
                !headerProps.isAppSidebarVisible &&
                !headerProps.hideNew
              }
            >
              <TooltipIcon
                title={t('PC.Pages.Chat.newConversation')}
                className={cx(styles['icon-box'])}
                icon={
                  <SvgIcon
                    name="icons-nav-new_chat"
                    style={{ fontSize: 16 }}
                    onClick={() =>
                      headerProps.createAppNewConversation(headerProps.agentId)
                    }
                  />
                }
              />
            </ConditionRender>
            {/* 下拉重命名会话、删除会话；hideTitle 时隐藏会话主题 */}
            {!headerProps.hideTitle &&
              (headerProps.renderTitle ? (
                headerProps.renderTitle({ effectiveAgent, isAppSidebarMode })
              ) : (
                <DropdownChangeName
                  agentId={headerProps.agentId}
                  conversationInfo={headerProps.conversationInfo}
                  setConversationInfo={headerProps.setConversationInfo}
                  isAppSidebarMode={isAppSidebarMode}
                />
              ))}
          </div>

          <div className={cx('flex', 'items-center', 'gap-4')}>
            {/* 需付费订阅的智能体：打开订阅套餐 */}
            {headerProps.isEnableSubscription &&
              effectiveAgent?.paymentRequired &&
              !isAppSidebarMode && (
                <TooltipIcon
                  title={t('PC.Components.ConversationDetails.paidSubscribe')}
                  className={cx(styles['icon-box'])}
                  icon={
                    <SvgIcon
                      name="icons-nav-wodedingyue"
                      style={{ fontSize: 16 }}
                    />
                  }
                  onClick={() => headerProps.setOpenPaymentModal(true)}
                />
              )}

            <ConversationPanelActions
              iconClassName={styles['icon-box']}
              activeClassName={styles.active}
              progress={
                headerProps.hasCapsuleContent && !isAppSidebarMode
                  ? {
                      open: headerProps.isCapsulePanelOpen,
                      running: headerProps.capsuleRunning,
                      onClick: headerProps.handleToggleCapsulePanel,
                    }
                  : undefined
              }
              detail={
                headerProps.showSidebar && !isAppSidebarMode
                  ? {
                      open: headerProps.isAgentDetailModalOpen,
                      onClick: headerProps.handleOpenAgentDetail,
                    }
                  : undefined
              }
            />

            {/*打开预览页面*/}
            {!!effectiveAgent?.expandPageArea &&
              !!effectiveAgent?.pageHomeIndex && (
                <TooltipIcon
                  title={t('PC.Pages.Chat.openPreviewPage')}
                  className={cx(styles['icon-box'])}
                  icon={
                    <SvgIcon
                      name="icons-nav-ecosystem"
                      style={{ fontSize: 16 }}
                    />
                  }
                  onClick={() => {
                    headerProps.closePreviewView(); // 关闭文件树
                    headerProps.handleOpenPreview(effectiveAgent);
                  }}
                />
              )}

            <ConversationPanelActions
              iconClassName={styles['icon-box']}
              activeClassName={styles.active}
              files={
                headerProps.isShowFilePanel &&
                headerProps.showFilePreview &&
                !headerProps.hideTree
                  ? {
                      open: headerProps.isFileTreeIconActive,
                      onClick: headerProps.handleFileTreeVisible,
                      title: t(
                        headerProps.isFileTreeIconActive
                          ? 'PC.Pages.Chat.closeArtifacts'
                          : 'PC.Pages.Chat.openArtifacts',
                      ),
                    }
                  : undefined
              }
              terminal={
                headerProps.isShowFilePanel && !headerProps.hideTerminal
                  ? {
                      open: headerProps.isTerminalIconActive,
                      onClick: headerProps.handleOpenTerminalPanel,
                    }
                  : undefined
              }
              desktop={
                headerProps.isShowFilePanel && headerProps.isShowDesktop
                  ? {
                      open: headerProps.isDesktopIconActive,
                      onClick: headerProps.handleOpenDesktopView,
                    }
                  : undefined
              }
            />

            {/* 会话内搜索入口暂时移除（ConversationSearchPanel 组件保留，恢复时在此回挂） */}

            {/* 自定义右侧控件插槽（例如发布组件） */}
            {headerProps.renderHeaderRight?.({ effectiveAgent })}
          </div>
        </div>
      </header>

      {/* 页面主体: 内容区域（聊天区 vs 右侧面板可拖拽调宽，宽度持久化） */}
      <div className={cx(styles['main-content-box'])}>
        <ResizableSplit
          className={cx('flex-1')}
          minLeftWidth={430}
          minRightWidth={420}
          defaultLeftWidth={chatPanelWidth}
          onResizeEnd={saveChatPanelWidthPercent}
          left={
            <div className={cx(styles['chat-pane'])}>
              <div className={cx(styles['chat-section'])}>
                <UnifiedChatSession
                  {...chatSessionProps}
                  showClearIcon={
                    effectiveAgent?.deviceAgent !== 1 && !headerProps.hideNew
                  }
                />
              </div>
              {/* 会话进度面板：挂 left 栏与 chat-section 平级，定位/容器查询上下文 = chat-pane */}
              {chatPaneCapsule}
            </div>
          }
          rightHidden={!showFileTreePanel}
          right={
            <ConversationInstanceCacheSlot
              activeKey={pageCacheKey}
              active={showFileTreePanel}
              retain={showFileTreePanel}
              exclusive={fileSidebarProps.viewMode === 'desktop'}
              testId="conversation-workspace-cache"
            >
              <div
                className={cx(
                  styles['file-tree-sidebar'],
                  'flex',
                  'w-full',
                  'overflow-hide',
                )}
              >
                {externalFilePreview ? (
                  <ExternalFilePreview
                    className={cx(styles['file-tree-container'])}
                    cId={externalFilePreview.cId}
                    targetDir={externalFilePreview.targetDir}
                    relativePath={externalFilePreview.relativePath}
                    onBack={onExternalFilePreviewBack}
                  />
                ) : (
                  <FileTreePreviewPanel
                    {...fileSidebarProps}
                    className={cx(
                      styles['file-tree-container'],
                      fileSidebarProps.className,
                    )}
                  />
                )}
              </div>
            </ConversationInstanceCacheSlot>
          }
        />
      </div>
    </div>
  );
};

export default LeftContent;
