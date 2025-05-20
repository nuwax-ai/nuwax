import ToggleWrap from '@/components/ToggleWrap';
import type { VersionHistoryProps } from '@/types/interfaces/space';
import classNames from 'classnames';
import React from 'react';
import CurrentPublishItem from './CurrentPublishItem';
import styles from './index.less';
import PublishRecordItem from './PublishRecordItem';

const cx = classNames.bind(styles);

/**
 * 版本历史组件
 */
const VersionHistory: React.FC<VersionHistoryProps> = ({
  list,
  visible,
  onClose,
}) => {
  // 下架
  const handleOff = () => {
    console.log('下架');
  };

  return (
    <ToggleWrap title={'版本历史'} visible={visible} onClose={onClose}>
      <div className={cx(styles['main-wrap'])}>
        <h5 className={cx(styles.title)}>当前发布</h5>
        <CurrentPublishItem onOff={handleOff} />
        <CurrentPublishItem onOff={handleOff} />
        <CurrentPublishItem onOff={handleOff} />
        <h5 className={cx(styles.title)}>编排与发布记录</h5>
        {list?.map((item) => (
          <PublishRecordItem key={item.id} info={item} />
        ))}
      </div>
    </ToggleWrap>
  );
};

export default VersionHistory;
