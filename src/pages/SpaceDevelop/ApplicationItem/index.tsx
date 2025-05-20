import CustomPopover from '@/components/CustomPopover';
import { APPLICATION_MORE_ACTION } from '@/constants/space.constants';
import { apiDevCollectAgent } from '@/services/agentDev';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ApplicationItemProps } from '@/types/interfaces/space';
import { MoreOutlined, UserOutlined } from '@ant-design/icons';
import { message } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import { useModel, useRequest } from 'umi';
import ApplicationHeader from './ApplicationHeader';
import CollectStar from './CollectStar';
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
  const { runCancelCollect, runDevCollect } = useModel('devCollectAgent');

  // 开发智能体收藏
  const { run: runCollect } = useRequest(apiDevCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('收藏成功');
      // 更新开发智能体收藏列表
      runDevCollect({
        page: 1,
        size: 8,
      });
    },
  });

  // 收藏、取消收藏事件
  const handlerCollect = async () => {
    const { id, devCollected } = agentConfigInfo;
    if (devCollected) {
      await runCancelCollect(id);
    } else {
      await runCollect(id);
    }
    onCollect(!devCollected);
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
      {/*头部信息*/}
      <ApplicationHeader agentConfigInfo={agentConfigInfo} />
      {/*相关信息*/}
      <div className={cx('flex', styles['rel-info'])}>
        <span>最近编辑</span>
        <span>{moment(agentConfigInfo.modified).format('MM-DD HH:mm')}</span>
      </div>
      {/*底部*/}
      <footer className={cx(styles.footer, 'flex', 'items-center')}>
        <div className={cx('flex-1', 'flex', 'overflow-hide')}>
          <UserOutlined />
          <span className={cx('flex-1', 'text-ellipsis', styles.author)}>
            {agentConfigInfo.creator?.nickName ||
              agentConfigInfo.creator?.userName}
          </span>
        </div>
        {/*收藏与取消收藏*/}
        <CollectStar
          devCollected={agentConfigInfo.devCollected}
          onClick={handlerCollect}
        />
        {/*更多操作*/}
        <CustomPopover
          onClick={handlerClickMore}
          list={APPLICATION_MORE_ACTION.filter((item) => {
            const type = item.type as ApplicationMoreActionEnum;
            console.log('item', type);
            // 未发布的应用，不展示下架
            // if (
            //   agentConfigInfo.publishStatus !== PublishStatusEnum.Published &&
            //   type === ApplicationMoreActionEnum.Off_Shelf
            // ) {
            //   return false;
            // }
            // todo 过滤迁移（仅创建者和管理员展示迁移）
            return true;
          })}
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
      </footer>
    </div>
  );
};

export default ApplicationItem;
