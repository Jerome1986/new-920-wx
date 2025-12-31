// 门店流水数据类型
export interface FinanceRecords {
  /** 唯一标识ID */
  _id: string
  /** 门店ID */
  store_id: String
  /** 关联的订单ID */
  order_id: String
  /** 用户ID */
  user_id: String
  /** 关键的消费用户的ID */
  consumer_user_id: string
  /** 收入或支出对应的金额，建议正数，统一用 direction 控制  */
  amount: Number
  /** 流水对应的费用类型，如：income_store（门店收入） / income_commission（佣金） / payout_technician / payout_withdraw / refund /  */
  type: String
  /** IN 代表进账，OUT代表出账 */
  direction: 'IN' | 'OUT'
  /** 支付方式：wxpay / alipay / balance / system */
  method: String
  /** 流水明细类目备注：如：门店进货、佣金分成、门店贴膜收入等 */
  remark: String
  /** 创建时间 */
  created_at: Date
  /** 更新时间 */
  updated_at: Date
}

// 带分页
export interface StoreFlowPageResult {
  list: FinanceRecords[]
  total: Number
  pageNum: number
  pageSize: number
  totalPage: number
}
