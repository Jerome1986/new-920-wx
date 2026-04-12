import { request } from '@/utils/http.ts'
import type { addResult } from '@/types/Gobal'
import type { ApplyType } from '@/types/Apply'

/**
 * 员工招聘表单提交
 * /hire/add
 * @param {string} userId - 当前用户id
 * @param {string} name - 提交的姓名
 * @param {string} mobile - 提交的电话
 * @param {string} icCardFont - 身份证正面
 * @param {string} icCardBack - 身份证反面
 */

export const hireAddApi = (
  userId: string,
  name: string,
  mobile: string,
  icCardFont: string,
  icCardBack: string,
  type: ApplyType,
) => {
  return request<addResult>({
    method: 'POST',
    url: '/job-apply/add',
    data: { userId, name, mobile, icCardFont, icCardBack, type },
  })
}

/**
 * 根据用户id查询是否申请过员工招聘
 * /hire/check
 */

export const checkedHireApi = (userId: string, type: ApplyType) => {
  return request<boolean>({
    method: 'GET',
    url: `/job-apply/${userId}`,
    data: { type },
  })
}
