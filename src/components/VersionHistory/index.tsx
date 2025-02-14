import FoldWrap from '@/components/FoldWrap';
import { HistoryActionTypeEnum } from '@/types/enums/space';
import type { VersionHistoryProps } from '@/types/interfaces/space';
import { Button } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 版本历史组件
 */
const VersionHistory: React.FC<VersionHistoryProps> = ({
  list,
  visible,
  onClose,
}) => {
  const getType = (type: HistoryActionTypeEnum) => {
    switch (type) {
      case HistoryActionTypeEnum.Add:
        return '新增';
      case HistoryActionTypeEnum.Edit:
        return '编辑';
      case HistoryActionTypeEnum.Publish:
        return '发布';
      default:
        return '';
    }
  };
  return (
    <FoldWrap
      lineMargin
      title={'版本历史'}
      className={styles.container}
      visible={visible}
      onClose={onClose}
    >
      <div className={cx(styles['main-wrap'])}>
        {list?.map((item) => (
          <div key={item.id} className={cx(styles.box)}>
            <div className={cx('flex', 'items-center', styles.header)}>
              <span className={cx(styles.name, 'text-ellipsis')}>
                {item.opUser.nickName}
              </span>
              <span className={cx(styles['author-update-time'])}>
                {moment(item.created).format('YYYY-MM-DD HH:mm')}
              </span>
              <span className={styles['new-version']}>
                {getType(item.type)}
              </span>
              <Button type="link" className={cx(styles['recover-btn'])}>
                恢复
              </Button>
            </div>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </FoldWrap>
  );
};

export default VersionHistory;
