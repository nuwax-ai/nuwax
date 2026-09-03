import ParamsResponseView from '@/components/MarkdownCustomProcess/ParamsResponseView';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) =>
    ({
      'PC.Common.Global.skill': '技能',
      'PC.Components.MarkdownCustomProcess.paramsTitle': '参数',
      'PC.Components.MarkdownCustomProcess.responseTitle': '结果',
    }[key] ?? key),
}));

vi.mock('@/components/base/CopyIconButton', () => ({
  default: ({ text }: { text: string }) => (
    <button type="button" aria-label={`复制 ${text.slice(0, 8)}`} />
  ),
}));

vi.mock('@/components/MarkdownCustomProcess/index.less', () => ({
  default: new Proxy({}, { get: (_target, key: string) => key }),
}));

describe('ParamsResponseView', () => {
  it('终端参数与结果是两个可独立收起的滚动区', () => {
    render(
      <ParamsResponseView
        kind="terminal"
        params={{ command: 'npm test' }}
        response={'line 1\nline 2'}
      />,
    );

    const paramsToggle = screen.getByRole('button', { name: '参数' });
    const resultToggle = screen.getByRole('button', { name: '结果' });
    expect(paramsToggle).toHaveAttribute('aria-expanded', 'true');
    expect(resultToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/npm test/)).toBeInTheDocument();
    expect(screen.getByText(/line 1/)).toBeInTheDocument();

    fireEvent.click(paramsToggle);
    expect(paramsToggle).toHaveAttribute('aria-expanded', 'false');
    expect(resultToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText(/npm test/)).not.toBeInTheDocument();
    expect(screen.getByText(/line 1/)).toBeInTheDocument();
  });

  it('技能使用名称标签和正文卡，不退化为参数 JSON', () => {
    render(
      <ParamsResponseView
        kind="skill"
        name="browser:control-browser"
        params={{ skill_content: '# Skill\nUse browser.' }}
        response={null}
      />,
    );

    expect(screen.getByText('技能')).toBeInTheDocument();
    expect(screen.getByText('browser:control-browser')).toBeInTheDocument();
    expect(screen.getByText(/Use browser/)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '参数' }),
    ).not.toBeInTheDocument();
  });
});
