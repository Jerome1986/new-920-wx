/**
 * 门店库存列表项类型
 */
export interface StoreInventoryItem {
  /** 库存记录唯一ID */
  id: string
  /** 门店ID */
  storeId: string
  /** 商品分类ID */
  categoryId: number
  /** 商品SKU ID */
  skuId: number
  /** 可售库存数量 */
  stock: number
  /** 锁定库存数量（已下单未发货） */
  lockedStock: number
  /** 累计销售数量 */
  soldCount: number
  /** 成本价 */
  costPrice: string
  /** 销售价 */
  salePrice: string
  /** 库存状态：ACTIVE-正常 / INACTIVE-禁用 */
  status: 'ACTIVE' | 'INACTIVE'
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 商品名称 */
  productName: string
  /** 商品描述/备注 */
  productDec: string
  productId: number
  /** sku封面图 */
  cover: string
  /** 商品货号 */
  skuNo: string
  /** 最低库存预警值 */
  minStock: number
  /** 型号列表 */
  models: PhoneModels[]
}

export interface PhoneModels {
  id: number
  productId: number
  name: string
}

/**
 * 库存分页列表返回类型
 */
export interface StoreInventoryListResponse {
  /** 数据列表 */
  list: StoreInventoryItem[]
  /** 总条数 */
  total: number
  /** 当前页码 */
  pageNum: number
  /** 每页条数 */
  pageSize: number
  totalPage: number
}
