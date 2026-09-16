import {
  loadDraft,
  saveDraft,
} from '@/components/business-component/ChatInputUnified/draftStorage';
import AtResourcePopup from '@/components/ChatInputHome/AtResourcePopup';
import type { AtResourcePopupProps } from '@/components/ChatInputHome/AtResourcePopup/types';
import MentionEditor, {
  detectMention,
  getSerializedEditorText,
} from '@/components/ChatInputHome/MentionEditor';
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
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock('@/components/ChatInputHome/MentionEditor/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/ChatInputHome/AtResourcePopup/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
// 内嵌列表组件（ExpertListView/KnowledgeListView/SkillListView）引用
// services 与 umi，vitest 环境不可用；桩捕获 props 供用例驱动选中/断言透传
const embedLists = vi.hoisted(
  () =>
    ({
      expert: {} as Record<string, any>,
      knowledge: {} as Record<string, any>,
      skill: {} as Record<string, any>,
    } as {
      expert: Record<string, any>;
      knowledge: Record<string, any>;
      skill: Record<string, any>;
    }),
);
vi.mock('@/components/business-component/ExpertListView', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, unknown>) => {
      Object.assign(embedLists.expert, props);
      return React.createElement('div', { 'data-testid': 'at-expert-list' });
    },
  };
});
vi.mock('@/components/business-component/KnowledgeListView', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, unknown>) => {
      Object.assign(embedLists.knowledge, props);
      return React.createElement('div', { 'data-testid': 'at-knowledge-list' });
    },
  };
});
vi.mock('@/components/business-component/SkillListView', async () => {
  const React = await import('react');
  return {
    default: (props: Record<string, unknown>) => {
      Object.assign(embedLists.skill, props);
      return React.createElement('div', { 'data-testid': 'at-skill-list' });
    },
  };
});
// CapabilityModal 引用 services（umi request），vitest 环境不可用；用桩捕获 props 驱动选中/关闭
const capabilityModalProps = vi.hoisted(
  () =>
    ({} as {
      open?: boolean;
      onSelect?: (item: unknown) => void;
      onClose?: () => void;
      resourceTypes?: string[];
      defaultResourceType?: string;
      defaultConnectedView?: boolean;
      defaultUsedView?: boolean;
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
  embedLists.expert = {};
  embedLists.knowledge = {};
  embedLists.skill = {};
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
  it('换行后 / 触发技能弹层；已有 chip 跨文本节点保留', () => {
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
    // / 触发打开技能弹层（触发串保留为搜索词），此前插入的 chip 不受影响
    expect(screen.getByTestId('at-skill-list')).toBeInTheDocument();
    expect(capabilityModalProps.open).not.toBe(true);
    expect(editor.querySelectorAll('[data-mention-id]')).toHaveLength(1);
  });
  it(
    '+ 号入口插入触发字符：无有效光标时落在真实行尾，' +
      '多行内容（块级 div 包裹）不另起新行',
    () => {
      const ref = createRef<MentionEditorHandle>();
      const { container } = render(
        <MentionEditor
          ref={ref}
          autoFocus={false}
          onPaste={vi.fn()}
          onChange={vi.fn()}
        />,
      );
      const editor = container.querySelector(
        '[contenteditable="true"]',
      ) as HTMLElement;
      // 模拟 Chrome 多行结构（换行内容包进 div）+ 菜单夺焦后无有效 selection
      editor.innerHTML = '<div>第一行</div><div>第二行</div>';
      window.getSelection()?.removeAllRanges();
      act(() => ref.current?.insertTriggerText('@'));
      // 插入第二行文本末尾（容器级末尾会渲染为新的一行）
      const lines = editor.querySelectorAll('div');
      expect(lines[lines.length - 1].textContent).toBe('第二行 @');
      expect(editor.childNodes.length).toBe(2);

      // 单行裸文本：插在文本末尾
      editor.innerHTML = '写个报告';
      window.getSelection()?.removeAllRanges();
      act(() => ref.current?.insertTriggerText('/'));
      expect(getSerializedEditorText(editor)).toBe('写个报告 /');
    },
  );
  it(
    '+ 号入口插入触发字符：空编辑器（残留 <br> 占位）不另起新行，' +
      '有光标记录时恢复到原光标位置',
    () => {
      const ref = createRef<MentionEditorHandle>();
      const { container } = render(
        <MentionEditor
          ref={ref}
          autoFocus={false}
          onPaste={vi.fn()}
          onChange={vi.fn()}
        />,
      );
      const editor = container.querySelector(
        '[contenteditable="true"]',
      ) as HTMLElement;
      // Chrome 空 contenteditable 残留 <br>：插到 BR 之前（BR 之后会渲染新行）
      editor.innerHTML = '<br>';
      window.getSelection()?.removeAllRanges();
      act(() => ref.current?.insertTriggerText('@'));
      expect(getSerializedEditorText(editor)).toBe('@');
      expect(editor.firstChild?.nodeType).toBe(Node.TEXT_NODE);

      // 光标在文本中间 → selectionchange 记录 → 菜单夺焦后插入恢复到中间
      //（光标前非空白自动补空格——@ 触发白名单要求前邻空白）
      editor.innerHTML = '前后';
      caret(editor.firstChild!, 1);
      document.dispatchEvent(new Event('selectionchange'));
      window.getSelection()?.removeAllRanges();
      act(() => ref.current?.insertTriggerText('@'));
      expect(getSerializedEditorText(editor)).toBe('前 @后');
    },
  );
  it('IME 输入中不触发弹窗，组合结束后触发技能弹层；Escape 不发送', () => {
    const send = vi.fn();
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onPressEnter={send} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    fireEvent.compositionStart(editor);
    type(editor, '/写作');
    expect(screen.queryByTestId('at-skill-list')).toBeNull();
    fireEvent.compositionEnd(editor);
    expect(screen.getByTestId('at-skill-list')).toBeInTheDocument();
    fireEvent.keyDown(editor, { key: 'Escape' });
    expect(send).not.toHaveBeenCalled();
  });
});

describe('外部技能回填（defaultMentions）', () => {
  // jsdom 未实现 innerText（回显 effect 的空态判定依赖），以 textContent 近似
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'innerText', {
      get(this: HTMLElement) {
        return this.textContent;
      },
      configurable: true,
    });
  });

  it('纯 chip 态二次带入整组替换；混入用户输入后不再覆盖', async () => {
    const onChange = vi.fn();
    const utils = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        onChange={onChange}
        defaultMentions={[{ kind: 'skill', name: '写作', targetId: 42 }]}
      />,
    );
    const editor = utils.container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    // 首次带入：空编辑器回填 chip
    await waitFor(() =>
      expect(
        editor
          .querySelector('[data-mention-id]')
          ?.getAttribute('data-mention-name'),
      ).toBe('写作'),
    );

    // 第二次带入（停留首页再次全局搜索/技能页选择）：纯 chip 态整组替换
    utils.rerender(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        onChange={onChange}
        defaultMentions={[{ kind: 'skill', name: '搜索', targetId: 73 }]}
      />,
    );
    await waitFor(() => {
      const chips = editor.querySelectorAll('[data-mention-id]');
      expect(chips).toHaveLength(1);
      expect(chips[0].getAttribute('data-mention-name')).toBe('搜索');
    });

    // 用户手动输入后：再次带入不覆盖（保护输入内容）
    editor.appendChild(document.createTextNode('补充指令'));
    fireEvent.input(editor);
    utils.rerender(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        onChange={onChange}
        defaultMentions={[{ kind: 'skill', name: '翻译', targetId: 9 }]}
      />,
    );
    await act(async () => {});
    expect(editor.querySelectorAll('[data-mention-id]')).toHaveLength(1);
    expect(
      editor
        .querySelector('[data-mention-id]')
        ?.getAttribute('data-mention-name'),
    ).toBe('搜索');
    expect(editor.textContent).toContain('补充指令');
  });
});

