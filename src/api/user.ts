import { request } from '@/utils/http.ts'
import type { childItems, fundsSettlementResult, InviterResult, UserItem } from '@/types/UserItem'
import type { QrcodeItem } from '@/types/QrcodeItem.d.ts'

/**
 * 查询用户的上级
 * @param userId - 用户ID
 */
export const userInviter2CodeGetApi = (userId: string) => {
  return request<InviterResult>({
    method: 'GET',
    url: `/user/parent/${userId}`,
  })
}

/**
 * 获取当前用户的所有下级好友
 * @param userId - 用户ID
 */
export const referralsUserListGetApi = (userId: string) => {
  return request<childItems[]>({
    method: 'GET',
    url: `/user/friend/${userId}`,
  })
}

/**
 * 生成自己的好友邀请码
 * @param referralCode - 自身邀请码
 */
export const addUserQrCodeApi = (referralCode: string) => {
  return request<QrcodeItem>({
    method: 'GET',
    url: `/user/friendCode/${referralCode}`,
  })
}

/**
 * 根据用户ID获取用户信息
 * @param userId - 当前用户ID
 */
export const userInfoGetApi = (userId: string) => {
  return request<UserItem>({
    method: 'GET',
    url: `/user/${userId}`,
  })
}

/**
 * 将待结算余额转入运营资金
 * @param userId  - 用户ID
 * @param amount - 即将转入的金额
 */
export const fundsSettlementAPi = (userId: string, amount: number) => {
  return request<fundsSettlementResult>({
    method: 'POST',
    url: '/funds/settlement',
    data: { userId, amount },
  })
}

/**
 * 更新用户头像
 * @param userId  -  用户ID
 * @param avatarUrl - 头像链接
 */
export const userAvatarChangeApi = (userId: string, url: string) => {
  return request({
    method: 'PATCH' as any,
    url: `/user/avatar/${userId}`,
    data: { url },
  })
}
