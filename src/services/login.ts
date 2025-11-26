import { request } from '@/utils/http.ts'
import type { UserItem } from '@/types/UserItem'

/**
 * 微信手机号登录接口
 * POST /wx/login
 * @param {string} code - 微信小程序调用 wx.login 后返回的临时登录凭证，用于获取 sessionKey
 * @param {string} encryptedData - 微信获取的用户手机号加密数据，需要结合 sessionKey 解密得到手机号
 * @param {string} iv - 加密数据的初始向量（Initialization Vector），用于解密 encryptedData
 * @param {string} inviterCode - 上级邀请码---默认为null
 */

export const wxLoginApi = (
  code: string,
  encryptedData: string,
  iv: string,
  inviterCode?: string,
) => {
  return request<UserItem>({
    method: 'POST',
    url: '/wx/login',
    data: {
      code,
      encryptedData,
      iv,
      inviterCode,
    },
  })
}
