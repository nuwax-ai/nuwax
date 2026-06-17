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
        return dict('PC.Pages.EditAgent.NodeDetails.typePlugin');
      case AgentComponentTypeEnum.Workflow:
        return dict('PC.Pages.EditAgent.NodeDetails.typeWorkflow');
      case AgentComponentTypeEnum.Knowledge:
        return dict('PC.Pages.EditAgent.NodeDetails.typeKnowledge');
      case AgentComponentTypeEnum.Variable:
        return dict('PC.Pages.EditAgent.NodeDetails.typeVariable');
      case AgentComponentTypeEnum.Table:
        return dict('PC.Pages.EditAgent.NodeDetails.typeTable');
      case AgentComponentTypeEnum.Model:
        return dict('PC.Pages.EditAgent.NodeDetails.typeModel');
      case AgentComponentTypeEnum.MCP:
        return dict('PC.Pages.EditAgent.NodeDetails.typeMCP');
      default:
        return '--';
    }
  }, [node?.type]);

  return (
    <>
      <div className={cx(styles.container)}>
        {renderDetailItem(
          dict('PC.Pages.EditAgent.NodeDetails.labelType'),
          nodeTypeName,
        )}
        {renderDetailItem(
          dict('PC.Pages.EditAgent.NodeDetails.labelStatus'),
          dict('PC.Pages.EditAgent.NodeDetails.statusSuccess'),
        )}
        {renderDetailItem(
          dict('PC.Pages.EditAgent.NodeDetails.labelName'),
          node?.name as string,
        )}
        {renderDetailItem(
          dict('PC.Pages.EditAgent.NodeDetails.labelDuration'),
          time,
        )}
      </div>
      {renderDetailItem(
        dict('PC.Pages.EditAgent.NodeDetails.labelStartTime'),
        node?.startTime
          ? dayjs(node?.startTime).format('YYYY-MM-DD HH:mm')
          : '',
        styles['mt-10'],
      )}
      {renderDetailItem(
        dict('PC.Pages.EditAgent.NodeDetails.labelEndTime'),
        node?.endTime ? dayjs(node?.endTime).format('YYYY-MM-DD HH:mm') : '',
        styles['mt-10'],
      )}
    </>
  );
};
