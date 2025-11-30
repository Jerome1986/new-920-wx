import { request } from '@/utils/http.ts'
import type { RateRulesItem } from '@/types/RateRuleItem'

/**
 * 获取积分规则
 */
export const rateRuleListGet = () => {
  return request<RateRulesItem[]>({
    method: 'GET',
    url: '/rate/get',
  })
}
