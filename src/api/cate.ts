import { request } from '@/utils/http.ts'
import type { CateItem } from '@/types/CateItem'

/**
 * 分类获取
 * @param level - 分类层级
 * @param parentId - 父级分类ID
 */
export const cateListGetApi = (level: number, parentId: string = '') => {
  return request<CateItem[]>({
    method: 'GET',
    url: '/cate/get',
    data: { level, parentId },
  })
}
