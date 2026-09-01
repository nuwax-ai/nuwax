/**
 * 会话/消息分享 markdown 组装(需求 5c)。
 *
 * 分享产物 = 前端组装的 markdown 文本,经分享接口落为 `.md` 链接后
 * 由 file-preview.html 静态页渲染(双端共用,mobile 拼 PC URL)。
 * 后端契约定型后(会话/消息分享 type),创建侧只需换 service 的
 * 请求路径与参数形态,组装函数与落地页链路不变。
 */
import { stripThinkBlocks } from '@/plugins/ds-markdown-think';
import { dict } from '@/services/i18nRuntime';
import { AssistantRoleEnum } from '@/types/enums/agent';

/** 分享标题(用作落地页文件名)的安全化:去掉路径/查询危险字符并截断 */
export const sanitizeShareTitle = (title: string, fallback = 'shared') => {
  const cleaned = (title || '')
    .trim()
    .replace(/[\\/:*?"<>|#&%?]+/g, '_')
    .replace(/\s+/g, ' ')
    .slice(0, 50)
    .trim();
  return cleaned || fallback;
};

/** 组装单条消息的分享 markdown(不含思考过程) */
export const buildMessageMarkdown = (text: string, isUser: boolean): string => {
  const role = dict(
    isUser
      ? 'PC.Pages.Chat.searchRoleUser'
      : 'PC.Pages.Chat.searchRoleAssistant',
  );
  return `**${role}**\n\n${stripThinkBlocks(text || '').trim()}`;
};

/**
 * 组装整个会话的分享 markdown:标题 + 按时间正序的角色消息。
 * 思考过程与过程标签不进入分享产物,只分享正文。
 */
export const buildConversationMarkdown = (
  topic: string,
  messages: Array<{
    role?: AssistantRoleEnum | string;
    text?: string | null;
  }>,
): string => {
  const title = sanitizeShareTitle(topic);
  const blocks: string[] = [];
  for (const msg of messages) {
    const text = stripThinkBlocks(msg?.text || '').trim();
    if (!text) continue;
    const isUser = msg?.role === AssistantRoleEnum.USER;
    blocks.push(buildMessageMarkdown(text, isUser));
  }
  return [`# ${title}`, '', '---', '', blocks.join('\n\n---\n\n')].join('\n');
};
