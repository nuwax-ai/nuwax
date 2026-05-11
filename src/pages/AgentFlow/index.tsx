/**
 * AgentFlow 页面入口
 *
 * 复用 Workflow v3 编辑器（`pages/Antv-X6/v3/indexV3`），通过 `FlowKindProvider`
 * 注入 `FlowKindEnum.AgentFlow`，让 Stencil / 节点行为等按 AgentFlow 形态渲染。
 *
 * 路由：`/space/:spaceId/agent-flow/:workflowId`
 *
 * 设计意图：避免重复编排 1700+ 行的 indexV3 逻辑；后续 AgentFlow 与 Workflow 的
 * 差异通过 `useFlowKind()` 在公共组件中分支。
 */

import { FlowKindProvider } from '@/contexts/FlowKindContext';
import { t } from '@/services/i18nRuntime';
import { FlowKindEnum } from '@/types/enums/common';
import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import React from 'react';

const WorkflowV3 = React.lazy(() => import('@/pages/Antv-X6/v3/indexV3'));

const AgentFlow: React.FC = () => {
  return (
    <FlowKindProvider flowKind={FlowKindEnum.AgentFlow}>
      <React.Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
            }}
          >
            <Spin
              size="large"
              indicator={<LoadingOutlined spin />}
              tip={t('PC.Pages.AgentFlow.loading')}
            />
          </div>
        }
      >
        <WorkflowV3 />
      </React.Suspense>
    </FlowKindProvider>
  );
};

export default AgentFlow;