describe('列表数据一致性（@ 弹层·上下文文件 tab）', () => {
  const renderPopup = (props: Partial<AtResourcePopupProps>) => {
    // Partial 覆盖缺省必填项后整体断言收口（测试助手惯用法）
    const merged = {
      mode: 'session',
      position: { left: 0 },
      onSelectFile: vi.fn(),
      onSelectDoc: vi.fn(),
      onSelectExpert: vi.fn(),
      onSelectSkill: vi.fn(),
      onMore: vi.fn(),
      onClose: vi.fn(),
      ...props,
    } as AtResourcePopupProps;
    return render(<AtResourcePopup {...merged} />);
  };

  it('打开时数据加载中：弹层保持打开并显示加载中，而非被空列表切走', async () => {
    let resolveFetch!: (items: (typeof file)[]) => void;
    renderPopup({
      visible: true,
      onFetchMentionFiles: () =>
        new Promise<(typeof file)[]>((r) => {
          resolveFetch = r;
        }),
    });
    // 取数未返回：展示 loading 态，且不触发「空文件切资料库 tab」
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('报告.md')).toBeNull();
    // 判定期间不显示切换器（打开即判定，文件 tab 不先闪现）
    expect(
      screen.queryByText('PC.Components.AtResourcePopup.tabFile'),
    ).toBeNull();
    // 刷新微任务让 onFetchMentionFiles 被调用（pending promise 创建）
    await act(async () => {});
    await act(async () => resolveFetch([file]));
    await screen.findByText('报告.md');
    // 文件非空：停留在文件 tab，未渲染资料库列表
    expect(screen.queryByTestId('at-knowledge-list')).toBeNull();
  });

  it('真实挂载序列（先不可见再打开）：首次打开不被空列表判定抢先切走', async () => {
    // 复现真机时序：弹层组件随编辑器常驻（visible=false 挂载），输入 @ 后才翻开。
    // 曾因空判定 effect 读到同 commit 不可见的状态更新（loading=false+空列表），
    // 首次 @ 打开即被切走、第二次起才正常——表现为「必须先输过 / 才生效」
    let resolveFetch!: (items: (typeof file)[]) => void;
    const props = {
      onFetchMentionFiles: () =>
        new Promise<(typeof file)[]>((r) => {
          resolveFetch = r;
        }),
    };
    const { rerender } = renderPopup({ ...props, visible: false });
    // 打开弹层（取数 pending）
    rerender(
      <AtResourcePopup
        mode="session"
        position={{ left: 0 }}
        visible
        onSelectFile={vi.fn()}
        onSelectDoc={vi.fn()}
        onSelectExpert={vi.fn()}
        onSelectSkill={vi.fn()}
        onMore={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('at-knowledge-list')).toBeNull();
    await act(async () => {});
    await act(async () => resolveFetch([file]));
    await screen.findByText('报告.md');
    expect(screen.queryByTestId('at-knowledge-list')).toBeNull();
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
      onFetchMentionFiles: fetch,
    };
    const { rerender } = renderPopup({ ...props, visible: true });
    const popupRoot = () => document.querySelector('[data-at-popup]');
    await waitFor(() =>
      expect(popupRoot()?.querySelectorAll('[data-at-file-key]')).toHaveLength(
        100,
      ),
    );
    rerender(
      <AtResourcePopup
        mode="session"
        position={{ left: 0 }}
        visible
        searchText="报告"
        onSelectFile={vi.fn()}
        onSelectDoc={vi.fn()}
        onSelectExpert={vi.fn()}
        onSelectSkill={vi.fn()}
        onMore={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />,
    );
    await screen.findByText('报告.md');
    expect(fetch).toHaveBeenCalledTimes(1);
    rerender(
      <AtResourcePopup
        mode="session"
        position={{ left: 0 }}
        onSelectFile={vi.fn()}
        onSelectDoc={vi.fn()}
        onSelectExpert={vi.fn()}
        onSelectSkill={vi.fn()}
        onMore={vi.fn()}
        onClose={vi.fn()}
        {...props}
        visible={false}
      />,
    );
    rerender(
      <AtResourcePopup
        mode="session"
        position={{ left: 0 }}
        visible
        onSelectFile={vi.fn()}
        onSelectDoc={vi.fn()}
        onSelectExpert={vi.fn()}
        onSelectSkill={vi.fn()}
        onMore={vi.fn()}
        onClose={vi.fn()}
        {...props}
      />,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
  it('切换文件数据源时忽略旧会话的迟到响应', async () => {
    let resolve!: (value: (typeof file)[]) => void;
    const oldFetch = () =>
      new Promise<(typeof file)[]>((r) => {
        resolve = r;
      });
    const base = {
      mode: 'session' as const,
      position: { left: 0 },
      visible: true,
      onSelectFile: vi.fn(),
      onSelectDoc: vi.fn(),
      onSelectExpert: vi.fn(),
      onSelectSkill: vi.fn(),
      onMore: vi.fn(),
      onClose: vi.fn(),
    };
    const { rerender } = render(
      <AtResourcePopup {...base} onFetchMentionFiles={oldFetch} />,
    );
    await act(async () => {});
    rerender(
      <AtResourcePopup
        {...base}
        onFetchMentionFiles={async () => [
          { ...file, name: '新会话', relativePath: 'new' },
        ]}
      />,
    );
    await screen.findByText('新会话');
    await act(async () => resolve([file]));
    expect(screen.queryByText('报告.md')).toBeNull();
  });
  it('文件为空且无搜索词时收敛为纯资料库：文件 tab 移除、无切换器', async () => {
    renderPopup({
      visible: true,
      onFetchMentionFiles: async () => [],
    });
    await act(async () => {});
    // 资料库列表直接展示（唯一内容）
    await waitFor(() =>
      expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument(),
    );
    // 文件 tab 已收敛：切换器整体隐藏（单 tab 无切换必要）
    expect(
      screen.queryByText('PC.Components.AtResourcePopup.tabFile'),
    ).toBeNull();
    expect(
      screen.queryByText('PC.Components.AtResourcePopup.tabKnowledge'),
    ).toBeNull();
    expect(screen.queryByText('报告.md')).toBeNull();
  });

  it('文件可用性实时校正：先空收敛纯资料库，生成文件后重开恢复文件 tab', async () => {
    let empty = true;
    const fetcher = vi.fn(async () => (empty ? [] : [{ ...file }]));
    const base = {
      mode: 'session' as const,
      position: { left: 0 },
      onSelectFile: vi.fn(),
      onSelectDoc: vi.fn(),
      onSelectExpert: vi.fn(),
      onSelectSkill: vi.fn(),
      onMore: vi.fn(),
      onClose: vi.fn(),
      onFetchMentionFiles: fetcher,
    };
    const { rerender } = render(<AtResourcePopup {...base} visible />);
    // 首开：无文件 → 收敛纯资料库（无切换器）
    await waitFor(() =>
      expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument(),
    );
    expect(
      screen.queryByText('PC.Components.AtResourcePopup.tabFile'),
    ).toBeNull();

    // 模拟会话中生成文件后关闭再打开（FilePanel 常驻挂载,重拉校正）
    empty = false;
    rerender(<AtResourcePopup {...base} visible={false} />);
    rerender(<AtResourcePopup {...base} visible />);
    // 文件 tab 恢复（切换器重现）,切过去可见新文件
    const fileTab = await screen.findByText(
      'PC.Components.AtResourcePopup.tabFile',
    );
    fireEvent.click(fileTab);
    await screen.findByText('报告.md');
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
      <AtResourcePopup
        mode="session"
        visible
        position={{ left: 0 }}
        onSelectFile={vi.fn()}
        onSelectDoc={vi.fn()}
        onSelectExpert={vi.fn()}
        onSelectSkill={vi.fn()}
        onMore={vi.fn()}
        onClose={vi.fn()}
        onFetchMentionFiles={async () => {
          throw new Error('network');
        }}
      />,
    );
    await screen.findByText('PC.Components.ChatInputCommands.loadFailed');
  });
});

describe('/ 弹层·技能便捷视图（单列表，与 @ 交互一致）', () => {
  beforeEach(() => {
    capabilityModalProps.open = false;
    capabilityModalProps.onSelect = undefined;
    capabilityModalProps.onClose = undefined;
  });

  it('输入 / 即唤起技能弹层（便捷视图 list 变体），触发串保留为实时搜索词', () => {
    const onChange = vi.fn();
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onChange={onChange} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/写作');
    expect(screen.getByTestId('at-skill-list')).toBeInTheDocument();
    expect(embedLists.skill).toMatchObject({
      type: 'convenient',
      variant: 'list',
      keyword: '写作',
    });
    // 与 @ 同款：触发串保留（实时搜索语义），能力大弹窗不再被 '/' 唤起
    expect(capabilityModalProps.open).not.toBe(true);
    expect(getSerializedEditorText(editor)).toBe('/写作');
    expect(onChange).toHaveBeenLastCalledWith('/写作');
  });

  it('技能弹层选中技能：删触发串 + 光标处插 chip 并产生 skillIds', async () => {
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
    await waitFor(() =>
      expect(screen.getByTestId('at-skill-list')).toBeInTheDocument(),
    );
    act(() =>
      embedLists.skill.onSelect?.({
        key: 'skill:convenient:1',
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

  it('技能弹层「更多」：删触发串并打开能力大弹窗定位技能维度', async () => {
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onChange={vi.fn()} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/写作');
    await waitFor(() =>
      expect(screen.getByTestId('at-skill-list')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('PC.Components.AtResourcePopup.more'));
    expect(capabilityModalProps.open).toBe(true);
    expect(capabilityModalProps.defaultResourceType).toBe('skill');
    // '/' 触发串随「更多」打开被删除（与 @ 更多同款语义）
    expect(getSerializedEditorText(editor)).toBe('');
  });

  it('文本中间 / 触发同样唤起技能弹层（触发串与两侧文字保留）', () => {
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onChange={vi.fn()} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    // / 后须紧跟关键字才触发（防误触白名单），触发串保留为搜索词
    type(editor, '前 /后');
    expect(screen.getByTestId('at-skill-list')).toBeInTheDocument();
    expect(getSerializedEditorText(editor)).toBe('前 /后');
  });

  it('enableMention=false（allowAtSkill 非 1）时 / 为纯文本，不唤起技能弹层', () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        enableMention={false}
        onPaste={vi.fn()}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/写作');
    expect(screen.queryByTestId('at-skill-list')).toBeNull();
    expect(getSerializedEditorText(editor)).toBe('/写作');
  });

  it('Tab 在「编辑器 ↔ 更多按钮」间循环：聚焦更多后可快捷跳转能力大弹窗', async () => {
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onChange={vi.fn()} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    await waitFor(() =>
      expect(screen.getByTestId('at-skill-list')).toBeInTheDocument(),
    );
    // Tab → 聚焦「更多」按钮
    fireEvent.keyDown(editor, { key: 'Tab' });
    const moreBtn = document.querySelector<HTMLElement>(
      '[data-at-popup] [data-at-more]',
    );
    expect(moreBtn).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(moreBtn));
    // 焦点移入弹层（编辑器失焦）不触发延迟关闭——弹层保持打开
    fireEvent.blur(editor);
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
    });
    expect(screen.getByTestId('at-skill-list')).toBeInTheDocument();
    // 再 Tab → 焦点回编辑器（循环，不跳出弹窗）
    fireEvent.keyDown(moreBtn!, { key: 'Tab' });
    await waitFor(() => expect(document.activeElement).toBe(editor));
    // 更多聚焦态 Enter（原生触发等价 click）→ 能力大弹窗定位技能维度
    fireEvent.keyDown(editor, { key: 'Tab' });
    await waitFor(() => expect(document.activeElement).toBe(moreBtn));
    fireEvent.click(moreBtn!);
    expect(capabilityModalProps.open).toBe(true);
    expect(capabilityModalProps.defaultResourceType).toBe('skill');
  });

  it('付费套餐弹窗夺焦不关闭弹层：antd Modal 门层期间失焦/外点均放行（弹层是弹窗宿主），Modal 层撤走后才正常关闭', async () => {
    const { container } = render(
      <MentionEditor autoFocus={false} onPaste={vi.fn()} onChange={vi.fn()} />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '/');
    await waitFor(() =>
      expect(screen.getByTestId('at-skill-list')).toBeInTheDocument(),
    );
    // 模拟内嵌技能列表内聚的付费套餐弹窗（真实链路：回车选付费技能 →
    // 付费拦截门弹套餐）：antd Modal portal 到 body，不在弹层 wrapper 内
    const modalWrap = document.createElement('div');
    modalWrap.className = 'ant-modal-wrap';
    const modalDialog = document.createElement('div');
    modalDialog.tabIndex = -1;
    modalWrap.appendChild(modalDialog);
    document.body.appendChild(modalWrap);
    // 1) 套餐弹窗夺焦（activeElement 落入 Modal 层）+ 编辑器失焦：
    //    200ms 延迟关闭判定须放行——否则弹层卸载连锁关闭套餐弹窗
    act(() => modalDialog.focus());
    fireEvent.blur(editor);
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
    });
    expect(screen.getByTestId('at-skill-list')).toBeInTheDocument();
    // 2) 套餐弹窗内的点击（mousedown）不当作「弹层外点击」
    fireEvent.mouseDown(modalDialog);
    expect(screen.getByTestId('at-skill-list')).toBeInTheDocument();
    // 3) 负向对照：Modal 层撤走（焦点随节点移除回落 body）、失焦后正常关闭
    modalWrap.remove();
    fireEvent.blur(editor);
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
    });
    expect(screen.queryByTestId('at-skill-list')).not.toBeInTheDocument();
  });
});

