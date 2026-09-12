import { describe, expect, it, vi } from 'vitest';

import type { MenuItemDto } from '@/types/interfaces/menu';

// menuMatching 经 ./utils 传递依赖 umi 的 history（jsdom 下真实模块不可用，最小 mock）
vi.mock('umi', () => ({
  history: {
    push: vi.fn(),
    replace: vi.fn(),
    location: { pathname: '/', search: '' },
  },
}));

import {
  findFirstLevelCodeByMenuCode,
  findFirstLevelCodeByPath,
  isMenuMatch,
  isPathMatch,
} from './menuMatching';

const menu = (overrides: Partial<MenuItemDto> = {}): MenuItemDto =>
  ({
    code: 'some_menu',
    name: '菜单',
    path: '/some',
    ...overrides,
  }) as unknown as MenuItemDto;

/** 一级菜单树：workspace(/space) + system(/system，子含动态路由) + square */
const firstLevelMenus: MenuItemDto[] = [
  menu({ code: 'workspace', path: '/space' }),
  menu({
    code: 'system_manage',
    path: '/system',
    children: [
      menu({ code: 'system_menu', path: '/system/menu' }),
      menu({
        code: 'system_lang',
        path: '/system/config/lang-content/:lang',
      }),
    ],
  }),
  menu({ code: 'system_square', path: '/square' }),
];

describe('isMenuMatch（一级菜单匹配）', () => {
  it('homepage 编码映射到前端路由 /home', () => {
    expect(isMenuMatch(menu({ code: 'homepage', path: '/homepage' }), '/home')).toBe(true);
    // 非空路径剥离查询参数后为空串时同样走首页分支（外层 if(menu.path) 要求非空）
    expect(isMenuMatch(menu({ code: 'homepage', path: '?from=home' }), '/home')).toBe(true);
    expect(isMenuMatch(menu({ code: 'homepage', path: '/homepage' }), '/square')).toBe(false);
  });

  it('/space 编码按前缀匹配空间前端路由', () => {
    expect(isMenuMatch(menu({ code: 'workspace', path: '/space' }), '/space/3/develop')).toBe(true);
    expect(isMenuMatch(menu({ code: 'workspace', path: '/space' }), '/space')).toBe(true);
    expect(isMenuMatch(menu({ code: 'workspace', path: '/space' }), '/system/menu')).toBe(false);
  });

  it('通用匹配取首个路径段比较（含查询参数剥离）', () => {
    expect(
      isMenuMatch(menu({ code: 'm', path: '/system/menu/xxx?tab=1' }), '/system/demo'),
    ).toBe(true);
    expect(isMenuMatch(menu({ code: 'm', path: '/system/menu' }), '/docs/list')).toBe(false);
    expect(isMenuMatch(menu({ code: 'm', path: undefined }), '/system')).toBe(false);
  });
});

describe('isPathMatch（子菜单精确/动态匹配）', () => {
  it('精确与前缀匹配', () => {
    expect(isPathMatch('/system/menu', '/system/menu')).toBe(true);
    expect(isPathMatch('/system/menu', '/system/menu/xxx')).toBe(true);
    expect(isPathMatch('/system/menu', '/system/menux')).toBe(false);
    expect(isPathMatch('', '/system/menu')).toBe(false);
  });

  it('动态路径段转正则匹配', () => {
    expect(isPathMatch('/system/config/lang-content/:lang', '/system/config/lang-content/ja-JP')).toBe(true);
    expect(isPathMatch('/space/:spaceId/develop', '/space/3/develop')).toBe(true);
    expect(isPathMatch('/space/:spaceId/develop', '/space/3/app')).toBe(false);
  });
});

describe('findFirstLevelCodeByMenuCode', () => {
  it('一级菜单自身命中返回自身 code', () => {
    expect(findFirstLevelCodeByMenuCode(firstLevelMenus, 'workspace')).toBe('workspace');
  });

  it('任意层级子菜单命中返回所属一级 code', () => {
    expect(findFirstLevelCodeByMenuCode(firstLevelMenus, 'system_lang')).toBe('system_manage');
  });

  it('未命中/空入参返回 null', () => {
    expect(findFirstLevelCodeByMenuCode(firstLevelMenus, 'not_exist')).toBeNull();
    expect(findFirstLevelCodeByMenuCode([], 'workspace')).toBeNull();
    expect(findFirstLevelCodeByMenuCode(firstLevelMenus, '')).toBeNull();
  });
});

describe('findFirstLevelCodeByPath', () => {
  it('一级菜单路径命中（isMenuMatch 通道）', () => {
    expect(findFirstLevelCodeByPath(firstLevelMenus, '/space/3/develop')).toBe('workspace');
  });

  it('子菜单路径命中（isPathMatch 通道，含动态路由）', () => {
    expect(findFirstLevelCodeByPath(firstLevelMenus, '/system/menu/xxx')).toBe('system_manage');
    expect(
      findFirstLevelCodeByPath(firstLevelMenus, '/system/config/lang-content/ja-JP'),
    ).toBe('system_manage');
  });

  it('未命中返回 null', () => {
    expect(findFirstLevelCodeByPath(firstLevelMenus, '/nowhere')).toBeNull();
  });
});
