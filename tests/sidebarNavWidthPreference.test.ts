import {
  clampNavSidebarWidth,
  loadNavSidebarWidthPx,
  NAV_SIDEBAR_WIDTH_DEFAULT,
  NAV_SIDEBAR_WIDTH_MAX,
  NAV_SIDEBAR_WIDTH_MIN,
  NAV_SIDEBAR_WIDTH_STORAGE_KEY,
  saveNavSidebarWidthPx,
} from '@/utils/sidebarNavWidthPreference';
import { afterEach, describe, expect, it } from 'vitest';

describe('sidebarNavWidthPreference（单栏 style3 主会话列宽度偏好）', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('无存储值时返回默认宽度，默认值与单栏侧栏常量 260 同源', () => {
    expect(loadNavSidebarWidthPx()).toBe(NAV_SIDEBAR_WIDTH_DEFAULT);
    expect(NAV_SIDEBAR_WIDTH_DEFAULT).toBe(260);
  });

  it('读取时把越界值 clamp 到 [200, 400]', () => {
    localStorage.setItem(NAV_SIDEBAR_WIDTH_STORAGE_KEY, '120');
    expect(loadNavSidebarWidthPx()).toBe(NAV_SIDEBAR_WIDTH_MIN);

    localStorage.setItem(NAV_SIDEBAR_WIDTH_STORAGE_KEY, '999');
    expect(loadNavSidebarWidthPx()).toBe(NAV_SIDEBAR_WIDTH_MAX);
  });

  it('脏数据（非数字）回退默认值', () => {
    localStorage.setItem(NAV_SIDEBAR_WIDTH_STORAGE_KEY, 'abc');
    expect(loadNavSidebarWidthPx()).toBe(NAV_SIDEBAR_WIDTH_DEFAULT);
  });

  it('保存时可回读，且保存前同样 clamp + 取整', () => {
    saveNavSidebarWidthPx(320.6);
    expect(localStorage.getItem(NAV_SIDEBAR_WIDTH_STORAGE_KEY)).toBe('321');
    expect(loadNavSidebarWidthPx()).toBe(321);

    saveNavSidebarWidthPx(50);
    expect(loadNavSidebarWidthPx()).toBe(NAV_SIDEBAR_WIDTH_MIN);
  });

  it('clampNavSidebarWidth 边界语义', () => {
    expect(clampNavSidebarWidth(150)).toBe(200);
    expect(clampNavSidebarWidth(260)).toBe(260);
    expect(clampNavSidebarWidth(500)).toBe(400);
  });
});
