import { beforeEach, describe, expect, it } from 'vitest';

import {
  COLLAPSED_PROJECT_KEYS_KEY,
  PROJECT_SECTION_COLLAPSED_KEY,
  TASK_SECTION_COLLAPSED_KEY,
  readCollapsedFlag,
  readCollapsedProjectKeys,
  writeCollapsedFlag,
  writeCollapsedProjectKeys,
} from './collapsePreference';

describe('首页分组收起偏好', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('没有记录时分组默认展开', () => {
    expect(readCollapsedFlag(PROJECT_SECTION_COLLAPSED_KEY)).toBe(false);
    expect(readCollapsedFlag(TASK_SECTION_COLLAPSED_KEY)).toBe(false);
  });

  it('收起落盘，展开时清掉记录', () => {
    writeCollapsedFlag(PROJECT_SECTION_COLLAPSED_KEY, true);
    expect(readCollapsedFlag(PROJECT_SECTION_COLLAPSED_KEY)).toBe(true);

    writeCollapsedFlag(PROJECT_SECTION_COLLAPSED_KEY, false);
    expect(readCollapsedFlag(PROJECT_SECTION_COLLAPSED_KEY)).toBe(false);
    expect(localStorage.getItem(PROJECT_SECTION_COLLAPSED_KEY)).toBeNull();
  });

  it('项目行收起集合可往返，空集合不留记录', () => {
    writeCollapsedProjectKeys(['1:100', '2:200']);
    expect(readCollapsedProjectKeys()).toEqual(new Set(['1:100', '2:200']));

    writeCollapsedProjectKeys([]);
    expect(readCollapsedProjectKeys().size).toBe(0);
    expect(localStorage.getItem(COLLAPSED_PROJECT_KEYS_KEY)).toBeNull();
  });

  it('历史脏值按未收起处理，不打断渲染', () => {
    localStorage.setItem(COLLAPSED_PROJECT_KEYS_KEY, '{oops');
    expect(readCollapsedProjectKeys().size).toBe(0);

    localStorage.setItem(COLLAPSED_PROJECT_KEYS_KEY, '{"1:100":true}');
    expect(readCollapsedProjectKeys().size).toBe(0);

    localStorage.setItem(COLLAPSED_PROJECT_KEYS_KEY, '["1:100",3,null]');
    expect(readCollapsedProjectKeys()).toEqual(new Set(['1:100']));
  });
});
