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
