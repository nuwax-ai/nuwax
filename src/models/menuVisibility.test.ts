import type { MenuItemDto } from '@/types/interfaces/menu';
import { describe, expect, it } from 'vitest';
import { filterPresentationHiddenMenus } from './menuVisibility';

const menu = (
  code: string,
  path?: string,
  children?: MenuItemDto[],
): MenuItemDto => ({ code, path, children } as MenuItemDto);

describe('filterPresentationHiddenMenus', () => {
  it('隐藏系统主题配置菜单，保留同级菜单与父级结构', () => {
    const source = [
      menu('system_manage', undefined, [
        menu('system_config', '#', [
          menu('system_setting', '/system/config/setting'),
          menu('theme_config', '/system/config/theme'),
          menu('sandbox_config', '/system/config/sandbox'),
        ]),
      ]),
    ];

    const result = filterPresentationHiddenMenus(source);

    expect(result[0].children?.[0].children?.map((item) => item.code)).toEqual([
      'system_setting',
      'sandbox_config',
    ]);
    expect(source[0].children?.[0].children).toHaveLength(3);
  });

  it('查询参数和尾部斜杠不绕过隐藏规则', () => {
    const source = [
      menu('query', '/system/config/theme?from=menu'),
      menu('slash', '/system/config/theme/'),
      menu('other', '/system/config/category'),
    ];

    expect(
      filterPresentationHiddenMenus(source).map((item) => item.code),
    ).toEqual(['other']);
  });
});
