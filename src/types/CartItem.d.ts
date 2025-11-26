import type { SkuItem } from '@/types/ProductItem.d.ts'

/** 购物车项数据类型 */
export interface CartItem {
  /** 购物车项ID */
  _id: string
  /** 是否选中 */
  selected: boolean
  /** 商品ID */
  productId: string
  /** 商品货号 */
  skuNo: string
  /** 商品名称 */
  name: string
  /** 商品描述 */
  dec: string
  /** 商品封面图（如果选择了SKU，则为SKU图片） */
  cover: string
  /** 原价 */
  originalPrice: number
  /** 当前价格（SKU价格或商品价格） */
  currentPrice: number
  /** 购买数量 */
  quantity: number
  /** 选中的SKU信息（如果有） */
  sku?: SkuItem
  /** 商品类型--设置某些角色可见，区分店长产品和用户产品 */
  type?: 'user' | 'manager' | 'vip' | 'both'
}

/** 购物车响应数据类型 */
export interface CartResponse {
  /** 购物车列表 */
  list: CartItem[]
  /** 总数 */
  total: number
}
