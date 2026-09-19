/** 连续工具组：组头负责压缩动作类型，组内保留每次真实执行及其详情。 */
import { getToolGroupStatus } from '@/features/conversation/presentation-v2/traceItems';
import { dict } from '@/services/i18nRuntime';
import {
  CloseCircleOutlined,
  DownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import type {
  ConversationProcessNode,
  ConversationToolActionKind,
  ConversationToolGroupTraceItem,
  ConversationToolResource,
} from '../types';
import ProcessNodeRow, {
  getToolNodePresentation,
  toolActionLabel,
  ToolPresentationIcon,
} from './ProcessNodeRow';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 终态组头计数词条（ConversationRendererV2 命名空间内词条名） */
const TOOL_GROUP_COUNT_KEYS: Record<ConversationToolActionKind, string> = {
  terminal: 'toolGroupCountTerminal',
  'file-read': 'toolGroupCountFileRead',
  'file-edit': 'toolGroupCountFileEdit',
  search: 'toolGroupCountSearch',
  browser: 'toolGroupCountBrowser',
  skill: 'toolGroupCountSkill',
  todo: 'toolGroupCountTodo',
  generic: 'toolGroupCountGeneric',
};

export interface ToolGroupDisclosureProps {
  group: ConversationToolGroupTraceItem;
  nodes: ConversationProcessNode[];
  expanded: boolean;
  onToggle: () => void;
  nodeIsExpanded: (node: ConversationProcessNode) => boolean;
  onToggleNode: (nodeId: string) => void;
  onOpenResource?: (resource: ConversationToolResource) => void;
}

const ToolGroupDisclosure: React.FC<ToolGroupDisclosureProps> = ({
  group,
  nodes,
  expanded,
  onToggle,
  nodeIsExpanded,
  onToggleNode,
  onOpenResource,
}) => {
  const { token } = theme.useToken();
  const presentations = useMemo(
    () => nodes.map((node) => ({ node, ...getToolNodePresentation(node) })),
    [nodes],
  );
  const labels = group.actionKinds
    .map((kind) => {
      const matching = presentations.filter((item) => item.kind === kind);
      if (!matching.length) return '';
      const allCreate =
        kind === 'file-edit' && matching.every((item) => item.isCreate);
      const kindStatus = getToolGroupStatus(matching.map((item) => item.node));
      // 运行中的动作类保持动词词条（live 语义）；终态按组内节点数计数拼接
      if (kindStatus === 'running') {
        return toolActionLabel(kind, kindStatus, allCreate);
      }
      return dict(
        `PC.Components.ConversationRendererV2.${
          allCreate ? 'toolGroupCountFileCreate' : TOOL_GROUP_COUNT_KEYS[kind]
        }`,
        matching.length,
      );
    })
    .filter(Boolean);
  const title = labels.join(' · ');
  const firstKind = presentations[0]?.kind ?? 'generic';
  const bodyId = `v2-tool-group-${group.id}`;

  return (
    <div
      className={cx(styles['tool-group'], {
        [styles['is-failed']]: group.status === 'failed',
      })}
      data-tool-group-id={group.id}
      data-tool-group-active={group.active ? 'true' : 'false'}
    >
      <button
        type="button"
        className={cx(styles['tool-group-toggle'])}
        aria-expanded={expanded}
        aria-controls={bodyId}
        onClick={onToggle}
      >
        <ToolPresentationIcon
          kind={firstKind}
          className={cx(styles['tool-group-icon'])}
          style={{
            color:
              group.status === 'failed'
                ? token.colorError
                : token.colorTextTertiary,
          }}
          aria-hidden="true"
        />
        <span className={cx(styles['tool-group-title'])}>{title}</span>
        {group.status === 'running' && (
          <LoadingOutlined
            className={cx(styles['tool-group-status'])}
            style={{ color: token.colorPrimary }}
            spin
            aria-hidden="true"
          />
        )}
        {group.status === 'failed' && (
          <CloseCircleOutlined
            className={cx(styles['tool-group-status'])}
            style={{ color: token.colorError }}
            aria-hidden="true"
          />
        )}
        <DownOutlined
          className={cx(styles['tool-group-chevron'], {
            [styles['tool-group-chevron-open']]: expanded,
          })}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div id={bodyId} className={cx(styles['tool-group-body'])}>
          {nodes.map((node) => (
            <ProcessNodeRow
              key={node.id}
              node={node}
              grouped
              expanded={nodeIsExpanded(node)}
              onToggle={() => onToggleNode(node.id)}
              onOpenResource={onOpenResource}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolGroupDisclosure;
