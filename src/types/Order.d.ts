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
  | 'PROCESSING' // 退款中
  | 'REFUNDED' // 已退款

/**
 * 支付方式枚举
 */
export type PaymentMethod = 'wechat' | 'alipay' | 'balance'

/**
 * 订单商品项
 */
export interface OrderProductItem {
  id: string
  image: string
  model?: string
  name: string
  orderId: string
  price: string
  productId: number
  quantity: number
  skuId?: number
  skuName?: string
  skuNo: string
}

/**
 * 提交的订单参数
 */

export interface sumbitOrderProduct extends Omit<CartItem, 'selected', 'dec', 'cover'> {}

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
  openid: string
  /** 用户ID */
  userId: string
  /** 用户昵称 */
  nickname: string
  /** 用户手机号 */
  mobile: string
  /** 用户头像 */
  avatarUrl?: string
}

/**
 * 订单项（完整订单数据类型）
 */
export interface OrderItem {
  /** 订单ID */
  id: string
  /** 订单编号（业务订单号） */
  outTradeNo: string
  /** 微信交易订单号 */
  transactionId?: string
  /** 订单状态 */
  status: OrderStatus
  openid: string
  /** 用户信息 */
  userId: string
  nickname: string
  mobile: string
  avatarUrl: string
  /** 收货地址信息 */
  address: AddressInfo
  /** 订单商品列表 */
  products: OrderProductItem[]
  /** 订单商品总件数 */
  totalCount: number
  /** 金额明细 */
  totalPrice: string
  deductAmount: string
  actualPayment: string
  usedScore: number
  /** 支付方式 */
  paymentMethod?: PaymentMethod
  /** 支付流水号 */
  paymentNo?: string
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

// 会员订单类型
export interface VipOrderItem {
  /** mongodb 唯一标识 */
  id: string
  /** 订单号*/
  outTradeNo: string
  transactionId: string
  openid: string
  /** 用户ID*/
  userId: string
  /** 用户电话*/
  userMobile: string
  /** 对应的产品ID*/
  vipProId: string
  /** 会员等级*/
  vipLevel: number
  /** 会员等级文本说明*/
  vipLevelText: string
  /** 产品金额*/
  amount: number
  /** 会员可享折扣*/
  discount: number
  /** 每月对应的免费贴膜次数*/
  limit: number
  /** 可共享的家庭成员*/
  maxUsers: number
  /** 会员周期 */
  term: string
  remark?: string
  /** 当前订单状态*/
  status: VipOrderStatus
  /** 订单创建时间 */
  createdAt: Date
  /** 订单更新时间 */
  updatedAt: Date
}

// 会员订单状态:支付则代表完成 前端显示已开通
export type VipOrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDING'

// 线下贴膜订单
export interface offlineOrderResult {
  /** 唯一标识ID */
  _id: string
  /** 门店ID */
  storeId: string
  /** 会员手机号码 */
  memberPhone: string
  /** 业务订单号 */
  out_trade_no: string
  /** 商品名称 */
  productName: string
  /** 商品封面图 */
  productCover: string
  /** 商品货号 */
  productSkuNo: string
  /** 商品备注 */
  productDec: string
  /** 包含的手机范围 */
  models: string[]
  /** 订单金额 */
  amount: number
  /** 支付方式 */
  paymentMethod: string
  /** 订单备注 */
  remark: string
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}

// 免费贴膜服务订单状态类型
export type freeOrderStatus =
  | 'SERVICING' // 服务中
  | 'COMPLETED' // 服务完成
  | 'CANCELLED' // 已取消

// 快速下单数据类型
export interface QuickOrderResult<TStatus> extends offlineOrderResult {
  status: TStatus
  cancelledAt?: Date
  completedAt?: Date
  refundReason?: string
}

// 会员免费贴膜服务完成返回数据类型
export interface QuickOrderGiftVipResult {
  /** 订单号 */
  out_trade_no: string
  /** 更新后的订单状态 */
  orderStatus: freeOrderStatus
  /** 会员剩余的贴膜次数 */
  remainVipGift: number
}
