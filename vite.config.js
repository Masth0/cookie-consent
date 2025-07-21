import * as path from "path";
import {defineConfig} from "vite";
import dts from "vite-plugin-dts";


const config = defineConfig(({ command, mode, ssrBuild }) => {
  return {
    server: {
      port: '8888'
    },
    plugins: [dts({ rollupTypes: true })],
    build: {
      emptyOutDir: false,
      minify: false,
      reportCompressedSize: true,
      lib: {
        formats: ["es", "umd"],
        entry: path.resolve(__dirname, 'lib/index.ts'),
        name: 'CookieConsent',
        fileName: (format) => {
          return `cookie-consent.${format}.js`
        },
      },
      rollupOptions: {}
    },
  };
});

export default config;