import HistoryConversationList from '@/components/business-component/HistoryConversationList';
import { apiAgentConversationUpdate } from '@/services/agentConfig';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  history: { back: vi.fn() },
  useLocation: () => ({ state: null }),
  useModel: () => ({ runHistory: vi.fn(), isMobile: false }),
}));
vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationUpdate: vi.fn().mockResolvedValue({ success: true }),
  apiAgentConversationDelete: vi.fn(),
}));
vi.mock(
  '@/components/business-component/HistoryConversationList/index.module.less',
  () => ({ default: {} }),
);
vi.mock(
  '@/components/business-component/HistoryConversationList/ConversationList',
  async () => {
    const { forwardRef } = await import('react');
    return {
      default: forwardRef(function MockConversationList(
        { onEdit }: { onEdit: (id: number, topic: string) => void },
        _ref,
      ) {
        return <button onClick={() => onEdit(42, '原会话')}>重命名</button>;
      }),
    };
  },
);
vi.mock(
  '@/components/business-component/HistoryConversationList/ProjectList',
  () => ({ default: () => null }),
);

describe('历史会话重命名输入法', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it.each(['Enter', '确认按钮'] as const)(
    '组字回车不保存，上屏后通过 %s 保存',
    async (submit) => {
      render(<HistoryConversationList onClickLink={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: '重命名' }));
      const input = within(await screen.findByRole('dialog')).getByRole(
        'textbox',
      );
      await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: 'zhongwen' } });
      fireEvent.keyDown(input, {
        key: 'Enter',
        keyCode: 13,
        isComposing: true,
      });
      fireEvent.keyUp(input, { key: 'Enter' });
      fireEvent.compositionEnd(input);
      fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
      fireEvent.keyUp(input, { key: 'Enter' });
      expect(apiAgentConversationUpdate).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog')).toBeVisible();

      fireEvent.change(input, { target: { value: '中文' } });
      if (submit === 'Enter')
        fireEvent.keyDown(input, { key: 'Enter', keyCode: 13 });
      else
        fireEvent.click(
          screen.getByRole('button', { name: 'PC.Common.Global.confirm' }),
        );
      await waitFor(() =>
        expect(apiAgentConversationUpdate).toHaveBeenCalledWith({
          id: 42,
          topic: '中文',
        }),
      );
      expect(apiAgentConversationUpdate).toHaveBeenCalledTimes(1);
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
    },
  );
});
