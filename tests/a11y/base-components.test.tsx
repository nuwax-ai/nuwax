/**
 * Axe smoke coverage for low-level shared UI components.
 */
import ActionMenu from '@/components/base/ActionMenu';
import CopyButton from '@/components/base/CopyButton';
import CopyIconButton from '@/components/base/CopyIconButton';
import MenuListItem from '@/components/base/MenuListItem';
import SecondMenuItem from '@/components/base/SecondMenuItem';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));
vi.mock('@/components/base/ActionMenu/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/base/CopyButton/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/base/MenuListItem/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/base/SecondMenuItem/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));

const assertNoViolations = async (element: HTMLElement) => {
  const results = await axe(element);
  expect(results.violations).toEqual([]);
};

describe('base component accessibility baseline', () => {
  it('renders CopyButton without axe violations', async () => {
    const { container } = render(<CopyButton text="hello">Copy</CopyButton>);
    await assertNoViolations(container);
  });

  it('renders CopyIconButton without axe violations', async () => {
    const { container } = render(<CopyIconButton text="hello" />);
    await assertNoViolations(container);
  });

  it('renders ActionMenu without axe violations', async () => {
    const { container } = render(
      <ActionMenu
        actions={[
          {
            key: 'copy',
            icon: 'icons-chat-copy',
            title: 'Copy',
            onClick: vi.fn(),
          },
          {
            key: 'delete',
            icon: 'icons-common-delete',
            title: 'Delete',
            onClick: vi.fn(),
          },
        ]}
      />,
    );
    await assertNoViolations(container);
  });

  it('renders MenuListItem without axe violations', async () => {
    const { container } = render(
      <MenuListItem
        icon="icons-common-plus"
        name="New Item"
        onClick={vi.fn()}
      />,
    );
    await assertNoViolations(container);
  });

  it('renders SecondMenuItem without axe violations', async () => {
    const { container } = render(
      <SecondMenuItem
        icon="icons-common-plus"
        name="Workspace"
        onClick={vi.fn()}
      />,
    );
    await assertNoViolations(container);
  });
});
