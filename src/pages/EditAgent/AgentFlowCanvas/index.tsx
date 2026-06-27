/**
 * AgentFlow 画布面板
 *
 * 在 EditAgent 编排 tab 内复用 Workflow v3 编辑器，并自带「点击全屏覆盖整页」能力
 *（左上角按钮切换、ESC 退出）。按钮置于左上角，避免与右侧节点属性面板争抢顶部空间，
 * 让面板可以贴顶渲染。全屏状态自洽，EditAgent 无需感知任何画布 UI 细节。
 *
 * 仅当智能体为 Flow 子类型（AgentSubTypeEnum.Flow）时由 EditAgent 渲染。
 */

import { SvgIcon } from '@/components/base';
import { CanvasFullscreenProvider } from '@/contexts/CanvasFullscreenContext';
import { FlowKindProvider } from '@/contexts/FlowKindContext';
import { registerAgentFlowHandlers } from '@/pages/Antv-X6/v3/agentFlow/register';
import WorkflowV3 from '@/pages/Antv-X6/v3/indexV3';
import { dict } from '@/services/i18nRuntime';
import { FlowKindEnum } from '@/types/enums/common';
import { Button, Tooltip } from 'antd';
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
      {/* 全屏切换按钮：图标/交互与「系统提示词」全屏按钮统一（zoom_in / zoom_out）。
          置于左上角，避免与右侧节点属性面板争抢顶部空间。 */}
      <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}>
        <Tooltip
          title={
            isFullscreen
              ? dict('PC.Pages.EditAgent.SystemTipsWord.exitFullscreen')
              : dict('PC.Pages.EditAgent.SystemTipsWord.fullscreenEdit')
          }
        >
          <Button
            type="text"
            icon={
              <SvgIcon
                name={
                  isFullscreen
                    ? 'icons-common-zoom_out'
                    : 'icons-common-zoom_in'
                }
                style={{ fontSize: '14px' }}
              />
            }
            onClick={() => setIsFullscreen((v) => !v)}
          />
        </Tooltip>
      </div>
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
