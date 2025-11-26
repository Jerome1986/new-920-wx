/**
 * 表单申请-招聘和合作共用类型
 */
export type FormItem = {
  /** 用户id */
  userId: string
  /** 名字 */
  name: string
  /** 手机号码 */
  mobile: string
  /** 身份证正面 */
  icCardFont: string
  /** 身份证反面 */
  icCardBack: string
  /** 营业执照 */
  business?: string
}

/**
 * 员工应聘返回类型
 */
export type HireItem = {
  /** 招聘列表唯一id */
  _id: string
  /** 用户id */
  userId: string
  /** 名字 */
  name: string
  /** 手机号码 */
  mobile: string
  /** 身份证正面 */
  icCardFont: string
  /** 身份证反面 */
  icCardBack: string
  /** 审核状态：审核中  已通过  已拒绝 */
  reviewStatus: string
  /** 申请时间 */
  creatAt: string
}

/**
 * 合作申请返回类型
 */

export type cooperateItem = {
  /** 合作申请唯一id */
  _id: string
  /** 用户id */
  userId: string
  /** 名字 */
  name: string
  /** 手机号码 */
  mobile: string
  /** 身份证正面 */
  icCardFont: string
  /** 身份证反面 */
  icCardBack: string
  /** 营业执照 */
  business: string
  /** 审核状态：审核中  已通过  已拒绝 */
  reviewStatus: string
  /** 申请时间 */
  creatAt: string
}
