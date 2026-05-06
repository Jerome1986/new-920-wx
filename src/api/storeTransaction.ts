import type {
  StoreDashboardVO,
  StoreTransactionFilterType,
  StoreTransactionPageResult,
  TimeRangePreset,
} from '@/types/ManagerStore'
import { request } from '@/utils/http'

/**
 * 门店业务流水
 * @param storeId
 * @param filterType
 * @param timeRangePreset
 * @param pageNum
 * @param pageSize
 */
export const storeTransactionGetApi = (
  storeId: string,
  filterType: StoreTransactionFilterType,
  timeRangePreset: TimeRangePreset,
  pageNum: number,
  pageSize: number,
) => {
  return request<StoreTransactionPageResult>({
    method: 'GET',
    url: `/storeTransaction/${storeId}`,
    data: { filterType, timeRangePreset, pageNum, pageSize },
  })
}

/**
 * 门店经营概览
 * @param storeId ]
 * @param userId
 * @param timeRangePreset
 */
export const storeDashboardApi = (
  storeId: string,
  userId: string,
  timeRangePreset: TimeRangePreset,
) => {
  return request<StoreDashboardVO>({
    method: 'GET',
    url: `/store/dashboard/${storeId}`,
    data: { userId, timeRangePreset },
  })
}
