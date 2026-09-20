/**
 * 会话生效沙箱解析四级链（单源，四处收敛：Chat useChatSandbox / AppDevPro /
 * ConversationAgent / EditAgent PreviewAndDebug，bug 2451）。
 *
 * 顺序：手动选择 > PUSH 跳转携带（仅路由 PUSH 语义，调用方自行判定后传入）>
 * 智能体绑定个人电脑（agent.sandboxId）> 会话共享电脑（sandboxServerId）。
 * 后三层与模型层 OPEN_DESKTOP gate（64db47a9d，bug 2341）同序。
 *
 * 全空返回 ''，由调用方按场景兜底（如云电脑哨兵 CLOUD_SANDBOX_ID）。
 */
export interface EffectiveSandboxSources {
  /** 用户手动选择的电脑 id（云电脑哨兵 '-1' 或个人沙箱 id） */
  selectedComputerId?: string | number | null;
  /** PUSH 跳转 location.state 携带的选择（入口首帧兜底层，非 PUSH 传 undefined） */
  pushStateComputerId?: string | number | null;
  /** 智能体绑定的个人电脑（agent.sandboxId） */
  agentSandboxId?: string | number | null;
  /** 会话共享电脑（conversationInfo.sandboxServerId） */
  sandboxServerId?: string | number | null;
}

export const resolveEffectiveSandboxId = ({
  selectedComputerId,
  pushStateComputerId,
  agentSandboxId,
  sandboxServerId,
}: EffectiveSandboxSources): string => {
  // 优先级 1: 手动选择
  if (selectedComputerId) {
    return String(selectedComputerId);
  }

  // 优先级 2: PUSH 跳转携带（首帧 state 未落 state 前的兜底）
  if (pushStateComputerId) {
    return String(pushStateComputerId);
  }

  // 优先级 3: 智能体绑定个人电脑
  if (agentSandboxId) {
    return String(agentSandboxId);
  }

  // 优先级 4: 会话共享电脑
  if (sandboxServerId) {
    return String(sandboxServerId);
  }

  return '';
};
