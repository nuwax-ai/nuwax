import agentImage from '@/assets/images/agent_image.png';
import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import {
  CodeOutlined,
  DatabaseOutlined,
  FormOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { history } from 'umi';
import CreateUserApp from '../components/CreateUserApp';
import { UserAppDbEnvEnum } from '../services/appDb';
import type { UserAppInfo } from '../type';
import styles from './index.less';

const cx = classNames.bind(styles);

const defaultAppIcon = agentImage as string;

/** 图片加载失败时使用默认图标 */
const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = defaultAppIcon;
};

export interface AppDevProHeaderProps {
  /** 外层容器类名 */
  className?: string;
  /** 是否隐藏返回箭头 */
  hideBack?: boolean;
  /** 全栈应用详情 */
  userAppInfo?: UserAppInfo | null;
  /** 空间 ID（创建应用时使用） */
  spaceId?: number;
  /** 更新应用成功 */
  onConfirmUpdate?: (info: UserAppInfo) => void;
  /** 点击发布 */
  onPublish?: () => void;
  /** 发布进行中（构建 / 提交申请） */
  publishing?: boolean;
  /** 文件树侧边栏是否可见 */
  isFileTreeSidebarVisible?: boolean;
  /** 切换文件树侧边栏显隐 */
  onToggleFileTreeSidebar?: () => void;
  /** 终端面板是否处于右侧全屏展开 */
  isTerminalPanelOpen?: boolean;
  /** 打开终端面板（底部控制台终端 Tab 全屏） */
  onOpenTerminalPanel?: () => void;
  /** 打开项目设置弹窗 */
  onOpenSettings?: () => void;
  /** 数据库页签是否处于激活状态 */
  isDatabasePanelOpen?: boolean;
  /** 打开数据库页签 */
  onOpenDatabase?: () => void;
  /** 是否显示远程桌面入口（仅开发环境） */
  isShowDesktop?: boolean;
  /** 远程桌面是否已打开 */
  isAgentDesktopOpen?: boolean;
  /** 打开 / 关闭远程桌面 */
  onOpenDesktopPanel?: () => void;
  /** 应用预览页签是否处于激活状态 */
  isAppPreviewOpen?: boolean;
  /** 打开应用预览页签 */
  onOpenAppPreview?: () => void;
  /** 当前环境 */
  env?: UserAppDbEnvEnum;
  /** 切换开发 / 线上环境 */
  onEnvChange?: (env: UserAppDbEnvEnum) => void;
}

/**
 * AppDevPro 页面顶部 Header
 */
