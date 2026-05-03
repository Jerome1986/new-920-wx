import type { WalletFilterTab, WalletTransactionPage } from '@/types/Wallet'
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
