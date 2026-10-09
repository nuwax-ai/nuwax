import type { MenuItemDto } from '@/types/interfaces/menu';
import {
  filterAiosCommercialMenus,
  getCommercialEdition,
  isCommercialAgentType,
  isWorkCommercialRoute,
} from '@/utils/commercialEdition';
import { describe, expect, it } from 'vitest';

const menu = (
  code: string | undefined,
  path: string,
  children: MenuItemDto[] = [],
): MenuItemDto => ({ id: 1, code, path, children } as MenuItemDto);

describe('PC 商业授权策略', () => {
  it.each([false, undefined, null, 'true', 'false', 1, {}, []])(
    '值 %j 不开放授权，也不回退旧字段',
    (value) => {
      expect(
        getCommercialEdition({
          aiOSCommercialEdition: value,
          workCommercialEdition: value,
          commercialEdition: true,
        } as any),
      ).toEqual({ aiOSCommercialEdition: false, workCommercialEdition: false });
    },
  );
  it.each([
    [false, false],
    [true, false],
    [false, true],
    [true, true],
  ])(
    'aiOS=%s work=%s 独立生效',
    (aiOSCommercialEdition, workCommercialEdition) => {
      expect(
        getCommercialEdition({ aiOSCommercialEdition, workCommercialEdition }),
      ).toEqual({ aiOSCommercialEdition, workCommercialEdition });
    },
  );
  it('隐藏项目菜单但保留手工配置的伙伴/资料库/专家菜单，不改原始数据', () => {
    const menus = [
      menu('workspace', '/space', [
        menu('xiangmu_yingyong', '#'),
        menu('agent_dev', '/space/:spaceId/develop'),
      ]),
      menu('message', '/instant-message'),
      menu('repo', '/repo'),
      menu('zhuanjia_jineng_lianjieqi', '/resources'),
    ];
    const result = filterAiosCommercialMenus(menus, false);
    expect(result[0].children?.map((item) => item.code)).toEqual(['agent_dev']);
    expect(result.slice(1).map((item) => item.code)).toEqual([
      'message',
      'repo',
      'zhuanjia_jineng_lianjieqi',
    ]);
    expect(menus[0].children).toHaveLength(2);
    expect(filterAiosCommercialMenus(menus, true)).toBe(menus);
  });
  it('路径识别项目&应用并清除没有独立路由的空分组', () => {
    const menus = [
      menu('group', '#', [
        menu('custom', '/space/:spaceId/project-manage?tab=all'),
      ]),
    ];
    expect(filterAiosCommercialMenus(menus, false)).toEqual([]);
  });
  it.each(['AgentFlow', 'AgentGroup', 'Flow', 'Group'])(
    '创建类型和筛选类型 %s 属于商业入口',
    (value) => expect(isCommercialAgentType(value)).toBe(true),
  );
  it.each(['ChatBot', 'TaskAgent', 'General', 'Custom', 'All'])(
    '%s 保持普通入口',
    (value) => expect(isCommercialAgentType(value)).toBe(false),
  );
  it.each([
    '/repo',
    '/repo-entry',
    '/repo/doc/abc',
    '/instant-message',
    '/instant-message/conversation/4',
    '/message-entry',
    '/open-iframe-page/ziliaoku',
    '/app/open-iframe-page/message',
  ])('站内工作应用路由 %s 需要授权', (path) =>
    expect(isWorkCommercialRoute(path, [])).toBe(true),
  );
  it('按已配置菜单识别自定义站内路径与旧 iframe code', () => {
    const menus = [
      menu('parent', '#', [menu('repo', '/library/:spaceId')]),
      menu('customRepo', '/repo'),
    ];
    expect(isWorkCommercialRoute('/library/3/doc/a', menus)).toBe(true);
    expect(isWorkCommercialRoute('/open-iframe-page/customRepo', menus)).toBe(
      true,
    );
    expect(isWorkCommercialRoute('/library-other/3', menus)).toBe(false);
  });
  it.each([
    '/home',
    '/repo-other',
    '/instant-message-other',
    '/open-iframe-page/eco_market',
  ])('普通路由 %s 不被无 code 的资料库菜单误拦', (path) => {
    expect(isWorkCommercialRoute(path, [menu(undefined, '/repo')])).toBe(false);
  });
});
