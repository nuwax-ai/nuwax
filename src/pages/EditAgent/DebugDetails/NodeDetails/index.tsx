import { ExecuteResultInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import type React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface NodeDetailsProps {
  node?: ExecuteResultInfo;
}

// 节点详情
export const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  const renderDetailItem = (
    label: string,
    value: string | number | unknown,
  ) => {
    return (
      <div className={cx('flex', styles.box)}>
        <span>{label}：</span>
        <span className={styles.value}>{value || '--'}</span>
      </div>
    );
  };
  // 耗时
  const time = node ? `${node?.endTime - node?.startTime}ms` : '--';

  return (
    <div className={cx(styles.container)}>
      {renderDetailItem('类型', node?.type)}
      {renderDetailItem('状态', '成功')}
      {renderDetailItem('名称', node?.name)}
      {renderDetailItem('耗时', time)}
      {renderDetailItem('请求发起时间', node?.startTime)}
      {renderDetailItem('结束时间', node?.endTime)}
    </div>
  );
};
