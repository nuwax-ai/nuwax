import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  DisplayRecommendFunctionTypeEnum,
  type DisplayRecommendInfo,
} from '@/types/interfaces/displayRecommend';
import { describe, expect, it } from 'vitest';
import {
  filterSelectableAgents,
  findDefaultAgent,
  findTypeFallbackAgent,
  getAllowedFunctionType,
  getProjectTypeByFunctionType,
  isAgentSelectable,
  isTaskAgentFunctionType,
  showSpaceSelectorForFunctionType,
} from './recommendAgentPolicy.constants';

/** 造一条推荐位数据（只关心 functionType/targetId） */
const makeItem = (
  functionType: DisplayRecommendFunctionTypeEnum | string | null,
  targetId = 1,
): DisplayRecommendInfo =>
  ({
    id: targetId,
    tenantId: 1,
    targetType: 'Agent',
    targetId,
    recType: 'rec',
    functionType,
    label: `label-${targetId}`,
  } as DisplayRecommendInfo);

/** 全功能类型样本（六个开发类 + 对话型 + 未配置） */
const FULL_LIST = [
  makeItem(DisplayRecommendFunctionTypeEnum.AgentDev, 11),
  makeItem(DisplayRecommendFunctionTypeEnum.PageAppDev, 12),
  makeItem(DisplayRecommendFunctionTypeEnum.SkillDev, 13),
  makeItem(DisplayRecommendFunctionTypeEnum.PluginDev, 14),
  makeItem(DisplayRecommendFunctionTypeEnum.Chat, 15),
  makeItem(DisplayRecommendFunctionTypeEnum.UserAppDev, 16),
  makeItem(DisplayRecommendFunctionTypeEnum.NormalProjectDev, 17),
  makeItem(null, 18),
];

describe('recommendAgentPolicy 可选范围策略', () => {
  describe('getAllowedFunctionType', () => {
    it('无上下文不受限', () => {
      expect(getAllowedFunctionType(undefined)).toBeUndefined();
      expect(getAllowedFunctionType({})).toBeUndefined();
    });

    it('全栈项目只允许全栈应用开发类', () => {
      expect(
        getAllowedFunctionType({
          projectType: AgentComponentTypeEnum.UserApp,
        }),
      ).toBe(DisplayRecommendFunctionTypeEnum.UserAppDev);
    });

    it('常规项目只允许常规项目类', () => {
      expect(
        getAllowedFunctionType({
          projectType: AgentComponentTypeEnum.NormalProject,
        }),
      ).toBe(DisplayRecommendFunctionTypeEnum.NormalProjectDev);
    });

    it('未登记类型（PageApp 等）不受限', () => {
      expect(
        getAllowedFunctionType({
          projectType: AgentComponentTypeEnum.PageApp,
        }),
      ).toBeUndefined();
    });
  });

  describe('isAgentSelectable / filterSelectableAgents', () => {
    it('无上下文：全量可选、过滤原样返回', () => {
      const item = makeItem(DisplayRecommendFunctionTypeEnum.Chat);
      expect(isAgentSelectable(item, undefined)).toBe(true);
      expect(filterSelectableAgents(FULL_LIST, undefined)).toHaveLength(
        FULL_LIST.length,
      );
    });

    it('全栈上下文：仅保留 UserAppDev', () => {
      const ctx = { projectType: AgentComponentTypeEnum.UserApp };
      const filtered = filterSelectableAgents(FULL_LIST, ctx);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].targetId).toBe(16);
      expect(
        isAgentSelectable(
          makeItem(DisplayRecommendFunctionTypeEnum.UserAppDev),
          ctx,
        ),
      ).toBe(true);
    });

    it('常规上下文：仅保留 NormalProjectDev', () => {
      const filtered = filterSelectableAgents(FULL_LIST, {
        projectType: AgentComponentTypeEnum.NormalProject,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].targetId).toBe(17);
    });

    it('两类上下文均排除六个开发类中的另一类与对话型/未配置', () => {
      for (const projectType of [
        AgentComponentTypeEnum.UserApp,
        AgentComponentTypeEnum.NormalProject,
      ]) {
        const allowed = filterSelectableAgents(FULL_LIST, { projectType });
        const rest = FULL_LIST.filter((item) => !allowed.includes(item));
        // 各只剩 1 项，其余 7 项（另一项目类 + 对话型 + 智能体/网页/技能/插件开发 + 未配置）全排除
        expect(allowed).toHaveLength(1);
        expect(rest).toHaveLength(FULL_LIST.length - 1);
      }
    });
  });

  describe('findDefaultAgent', () => {
    it('全栈 + devAgentId 命中 targetId 相同项', () => {
      const hit = findDefaultAgent(FULL_LIST, {
        projectType: AgentComponentTypeEnum.UserApp,
        devAgentId: 16,
      });
      expect(hit?.targetId).toBe(16);
    });

    it('全栈 + devAgentId 无匹配项返回 undefined', () => {
      expect(
        findDefaultAgent(FULL_LIST, {
          projectType: AgentComponentTypeEnum.UserApp,
          devAgentId: 999,
        }),
      ).toBeUndefined();
    });

    it('全栈但 devAgentId 缺失不命中（走手选降级）', () => {
      expect(
        findDefaultAgent(FULL_LIST, {
          projectType: AgentComponentTypeEnum.UserApp,
        }),
      ).toBeUndefined();
    });

    it('常规项目不默认命中', () => {
      expect(
        findDefaultAgent(FULL_LIST, {
          projectType: AgentComponentTypeEnum.NormalProject,
          devAgentId: 17,
        }),
      ).toBeUndefined();
      expect(findDefaultAgent(FULL_LIST, undefined)).toBeUndefined();
    });
  });

  describe('findTypeFallbackAgent（devAgentId 缺失的类型兜底）', () => {
    it('全栈：唯一 UserAppDev 命中', () => {
      expect(
        findTypeFallbackAgent(FULL_LIST, AgentComponentTypeEnum.UserApp)
          ?.targetId,
      ).toBe(16);
    });

    it('常规：唯一 NormalProjectDev 命中', () => {
      expect(
        findTypeFallbackAgent(FULL_LIST, AgentComponentTypeEnum.NormalProject)
          ?.targetId,
      ).toBe(17);
    });

    it('同类型 0 个不命中', () => {
      expect(
        findTypeFallbackAgent(
          [makeItem(DisplayRecommendFunctionTypeEnum.Chat, 15)],
          AgentComponentTypeEnum.UserApp,
        ),
      ).toBeUndefined();
    });

    it('同类型多个不命中（无法猜测绑定，回落手选）', () => {
      const list = [
        makeItem(DisplayRecommendFunctionTypeEnum.UserAppDev, 16),
        makeItem(DisplayRecommendFunctionTypeEnum.UserAppDev, 18),
      ];
      expect(
        findTypeFallbackAgent(list, AgentComponentTypeEnum.UserApp),
      ).toBeUndefined();
    });

    it('未登记类型/无类型不命中', () => {
      expect(
        findTypeFallbackAgent(FULL_LIST, AgentComponentTypeEnum.PageApp),
      ).toBeUndefined();
      expect(findTypeFallbackAgent(FULL_LIST, undefined)).toBeUndefined();
    });
  });
});

