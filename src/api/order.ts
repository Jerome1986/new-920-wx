import { request } from '@/utils/http.ts'
import type {
  freeOrderStatus,
  offlineOrderResult,
  OrderItem,
  OrderPageResult,
  OrderStatus,
  QuickOrderGiftVipResult,
  QuickOrderResult,
  sumbitOrderProduct,
  VipOrderItem,
} from '@/types/Order'
import type { AddressInfo } from '@/types/UserItem'
import type { NativeResponse, RefundResult, WechatPayParams } from '@/types/WechatPay'
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
  target: 'TOB' | 'TOC',
  pageNum: number,
  pageSize: number,
) => {
  return request<OrderPageResult>({
    method: 'GET',
    url: `/order/${userId}`,
    data: { status, target, pageNum, pageSize },
  })
}

/**
 * 根据订单号获取详细订单信息详情
 * @param orderNo - 订单号
 */
export const userOrderDetailGetApi = (outTradeNo: string) => {
  return request<OrderItem>({
    method: 'GET',
    url: `/order/detail/${outTradeNo}`,
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
  openid: string,
  userId: string,
  target: 'TOB' | 'TOC',
  nickname: string,
  mobile: string,
  avatarUrl: string,
  addressInfo: AddressInfo,
  products: sumbitOrderProduct[],
  totalCount: number,
  totalPrice: number,
  deductAmount: number,
  actualPayment: number,
  usedScore: number,
  paymentMethod: 'wechat' | 'alipay' | 'balance',
  remark: '商品购买' | '办理会员' | '店长进货',
) => {
  return request<WechatPayParams>({
    method: 'POST',
    url: '/order/create',
    data: {
      openid,
      userId,
      target,
      nickname,
      mobile,
      avatarUrl,
      addressInfo,
      products,
      totalCount,
      totalPrice,
      deductAmount,
      actualPayment,
      usedScore,
      paymentMethod,
      remark,
    },
  })
}

/**
 * 用户确认收货更新订单
 * @param userId - 用户ID
 * @param orderNo - 订单ID
 */
export const confirmOrderLogistics = (userId: string, outTradeNo: string) => {
  return request<OrderItem>({
    method: 'PATCH' as any,
    url: `/order/completed/${outTradeNo}`,
    data: { userId },
  })
}

/**
 * 商品订单取消并退款
 * @param outTradeNo - 订单ID
 * @param amount - 订单金额信息
 */
export const proOrderCancelApi = (outTradeNo: string, actualPayment: number) => {
  return request<RefundResult>({
    method: 'Patch' as any,
    url: `/order/cancel/${outTradeNo}`,
    data: { actualPayment },
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
  openid: string,
  userId: string,
  userMobile: string,
  vipProId: string,
  vipLevel: number,
  vipLevelText: string,
  amount: number,
  discount: number,
  limit: number,
  maxUsers: number,
  term: string,
  remark: string,
) => {
  return request<WechatPayParams>({
    method: 'POST',
    url: '/vip-order/add',
    data: {
      openid,
      userId,
      userMobile,
      vipProId,
      vipLevel,
      vipLevelText,
      amount,
      discount,
      limit,
      maxUsers,
      term,
      remark,
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
    url: `/vip-order/user/${userId}`,
    data: { status },
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
  productId: number,
  productName: string,
  productCover: string,
  skuId: number,
  skuNo: string,
  originalPrice: string,
  actualPayment: string,
) => {
  return request<NativeResponse>({
    method: 'POST',
    url: '/store-service-order/add',
    data: {
      storeId,
      productId,
      productName,
      productCover,
      skuId,
      skuNo,
      originalPrice,
      actualPayment,
    },
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
  productId: number,
  productName: string,
  productCover: string,
  skuId: number,
  skuNo: string,
  originalPrice: string,
  actualPayment: string,
  memberPhone: string,
) => {
  return request<QuickOrderResult<freeOrderStatus>>({
    method: 'POST',
    url: '/store-service-order/freeAdd',
    data: {
      storeId,
      productId,
      productName,
      productCover,
      skuId,
      skuNo,
      originalPrice,
      actualPayment,
      memberPhone,
    },
  })
}

/**
 * 获取线下贴膜订单详情
 * @param outTradeNo - 订单号
 */
export const offlineOrderGetApi = (outTradeNo: string) => {
  return request<QuickOrderResult<freeOrderStatus>>({
    method: 'GET',
    url: `/store-service-order/detail/${outTradeNo}`,
  })
}

/**
 * 根据用户手机号码，检查是否是会员，是否还有免费次数
 * @param mobile - 会员手机号码
 */
export const checkVipApi = (mobile: string) => {
  return request<CheckVipResponse>({
    method: 'POST',
    url: '/store/checkMember',
    data: { mobile },
  })
}

/**
 * 线下贴膜会员免费订单服务完成
 * @param out_trade_no - 订单号
 */
export const completeGiftOrderApi = (outTradeNo: string) => {
  return request<QuickOrderGiftVipResult>({
    method: 'POST',
    url: '/quickSell/completeGiftOrderApi',
    data: { outTradeNo },
  })
}

/**
 * 取消线下贴膜的支付订单
 * @param outTradeNo - 订单号
 */
export const updateOfflineOrderApi = (outTradeNo: string, status: string) => {
  return request<updateResult>({
    method: 'PATCH' as any,
    url: `/store-service-order/update/${outTradeNo}`,
    data: { status },
  })
}
