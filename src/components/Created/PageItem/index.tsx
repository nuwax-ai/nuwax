import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import { Button, Divider } from 'antd';
import React from 'react';

import { CustomPageDto } from '@/types/interfaces/pageDev';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface PageItemProps {
  item: CustomPageDto;
  index: number;
  selected: { key: string };
  isAddedState?: boolean;
  isCurrentLoading?: boolean;
  onAddNode: (item: CustomPageDto) => void;
  getToolLoading: (item: CustomPageDto) => boolean | undefined;
}

/**
 * 页面组件
 */
const PageItem: React.FC<PageItemProps> = ({
  item,
  index,
  selected,
  isAddedState,
  onAddNode,
  isCurrentLoading,
}) => {
  return (
    <div
      className={cx('dis-sb', styles.container, 'cursor-pointer')}
      style={{ height: 'unset' }}
      key={`${item.projectId}-${index}`}
    >
      <img
        src={item.icon || getImg(selected.key as AgentComponentTypeEnum)}
        alt=""
        className={cx(styles['left-image-style'])}
      />
      <div className={cx('flex-1', styles['content-font'])}>
        <p className={cx(styles['label-font-style'])}>{item.name}</p>
        <p
          className={cx(styles['created-description-style'], 'text-ellipsis-2')}
          title={item.description}
        >
          {item.description}
        </p>
        <div className={cx('dis-sb', styles['count-div-style'])}>
          <div className={'dis-left'}>
            <img
              src={
                item?.creator?.avatar || require('@/assets/images/avatar.png')
              }
              style={{ borderRadius: '50%' }}
              alt="用户头像"
            />
            <span>{item.creator?.nickName}</span>
            <Divider type="vertical" />
            <span>
              {'创建于'}
              {getTime(item.created!)}
            </span>
          </div>
        </div>
      </div>
      <Button
        color="default"
        variant="filled"
        className={cx(
          styles['add-button'],
          isAddedState && styles['add-button-added'],
        )}
        onClick={() => onAddNode(item)}
        disabled={isCurrentLoading ? false : isAddedState}
        loading={isCurrentLoading}
      >
        {isAddedState ? '已添加' : '添加'}
      </Button>
    </div>
  );
};

export default PageItem;
