import { MongoClient, type ObjectId } from "mongodb"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const env = loadEnv("development", root, "")

type Point = { x: number; y: number }
type Zone = { id: string; label: string; points: Point[] }
type WindowDoc = { id: string; label: string; startsAt: Date | string | null; zones: Zone[] }
type Member = { discordId: string; epicName: string }

type TournamentDoc = {
  _id: ObjectId
  slug: string
  name: string
  poster: string | null
  mapImage: string | null
  mode: string
  teamSize: string
  region: string
  start: Date | string | null
  status: "upcoming" | "live" | "completed"
  published: boolean
  requiredRoleIds?: string[]
  accessTeams?: string[][]
  accessIds?: string[]
  accessTeamIds?: string[][]
  windows?: WindowDoc[]
}

const TEAM_SIZE: Record<string, string> = {
  solo: "Solo",
  duo: "Dúo",
  trio: "Trio",
  squad: "Squad",
}

let clientPromise: Promise<MongoClient> | null = null

function read(name: string) {
  const value = process.env[name]?.trim() || env[name]?.trim() || ""
  return value
}

function uri() {
  const value = read("MONGODB_URI")
  if (!value || /[<>]/.test(value) || !value.startsWith("mongodb")) return null
  return value
}

async function db() {
  const connection = uri()
  if (!connection) return null
  if (!clientPromise) {
    clientPromise = new MongoClient(connection, {
      maxPoolSize: 5,
      maxIdleTimeMS: 30_000,
      readPreference: "primary",
    }).connect()
  }
  const client = await clientPromise
  return client.db(read("MONGODB_DB") || "majorscrims")
}

function iso(value: Date | string | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function points(zone: { points?: Point[] }): Point[] {
  return (zone.points ?? [])
    .filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
    .map((point) => ({ x: point.x, y: point.y }))
}

async function rosterOf(database: NonNullable<Awaited<ReturnType<typeof db>>>, tournament: TournamentDoc) {
  const entries: { key: string; names: string[]; memberIds: string[] }[] = []
  ;(tournament.accessTeams ?? []).forEach((names, index) => {
    if (names?.length) {
      entries.push({
        key: `t${index}`,
        names,
        memberIds: tournament.accessTeamIds?.[index] ?? [],
      })
    }
  })

  const roles = tournament.requiredRoleIds ?? []
  if (roles.length === 0) return entries

  const players = await database
    .collection<{ _id: ObjectId; discordId: string; epicName: string }>("players")
    .find(
      {
        verified: true,
        roles: { $in: roles },
        discordId: { $nin: tournament.accessIds ?? [] },
      },
      { projection: { discordId: 1, epicName: 1, epicNameLower: 1 } },
    )
    .sort({ epicNameLower: 1 })
    .limit(1500)
    .toArray()

  for (const player of players) {
    entries.push({
      key: `p${player._id.toHexString()}`,
      names: [player.epicName],
      memberIds: [player.discordId],
    })
  }
  return entries
}

async function windowBoard(
  database: NonNullable<Awaited<ReturnType<typeof db>>>,
  tournament: TournamentDoc,
  window: WindowDoc,
  entries: { key: string; names: string[]; memberIds: string[] }[],
) {
  const tournamentId = tournament._id.toHexString()
  const [claims, customZones] = await Promise.all([
    database
      .collection<{ zoneId: string; members: Member[] }>("claims")
      .find({ tournamentId, windowId: window.id }, { projection: { zoneId: 1, members: 1 } })
      .toArray(),
    database
      .collection<{ zoneId: string; label: string; points: Point[] }>("custom_zones")
      .find({ tournamentId, windowId: window.id }, { projection: { zoneId: 1, label: 1, points: 1 } })
      .toArray(),
  ])

  const claimed = new Set(claims.map((claim) => claim.zoneId))
  const zones = [
    ...(window.zones ?? []).map((zone) => ({
      id: zone.id,
      label: zone.label,
      points: points(zone),
    })),
    ...customZones
      .filter((zone) => claimed.has(zone.zoneId))
      .map((zone) => ({
        id: zone.zoneId,
        label: zone.label,
        points: points(zone),
        custom: true,
      })),
  ]
  const zoneIds = new Set(zones.map((zone) => zone.id))
  const zoneByMember = new Map<string, string>()
  for (const claim of claims) {
    if (!zoneIds.has(claim.zoneId)) continue
    for (const member of claim.members ?? []) zoneByMember.set(member.discordId, claim.zoneId)
  }

  const teams = entries
    .map((entry, order) => {
      const zoneId = entry.memberIds.map((id) => zoneByMember.get(id)).find(Boolean) ?? null
      return {
        order,
        team: {
          key: entry.key,
          names: entry.names,
          zoneId,
          tags: entry.names.map(() => null),
          topTag: null,
        },
      }
    })
    .sort((a, b) => Number(Boolean(b.team.zoneId)) - Number(Boolean(a.team.zoneId)) || a.order - b.order)
    .map(({ team }) => team)

  const closesAt = iso(window.startsAt) ?? iso(tournament.start)
  return {
    id: window.id,
    label: window.label,
    closesAt,
    closed: Boolean(closesAt && Date.now() >= Date.parse(closesAt)),
    zones,
    teams,
  }
}

function summary(
  tournament: TournamentDoc,
  marked: number,
  roster: number,
) {
  return {
    slug: tournament.slug,
    title: tournament.name,
    status: tournament.status,
    mode: tournament.mode,
    teamSize: TEAM_SIZE[tournament.teamSize] ?? tournament.teamSize,
    region: tournament.region,
    image: tournament.poster ?? "",
    start: iso(tournament.start),
    marked,
    roster,
    source: "database" as const,
  }
}

export async function handle(url: string): Promise<{ status: number; body: unknown }> {
  const database = await db()
  if (!database) return { status: 200, body: { source: "unconfigured", tournaments: [] } }

  if (url === "/api/tournaments") {
    const tournaments = await database
      .collection<TournamentDoc>("tournaments")
      .find({ published: true })
      .sort({ start: -1 })
      .limit(50)
      .toArray()

    const cards = []
    for (const tournament of tournaments) {
      const entries = await rosterOf(database, tournament)
      const window = tournament.windows?.[0]
      const board = window ? await windowBoard(database, tournament, window, entries) : null
      const marked = board
        ? board.teams.reduce((sum, team) => sum + (team.zoneId ? team.names.length : 0), 0)
        : 0
      cards.push(summary(tournament, marked, entries.reduce((sum, entry) => sum + entry.names.length, 0)))
    }
    return { status: 200, body: { source: "database", tournaments: cards } }
  }

  const slug = decodeURIComponent(url.slice("/api/tournaments/".length))
  if (!/^[\w-]{1,80}$/.test(slug)) return { status: 404, body: { error: "not-found" } }

  const tournament = await database.collection<TournamentDoc>("tournaments").findOne({ slug, published: true })
  if (!tournament) return { status: 404, body: { error: "not-found" } }

  const entries = await rosterOf(database, tournament)
  const windows = []
  for (const window of tournament.windows ?? []) {
    windows.push(await windowBoard(database, tournament, window, entries))
  }

  return {
    status: 200,
    body: {
      source: "database",
      mapImage: tournament.mapImage || "/images/mapa-br.png",
      windows,
    },
  }
}
