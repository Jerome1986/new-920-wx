import { request } from '@/utils/http.ts'
import type {
  LookNumItem,
  ProductItem,
  ProductPageResult,
  vipProItem,
} from '@/types/ProductItem.d.ts'

/**
 * 获取热门推荐的商品
 */
export const productsHotGetApi = (pageNum: number, pageSize: number) => {
  return request<ProductPageResult>({
    method: 'GET',
    url: '/product/hot',
    data: { pageNum, pageSize },
  })
}

/**
 * 根据分类名称获取产品列表
 * @param cateName - 分类名称
 */
export const productsListGetApi = (cateName: string) => {
  return request<ProductItem[]>({
    method: 'GET',
    url: '/product/get',
    data: { cateName },
  })
}

/**
 * 根据分类ID获取商品
 * @param cateId - 分类ID
 * @param pageNum - 页码
 * @param pageSize - 条数
 */
export const productListByCateIdGetApi = (cateId: string, pageNum: number, pageSize: number) => {
  return request<ProductPageResult>({
    method: 'GET',
    url: '/product/cateId',
    data: { cateId, pageNum, pageSize },
  })
}

/**
 * 根据子级分类ID获取产品
 * @param subCateId - 子级分类ID
 * @param pageNum - 页码
 * @param pageSize - 条数
 */
export const productListBySubCateIdGetApi = (
  subCateId: string,
  pageNum: number,
  pageSize: number,
) => {
  return request<ProductPageResult>({
    method: 'GET',
    url: '/product/sub',
    data: { subCateId, pageNum, pageSize },
  })
}

/**
 * 根据商品名称和货号来搜索商品 - 用户产品类型搜索
 * @param searchVal - 搜索内容
 * @param productType - 页面可见类型
 * @param pageNum - 页码
 * @param pageSize - 条数
 */
export const productListSearchGetApi = (
  searchVal: string,
  productType: 'user' | 'manager' | 'vip' | 'both',
  pageNum: number,
  pageSize: number,
) => {
  return request<ProductPageResult>({
    method: 'POST',
    url: '/product/search',
    data: { searchVal, productType, pageNum, pageSize },
  })
}

/**
 * 获取商品详情
 * @param productId - 对应商品ID
 */
export const productDetailGetApi = (productId: string) => {
  return request<ProductItem>({
    method: 'GET',
    url: '/product/detail',
    data: { productId },
  })
}

/**
 * 自动更新阅读量
 * @param {string} productId - 当前产品的id
 */

export const autoLookNumApi = (productId: string) => {
  return request<LookNumItem>({
    method: 'POST',
    url: '/product/lookNum',
    data: { productId },
  })
}

/**
 * 获取会员产品列表
 */
export const vipProductGetApi = () => {
  return request<vipProItem[]>({
    method: 'GET',
    url: '/product/vip',
  })
}
