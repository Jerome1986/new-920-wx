import { request } from '@/utils/http.ts'
import type { addResult } from '@/types/Gobal'

/**
 * 提交合作申请
 * /cooperate/add
 * @param {string} userId - 当前用户id
 * @param {string} name - 表单人的姓名
 * @param {string} mobile - 当前用户联系方式
 * @param {string} icCardFont - 身份证正面
 * @param {string} icCardBack - 身份证反面
 * @param {string} business - 营业执照
 */

export const cooperateAddApi = (
  userId: string,
  name: string,
  mobile: string,
  icCardFont: string,
  icCardBack: string,
  business?: string,
) => {
  return request<addResult>({
    method: 'POST',
    url: '/cooperate/add',
    data: { userId, name, mobile, icCardFont, icCardBack, business },
  })
}

/**
 * 检查用户是否提交合作申请
 * /cooperate/check
 * @param {string} userId - 当前用户id
 */

export const cooperateCheckApi = (userId: string) => {
  return request<boolean>({
    method: 'GET',
    url: '/cooperate/check',
    data: { userId },
  })
}
