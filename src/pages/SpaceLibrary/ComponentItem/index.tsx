import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import CustomPopover from '@/components/CustomPopover';
import {
  ICON_DATABASE,
  ICON_KNOWLEDGE,
  ICON_MODEL,
  ICON_PLUGIN,
  ICON_WORKFLOW,
} from '@/constants/images.constants';
import { COMPONENT_MORE_ACTION } from '@/constants/library.constants';
import { LibraryAllTypeEnum } from '@/types/enums/space';
import type { ComponentItemProps } from '@/types/interfaces/library';
import { MoreOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { memo, useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 单个资源组件
const ComponentItem: React.FC<ComponentItemProps> = ({
  type = LibraryAllTypeEnum.Plugin,
  title,
  desc,
  img,
  onClick,
  onClickMore,
}) => {
  const info = useMemo(() => {
    switch (type) {
      case LibraryAllTypeEnum.Plugin:
        return {
          defaultImage: pluginImage,
          icon: <ICON_PLUGIN />,
          text: '插件',
        };
      case LibraryAllTypeEnum.Knowledge:
        return {
          defaultImage: knowledgeImage,
          icon: <ICON_KNOWLEDGE />,
          text: '知识库',
        };
      case LibraryAllTypeEnum.Workflow:
        return {
          defaultImage: workflowImage,
          icon: <ICON_WORKFLOW />,
          text: '工作流',
        };
      case LibraryAllTypeEnum.Database:
        return {
          defaultImage: databaseImage,
          icon: <ICON_DATABASE />,
          text: '数据库',
        };
      case LibraryAllTypeEnum.Model:
        return {
          defaultImage: databaseImage,
          icon: <ICON_MODEL />,
          text: '模型',
        };
    }
  }, [type]);

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
            {title}
          </h3>
          <p className={cx('text-ellipsis', styles.desc)}>{desc}</p>
        </div>
        <img
          className={cx(styles.img)}
          src={img || (info.defaultImage as string)}
          alt=""
        />
      </div>
      {/*插件类型*/}
      <div
        className={cx('flex', 'flex-wrap', 'items-center', styles['type-wrap'])}
      >
        <span
          className={cx(
            styles.box,
            'flex',
            'items-center',
            'content-center',
            'px-6',
          )}
        >
          {info.icon}
          <span>{info.text}</span>
        </span>
        <span
          className={cx(
            styles.box,
            'flex',
            'items-center',
            'content-center',
            'px-6',
          )}
        >
          <span>已发布</span>
        </span>
      </div>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <img className={cx(styles.img, 'radius-6')} src={img} alt="" />
        <span>admin, 最近编辑 12-05 15:34</span>
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
