import {
  getToolPresentationKind,
  shouldRenderGenericDetails,
} from '@/components/MarkdownCustomProcess/toolPresentation';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';

describe('工具调用类型化展开渲染', () => {
  it('协议结构优先识别终端、Diff 与计划', () => {
    expect(
      getToolPresentationKind({
        componentType: AgentComponentTypeEnum.ToolCall,
        name: '执行工具',
        result: { data: [{ type: 'terminal', content: 'ok' }] },
      }),
    ).toBe('terminal');
    expect(
      getToolPresentationKind({
        componentType: AgentComponentTypeEnum.ToolCall,
        name: '编辑文件',
        result: { data: [{ type: 'diff', path: 'a.ts' }] },
      }),
    ).toBe('file-edit');
    expect(
      getToolPresentationKind({
        componentType: AgentComponentTypeEnum.Plan,
        name: '更新待办',
        result: { data: [] },
      }),
    ).toBe('todo');
  });

  it('按组件类型和工具语义识别技能、读取、搜索与浏览器结果', () => {
    expect(
      getToolPresentationKind({
        componentType: AgentComponentTypeEnum.Skill,
        name: 'browser:control-browser',
      }),
    ).toBe('skill');
    expect(
      getToolPresentationKind({
        componentType: AgentComponentTypeEnum.ToolCall,
        name: '读取 conversationScenarios.ts',
      }),
    ).toBe('file-read');
    expect(
      getToolPresentationKind({
        componentType: AgentComponentTypeEnum.Knowledge,
        name: '知识库检索',
      }),
    ).toBe('search');
    expect(
      getToolPresentationKind({
        componentType: AgentComponentTypeEnum.Page,
        name: '打开浏览器连接',
      }),
    ).toBe('browser');
  });

  it('专属形态不再落入通用详情分支，避免终端重复渲染', () => {
    expect(shouldRenderGenericDetails('terminal')).toBe(false);
    expect(shouldRenderGenericDetails('file-edit')).toBe(false);
    expect(shouldRenderGenericDetails('todo')).toBe(false);
    expect(shouldRenderGenericDetails('skill')).toBe(true);
    expect(shouldRenderGenericDetails('generic')).toBe(true);
  });
});
