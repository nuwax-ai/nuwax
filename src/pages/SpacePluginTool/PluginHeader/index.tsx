import pluginImage from '@/assets/images/plugin_image.png';
import { PublishStatusEnum } from '@/types/enums/common';
import { PluginTypeEnum } from '@/types/enums/plugin';
import type { PluginHeaderProps } from '@/types/interfaces/plugin';
import {
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
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
  const handleBack = () => {
    history.back();
  };
  return (
    <header className={cx('flex', 'items-center', 'w-full', styles.header)}>
      <LeftOutlined
        className={cx(styles['icon-back'], 'cursor-pointer')}
        onClick={handleBack}
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
        <div className={cx('flex', styles['top-box'])}>
          <h3 className={cx(styles.name)}>{pluginInfo?.name}</h3>
          <EditOutlined
            className={cx('cursor-pointer', 'hover-box')}
            onClick={onEdit}
          />
          <CheckCircleOutlined className={cx(styles.circle)} />
        </div>
        <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
          <span className={cx(styles.box)}>
            {pluginInfo?.type === PluginTypeEnum.HTTP ? 'http' : '代码'}
          </span>
          <span className={cx(styles.box)}>
            {pluginInfo?.publishStatus === PublishStatusEnum.Published
              ? '已发布'
              : '未发布'}
          </span>
          <span className={cx(styles['update-time'])}>
            配置自动保存于{moment(pluginInfo?.created).format('HH:mm')}
          </span>
        </div>
      </section>
      <ClockCircleOutlined
        className={cx(styles.history, 'cursor-pointer')}
        onClick={onToggleHistory}
      />
      <Button className={cx(styles['try-btn'])} type="primary" onClick={onSave}>
        保存
      </Button>
      <Button
        className={cx(styles['try-btn'])}
        type="primary"
        icon={<CaretRightOutlined />}
        onClick={onTryRun}
      >
        试运行
      </Button>
      <Button type="primary" onClick={onPublish}>
        发布
      </Button>
    </header>
  );
};

export default PluginHeader;
