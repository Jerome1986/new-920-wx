// 商品类型
export type ProductItem = {
  /** 商品ID（MongoDB 自动生成的唯一标识） */
  _id?: string
  /** 所属分类ID */
  categoryId: string
  /** 商品货号 */
  skuNo: string
  /** 商品名称 */
  name: string
  /** 商品描述（简要说明） */
  dec: string
  /** 商品原价（未打折前价格，单位：元） */
  originalPrice: number
  /** 当前售价（促销/实际出售价格，单位：元） */
  currentPrice: number
  /** 商品最低价（聚合 SKU 后计算） */
  minPrice?: number
  /** 商品最高价（聚合 SKU 后计算） */
  maxPrice?: number
  /** 商品封面图 URL */
  cover: string
  /** 商品详情图片 URL 数组 */
  proImages: string[]
  /** 浏览量（用于排序和热度统计） */
  lookNum: number
  /** 商品状态
   *  'active'   表示上架中
   *  'inactive' 表示下架或暂不展示
   */
  status?: 'active' | 'inactive'
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 是否设置为热门推荐 */
  hot?: 'enable' | 'disable'
  /** 商品类型--设置某些角色可见，区分店长产品和用户产品 */
  type?: 'user' | 'manager' | 'vip' | 'both'
  /** 商品对应的SKU */
  sku?: SkuItem[]
}

export interface SkuItem {
  /** sku标识 */
  _id: string
  /** sku编码 */
  skuCode: string
  /** 价格 */
  price: number
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
  goodsId: string
  /** 创建时间 */
  createdAt?: Date
  /** 更新时间 */
  updatedAt?: Date
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
  _id: string
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
  status: 'enable' | 'disable'
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
