module.exports = {
  extends: require.resolve('@umijs/max/stylelint'),
  rules: {
    // line-clamp 截断惯用 display:-webkit-box（无前缀等价物，剥掉前缀得到
    // 无效的 box，Chrome 截断失效）；仅豁免 box 值，其余前缀值仍禁用
    'value-no-vendor-prefix': [true, { ignoreValues: ['box'] }],
  },
};
