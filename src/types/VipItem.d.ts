/**
 * vip产品列表数据类型
 */

export type VipItem = {
  /** 唯一标识 */
  _id: string
  /** 会员等级（数值越大等级越高，如 1=普通会员，2=高级会员，3=至尊会员）*/
  level: number
  /** 等级文字说明（用于展示给用户，如“至尊会员”）*/
  levelText: string
  /** 会员折扣（单位：折，取值范围 0~10，例：8 表示 8 折）*/
  discount: number
  /** 成为该等级会员所需支付的价格（单位：元）*/
  price: number
  /** 赠送的贴膜次数（单位：次）*/
  gift: number
  /** 会员有效期（如“一年”、“半年”、“永久”）*/
  term: string
}

/**
 * 查询当前用户的下一会员等级
 */

export type VipRenderInfo = {
  /** 加多少钱，比如 30 */
  price: number
  /** 会员等级文字，如 "高级会员" */
  levelName: string
  /** 折扣，5.5 表示 5.5折 */
  discount: number
  /** 赠送贴膜次数 */
  giftCount: number
}
