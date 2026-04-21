import type {
  StoreTransactionFilterType,
  StoreTransactionPageResult,
  TimeRangePreset,
} from '@/types/ManagerStore'
import { request } from '@/utils/http'

/**
 * 获取门店业务流水
 * @param storeId
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
