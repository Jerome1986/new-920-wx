// 门店信息
export interface StoreInfo {
  /** 唯一标识ID */
  _id: string
  /** 门店ID */
  storeId: string
  /** 门店名称 */
  storeName: string
  /** 门店地址 */
  address: string
  /** 门店LOGO */
  storeLogo: string
  /** 店长ID--对应用户ID */
  managerId: string
  /** 店长名字 */
  managerName: string
  /** 上级门店ID--对应当前店长上级的ID */
  parentStoreId: string
  /** 上级门店的上级ID */
  parentStoreId2: string
  /** 店长的手机号码 */
  phone: string
  /** 门店收款码 */
  qrCodeUrl: string
  /** 门店激活状态，是否运营中 */
  status: 'active' | 'inactive'
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 是否匹配了新手库存套餐 */
  inventory_config: boolean
}

// 门店汇总报告数据类型
export interface StoreTotalReport {
  /** 线下贴膜总收益 */
  totalRevenue: number
  /** 线下贴膜总服务次数 */
  totalServices: number
  /** 门店所有佣金总和 */
  totalCommission: number
  /** 合计总收入 */
  total: number
}
