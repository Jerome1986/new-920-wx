import { request } from '@/utils/http.ts'
import type { BannerItem } from '@/types/BannerItem.d.ts'

/**
 * 获取轮播图列表
 */
export const bannerListGetApi = () => {
  return request<BannerItem[]>({
    method: 'GET',
    url: '/banner/get',
  })
}
