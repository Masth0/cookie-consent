const path = require('path');
const {defineConfig} = require('vite');
const {babel} = require('@rollup/plugin-babel');


const config = defineConfig(({ command, mode, ssrBuild }) => {

  const isES5 = mode === 'es5';

  return {
    plugins: isES5 ? [babel({ babelHelpers: 'bundled' })] : [],
    build: {
      emptyOutDir: false,
      minify: true,
      reportCompressedSize: true,
      lib: {
        entry: path.resolve(__dirname, 'lib/index.ts'),
        name: 'CookieConsent',
        fileName: (format) => {
          if (isES5 && format === 'umd') {
            return `es5/cookie-consent.${format}.${mode}.js`
          } else {
            return `cookie-consent.${format}.js`
          }
        },
      },
      rollupOptions: {
        // make sure to externalize deps that shouldn't be bundled
        // into your library
        // external: [],
        // output: [],
      },
    },
  };
});

export default config;