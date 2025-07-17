import { EllipsisTooltip } from '@/components/EllipsisTooltip';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { NodeDetailsProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import dayjs from 'dayjs';
import type React from 'react';
import { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 节点详情
export const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  const renderDetailItem = (
    label: string,
    value: string | number,
    className?: string,
  ) => {
    return (
      <div className={cx('flex', styles.box, className)}>
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

  const nodeTypeName = useMemo(() => {
    switch (node?.type) {
      case AgentComponentTypeEnum.Plugin:
        return '插件';
      case AgentComponentTypeEnum.Workflow:
        return '工作流';
      case AgentComponentTypeEnum.Knowledge:
        return '知识库';
      case AgentComponentTypeEnum.Variable:
        return '变量';
      case AgentComponentTypeEnum.Table:
        return '数据表';
      case AgentComponentTypeEnum.Model:
        return '模型';
      case AgentComponentTypeEnum.MCP:
        return 'MCP';
      default:
        return '--';
    }
  }, [node?.type]);

  return (
    <>
      <div className={cx(styles.container)}>
        {renderDetailItem('类型', nodeTypeName)}
        {renderDetailItem('状态', '成功')}
        {renderDetailItem('名称', node?.name as string)}
        {renderDetailItem('耗时', time)}
      </div>
      {renderDetailItem(
        '发起时间',
        node?.startTime
          ? dayjs(node?.startTime).format('YYYY-MM-DD HH:mm')
          : '',
        styles['mt-10'],
      )}
      {renderDetailItem(
        '结束时间',
        node?.endTime ? dayjs(node?.endTime).format('YYYY-MM-DD HH:mm') : '',
        styles['mt-10'],
      )}
    </>
  );
};
