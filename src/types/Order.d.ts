import type { CartItem } from './CartItem'
import type { AddressInfo } from './UserItem'

/**
 * 商品订单类型
 */
export interface ProOrderItem {
  /** 订单ID */
  _id: string
  /** 后端生成的订单编号（业务订单号） */
  out_trade_no?: string
  /** 订单状态 */
  status: OrderStatus
  /** 用户信息 */
  userInfo: OrderUserInfo
  /** 收货地址信息 */
  addressInfo: AddressInfo
  /** 订单商品列表 */
  products: OrderProductItem[]
  /** 订单商品总件数 */
  totalCount: number
  /** 金额明细 */
  amount: OrderAmount
  /** 支付方式 */
  paymentMethod?: 'wechat' | 'alipay' | 'balance'
  /** 订单备注 */
  remark?: '商品购买' | '办理会员' | '店长进货'
  /** 创建时间 */
  createdAt: Date
  /** 完成时间 */
  completedAt?: Date
  /** 取消时间 */
  cancelledAt?: Date
  /** 取消原因 */
  refundReason?: string
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 商品订单状态枚举
 */
export type OrderStatus =
  | 'pending' // 待支付
  | 'paid' // 已支付
  | 'shipped' // 已发货
  | 'completed' // 已完成
  | 'cancelled' // 已取消
  | 'refunding' // 退款中
  | 'refunded' // 已退款

/**
 * 订单商品项
 * 基于 CartItem，但移除了 selected 字段
 */
export interface OrderProductItem extends Omit<CartItem, 'selected'> {}

/**
 * 订单用户信息
 */
export interface OrderUserInfo {
  /** 用户ID */
  userId: string
  /** 用户昵称 */
  nickname?: string
  /** 用户角色 */
  role: string
  /** 用户手机号 */
  mobile: string
}

/**
 * 订单金额明细
 */
export interface OrderAmount {
  /** 商品总金额 */
  totalPrice: number
  /** 积分抵扣金额 */
  deductAmount: number
  /** 实际支付金额 */
  actualPayment: number
  /** 使用的积分数 */
  usedScore?: number
}

/**
 * vip订单数据类型
 */

export type VipOrderItem = {
  /** vip订单数据库id-唯一标识*/
  _id: string
  /** 订单唯一标识（可用后端生成，格式可自定义，如 WX + 时间戳 + 随机数）*/
  out_trade_no: string
  /** 用户唯一标识（购买该会员的用户） */
  userId: string
  /** 用户手机号 */
  userMobile: string
  /** 购买的会员产品 ID，对应 VipItem._id */
  vipProId: string
  /** 会员等级 */
  vipLevel: number
  /** 购买的会员等级名称，用于前端展示 */
  vipLevelText: string
  /** 支付金额（单位：元，等于 VipItem.price） */
  amount: number
  /** 会员折扣（取自 VipItem.discount） */
  discount: number
  /** 每月免费次数 */
  limit: number
  /** vip权益可绑定人数 */
  maxUsers: number
  /** 会员有效期（取自 VipItem.term，用于说明会员期限） */
  term: string
  /** 会员有效期（支付成功后-会员的到期时间） */
  expirationTime?: string
  /** 订单状态 */
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'
  /** 微信支付返回的 prepay_id，用于前端调起支付 */
  prepayId?: string
  /** 微信支付交易号，支付成功后回填 */
  transactionId?: string
  /** 支付时间（ISO 8601 格式），支付成功后回填 */
  paidAt?: Date
  /** 创建订单时间（ISO 8601 格式） */
  createdAt: Date
  /** 更新时间（ISO 8601 格式，用于记录订单状态更新） */
  updatedAt: Date
  /** 取消时间 */
  cancelledAt: Date
}
