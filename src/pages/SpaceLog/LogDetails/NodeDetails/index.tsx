import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import { dict } from '@/services/i18nRuntime';
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
        <span className={cx(styles.label)}>
          {label}
          {dict('PC.Pages.SpaceLog.NodeDetails.labelSeparator')}
        </span>
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
        return dict('PC.Pages.SpaceLog.NodeDetails.typePlugin');
      case AgentComponentTypeEnum.Workflow:
        return dict('PC.Pages.SpaceLog.NodeDetails.typeWorkflow');
      case AgentComponentTypeEnum.Knowledge:
        return dict('PC.Pages.SpaceLog.NodeDetails.typeKnowledge');
      case AgentComponentTypeEnum.Variable:
        return dict('PC.Pages.SpaceLog.NodeDetails.typeVariable');
      case AgentComponentTypeEnum.Table:
        return dict('PC.Pages.SpaceLog.NodeDetails.typeTable');
      case AgentComponentTypeEnum.Model:
        return dict('PC.Pages.SpaceLog.NodeDetails.typeModel');
      case AgentComponentTypeEnum.MCP:
        return 'MCP';
      default:
        return '--';
    }
  }, [node?.type]);

  return (
    <>
      <div className={cx(styles.container)}>
        {renderDetailItem(
          dict('PC.Pages.SpaceLog.NodeDetails.lblType'),
          nodeTypeName,
        )}
        {renderDetailItem(
          dict('PC.Pages.SpaceLog.NodeDetails.lblStatus'),
          dict('PC.Pages.SpaceLog.NodeDetails.statusSuccess'),
        )}
        {renderDetailItem(
          dict('PC.Pages.SpaceLog.NodeDetails.lblName'),
          node?.name as string,
        )}
        {renderDetailItem(
          dict('PC.Pages.SpaceLog.NodeDetails.lblElapsedTime'),
          time,
        )}
      </div>
      {renderDetailItem(
        dict('PC.Pages.SpaceLog.NodeDetails.lblStartTime'),
        node?.startTime
          ? dayjs(node?.startTime).format('YYYY-MM-DD HH:mm')
          : '',
        styles['mt-10'],
      )}
      <div />
      {renderDetailItem(
        dict('PC.Pages.SpaceLog.NodeDetails.lblEndTime'),
        node?.endTime ? dayjs(node?.endTime).format('YYYY-MM-DD HH:mm') : '',
        styles['mt-10'],
      )}
    </>
  );
};
