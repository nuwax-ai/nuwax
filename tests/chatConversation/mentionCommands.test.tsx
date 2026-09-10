import {
  loadDraft,
  saveDraft,
} from '@/components/business-component/UnifiedChatSession/components/ChatInputHomeIndependent/draftStorage';
import MentionEditor, {
  detectMention,
  getSerializedEditorText,
} from '@/components/ChatInputHome/MentionEditor';
import MentionPopup from '@/components/ChatInputHome/MentionPopup';
import { apiSkillListForAt } from '@/components/ChatInputHome/MentionPopup/atSkill';
import type { MentionEditorHandle } from '@/components/ChatInputHome/MentionPopup/types';
import SlashPopup from '@/components/ChatInputHome/SlashPopup';
import { useSlashPlugins } from '@/components/ChatInputHome/useSlashPlugins';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { getList } from '@/services/created';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ChatInputHome/MentionEditor/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/ChatInputHome/MentionPopup/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
// CapabilityModal 引用 services（umi request），vitest 环境不可用；用桩捕获 props 驱动选中/关闭
const capabilityModalProps = vi.hoisted(
  () =>
    ({} as {
      open?: boolean;
      onSelect?: (item: unknown) => void;
      onClose?: () => void;
    }),
);
vi.mock('@/components/ChatInputHome/CapabilityModal', () => ({
  default: (props: typeof capabilityModalProps) => {
    Object.assign(capabilityModalProps, props);
    return null;
  },
}));
vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/services/created', () => ({ getList: vi.fn() }));
vi.mock('@/components/ChatInputHome/MentionPopup/atSkill', () => ({
  apiSkillListForAt: vi.fn(),
  apiSkillCollectListForAt: vi.fn(),
  apiSkillRecentlyUsedListForAt: vi.fn(),
}));
const file = {
  kind: 'file' as const,
  name: '报告.md',
  relativePath: 'output/报告.md',
};
const skill = { kind: 'skill' as const, name: '写作', targetId: 42 };
const plugin = {
  kind: 'plugin' as const,
  name: '搜索工具',
  targetId: 73,
  id: 99,
};

function caret(node: Node, offset: number) {
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  window.getSelection()?.removeAllRanges();
  window.getSelection()?.addRange(range);
}
function type(editor: HTMLElement, text: string) {
  editor.textContent = text;
  editor.focus();
  caret(editor.firstChild!, text.length);
  fireEvent.input(editor);
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
  Range.prototype.getBoundingClientRect = () =>
    ({
      left: 100,
      top: 100,
      bottom: 125,
      right: 110,
      width: 10,
      height: 25,
    } as DOMRect);
  vi.mocked(apiSkillListForAt).mockResolvedValue({
    code: SUCCESS_CODE,
    data: { records: [skill], total: 1 },
  } as never);
  vi.mocked(getList).mockResolvedValue({
    code: SUCCESS_CODE,
    data: { records: [plugin], total: 1 },
  } as never);
});
afterEach(cleanup);

describe('触发规则', () => {
  it('文件路径允许点和斜杠，空白结束引用', () => {
    expect(detectMention('分析 @output/报告.md')).toMatchObject({
      hasMention: true,
      searchText: 'output/报告.md',
    });
    expect(detectMention('@a b').hasMention).toBe(false);
  });
  it('slash 只接受行首或空白后，排除路径、URL、文件引用内的 slash', () => {
    for (const text of ['/写作', '请 /写作', '上一行\n/写作'])
      expect(detectMention(text, '/').hasMention).toBe(true);
    for (const text of ['a/b', 'https://host', '@output/file', '/tmp/a'])
      expect(detectMention(text, '/').hasMention).toBe(false);
  });
  it('at 同样只接受行首或空白后，紧跟文字（含邮箱）不触发', () => {
    for (const text of ['@张三', '请 @张三', '上一行\n@张三'])
      expect(detectMention(text).hasMention).toBe(true);
    for (const text of ['abc@张三', '邮箱a@b.com'])
      expect(detectMention(text).hasMention).toBe(false);
  });
});

