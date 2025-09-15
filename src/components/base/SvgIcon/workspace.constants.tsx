import { ReactComponent as AgentSvgFile } from '@/assets/icons/workspace/agent.svg';
import { ReactComponent as CaretDownSvgFile } from '@/assets/icons/workspace/caret_down.svg';
import { ReactComponent as KnowlegeSvgFile } from '@/assets/icons/workspace/knowlege.svg';
import { ReactComponent as LlmSvgFile } from '@/assets/icons/workspace/llm.svg';
import { ReactComponent as McpSvgFile } from '@/assets/icons/workspace/mcp.svg';
import { ReactComponent as PluginSvgFile } from '@/assets/icons/workspace/plugin.svg';
import { ReactComponent as TableSvgFile } from '@/assets/icons/workspace/table.svg';
import { ReactComponent as WorkflowSvgFile } from '@/assets/icons/workspace/workflow.svg';
import React from 'react';
import { wrapSvg } from './utils';

const AgentSvg = wrapSvg(AgentSvgFile);
const CaretDownSvg = wrapSvg(CaretDownSvgFile);
const KnowlegeSvg = wrapSvg(KnowlegeSvgFile);
const LlmSvg = wrapSvg(LlmSvgFile);
const McpSvg = wrapSvg(McpSvgFile);
const PluginSvg = wrapSvg(PluginSvgFile);
const TableSvg = wrapSvg(TableSvgFile);
const WorkflowSvg = wrapSvg(WorkflowSvgFile);

export default {
  'icons-workspace-agent': AgentSvg,
  'icons-workspace-caret_down': CaretDownSvg,
  'icons-workspace-knowlege': KnowlegeSvg,
  'icons-workspace-llm': LlmSvg,
  'icons-workspace-mcp': McpSvg,
  'icons-workspace-plugin': PluginSvg,
  'icons-workspace-table': TableSvg,
  'icons-workspace-workflow': WorkflowSvg,
} as Record<string, React.FC>;
