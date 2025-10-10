import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE } from '@/constants/images.constants';
import { PAGE_DEVELOP_MORE_ACTIONS } from '@/constants/pageDev.constants';
import type { PageDevelopCardItemProps } from '@/types/interfaces/pageDev';
import classNames from 'classnames';
import React from 'react';
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
  return (
    <CardWrapper
      title={componentInfo.name}
      avatar={componentInfo.creator?.avatar || ''}
      name={componentInfo.creator?.nickName || componentInfo.creator?.userName}
      content={componentInfo.description}
      icon={componentInfo.icon}
      defaultIcon={componentInfo?.defaultImage || ''}
      onClick={onClick}
      footer={
        <footer className={cx('flex', 'items-center', 'content-between')}>
          {/*更多操作*/}
          <CustomPopover list={PAGE_DEVELOP_MORE_ACTIONS} onClick={onClickMore}>
            <ICON_MORE />
          </CustomPopover>
        </footer>
      }
    />
  );
};

export default PageDevelopCardItem;
