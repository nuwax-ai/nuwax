/**
 * AgentFlow 画布
 *
 * 在 EditAgent 编排 tab 内复用 Workflow v3 编辑器。
 */

import { FlowKindProvider } from '@/contexts/FlowKindContext';
import { registerAgentFlowHandlers } from '@/pages/Antv-X6/v3/agentFlow/register';
import WorkflowV3 from '@/pages/Antv-X6/v3/indexV3';
import { FlowKindEnum } from '@/types/enums/common';
import React, { useEffect } from 'react';

import './index.less';

export interface AgentFlowCanvasProps {
  workflowId: number;
  spaceId: number;
}

const AgentFlowCanvas: React.FC<AgentFlowCanvasProps> = ({
  workflowId,
  spaceId,
}) => {
  useEffect(() => {
    registerAgentFlowHandlers();
  }, []);

  return (
    <FlowKindProvider flowKind={FlowKindEnum.AgentFlow}>
      <div className="agent-flow-canvas-embedded">
        <WorkflowV3 workflowIdOverride={workflowId} spaceIdOverride={spaceId} />
      </div>
    </FlowKindProvider>
  );
};

export default AgentFlowCanvas;
