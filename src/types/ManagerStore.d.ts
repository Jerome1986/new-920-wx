import type { CommonStatus, UserInfo } from '@/types/User'
import type { StockModel } from './stockModel'

// 新增门店表单类型
export interface StoreCreateForm {
  /** 门店名称 */
  name: string
  /** 门店地址 */
  address: string
  /** 门店联系电话 */
  phone: string
  /** 管理员用户ID */
  managerId: string
  /** 管理员姓名 */
  managerName: string
  /** 库存模板ID */
  inventoryTemplateId: string | number
}

// 门店列表类型
export interface StoreList {
  id: string
  /** 门店名称 */
  name: string
  /** 门店地址 */
  address: string
  /** 管理员姓名 */
  managerName: string
  /** 门店联系电话 */
  phone: string
  /** 当前门店下的所有会员 */
  users: UserInfo[]
  /** 当前门店店长信息 */
  manager: UserInfo
  /** 门店钱包 */
  wallet: Wallet
  /** 创建时间 */
  createdAt: Date
}

// 门店详情
export interface StoreDetail {
  id: string
  name: string
  logo: string | null
  address: string
  phone: string
  qrCodeUrl: string | null
  managerId: string
  managerName: string | null
  manager: UserInfo
  parentStoreId: string | null
  status: CommonStatus
  inventoryTemplateId: number | null
  inventory: StoreInventoryItem[] | null
  inventoryModel: InventroyModel
  /** 门店钱包 */
  wallet: Wallet
  createdAt: string
  updatedAt: string
}

// 库存模版
export interface InventroyModel {
  id: number
  name: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: Date
  updatedAt: Date
}

// 门店钱包
export interface Wallet {
  balance: string
  availableBalance: string
  frozenBalance: string
}

/** 流水方向：收入 / 支出 */
export type StoreTransactionType = 'INCOME' | 'EXPENSE'

/** 业务类型（与后端约定扩展） */
export type StoreBizType = string

// 门店流水/业务记录
export interface StoreTransaction {
  /**id*/
  id: number
  /**门店ID*/
  storeId: string
  /**操作人*/
  operatorId?: string | null
  /**消费者ID*/
  consumerId?: string | null
  /**类型*/
  type: StoreTransactionType
  /**业务类型*/
  bizType: StoreBizType
  /**金额*/
  amount: number | string
  /**关联订单ID*/
  relatedOrderId?: string | null
  /**关联业务ID*/
  relatedBizId?: string | null
  /**备注*/
  remark?: string | null
  /**创建时间*/
  createdAt: Date | string
}

export interface StoreTransactionPageResult {
  list: StoreTransaction[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}

export type TimeRangePreset = 'today' | 'month' | 'year'

export type StoreTransactionFilterType = 'ALL' | 'INCOME' | 'EXPENSE'
