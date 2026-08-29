export type AgentInviteClaimStatus =
  | 'CLAIMABLE'
  | 'CLAIMED_AVAILABLE'
  | 'CLAIMED_USED'
  | 'CLAIMED_EXPIRED'
  | 'SELF_INVITE'
  | 'AGENT_UNAVAILABLE'

export type AgentInviteBenefitStatus = 'AVAILABLE' | 'USED' | 'EXPIRED'

export interface AgentInviteClaimInfo {
  claimId: string
  claimedAt: string
  expiresAt: string
  benefitStatus: AgentInviteBenefitStatus
}

export interface AgentInviteLandingResult {
  agentCode: string
  claimStatus: AgentInviteClaimStatus
  rewardCount: 1
  validityDays: 30
  claim: AgentInviteClaimInfo | null
}

export interface ClaimAgentInviteRequest {
  agentCode: string
  userId: string
}

export interface ClaimAgentInviteResult extends AgentInviteClaimInfo {
  result: 'GRANTED' | 'ALREADY_CLAIMED'
  agentCode: string
  rewardCount: 1
}

export interface MyAgentInviteBenefit {
  claimId: string
  agentCode: string
  status: AgentInviteBenefitStatus
  availableCount: 0 | 1
  claimedAt: string
  expiresAt: string
  usedAt: string | null
}

export type MyAgentInviteBenefitResult = MyAgentInviteBenefit | null
