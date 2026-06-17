import { ReactComponent as AgentSvgFile } from '@/assets/icons/workspace/agent.svg';
import { ReactComponent as KnowledgeSvgFile } from '@/assets/icons/workspace/knowledge.svg';
import { ReactComponent as LlmSvgFile } from '@/assets/icons/workspace/llm.svg';
import { ReactComponent as McpSvgFile } from '@/assets/icons/workspace/mcp.svg';
import { ReactComponent as PluginSvgFile } from '@/assets/icons/workspace/plugin.svg';
import { ReactComponent as TableSvgFile } from '@/assets/icons/workspace/table.svg';
import { ReactComponent as WorkflowSvgFile } from '@/assets/icons/workspace/workflow.svg';
import React from 'react';
import { wrapSvg } from './utils';

const AgentSvg = wrapSvg(AgentSvgFile, {
  viewBox: '0 0 38 38',
});
const KnowledgeSvg = wrapSvg(KnowledgeSvgFile, {
  viewBox: '0 0 30 38',
});
const LlmSvg = wrapSvg(LlmSvgFile, {
  viewBox: '0 0 38 38',
});
const McpSvg = wrapSvg(McpSvgFile, {
  viewBox: '0 0 38 36',
});
const PluginSvg = wrapSvg(PluginSvgFile, {
  viewBox: '0 0 32 36',
});
const TableSvg = wrapSvg(TableSvgFile, {
  viewBox: '0 0 34 34',
});
const WorkflowSvg = wrapSvg(WorkflowSvgFile, {
  viewBox: '0 0 38 38',
});

export default {
  'icons-workspace-agent': AgentSvg,
  'icons-workspace-knowledge': KnowledgeSvg,
  'icons-workspace-llm': LlmSvg,
  'icons-workspace-mcp': McpSvg,
  'icons-workspace-plugin': PluginSvg,
  'icons-workspace-table': TableSvg,
  'icons-workspace-workflow': WorkflowSvg,
} as Record<string, React.FC>;
