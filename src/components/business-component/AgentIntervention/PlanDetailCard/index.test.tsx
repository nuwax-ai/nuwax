import { fireEvent, render, screen } from '@testing-library/react';
import PlanDetailCard, { buildPlanMarkdown } from './index';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) =>
    ({
      'PC.Components.PlanDetailCard.title': '执行计划',
      'PC.Components.PlanDetailCard.fullscreen': '全屏预览',
      'PC.Components.PlanDetailCard.download': '下载计划',
      'PC.Components.PlanDetailCard.copy': '拷贝计划',
    }[key] ?? key),
}));

vi.mock('@/components/base/CopyIconButton', () => ({
  default: () => <button type="button" aria-label="copy" />,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_t, key) => String(key) }),
}));

const entries = [
  { content: '创建 hello.txt', status: 'pending' },
  { content: '写入内容 hi', status: 'completed' },
];

describe('PlanDetailCard', () => {
  it('渲染标题、条目与动作按钮；点击全屏打开弹层', () => {
    render(<PlanDetailCard entries={entries} defaultExpanded />);

    expect(screen.getByText('执行计划')).toBeTruthy();
    expect(screen.getByText('创建 hello.txt')).toBeTruthy();
    expect(screen.getByText('写入内容 hi')).toBeTruthy();
    expect(screen.getByLabelText('全屏预览')).toBeTruthy();
    expect(screen.getByLabelText('下载计划')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('全屏预览'));
    // 弹层内条目再次渲染（大字距版）
    expect(screen.getAllByText('创建 hello.txt').length).toBeGreaterThan(1);
  });

  it('默认收起时不渲染条目正文', () => {
    render(<PlanDetailCard entries={entries} />);
    expect(screen.queryByText('创建 hello.txt')).toBeNull();
    expect(screen.getByText('执行计划')).toBeTruthy();
  });

  it('buildPlanMarkdown 输出含标题与勾选状态', () => {
    const md = buildPlanMarkdown(entries, '执行计划');
    expect(md).toContain('# 执行计划');
    expect(md).toContain('1. [ ] 创建 hello.txt');
    expect(md).toContain('2. [x] 写入内容 hi');
  });
});
