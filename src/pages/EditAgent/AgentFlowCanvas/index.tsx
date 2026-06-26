/**
 * AgentFlow 画布面板
 *
 * 在 EditAgent 编排 tab 内复用 Workflow v3 编辑器，并自带「点击全屏覆盖整页」能力
 * （交互与系统提示词全屏一致：右上角按钮切换、ESC 退出）。全屏状态自洽，EditAgent
 * 无需感知任何画布 UI 细节。
 *
 * 仅当智能体为 Flow 子类型（AgentSubTypeEnum.Flow）时由 EditAgent 渲染。
 */

import { CanvasFullscreenProvider } from '@/contexts/CanvasFullscreenContext';
import { FlowKindProvider } from '@/contexts/FlowKindContext';
import { registerAgentFlowHandlers } from '@/pages/Antv-X6/v3/agentFlow/register';
import WorkflowV3 from '@/pages/Antv-X6/v3/indexV3';
import { dict } from '@/services/i18nRuntime';
import { FlowKindEnum } from '@/types/enums/common';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';

import './index.less';

export interface AgentFlowCanvasProps {
  workflowId: number;
  spaceId: number;
}

/** 内嵌（非全屏）时画布的固定高度，X6 图需要确定高度才能渲染 */
const EMBEDDED_HEIGHT = 460;

const AgentFlowCanvas: React.FC<AgentFlowCanvasProps> = ({
  workflowId,
  spaceId,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 注册 AgentFlow 节点分支处理器（幂等）
  useEffect(() => {
    registerAgentFlowHandlers();
  }, []);

  // ESC 退出全屏（与系统提示词全屏弹窗的退出交互一致）
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFullscreen]);

  return (
    <div
      style={
        isFullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 1010,
              width: '100vw',
              height: '100vh',
              background: '#fff',
            }
          : {
              position: 'relative',
              width: '100%',
              height: EMBEDDED_HEIGHT,
              marginBottom: 12,
              overflow: 'hidden',
              borderRadius: 8,
            }
      }
    >
      <button
        type="button"
        onClick={() => setIsFullscreen((v) => !v)}
        title={
          isFullscreen
            ? dict('PC.Pages.EditAgent.SystemTipsWord.exitFullscreen')
            : dict('PC.Pages.EditAgent.SystemTipsWord.fullscreenEdit')
        }
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2,
          border: 'none',
          background: 'rgba(255, 255, 255, 0.85)',
          cursor: 'pointer',
          color: '#666',
          fontSize: 16,
          lineHeight: 1,
          padding: 4,
          borderRadius: 4,
        }}
      >
        {isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
      </button>
      <FlowKindProvider flowKind={FlowKindEnum.AgentFlow}>
        <CanvasFullscreenProvider fullscreen={isFullscreen}>
          <div className="agent-flow-canvas-embedded">
            <WorkflowV3
              workflowIdOverride={workflowId}
              spaceIdOverride={spaceId}
            />
          </div>
        </CanvasFullscreenProvider>
      </FlowKindProvider>
    </div>
  );
};

export default AgentFlowCanvas;
