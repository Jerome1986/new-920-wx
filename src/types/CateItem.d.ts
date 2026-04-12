// 分类类型
export type CateItem = {
  /** 唯一标识 */
  id: number
  /** 分类名称 */
  name: string
  /** 父级ID */
  parentId?: number
  /** 分类层级 */
  level: number
  /** 子级 */
  children?: CateItem[]
  /** 排序 */
  sort?: number
  /** 创建时间 */
  createdAt?: Date
  /** 更新时间 */
  updatedAt?: Date
}

// 分页类型
export interface CatePageResult {
  list: CateItem[]
  total: number
  pageNum: number
  pageSize: number
  totalPage: number
}
