// 通用更新类型
export type updateResult = {
  /** 匹配到多少文档 */
  matchedCount: number
  /** 实际修改多少文档 */
  modifiedCount: number
}

/**
 * 通用删除类型
 */
export type delResult = {
  acknowledged: boolean
}

/**
 * 通用新增类型
 */

export type addResult = {
  /** 新增项对应的id */
  insertedId: string
}

// 微信收货组件返回类型
export interface BusinessSuccessResponse {
  errCode: number
  errMsg: string
  extraData: {
    req_extradata: {
      merchant_id: string
      merchant_trade_no: string
      transaction_id: string
    }
    status: string
  }
}
