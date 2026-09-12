import { describe, expect, it } from 'vitest';

import type { MenuItemDto } from '@/types/interfaces/menu';

import {
  resolveCurrentTitle,
  resolveIsShowTitle,
  resolveSecondMenuVisibility,
  resolveSecondaryBackgroundColor,
} from './secondMenuPolicy';

const stubDict = (key: string) => `@${key}`;

const buildMenu = (overrides: Partial<MenuItemDto>): MenuItemDto =>
  ({
    code: 'menu_a',
    name: '菜单甲',
    path: '/menu-a',
    ...overrides,
  } as MenuItemDto);

const firstLevelMenus = [
  buildMenu({ code: 'menu_a', name: '菜单甲', children: [] }),
  buildMenu({
    code: 'menu_b',
    name: '菜单乙',
    children: [buildMenu({ code: 'menu_b1', name: '子项' })],
  }),
];

describe('resolveSecondMenuVisibility', () => {
  const sectionTabs = new Set(['homepage', 'space']);

  it('Section 域常显', () => {
    expect(
      resolveSecondMenuVisibility({
        activeTab: 'homepage',
        sectionTabs,
        firstLevelMenus,
        otherMenus: [],
      }),
    ).toBe(true);
  });

  it('无子菜单/未知激活码不显，有子菜单显', () => {
    expect(
      resolveSecondMenuVisibility({
        activeTab: 'menu_a',
        sectionTabs,
        firstLevelMenus,
        otherMenus: [],
      }),
    ).toBe(false);
    expect(
      resolveSecondMenuVisibility({
        activeTab: 'menu_b',
        sectionTabs,
        firstLevelMenus,
        otherMenus: [],
      }),
    ).toBe(true);
    expect(
      resolveSecondMenuVisibility({
        activeTab: 'unknown',
        sectionTabs,
        firstLevelMenus,
        otherMenus: [],
      }),
    ).toBe(false);
  });

  it('激活码为空不显（未选中状态）', () => {
    expect(
      resolveSecondMenuVisibility({
        activeTab: '',
        sectionTabs,
        firstLevelMenus,
        otherMenus: [],
      }),
    ).toBe(false);
  });

  it('兜底扫描 otherMenus（分离菜单：消息/设备/更多等）', () => {
    expect(
      resolveSecondMenuVisibility({
        activeTab: 'more_page',
        sectionTabs,
        firstLevelMenus,
        otherMenus: [
          buildMenu({
            code: 'more_page',
            name: '更多',
            children: [buildMenu({ code: 'mp1' })],
          }),
        ],
      }),
    ).toBe(true);
  });
});

describe('resolveCurrentTitle', () => {
  it('点击新对话/更多页面走特殊文案键', () => {
    expect(
      resolveCurrentTitle({
        activeTab: 'menu_a',
        isClickNewConversation: true,
        firstLevelMenus,
        dict: stubDict,
      }),
    ).toBe('@PC.Layouts.DynamicMenusLayout.newConversation');
    expect(
      resolveCurrentTitle({
        activeTab: 'more_page',
        isClickNewConversation: false,
        firstLevelMenus,
        dict: stubDict,
      }),
    ).toBe('@PC.Layouts.DynamicMenusLayout.more');
  });

  it('其余取一级菜单名，未命中返回 undefined', () => {
    expect(
      resolveCurrentTitle({
        activeTab: 'menu_a',
        isClickNewConversation: false,
        firstLevelMenus,
        dict: stubDict,
      }),
    ).toBe('菜单甲');
    expect(
      resolveCurrentTitle({
        activeTab: 'ghost',
        isClickNewConversation: false,
        firstLevelMenus,
        dict: stubDict,
      }),
    ).toBeUndefined();
  });
});

describe('resolveIsShowTitle', () => {
  it('工作空间域不展示标题（有自己的标题组件），其余展示', () => {
    expect(resolveIsShowTitle('space')).toBe(false);
    expect(resolveIsShowTitle('workspace')).toBe(false);
    expect(resolveIsShowTitle('homepage')).toBe(true);
    expect(resolveIsShowTitle('menu_a')).toBe(true);
  });
});

describe('resolveSecondaryBackgroundColor', () => {
  const colorBgContainer = '#ffffff';

  it('移动端实底', () => {
    expect(
      resolveSecondaryBackgroundColor({
        isMobile: true,
        navigationStyle: 'style3',
        colorBgContainer,
      }),
    ).toBe(colorBgContainer);
  });

  it('style2 半透明白，style1/style3 透明', () => {
    expect(
      resolveSecondaryBackgroundColor({
        isMobile: false,
        navigationStyle: 'style2',
        colorBgContainer,
      }),
    ).toBe('var(--xagi-layout-bg-container, rgba(255, 255, 255, 0.95))');
    expect(
      resolveSecondaryBackgroundColor({
        isMobile: false,
        navigationStyle: 'style3',
        colorBgContainer,
      }),
    ).toBe('transparent');
    expect(
      resolveSecondaryBackgroundColor({
        isMobile: false,
        navigationStyle: 'style1',
        colorBgContainer,
      }),
    ).toBe('transparent');
  });
});
