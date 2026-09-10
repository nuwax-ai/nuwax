/**
 * 工作目录策略单测（workspaceDirPolicy.constants）：
 * 全栈应用（UserApp）与网页应用（PageApp）当前版本仅云端（不支持个人电脑/
 * 自定义目录）；常规项目支持个人电脑+自定义目录；未登记类型走默认能力。
 */
import {
  CLOUD_SANDBOX_ID,
  getWorkspaceDirPolicy,
} from '@/constants/workspaceDirPolicy.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';

describe('workspaceDirPolicy 目录能力策略', () => {
  it('云电脑哨兵值为 -1', () => {
    expect(CLOUD_SANDBOX_ID).toBe('-1');
  });

  it('全栈应用（UserApp）与网页应用（PageApp）仅云端：不支持个人电脑与自定义目录', () => {
    for (const type of [
      AgentComponentTypeEnum.UserApp,
      AgentComponentTypeEnum.PageApp,
    ]) {
      const policy = getWorkspaceDirPolicy(type);
      expect(policy.personalComputer).toBe(false);
      expect(policy.customDir).toBe(false);
    }
  });

  it('常规项目（NormalProject）支持个人电脑与自定义目录', () => {
    const policy = getWorkspaceDirPolicy(AgentComponentTypeEnum.NormalProject);
    expect(policy.personalComputer).toBe(true);
    expect(policy.customDir).toBe(true);
  });

  it('未登记类型走默认能力（智能体/技能/插件等维持现状）', () => {
    for (const type of [
      AgentComponentTypeEnum.Agent,
      AgentComponentTypeEnum.Skill,
      AgentComponentTypeEnum.Plugin,
      undefined,
      'UnknownType',
    ]) {
      const policy = getWorkspaceDirPolicy(type);
      expect(policy.personalComputer).toBe(true);
      expect(policy.customDir).toBe(true);
    }
  });
});
