export interface AgentProfile {
  id: string
  agentCode: string
  agentCodeUrl: string
  status: string
  openedAt: string
}

export interface MyAgentProfileResult {
  isAgent: boolean
  canInvite: boolean
  profile: AgentProfile | null
}
