import pageImage from '@/assets/images/agent_image.png';
import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE } from '@/constants/images.constants';
import { PAGE_DEVELOP_MORE_ACTIONS } from '@/constants/pageDev.constants';
import {
  BuildRunningEnum,
  PageDevelopMoreActionEnum,
  PageProjectTypeEnum,
} from '@/types/enums/pageDev';
import type { PageDevelopCardItemProps } from '@/types/interfaces/pageDev';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个页面开发卡片
 */
const PageDevelopCardItem: React.FC<PageDevelopCardItemProps> = ({
  componentInfo,
  onClick,
  onClickMore,
}) => {
  /**
   * 更多操作列表
   */
  const moreActionList = useMemo(() => {
    return PAGE_DEVELOP_MORE_ACTIONS.filter((item) => {
      // 页面预览
      if (item.value === PageDevelopMoreActionEnum.Page_Preview) {
        return (
          componentInfo.projectType === PageProjectTypeEnum.REVERSE_PROXY ||
          (componentInfo.projectType === PageProjectTypeEnum.ONLINE_DEPLOY &&
            componentInfo.buildRunning === BuildRunningEnum.Published)
        );
      }
      return true;
    });
  }, [componentInfo]);

  // 获取时间信息
  const getTime = () => {
    // if (componentInfo.buildRunning === BuildRunningEnum.Published) {
    // return `发布于 ${dayjs(mcpInfo.deployed).format('MM-DD HH:mm')}`;
    // }
    return `创建于 ${dayjs(componentInfo.created).format('MM-DD HH:mm')}`;
  };

  return (
    <CardWrapper
      title={componentInfo.name}
      avatar={componentInfo.creatorAvatar}
      name={componentInfo.creatorNickName || componentInfo.creatorName}
      content={componentInfo.description}
      icon={componentInfo.icon}
      defaultIcon={pageImage}
      onClick={onClick}
      extra={
        <span className={cx('text-ellipsis', 'flex-1', styles.time)}>
          {getTime()}
        </span>
      }
      footer={
        <footer className={cx('flex', 'items-center', 'content-between')}>
          {componentInfo.buildRunning === BuildRunningEnum.Published ? (
            <span
              className={cx(
                'flex',
                'items-center',
                styles.container,
                styles['published-status'],
              )}
            >
              已发布
            </span>
          ) : (
            <span
              className={cx(
                'flex',
                'items-center',
                styles.container,
                styles['unpublished-status'],
              )}
            >
              未发布
            </span>
          )}
          {/*更多操作*/}
          <CustomPopover list={moreActionList} onClick={onClickMore}>
            <ICON_MORE />
          </CustomPopover>
        </footer>
      }
    />
  );
};

export default PageDevelopCardItem;
