import {
  loadDraft,
  saveDraft,
} from '@/components/business-component/ChatInputUnified/draftStorage';
import MentionEditor, {
  detectMention,
  getSerializedEditorText,
} from '@/components/ChatInputHome/MentionEditor';
import MentionPopup from '@/components/ChatInputHome/MentionPopup';
import type { MentionEditorHandle } from '@/components/ChatInputHome/MentionPopup/types';
import { useSlashPlugins } from '@/components/ChatInputHome/useSlashPlugins';
import useSelectedComponent from '@/hooks/useSelectedComponent';
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
      resourceTypes?: string[];
    }),
);
vi.mock('@/components/ChatInputHome/CapabilityModal', () => ({
  default: (props: typeof capabilityModalProps) => {
    Object.assign(capabilityModalProps, props);
    return null;
  },
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
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
  it('无文件数据源时 @ 输入为普通文本，不弹浮层', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onChange={onChange} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@写作');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(capabilityModalProps.open).not.toBe(true);
    expect(onChange).toHaveBeenLastCalledWith('@写作');
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
  it('换行后 / 触发能力弹窗；已有 chip 跨文本节点保留', () => {
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
    // / 触发打开能力弹窗并清除触发串，此前插入的 chip 不受影响
    expect(capabilityModalProps.open).toBe(true);
    expect(editor.querySelectorAll('[data-mention-id]')).toHaveLength(1);
  });
  it('IME 输入中不触发弹窗，组合结束后触发；Escape 不发送', () => {
    const send = vi.fn();
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onPressEnter={send} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    fireEvent.compositionStart(editor);
    type(editor, '/写作');
    expect(capabilityModalProps.open).not.toBe(true);
    fireEvent.compositionEnd(editor);
    expect(capabilityModalProps.open).toBe(true);
    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(send).not.toHaveBeenCalled();
  });
});

describe('列表数据一致性', () => {
  it('打开时数据加载中：弹层保持打开并显示加载中，而非被空列表收起', async () => {
    let resolveFetch!: (items: (typeof file)[]) => void;
    const onClose = vi.fn();
    render(
      <MentionPopup
        visible
        position={{ left: 0 }}
        onSelect={vi.fn()}
        onClose={onClose}
        onFetchMentionFiles={() =>
          new Promise<(typeof file)[]>((r) => {
            resolveFetch = r;
          })
        }
      />,
    );
    // 取数未返回：展示 loading 文案，且不触发「无文件自动收起」
    expect(
      screen.getByText('PC.Components.ChatInputHomeMentionPopup.loading'),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    // 刷新微任务让 onFetchMentionFiles 被调用（pending promise 创建）
    await act(async () => {});
    await act(async () => resolveFetch([file]));
    await screen.findByText('报告.md');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('真实挂载序列（先不可见再打开）：首次打开不被空列表自动收起', async () => {
    // 复现真机时序：弹层组件随编辑器常驻（visible=false 挂载），输入 @ 后才翻开。
    // 曾因自动收起 effect 读到同 commit 不可见的状态更新（loading=false+空列表），
    // 首次 @ 打开即被收起、第二次起才正常——表现为「必须先输过 / 才生效」
    let resolveFetch!: (items: (typeof file)[]) => void;
    const onClose = vi.fn();
    const props = {
      position: { left: 0 },
      onSelect: vi.fn(),
      onClose,
      onFetchMentionFiles: () =>
        new Promise<(typeof file)[]>((r) => {
          resolveFetch = r;
        }),
    };
    const { rerender } = render(<MentionPopup {...props} visible={false} />);
    // 打开弹层（取数 pending）
    rerender(<MentionPopup {...props} visible />);
    expect(
      screen.getByText('PC.Components.ChatInputHomeMentionPopup.loading'),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {});
    await act(async () => resolveFetch([file]));
    await screen.findByText('报告.md');
    expect(onClose).not.toHaveBeenCalled();
  });

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
});

describe('键盘与错误状态', () => {
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
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onChange={onChange} />,
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
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onChange={vi.fn()} />,
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

  it('弹窗选中资料库：doc chip 派生 selectedDocs 按 SelectedDocDto 契约（slugId/title/pageType）', () => {
    const onDocsChange = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        onDocsChange={onDocsChange}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    act(() =>
      capabilityModalProps.onSelect?.({
        key: 'knowledge:team:9',
        resourceType: 'knowledge',
        source: 'team',
        rawId: 9,
        slugId: 'hgwzjmk7m9LBCSyr',
        name: '测试1-1',
        pageType: 'doc',
      }),
    );
    expect(editor.querySelector('[data-mention-kind="doc"]')).not.toBeNull();
    // chat 请求契约字段：slugId + title（非 name） + pageType
    expect(onDocsChange).toHaveBeenLastCalledWith([
      { slugId: 'hgwzjmk7m9LBCSyr', title: '测试1-1', pageType: 'doc' },
    ]);
  });

  it('弹窗选中连接器：不入编辑器文本，走 onPluginSelect 并映射为 Mcp 组件', () => {
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
      <MentionEditor autoFocus={false} onPaste={vi.fn()} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    act(() => capabilityModalProps.onClose?.());
    expect(capabilityModalProps.open).toBe(false);
    expect(document.activeElement).toBe(editor);
  });

  it('默认不开放专家类型（仅隐藏入口），显式传 capabilityResourceTypes 时透传', () => {
    const { unmount } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} />,
    );
    // 产品策略：选择专家仅首页开放，其余入口缺省不含 expert
    expect(capabilityModalProps.resourceTypes).not.toContain('expert');
    expect(capabilityModalProps.resourceTypes).toEqual(
      expect.arrayContaining(['skill', 'connector', 'knowledge']),
    );
    unmount();

    render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        capabilityResourceTypes={['skill', 'expert']}
      />,
    );
    expect(capabilityModalProps.resourceTypes).toEqual(['skill', 'expert']);
  });

  it('enableMention=false 时 / 仍可唤起能力弹窗（能力弹窗不随智能体配置门控）', () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        enableMention={false}
        onPaste={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    expect(capabilityModalProps.open).toBe(true);
    expect(getSerializedEditorText(editor)).toBe('');
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
