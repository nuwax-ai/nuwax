import { describe, expect, it } from 'vitest';
import {
  createMicroThemeStore,
  type MicroThemePayload,
} from '../../../micro-frontends/shared/themeRuntime';

const payload = (
  revision: number,
  mode: 'light' | 'dark',
): MicroThemePayload => ({
  revision,
  mode,
  variables: { '--nuwax-text-primary': mode === 'dark' ? '#fff' : '#111' },
  antdTokens: {},
  css: '[data-theme-surface="message"] .composer {border-radius:12px}',
});
describe('overlay-only theme updates', () => {
  it('retains business nodes and input values, ignores stale revisions and restores owned styles', async () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<div class="conv-pane"></div><div class="composer"><input value="draft"></div>';
    document.body.appendChild(root);
    const input = root.querySelector('input')!;
    input.value = 'unfinished draft';
    const store = createMicroThemeStore();
    store.begin(root, 'message', payload(1, 'light'));
    store.update(payload(3, 'dark'));
    store.update(payload(2, 'light'));
    expect(root.querySelector('input')).toBe(input);
    expect(input.value).toBe('unfinished draft');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(
      root.querySelector('.conv-pane')?.getAttribute('data-theme-part'),
    ).toBe('sidebar');
    const added = document.createElement('div');
    added.className = 'composer';
    root.appendChild(added);
    await Promise.resolve();
    expect(added.getAttribute('data-theme-part')).toBe('input');
    store.dispose();
    expect(root.style.getPropertyValue('--nuwax-text-primary')).toBe('');
    expect(root.hasAttribute('data-theme-surface')).toBe(false);
    expect(root.querySelector('[data-theme-part]')).toBeNull();
    root.remove();
  });
});
