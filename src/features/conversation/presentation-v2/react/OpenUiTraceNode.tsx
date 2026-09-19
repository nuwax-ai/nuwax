/**
 * V2 轨迹 OpenUI 渲染元素：仅接管产物 presentation 为 inline / sidecar 的
 * Backend.Sandbox.Event.renderUI 节点（inline 渲染看板、sidecar 渲染摘要行，
 * 由 OpenUiArtifactView 内部分流），原位替换工具行且轨迹收起态保持显示。
 * 协议工具名不外露；无产物/失败/退化态由普通轨迹行兜底（动作词条化）。
 */
import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import {
  buildOpenUiArtifactFileUrl,
  extractOpenUiArtifactId,
  isOpenUiArtifactRef,
  resolveOpenUiDisplayState,
} from '@/utils/openUiArtifact';
import classNames from 'classnames';
import React, { Suspense, lazy, useMemo } from 'react';
import type { ConversationProcessNode } from '../types';
import styles from './index.less';

const cx = classNames.bind(styles);

const OpenUiArtifactView = lazy(
  () => import('@/components/business-component/OpenUiArtifactView'),
);

export interface OpenUiTraceNodeProps {
  node: ConversationProcessNode;
  conversationId?: number | string;
  onOpenSidecar?: (artifact: OpenUiArtifact) => void;
}

const OpenUiTraceNode: React.FC<OpenUiTraceNodeProps> = ({
  node,
  conversationId,
  onOpenSidecar,
}) => {
  const result = node.processing?.result;
  const displayState = useMemo(
    () => resolveOpenUiDisplayState(result),
    [result],
  );

  if (displayState.status === 'absent') return null;

  const renderInput = displayState.renderInput;
  const artifact =
    displayState.status === 'ready' ? displayState.artifact : undefined;
  const inlineArtifactId =
    renderInput?.artifactId ??
    extractOpenUiArtifactId(result) ??
    node.executeId;

  return (
    <div
      className={cx(styles['openui-trace-node'])}
      data-node-id={node.id}
      data-testid="v2-openui-node"
    >
      <Suspense fallback={null}>
        <OpenUiArtifactView
          artifact={artifact}
          inlineInput={renderInput || undefined}
          inlineArtifactId={inlineArtifactId}
          artifactUrl={
            artifact && isOpenUiArtifactRef(artifact)
              ? buildOpenUiArtifactFileUrl(
                  conversationId ?? '',
                  artifact.artifactId,
                  artifact.digest,
                ) || undefined
              : undefined
          }
          conversationId={conversationId}
          onOpenSidecar={onOpenSidecar}
        />
      </Suspense>
    </div>
  );
};

export default OpenUiTraceNode;
