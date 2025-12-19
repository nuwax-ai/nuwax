/**
 * V2 目录的 ESLint 配置
 * 由于重构进行中，暂时放宽部分规则
 */
module.exports = {
  rules: {
    // 重构过程中暂时允许未使用的变量
    '@typescript-eslint/no-unused-vars': 'warn',
    // 允许在定义前使用（某些函数相互依赖的情况）
    '@typescript-eslint/no-use-before-define': 'warn',
    // 允许 React Hooks 规则警告
    'react-hooks/rules-of-hooks': 'warn',
  },
};
