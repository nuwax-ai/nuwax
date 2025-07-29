import avatarImage from '@/assets/images/avatar.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import ConditionRender from '@/components/ConditionRender';
import CollectStar from '@/pages/SpaceDevelop/ApplicationItem/CollectStar';
import {
  apiPublishedPluginCollect,
  apiPublishedPluginUnCollect,
  apiPublishedWorkflowCollect,
  apiPublishedWorkflowUnCollect,
} from '@/services/plugin';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type {
  PublishPluginInfo,
  PublishWorkflowInfo,
} from '@/types/interfaces/plugin';
import { LeftOutlined } from '@ant-design/icons';
import { message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);
// 插件http头部组件
interface PluginHeaderProps {
  targetInfo: PublishPluginInfo | PublishWorkflowInfo;
  targetType: SquareAgentTypeEnum.Workflow | SquareAgentTypeEnum.Plugin;
}

/**
 * 测试插件头部组件
 */
const PluginHeader: React.FC<PluginHeaderProps> = ({
  targetInfo,
  targetType,
}) => {
  const handleBack = () => {
    history.back();
  };
  const [collect, setCollect] = useState(targetInfo?.collect);
  const [count, setCount] = useState(targetInfo?.statistics?.collectCount || 0);

  const { publishUser } = targetInfo;

  // 开发智能体收藏
  const { run: runCancelCollect } = useRequest(
    targetType === SquareAgentTypeEnum.Plugin
      ? apiPublishedPluginUnCollect
      : apiPublishedWorkflowUnCollect,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        message.success('取消收藏成功');
      },
    },
  );
  // 开发智能体收藏
  const { run: runDevCollect } = useRequest(
    targetType === SquareAgentTypeEnum.Plugin
      ? apiPublishedPluginCollect
      : apiPublishedWorkflowCollect,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        message.success('收藏成功');
      },
    },
  );

  // 收藏、取消收藏事件
  const handlerCollect = async () => {
    const { id } = targetInfo;
    if (collect) {
      await runCancelCollect(id);
      setCount(count - 1);
    } else {
      await runDevCollect(id);
      setCount(count + 1);
    }
    setCollect(!collect);
  };

  // 默认图片
  const defaultImage =
    targetType === SquareAgentTypeEnum.Plugin ? pluginImage : workflowImage;

  return (
    <header className={cx('flex', 'items-center', 'w-full', styles.header)}>
      <LeftOutlined
        className={cx(styles['icon-back'], 'cursor-pointer')}
        onClick={handleBack}
      />
      <img
        className={cx(styles.logo)}
        src={targetInfo?.icon || defaultImage}
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
            {targetInfo?.name}
          </h3>
        </div>
        <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
          <div className={cx('flex', 'items-center', styles['info-author'])}>
            <img
              className={cx(styles.avatar)}
              src={publishUser?.avatar || avatarImage}
              alt=""
            />
            <ConditionRender
              condition={publishUser?.nickName || publishUser?.userName}
            >
              <span className={cx(styles.author, 'text-ellipsis', 'flex-1')}>
                {publishUser?.nickName || publishUser?.userName}
              </span>
            </ConditionRender>
          </div>
          <span className={cx(styles['update-time'])}>
            发布于{dayjs(targetInfo?.created).format('YYYY-MM-DD HH:mm')}
          </span>
        </div>
      </section>

      <div className={cx('flex')}>
        {/*收藏与取消收藏*/}
        <CollectStar devCollected={collect} onClick={handlerCollect} />
        <span className={cx('ml-10', styles['collect'])}>
          收藏 {`(${count})`}
        </span>
      </div>
    </header>
  );
};

export default PluginHeader;
