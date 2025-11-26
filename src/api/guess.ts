import { request } from '@/utils/http.ts'
import type { GuessItem } from '@/types/GuessItem'

/**
 * 获取猜你想搜列表，每次随机抽取6组
 */
export const guessListGetApi = () => {
  return request<GuessItem[]>({
    method: 'GET',
    url: '/guess/get',
  })
}
