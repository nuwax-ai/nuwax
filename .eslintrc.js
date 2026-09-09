// 说明：「页面之间禁止互相 import」无法用 no-restricted-imports 表达「自引允许」，
// 且同文件命中多个 override 时该规则整条被覆盖（会冲掉会话域 error 红线）。
// 因此页面互引红线由 dependency-cruiser 承担（.dependency-cruiser.cjs，
// 覆盖别名与相对路径两种引用方式，存量冻结于 .dependency-cruiser-known-violations.json）。

// 分层红线（docs/engineering-conventions.md §4）：非页面层禁止反向依赖页面层。
const NON_PAGES_TO_PAGES_PATTERN = {
  group: ['@/pages/*', '@/pages/*/*', '@/pages/*/*/*'],
  message:
    '分层红线：非页面层禁止依赖 @/pages/**（docs/engineering-conventions.md §4）；需要的共享实现请下沉到 components/hooks/services/utils/types。',
};

module.exports = {
  extends: require.resolve('@umijs/max/eslint'),
  ignorePatterns: ['public/**'],
  overrides: [
    // 会话域依赖规则（docs/conversation/adr/conversation-runtime-refactor.md）：
    // 页面层只允许消费 react 层（Provider/构建器/hook），禁止直接依赖
    // domain/runtime/adapters 内部实现，防止状态组合规则再次泄漏给入口。
    {
      files: ['src/pages/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: [
                  '@/features/conversation/domain/*',
                  '@/features/conversation/runtime/*',
                  '@/features/conversation/adapters/*',
                ],
                message:
                  '页面层禁止直接依赖会话 domain/runtime/adapters 内部模块，请消费 @/features/conversation/react/* 或组件 Props。',
              },
            ],
          },
        ],
      },
    },
    // 分层红线：组件/hooks/services/utils/layouts/features 禁止反向依赖页面层。
    // 存量已清零（refactor/layering-cohesion B3 批次），升 error 防复发；
    // wrappers 引 403 页为路由兜底显式例外（见 docs/refactor/layering-audit.md §2.3）。
    {
      files: [
        'src/components/**/*.{ts,tsx}',
        'src/hooks/**/*.{ts,tsx}',
        'src/services/**/*.{ts,tsx}',
        'src/utils/**/*.{ts,tsx}',
        'src/layouts/**/*.{ts,tsx}',
        'src/features/**/*.{ts,tsx}',
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [NON_PAGES_TO_PAGES_PATTERN] },
        ],
      },
    },
    // 服务层只可依赖 Utils/Types：禁 hooks/components。
    // 遗留 1 条 type-only 引用（services/agentConfig.ts → AgentIntervention 类型，
    // 涉及会话域类型文件，留待会话域治理线处理），保持 warn；其余已清零。
    // 注意：同一文件命中多个 override 时 no-restricted-imports 整条被后者覆盖，
    // 因此必须把 NON_PAGES_TO_PAGES_PATTERN 合并进来，否则 services 会丢掉禁引页面的限制。
    {
      files: ['src/services/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'warn',
          {
            patterns: [
              NON_PAGES_TO_PAGES_PATTERN,
              {
                group: ['@/hooks/*', '@/components/*', '@/components/*/*'],
                message:
                  '分层红线：服务层只可依赖 Utils/Types（docs/engineering-conventions.md §4）。',
              },
            ],
          },
        ],
      },
    },
  ],
};
