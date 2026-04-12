// 门店信息
export interface StoreInfo {
  /** 门店唯一ID */
  id: string
  /** 门店名称 */
  name: string
  /** 门店地址 */
  address: string
  /** 门店负责人ID */
  managerId: string
  /** 门店负责人名称 */
  managerName: string
  /** 门店联系电话 */
  phone: string
  /** 门店编码（可空） */
  storeCode: string | null
  /** 上级门店ID（总店/分店结构，可空） */
  parentStoreId: string | null
  /** 库存模板ID */
  inventoryTemplateId: number
  /** 门店LOGO地址（可空） */
  logo: string | null
  /** 门店二维码地址（可空） */
  qrCodeUrl: string | null
  /** 门店状态：ACTIVE-正常营业 | INACTIVE-停业/禁用 */
  status: 'ACTIVE' | 'INACTIVE'
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
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
