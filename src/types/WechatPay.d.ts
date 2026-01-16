/**
 * 微信小程序v3支付回调参数类型
 */

export type WechatPayParams = {
  /** 当前订单号 */
  out_trade_no: string
  /** 随机字符串，用于签名防重放攻击，长度一般为16-32位 */
  nonceStr: string
  /** 支付包信息，一般格式为 "prepay_id=xxxx" ，由微信支付统一下单接口返回 */
  packageValue: string
  /** 支付签名，用于前端调起微信支付，RSA-SHA256 签名 */
  paySign: string
  /** 签名类型，目前微信支付使用 RSA */
  signType: 'RSA'
  /** 时间戳，单位秒，用于生成签名 */
  timeStamp: string
}

// 扫码支付下单
export type NativeResponse = {
  /** 支付二维码链接 */
  code_url: string
  /** 业务订单号 */
  out_trade_no: string
}

// 退款金额信息
export interface RefundAmount {
  /** 本次退款金额（分） */
  refund: number
  /** 订单实际支付金额（分） */
  total: number
  /** 用户实付金额（分） */
  payer_total: number
  /** 用户实际收到的退款金额（分） */
  payer_refund: number
}

//退款状态（微信定义）
export type RefundStatus =
  | 'PROCESSING' // 退款中（资金在路上）
  | 'SUCCESS' // 退款成功（钱已到账）
  | 'ABNORMAL' // 退款异常（需人工介入）

// 退款渠道
export type RefundChannel = 'ORIGINAL' // 原路退回（最常见）

// 资金账户状态
export type FundsAccountStatus =
  | 'UNAVAILABLE' // 资金未出账（处理中）
  | 'AVAILABLE' // 资金已出账

// 优惠退款明细（预留）
export interface PromotionDetail {
  /** 优惠券 / 活动 ID */
  promotion_id: string
  /** 优惠范围 */
  scope: string
  /** 优惠类型 */
  type: string
  /** 优惠金额（分） */
  amount: number
  /** 优惠退款金额（分） */
  refund_amount: number
}

// 微信退款返回结果
export interface RefundResult {
  /** 退款金额信息（微信真实金额口径，唯一可信） */
  amount: RefundAmount
  /** 退款渠道：ORIGINAL = 原路退回 */
  channel: RefundChannel
  /** 微信受理退款时间（ISO8601 字符串） */
  create_time: string
  /** 资金账户状态（是否已出账） */
  funds_account: FundsAccountStatus
  /** 商户退款单号 */
  out_refund_no: string
  /** 原商户订单号 */
  out_trade_no: string
  /** 优惠退款明细（无优惠时为空数组） */
  promotion_detail: PromotionDetail[]
  /** 微信退款单号（官方流水号，用于对账 / 客服） */
  refund_id: string
  /** 退款状态（以回调为准） */
  status: RefundStatus
  /** 微信支付订单号 */
  transaction_id: string
  /** 用户实际收款账户（如：支付用户零钱） */
  user_received_account: string
}
