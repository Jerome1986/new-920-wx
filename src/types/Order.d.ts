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
