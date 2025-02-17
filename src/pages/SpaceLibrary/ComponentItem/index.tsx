import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import ConditionRender from '@/components/ConditionRender';
import CustomPopover from '@/components/CustomPopover';
import {
  ICON_DATABASE,
  ICON_KNOWLEDGE,
  ICON_MODEL,
  ICON_PLUGIN,
  ICON_WORKFLOW,
} from '@/constants/images.constants';
import { COMPONENT_MORE_ACTION } from '@/constants/library.constants';
import { PublishStatusEnum } from '@/types/enums/common';
import { ComponentTypeEnum } from '@/types/enums/space';
import type { ComponentItemProps } from '@/types/interfaces/library';
import { CheckCircleTwoTone, MoreOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import moment from 'moment';
import React, { memo, useMemo } from 'react';
import BoxInfo from './BoxInfo';
import styles from './index.less';

const cx = classNames.bind(styles);

// 单个资源组件
const ComponentItem: React.FC<ComponentItemProps> = ({
  componentInfo,
  onClick,
  onClickMore,
}) => {
  const info = useMemo(() => {
    switch (componentInfo.type) {
      case ComponentTypeEnum.Plugin:
        return {
          defaultImage: pluginImage,
          icon: <ICON_PLUGIN />,
          text: '插件',
        };
      case ComponentTypeEnum.Knowledge:
        return {
          defaultImage: knowledgeImage,
          icon: <ICON_KNOWLEDGE />,
          text: '知识库',
        };
      case ComponentTypeEnum.Workflow:
        return {
          defaultImage: workflowImage,
          icon: <ICON_WORKFLOW />,
          text: '工作流',
        };
      case ComponentTypeEnum.Database:
        return {
          defaultImage: databaseImage,
          icon: <ICON_DATABASE />,
          text: '数据库',
        };
      // todo
      case ComponentTypeEnum.Model:
        return {
          defaultImage: databaseImage,
          icon: <ICON_MODEL />,
          text: '模型',
        };
    }
  }, [componentInfo]);

  return (
    <div
      className={cx(
        styles.container,
        'py-12',
        'radius-6',
        'flex',
        'flex-col',
        'content-between',
        'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className={cx('flex', 'content-between', styles.header)}>
        <div
          className={cx(
            'flex-1',
            'flex',
            'flex-col',
            'content-around',
            'overflow-hide',
          )}
        >
          <h3 className={cx('text-ellipsis', styles['plugin-name'])}>
            {componentInfo.name}
          </h3>
          <p className={cx('text-ellipsis', styles.desc)}>
            {componentInfo.description}
          </p>
        </div>
        <img
          className={cx(styles.img)}
          src={componentInfo.icon || (info.defaultImage as string)}
          alt=""
        />
      </div>
      {/*插件类型*/}
      <div
        className={cx('flex', 'flex-wrap', 'items-center', styles['type-wrap'])}
      >
        <BoxInfo icon={info.icon} text={info.text} />
        {componentInfo.publishStatus === PublishStatusEnum.Published && (
          <>
            <BoxInfo text="已发布" />
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </>
        )}
      </div>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <ConditionRender condition={componentInfo.icon}>
          <img
            className={cx(styles.img, 'radius-6')}
            src={componentInfo.icon}
            alt=""
          />
        </ConditionRender>
        <div className={cx('flex-1', 'flex', 'item-center')}>
          <div className={cx(styles.nickname, 'text-ellipsis')}>
            {componentInfo.creator?.nickName}
          </div>
          <span>
            最近编辑 {moment(componentInfo.modified).format('MM-DD HH:mm')}
          </span>
        </div>
        <CustomPopover list={COMPONENT_MORE_ACTION} onClick={onClickMore}>
          <span
            className={cx(
              styles['icon-box'],
              'flex',
              'content-center',
              'items-center',
              'hover-box',
            )}
          >
            <MoreOutlined />
          </span>
        </CustomPopover>
      </div>
    </div>
  );
};

export default memo(ComponentItem);
