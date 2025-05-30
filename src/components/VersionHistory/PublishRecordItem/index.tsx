import ConditionRender from '@/components/ConditionRender';
import { HistoryData } from '@/types/interfaces/publish';
import classNames from 'classnames';
import moment from 'moment';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 发布记录组件属性
export interface PublishRecordItemProps {
  info: HistoryData;
}

// 发布记录组件
const PublishRecordItem: React.FC<PublishRecordItemProps> = ({ info }) => {
  return (
    <div
      key={info.id}
      className={cx(styles.container, 'flex', 'flex-col', 'py-6')}
    >
      <div className={cx('flex', 'items-center', styles.header)}>
        <span className={cx(styles.name, 'text-ellipsis')}>
          {info.opUser?.nickName || info.opUser?.userName}
        </span>
        <span className={cx(styles['author-update-time'])}>
          {moment(info.created).format('YYYY-MM-DD HH:mm')}
        </span>
      </div>
      <ConditionRender condition={info.description}>
        <p className={cx('text-ellipsis-2', styles.desc)}>{info.description}</p>
      </ConditionRender>
    </div>
  );
};

export default PublishRecordItem;
