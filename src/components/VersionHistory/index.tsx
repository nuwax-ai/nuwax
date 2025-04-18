import { HistoryActionTypeEnum } from '@/types/enums/space';
import type { VersionHistoryProps } from '@/types/interfaces/space';
// import { Button } from 'antd';
import ToggleWrap from '@/components/ToggleWrap';
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
    <ToggleWrap title={'版本历史'} visible={visible} onClose={onClose}>
      <div className={cx(styles['main-wrap'])}>
        {list?.map((item) => (
          <div key={item.id} className={cx(styles.box, 'py-6')}>
            <div className={cx('flex', 'items-center', styles.header)}>
              <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
                {item.opUser?.nickName || item.opUser?.userName}
              </span>
              <span className={cx(styles['author-update-time'])}>
                {moment(item.created).format('YYYY-MM-DD HH:mm')}
              </span>
              <span className={styles['new-version']}>
                {getType(item.type)}
              </span>
              {/*<Button type="link" className={cx(styles['recover-btn'])}>*/}
              {/*  恢复*/}
              {/*</Button>*/}
            </div>
            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </ToggleWrap>
  );
};

export default VersionHistory;
