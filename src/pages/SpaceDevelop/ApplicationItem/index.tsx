import agentImage from '@/assets/images/agent_image.png';
import ConditionRender from '@/components/ConditionRender';
import CustomPopover from '@/components/CustomPopover';
import { APPLICATION_MORE_ACTION } from '@/constants/space.contants';
import { apiDevCollectAgent, apiDevUnCollectAgent } from '@/services/agentDev';
import type { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ApplicationItemProps } from '@/types/interfaces/space';
import {
  CheckCircleTwoTone,
  MoreOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个应用项
 */
const ApplicationItem: React.FC<ApplicationItemProps> = ({
  agentConfigInfo,
  onClick,
  onCollect,
  onClickMore,
}) => {
  // 取消开发智能体收藏
  const { run: runCancel } = useRequest(apiDevUnCollectAgent, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('取消收藏成功');
      onCollect(false);
    },
  });

  // 开发智能体收藏
  const { run } = useRequest(apiDevCollectAgent, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('收藏成功');
      onCollect(true);
    },
  });

  // 收藏事件
  const handlerCollect = (e) => {
    e.stopPropagation();
    const data = {
      agentId: agentConfigInfo.id,
    };
    if (agentConfigInfo.devCollected) {
      runCancel(data);
    } else {
      run(data);
    }
  };

  // 点击更多操作
  const handlerClickMore = (item: CustomPopoverItem) => {
    const type = item.type as ApplicationMoreActionEnum;
    onClickMore(type);
  };

  return (
    <div
      className={cx(
        styles.container,
        'w-full',
        'px-16',
        'py-16',
        'radius-6',
        'flex',
        'flex-col',
        'content-between',
        'cursor-pointer',
      )}
      onClick={() => onClick(agentConfigInfo.id)}
    >
      <div className={cx('flex', styles.header)}>
        <div className={cx('flex-1', 'overflow-hide')}>
          <div className={cx('flex', styles['info-box'])}>
            <h3 className={cx('text-ellipsis', styles.title)}>
              {agentConfigInfo.name}
            </h3>
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </div>
          <p className={cx('text-ellipsis-2', styles.desc)}>
            {agentConfigInfo.description}
          </p>
        </div>
        <span className={cx(styles['logo-box'], 'overflow-hide')}>
          <img src={agentConfigInfo.icon || (agentImage as string)} alt="" />
        </span>
      </div>
      <div className={cx('flex', styles['rel-info'])}>
        <ConditionRender condition={agentConfigInfo.systemPrompt}>
          <span>{agentConfigInfo.systemPrompt}</span>
        </ConditionRender>
        <ConditionRender condition={agentConfigInfo.userPrompt}>
          <span>{agentConfigInfo.userPrompt}</span>
        </ConditionRender>
        <span>最近编辑</span>
        <span>{moment(agentConfigInfo.modified).format('MM-DD HH:mm')}</span>
      </div>
      <div className={cx(styles.footer, 'flex', 'items-center')}>
        <div className={cx('flex-1', 'flex', 'overflow-hide')}>
          <UserOutlined />
          <span className={cx('flex-1', 'text-ellipsis', styles.author)}>
            {agentConfigInfo.creator.userName}
          </span>
        </div>
        <span
          className={cx(
            styles['icon-box'],
            'flex',
            'content-center',
            'items-center',
            'hover-box',
            { [styles['collected']]: agentConfigInfo.devCollected },
          )}
          onClick={handlerCollect}
        >
          <StarFilled />
        </span>
        <CustomPopover
          onClick={handlerClickMore}
          list={APPLICATION_MORE_ACTION}
        >
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

export default ApplicationItem;
