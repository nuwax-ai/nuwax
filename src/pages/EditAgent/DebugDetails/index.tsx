import FoldWrap from '@/components/FoldWrap';
import type { DebugDetailsProps } from '@/types/interfaces/agentConfig';
import { Empty } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 调试详情组件
 */
const DebugDetails: React.FC<DebugDetailsProps> = ({ visible, onClose }) => {
  const { executeResults } = useModel('conversationInfo');

  return (
    <FoldWrap
      title="调试详情"
      className={styles.container}
      onClose={onClose}
      visible={visible}
      lineMargin
    >
      {executeResults?.length > 0 ? (
        <div>
          {executeResults?.map((item, index) => (
            <div key={index}>
              {item.success ? <div>{item.name}</div> : <div>{item.error}</div>}
            </div>
          ))}
        </div>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="暂无数据" />
        </div>
      )}
    </FoldWrap>
  );
};

export default DebugDetails;
