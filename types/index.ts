import type {
  Item,
  Organization,
  Commitment,
  Stakeholder,
  Tag,
} from '@/lib/generated/prisma/client'

export type ItemWithOrg = Item & {
  organization: Organization
  tags: Array<{ tag: Tag }>
  commitments: Commitment[]
}

export type CommitmentWithStakeholder = Commitment & {
  stakeholder: Stakeholder & { organization: Organization }
  item: Item | null
}

export type OrgWithCounts = Organization & {
  _count: {
    items: number
    stakeholders: number
    meetings: number
  }
}

export type NarrateResult = {
  decisions: Array<{ text: string }>
  commitments: Array<{
    person: string
    action: string
    deadline: string
    risk: 'low' | 'medium' | 'high'
    direction: 'outbound' | 'inbound'
  }>
  risks: Array<{ text: string; severity: 'low' | 'medium' | 'high' }>
  actions: Array<{ person: string; task: string; priority: 'low' | 'medium' | 'high' }>
}

export type FocusItem = {
  id: string
  reason: string
  item: ItemWithOrg
}
