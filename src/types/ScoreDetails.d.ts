// 定义积分明细类型
export interface ScoreItem {
  /** 唯一标识 */
  _id: string
  /** 用户ID */
  userId: string
  /** 明细类型，INCOME代表收入，EXPENSE代表支出 */
  type: 'INCOME' | 'EXPENSE'
  /** 本次变化的积分数量 */
  amount: number
  /** 用途/来源描述 */
  source: string
  /** 变化后的余额 */
  balance: number
  /** 创建时间 */
  createdAt: string
}

export interface ScoreDetailsPage {
  list: ScoreItem[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}
