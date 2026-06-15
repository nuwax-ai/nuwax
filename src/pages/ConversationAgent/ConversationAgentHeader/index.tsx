import agentImage from '@/assets/images/agent_image.png';
import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { APPLICATION_MORE_ACTION_DETAIL } from '@/constants/space.constants';
import { dict } from '@/services/i18nRuntime';
import { PermissionsEnum } from '@/types/enums/common';
import { AgentTypeEnum, ApplicationMoreActionEnum } from '@/types/enums/space';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { FormOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, Tag } from 'antd';
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
  /** 打开展示台 */
  onToggleShowStand?: () => void;
  /** 打开版本历史 */
  onToggleVersionHistory?: () => void;
  /** 点击发布 */
  onPublish?: () => void;
  /** 更多操作 */
  onOtherAction?: (type: ApplicationMoreActionEnum) => void;
  /** 文件树侧边栏是否可见 */
  isFileTreeSidebarVisible?: boolean;
  /** 切换文件树侧边栏显隐 */
  onToggleFileTreeSidebar?: () => void;
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
  onToggleShowStand,
  onToggleVersionHistory,
  onPublish,
  onOtherAction,
  isFileTreeSidebarVisible = false,
  onToggleFileTreeSidebar,
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

  const hasPermission = (permission: PermissionsEnum) => {
    return agentConfigInfo?.permissions?.includes(permission);
  };

  /** 更多操作菜单项（与 EditAgent AgentHeader 一致） */
  const actionList = useMemo(() => {
    return APPLICATION_MORE_ACTION_DETAIL.filter((item) => {
      const type = item.type as ApplicationMoreActionEnum;

      switch (type) {
        case ApplicationMoreActionEnum.Log:
          return false;
        case ApplicationMoreActionEnum.Temporary_Session:
          return (
            hasPermission(PermissionsEnum.TempChat) &&
            agentConfigInfo?.type !== AgentTypeEnum.TaskAgent
          );
        case ApplicationMoreActionEnum.Export_Config:
          return hasPermission(PermissionsEnum.Export);
        default:
          return true;
      }
    }).map((item) => ({
      key: item.type,
      label: item.label,
    }));
  }, [agentConfigInfo]);

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'showStand',
      label: dict('PC.Pages.AgentEdit.showStand'),
    },
    {
      key: 'versionHistory',
      label: dict('PC.Pages.AgentEdit.versionHistory'),
    },
    ...actionList,
  ];

  /** 下拉菜单点击（使用 menu.onClick，避免 label 内嵌 div 点击失效） */
  const handleDropdownMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'showStand') {
      onToggleShowStand?.();
      return;
    }
    if (key === 'versionHistory') {
      onToggleVersionHistory?.();
      return;
    }
    onOtherAction?.(key as ApplicationMoreActionEnum);
  };

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
        {/* 最后更新时间显示 */}
        <div className={cx('flex', 'items-center', styles['save-time-box'])}>
          <span className={cx(styles['save-time'])}>
            {dict(
              'PC.Pages.AgentEdit.draftAutoSavedAt',
              dayjs(agentConfigInfo?.modified).format('HH:mm'),
            )}
          </span>
          {agentConfigInfo?.publishDate !== null &&
            dayjs(agentConfigInfo?.publishDate).isBefore(
              agentConfigInfo?.modified,
            ) && (
              <Tag
                bordered={false}
                color="volcano"
                className={cx(styles['volcano'])}
              >
                {dict('PC.Pages.AgentEdit.unpublishedChanges')}
              </Tag>
            )}
        </div>

        {/* 更多操作按钮 */}
        <div className={cx(styles['fold-box'])}>
          <Dropdown
            menu={{ items: dropdownItems, onClick: handleDropdownMenuClick }}
            placement="bottomLeft"
          >
            <span
              className={cx(
                'flex',
                'items-center',
                'cursor-pointer',
                styles['fold-btn'],
              )}
            >
              <SvgIcon name="icons-common-more" />
            </span>
          </Dropdown>
        </div>

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

        {/* 发布按钮 */}
        <Button
          type="primary"
          className={cx(styles['publish-btn'])}
          onClick={onPublish}
          disabled={publishDisabled}
        >
          {dict('PC.Pages.AgentEdit.publish')}
        </Button>
      </div>
    </header>
  );
};

export default ConversationAgentHeader;
