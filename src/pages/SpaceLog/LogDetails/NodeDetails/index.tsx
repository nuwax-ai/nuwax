import { EllipsisTooltip } from '@/components/EllipsisTooltip';
import type { NodeDetailsProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import moment from 'moment';
import type React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 节点详情
export const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  const renderDetailItem = (label: string, value: string | number) => {
    return (
      <div className={cx('flex', styles.box)}>
        <span className={cx(styles.label)}>{label}：</span>
        <EllipsisTooltip
          text={value || '--'}
          className={cx(styles.value, 'flex-1')}
        />
      </div>
    );
  };
  // 耗时
  const time = node ? `${node?.endTime - node?.startTime}ms` : '--';

  return (
    <div className={cx(styles.container)}>
      {renderDetailItem('类型', node?.type as string)}
      {renderDetailItem('状态', '成功')}
      {renderDetailItem('名称', node?.name as string)}
      {renderDetailItem('耗时', time)}
      {renderDetailItem(
        '发起时间',
        node?.startTime
          ? moment(node?.startTime).format('YYYY-MM-DD HH:mm')
          : '',
      )}
      {renderDetailItem(
        '结束时间',
        node?.endTime ? moment(node?.endTime).format('YYYY-MM-DD HH:mm') : '',
      )}
    </div>
  );
};
