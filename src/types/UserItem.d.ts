/**
 * 用户数据类型
 */
export type UserItem = {
  /** 唯一标识 */
  _id: string
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
  /** 注册时间 */
  registerTime: string
  /** 账号状态 - active激活 inactive未激活 */
  status: string
  /** 邀请码 */
  referralCode: string
  /** 上级的邀请码 */
  inviterCode: string
  /** 上上级邀请码 */
  inviter2Code: string
  /** vip可绑定的人数，默认为1 */
  vipMaxUsers: number
  /**  会员等级： 1:基础会员, 2:高级会员, 3:至尊会员 */
  vipLevel: number
  /** 会员注册时间 */
  vipStartTime: string
  /** 会员到期时间 */
  vipEndTime: string
  /** 会员权益： ['折扣9折', '免费配送'] */
  vipGift: number
  /** 会员折扣 */
  vipDiscount: number
  /** 邀请码图片链接 */
  myCodeUrl: string
  /** 平台积分 */
  score: number
  /** 店长运营资金（展示用，字段归属类型UserItem） */
  operating_balance?: number
  /** 店长待结算余额 （展示用，字段归属类型UserItem）*/
  settle_balance?: number
}

// 收货地址信息
export interface AddressInfo {
  userName: string
  telNumber: string
  provinceName: string
  cityName: string
  countyName: string
  detailInfo: string
  postalCode?: string
  nationalCode?: string
}

// 根据邀请码查询上上级返回类型
export interface inviter2CodeResult {
  /** 上级的邀请码 */
  inviterCode: string
  /** 上上级的邀请码 */
  inviter2Code: string
}

// 下级用户列表类型
export interface referralsUserList {
  firstUsers: UserItem[]
  secondUsers: UserItem[]
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