const AppDevProHeader: React.FC<AppDevProHeaderProps> = ({
  className,
  hideBack = false,
  userAppInfo,
  spaceId,
  onConfirmUpdate,
  onPublish,
  publishing = false,
  isFileTreeSidebarVisible = false,
  onToggleFileTreeSidebar,
  isTerminalPanelOpen = false,
  onOpenTerminalPanel,
  onOpenSettings,
  isDatabasePanelOpen = false,
  onOpenDatabase,
  isShowDesktop = false,
  isAgentDesktopOpen = false,
  onOpenDesktopPanel,
  isAppPreviewOpen = false,
  onOpenAppPreview,
  env = UserAppDbEnvEnum.Dev,
  onEnvChange,
}) => {
  const [editOpen, setEditOpen] = useState(false);

  const displayName =
    userAppInfo?.name || dict('PC.Pages.ConversationAgent.prototypeTitle');

  const handleOpenEdit = useCallback(() => {
    setEditOpen(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditOpen(false);
  }, []);

  const handleConfirmUpdate = useCallback(
    (info: UserAppInfo) => {
      setEditOpen(false);
      onConfirmUpdate?.(info);
    },
    [onConfirmUpdate],
  );

  /** 发布按钮是否禁用 */
  const publishDisabled = useMemo(() => {
    if (!userAppInfo || publishing) {
      return true;
    }
    return userAppInfo.publishStatus === PublishStatusEnum.Applying;
  }, [publishing, userAppInfo]);

  const showUnpublishedTag =
    !!onPublish &&
    !!userAppInfo &&
    userAppInfo.publishStatus !== PublishStatusEnum.Published &&
    userAppInfo.publishStatus !== PublishStatusEnum.Applying;

  const handleSelectDevEnv = useCallback(() => {
    onEnvChange?.(UserAppDbEnvEnum.Dev);
  }, [onEnvChange]);

  const handleSelectProdEnv = useCallback(() => {
    onEnvChange?.(UserAppDbEnvEnum.Prod);
  }, [onEnvChange]);

  return (
    <>
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
            history.back();
          }}
        />
      </ConditionRender>

      {/* 应用头像 */}
      <img
        className={cx(styles.avatar, { [styles['hide-back']]: hideBack })}
        src={userAppInfo?.icon || defaultAppIcon}
        alt=""
        onError={handleError}
      />

      {/* 应用信息 */}
      <div className={cx('flex', 'items-center', styles['header-info'])}>
        <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
          {displayName}
        </h3>

        {/* 编辑按钮 */}
        <ConditionRender condition={!!userAppInfo}>
          <Button
            type="text"
            icon={<FormOutlined />}
            className={cx(styles['edit-ico'])}
            onClick={handleOpenEdit}
          />
        </ConditionRender>
      </div>

      {/* 环境切换：样式对齐 MCP 编辑页中间菜单 */}
      <div
        className={cx(
          'flex',
          'items-center',
          'content-center',
          styles['env-switch'],
        )}
      >
        <div
          className={cx('cursor-pointer', styles['env-item'], {
            [styles.active]: env === UserAppDbEnvEnum.Dev,
          })}
          onClick={handleSelectDevEnv}
        >
          {dict('PC.Pages.AppDevPro.devEnv')}
        </div>
        <div
          className={cx('cursor-pointer', styles['env-item'], {
            [styles.active]: env === UserAppDbEnvEnum.Prod,
          })}
          onClick={handleSelectProdEnv}
        >
          {dict('PC.Pages.AppDevPro.onlineEnv')}
        </div>
      </div>

      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        {/* 未发布变更提示 */}
        {showUnpublishedTag && (
          <Tag
            bordered={false}
            color="volcano"
            className={cx(styles['publish-status-tag'])}
          >
            {dict('PC.Pages.AgentEdit.unpublishedChanges')}
          </Tag>
        )}

        {/* 项目设置：始终显示 */}
        <TooltipIcon
          title={dict('PC.Pages.AppDevEditorHeaderRight.settings')}
          className={cx(styles['panel-btn'])}
          icon={<SettingOutlined style={{ fontSize: 16 }} />}
          onClick={onOpenSettings}
        />

        {/* 数据库页签 */}
        <TooltipIcon
          title={dict('PC.Pages.AppDevPro.database')}
          ariaLabel={dict('PC.Pages.AppDevPro.database')}
          className={cx(styles['panel-btn'], {
            [styles.active]: isDatabasePanelOpen,
          })}
          icon={<DatabaseOutlined style={{ fontSize: 16 }} />}
          onClick={onOpenDatabase}
        />

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

        {/* 终端按钮（再次点击收起，active 态由父组件互斥控制） */}
        <TooltipIcon
          title={dict('PC.Pages.ConversationAgentTabPicker.terminal')}
          ariaLabel={dict('PC.Pages.ConversationAgentTabPicker.terminal')}
          className={cx(styles['panel-btn'], {
            [styles.active]: isTerminalPanelOpen,
          })}
          icon={<CodeOutlined style={{ fontSize: 16 }} />}
          onClick={onOpenTerminalPanel}
        />

        {/* 应用预览页签 */}
        <TooltipIcon
          title={dict('PC.Pages.AppDevPro.appPreview')}
          ariaLabel={dict('PC.Pages.AppDevPro.appPreview')}
          className={cx(styles['panel-btn'], {
            [styles.active]: isAppPreviewOpen,
          })}
          icon={
            <SvgIcon name="icons-common-preview" style={{ fontSize: 16 }} />
          }
          onClick={onOpenAppPreview}
        />

        {/* 远程桌面：仅开发环境显示，交互对齐 ConversationAgent */}
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
        <Button
          type="primary"
          onClick={onPublish}
          loading={publishing}
          disabled={publishDisabled}
        >
          {publishing
            ? dict('PC.Pages.AppDevHeader.publishing')
            : dict('PC.Pages.AgentEdit.publish')}
        </Button>
      </div>
    </header>

    <CreateUserApp
      open={editOpen}
      mode={CreateUpdateModeEnum.Update}
      spaceId={spaceId ?? userAppInfo?.spaceId}
      userAppInfo={userAppInfo}
      onCancel={handleCancelEdit}
      onConfirmUpdate={handleConfirmUpdate}
    />
    </>
  );
};

export default AppDevProHeader;
