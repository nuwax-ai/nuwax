import { defineConfig } from '@umijs/max';
import routes from './src/routes';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  define: { 'process.env.BASE_URL': process.env.BASE_URL },
  routes,
  npmClient: 'pnpm',
});
