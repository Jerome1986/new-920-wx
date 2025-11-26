// 团队风采数据类型
export interface TeamItem {
  /** 唯一标识 */
  _id?: string
  /** 标题 */
  name: string
  /** 图片 */
  image: string
  /** 激活状态-- 决定是否在前端展示 */
  status: 'active' | 'inactive'
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
}
