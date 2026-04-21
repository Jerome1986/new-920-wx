/** 佣金明细列表项（与后端 record + user 组装一致） */
export interface CommissionRecordItem {
  id: number
  /** 下级用户头像 */
  subordinateAvatar?: string | null
  subordinateMobile?: string | null
  subordinateRole: string
  bizLabel: StoreBizType
  amount: number | string
  createdAt: Date
}

/// 业务类型
export type StoreBizType = 'PRODUCT' | 'SERVICE' | 'PURCHASE'

export interface CommissionRecordPage {
  list: CommissionRecordItem[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}
