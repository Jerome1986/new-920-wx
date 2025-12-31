import { request } from '@/utils/http.ts'
import type { StoreInventoryGetResult } from '@/types/StoreInventory'
import type { StoreInfo } from '@/types/ManagerStore'

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
