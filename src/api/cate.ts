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

/**
 * 获取手机膜单项分类的子级分类，用于快速下单、快速找膜、快速售卖等功能
 */
export const cateMoGetApi = () => {
  return request<CateItem[]>({
    method: 'GET',
    url: '/cate/mo',
  })
}

/**
 * 根据手机膜分类下的二级分类ID，请求三级分类
 * @param parentId
 */
export const subCategoryGetApi = (parentId: string = 'ALL') => {
  return request<CateItem[]>({
    method: 'POST',
    url: '/cate/getSubCategories',
    data: { parentId },
  })
}

/**
 * C端分类获取
 * @param level - 分类层级
 * @param parentId - 父级ID
 */
export const cateListTocGetApi = (level: number, parentId: string = '') => {
  return request<CateItem[]>({
    method: 'GET',
    url: '/cate/tocGet',
    data: { level, parentId },
  })
}