describe('能力大弹窗（编程唤起与选中分流）', () => {
  beforeEach(() => {
    capabilityModalProps.open = false;
    capabilityModalProps.onSelect = undefined;
    capabilityModalProps.onClose = undefined;
  });

  it('头像组编程唤起定位连接器·已连接；关闭后复位 open 并焦点交还编辑器', () => {
    const ref = createRef<MentionEditorHandle>();
    const { container } = render(
      <MentionEditor
        ref={ref}
        autoFocus={false}
        onPaste={vi.fn()}
        onChange={vi.fn()}
      />,
    );
    // 头像组编程唤起：连接器维度 + 「已连接」聚合页签
    act(() => {
      ref.current?.openCapabilityWithType?.('connector', {
        connectedView: true,
      });
    });
    expect(capabilityModalProps.open).toBe(true);
    expect(capabilityModalProps.defaultResourceType).toBe('connector');
    expect(capabilityModalProps.defaultConnectedView).toBe(true);
    act(() => {
      capabilityModalProps.onClose?.();
    });
    expect(capabilityModalProps.open).toBe(false);
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    expect(document.activeElement).toBe(editor);
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
    expect(onExpertSelect).toHaveBeenCalledTimes(1);
    expect(onExpertSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ targetId: 7, name: '专家甲' }),
    );
  });

  it('弹窗打开期间失焦不清光标：选专家关闭后光标保持原输入位置（不回行首）', async () => {
    const ref = createRef<MentionEditorHandle>();
    const { container } = render(
      <MentionEditor
        ref={ref}
        autoFocus={false}
        onPaste={vi.fn()}
        onExpertSelect={vi.fn()}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    // 已有内容、光标在行尾，编程唤起能力弹窗（记录光标）
    type(editor, '帮我写周报');
    act(() => ref.current?.openCapabilityWithType?.('skill'));
    expect(capabilityModalProps.open).toBe(true);
    // 模拟真实弹窗夺焦：选区离开编辑器 + 编辑器失焦（handleBlur 200ms 延迟收口）
    window.getSelection()?.removeAllRanges();
    fireEvent.blur(editor);
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
    });
    act(() => {
      capabilityModalProps.onSelect?.({
        key: 'expert:system:1',
        resourceType: 'expert',
        source: 'system',
        rawId: 1,
        targetId: 66,
        name: '智慧校园助手',
        icon: '',
        description: '',
      });
      capabilityModalProps.onClose?.();
    });
    // 光标恢复到原输入位置（行尾），而非被重置到编辑器开头
    const selection = window.getSelection();
    expect(selection?.rangeCount).toBe(1);
    const range = selection!.getRangeAt(0);
    expect(range.collapsed).toBe(true);
    const textNode = editor.firstChild as Text;
    expect(textNode?.nodeType).toBe(Node.TEXT_NODE);
    expect(range.startContainer).toBe(textNode);
    expect(range.startOffset).toBe(textNode.length);
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
});

