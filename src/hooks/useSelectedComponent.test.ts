import useSelectedComponent from '@/hooks/useSelectedComponent';
import {
  AgentComponentTypeEnum,
  DefaultSelectedEnum,
} from '@/types/enums/agent';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('useSelectedComponent', () => {
  it('会话请求只保留 id/type，网页应用首发可取回工具名称', () => {
    const { result } = renderHook(() => useSelectedComponent());
    act(() => {
      result.current.handleSelectComponent({
        id: 11,
        type: AgentComponentTypeEnum.Plugin,
        name: '测试插件',
        icon: '',
        description: '工具介绍',
        defaultSelected: DefaultSelectedEnum.No,
      });
    });

    expect(result.current.selectedComponentList).toEqual([
      { id: 11, type: AgentComponentTypeEnum.Plugin },
    ]);
    expect(result.current.selectedComponentDetails).toEqual([
      {
        id: 11,
        type: AgentComponentTypeEnum.Plugin,
        name: '测试插件',
        icon: '',
        description: '工具介绍',
      },
    ]);

    act(() => result.current.initSelectedComponentList(undefined));
    expect(result.current.selectedComponentList).toEqual([]);
    expect(result.current.selectedComponentDetails).toEqual([]);
  });
});
