import { AgentComponentTypeEnum } from '@/types/enums/agent';

/**
 * 云电脑哨兵值：电脑选择列表（apiGetUserSelectableSandboxList）中的固定项，
 * 非该值即用户自选的个人电脑。
 */
export const CLOUD_SANDBOX_ID = '-1';

/**
 * 项目类型 × 个人电脑/自定义目录能力策略（单一定义处，勿在入口散落判断）。
 * 依据「全栈应用任务及接口清单」wiki（2026-09-10）目录选择规格：
 * - 全栈应用（UserApp）当前版本不支持个人电脑，仅云端沙箱，无自定义目录；
 * - 常规项目支持个人电脑 + 指定工作目录（目录被占用则创建报错，禁止跨项目复用）；
 * - 项目外建会话选个人电脑 + 自定义目录时，由后端隐式创建常规项目并挂会话。
 */
export interface WorkspaceDirPolicy {
  /** 是否允许选择个人电脑（false = 仅云端沙箱） */
  personalComputer: boolean;
  /** 是否允许指定自定义工作目录（依赖个人电脑） */
  customDir: boolean;
}

const DEFAULT_POLICY: WorkspaceDirPolicy = {
  personalComputer: true,
  customDir: true,
};

const POLICY_OVERRIDES: Partial<
  Record<AgentComponentTypeEnum, WorkspaceDirPolicy>
> = {
  [AgentComponentTypeEnum.UserApp]: {
    personalComputer: false,
    customDir: false,
  },
};

/** 读取项目类型的目录能力策略；未登记的类型（智能体/技能/插件等）走默认能力 */
export const getWorkspaceDirPolicy = (
  type?: AgentComponentTypeEnum | string,
): WorkspaceDirPolicy =>
  (type && POLICY_OVERRIDES[type as AgentComponentTypeEnum]) || DEFAULT_POLICY;
