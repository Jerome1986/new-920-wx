import { request } from '@/utils/http.ts'
import type { StoreInventoryItem, StoreInventoryListResponse } from '@/types/StoreInventory'
import type { StoreInfo, StoreTotalReport } from '@/types/ManagerStore'

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
  return request<StoreInfo>({
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
  return request<StoreTotalReport>({
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
  return request<StoreTotalReport>({
    method: 'POST',
    url: '/store/getTimeRange',
    data: { storeId, type, year, month },
  })
}
