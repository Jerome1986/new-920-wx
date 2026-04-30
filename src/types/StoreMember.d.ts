/** 门店会员列表项 */
export interface StoreMemberItem {
  id: string
  /** 头像 */
  avatarUrl?: string
  /** 手机号（数据为完整号码，列表展示脱敏） */
  mobile: string
  /** 昵称 */
  nickname: string
  /** 总消费次数 */
  totalOrderCount: number
  /** 会员到期时间（时间戳毫秒或 ISO 字符串；无则非会员/无期限由前端展示「—」） */
  vipEndTime?: number | string | null
}

export interface StoreMemberPage {
  list: StoreMemberItem[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}
