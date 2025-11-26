// 分类类型
export type CateItem = {
  /** 唯一标识 */
  _id: string
  /** 分类名称 */
  name: string
  /** 父级ID */
  parentId?: string
  /** 分类层级 */
  level: number
  /** 排序 */
  sort?: number
  /** 创建时间 */
  createdAt?: Date
  /** 更新时间 */
  updatedAt?: Date
}
