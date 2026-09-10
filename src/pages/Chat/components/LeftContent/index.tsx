import SvgIcon from '@/components/base/SvgIcon';
import FileTreePreviewPanel, {
  type FileTreePreviewPanelProps,
} from '@/components/business-component/FileTreePreviewPanel';
import UnifiedChatSession from '@/components/business-component/UnifiedChatSession';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import ConversationSearchPanel from '@/pages/Chat/components/ConversationSearchPanel';
import DropdownChangeName from '@/pages/Chat/components/DropdownChangeName';
import { t } from '@/services/i18nRuntime';
import { AgentTypeEnum } from '@/types/enums/space';
import { CodeOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface LeftContentProps {
  isFileTreeVisible: boolean;
  effectiveAgent: any;
  isAppSidebarMode: boolean;
  headerProps: any;
  chatSessionProps: any;
  fileSidebarProps: FileTreePreviewPanelProps;
}

// 内容区域
const LeftContent: React.FC<LeftContentProps> = ({
  isFileTreeVisible,
  effectiveAgent,
  isAppSidebarMode,
  headerProps,
  chatSessionProps,
  fileSidebarProps,
}) => {
  return (
    <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
      {/* 页面顶部: 标题区域 */}
      <header className={cx(styles['title-box'])}>
        <div
          className={cx(styles['title-container'], {
            [styles['title-container-collapsed']]: isAppSidebarMode,
          })}
        >
          <div className={cx('flex', 'items-center', 'gap-4')}>
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

            {/* 这里放可以展开 AgentSidebar 的控制按钮 在AgentSidebar 展示的时候隐藏 反之显示 */}
            {/* 当文件树显示时，也显示这个按钮，用于关闭文件树并打开 AgentSidebar */}
            {headerProps.showSidebar &&
              !isAppSidebarMode &&
              !headerProps.isSidebarVisible && (
                <TooltipIcon
                  title={t('PC.Pages.Chat.viewAgentDetails')}
                  className={cx(styles['icon-box'])}
                  icon={
                    <SvgIcon
                      name="icons-nav-sidebar"
                      style={{ fontSize: 16 }}
                    />
                  }
                  onClick={() => {
                    headerProps.hidePagePreview();
                    // 先关闭文件树
                    headerProps.closePreviewView();
                    // 然后打开 AgentSidebar
                    // 使用 setTimeout 确保状态更新完成后再打开，避免状态冲突
                    setTimeout(() => {
                      headerProps.sidebarRef.current?.open();
                    }, 100);
                  }}
                />
              )}

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
                    headerProps.sidebarRef.current?.close();
                    headerProps.closePreviewView(); // 关闭文件树
                    headerProps.handleOpenPreview(effectiveAgent);
                  }}
                />
              )}

            {/* 通用智能体, 有有效消息时，文件预览/智能体电脑切换按钮 */}
            {headerProps.isShowFilePanel && (
              <>
                {/* 文件预览视图；hideTree 时隐藏文件树图标 */}
                {!headerProps.hideTree && (
                  <TooltipIcon
                    title={
                      headerProps.isFileTreeIconActive
                        ? t('PC.Pages.Chat.closeFilePreview')
                        : t('PC.Pages.Chat.openFilePreview')
                    }
                    className={cx(styles['icon-box'], {
                      [styles['active']]: headerProps.isFileTreeIconActive,
                    })}
                    icon={
                      <SvgIcon
                        name="icons-common-file_preview"
                        style={{ fontSize: 16 }}
                      />
                    }
                    onClick={headerProps.handleFileTreeVisible}
                  />
                )}

                {/* 终端视图；hideTerminal 时隐藏终端图标 */}
                {!headerProps.hideTerminal && (
                  <TooltipIcon
                    title={t(
                      'PC.Components.ConversationBottomConsole.tabTerminal',
                    )}
                    className={cx(styles['icon-box'], {
                      [styles['active']]: headerProps.isTerminalIconActive,
                    })}
                    icon={<CodeOutlined style={{ fontSize: 16 }} />}
                    onClick={headerProps.handleOpenTerminalPanel}
                  />
                )}

                {/* 智能体电脑视图：仅云端电脑 + 未隐藏远程桌面时展示 */}
                <ConditionRender condition={headerProps.isShowDesktop}>
                  <TooltipIcon
                    title={
                      headerProps.isDesktopIconActive
                        ? t('PC.Pages.Chat.closeAgentDesktop')
                        : t('PC.Pages.Chat.openAgentDesktop')
                    }
                    className={cx(styles['icon-box'], {
                      [styles['active']]: headerProps.isDesktopIconActive,
                    })}
                    icon={
                      <SvgIcon
                        name="icons-nav-computer-star"
                        style={{ fontSize: 16 }}
                      />
                    }
                    onClick={headerProps.handleOpenDesktopView}
                  />
                </ConditionRender>
              </>
            )}

            {/* 会话内搜索：有会话记录时显示（详情里已有会话记录时展示搜索图标） */}
            {!!headerProps.searchHasMessages && (
              <TooltipIcon
                title={t('PC.Pages.Chat.searchMessages')}
                className={cx(styles['icon-box'])}
                icon={
                  <ConversationSearchPanel
                    conversationId={headerProps.searchConversationId}
                    hasMessages={headerProps.searchHasMessages}
                  />
                }
              />
            )}

            {/* 自定义右侧控件插槽（例如发布组件） */}
            {headerProps.renderHeaderRight?.({ effectiveAgent })}
          </div>
        </div>
      </header>

      {/* 页面主体: 内容区域 */}
      <div className={cx(styles['main-content-box'])}>
        {/* 聊天内容区域 */}
        <div
          className={cx(styles['chat-section'], {
            [styles['file-tree-visible']]: isFileTreeVisible,
          })}
        >
          <UnifiedChatSession
            {...chatSessionProps}
            showClearIcon={
              effectiveAgent?.deviceAgent !== 1 && !headerProps.hideNew
            }
          />
        </div>

        {/* 通用型(TaskAgent)智能体专用文件树区域；hideTree 时不展示 */}
        {effectiveAgent?.type === AgentTypeEnum.TaskAgent &&
          isFileTreeVisible &&
          !headerProps.hideTree && (
            <div
              className={cx(
                styles['file-tree-sidebar'],
                'flex',
                'w-full',
                'overflow-hide',
              )}
            >
              <FileTreePreviewPanel
                {...fileSidebarProps}
                className={cx(
                  styles['file-tree-container'],
                  fileSidebarProps.className,
                )}
              />
            </div>
          )}
      </div>
    </div>
  );
};

export default LeftContent;
