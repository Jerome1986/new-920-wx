import { request } from '@/utils/http.ts'
import type {
  fundsSettlementResult,
  inviter2CodeResult,
  referralsUserList,
  UserItem,
} from '@/types/UserItem'
import type { QrcodeItem } from '@/types/QrcodeItem.d.ts'

/**
 * 根据邀请码获取用户的上上级
 * @param inviterCode - 用户邀请码
 */
export const userInviter2CodeGetApi = (inviterCode: string) => {
  return request<inviter2CodeResult>({
    method: 'GET',
    url: '/user/invited',
    data: { inviterCode },
  })
}

/**
 * 获取当前用户的所有下级好友
 * @param referralCode - 当前用户自身的邀请码
 */
export const referralsUserListGetApi = (referralCode: string) => {
  return request<referralsUserList>({
    method: 'GET',
    url: '/user/referrals',
    data: { referralCode },
  })
}

/**
 * 生成自己的好友邀请码
 * @param referralCode - 自身邀请码
 */
export const addUserQrCodeApi = (referralCode: string) => {
  return request<QrcodeItem>({
    method: 'POST',
    url: '/qrCode/friends',
    data: { referralCode },
  })
}

/**
 * 根据用户ID获取用户信息
 * @param userId - 当前用户ID
 */
export const userInfoGetApi = (userId: string) => {
  return request<UserItem>({
    method: 'GET',
    url: '/user/get',
    data: { userId },
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
