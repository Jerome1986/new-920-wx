import { request } from '@/utils/http.ts'
import type { TeamItem } from '@/types/TeamItem'

/**
 * 获取团队信息
 */
export const teamListGetApi = () => {
  return request<TeamItem[]>({
    method: 'GET',
    url: '/team-show',
  })
}
