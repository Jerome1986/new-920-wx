import { request } from '@/utils/http'

/**
 * 获取钱包流水
 * @param userId - 用户ID
 * @param params - 分页（可选，由后端支持时生效）
 */
export const walletTransactionByUser = (
  userId: string,
  params?: { pageNum?: number; pageSize?: number },
) => {
  return request({
    method: 'GET',
    url: `/wallet-transaction/transaction/${userId}`,
    data: params,
  })
}