describe('@ 弹层·首页模式（专家+资料库）', () => {
  beforeEach(() => {
    capabilityModalProps.open = false;
    capabilityModalProps.onSelect = undefined;
    capabilityModalProps.onClose = undefined;
  });

  it('首页 @ 唤起资源弹层：默认专家 tab（便捷视图 list 变体），关键字实时透传', async () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        atHomePanel
        capabilityResourceTypes={['skill', 'expert', 'knowledge']}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@架构');
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    expect(embedLists.expert).toMatchObject({
      type: 'convenient',
      variant: 'list',
      keyword: '架构',
    });
    // 首页模式无文件 tab：资料库列表初始不渲染
    expect(screen.queryByTestId('at-knowledge-list')).toBeNull();
    expect(screen.queryByText('报告.md')).toBeNull();
  });

  it('专家选中：删 @ 触发串并单选通知 onExpertSelect，不插 chip', async () => {
    const onExpertSelect = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        atHomePanel
        capabilityResourceTypes={['skill', 'expert', 'knowledge']}
        onExpertSelect={onExpertSelect}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@');
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    act(() =>
      embedLists.expert.onSelect?.({
        key: 'expert:used:1',
        rawId: 1,
        targetId: 7,
        name: '专家甲',
        icon: '',
        description: '专家描述',
      }),
    );
    expect(getSerializedEditorText(editor)).toBe('');
    expect(onExpertSelect).toHaveBeenCalledTimes(1);
    expect(onExpertSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ targetId: 7, name: '专家甲' }),
    );
    expect(editor.querySelector('[data-mention-id]')).toBeNull();
  });

  it('切资料库 tab 选中文档：doc chip 插入并按契约派生 selectedDocs', async () => {
    const onDocsChange = vi.fn();
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        atHomePanel
        capabilityResourceTypes={['skill', 'expert', 'knowledge']}
        onDocsChange={onDocsChange}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@');
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    // 切到资料库 tab（Segmented 项）
    fireEvent.click(
      screen.getByText('PC.Components.AtResourcePopup.tabKnowledge'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument(),
    );
    expect(embedLists.knowledge).toMatchObject({
      type: 'recent',
      variant: 'list',
    });
    act(() =>
      embedLists.knowledge.onSelect?.({
        key: 'knowledge:recent:9',
        rawId: 9,
        slugId: 'hgwzjmk7m9LBCSyr',
        name: '测试1-1',
        pageType: 'doc',
      }),
    );
    expect(editor.querySelector('[data-mention-kind="doc"]')).not.toBeNull();
    expect(onDocsChange).toHaveBeenLastCalledWith([
      { slugId: 'hgwzjmk7m9LBCSyr', title: '测试1-1', pageType: 'doc' },
    ]);
  });

  it('更多入口：删 @ 触发串并按当前 tab 定位打开能力弹窗，专家 tab 初始落「最近召唤」', async () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        atHomePanel
        capabilityResourceTypes={['skill', 'expert', 'knowledge']}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@');
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByText('PC.Components.AtResourcePopup.more'));
    expect(capabilityModalProps.open).toBe(true);
    // 专家 tab → 能力弹窗定位专家维度（首页开放范围）+ 初始「最近召唤」页签
    expect(capabilityModalProps.defaultResourceType).toBe('expert');
    expect(capabilityModalProps.defaultUsedView).toBe(true);
    expect(getSerializedEditorText(editor)).toBe('');
  });

  it('每次 @ 唤起回到最初状态：上次停留的资料库 tab 不保留，回默认专家 tab', async () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        atHomePanel
        capabilityResourceTypes={['skill', 'expert', 'knowledge']}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@');
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    // 停留到资料库 tab 后关闭
    fireEvent.click(
      screen.getByText('PC.Components.AtResourcePopup.tabKnowledge'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument(),
    );
    fireEvent.keyDown(editor, { key: 'Escape' });
    // 再次 @ 唤起：回到默认专家 tab（重挂重置,不保留上次停留）
    type(editor, '@');
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('at-knowledge-list')).toBeNull();
  });

  it('鼠标点击切换 tab：焦点交还编辑器后弹层不被失焦检查误关', async () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        atHomePanel
        capabilityResourceTypes={['skill', 'expert', 'knowledge']}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@');
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    // 模拟点击切换器:编辑器失焦(label→radio 聚焦)→ onChange 切 tab
    // 并把焦点/光标交还编辑器 → 200ms 失焦检查须放行编辑器焦点
    fireEvent.blur(editor);
    fireEvent.click(
      screen.getByText('PC.Components.AtResourcePopup.tabKnowledge'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument(),
    );
    expect(document.activeElement).toBe(editor);
    await act(async () => {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 250);
      });
    });
    // 弹层仍在(未被误关),停留在资料库 tab
    expect(screen.getByTestId('at-knowledge-list')).toBeInTheDocument();
  });

  it('弹层打开期间 Tab 不跳出弹窗：默认行为被拦截，焦点保持在编辑器（循环停靠点）', async () => {
    const { container } = render(
      <MentionEditor
        autoFocus={false}
        onPaste={vi.fn()}
        atHomePanel
        capabilityResourceTypes={['skill', 'expert', 'knowledge']}
        onChange={vi.fn()}
      />,
    );
    const editor = container.querySelector(
      '[contenteditable="true"]',
    ) as HTMLElement;
    type(editor, '@');
    await waitFor(() =>
      expect(screen.getByTestId('at-expert-list')).toBeInTheDocument(),
    );
    // fireEvent 返回 false = preventDefault 已被调用（焦点不会移出编辑器）
    expect(fireEvent.keyDown(editor, { key: 'Tab' })).toBe(false);
    expect(fireEvent.keyDown(editor, { key: 'Tab', shiftKey: true })).toBe(
      false,
    );
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
