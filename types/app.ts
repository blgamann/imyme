export type EvidenceCard = {
  id: string
  content: string
  date: string
}

// 특성 타입 정의
export type Trait = {
  id: string
  name: string
  evidences: EvidenceCard[]
}