describe('编辑器发送协议和历史', () => {
  it('首页 @ 为普通文本，/技能插入 chip 并产生原 skillIds', async () => {
    const ids = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        onSkillIdsChange={ids}
        onChange={onChange}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@写作');
    expect(screen.queryByRole('listbox')).toBeNull();
    type(editor, '/写作');
    await screen.findByText('写作');
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(editor.querySelector('[data-mention-kind="skill"]')).not.toBeNull();
    expect(onChange).toHaveBeenLastCalledWith('@写作 ');
    expect(ids).toHaveBeenLastCalledWith([42]);
  });
  it('@文件独立于技能开关，删除和撤销不产生技能 ID，历史恢复后仍能点删除', async () => {
    const ids = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        enableMention={false}
        onPaste={vi.fn()}
        onFetchMentionFiles={async () => [file]}
        onSkillIdsChange={ids}
        onChange={onChange}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@output/');
    await screen.findByText('报告.md');
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(getSerializedEditorText(editor)).toBe('@output/报告.md ');
    expect(ids).toHaveBeenLastCalledWith([]);
    fireEvent.click(editor.querySelector('[data-mention-delete]')!);
    expect(editor.querySelector('[data-mention-id]')).toBeNull();
    fireEvent.keyDown(editor, { key: 'z', ctrlKey: true });
    expect(editor.querySelector('[data-mention-kind="file"]')).not.toBeNull();
    await act(async () => {});
    fireEvent.click(editor.querySelector('[data-mention-delete]')!);
    expect(editor.querySelector('[data-mention-id]')).toBeNull();
    expect(ids).toHaveBeenLastCalledWith([]);
  });
  it('插件移除命令串但保留两侧文字，通过插件回调发送 targetId', async () => {
    const selected = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        onPluginSelect={selected}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '前 / 后');
    caret(editor.firstChild!, 3);
    fireEvent.input(editor);
    await screen.findByRole('tab', {
      name: 'PC.Components.ChatInputCommands.plugin',
    });
    fireEvent.click(
      screen.getByRole('tab', {
        name: 'PC.Components.ChatInputCommands.plugin',
      }),
    );
    fireEvent.click(await screen.findByText('搜索工具'));
    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'plugin', targetId: 73 }),
    );
    expect(getSerializedEditorText(editor)).toBe('前  后');
    expect(editor.querySelector('[data-mention-id]')).toBeNull();
  });
  it('换行后触发 slash；跨文本节点插入保留之前的 chip', async () => {
    const ref = createRef<MentionEditorHandle>();
    const { container } = render(
      <MentionEditor ref={ref} autoFocus={false} onPaste={vi.fn()} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    act(() => ref.current?.handleAtIconMentionSelect(skill));
    const line = document.createElement('div');
    line.append(document.createTextNode('/'), document.createTextNode('写作'));
    editor.append(line);
    caret(line.lastChild!, 2);
    fireEvent.input(editor);
    await screen.findByText('写作');
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(editor.querySelectorAll('[data-mention-id]')).toHaveLength(2);
  });
  it('IME 中不触发弹窗，Escape 不发送', async () => {
    const send = vi.fn();
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onPressEnter={send} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    fireEvent.compositionStart(editor);
    type(editor, '/写作');
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.compositionEnd(editor);
    await screen.findByText('写作');
    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('列表数据一致性', () => {
  it('文件先过滤再截断、打开时刷新且搜索不再次请求', async () => {
    const fetch = vi.fn().mockResolvedValue([
      ...Array.from({ length: 120 }, (_, i) => ({
        ...file,
        name: `file${i}`,
        relativePath: `file${i}`,
      })),
      file,
    ]);
    const props = {
      visible: true,
      position: { left: 0, top: 0 },
      onSelect: vi.fn(),
      onClose: vi.fn(),
      onFetchMentionFiles: fetch,
    };
    const { rerender } = render(<MentionPopup {...props} />);
    await waitFor(() =>
      expect(screen.getAllByRole('option')).toHaveLength(100),
    );
    rerender(<MentionPopup {...props} searchText="报告" />);
    await screen.findByText('报告.md');
    expect(fetch).toHaveBeenCalledTimes(1);
    rerender(<MentionPopup {...props} visible={false} />);
    rerender(<MentionPopup {...props} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
  it('切换文件数据源时忽略旧会话的迟到响应', async () => {
    let resolve!: (value: (typeof file)[]) => void;
    const oldFetch = () =>
      new Promise<(typeof file)[]>((r) => {
        resolve = r;
      });
    const props = {
      visible: true,
      position: { left: 0 },
      onSelect: vi.fn(),
      onClose: vi.fn(),
    };
    const { rerender } = render(
      <MentionPopup {...props} onFetchMentionFiles={oldFetch} />,
    );
    await act(async () => {});
    rerender(
      <MentionPopup
        {...props}
        onFetchMentionFiles={async () => [
          { ...file, name: '新会话', relativePath: 'new' },
        ]}
      />,
    );
    await screen.findByText('新会话');
    await act(async () => resolve([file]));
    expect(screen.queryByText('报告.md')).toBeNull();
  });
  it('技能为空仍可切换插件，并支持搜索请求', async () => {
    vi.mocked(apiSkillListForAt).mockResolvedValue({
      code: SUCCESS_CODE,
      data: { records: [], total: 0 },
    } as never);
    const props = {
      visible: true,
      position: { left: 0 },
      onSelect: vi.fn(),
      onClose: vi.fn(),
    };
    const { rerender } = render(<SlashPopup {...props} />);
    await screen.findByText(
      'PC.Components.ChatInputHomeMentionPopup.emptyNotFound',
    );
    expect(props.onClose).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('tab', {
        name: 'PC.Components.ChatInputCommands.plugin',
      }),
    );
    await screen.findByText('搜索工具');
    rerender(<SlashPopup {...props} searchText="搜索" />);
    await waitFor(() =>
      expect(getList).toHaveBeenLastCalledWith(
        'Plugin',
        expect.objectContaining({ kw: '搜索' }),
      ),
    );
  });
});

describe('键盘、分页和错误状态', () => {
  it('Backspace 删除技能 chip 后清空 skillIds，撤销恢复，clear 同步清空', async () => {
    const ref = createRef<MentionEditorHandle>();
    const ids = vi.fn();
    const { container } = render(
      <MentionEditor
        ref={ref}
        autoFocus={false}
        onPaste={vi.fn()}
        onSkillIdsChange={ids}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    act(() => ref.current?.handleAtIconMentionSelect(skill));
    const chip = editor.querySelector('[data-mention-id]')!;
    caret(editor, Array.from(editor.childNodes).indexOf(chip) + 1);
    fireEvent.keyDown(editor, { key: 'Backspace' });
    expect(ids).toHaveBeenLastCalledWith([]);
    fireEvent.keyDown(editor, { key: 'z', ctrlKey: true });
    expect(ids).toHaveBeenLastCalledWith([42]);
    await act(async () => {});
    act(() => ref.current?.clear());
    expect(editor.textContent).toBe('');
    expect(ids).toHaveBeenLastCalledWith([]);
  });
  it('方向键在最后一项加载下一页并选择新一页首项', async () => {
    vi.mocked(apiSkillListForAt).mockImplementation(
      async (params) =>
        ({
          code: SUCCESS_CODE,
          data: {
            records:
              params.page === 1
                ? Array.from({ length: 12 }, (_, index) => ({
                    ...skill,
                    name: `技能${index}`,
                    targetId: index,
                  }))
                : [{ ...skill, name: '第二页技能' }],
            total: 13,
          },
        } as never),
    );
    const ref =
      createRef<
        import('@/components/ChatInputHome/MentionPopup/types').MentionPopupHandle
      >();
    const select = vi.fn();
    render(
      <SlashPopup
        ref={ref}
        visible
        position={{ left: 0 }}
        onSelect={select}
        onClose={vi.fn()}
      />,
    );
    await screen.findByText('技能0');
    for (let i = 0; i < 12; i++) act(() => ref.current?.handleArrowDown());
    await screen.findByText('第二页技能');
    act(() => ref.current?.handleSelectCurrentItem());
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ name: '第二页技能' }),
    );
  });
  it('快速搜索忽略过期响应', async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(apiSkillListForAt).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = (value) =>
            resolve(value as Awaited<ReturnType<typeof apiSkillListForAt>>);
        }),
    );
    const props = {
      visible: true,
      position: { left: 0 },
      onSelect: vi.fn(),
      onClose: vi.fn(),
    };
    const { rerender } = render(<SlashPopup {...props} searchText="旧" />);
    await waitFor(() => expect(apiSkillListForAt).toHaveBeenCalled());
    rerender(<SlashPopup {...props} searchText="写作" />);
    await screen.findByText('写作');
    await act(async () =>
      finish({
        code: SUCCESS_CODE,
        data: { records: [{ ...skill, name: '旧结果' }], total: 1 },
      }),
    );
    expect(screen.queryByText('旧结果')).toBeNull();
  });
  it('文件请求失败显示可恢复错误而不是空白或未处理异常', async () => {
    render(
      <MentionPopup
        visible
        position={{ left: 0 }}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onFetchMentionFiles={async () => {
          throw new Error('network');
        }}
      />,
    );
    await screen.findByText('PC.Components.ChatInputCommands.loadFailed');
  });
});

