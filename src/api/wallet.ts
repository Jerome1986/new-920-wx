import type { UserWallet, WalletFilterTab, WalletTransactionPage } from '@/types/Wallet'
import { request } from '@/utils/http'

/**
 * 获取钱包流水
 * @param userId - 用户ID
 * @param params - 分页（可选，由后端支持时生效）
 */
export const walletTransactionByUser = (
  userId: string,
  tab: WalletFilterTab,
  pageNum: number,
  pageSize: number,
) => {
  return request<WalletTransactionPage>({
    method: 'GET',
    url: `/wallet-transaction/transaction/${userId}`,
    data: { tab, pageNum, pageSize },
  })
}

/**
 * 获取用户钱包信息
 * @param userId
 */
export const userWalletApi = (userId: string) => {
  return request<UserWallet>({
    method: 'GET',
    url: `/wallet/${userId}`,
  })
}

/**
 * 用户提现申请
 * @param userId
 * @param amount
 * @param payeeName
 * @param payeeAccount
 * @param bankName
 */
export const walletWithdrawApplyApi = (
  userId: string,
  amount: number,
  payeeName: string,
  payeeAccount: string,
  bankName: string,
) => {
  return request({
    method: 'POST',
    url: '/wallet-withdraw-apply/submit',
    data: { userId, amount, payeeName, payeeAccount, bankName },
  })
}
