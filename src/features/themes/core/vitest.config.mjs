// Standalone core suite: no app setup, DOM, generated Umi config or credentials.
export default {
  test: {
    environment: 'node',
    include: ['src/features/themes/core/**/*.test.ts'],
  },
};