describe('capability 模式（会话输入框 / 唤起添加能力弹窗）', () => {
  beforeEach(() => {
    capabilityModalProps.open = false;
    capabilityModalProps.onSelect = undefined;
    capabilityModalProps.onClose = undefined;
  });

  it('输入 / 即打开能力弹窗并清除触发串，不弹光标浮层', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        slashMode="capability"
        onPaste={vi.fn()}
        onChange={onChange}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    expect(capabilityModalProps.open).toBe(true);
    expect(getSerializedEditorText(editor)).toBe('');
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('文本中间出现 / 触发时清除整个触发串，两侧文字保留', () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        slashMode="capability"
        onPaste={vi.fn()}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    // / 后须紧跟关键字才触发（防误触白名单），删除范围是 "/后" 整个触发串
    type(editor, '前 /后');
    expect(capabilityModalProps.open).toBe(true);
    expect(getSerializedEditorText(editor)).toBe('前 ');
  });

  it('弹窗选中技能：光标处插 chip 并产生 skillIds', () => {
    const ids = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        slashMode="capability"
        onPaste={vi.fn()}
        onSkillIdsChange={ids}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    act(() =>
      capabilityModalProps.onSelect?.({
        key: 'skill:system:1',
        resourceType: 'skill',
        source: 'system',
        rawId: 1,
        targetId: 42,
        name: '写作',
        icon: '',
        description: '技能描述',
      }),
    );
    expect(editor.querySelector('[data-mention-kind="skill"]')).not.toBeNull();
    expect(getSerializedEditorText(editor)).toBe('@写作 ');
    expect(ids).toHaveBeenLastCalledWith([42]);
  });

  it('弹窗选中专家：不进输入框（无 chip），单选通知 onExpertSelect', () => {
    const onExpertSelect = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        slashMode="capability"
        onPaste={vi.fn()}
        onExpertSelect={onExpertSelect}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    act(() =>
      capabilityModalProps.onSelect?.({
        key: 'expert:system:1',
        resourceType: 'expert',
        source: 'system',
        rawId: 1,
        targetId: 7,
        name: '专家甲',
        icon: '',
        description: '',
      }),
    );
    // 专家不插 chip：编辑器无 expert chip，文本不含专家名
    expect(
      editor.querySelectorAll('[data-mention-kind="expert"]'),
    ).toHaveLength(0);
    expect(getSerializedEditorText(editor)).toBe('');
    expect(onExpertSelect).toHaveBeenCalledTimes(1);
    expect(onExpertSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ targetId: 7, name: '专家甲' }),
    );
  });

  it('弹窗选中连接器：不入编辑器文本，走 onPluginSelect 并映射为 Mcp 组件', () => {
    const selected = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        slashMode="capability"
        onPaste={vi.fn()}
        onPluginSelect={selected}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    act(() =>
      capabilityModalProps.onSelect?.({
        key: 'connector:system:oss',
        resourceType: 'connector',
        source: 'system',
        rawId: 'oss',
        targetId: 73,
        name: 'OSS 存储',
        description: '',
      }),
    );
    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'plugin',
        targetId: 73,
        componentType: 'Mcp',
      }),
    );
    expect(editor.querySelector('[data-mention-id]')).toBeNull();
  });

  it('关闭弹窗：复位 open 并把焦点交还编辑器', () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        slashMode="capability"
        onPaste={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    act(() => capabilityModalProps.onClose?.());
    expect(capabilityModalProps.open).toBe(false);
    expect(document.activeElement).toBe(editor);
  });
});

