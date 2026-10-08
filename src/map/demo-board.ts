import type { PlainHighlight, PlainTeam, PlainZone } from "./map-types"

function box(id: string, label: string, x: number, y: number, w = 0.08, h = 0.07): PlainZone {
  return {
    id,
    label,
    points: [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ],
  }
}

function team(
  key: string,
  names: string[],
  zoneId: string | null,
  tag: string | null = null,
): PlainTeam {
  return {
    key,
    names,
    zoneId,
    tags: names.map((_, index) => (index === 0 ? tag : null)),
    topTag: tag,
  }
}

export const demoZones: PlainZone[] = [
  box("pleasant", "Pleasant", 0.22, 0.28),
  box("retail", "Retail", 0.48, 0.42),
  box("tilted", "Tilted", 0.62, 0.56),
  box("salty", "Salty", 0.34, 0.64),
  box("lucky", "Lucky", 0.72, 0.3),
]

export const demoTeams: PlainTeam[] = [
  team("t0", ["pardal", "Fliks7.", "NhouLM10"], "pleasant", "gold"),
  team("t6", ["axo 19!", "rochan"], "pleasant"),
  team("t1", ["RodryGØD.", "golden", "7tzin"], "retail"),
  team("t2", ["Lynex bettifn", "Nicksreyn", "Ment0s"], "retail"),
  team("t3", ["LuLuzito", "7RX matibuca."], "tilted"),
  team("t4", ["vicoouk do bronx"], "salty"),
  team("t5", ["20COMER70CORRER!", "JAC-roblox"], null),
  team("t7", ["changozebolla", "yossh lee"], null),
]

export const demoHighlights: Record<string, PlainHighlight> = {
  gold: {
    id: "gold",
    label: "Qualificado",
    color: "#ffd700",
    icon: "crown",
    priority: 2,
  },
}

const soloZones: PlainZone[] = [
  box("north", "Norte", 0.58, 0.16),
  box("center", "Centro", 0.42, 0.44),
  box("east", "Leste", 0.7, 0.48),
  box("south", "Sul", 0.5, 0.68),
  box("west", "Oeste", 0.24, 0.52),
]

const soloTeams: PlainTeam[] = [
  team("t0", ["pardal"], "north", "gold"),
  team("t1", ["RodryGØD."], "north"),
  team("t2", ["7tzin"], "center"),
  team("t3", ["Lynex bettifn"], "center"),
  team("t4", ["Nicksreyn"], "east"),
  team("t5", ["LuLuzito"], "south"),
  team("t6", ["golden"], null),
  team("t7", ["vicoouk do bronx"], null),
]

export const demoBoards = {
  "fncs-trio-test": {
    zones: demoZones,
    teams: demoTeams,
    highlights: demoHighlights,
    viewerKey: "t0",
    closesAt: "2026-11-05T14:51:00.000Z",
  },
  "fncs-solo-finals1": {
    zones: soloZones,
    teams: soloTeams,
    highlights: demoHighlights,
    viewerKey: "t0",
    closesAt: "2026-10-24T02:39:00.000Z",
  },
}

export function demoBoard(slug: string) {
  return demoBoards[slug as keyof typeof demoBoards] ?? demoBoards["fncs-solo-finals1"]
}
