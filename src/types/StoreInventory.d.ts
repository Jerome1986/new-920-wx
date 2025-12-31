// 获取门店数据返回的类型(返回给前端展示的数据类型)
export interface StoreInventoryGetResult {
  /** 产品ID */
  product_id: string
  /** 商品名 */
  productName: string
  /** 商品封面图 */
  productCover: string
  /** 货号 */
  productSkuNo: string
  /** 零售价 */
  currentPrice: number
  /** 根据基础单位换算的数量：如单位为片，默认1盒5片，那么 2盒就是 10 片 */
  unit_count: number
}
