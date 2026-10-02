import { defineConfig } from 'umi';
import base from './config';
import development from './config.development';

// 项目 dotenv 的 PORT 可覆盖启动环境；专用模式使用独立端口，避免占用日常服务。
process.env.PORT = process.env.RELEASE0930_MOCK_PORT || '3102';

// 本批验收独立启用；不继承远端代理，未覆盖的接口应明确失败。
export default defineConfig({
  ...development,
  define: { ...development.define, 'process.env.BASE_URL': '' },
  proxy: {},
  // Umi 按索引合并数组，删除一项会留下原 src；等长替换为空脚本。
  headScripts: base.headScripts?.map((script) =>
    typeof script === 'object' &&
    'src' in script &&
    String(script.src).includes('AliyunCaptcha.js')
      ? { ...script, src: 'data:application/javascript,' }
      : script,
  ),
});
