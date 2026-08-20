// val-loader entry: compiles frame.ts to a single minified JS string at build time.
// Returned value becomes the module.exports of `val-loader!./frame-bundle.js`.

const path = require('path');
const webpack = require('webpack');
const { createFsFromVolume, Volume } = require('memfs');

const FRAME_ENTRY = path.resolve(__dirname, 'frame.ts');

module.exports = function frameBundle() {
  const compiler = webpack({
    mode: 'production',
    target: 'web',
    devtool: false,
    entry: FRAME_ENTRY,
    output: {
      path: '/',
      filename: 'frame.js',
      iife: true
    },
    resolve: {
      extensions: ['.ts', '.js']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          options: { transpileOnly: true }
        }
      ]
    },
    performance: { hints: false }
  });

  const memFs = createFsFromVolume(new Volume());
  compiler.outputFileSystem = memFs;

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      const close = () => new Promise((res) => compiler.close(() => res()));
      if (err) {
        close().then(() => reject(err));
        return;
      }
      if (stats.hasErrors()) {
        close().then(() => reject(new Error(stats.toString({ errors: true }))));
        return;
      }
      const code = memFs.readFileSync('/frame.js', 'utf8');
      close().then(() => {
        resolve({
          code: 'module.exports = ' + JSON.stringify(code),
          cacheable: true,
          dependencies: [FRAME_ENTRY],
          buildDependencies: [__filename]
        });
      });
    });
  });
};
