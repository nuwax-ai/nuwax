import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';
import { buildKnowledgeInsertNodeConfigOnAdd } from '../knowledgeInsertNode';

describe('buildKnowledgeInsertNodeConfigOnAdd', () => {
  it('知识库描述为空时 nodeConfig.description 回退为名称', () => {
    const config = buildKnowledgeInsertNodeConfigOnAdd({
      name: '产品知识库',
      description: '',
      targetId: 99,
      targetType: AgentComponentTypeEnum.Knowledge,
    });
    expect(config.knowledgeBaseId).toBe(99);
    expect(config.name).toBe('产品知识库');
    expect(config.description).toBe('产品知识库');
  });
});
