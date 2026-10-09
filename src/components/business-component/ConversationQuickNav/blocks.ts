import { AssistantRoleEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

/** 快捷导航块：一轮对话（用户消息 + 其后的助手回复）为一块 */
export interface QuickNavBlock {
  key: string;
  /** 定位锚点：本轮用户消息的服务端 id（会话以回复开头时取首个助手消息 id） */
  anchorId: string;
  /** 悬停卡片标题：本轮用户消息文本 */
  title: string;
  /** 悬停卡片正文：本轮回复开头（正文优先，无正文回落思考） */
  body: string;
}

/** 标题（悬停卡片首行）最大长度 */
export const QUICK_NAV_TITLE_MAX_LENGTH = 50;
/** 正文（悬停卡片）最大长度 */
export const QUICK_NAV_BODY_MAX_LENGTH = 80;

/** 剥离内联标签（协议标签的开/闭形态与普通富文本标签），预览只留纯文本 */
const stripInlineTags = (text: string) =>
  text
    .replace(/<\/?markdown-custom-[a-z-]+[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '');

const normalizeText = (text: string) =>
  stripInlineTags(text).replace(/\s+/g, ' ').trim();

const toNavRole = (role: MessageInfo['role']): 'user' | 'assistant' | null => {
  if (role === AssistantRoleEnum.USER) return 'user';
  if (role === AssistantRoleEnum.ASSISTANT) return 'assistant';
  return null;
};

const hasServerId = (message: MessageInfo): boolean =>
  message.id !== null && message.id !== undefined && `${message.id}` !== '';

/**
 * 由消息列表构建快捷导航块（一问一答一块）：
 * - 仅 USER/ASSISTANT 且有服务端 id、有可读文本（正文或思考）的消息参与；
 * - 用户消息开启新一轮（标题=自身文本、锚点=自身 id）；其后的连续助手回复
 *   并入本轮（正文取首个非空回复开头）；会话以回复开头时锚点取该回复 id；
 * - 无 id 或空文本的占位消息跳过。
 */
export const buildQuickNavBlocks = (
  messageList: MessageInfo[],
): QuickNavBlock[] => {
  const blocks: QuickNavBlock[] = [];
  messageList.forEach((message) => {
    const role = toNavRole(message.role);
    if (!role || !hasServerId(message)) return;
    const text =
      normalizeText(message.text || '') || normalizeText(message.think || '');
    if (!text) return;

    if (role === 'user') {
      blocks.push({
        key: `turn-${message.id}`,
        anchorId: `${message.id}`,
        title: text.slice(0, QUICK_NAV_TITLE_MAX_LENGTH),
        body: '',
      });
      return;
    }

    const last = blocks[blocks.length - 1];
    if (!last) {
      // 会话以助手回复开头：单独成块兜底
      blocks.push({
        key: `turn-${message.id}`,
        anchorId: `${message.id}`,
        title: '',
        body: text.slice(0, QUICK_NAV_BODY_MAX_LENGTH),
      });
      return;
    }
    if (!last.body) {
      last.body = text.slice(0, QUICK_NAV_BODY_MAX_LENGTH);
    }
  });
  return blocks;
};
