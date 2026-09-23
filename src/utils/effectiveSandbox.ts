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
import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';

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

/**
 * 智能体 sandboxId 是否为「真实绑定」（bug 2490 收尾）：云端哨兵 -1 与空值
 * 都不算——四级链口径里 -1 与未绑定同义（兜底即云电脑）。智能体只存过云端
 * 记忆（sandboxId='-1'，apiSaveSelectedSandbox '-1' 表示云电脑）时若当绑定
 * 处理，空会话输入区选择器会被 fixedSelection 锁死（菜单除云端外全禁用），
 * 即「空会话选不了电脑」；真绑定（个人电脑 id）仍固定锁选。
 */
export const isRealAgentSandboxBinding = (
  sandboxId?: string | number | null,
): boolean => !!sandboxId && String(sandboxId) !== CLOUD_SANDBOX_ID;

/**
 * sandboxId 报文归一（禅道 bug2443）：沙箱 id 全链是字符串形态（电脑选择器 /
 * agentSelected 记忆 / 智能体绑定 / 会话 sandboxServerId）。历史发送链上的
 * `Number(sandboxId)` 转换点会把非数字形态的新沙箱 id 转成 NaN（JSON 序列化为
 * null），create 被后端静默按「未选沙箱」建会话、chat 再携带原始字符串报 400。
 *
 * 归一规则：数字形态（'377' / '-1'，且可安全还原）转 number 对齐后端 Long 契约；
 * 非数字 id 原样透传（勿再转 NaN）——后端 chat/create 的 sandboxId 字段需放宽为
 * 字符串后即可端到端放行；空值返回 undefined，由调用方按云电脑哨兵兜底。
 */
export const normalizeSandboxIdValue = (
  id?: string | number | null,
): string | number | undefined => {
  if (id === undefined || id === null) {
    return undefined;
  }
  const text = String(id).trim();
  if (!text) {
    return undefined;
  }
  // 仅纯数字且 Number 往返无损（防前导零/超安全整数精度丢失）才转 number
  if (/^-?\d+$/.test(text) && String(Number(text)) === text) {
    return Number(text);
  }
  return text;
};
