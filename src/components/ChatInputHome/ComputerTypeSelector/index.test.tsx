import {
  handleComputerServiceStatePayload,
  __resetForTest as resetServiceState,
} from '@/services/computerServiceState';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ComputerTypeSelector from './index';
import type { ComputerTypeSelectorProps } from './types';

const { fetchComputerList, saveSelection } = vi.hoisted(() => ({
  fetchComputerList: vi.fn(),
  saveSelection: vi.fn(),
}));

vi.mock('@/components/base', () => ({ SvgIcon: () => null }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/systemManage', () => ({
  apiGetUserSelectableSandboxList: fetchComputerList,
  apiSaveSelectedSandbox: saveSelection,
}));
vi.mock('./index.less', () => ({ default: {} }));

beforeEach(() => {
  fetchComputerList.mockReset();
  saveSelection.mockReset().mockResolvedValue({ code: '0000' });
  resetServiceState();
  delete window.NuwaClawBridge;
});
afterEach(cleanup);

const cloud = { sandboxId: '-1', name: '云端电脑', description: '' };
const local = { sandboxId: '366', name: '我的电脑', description: '' };
const other = { sandboxId: '999', name: '其他电脑', description: '' };
const response = (
  sandboxes = [cloud],
  agentSelected: Record<string, string> = {},
) => ({
  code: '0000',
  data: { sandboxes, agentSelected },
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function Controlled({
  initialValue = '',
  onChange,
  ...props
}: ComputerTypeSelectorProps & { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <output data-testid="selected-id">{value}</output>
      <ComputerTypeSelector
        {...props}
        value={value}
        onChange={(id, option) => {
          onChange?.(id, option);
          setValue(id);
        }}
      />
    </>
  );
}
const menuText = (name: string) =>
  within(screen.getByRole('menu')).getByText(name);
const click = (element: HTMLElement) =>
  act(async () => {
    fireEvent.click(element);
  });

describe('电脑列表刷新与选择保护', () => {
  it('每次打开下拉重新获取候选，慢刷新期间保留当前名称', async () => {
    const later = deferred<ReturnType<typeof response>>();
    fetchComputerList
      .mockResolvedValueOnce(response())
      .mockReturnValueOnce(later.promise)
      .mockResolvedValue(response([cloud, local]));
    render(<Controlled initialValue="-1" />);
    await click(await screen.findByText('云端电脑'));
    expect(fetchComputerList).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText('云端电脑')).toHaveLength(2);
    await act(async () => later.resolve(response([cloud, local])));
    expect(menuText('我的电脑')).toBeInTheDocument();
    await click(screen.getAllByText('云端电脑')[0]);
    await click(screen.getAllByText('云端电脑')[0]);
    expect(fetchComputerList).toHaveBeenCalledTimes(3);
  });

  it('手选优先于在途旧响应的其他电脑记忆', async () => {
    const later = deferred<ReturnType<typeof response>>();
    const onChange = vi.fn();
    fetchComputerList
      .mockResolvedValueOnce(response([cloud, local, other], { 7: '-1' }))
      .mockReturnValueOnce(later.promise);
    render(
      <Controlled
        initialValue="-1"
        agentId={7}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    await click(await screen.findByText('云端电脑'));
    await click(menuText('我的电脑'));
    expect(screen.getByTestId('selected-id')).toHaveTextContent('366');
    await act(async () =>
      later.resolve(response([cloud, local, other], { 7: '999' })),
    );
    expect(screen.getByTestId('selected-id')).toHaveTextContent('366');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(saveSelection).toHaveBeenCalledTimes(1);
    expect(saveSelection).toHaveBeenCalledWith(7, '366');
  });

  it('暂时只有云端不切走已有个人电脑，也不持久化 -1', async () => {
    const onChange = vi.fn();
    fetchComputerList
      .mockResolvedValueOnce(response([cloud], { 7: '366' }))
      .mockResolvedValue(response([cloud, local], { 7: '366' }));
    render(
      <Controlled
        initialValue="366"
        agentId={7}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    await click(await screen.findByText('云端电脑'));
    await screen.findAllByText('我的电脑');
    expect(screen.getByTestId('selected-id')).toHaveTextContent('366');
    expect(onChange).not.toHaveBeenCalled();
    expect(saveSelection).not.toHaveBeenCalled();
  });

  it('等待中的个人电脑记忆回来后恢复旧记忆，不保存临时云端', async () => {
    const onChange = vi.fn();
    fetchComputerList
      .mockResolvedValueOnce(response([cloud], { 7: '366' }))
      .mockResolvedValue(response([cloud, local], { 7: '366' }));
    render(
      <Controlled
        initialValue="-1"
        agentId={7}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    await click(await screen.findByText('云端电脑'));
    await screen.findAllByText('我的电脑');
    expect(screen.getByTestId('selected-id')).toHaveTextContent('366');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      '366',
      expect.objectContaining({ id: '366' }),
    );
    expect(saveSelection).not.toHaveBeenCalled();
  });

  it('明确点击当前云端也优先于稍后恢复的个人电脑记忆，不重复保存', async () => {
    const later = deferred<ReturnType<typeof response>>();
    const onChange = vi.fn();
    fetchComputerList
      .mockResolvedValueOnce(response([cloud], { 7: '366' }))
      .mockReturnValueOnce(later.promise);
    render(
      <Controlled
        initialValue="-1"
        agentId={7}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    await click(await screen.findByText('云端电脑'));
    await click(menuText('云端电脑'));
    await act(async () =>
      later.resolve(response([cloud, local], { 7: '366' })),
    );
    expect(screen.getByTestId('selected-id')).toHaveTextContent('-1');
    expect(onChange).not.toHaveBeenCalled();
    expect(saveSelection).not.toHaveBeenCalled();
  });

  it('同一 agent 刷新不抢当前选择，切换 agent 仍应用自己的记忆', async () => {
    const onChange = vi.fn();
    fetchComputerList
      .mockResolvedValueOnce(
        response([cloud, local, other], { 7: '366', 8: '999' }),
      )
      .mockResolvedValue(
        response([cloud, local, other], { 7: '999', 8: '999' }),
      );
    const { rerender } = render(
      <Controlled
        initialValue="366"
        agentId={7}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    await click(await screen.findByText('我的电脑'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('selected-id')).toHaveTextContent('366');
    expect(onChange).not.toHaveBeenCalled();
    rerender(
      <Controlled
        initialValue="366"
        agentId={8}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId('selected-id')).toHaveTextContent('999');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('刷新后当前电脑暂缺时保留已知名称，空列表仍可展开重拉', async () => {
    fetchComputerList
      .mockResolvedValueOnce(response([cloud, local]))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValue(response([cloud, local]));
    render(<Controlled initialValue="366" />);
    await click(await screen.findByText('我的电脑'));
    await screen.findByText(
      'PC.Components.ComputerTypeSelector.noComputerAvailable',
    );
    expect(screen.getByText('我的电脑')).toBeInTheDocument();
    expect(screen.getByTestId('selected-id')).toHaveTextContent('366');
    await click(screen.getByText('我的电脑'));
    await click(screen.getByText('我的电脑'));
    await screen.findAllByText('云端电脑');
    expect(fetchComputerList).toHaveBeenCalledTimes(3);
  });

  it('切回手选过的 agent 恢复其手选，旧服务端记忆不顶替', async () => {
    const onChange = vi.fn();
    fetchComputerList.mockResolvedValue(
      response([cloud, local, other], { 7: '-1', 8: '999' }),
    );
    const { rerender } = render(
      <Controlled
        initialValue="-1"
        agentId={7}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    await click(await screen.findByText('云端电脑'));
    await click(menuText('我的电脑'));
    rerender(
      <Controlled
        initialValue="-1"
        agentId={8}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId('selected-id')).toHaveTextContent('999');
    rerender(
      <Controlled
        initialValue="-1"
        agentId={7}
        strictAgentMemory
        onChange={onChange}
      />,
    );
    expect(screen.getByTestId('selected-id')).toHaveTextContent('366');
    expect(onChange.mock.calls.map(([id]) => id)).toEqual([
      '366',
      '999',
      '366',
    ]);
    expect(saveSelection).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])(
    '跨 agent 切回暂缺手选目标，回来时遵循最新手选（期间改选云端=%s）',
    async (chooseCloud) => {
      const onChange = vi.fn();
      const staleMemory = { 7: '-1', 8: '-1' };
      fetchComputerList.mockResolvedValue(
        response([cloud, local, other], staleMemory),
      );
      const { rerender } = render(
        <Controlled
          initialValue="-1"
          agentId={7}
          strictAgentMemory
          onChange={onChange}
        />,
      );
      await click(await screen.findByText('云端电脑'));
      await click(menuText('我的电脑'));
      rerender(
        <Controlled
          initialValue="-1"
          agentId={8}
          strictAgentMemory
          onChange={onChange}
        />,
      );
      await click(screen.getAllByText('云端电脑')[0]);
      await click(menuText('其他电脑'));
      expect(screen.getByTestId('selected-id')).toHaveTextContent('999');

      fetchComputerList.mockResolvedValue(
        response([cloud, other], staleMemory),
      );
      await click(screen.getAllByText('其他电脑')[0]);
      await click(screen.getAllByText('其他电脑')[0]);
      rerender(
        <Controlled
          initialValue="-1"
          agentId={7}
          strictAgentMemory
          onChange={onChange}
        />,
      );
      expect(onChange.mock.calls.map(([id]) => id)).toEqual([
        '366',
        '-1',
        '999',
      ]);

      if (chooseCloud) {
        await click(screen.getAllByText('其他电脑')[0]);
        await click(menuText('云端电脑'));
      }

      fetchComputerList.mockResolvedValue(
        response([cloud, local, other], staleMemory),
      );
      await click(
        screen.getAllByText(chooseCloud ? '云端电脑' : '其他电脑')[0],
      );
      await screen.findAllByText('我的电脑');
      expect(screen.getByTestId('selected-id')).toHaveTextContent(
        chooseCloud ? '-1' : '366',
      );
      expect(onChange.mock.calls.map(([id]) => id)).toEqual([
        '366',
        '-1',
        '999',
        chooseCloud ? '-1' : '366',
      ]);
      const expectedSaves: Array<[number, string]> = [
        [7, '366'],
        [8, '999'],
      ];
      if (chooseCloud) expectedSaves.push([7, '-1']);
      expect(saveSelection.mock.calls).toEqual(expectedSaves);
    },
  );

  it('只读模式忽略后台记忆并禁用手选', async () => {
    const onChange = vi.fn();
    fetchComputerList.mockResolvedValue(response([cloud, local], { 7: '-1' }));
    render(
      <Controlled
        initialValue="366"
        agentId={7}
        readonly
        onChange={onChange}
      />,
    );
    await click(await screen.findByText('我的电脑'));
    await click(menuText('云端电脑'));
    expect(onChange).not.toHaveBeenCalled();
    expect(saveSelection).not.toHaveBeenCalled();
  });

  it.each(['fixed', 'readonly'])(
    '商业 %s 模式在 ready 后仍更新可用电脑，不切换绑定值',
    async (mode) => {
      window.NuwaClawBridge = { host: { getProduct: () => 'nuwax' } };
      const onChange = vi.fn();
      fetchComputerList
        .mockResolvedValueOnce(response())
        .mockResolvedValue(response([cloud, local]));
      render(
        <Controlled
          initialValue="366"
          fixedSelection={mode === 'fixed'}
          readonly={mode === 'readonly'}
          isPersonalComputer
          onChange={onChange}
        />,
      );
      await act(async () => {
        await Promise.resolve();
      });
      act(() =>
        handleComputerServiceStatePayload({ phase: 'ready', sandboxId: '366' }),
      );
      await screen.findByText('我的电脑');
      expect(screen.getByTestId('selected-id')).toHaveTextContent('366');
      expect(onChange).not.toHaveBeenCalled();
      expect(saveSelection).not.toHaveBeenCalled();
      expect(fetchComputerList).toHaveBeenCalledTimes(2);
    },
  );

  it('cloudOnly 继续过滤个人电脑并按策略回落云端，不写后台记忆', async () => {
    fetchComputerList.mockResolvedValue(response([cloud, local], { 7: '366' }));
    render(<Controlled initialValue="366" agentId={7} cloudOnly />);
    await screen.findByText('云端电脑');
    expect(screen.getByTestId('selected-id')).toHaveTextContent('-1');
    await click(screen.getByText('云端电脑'));
    expect(screen.queryByText('我的电脑')).not.toBeInTheDocument();
    expect(saveSelection).not.toHaveBeenCalled();
  });
});

describe('历史会话电脑展示', () => {
  it('会话绑定的电脑仍在列表中时显示名称', async () => {
    const onChange = vi.fn();
    fetchComputerList.mockResolvedValue({
      code: '0000',
      data: {
        sandboxes: [
          { sandboxId: '-1', name: '云端电脑', description: '' },
          { sandboxId: '366', name: '我的电脑', description: '' },
        ],
        agentSelected: {},
      },
    });

    render(
      <ComputerTypeSelector
        value="366"
        fixedSelection
        isPersonalComputer
        autoSelect={false}
        onChange={onChange}
      />,
    );

    const selected = await screen.findByText('我的电脑');
    await click(selected);
    await click(await screen.findByText('云端电脑'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('会话绑定的个人电脑已不在列表中时显示不可用', async () => {
    fetchComputerList.mockResolvedValue({
      code: '0000',
      data: {
        sandboxes: [{ sandboxId: '-1', name: '云端电脑', description: '' }],
        agentSelected: {},
      },
    });

    render(
      <ComputerTypeSelector
        value="366"
        fixedSelection
        isPersonalComputer
        autoSelect={false}
      />,
    );

    expect(
      await screen.findByText(
        'PC.Components.ComputerTypeSelector.personalComputerUnavailable',
      ),
    ).toBeInTheDocument();
  });
});
