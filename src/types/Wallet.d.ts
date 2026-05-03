/** 流水方向（Prisma WalletTransactionType） */
export type WalletTransactionType = 'IN' | 'OUT'

/** 业务类型（Prisma WalletBizType） */
export type WalletBizType = 'SETTLEMENT' | 'COMMISSION' | 'WITHDRAW'

/**
 * 用户钱包（Prisma Wallet，与门店详情里的 `ManagerStore.Wallet` 区分：含 userId）
 */
export interface UserWallet {
  userId: string
  balance: string
  availableBalance: string
  frozenBalance: string
}

/** 钱包流水（Prisma WalletTransaction） */
export interface WalletTransaction {
  id: number
  userId: string
  type: WalletTransactionType
  bizType: WalletBizType
  amount: string
  balanceAfter: string
  relatedId: number | null
  remark: string | null
  createdAt: string
}

export interface WalletTransactionPage {
  list: WalletTransaction[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

/** 钱包流水页筛选项（UI）：提现走 OUT，不单列筛选项 */
export type WalletFilterTab = 'ALL' | 'IN' | 'OUT'
