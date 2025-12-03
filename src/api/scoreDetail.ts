import { request } from '@/utils/http.ts'
import type { ScoreDetailsPage } from '@/types/ScoreDetails'

/**
 * 获取当前用户积分明细
 * @param userId - 用户ID
 * @param tag - 前端标签，对应类型为 ALL-全部，INCOME-收入  EXPENSE-支出
 * @param pageNum - 页码
 * @param pageSize - 条数
 */
export const scoreListGetApi = (userId: string, tag: string, pageNum: number, pageSize: number) => {
  return request<ScoreDetailsPage>({
    method: 'GET',
    url: '/score/get',
    data: { userId, tag, pageNum, pageSize },
  })
}
