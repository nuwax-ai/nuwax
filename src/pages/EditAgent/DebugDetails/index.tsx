import ToggleWrap from '@/components/ToggleWrap';
import type { DebugDetailsProps } from '@/types/interfaces/agentConfig';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { memo } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 调试详情组件
 */
const DebugDetails: React.FC<DebugDetailsProps> = ({ visible, onClose }) => {
  const { executeResults } = useModel('conversationInfo');

  // console.log(executeResults);

  return (
    <ToggleWrap title="调试详情" onClose={onClose} visible={visible}>
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
    </ToggleWrap>
  );
};

export default memo(DebugDetails);
