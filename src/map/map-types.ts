export interface PlainPoint {
  x: number
  y: number
}

export interface PlainZone {
  id: string
  label: string
  points: PlainPoint[]
  custom?: boolean
}

export interface PlainTeam {
  key: string
  names: string[]
  zoneId: string | null
  tags: (string | null)[]
  topTag: string | null
}

export type HighlightIcon =
  | "none"
  | "crown"
  | "star"
  | "bolt"
  | "shield"
  | "flame"
  | "target"
  | "medal"

export interface PlainHighlight {
  id: string
  label: string
  color: string
  icon: HighlightIcon
  priority: number
}
