import { useMemo, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  Crosshair,
  Eye,
  Gamepad2,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Minus,
  Monitor,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react"

type Page =
  | "home"
  | "tournaments"
  | "tournament"
  | "leaderboard"
  | "dashboard"

const players = [
  { name: "changozebolla", xp: 972, kills: 229, games: 241, tier: "legend" },
  { name: "yossh lee", xp: 762, kills: 368, games: 157, tier: "legend" },
  { name: "axo 19!", xp: 738, kills: 178, games: 155, tier: "legend" },
  { name: "rochan", xp: 691, kills: 381, games: 148, tier: "legend" },
  { name: "2two Keyxity!", xp: 687, kills: 177, games: 95, tier: "legend" },
  { name: "yagasz.", xp: 594, kills: 326, games: 114, tier: "legend" },
  { name: "rACKZ FF!", xp: 569, kills: 225, games: 129, tier: "legend" },
  { name: "23 Red", xp: 549, kills: 200, games: 100, tier: "legend" },
  { name: "zimy!", xp: 523, kills: 285, games: 152, tier: "legend" },
  { name: "BLST Mitxz†", xp: 522, kills: 327, games: 177, tier: "legend" },
]

/**
 * PROTÓTIPO VISUAL: estes valores existem somente para representar o componente.
 * Na integração final, este objeto deve ser substituído pelo `Board` retornado
 * por `getBoard()`. Consulte `docs/FINAL-INTEGRATION-CHECKLIST.md` antes de
 * alterar qualquer parte do ranking.
 */
const liveRanking = {
  season: 3,
  updatedAt: "07 de out., 06:01",
  players: players.slice(0, 5),
}

const tierData = {
  legend: {
    label: "Legend",
    icon: "/images/rank-icons/legend-v2.png",
    color: "#FFD84D",
  },
  overlord: {
    label: "Overlord",
    icon: "/images/rank-icons/overlord.png",
    color: "#C676FF",
  },
  grandmaster: {
    label: "Grandmaster",
    icon: "/images/rank-icons/grandmaster.png",
    color: "#C676FF",
  },
  master: {
    label: "Master",
    icon: "/images/rank-icons/master.png",
    color: "#64A5FF",
  },
  diamond: {
    label: "Diamond",
    icon: "/images/rank-icons/diamond.png",
    color: "#4CE5D3",
  },
  gold: {
    label: "Gold",
    icon: "/images/rank-icons/gold.png",
    color: "#FFC44C",
  },
  bronze: {
    label: "Bronze",
    icon: "/images/rank-icons/bronze.png",
    color: "#D77B43",
  },
}

const tournaments = [
  {
    title: "FNCS Trio Test",
    status: "EM BREVE",
    date: "05 de nov., 11:51",
    mode: "Trio",
    prize: "",
    image: "/images/fncs-trio-test.png",
    accent: "blue",
  },
  {
    title: "FNCS Solo Finals1",
    status: "EM BREVE",
    date: "23 de out., 23:39",
    mode: "Solo",
    prize: "",
    image: "",
    accent: "blue",
  },
]

const proPlayers = [
  ["Nuti", "https://i.ibb.co/4gVnZD4n/nuti.jpg"],
  ["Teuzz", "https://i.ibb.co/KTcRvZN/teuzz.jpg"],
  ["KingBR", "https://i.ibb.co/LdHskT66/kingbr-major.jpg"],
  ["RomeroFDP", "https://i.ibb.co/wFtd1zH0/mome.jpg"],
  ["Fazer", "https://i.ibb.co/VWPPbzCq/fazer-major.jpg"],
  ["Lewa", "https://i.ibb.co/TM0xXN27/lewa.jpg"],
  ["Tisco", "https://i.ibb.co/whWkvSFM/tisco.jpg"],
  ["Edson", "https://i.ibb.co/v62SW6pV/edson.jpg"],
  ["Diguera", "https://i.ibb.co/vvmsng6X/diguera.jpg"],
  ["Seeyun", "https://i.ibb.co/gLWfJQsW/seeyun-major.jpg"],
  ["Phzin", "https://i.ibb.co/5hf6f476/ph.jpg"],
  ["Gabzera", "https://i.ibb.co/zW3J3y3x/gabi-gabi.jpg"],
  ["TheFeloz", "https://i.ibb.co/tpGrYfrJ/feloz.jpg"],
  ["Jxness", "https://i.ibb.co/d0j8nPwD/jones.jpg"],
  ["Randu", "https://i.ibb.co/GfC2QPbC/randu.jpg"],
  ["K1ng", "https://i.ibb.co/Z1JHVVmX/55303590366-87ac98eee3-o.jpg"],
] as const

function Logo() {
  return (
    <img
      className="brand-logo"
      src="/images/logo_full.png"
      alt="Major Scrims"
    />
  )
}

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 127.14 96.36"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  )
}

function TwitchMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.3 2 3 5.4v14h4.7V22h2.6l2.6-2.6h3.9L22 14.2V2H4.3Zm15.4 11.1-3 3H12l-2.6 2.6v-2.6H5.5V4.3h14.2v8.8ZM16.8 7.2h-2.3v5.2h2.3V7.2Zm-6.3 0H8.2v5.2h2.3V7.2Z" />
    </svg>
  )
}

function FortniteMark() {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden>
      <path
        d="M8 4h17v6H14v3h9v6h-9v9H8V4Z"
        fill="currentColor"
      />
      <path d="M8 4h17" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function AppHeader({
  page,
  onNavigate,
}: {
  page: Page
  onNavigate: (page: Page) => void
}) {
  const [open, setOpen] = useState(false)
  const links: { id: Page label: string }[] = [
    { id: "tournaments", label: "Torneios" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "dashboard", label: "Dashboard" },
  ]

  const navigate = (target: Page) => {
    setOpen(false)
    onNavigate(target)
  }

  return (
    <header className="site-header">
      <div className="nav-shell">
        <button
          className="logo-button"
          onClick={() => navigate("home")}
          aria-label="Ir para o início"
        >
          <Logo />
        </button>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {links.map((link) => (
            <button
              key={link.id}
              className={
                page === link.id ||
                (page === "tournament" && link.id === "tournaments")
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() => navigate(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>
        <div className="nav-actions">
          <div className="locale-switcher" aria-label="Idioma">
            <button className="active" aria-pressed="true">
              <span className="flag flag-br" aria-hidden />
              PT
            </button>
            <button aria-pressed="false">
              <span className="flag flag-es" aria-hidden />
              ES
            </button>
          </div>
          <button
            className="primary-button compact"
            onClick={() => navigate("dashboard")}
          >
            Entrar <ArrowRight size={15} />
          </button>
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" aria-label="Navegação móvel">
          {links.map((link) => (
            <button
              key={link.id}
              className={
                page === link.id ||
                (page === "tournament" && link.id === "tournaments")
                  ? "active"
                  : ""
              }
              onClick={() => navigate(link.id)}
            >
              {link.label}
              <ArrowRight size={18} />
            </button>
          ))}
        </nav>
      )}
    </header>
  )
}

function SectionTitle({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body?: string
}) {
  return (
    <div className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  )
}

function Home({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-map" />
          <div className="hero-grid page-shell">
            <div className="hero-copy reveal">
              <div className="live-label">
                <span /> BRASIL & LATAM · 24H POR DIA
              </div>
              <h1>
                Scrims &<br />
                customs de elite
                <br />
                <span>para Fortnite</span>
                <br />
                <span>competitivo</span>
              </h1>
              <p>
                A comunidade líder de treinos competitivos no Brasil e LATAM.
                Partidas equilibradas, regras profissionais e lobby cheio a
                qualquer hora.
              </p>
              <div className="button-row">
                <button className="primary-button large live-primary-cta">
                  <DiscordMark className="discord-mark" />
                  Entrar no Discord
                </button>
                <button
                  className="secondary-button large live-secondary-cta"
                  onClick={() => onNavigate("leaderboard")}
                >
                  Ver leaderboard <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="ranking-card reveal delay">
              <div className="card-topline">
                <h3>
                  TOP 5 <span>·</span> SEASON {liveRanking.season}
                </h3>
                <span className="ranking-updated">
                  atualizado {liveRanking.updatedAt}
                </span>
              </div>
              <div className="podium" role="list">
                {liveRanking.players.map((player, index) => (
                  <div className="podium-row" key={player.name}>
                    <span className={`rank-number rank-${index + 1}`}>
                      {index + 1}
                    </span>
                    <img
                      src={
                        tierData[(player.tier as keyof typeof tierData)].icon
                      }
                      alt=""
                    />
                    <div>
                      <strong>{player.name}</strong>
                      <small>
                        {tierData[(player.tier as keyof typeof tierData)].label}
                      </small>
                    </div>
                    <b>
                      {player.xp.toLocaleString("pt-BR")}
                      <small> XP</small>
                    </b>
                  </div>
                ))}
              </div>
              <button
                className="card-link"
                onClick={() => onNavigate("leaderboard")}
              >
                <span>Ver ranking completo</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="stats-bar page-shell">
            {[
              ["70k+", "membros no Discord"],
              ["20.039", "ranqueados na Season 3"],
              ["6.000+", "players únicos por dia"],
              ["8.000+", "partidas por mês"],
            ].map(([number, label]) => (
              <div className="hero-stat" key={label}>
                <strong>{number}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="live-tournaments-section section page-shell">
          <div>
            <SectionTitle
              eyebrow="TORNEIOS"
              title="Campeonatos com mapa de queda"
              body="Classificou? Entre com o Discord e marque o spot da sua equipe direto no mapa — sem planilha, sem print no chat."
            />
            <button
              className="live-section-link"
              onClick={() => onNavigate("tournaments")}
            >
              Ver todos os torneios <ArrowRight size={16} />
            </button>
          </div>
          <div className="live-event-list">
            {[...tournaments].reverse().map((event) => (
              <button
                className="live-event-row"
                key={event.title}
                onClick={() => onNavigate("tournament")}
              >
                <span className="live-event-thumb">
                  {event.image && <img src={event.image} alt="" />}
                </span>
                <span className="live-event-copy">
                  <span className="live-event-kicker">
                    <small>{event.status}</small>
                    <em>{event.date}</em>
                  </span>
                  <strong>{event.title}</strong>
                  <span className="live-event-meta">
                    <span>{event.mode} · Build · BR</span>
                  </span>
                </span>
                <span className="live-event-status">
                  <small>VER MAPA</small>
                  <ArrowRight size={17} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rank-section">
          <div className="page-shell live-rank-layout">
            <div className="live-rank-copy">
              <SectionTitle
                eyebrow="LEADERBOARD"
                title="Cada partida conta para o seu cargo"
                body="Pontos das scrims viram posição na tabela, e os 2.000 primeiros levam cargo no Discord — do Bronze ao Legend."
              />
              <div className="rank-heading-actions">
                <span>A tabela atualiza todo dia às 03h.</span>
                <button
                  className="secondary-button"
                  onClick={() => onNavigate("leaderboard")}
                >
                  Ver leaderboard <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <div className="rank-track">
              {[
                ["bronze", "Bronze", "1.501–2.000"],
                ["gold", "Gold", "1.001–1.500"],
                ["diamond", "Diamond", "501–1.000"],
                ["master", "Master", "301–500"],
                ["grandmaster", "Grandmaster", "101–300"],
                ["overlord", "Overlord", "21–100"],
                ["legend-v2", "Legend", "TOP 20"],
              ].map(([icon, label, range], index) => (
                <div className="rank-step" key={label}>
                  <span
                    className={index === 6 ? "rank-icon final" : "rank-icon"}
                  >
                    <img src={`/images/rank-icons/${icon}.png`} alt="" />
                  </span>
                  <b>{label}</b>
                  <small>{range}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="page-shell live-community-section">
          <div className="live-partners">
            <div>
              <span className="eyebrow">PARCERIAS</span>
              <h2>Marcas que confiaram na Major</h2>
            </div>
            <div className="partner-rotation">
              <button className="partner-card twitch-card">
                <span className="partner-mark twitch"><TwitchMark /></span>
                <span className="partner-copy">
                  <small>PARCEIRO OFICIAL</small>
                  <b>Twitch</b>
                  <em>Torneios impulsionados pela Twitch.</em>
                </span>
                <span className="partner-number">01</span>
              </button>
              <button className="partner-card fortnite-card">
                <span className="partner-mark fortnite"><FortniteMark /></span>
                <span className="partner-copy">
                  <small>PARCEIRO OFICIAL</small>
                  <b>Fortnite</b>
                  <em>Torneios com prêmios oficiais do Fortnite.</em>
                </span>
                <span className="partner-number">02</span>
              </button>
            </div>
          </div>

          <div className="live-pros">
            <span className="eyebrow">COMUNIDADE PRO</span>
            <h2>Quem treina na Major</h2>
            <p>Jogadores profissionais escolhem os nossos servidores.</p>
            <div className="pro-marquee-wrap">
              <div className="pro-marquee">
                {[...proPlayers, ...proPlayers].map(([name, image], index) => (
                  <figure key={`${name}-${index}`} aria-hidden={index >= proPlayers.length || undefined}>
                    <img src={image} alt={index < proPlayers.length ? name : ""} />
                    <figcaption><b>{name}</b><small>PRO PLAYER</small></figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="live-invite-section">
          <div className="page-shell live-invite-card">
            <div>
              <h2>Pronto para evoluir?</h2>
              <p>
                Entre no Discord da Major Scrims e comece a treinar com os
                melhores do Brasil e LATAM hoje mesmo.
              </p>
            </div>
            <div>
              <button className="primary-button large">
                <DiscordMark className="discord-mark" />
                Entrar no Discord
              </button>
              <button>Marca ou organização? Fale com a gente</button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function Tournaments({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <main className="inner-page live-listing-page">
      <section className="page-shell live-page-heading">
        <span className="eyebrow">// TORNEIOS</span>
        <h1>Torneios oficiais</h1>
        <p>Acompanhe os campeonatos e marque o seu spot no mapa de queda.</p>
      </section>

      <section className="page-shell live-tournament-grid">
        {tournaments.map((event) => (
          <button
            className="live-tournament-card"
            key={event.title}
            onClick={() => onNavigate("tournament")}
          >
            <span className="live-tournament-art">
              {event.image && <img src={event.image} alt="" />}
              <small>{event.status}</small>
            </span>
            <span className="live-tournament-body">
              <strong>{event.title}</strong>
              <span>
                <small>{event.mode}</small>
                <small>Build</small>
                <small>BR</small>
              </span>
            </span>
          </button>
        ))}
      </section>
    </main>
  )
}

const eventPlayers = [
  "pardal",
  "RodryGØD.",
  "7RX matibuca.",
  "LuLuzito Ӝ",
  "7tzin",
  "Lynex bettifn",
  "20COMER70CORRER!",
  "Nicksreyn",
  "golden",
  "JAC-roblox",
  "patrick-jane-_-",
  "vicoouk do bronx",
]

const mapZones = [
  { name: "NhouLM10", x: "66%", y: "20%", state: "taken" },
  { name: "pardal · Fliks7.", x: "58%", y: "48%", state: "contested" },
  { name: "RodryGØD.", x: "72%", y: "48%", state: "taken" },
  { name: "7tzin", x: "49%", y: "67%", state: "taken" },
  { name: "Lynex bettifn", x: "61%", y: "72%", state: "contested" },
  { name: "Nicksreyn", x: "62%", y: "82%", state: "taken" },
  { name: "20COMER70CORRER!", x: "43%", y: "77%", state: "taken" },
  { name: "LuLuzito Ӝ · Ment0s", x: "31%", y: "65%", state: "contested" },
  { name: "7RX matibuca.", x: "42%", y: "63%", state: "selected" },
  { name: "vicoouk do bronx", x: "25%", y: "52%", state: "taken" },
] as const

function TournamentDetail({
  onNavigate,
}: {
  onNavigate: (page: Page) => void
}) {
  const [query, setQuery] = useState("")
  const [unmarked, setUnmarked] = useState(false)
  const [mapScale, setMapScale] = useState(1)
  const visiblePlayers = eventPlayers.filter((name) =>
    name.toLowerCase().includes(query.toLowerCase()),
  )
  const changeMapZoom = (amount: number) => {
    setMapScale((current) =>
      Math.min(4, Math.max(1, Math.round((current + amount) * 100) / 100)),
    )
  }

  return (
    <main className="event-page">
      <header className="event-page-header">
        <div className="event-wide-shell">
          <button
            className="event-back"
            onClick={() => onNavigate("tournaments")}
          >
            ← Torneios
          </button>
          <h1>FNCS Solo Finals1</h1>
          <div className="event-meta-line">
            <span>23 de outubro a 24 de outubro de 2026 (BRT)</span>
            <i>·</i><span>Solo</span><i>·</i><span>Build</span><i>·</i>
            <span>BR</span><small>Em breve</small>
          </div>
        </div>
      </header>

      <div className="event-phase-bar">
        <button className="active">Finals</button>
        <span><i /> Fecha em <b>16d 06h</b></span>
      </div>

      <section className="event-wide-shell event-workspace">
        <div className="event-toolbar">
          <button><Share2 size={16} /> Compartilhar</button>
          <span><Users size={18} /><b>16/101</b> jogadores marcados</span>
        </div>

        <div className="event-map-layout">
          <aside className="event-team-panel">
            <div className="team-panel-head">
              <span><b>Equipes</b><small>16/101 com spot</small></span>
              <div>
                <label>
                  <Search size={15} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar jogador"
                  />
                </label>
                <button
                  className={unmarked ? "active" : ""}
                  onClick={() => setUnmarked(!unmarked)}
                >
                  Sem spot
                </button>
              </div>
            </div>
            <div className="team-list">
              {visiblePlayers.map((name, index) => (
                <button key={name}>
                  <span className="marked-check"><Check size={13} /></span>
                  <b>{name}</b>
                  {(index === 1 || index === 3) && <small>◆</small>}
                </button>
              ))}
            </div>
            <p>
              Você está vendo o mapa em modo leitura. Entre com o Discord para
              marcar o spot da sua equipe.
            </p>
          </aside>

          <div
            className="event-map-canvas"
            onWheel={(event) => {
              event.preventDefault()
              changeMapZoom(event.deltaY < 0 ? 0.25 : -0.25)
            }}
          >
            <div className="map-deadline">Marcações até 23/10, 23:39</div>
            <div
              className="event-map-zoom-layer"
              style={{ transform: `scale(${mapScale})` }}
            >
              {/* Placeholder raster: substituir pelo mapa vetorial na integração final. */}
              <img src="/images/fncs-solo-map.png" alt="Mapa do evento" />
              <div className="map-zone-layer">
                {mapZones.map((zone) => (
                  <button
                    key={zone.name}
                    className={`prototype-zone ${zone.state}`}
                    style={{ left: zone.x, top: zone.y }}
                    aria-label={`${zone.name}, spot ${zone.state}`}
                  >
                    {zone.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="map-controls">
              <button aria-label="Modo transmissão"><Monitor /></button>
              <button aria-label="Ocultar nomes"><Eye /></button>
              <button
                aria-label="Aumentar zoom"
                disabled={mapScale >= 4}
                onClick={() => changeMapZoom(0.5)}
              >
                <Plus />
              </button>
              <button
                aria-label="Diminuir zoom"
                disabled={mapScale <= 1}
                onClick={() => changeMapZoom(-0.5)}
              >
                <Minus />
              </button>
            </div>
            <div className="map-brand"><Logo /><b>MAJORSCRIMS.COM</b></div>
          </div>
        </div>
      </section>

      <section className="event-wide-shell event-comments">
        <div><h2>Comentários</h2><span>0</span></div>
        <p>Nenhum comentário ainda.</p>
      </section>
    </main>
  )
}

const tierRanges = [
  { key: "legend", range: "top 20" },
  { key: "overlord", range: "21–100" },
  { key: "grandmaster", range: "101–300" },
  { key: "master", range: "301–500" },
  { key: "diamond", range: "501–1000" },
  { key: "gold", range: "1001–1500" },
  { key: "bronze", range: "1501–2000" },
] as const

function Leaderboard() {
  const [query, setQuery] = useState("")
  const [season, setSeason] = useState("S3")
  const filtered = useMemo(
    () =>
      players.filter((player) =>
        player.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  )

  return (
    <main className="inner-page live-leaderboard-page">
      <section className="page-shell live-board-header">
        <div>
          <span className="eyebrow">// LEADERBOARD</span>
          <h1>Season 3</h1>
          <p>
            RANKING INDIVIDUAL <span>·</span> 20.039 JOGADORES{" "}
            <span>·</span> <em>atualizado 07/10/2026, 06:01</em>
          </p>
        </div>
        <div
          className="season-picker"
          role="group"
          aria-label="Selecionar season"
        >
          {["S1", "S2", "S3"].map((item) => (
            <button
              className={season === item ? "active" : ""}
              onClick={() => setSeason(item)}
              key={item}
            >
              {item}
              <small>{item === "S3" ? "ATUAL" : "FINAL"}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="page-shell live-board-content">
        <div className="live-tier-section">
          <span>CARGOS</span>
          <div className="live-tier-grid">
            {tierRanges.map(({ key, range }) => {
              const tier = tierData[key]
              return (
                <div className="live-tier-item" key={key}>
                  <img src={tier.icon} alt="" />
                  <span>
                    <b style={{ color: tier.color }}>{tier.label}</b>
                    <small>{range}</small>
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <label className="search-field live-search-field">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar jogador..."
            aria-label="Buscar jogador"
          />
        </label>

        <div className="leaderboard-table live-table">
          <div className="table-head">
            <span>RANK</span>
            <span>NICKNAME</span>
            <span>CARGO</span>
            <span>XP</span>
            <span>KILLS</span>
            <span>GAMES</span>
          </div>
          {filtered.map((player, index) => {
            const tier = tierData[player.tier as keyof typeof tierData]
            return (
              <div
                className={
                  index < 3 && !query
                    ? `table-row top top-${index + 1}`
                    : "table-row"
                }
                key={player.name}
              >
                <span className="table-rank">{index + 1}</span>
                <span className="player-cell">
                  <img src={tier.icon} alt="" />
                  <b>{player.name}</b>
                </span>
                <span className="tier-cell" style={{ color: tier.color }}>
                  MS {tier.label}
                </span>
                <strong>{player.xp.toLocaleString("pt-BR")}</strong>
                <span>{player.kills}</span>
                <span>{player.games}</span>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="empty-state">Nenhum jogador encontrado.</div>
          )}
        </div>
      </section>
    </main>
  )
}

function Dashboard() {
  return (
    <main className="inner-page dashboard-page">
      <section className="dashboard-head page-shell">
        <div className="profile-welcome">
          <span className="profile-avatar">
            CV
            <span>
              <Check size={11} />
            </span>
          </span>
          <div>
            <small>SEASON 3 · AO VIVO</small>
            <h1>
              Olá, <span>CaduFPS</span>
            </h1>
            <p>Acompanhe sua evolução na Major.</p>
          </div>
        </div>
        <button className="secondary-button">
          <CircleUserRound size={18} /> Ver perfil público
        </button>
      </section>
      <section className="page-shell dashboard-grid">
        <div className="dashboard-main">
          <div className="rank-overview">
            <div className="rank-summary">
              <span className="overline">SUA POSIÇÃO</span>
              <div className="big-rank">
                <small>#</small>148
              </div>
              <span className="rank-change">↑ 12 posições esta semana</span>
              <p>
                TOP 0,8% <span>de 18.420 jogadores</span>
              </p>
            </div>
            <div className="current-tier">
              <span className="tier-aura">
                <img src="/images/rank-icons/master.png" alt="Master" />
              </span>
              <div>
                <small>CARGO ATUAL</small>
                <h3>Master</h3>
                <p>
                  Faltam <b>1.240 XP</b> para Grandmaster
                </p>
              </div>
            </div>
            <div className="xp-progress">
              <span style={{ width: "72%" }} />
            </div>
          </div>
          <div className="metric-grid">
            {[
              [BarChart3, "PONTOS", "24.340", "+2.180 esta semana"],
              [Gamepad2, "PARTIDAS", "109", "76% presença"],
              [Crosshair, "KILLS", "372", "3,4 por partida"],
              [Trophy, "VITÓRIAS", "18", "16,5% win rate"],
            ].map(([Icon, label, value, detail]) => {
              const MetricIcon = Icon as typeof BarChart3
              return (
                <div className="metric-card" key={String(label)}>
                  <MetricIcon />
                  <small>{String(label)}</small>
                  <b>{String(value)}</b>
                  <span>{String(detail)}</span>
                </div>
              )
            })}
          </div>
          <div className="performance-card">
            <div className="card-title">
              <span>
                <BarChart3 size={19} />
                <b>DESEMPENHO RECENTE</b>
              </span>
              <small>ÚLTIMOS 7 DIAS</small>
            </div>
            <div className="chart">
              {[35, 48, 42, 60, 54, 76, 88].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }}>
                  <i />
                </span>
              ))}
            </div>
            <div className="chart-labels">
              {["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
        </div>
        <aside className="dashboard-side">
          <div className="daily-card">
            <span className="daily-icon">
              <Zap fill="currentColor" />
            </span>
            <span className="overline">MISSÃO DA SEMANA</span>
            <h3>Consistência é tudo.</h3>
            <p>Jogue 5 partidas nesta semana para manter sua sequência.</p>
            <div className="mission-progress">
              <span style={{ width: "60%" }} />
            </div>
            <div className="mission-count">
              <b>3 / 5 partidas</b>
              <span>60%</span>
            </div>
          </div>
          <div className="account-card">
            <div className="card-title">
              <span>
                <LockKeyhole size={18} />
                <b>CONTA VINCULADA</b>
              </span>
            </div>
            <div className="discord-account">
              <span>CD</span>
              <div>
                <b>@cadufps</b>
                <small>
                  <i /> Discord verificado
                </small>
              </div>
            </div>
            <p>
              Seus dados são sincronizados automaticamente com a tabela da
              Major.
            </p>
          </div>
          <button className="primary-button full">
            <LayoutDashboard size={17} /> Ver na leaderboard
          </button>
        </aside>
      </section>
    </main>
  )
}

function Footer({ onNavigate: _onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <footer>
      <div className="page-shell live-footer-main">
        <div className="live-footer-founders">
          <Logo />
          <b>FUNDADORES</b>
          <div>
            <span><i>B</i><strong>@BLXCKOUTZ<small>Co-owner · BR</small></strong></span>
            <span><i>G</i><strong>@GORILONFN<small>Co-owner · AR</small></strong></span>
          </div>
        </div>
        <div className="live-footer-contact">
          <button>Fale conosco <ArrowRight size={14} /></button>
          <div className="live-socials">
            <span>X</span><span>IG</span><span>TK</span><span>DS</span>
          </div>
          <div><span>Política de Privacidade</span><span>Termos de Uso</span></div>
          <small>© 2026 Major Scrims. Todos os direitos reservados.</small>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>("home")
  const navigate = (target: Page) => {
    setPage(target)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="app">
      <AppHeader page={page} onNavigate={navigate} />
      {page === "home" && <Home onNavigate={navigate} />}
      {page === "tournaments" && <Tournaments onNavigate={navigate} />}
      {page === "tournament" && <TournamentDetail onNavigate={navigate} />}
      {page === "leaderboard" && <Leaderboard />}
      {page === "dashboard" && <Dashboard />}
      <Footer onNavigate={navigate} />
    </div>
  )
}
