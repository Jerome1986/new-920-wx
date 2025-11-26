import { request } from '@/utils/http.ts'
import type { OrderAmount, OrderProductItem, OrderUserInfo } from '@/types/Order'
import type { AddressInfo } from '@/types/UserItem'
import type { WechatPayParams } from '@/types/WechatPay'
import type { updateResult } from '@/types/Gobal'

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
