// 注意：这里不要静态依赖 Pinia store（会导致 chunk 循环依赖告警）
// token 从 persistedstate 的存储中读取即可。

import { isArray } from 'wot-design-uni/components/common/util'

/**
 * 添加拦截器:
 *   拦截 request 请求
 *   拦截 uploadFile 文件上传
 *
 * TODO:
 *   1. 非 http 开头需拼接地址
 *   2. 请求超时
 *   3. 添加小程序端请求头标识
 *   4. 添加 token 请求头标识
 */

// 基地址
// const baseUrl = 'http://localhost:3000/api'
const baseUrl = 'https://14d80db1.r28.cpolar.top/api'

/**
 * 从 pinia-plugin-persistedstate 读取 member store token
 * - member store 的 defineStore id 为 'user'
 * - persistedstate 默认 key 即为 store id
 */
function getMemberTokenFromStorage(): string {
  try {
    const raw = uni.getStorageSync('user')
    if (!raw) return ''
    const state = typeof raw === 'string' ? JSON.parse(raw) : raw
    // member store 只持久化 state：{ profile: {...} }
    return (state?.profile?._id as string) || ''
  } catch {
    return ''
  }
}

// 添加拦截器
const httpInterceptor = {
  // 拦截前触发
  invoke(options: UniApp.RequestOptions) {
    // 1. 非 http 开头需拼接地址
    if (!options.url.startsWith('http')) {
      options.url = baseUrl + options.url
    }
    // 2. 请求超时, 默认 60s
    options.timeout = 10000
    // 3. 添加小程序端请求头标识
    options.header = {
      ...options.header,
      'source-client': 'minimap',
    }
    // 4. 添加 token 请求头标识
    const token = getMemberTokenFromStorage()
    if (token) {
      options.header.Authorization = token
    }
  },
}
uni.addInterceptor('request', httpInterceptor)
uni.addInterceptor('uploadFile', httpInterceptor)

/**
 * 请求函数
 * @param  UniApp.RequestOptions
 * @returns Promise
 *  1. 返回 Promise 对象
 *  2. 获取数据成功
 *    2.1 提取核心数据 res.data
 *    2.2 添加类型，支持泛型
 *  3. 获取数据失败
 *    3.1 401错误  -> 清理用户信息，跳转到登录页
 *    3.2 其他错误 -> 根据后端错误信息轻提示
 *    3.3 网络错误 -> 提示用户换网络
 */
export type Data<T> = {
  code: number
  message: string
  data: T
}

function safeShowToast(msg: string) {
  if (typeof msg === 'string') {
    uni.showToast({ title: msg, icon: 'none', duration: 2000, mask: true })
  } else {
    console.warn('toast msg is not string:', msg)
    uni.showToast({ title: '请求失败', icon: 'none', duration: 2000, mask: true })
  }
}

// 2.2 添加类型，支持泛型
export const request = <T>(options: UniApp.RequestOptions) => {
  // 1. 返回 Promise 对象
  return new Promise<Data<T>>((resolve, reject) => {
    uni.request({
      ...options,
      // 响应成功
      success(res) {
        let message = (res.data as Data<T>).message
        // 状态码 2xx， axios 就是这样设计的
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 2.根据后端状态码来提示报错
          if ((res.data as Data<T>).code === 400) {
            safeShowToast((res.data as Data<T>).message || '请求错误')
          }
          // 抛出服务器返回的结果
          resolve(res.data as Data<T>)
        } else if (res.statusCode === 400) {
          // 针对服务器的参数错误处理
          if (isArray(message)) message = message.join(',')

          safeShowToast(message)
          // 抛出错误
          reject(res)
        } else if (res.statusCode === 401) {
          // 401错误  -> 清理用户信息，跳转到登录页
          // 清理 persisted member store（pinia-plugin-persistedstate 默认 key 为 store id）
          uni.removeStorageSync('user')
          uni.navigateTo({ url: '/pages/login/login' })
          safeShowToast((res.data as Data<T>).message || '请求错误')
          reject(res)
        } else {
          // 其他错误 -> 根据后端错误信息轻提示
          safeShowToast((res.data as Data<T>).message || '请求错误')
          reject(res)
        }
      },
      // 响应失败
      fail(err) {
        uni.showToast({
          icon: 'none',
          title: '网络错误，换个网络试试',
        })
        reject(err)
      },
    })
  })
}
