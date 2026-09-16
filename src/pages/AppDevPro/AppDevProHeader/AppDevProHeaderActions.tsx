import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { PublishStatusEnum } from '@/types/enums/common';
import { CodeOutlined } from '@ant-design/icons';
import { Button, Dropdown, MenuProps, Segmented, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import DatabaseGlyph from '../components/DatabaseGlyph';
import { UserAppDbEnvEnum } from '../services/appDb';
import type { UserAppInfo } from '../type';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevProHeaderActionsProps {
  /** 外层容器类名 */
  className?: string;
  /** 全栈应用详情 */
  userAppInfo?: UserAppInfo | null;
  /** 点击部署 */
  onPublish?: () => void;
  /** 点击发布：直接打开发布到广场 / 空间弹窗 */
  onOpenMarketPublish?: () => void;
  /** 部署进行中（构建 / 生产部署） */
  publishing?: boolean;
  /** 进行中的远程构建任务：按钮展示应用发布中，点击取消 */
  remotePublishing?: boolean;
  /** 取消远程构建 */
  onCancelRemotePublish?: () => void;
  /** 取消远程构建 loading */
  cancelRemotePublishLoading?: boolean;
  /** 文件树侧边栏是否可见 */
  isFileTreeSidebarVisible?: boolean;
  /** 切换文件树侧边栏显隐 */
  onToggleFileTreeSidebar?: () => void;
  /** 终端面板是否处于右侧全屏展开 */
  isTerminalPanelOpen?: boolean;
  /** 打开终端面板（底部控制台终端 Tab 全屏） */
  onOpenTerminalPanel?: () => void;
  /** 打开域名绑定弹窗（线上环境更多菜单） */
  onOpenDomainBinding?: () => void;
  /** 数据库页签是否处于激活状态 */
  isDatabasePanelOpen?: boolean;
  /** 打开 / 关闭数据库工作区（再次点击还原打开前状态） */
  onOpenDatabase?: () => void;
  /** 是否显示远程桌面入口（仅开发环境） */
  isShowDesktop?: boolean;
  /** 远程桌面是否已打开 */
  isAgentDesktopOpen?: boolean;
  /** 打开 / 关闭远程桌面 */
  onOpenDesktopPanel?: () => void;
  /** 是否显示应用预览入口（线上环境未部署时无可预览地址） */
  isShowAppPreview?: boolean;
  /** 应用预览页签是否处于激活状态 */
  isAppPreviewOpen?: boolean;
  /** 打开应用预览页签 */
  onOpenAppPreview?: () => void;
  /** 构建包版本记录侧栏是否打开 */
  isBuildVersionRecordsOpen?: boolean;
  /** 切换构建包版本记录侧栏显隐 */
  onToggleBuildVersionRecords?: () => void;
  /** 发布版本记录侧栏是否打开 */
  isPublishVersionRecordsOpen?: boolean;
  /** 切换发布版本记录侧栏显隐 */
  onTogglePublishVersionRecords?: () => void;
  /** 当前环境 */
  env?: UserAppDbEnvEnum;
  /** 切换开发 / 线上环境 */
  onEnvChange?: (env: UserAppDbEnvEnum) => void;
}

/**
 * AppDevPro 右栏顶部：环境切换、工作区图标入口与部署 / 发布按钮。
 *
 * @param props 右栏头部属性
 * @returns 右栏操作头部
 */
const AppDevProHeaderActions: React.FC<AppDevProHeaderActionsProps> = ({
  className,
  userAppInfo,
  onPublish,
  onOpenMarketPublish,
  publishing = false,
  remotePublishing = false,
  onCancelRemotePublish,
  cancelRemotePublishLoading = false,
  isFileTreeSidebarVisible = false,
  onToggleFileTreeSidebar,
  isTerminalPanelOpen = false,
  onOpenTerminalPanel,
  onOpenDomainBinding,
  isDatabasePanelOpen = false,
  onOpenDatabase,
  isShowDesktop = false,
  isAgentDesktopOpen = false,
  onOpenDesktopPanel,
  isShowAppPreview = true,
  isAppPreviewOpen = false,
  onOpenAppPreview,
  isBuildVersionRecordsOpen = false,
  onToggleBuildVersionRecords,
  isPublishVersionRecordsOpen = false,
  onTogglePublishVersionRecords,
  env = UserAppDbEnvEnum.Dev,
  onEnvChange,
}) => {
  const handlePublishClick = useCallback(() => {
    if (remotePublishing) {
      onCancelRemotePublish?.();
      return;
    }
    onPublish?.();
  }, [onCancelRemotePublish, onPublish, remotePublishing]);

  /** 部署与发布只在开发环境操作 */
  const isDevEnv = env === UserAppDbEnvEnum.Dev;
  /** 已部署到生产环境后才可发布到广场 / 空间 */
  const showMarketPublish = userAppInfo?.prodDeployed === true;
  /** 已发布到广场 / 空间后才展示发布版本记录 */
  const showPublishVersionRecords =
    userAppInfo?.publishStatus === PublishStatusEnum.Published;

  const envOptions = useMemo(
    () => [
      {
        label: dict('PC.Pages.AppDevPro.devEnv'),
        value: UserAppDbEnvEnum.Dev,
      },
      {
        label: dict('PC.Pages.AppDevPro.onlineEnv'),
        value: UserAppDbEnvEnum.Prod,
      },
    ],
    [],
  );

  const handleEnvChange = useCallback(
    (value: UserAppDbEnvEnum) => {
      onEnvChange?.(value);
    },
    [onEnvChange],
  );

  /** 线上环境更多菜单：域名绑定、构建包版本记录、发布版本记录（已发布时） */
  const prodMoreMenuItems = useMemo<MenuProps['items']>(
    () => [
      {
        key: 'domainBinding',
        label: (
          <div onClick={onOpenDomainBinding}>
            {dict('PC.Pages.AppDevPro.domainBinding')}
          </div>
        ),
      },
      {
        key: 'buildVersionRecords',
        label: (
          <div onClick={onToggleBuildVersionRecords}>
            {dict('PC.Pages.AppDevPro.buildVersionRecords')}
          </div>
        ),
      },
      ...(showPublishVersionRecords
        ? [
            {
              key: 'publishVersionRecords',
              label: (
                <div onClick={onTogglePublishVersionRecords}>
                  {dict('PC.Pages.AppDevPro.publishVersionRecords')}
                </div>
              ),
            },
          ]
        : []),
    ],
    [
      onOpenDomainBinding,
      onToggleBuildVersionRecords,
      onTogglePublishVersionRecords,
      showPublishVersionRecords,
    ],
  );

  const isProdMoreMenuActive =
    isBuildVersionRecordsOpen || isPublishVersionRecordsOpen;

  return (
    <header className={cx('flex', 'items-center', styles.header, className)}>
      {/* 环境切换：开发 / 线上始终展示，图标入口仍按当前环境显隐 */}
      <Segmented
        className={cx(styles['env-switch'], styles.segmented)}
        options={envOptions}
        value={env}
        onChange={(value) => handleEnvChange(value as UserAppDbEnvEnum)}
      />

      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        {/* 线上环境更多：域名绑定 / 构建包版本记录 / 发布版本记录 */}
        <ConditionRender condition={env === UserAppDbEnvEnum.Prod}>
          <div className={cx(styles['fold-box'])}>
            <Dropdown menu={{ items: prodMoreMenuItems }} placement="bottomLeft">
              <span
                className={cx(
                  'flex',
                  'items-center',
                  'cursor-pointer',
                  styles['fold-btn'],
                  {
                    [styles.active]: isProdMoreMenuActive,
                  },
                )}
              >
                <SvgIcon name="icons-common-more" />
              </span>
            </Dropdown>
          </div>
        </ConditionRender>

        {/* 数据库工作区：管理页 + 配置页 */}
        <TooltipIcon
          title={dict('PC.Pages.AppDevPro.database')}
          ariaLabel={dict('PC.Pages.AppDevPro.database')}
          className={cx(styles['panel-btn'], {
            [styles.active]: isDatabasePanelOpen,
          })}
          icon={<DatabaseGlyph size={16} />}
          onClick={onOpenDatabase}
        />

        {/* 文件树：仅开发环境。线上环境无沙箱文件树，入口一并隐藏 */}
        <ConditionRender condition={env === UserAppDbEnvEnum.Dev}>
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
        </ConditionRender>

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

        {/* 应用预览页签：线上环境未部署时无预览地址，入口隐藏 */}
        <ConditionRender condition={isShowAppPreview}>
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
        </ConditionRender>

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

        {/* 部署按钮：仅开发环境。远程构建中可点击取消，本地部署仅展示 loading */}
        <ConditionRender condition={isDevEnv}>
          <Tooltip
            title={
              remotePublishing
                ? dict('PC.Pages.AppDevPro.clickToCancelPublish')
                : undefined
            }
          >
            <span>
              <Button
                type="primary"
                onClick={handlePublishClick}
                loading={
                  remotePublishing ? cancelRemotePublishLoading : publishing
                }
              >
                {remotePublishing
                  ? dict('PC.Pages.AppDevPro.appPublishing')
                  : dict('PC.Pages.AppDevPro.deploy')}
              </Button>
            </span>
          </Tooltip>
        </ConditionRender>

        {/* 发布：仅开发环境，且已部署到生产环境后可发布到广场 / 空间 */}
        <ConditionRender condition={isDevEnv && showMarketPublish}>
          <Button onClick={onOpenMarketPublish}>
            {dict('PC.Pages.AppDevPro.publishToMarket')}
          </Button>
        </ConditionRender>
      </div>
    </header>
  );
};

export default AppDevProHeaderActions;
