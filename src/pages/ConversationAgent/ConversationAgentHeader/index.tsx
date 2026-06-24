import agentImage from '@/assets/images/agent_image.png';
import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { PermissionsEnum } from '@/types/enums/common';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { CodeOutlined, FormOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { history, useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const defaultAgentIcon = agentImage as string;

/** 图片加载失败时使用默认图标 */
const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = defaultAgentIcon;
};

export interface ConversationAgentHeaderProps {
  /** 外层容器类名 */
  className?: string;
  /** 是否隐藏返回箭头 */
  hideBack?: boolean;
  /** 智能体配置信息 */
  agentConfigInfo?: AgentConfigInfo;
  /** 编辑智能体 */
  onEditAgent?: () => void;
  /** 点击发布 */
  onPublish?: () => void;
  /** 打开高级设置（新窗口打开智能体编辑页） */
  onOpenAdvancedSettings?: () => void;
  /** 文件树侧边栏是否可见 */
  isFileTreeSidebarVisible?: boolean;
  /** 切换文件树侧边栏显隐 */
  onToggleFileTreeSidebar?: () => void;
  /** 终端面板是否处于右侧全屏展开 */
  isTerminalPanelOpen?: boolean;
  /** 打开终端面板（底部控制台终端 Tab 全屏） */
  onOpenTerminalPanel?: () => void;
  /** 是否显示智能体电脑入口 */
  isShowDesktop?: boolean;
  /** 智能体电脑是否已打开 */
  isAgentDesktopOpen?: boolean;
  /** 打开 / 关闭智能体电脑 */
  onOpenDesktopPanel?: () => void;
}

/**
 * ConversationAgent 页面顶部 Header
 */
const ConversationAgentHeader: React.FC<ConversationAgentHeaderProps> = ({
  className,
  hideBack = false,
  agentConfigInfo,
  onEditAgent,
  onPublish,
  onOpenAdvancedSettings,
  isFileTreeSidebarVisible = false,
  onToggleFileTreeSidebar,
  isTerminalPanelOpen = false,
  onOpenTerminalPanel,
  isShowDesktop = false,
  isAgentDesktopOpen = false,
  onOpenDesktopPanel,
}) => {
  const { spaceId } = useParams();

  const displayName =
    agentConfigInfo?.name || dict('PC.Pages.ConversationAgent.prototypeTitle');

  /** 发布按钮是否禁用 */
  const publishDisabled = useMemo(() => {
    if (agentConfigInfo) {
      return !agentConfigInfo.permissions?.includes(PermissionsEnum.Publish);
    }
    return false;
  }, [agentConfigInfo]);

  return (
    <header
      className={cx(
        'flex',
        'items-center',
        'relative',
        styles.header,
        className,
      )}
    >
      {/* 返回按钮 */}
      <ConditionRender condition={!hideBack}>
        <SvgIcon
          name="icons-nav-backward"
          className={cx(styles['icon-backward'])}
          onClick={() => {
            history.push(`/space/${spaceId}/develop`);
          }}
        />
      </ConditionRender>

      {/* 智能体头像 */}
      <img
        className={cx(styles.avatar, { [styles['hide-back']]: hideBack })}
        src={agentConfigInfo?.icon || defaultAgentIcon}
        alt=""
        onError={handleError}
      />

      {/* 智能体信息 */}
      <div className={cx('flex', 'items-center', styles['header-info'])}>
        <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
          {displayName}
        </h3>

        {/* 编辑按钮 */}
        <ConditionRender condition={!!agentConfigInfo}>
          <Button
            type="text"
            icon={<FormOutlined />}
            className={cx(styles['edit-ico'])}
            onClick={onEditAgent}
          />
        </ConditionRender>
      </div>

      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        {/* 未发布变更提示 */}
        {agentConfigInfo?.publishDate !== null &&
          dayjs(agentConfigInfo?.publishDate).isBefore(
            agentConfigInfo?.modified,
          ) && (
            <Tag
              bordered={false}
              color="volcano"
              className={cx(styles['publish-status-tag'])}
            >
              {dict('PC.Pages.AgentEdit.unpublishedChanges')}
            </Tag>
          )}

        {/* 高级设置 */}
        {onOpenAdvancedSettings && (
          <TooltipIcon
            title={dict('PC.Components.ModelSetting.advancedSettings')}
            className={cx(styles['panel-btn'])}
            icon={<SettingOutlined style={{ fontSize: 16 }} />}
            onClick={onOpenAdvancedSettings}
          />
        )}

        {/* 文件树侧边栏按钮 */}
        <TooltipIcon
          title={
            isFileTreeSidebarVisible
              ? dict('PC.Components.FilePathHeader.collapseFileTree')
              : dict('PC.Components.FilePathHeader.expandFileTree')
          }
          className={cx(styles['panel-btn'], {
            [styles.active]: isFileTreeSidebarVisible,
          })}
          icon={
            <SvgIcon
              name="icons-common-file_preview"
              style={{ fontSize: 16 }}
            />
          }
          onClick={onToggleFileTreeSidebar}
        />

        {/* 终端按钮 */}
        <TooltipIcon
          title={dict('PC.Pages.ConversationAgentTabPicker.terminal')}
          ariaLabel={dict('PC.Pages.ConversationAgentTabPicker.terminal')}
          className={cx(styles['panel-btn'], {
            [styles.active]: isTerminalPanelOpen,
          })}
          icon={<CodeOutlined style={{ fontSize: 16 }} />}
          onClick={onOpenTerminalPanel}
        />

        {/* 智能体电脑按钮 */}
        <ConditionRender condition={isShowDesktop}>
          <TooltipIcon
            title={
              isAgentDesktopOpen
                ? dict(
                    'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.closeAgentDesktop',
                  )
                : dict(
                    'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.openAgentDesktop',
                  )
            }
            className={cx(styles['panel-btn'], {
              [styles.active]: isAgentDesktopOpen,
            })}
            icon={
              <SvgIcon
                name="icons-nav-computer-star"
                style={{ fontSize: 16 }}
              />
            }
            onClick={onOpenDesktopPanel}
          />
        </ConditionRender>

        {/* 发布按钮 */}
        <Button type="primary" onClick={onPublish} disabled={publishDisabled}>
          {dict('PC.Pages.AgentEdit.publish')}
        </Button>
      </div>
    </header>
  );
};

export default ConversationAgentHeader;
