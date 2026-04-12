/** C 端列表接口返回的型号子项 */
export interface ProductModelRef {
  id?: number
  productId?: number
  name: string
}

/** C 端列表接口返回的详情图子项 */
export interface ProductImageRef {
  id?: number
  productId?: number
  url: string
}

user / manager / vip / both
export type ProductItem = {
  /** 商品主键，MySQL自增ID */
  id: number
  /** C 端一级分类 id */
  categoryId: number
  categoryName: string
  cover: string
  dec: string
  hot: 'ENABLE' | 'DISABLE'
  lookNum: number
  name: string
  skuNo: string
  target: 'TOC' | 'TOB'
  status: 'ACTIVE' | 'INACTIVE'
  type: 'USER' | 'MANAGER' | 'VIP' | 'BOTH'
  createdAt: Date
  updatedAt: Date

  images: ProductImageRef[]
  models: ProductModelRef[]
  skus: SkuItem[]
}

/** 前端对应的商品SKU类型 */
export interface SkuItem {
  /** sku标识 */
  id: number
  /** 成本价格 */
  costPrice: string
  /** 售价 */
  salePrice: string
  /** 库存 */
  stock: number
  /** 封面图 */
  image: string
  /** 规格映射 */
  attrs: {
    /** 规格名称  如：颜色、规格、尺寸等*/
    label: string
    /** 具体数值 */
    value: string
  }
  /** 对应的产品ID */
  productId: number
  /** 最小限定库存 */
  minStock: number
  /** 库存规格（个、片等），表单与校验使用 snake_case，与后端 unitCount 对应 */
  unit?: string
}

export interface ProductPageResult {
  list: ProductItem[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

/**
 * lookNum阅读量更新返回类型
 */

export type LookNumItem = {
  /** 更新后的阅读量 */
  lookNum: number
}

// 会员产品类型
export interface vipProItem {
  /** 唯一标识 */
  id: string
  /** 对应的会员等级 */
  level: number
  /** 对应等级的会员名称 */
  levelText: string
  /** 办理价格 */
  price: number
  /** 可享受的购物折扣 */
  discount: number
  /** 有效期 */
  term: string
  /** 会员权益说明 */
  rights: string
  /** 启用状态 */
  status: 'ACTIVE' | 'INACTIVE'
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 返现比例 */
  cashbackRate: number
  /** 可共享使用人数上限 */
  maxUsers: number
  /** 每月免费次数 */
  limit: number
}
