/**
 * AgentFlow 开始节点属性面板（独立维护，无配置项）
 */

import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import React from 'react';

const AgentFlowStartForm: React.FC<NodeDisposeProps> = () => {
  return (
    <div className="node-title-style">
      {t(
        'PC.Pages.AgentFlowNode.startEmptyHint',
        '开始节点无需额外配置，流程从此节点启动。',
      )}
    </div>
  );
};

export default AgentFlowStartForm;