describe('recommendAgentPolicy 收编的历史映射（行为不变）', () => {
  it('getProjectTypeByFunctionType：六项目类各归位、对话型/未配置返回 undefined', () => {
    expect(
      getProjectTypeByFunctionType(DisplayRecommendFunctionTypeEnum.AgentDev),
    ).toBe(AgentComponentTypeEnum.Agent);
    expect(
      getProjectTypeByFunctionType(DisplayRecommendFunctionTypeEnum.PageAppDev),
    ).toBe(AgentComponentTypeEnum.PageApp);
    expect(
      getProjectTypeByFunctionType(DisplayRecommendFunctionTypeEnum.SkillDev),
    ).toBe(AgentComponentTypeEnum.Skill);
    expect(
      getProjectTypeByFunctionType(DisplayRecommendFunctionTypeEnum.PluginDev),
    ).toBe(AgentComponentTypeEnum.Plugin);
    expect(
      getProjectTypeByFunctionType(DisplayRecommendFunctionTypeEnum.UserAppDev),
    ).toBe(AgentComponentTypeEnum.UserApp);
    expect(
      getProjectTypeByFunctionType(
        DisplayRecommendFunctionTypeEnum.NormalProjectDev,
      ),
    ).toBe(AgentComponentTypeEnum.NormalProject);
    expect(
      getProjectTypeByFunctionType(DisplayRecommendFunctionTypeEnum.Chat),
    ).toBeUndefined();
    expect(getProjectTypeByFunctionType(undefined)).toBeUndefined();
    expect(getProjectTypeByFunctionType(null)).toBeUndefined();
  });

  it('isTaskAgentFunctionType：五个项目类为任务态、对话型/未配置不是', () => {
    expect(
      isTaskAgentFunctionType(DisplayRecommendFunctionTypeEnum.AgentDev),
    ).toBe(true);
    expect(
      isTaskAgentFunctionType(
        DisplayRecommendFunctionTypeEnum.NormalProjectDev,
      ),
    ).toBe(true);
    expect(isTaskAgentFunctionType(DisplayRecommendFunctionTypeEnum.Chat)).toBe(
      false,
    );
    expect(isTaskAgentFunctionType(undefined)).toBe(false);
    // 原集合不含 PageAppDev
    expect(
      isTaskAgentFunctionType(DisplayRecommendFunctionTypeEnum.PageAppDev),
    ).toBe(false);
  });

  it('showSpaceSelectorForFunctionType：六个项目类需要空间选择、对话型不需要', () => {
    expect(
      showSpaceSelectorForFunctionType(
        DisplayRecommendFunctionTypeEnum.PageAppDev,
      ),
    ).toBe(true);
    expect(
      showSpaceSelectorForFunctionType(DisplayRecommendFunctionTypeEnum.Chat),
    ).toBe(false);
    expect(showSpaceSelectorForFunctionType(undefined)).toBe(false);
  });
});
