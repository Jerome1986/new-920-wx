/**
 * 用户数据类型
 */
export type UserItem = {
  /** 唯一标识 */
  id: string
  /** 微信的用户标识id */
  openid?: string
  /** 用户昵称 */
  nickname: string
  /** 用户头像 */
  avatarUrl: string
  /** 用户手机号码 */
  mobile: string
  /** 性别 */
  gender: number
  /** 用户角色 - user普通用户 vip会员 manager店长 */
  role: string
  /** 用户归属-门店 */
  storeId?: string
  /** 注册时间 */
  createdAt?: string
  /** 账号状态 - active激活 inactive未激活 */
  status: string
  /** 邀请码 */
  referralCode: string
  /** 上级的邀请码 */
  inviterCode: string
  /** 上上级邀请码 */
  inviter2Code: string
  /** vip可绑定的人数，默认为1 */
  vipMaxUsers?: number
  /**  会员等级： 1:基础会员, 2:高级会员, 3:至尊会员 */
  vipLevel?: number
  /** 会员注册时间 */
  vipStartTime?: Date
  /** 会员到期时间 */
  vipEndTime?: Date
  /** 会员权益： ['折扣9折', '免费配送'] */
  vipGift?: number
  /** 会员折扣 */
  vipDiscount?: number
  /** 邀请码图片链接 */
  myCodeUrl: string
  /** 平台积分 */
  score: number
  /** 店长运营资金（展示用，字段归属类型UserItem） */
  operating_balance?: number
  /** 店长待结算余额 （展示用，字段归属类型UserItem）*/
  settle_balance?: number
  /** 冻结金额，当待结算金额进入结算状态，生成账单，待结算金额将进入冻结金额，禁止使用 */
  lockedAmount?: number
  /** 用户更新头像的次数，超过1天后会重置 */
  avatarUpdateCount?: number
  /** 更新头像的时间 */
  avatarUpdateAt?: Date
}

// 登录返回
export interface LoginResult {
  token: string
  user: UserItem
}

// 查询用户上级
export interface InviterResult extends UserItem {
  inviter: UserItem | null
}

// 查询用户下级返回
export interface childItems {
  id: string
  nickname: string
  avatarUrl: string
  mobile: string
  level: number
  createdAt: Date
}

// 收货地址信息
export interface AddressInfo {
  name: string
  mobile: string
  province: string
  city: string
  county: string
  postalCode: string
  nationalCode: string
  detail: string
}

/**
 * 个人将待结算余额转入运营资金
 */
export interface fundsSettlementResult {
  /** 用户ID */
  userId: string
  /** 运营资金 */
  operating_balance: number
  /** 待结算余额 */
  settle_balance: number
}
