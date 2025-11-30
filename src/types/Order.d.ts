import type { CartItem } from '@/types/CartItem'
import type { AddressInfo } from '@/types/UserItem'

/**
 * 订单状态枚举
 */
export type OrderStatus =
  | 'PENDING' // 待支付
  | 'PAID' // 已支付
  | 'SHIPPED' // 已发货
  | 'COMPLETED' // 已完成
  | 'CANCELLED' // 已取消
  | 'REFUNDING' // 退款中
  | 'REFUNDED' // 已退款

/**
 * 支付方式枚举
 */
export type PaymentMethod = 'wechat' | 'alipay' | 'balance'

/**
 * 订单商品项
 * 基于 CartItem，但移除了 selected 字段
 */
export interface OrderProductItem extends Omit<CartItem, 'selected'> {}

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
 * 订单用户信息
 */
export interface OrderUserInfo {
  /** 用户ID */
  userId: string
  /** 用户昵称 */
  nickname: string
  /** 用户角色 */
  role: string
  /** 用户手机号 */
  mobile: string
  /** 用户头像 */
  avatarUrl?: string
}

/**
 * 订单物流信息
 */
export interface OrderLogistics {
  /** 物流公司 */
  company?: string
  /** 物流单号 */
  trackingNumber?: string
  /** 物流状态 */
  status?: string
  /** 物流更新时间 */
  updateTime?: string
}

/**
 * 订单项（完整订单数据类型）
 */
export interface OrderItem {
  /** 订单ID */
  _id: string
  /** 订单编号（业务订单号） */
  out_trade_no: string
  /** 微信交易订单号 */
  transaction_id: string
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
  paymentMethod?: PaymentMethod
  /** 支付流水号 */
  paymentNo?: string
  /** 物流信息 */
  logistics?: OrderLogistics
  /** 订单备注 */
  remark?: string
  /** 创建时间 */
  createdAt: string
  /** 支付时间 */
  paidAt?: string
  /** 发货时间 */
  shippedAt?: string
  /** 完成时间 */
  completedAt?: string
  /** 取消时间 */
  cancelledAt?: string
  /** 取消原因 */
  cancelReason?: string
  /** 更新时间 */
  updatedAt: string
}

/**
 * 创建订单请求参数
 */
export interface CreateOrderParams {
  /** 收货地址信息 */
  addressInfo: AddressInfo
  /** 订单商品列表 */
  products: OrderProductItem[]
  /** 金额明细 */
  amount: OrderAmount
  /** 订单备注 */
  remark?: string
}

/**
 * 订单列表查询参数
 */
export interface OrderQueryParams {
  /** 页码 */
  pageNum: number
  /** 每页条数 */
  pageSize: number
  /** 订单状态筛选 */
  status?: OrderStatus
  /** 订单编号 */
  out_trade_no?: string
  /** 开始时间 */
  startTime?: string
  /** 结束时间 */
  endTime?: string
}

/**
 * 订单分页响应
 */
export interface OrderPageResult {
  /** 订单列表 */
  list: OrderItem[]
  /** 总数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页条数 */
  pageSize: number
  /** 总页数 */
  totalPage: number
}

/**
 * 订单统计信息
 */
export interface OrderStatistics {
  /** 待支付订单数 */
  pendingCount: number
  /** 待发货订单数 */
  paidCount: number
  /** 待收货订单数 */
  shippedCount: number
  /** 已完成订单数 */
  completedCount: number
  /** 总订单数 */
  totalCount: number
  /** 总交易额 */
  totalAmount: number
}

// 兼容旧代码：会员订单类型
export interface ProOrderItem {
  _id: string
  out_trade_no: string
  status: OrderStatus
  vipLevelText: string
  discount: number
  giftCount: number
  term: string
  amount: number
  createdAt: string
}
