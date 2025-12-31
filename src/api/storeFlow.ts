import { request } from '@/utils/http.ts'
import type { StoreFlowPageResult } from '@/types/FinanceRecords'

/**
 * 根据门店ID获取当前门店流水明细
 * @param userId - 门店ID
 * @param direction - 类型：IN 收入  OUT 支出
 * @param pageNum - 页码
 * @param pageSize - 条数
 */
export const storeFlowGetApi = (
  userId: string,
  direction: 'IN' | 'OUT' | 'ALL',
  pageNum: number,
  pageSize: number,
) => {
  return request<StoreFlowPageResult>({
    method: 'GET',
    url: '/storeFlow/get',
    data: { userId, direction, pageNum, pageSize },
  })
}
