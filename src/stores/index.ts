import { createPinia } from 'pinia'
import persist from 'pinia-plugin-persistedstate'

// 创建 pinia 实例
const pinia = createPinia()
// 使用持久化存储插件
pinia.use(persist)

// 默认导出，给 main.ts 使用
export default pinia

// 模块统一导出
export * from './modules/member'
export * from './modules/history.ts'
export * from './modules/cart.ts'
export * from './modules/rate.ts'
export * from './modules/cartTob.ts'
export * from './modules/manager.ts'
