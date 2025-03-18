// 注册Python语言支持
monaco.languages.register({ id: 'python' });
monaco.languages.setMonarchTokensProvider('python', {
  keywords: [],
  tokenizer: {
    root: [],
  },
});
