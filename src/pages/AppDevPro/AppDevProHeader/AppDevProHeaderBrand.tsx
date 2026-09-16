import agentImage from '@/assets/images/agent_image.png';
import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import { dict } from '@/services/i18nRuntime';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import { FormOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { history } from 'umi';
import CreateUserApp from '../components/CreateUserApp';
import type { UserAppInfo } from '../type';
import styles from './index.less';

const cx = classNames.bind(styles);

const defaultAppIcon = agentImage as string;

/** 图片加载失败时使用默认图标 */
const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = defaultAppIcon;
};

export interface AppDevProHeaderBrandProps {
  /** 外层容器类名 */
  className?: string;
  /** 是否隐藏返回箭头 */
  hideBack?: boolean;
  /** 全栈应用详情 */
  userAppInfo?: UserAppInfo | null;
  /** 空间 ID（创建应用时使用） */
  spaceId?: number;
  /** 全栈应用 ID（返回项目详情页） */
  appId?: number;
  /** 更新应用成功 */
  onConfirmUpdate?: (info: UserAppInfo) => void;
}

/**
 * AppDevPro 左栏顶部：返回、应用头像、应用名称、编辑入口与发布状态。
 *
 * @param props.hideBack 是否隐藏返回箭头
 * @param props.userAppInfo 全栈应用详情
 * @param props.spaceId 空间 ID
 * @param props.onConfirmUpdate 更新应用成功回调
 * @returns 左栏应用信息头部
 */
const AppDevProHeaderBrand: React.FC<AppDevProHeaderBrandProps> = ({
  className,
  hideBack = false,
  userAppInfo,
  spaceId,
  appId,
  onConfirmUpdate,
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

  /**
   * 返回应用项目详情页。
   * 不用 history.back()：预览 iframe 内跳转可能污染浏览器历史栈。
   */
  const handleBack = useCallback(() => {
    const targetSpaceId = spaceId ?? userAppInfo?.spaceId;
    const targetAppId = appId ?? userAppInfo?.id;
    if (targetSpaceId && targetAppId) {
      history.push(
        `/space/${targetSpaceId}/app-project-detail/${targetAppId}`,
      );
      return;
    }
    if (targetSpaceId) {
      history.push(`/space/${targetSpaceId}/project-manage`);
      return;
    }
    history.back();
  }, [appId, spaceId, userAppInfo?.id, userAppInfo?.spaceId]);

  const showUnpublishedTag =
    !!userAppInfo &&
    userAppInfo.publishStatus !== PublishStatusEnum.Published &&
    !userAppInfo.buildVersions?.length;

  return (
    <>
      <header className={cx('flex', 'items-center', styles.header, className)}>
        {/* 返回按钮 */}
        <ConditionRender condition={!hideBack}>
          <SvgIcon
            name="icons-nav-backward"
            className={cx(styles['icon-backward'])}
            onClick={handleBack}
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

          {/* 未发布：标题后显示发布状态 */}
          {showUnpublishedTag && (
            <Tag
              bordered={false}
              color="volcano"
              className={cx(styles['publish-status-tag'])}
            >
              {dict('PC.Common.Global.unpublished')}
            </Tag>
          )}
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

export default AppDevProHeaderBrand;
