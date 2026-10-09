import TiptapVariableInput from '@/components/TiptapVariableInput/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));

afterEach(cleanup);

describe('提示词编辑器内容更新生命周期', () => {
  it('初次回显提示词不触发内容更新或自动保存', async () => {
    const onChange = vi.fn();
    let editor: Editor | undefined;
    render(
      <TiptapVariableInput
        value={'# 旅行计划助手\n\n原始提示词'}
        onChange={onChange}
        getEditor={(instance) => {
          editor = instance;
        }}
      />,
    );

    await waitFor(() => expect(editor).toBeDefined());
    expect(editor!.getText()).toContain('原始提示词');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('外部回填和可编辑状态切换不触发内容更新', async () => {
    const onChange = vi.fn();
    let editor: Editor | undefined;
    const getEditor = (instance: Editor) => {
      editor = instance;
    };
    const { rerender } = render(
      <TiptapVariableInput
        value="原始提示词"
        onChange={onChange}
        getEditor={getEditor}
      />,
    );
    await waitFor(() => expect(editor).toBeDefined());
    onChange.mockClear();

    rerender(
      <TiptapVariableInput
        value="回填提示词"
        onChange={onChange}
        getEditor={getEditor}
      />,
    );
    await waitFor(() => expect(editor!.getText()).toBe('回填提示词'));
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <TiptapVariableInput
        value="回填提示词"
        readonly
        onChange={onChange}
        getEditor={getEditor}
      />,
    );
    await waitFor(() => expect(editor!.isEditable).toBe(false));
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <TiptapVariableInput
        value="回填提示词"
        disabled
        onChange={onChange}
        getEditor={getEditor}
      />,
    );
    await waitFor(() => expect(editor!.isEditable).toBe(false));
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <TiptapVariableInput
        value="回填提示词"
        onChange={onChange}
        getEditor={getEditor}
      />,
    );
    await waitFor(() => expect(editor!.isEditable).toBe(true));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('真实内容编辑与撤销仍触发内容更新', async () => {
    const onChange = vi.fn();
    let editor: Editor | undefined;
    render(
      <TiptapVariableInput
        value="原始提示词"
        enableHistory
        onChange={onChange}
        getEditor={(instance) => {
          editor = instance;
        }}
      />,
    );
    await waitFor(() => expect(editor).toBeDefined());
    onChange.mockClear();

    act(() => {
      editor!.commands.insertContentAt(
        editor!.state.doc.content.size - 1,
        '追加内容',
      );
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(extractTextFromHTML(onChange.mock.calls[0][0])).toContain(
      '原始提示词追加内容',
    );

    act(() => {
      editor!.commands.undo();
    });
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(editor!.getText()).toBe('原始提示词');
  });
});
