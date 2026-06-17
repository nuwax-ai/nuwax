import pluginImage from '@/assets/images/plugin_image.png';
import { dict } from '@/services/i18nRuntime';
import { PermissionsEnum, PublishStatusEnum } from '@/types/enums/common';
import { PluginTypeEnum } from '@/types/enums/plugin';
import type { PluginHeaderProps } from '@/types/interfaces/plugin';
import { jumpBack } from '@/utils/router';
import {
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FormOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 测试插件头部组件
 */
const PluginHeader: React.FC<PluginHeaderProps> = ({
  pluginInfo,
  onEdit,
  onToggleHistory,
  onSave,
  onTryRun,
  onPublish,
}) => {
  const { spaceId } = useParams();

  // 发布按钮是否禁用
  const disabledBtn = useMemo(() => {
    if (pluginInfo) {
      return !pluginInfo?.permissions?.includes(PermissionsEnum.Publish);
    } else {
      return false;
    }
  }, [pluginInfo]);

  return (
    <header className={cx('flex', 'items-center', 'w-full', styles.header)}>
      <LeftOutlined
        className={cx(styles['icon-back'], 'cursor-pointer')}
        onClick={() => jumpBack(`/space/${spaceId}/library`)}
      />
      <img
        className={cx(styles.logo)}
        src={pluginInfo?.icon || (pluginImage as string)}
        alt=""
      />
      <section
        className={cx(
          'flex-1',
          'flex',
          'flex-col',
          'content-between',
          styles.section,
        )}
      >
        <div className={cx('flex', 'w-full', styles['top-box'])}>
          <h3 className={cx(styles.name, 'text-ellipsis')}>
            {pluginInfo?.name}
          </h3>
          <FormOutlined
            className={cx(styles['edit-ico'], 'cursor-pointer', 'hover-box')}
            onClick={onEdit}
          />
          {pluginInfo?.publishStatus === PublishStatusEnum.Published && (
            <CheckCircleOutlined
              className={cx(styles.circle)}
              style={{ fontSize: 16 }}
            />
          )}

          <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
            <span className={cx(styles.box)}>
              {pluginInfo?.type === PluginTypeEnum.HTTP
                ? 'http'
                : dict('PC.Pages.SpacePluginTool.PluginHeader.code')}
            </span>
            <span className={cx(styles.box)}>
              {pluginInfo?.publishStatus === PublishStatusEnum.Published
                ? dict('PC.Pages.SpacePluginTool.PluginHeader.published')
                : dict('PC.Pages.SpacePluginTool.PluginHeader.unpublished')}
            </span>
          </div>
        </div>
      </section>
      <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
        <span className={cx(styles['update-time'])}>
          {dict(
            'PC.Pages.SpacePluginTool.PluginHeader.configSavedAt',
            dayjs(pluginInfo?.modified).format('HH:mm'),
          )}
        </span>

        <span>
          {/* 发布时间，如果不为空，与当前modified时间做对比，如果发布时间小于modified，则前端显示：有更新未发布 */}
          {pluginInfo?.publishDate !== null &&
            dayjs(pluginInfo?.publishDate).isBefore(pluginInfo?.modified) && (
              <Tag bordered={false} color="volcano" style={{ marginRight: 0 }}>
                {dict(
                  'PC.Pages.SpacePluginTool.PluginHeader.updateUnpublished',
                )}
              </Tag>
            )}
        </span>
      </div>
      <ClockCircleOutlined
        className={cx(styles.history, 'cursor-pointer')}
        onClick={onToggleHistory}
      />
      <Button className={cx(styles['try-btn'])} type="primary" onClick={onSave}>
        {dict('PC.Common.Global.save')}
      </Button>
      <Button
        className={cx(styles['try-btn'])}
        type="primary"
        icon={<CaretRightOutlined />}
        onClick={onTryRun}
      >
        {dict('PC.Pages.SpacePluginTool.PluginHeader.tryRun')}
      </Button>
      <Button type="primary" onClick={onPublish} disabled={disabledBtn}>
        {dict('PC.Pages.SpacePluginTool.PluginHeader.publish')}
      </Button>
    </header>
  );
};

export default PluginHeader;
