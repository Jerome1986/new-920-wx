// 招聘申请审核状态枚举
enum ReviewStatus {
  PENDING = 'PENDING', // 审核中
  APPROVED = 'APPROVED', // 已通过
  REJECTED = 'REJECTED', // 已拒绝
}

// 申请表类型
export type ApplyType = 'JOB' | 'BUSINESS'

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
  type: ApplyType
}
