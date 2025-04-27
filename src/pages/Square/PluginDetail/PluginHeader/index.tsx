import pluginImage from '@/assets/images/plugin_image.png';
import ConditionRender from '@/components/ConditionRender';
import CollectStar from '@/pages/SpaceDevelop/ApplicationItem/CollectStar';
import {
  apiPublishedPluginCollect,
  apiPublishedPluginUnCollect,
} from '@/services/plugin';
import type { PublishPluginInfo } from '@/types/interfaces/plugin';
import { LeftOutlined } from '@ant-design/icons';
import { message } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);
// 插件http头部组件
interface PluginHeaderProps {
  pluginInfo: PublishPluginInfo;
  onSave: () => void;
  onTryRun: () => void;
  onPublish: () => void;
}

/**
 * 测试插件头部组件
 */
const PluginHeader: React.FC<PluginHeaderProps> = ({ pluginInfo }) => {
  const handleBack = () => {
    history.back();
  };
  const [collect, setCollect] = useState(pluginInfo?.collect);
  const [count, setCount] = useState(pluginInfo?.statistics?.collectCount || 0);

  const { publishUser } = pluginInfo;

  // 开发智能体收藏
  const { run: runCancelCollect } = useRequest(apiPublishedPluginUnCollect, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('取消收藏成功');
    },
  });
  // 开发智能体收藏
  const { run: runDevCollect } = useRequest(apiPublishedPluginCollect, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('收藏成功');
    },
  });

  // 收藏、取消收藏事件
  const handlerCollect = async () => {
    const { id } = pluginInfo;
    if (collect) {
      await runCancelCollect(id);
      setCount(count - 1);
    } else {
      await runDevCollect(id);
      setCount(count + 1);
    }
    setCollect(!collect);
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
        </div>
        <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
          <div className={cx('flex', 'items-center', styles['info-author'])}>
            <img
              className={cx(styles.avatar)}
              src={publishUser?.avatar}
              alt=""
            />
            <ConditionRender condition={publishUser?.userName}>
              <span className={cx(styles.author, 'text-ellipsis')}>
                {publishUser?.userName}
              </span>
            </ConditionRender>
            <ConditionRender condition={publishUser?.nickName}>
              <span className={cx(styles.nickname, 'text-ellipsis', 'flex-1')}>
                {publishUser?.nickName}
              </span>
            </ConditionRender>
          </div>
          <span className={cx(styles['update-time'])}>
            发布于{moment(pluginInfo?.created).format('HH:mm')}
          </span>
        </div>
      </section>

      <div className={cx('flex')}>
        {/*收藏与取消收藏*/}
        <CollectStar devCollected={collect} onClick={handlerCollect} />
        <span
          className={cx('ml-10', styles['collect'])}
          // onClick={handlerCollect}
        >
          收藏 {`(${count})`}
        </span>
      </div>
    </header>
  );
};

export default PluginHeader;
