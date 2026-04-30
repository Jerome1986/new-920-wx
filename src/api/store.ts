import { request } from '@/utils/http.ts'
import type { StoreInventoryItem, StoreInventoryListResponse } from '@/types/StoreInventory'
import type { StoreDetail } from '@/types/ManagerStore'
import type { CommissionRecordPage } from '@/types/CommissionRecord'
import type { StoreMemberPage } from '@/types/StoreMember'

/**
 * 根据门店ID 和 子分类ID 获取门店的库存列表
 * @param storeId - 门店ID
 * @param categoryId - 分类ID
 */
export const storeGetInventoryApi = (
  storeId: string,
  categoryId?: number,
  pageNum?: number,
  pageSize?: number,
) => {
  return request<StoreInventoryListResponse>({
    method: 'GET',
    url: `/store-inventory/sell/${storeId}`,
    data: { categoryId, pageNum, pageSize },
  })
}

/**
 * 搜索库存列表的商品
 * @param storeId
 * @param keyword
 * @param categoryId
 */
export const searchInventoryApi = (storeId: string, keyword: string, categoryId: number) => {
  return request<StoreInventoryItem[]>({
    method: 'POST',
    url: '/store-inventory/sell/search',
    data: { storeId, keyword, categoryId },
  })
}

/**
 * 根据当前用户信息获取门店信息
 * @param userId - 当前用户ID
 */
export const managerStoreInfoGetApi = (storeId: string, userId: string) => {
  return request<StoreDetail>({
    method: 'GET',
    url: `/store/manager/${storeId}`,
    data: { userId },
  })
}

/**
 * 获取门店总营收
 * @param storeId - 门店ID
 */
export const storeTotalReportApi = (storeId: string) => {
  return request({
    method: 'GET',
    url: '/store/report',
    data: { storeId },
  })
}

/**
 * 根据时间获取门店营收
 * @param storeId - 门店ID
 * @param type - 本日，本周，本月
 * @param year - 年份
 * @param month - 月份
 */
export const getTimeRangeReportApi = (
  storeId: string,
  type: string,
  year?: number,
  month?: number,
) => {
  return request({
    method: 'POST',
    url: '/store/getTimeRange',
    data: { storeId, type, year, month },
  })
}

/**
 * 获取门店佣金流水
 * @param userId
 */
export const findStoreCommissionRecord = (userId: string, pageNum: number, pageSize: number) => {
  return request<CommissionRecordPage>({
    method: 'GET',
    url: `/commission-rule/detail/${userId}`,
    data: { pageNum, pageSize },
  })
}

/**
 * 获取门店会员
 * @param inviterId
 */
export const findStoreVipApi = (inviterId: string, pageNum: number, pageSize: number) => {
  return request<StoreMemberPage>({
    method: 'GET',
    url: `/store/vip/${inviterId}`,
    data: { pageNum, pageSize },
  })
}