describe('插件选择与草稿兼容', () => {
  it('插件只追加一次，现有同 ID 工作流不受影响，新插件可在组件栏取消', () => {
    const { result } = renderHook(() => {
      const selected = useSelectedComponent();
      return {
        ...selected,
        ...useSlashPlugins(
          [],
          selected.selectedComponentList,
          selected.handleSelectComponent,
        ),
      };
    });
    const workflow = { id: 73, type: AgentComponentTypeEnum.Workflow };
    act(() => result.current.handleSelectComponent(workflow));
    act(() => result.current.onPluginSelect?.(plugin));
    act(() => result.current.onPluginSelect?.(plugin));
    expect(result.current.selectedComponentList).toEqual([
      workflow,
      { id: 73, type: AgentComponentTypeEnum.Plugin },
    ]);
    expect(result.current.commandManualComponents).toHaveLength(1);
    act(() =>
      result.current.handleSelectComponent({
        id: 73,
        type: AgentComponentTypeEnum.Plugin,
      }),
    );
    expect(result.current.selectedComponentList).toEqual([workflow]);
    expect(result.current.commandManualComponents).toHaveLength(0);
  });
  it('文件引用以文本存储，技能仍使用 version 1 的 skillIds 快照', () => {
    saveDraft('mention-test', {
      version: 1,
      text: '@output/报告.md @写作 ',
      skillIds: [42],
    });
    expect(loadDraft('mention-test')).toMatchObject({
      version: 1,
      text: '@output/报告.md @写作 ',
      skillIds: [42],
    });
    localStorage.removeItem('chat_draft:mention-test');
  });
});
