/**
 * AgentFlow 结束节点属性面板（独立维护，样式对齐 Workflow V3 空面板提示）
 */

import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import React from 'react';

const AgentFlowEndForm: React.FC<NodeDisposeProps> = () => {
  return (
    <div className="node-title-style">
      {t(
        'PC.Pages.AgentFlowNode.endEmptyHint',
        '结束节点无需额外配置，流程执行至此自动结束。',
      )}
    </div>
  );
};

export default AgentFlowEndForm;
