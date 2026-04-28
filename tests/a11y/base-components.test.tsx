/**
 * Axe smoke coverage for low-level shared UI components.
 */
import {
  ActionMenu,
  CopyButton,
  CopyIconButton,
  MenuListItem,
  SecondMenuItem,
} from '@/components/base';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';

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
