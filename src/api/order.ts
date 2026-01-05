import { request } from '@/utils/http.ts'
import type {
  freeOrderStatus,
  OrderAmount,
  OrderItem,
  OrderPageResult,
  OrderProductItem,
  OrderStatus,
  OrderUserInfo,
  QuickOrderResult,
  VipOrderItem,
} from '@/types/Order'
import type { AddressInfo } from '@/types/UserItem'
import type { NativeResponse, WechatPayParams } from '@/types/WechatPay'
import type { updateResult } from '@/types/Gobal'
import type { CheckVipResponse } from '@/types/VipItem'

/**
 * 根据用户ID和订单状态获取当前用户订单列表
 * @param userId - 用户ID
 * @param status - 订单状态
 * @param pageNum - 页码
 * @param pageSize - 条数
 */
export const userOrderGetApi = (
  userId: string,
  status: string,
  pageNum: number,
  pageSize: number,
) => {
  return request<OrderPageResult>({
    method: 'GET',
    url: '/order/get',
    data: { userId, status, pageNum, pageSize },
  })
}

/**
 * 根据订单号获取详细订单信息详情
 * @param orderNo - 订单号
 */
export const userOrderDetailGetApi = (orderNo: string) => {
  return request<OrderItem>({
    method: 'GET',
    url: '/order/detail',
    data: { orderNo },
  })
}

/**
 * 商品支付新增订单接口
 * @param userInfo  - 用户信息
 * @param addressInfo - 用户收获地址
 * @param products - 订单商品信息
 * @param totalCount - 订单商品总件数
 * @param amount - 订单金额信息
 * @param paymentMethod - 订单支付方式
 * @param remark - 订单备注：区分订单的类型 '商品购买' | '办理会员' | '店长进货'
 */
export const proOrderPayApi = (
  userInfo: OrderUserInfo,
  addressInfo: AddressInfo,
  products: OrderProductItem[],
  totalCount: number,
  amount: OrderAmount,
  paymentMethod: 'wechat' | 'alipay' | 'balance',
  remark: '商品购买' | '办理会员' | '店长进货',
) => {
  return request<WechatPayParams>({
    method: 'POST',
    url: '/wx/proPay',
    data: { userInfo, addressInfo, products, totalCount, amount, paymentMethod, remark },
  })
}

/**
 * 用户确认收货更新订单
 * @param userId - 用户ID
 * @param orderNo - 订单ID
 */
export const confirmOrderLogistics = (userId: string, orderNo: string) => {
  return request<updateResult>({
    method: 'POST',
    url: '/order/upLogistics',
    data: { userId, orderNo },
  })
}

/**
 * 商品订单取消
 * @param orderId - 订单ID
 */
export const proOrderCancelApi = (orderId: string) => {
  return request<updateResult>({
    method: 'POST',
    url: '/order/cancelPro',
    data: { orderId },
  })
}

/**
 * 查看订单物流信息
 * @param openid - 微信用户唯一ID
 * @param transaction_id - 交易单号
 */
export const orderLogisticsApi = (openid: string, transaction_id: string) => {
  return request({
    method: 'POST',
    url: '/order/getOrderLogistics',
    data: { openid, transaction_id },
  })
}

/**
 * 办理会员支付接口
 * @param userId
 * @param userMobile
 * @param vipProId
 * @param vipLevel
 * @param vipLevelText
 * @param discount
 * @param limit
 * @param maxUsers
 * @param term
 * @param totalFee
 * @param description
 */
export const vipPayApi = (
  userId: string,
  userMobile: string,
  vipProId: string,
  vipLevel: number,
  vipLevelText: string,
  discount: number,
  limit: number,
  maxUsers: number,
  term: string,
  totalFee: number,
  description: string,
) => {
  return request<WechatPayParams>({
    method: 'POST',
    url: '/wx/vipPay',
    data: {
      userId,
      userMobile,
      vipProId,
      vipLevel,
      vipLevelText,
      discount,
      limit,
      maxUsers,
      term,
      totalFee,
      description,
    },
  })
}

/**
 * 会员订单取消支付
 * @param orderId
 */
export const vipOrderCancelledApi = (orderId: string) => {
  return request<updateResult>({
    method: 'POST',
    url: '/order/cancelVip',
    data: { orderId },
  })
}

/**
 * 获取用户的会员订单
 * @param userId - 用户ID
 * @param status - 订单状态，前端只展示PAID 已开通  CANCELLED已取消
 */
export const vipOrderGetApi = (userId: string, status: string) => {
  return request<VipOrderItem[]>({
    method: 'GET',
    url: '/order/vip',
    data: { userId, status },
  })
}

/**
 * 门店快速下单，用户扫码支付
 * @param storeId  - 门店ID
 * @param productId - 商品ID
 * @param amount - 订单金额
 * @param paymentMethod - 支付方式
 * @param remark - 订单备注
 * @param memberPhone - 会员手机号码
 */
export const quickOrderApi = (
  storeId: string,
  productId: string,
  amount: number,
  paymentMethod: string,
  remark: string,
  memberPhone: string,
) => {
  return request<NativeResponse>({
    method: 'POST',
    url: '/quickSell/addOrder',
    data: { storeId, productId, amount, paymentMethod, remark, memberPhone },
  })
}

/**
 * 会员免费贴膜订单接口
 * @param storeId - 门店ID
 * @param productId - 产品ID
 * @param amount - 订单金额
 * @param paymentMethod - 支付方式
 * @param remark - 订单说明
 * @param memberPhone - 会员号码
 */
export const giftOrderApi = (
  storeId: string,
  productId: string,
  amount: number,
  paymentMethod: string,
  remark: string,
  memberPhone: string,
) => {
  return request<QuickOrderResult<freeOrderStatus>>({
    method: 'POST',
    url: '/quickSell/giftOrder',
    data: { storeId, productId, amount, paymentMethod, remark, memberPhone },
  })
}

/**
 * 获取线下贴膜订单详情
 * @param out_trade_no - 订单号
 * @template T - 状态类型：OrderStatus（支付订单）或 freeOrderStatus（免费订单）
 */
export const offlineOrderGetApi = <T = OrderStatus>(out_trade_no: string) => {
  return request<QuickOrderResult<T>>({
    method: 'GET',
    url: '/order/offlineOrder',
    data: { out_trade_no },
  })
}

/**
 * 根据用户手机号码，检查是否是会员，是否还有免费次数
 * @param memberPhone - 会员手机号码
 */
export const checkVipApi = (memberPhone: string) => {
  return request<CheckVipResponse>({
    method: 'POST',
    url: '/quickSell/checkVip',
    data: { memberPhone },
  })
}
