import { request } from '@/utils/http.ts'
import type { StoreInventoryGetResult } from '@/types/StoreInventory'
import type { StoreInfo, StoreTotalReport } from '@/types/ManagerStore'

/**
 * 根据门店ID获取门店的库存列表
 * @param storeId - 门店ID
 */
export const storeGetInventoryApi = (storeId: string) => {
  return request<StoreInventoryGetResult[]>({
    method: 'GET',
    url: '/store/getInventory',
    data: { storeId },
  })
}

/**
 * 根据当前用户信息获取门店信息
 * @param userId - 当前用户ID
 */
export const managerStoreInfoGetApi = (userId: string) => {
  return request<StoreInfo>({
    method: 'GET',
    url: '/store/info',
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
