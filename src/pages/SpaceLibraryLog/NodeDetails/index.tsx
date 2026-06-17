import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import classNames from 'classnames';
import dayjs from 'dayjs';
import type React from 'react';
import { useMemo } from 'react';
import { FinalResult } from '../LogDetailDrawer';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface NodeDetailsProps {
  node: FinalResult | null;
}

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
  const time =
    node?.requestEndTime && node?.requestStartTime
      ? `${node?.requestEndTime - node?.requestStartTime} ms`
      : '--';

  const nodeTypeName = useMemo(() => {
    switch (node?.targetType) {
      case AgentComponentTypeEnum.Agent:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typeAgent');
      case AgentComponentTypeEnum.Plugin:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typePlugin');
      case AgentComponentTypeEnum.Workflow:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typeWorkflow');
      case AgentComponentTypeEnum.Knowledge:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typeKnowledge');
      case AgentComponentTypeEnum.Variable:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typeVariable');
      case AgentComponentTypeEnum.Table:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typeTable');
      case AgentComponentTypeEnum.Model:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typeModel');
      case AgentComponentTypeEnum.MCP:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typeMCP');
      case AgentComponentTypeEnum.ToolCall:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typeToolCall');
      case AgentComponentTypeEnum.Plan:
        return dict('PC.Pages.SpaceLibraryLog.NodeDetails.typePlan');
      default:
        return '--';
    }
  }, [node?.targetType]);

  return (
    <>
      <div className={cx(styles.container)}>
        {renderDetailItem(
          dict('PC.Pages.SpaceLibraryLog.NodeDetails.labelType'),
          nodeTypeName,
        )}
        {renderDetailItem(
          dict('PC.Pages.SpaceLibraryLog.NodeDetails.labelStatus'),
          dict('PC.Pages.SpaceLibraryLog.NodeDetails.statusSuccess'),
        )}
        {renderDetailItem(
          dict('PC.Pages.SpaceLibraryLog.NodeDetails.labelName'),
          node?.targetName as string,
        )}
        {renderDetailItem(
          dict('PC.Pages.SpaceLibraryLog.NodeDetails.labelElapsedTime'),
          time,
        )}
      </div>
      {renderDetailItem(
        dict('PC.Pages.SpaceLibraryLog.NodeDetails.labelStartTime'),
        node?.requestStartTime
          ? dayjs(node?.requestStartTime).format('YYYY-MM-DD HH:mm')
          : '',
        styles['mt-10'],
      )}
      <div />
      {renderDetailItem(
        dict('PC.Pages.SpaceLibraryLog.NodeDetails.labelEndTime'),
        node?.requestEndTime
          ? dayjs(node?.requestEndTime).format('YYYY-MM-DD HH:mm')
          : '',
        styles['mt-10'],
      )}
    </>
  );
};
