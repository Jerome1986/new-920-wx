import { request } from '@/utils/http.ts'
import type { MyAgentProfileResult } from '@/types/AgentProfile'

// 查询当前用户的代理身份
export const getMyAgentProfileApi = (userId: string) => {
  return request<MyAgentProfileResult>({
    method: 'GET',
    url: `/agent-profile/me/${encodeURIComponent(userId)}`,
  })
}
