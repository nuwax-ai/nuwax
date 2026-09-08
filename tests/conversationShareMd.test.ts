/**
 * 会话/消息分享 markdown 组装(需求 5c)纯函数测试:
 * 1. 标题安全化:路径危险字符替换/空标题兜底/超长截断;
 * 2. 单条消息:角色前缀 + 剥离内联思考块;
 * 3. 整会话:标题 + 分隔线 + 按序消息块,空正文消息跳过。
 */
import { AssistantRoleEnum } from '@/types/enums/agent';
import {
  buildConversationMarkdown,
  buildMessageMarkdown,
  sanitizeShareTitle,
} from '@/utils/conversationShareMd';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

const THINK_BLOCK =
  '<div><markdown-custom-think status="thinking" content="内心独白"></markdown-custom-think></div>';

describe('sanitizeShareTitle', () => {
  it('替换路径/查询危险字符', () => {
    expect(sanitizeShareTitle('a/b\\c:d*e?f"g<h>i|j#k&l%m')).toBe(
      'a_b_c_d_e_f_g_h_i_j_k_l_m',
    );
  });

  it('空标题回退默认值;纯符号标题清洗为占位', () => {
    expect(sanitizeShareTitle('   ')).toBe('shared');
    expect(sanitizeShareTitle('///')).toBe('_');
    expect(sanitizeShareTitle('', 'fallback')).toBe('fallback');
  });

  it('超长标题截断到 50 字符', () => {
    expect(sanitizeShareTitle('标'.repeat(80)).length).toBe(50);
  });
});

describe('buildMessageMarkdown', () => {
  it('用户消息带角色前缀', () => {
    const md = buildMessageMarkdown('你好', true);
    expect(md).toBe('**PC.Pages.Chat.searchRoleUser**\n\n你好');
  });

  it('助手消息剥离内联思考块,只留正文', () => {
    const md = buildMessageMarkdown(`${THINK_BLOCK}\n这是最终回答`, false);
    expect(md).toBe('**PC.Pages.Chat.searchRoleAssistant**\n\n这是最终回答');
    expect(md).not.toContain('markdown-custom-think');
  });
});

describe('buildConversationMarkdown', () => {
  it('标题 + 按序消息块,空正文消息跳过', () => {
    const md = buildConversationMarkdown('周报整理', [
      { role: AssistantRoleEnum.USER, text: '帮我整理周报' },
      { role: AssistantRoleEnum.ASSISTANT, text: '' },
      { role: AssistantRoleEnum.ASSISTANT, text: `${THINK_BLOCK}\n好的,如下` },
    ]);
    expect(md).toContain('# 周报整理');
    expect(md).toContain('**PC.Pages.Chat.searchRoleUser**\n\n帮我整理周报');
    expect(md).toContain('好的,如下');
    expect(md).not.toContain('markdown-custom-think');
    // 3 条消息中 1 条空正文被跳过:助手角色块只出现 1 次,块间分隔线 2 处
    expect(md.split('PC.Pages.Chat.searchRoleAssistant').length - 1).toBe(1);
    expect(md.split('---').length).toBe(3);
  });
});
