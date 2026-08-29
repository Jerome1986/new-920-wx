import { request } from '@/utils/http.ts'
import type {
  AgentInviteLandingResult,
  ClaimAgentInviteRequest,
  ClaimAgentInviteResult,
  MyAgentInviteBenefitResult,
} from '@/types/AgentInvite'

// 查询代理邀请领取状态
export const getAgentInviteLandingApi = (agentCode: string, userId: string) => {
  return request<AgentInviteLandingResult>({
    method: 'GET',
    url: `/agent-invites/${encodeURIComponent(agentCode)}/landing`,
    data: { userId },
  })
}

// 确认领取代理邀请权益
export const claimAgentInviteApi = (data: ClaimAgentInviteRequest) => {
  return request<ClaimAgentInviteResult>({
    method: 'POST',
    url: '/agent-invites/claims',
    data,
  })
}

// 查询当前用户的代理邀请免费贴膜权益
export const getMyAgentInviteBenefitApi = (userId: string) => {
  return request<MyAgentInviteBenefitResult>({
    method: 'GET',
    url: '/agent-invites/claims/me',
    data: { userId },
  })
}
