import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // 与 uni 的 root（VITE_ROOT_DIR，一般为项目根）一致，确保从根目录加载 .env*
  envDir: resolve(__dirname),
  build: {
    // 开发阶段启用源码映射：https://uniapp.dcloud.net.cn/tutorial/migration-to-vue3.html#需主动开启-sourcemap
    sourcemap: process.env.NODE_ENV === 'development',
  },
  plugins: [uni()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "styles/base" as *;`,
        includePaths: [resolve(__dirname, 'src')],
      },
    },
  },
})
