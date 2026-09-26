import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ComputerTypeSelector from './index';

const { fetchComputerList } = vi.hoisted(() => ({
  fetchComputerList: vi.fn(),
}));

vi.mock('@/components/base', () => ({ SvgIcon: () => null }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/systemManage', () => ({
  apiGetUserSelectableSandboxList: fetchComputerList,
  apiSaveSelectedSandbox: vi.fn(),
}));
vi.mock('./index.less', () => ({ default: {} }));

beforeEach(() => {
  fetchComputerList.mockReset();
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
    fireEvent.click(selected);
    fireEvent.click(await screen.findByText('云端电脑'));
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
