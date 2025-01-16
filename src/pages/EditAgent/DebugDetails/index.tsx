import FoldWrap from '@/components/FoldWrap';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DebugDetailsProps {
  visible?: boolean;
  onClose: () => void;
}

/**
 * 调试详情组件
 */
const DebugDetails: React.FC<DebugDetailsProps> = ({ visible, onClose }) => {
  return (
    <FoldWrap
      title="调试详情"
      className={styles.container}
      onClose={onClose}
      visible={visible}
      lineMargin
    ></FoldWrap>
  );
};

export default DebugDetails;
