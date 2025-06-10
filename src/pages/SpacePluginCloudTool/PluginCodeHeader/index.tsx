import pluginImage from '@/assets/images/plugin_image.png';
import { PLUGIN_CODE_SEGMENTED_LIST } from '@/constants/library.constants';
import { PermissionsEnum, PublishStatusEnum } from '@/types/enums/common';
import { PluginTypeEnum } from '@/types/enums/plugin';
import type { PluginCodeHeaderProps } from '@/types/interfaces/plugin';
import {
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button, Segmented, Tag } from 'antd';
import classNames from 'classnames';
import moment from 'moment/moment';
import React, { useMemo } from 'react';
import { history, useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 测试插件头部组件
 */
const PluginCodeHeader: React.FC<PluginCodeHeaderProps> = ({
  codeMode,
  onChange,
  pluginInfo,
  onEdit,
  onToggleHistory,
  onSave,
  onTryRun,
  onPublish,
}) => {
  const { spaceId } = useParams();
  // 返回上一页，如果没有referrer，则跳转到工作空间（组件库）页面
  const handleBack = () => {
    const referrer = document.referrer;
    if (!referrer || window.history.length <= 1) {
      history.push(`/space/${spaceId}/library`);
    } else {
      history.back();
    }
  };

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
          <h3 className={cx(styles.name, 'text-ellipsis')}>
            {pluginInfo?.name}
          </h3>
          <EditOutlined
            className={cx('cursor-pointer', 'hover-box')}
            onClick={onEdit}
          />
          <CheckCircleOutlined className={cx(styles.circle)} />
          {/* 发布时间，如果不为空，与当前modified时间做对比，如果发布时间小于modified，则前端显示：有更新未发布 */}
          {pluginInfo?.publishDate !== null &&
            moment(pluginInfo?.publishDate).isBefore(pluginInfo?.modified) && (
              <Tag
                bordered={false}
                color="volcano"
                style={{ marginLeft: '6px' }}
              >
                有更新未发布
              </Tag>
            )}
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
      <Segmented
        rootClassName={styles['segment']}
        value={codeMode}
        onChange={onChange}
        options={PLUGIN_CODE_SEGMENTED_LIST}
      />
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
      <Button type="primary" onClick={onPublish} disabled={disabledBtn}>
        发布
      </Button>
    </header>
  );
};

export default PluginCodeHeader;
