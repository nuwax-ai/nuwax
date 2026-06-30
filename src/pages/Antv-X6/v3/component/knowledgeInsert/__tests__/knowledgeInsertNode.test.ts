import type { AddNodeResponse } from '@/services/workflow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { NodeTypeEnum } from '@/types/enums/common';
import { describe, expect, it, vi } from 'vitest';

// i18nRuntime → ./i18n → umi 的 request，vitest 下触发 esbuild TextEncoder 崩溃；
// 把该模块整体 mock 掉以断开 umi 传递依赖，被测逻辑本身不依赖 t()。
vi.mock('@/services/i18nRuntime', () => ({ t: (k: string) => k }));

import {
  buildKnowledgeInsertNodeConfigOnAdd,
  mergeNodeConfigAfterAddApi,
} from '../knowledgeInsertNode';

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

describe('mergeNodeConfigAfterAddApi (KnowledgeInsert)', () => {
  // 工作流接口（apiAddNodeV3）回显：仅返回 nodeConfig.description，不含平铺 knowledgeBaseId
  const makeApiResponse = (
    nodeConfig: Record<string, unknown>,
  ): AddNodeResponse => ({ nodeConfig } as unknown as AddNodeResponse);

  it('填写的描述优先于工作流接口返回的描述', () => {
    const merged = mergeNodeConfigAfterAddApi(
      NodeTypeEnum.KnowledgeInsert,
      {
        knowledgeBaseId: 1,
        name: '产品知识库',
        description: '填写的描述',
        icon: '',
        extension: {},
      },
      makeApiResponse({ description: '工作流返回的描述' }),
      {},
    );
    expect(merged.description).toBe('填写的描述');
  });

  it('填写描述为空时回退到工作流接口返回的描述', () => {
    const merged = mergeNodeConfigAfterAddApi(
      NodeTypeEnum.KnowledgeInsert,
      {
        knowledgeBaseId: 1,
        name: '产品知识库',
        description: '',
        icon: '',
        extension: {},
      },
      makeApiResponse({ description: '工作流返回的描述' }),
      {},
    );
    expect(merged.description).toBe('工作流返回的描述');
  });

  it('填写与工作流返回均为空时回退到名称', () => {
    const merged = mergeNodeConfigAfterAddApi(
      NodeTypeEnum.KnowledgeInsert,
      {
        knowledgeBaseId: 1,
        name: '产品知识库',
        description: '',
        icon: '',
        extension: {},
      },
      makeApiResponse({ description: '' }),
      {},
    );
    expect(merged.description).toBe('产品知识库');
  });
});
