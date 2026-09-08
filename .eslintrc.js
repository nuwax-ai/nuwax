module.exports = {
  extends: require.resolve('@umijs/max/eslint'),
  ignorePatterns: ['public/**'],
  overrides: [
    // 会话域依赖规则（docs/adr/conversation-runtime-refactor.md）：
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
  ],
};
