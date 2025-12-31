import { request } from '@/utils/http.ts'
import type {
  PurchaseAddResult,
  PurchaseItem,
  PurchaseOrderCancel,
  PurchasePageResult,
} from '@/types/Purchase'
import type { OrderAmount, OrderProductItem, OrderUserInfo } from '@/types/Order'

/**
 * 新增进货订单接口
 * @param storeId - 门店ID
 * @param userInfo  - 用户信息
 * @param products - 产品信息
 * @param totalCount - 总件数
 * @param amount - 订单金额信息
 * @param remark - 备注信息
 */
export const purchaseOrderAddApi = (
  storeId: string,
  userInfo: OrderUserInfo,
  products: OrderProductItem[],
  totalCount: number,
  amount: OrderAmount,
  remark: string,
) => {
  return request<PurchaseAddResult>({
    method: 'POST',
    url: '/purchasedOrder/add',
    data: { storeId, userInfo, products, totalCount, amount, remark },
  })
}

/**
 * 获取进货单
 * @param userId - 用户ID
 * @param status - 订单状态
 * @param pageNum - 页码
 * @param pageSize - 条数
 */
export const purchaseOrderGetApi = (
  userId: string,
  status: string,
  pageNum: number,
  pageSize: number,
) => {
  return request<PurchasePageResult>({
    method: 'GET',
    url: '/purchasedOrder/userId',
    data: { userId, status, pageNum, pageSize },
  })
}

/**
 * 取消进货单
 * @param out_trade_no - 订单号
 */
export const purchasedOrderCancelApi = (out_trade_no: string) => {
  return request<PurchaseOrderCancel>({
    method: 'POST',
    url: '/purchasedOrder/cancel',
    data: { out_trade_no },
  })
}

/**
 * 获取进货单详情
 * @param orderNo - 订单号
 */
export const purchaseOrderDetailApi = (orderNo: string) => {
  return request<PurchaseItem>({
    method: 'GET',
    url: '/purchasedOrder/detail',
    data: { orderNo },
  })
}
