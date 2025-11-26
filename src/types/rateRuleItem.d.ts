// 积分管理设置的数据类型
export interface RateRulesItem {
  /** 唯一标识 */
  _id?: string
  /** 返积分比例：消费商品返回多少比例的积分，如10%，0.1等 */
  earnRate?: number
  /** 积分抵扣换算率：积分和人民币的换算比例，默认为 1：1 */
  useRate?: number
  /** 抵扣比例：当前订单里，订单总额，积分最大可抵扣的比例，如：10%，0.1等 */
  maxUsePercent?: number
}
