import { useEffect, useMemo, useRef, useState } from "react"
import { messages, numberLocale, type Locale } from "./messages"
import { eventMapCopy } from "./map/map-copy"
import { EventMap } from "./map/event-map"
import { demoBoard } from "./map/demo-board"
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
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Swords,
  Target,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react"

type Page =
  | "home"
  | "tournaments"
  | "tournament"
  | "leaderboard"
  | "dashboard"

const tutorialVideos: Record<Locale, string> = {
  pt: "/videos/tutorial-pt.mp4",
  es: "/videos/tutorial-es.mp4",
}

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
    slug: "fncs-trio-test",
    title: "FNCS Trio Test",
    status: "EM BREVE",
    dateKey: "trioDate" as const,
    mode: "Trio",
    prize: "",
    image: "/images/fncs-trio-test.png",
    accent: "blue",
  },
  {
    slug: "fncs-solo-finals1",
    title: "FNCS Solo Finals1",
    status: "EM BREVE",
    dateKey: "soloDate" as const,
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
  locale,
  signedIn,
  onNavigate,
  onLocale,
  onLogin,
  onLogout,
}: {
  page: Page
  locale: Locale
  signedIn: boolean
  onNavigate: (page: Page) => void
  onLocale: (locale: Locale) => void
  onLogin: () => void
  onLogout: () => void
}) {
  const [open, setOpen] = useState(false)
  const t = messages[locale]
  const links: { id: Page; label: string }[] = [
    { id: "tournaments", label: t.navTournaments },
    { id: "leaderboard", label: t.navLeaderboard },
    { id: "dashboard", label: t.navDashboard },
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
          aria-label={t.navHome}
        >
          <Logo />
        </button>
        <nav className="desktop-nav" aria-label={t.navLabel}>
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
          <div className="locale-switcher" aria-label={t.language}>
            <button
              className={locale === "pt" ? "active" : ""}
              aria-pressed={locale === "pt"}
              onClick={() => onLocale("pt")}
            >
              <span className="flag flag-br" aria-hidden />
              PT
            </button>
            <button
              className={locale === "es" ? "active" : ""}
              aria-pressed={locale === "es"}
              onClick={() => onLocale("es")}
            >
              <span className="flag flag-es" aria-hidden />
              ES
            </button>
          </div>
          {signedIn ? (
            <>
              <button
                className="secondary-button compact"
                onClick={() => navigate("dashboard")}
              >
                pardal
              </button>
              <button className="secondary-button compact" onClick={onLogout}>
                {t.logout}
              </button>
            </>
          ) : (
            <button className="primary-button compact" onClick={onLogin}>
              {t.login} <ArrowRight size={15} />
            </button>
          )}
          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? t.closeMenu : t.openMenu}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" aria-label={t.navMobile}>
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

function formatClock(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const remain = total % 60
  return `${minutes}:${remain.toString().padStart(2, "0")}`
}

function TutorialPlayer({
  src,
  label,
  locale,
}: {
  src: string
  label: string
  locale: Locale
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const lastVolume = useRef(1)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const copy =
    locale === "es"
      ? {
          play: "Reproducir",
          pause: "Pausar",
          mute: "Silenciar",
          sound: "Activar sonido",
          volume: "Volumen",
          enter: "Pantalla completa",
          exit: "Salir de pantalla completa",
          progress: "Progreso del video",
        }
      : {
          play: "Reproduzir",
          pause: "Pausar",
          mute: "Silenciar",
          sound: "Ativar som",
          volume: "Volume",
          enter: "Tela cheia",
          exit: "Sair da tela cheia",
          progress: "Progresso do vídeo",
        }

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === shellRef.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    if (video.muted || video.volume === 0) {
      const next = lastVolume.current || 1
      video.muted = false
      video.volume = next
      setVolume(next)
      setMuted(false)
      return
    }
    lastVolume.current = video.volume
    video.muted = true
    setMuted(true)
  }

  const changeVolume = (value: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = value
    video.muted = value === 0
    if (value > 0) lastVolume.current = value
    setVolume(value)
    setMuted(value === 0)
  }

  const toggleFullscreen = () => {
    const shell = shellRef.current
    if (!shell) return
    if (document.fullscreenElement) void document.exitFullscreen()
    else void shell.requestFullscreen()
  }

  const progress = duration > 0 ? `${(time / duration) * 100}%` : "0%"

  return (
    <div className="tutorial-player" ref={shellRef}>
      <video
        ref={videoRef}
        className="tutorial-video"
        playsInline
        preload="metadata"
        src={src}
        aria-label={label}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onClick={togglePlay}
      />
      {!playing && (
        <button className="tutorial-center-play" type="button" onClick={togglePlay} aria-label={copy.play}>
          <Play size={22} fill="currentColor" />
        </button>
      )}
      <div className="tutorial-controls">
        <button className="tutorial-play" type="button" onClick={togglePlay} aria-label={playing ? copy.pause : copy.play}>
          {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
        </button>
        <span className="tutorial-time">
          {formatClock(time)}<i>/</i>{formatClock(duration)}
        </span>
        <input
          className="tutorial-range tutorial-scrub"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          aria-label={copy.progress}
          style={{ ["--progress" as string]: progress }}
          onChange={(event) => {
            const video = videoRef.current
            const next = Number(event.target.value)
            if (!video) return
            video.currentTime = next
            setTime(next)
          }}
        />
        <button type="button" onClick={toggleMute} aria-label={muted ? copy.sound : copy.mute}>
          {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input
          className="tutorial-range tutorial-volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          aria-label={copy.volume}
          style={{ ["--progress" as string]: `${(muted ? 0 : volume) * 100}%` }}
          onChange={(event) => changeVolume(Number(event.target.value))}
        />
        <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? copy.exit : copy.enter}>
          {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>
      </div>
    </div>
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

function Home({
  onNavigate,
  onOpenTournament,
  locale,
}: {
  onNavigate: (page: Page) => void
  onOpenTournament: (slug: string) => void
  locale: Locale
}) {
  const t = messages[locale]
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-map" />
          <div className="hero-grid page-shell">
            <div className="hero-copy reveal">
              <div className="live-label">
                <span /> {t.heroKicker}
              </div>
              <h1>
                {t.heroLine1}
                <br />
                {t.heroLine2}
                <br />
                <span>{t.heroLine3}</span>
                <br />
                <span>{t.heroLine4}</span>
              </h1>
              <p>{t.heroBody}</p>
              <div className="button-row">
                <button className="primary-button large live-primary-cta">
                  <DiscordMark className="discord-mark" />
                  {t.joinDiscord}
                </button>
                <button
                  className="secondary-button large live-secondary-cta"
                  onClick={() => onNavigate("leaderboard")}
                >
                  {t.viewLeaderboard} <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="ranking-card reveal delay">
              <div className="card-topline">
                <h3>
                  TOP 5 <span>·</span> SEASON {liveRanking.season}
                </h3>
                <span className="ranking-updated">
                  {t.updated} {t.rankingUpdatedAt}
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
                      {player.xp.toLocaleString(numberLocale(locale))}
                      <small> XP</small>
                    </b>
                  </div>
                ))}
              </div>
              <button
                className="card-link"
                onClick={() => onNavigate("leaderboard")}
              >
                <span>{t.viewFullRanking}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="stats-bar page-shell">
            {[
              ["70k+", t.statMembers],
              ["20.039", t.statRanked],
              ["6.000+", t.statDaily],
              ["8.000+", t.statMatches],
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
              eyebrow={t.tournamentsEyebrow}
              title={t.tournamentsTitle}
              body={t.tournamentsBody}
            />
            <button
              className="live-section-link"
              onClick={() => onNavigate("tournaments")}
            >
              {t.viewAllTournaments} <ArrowRight size={16} />
            </button>
          </div>
          <div className="live-event-list">
            {[...tournaments].reverse().map((event) => (
              <button
                className="live-event-row"
                key={event.title}
                onClick={() => onOpenTournament(event.slug)}
              >
                <span className="live-event-thumb">
                  {event.image && <img src={event.image} alt="" />}
                </span>
                <span className="live-event-copy">
                  <span className="live-event-kicker">
                    <small>{t.statusSoon}</small>
                    <em>{t[event.dateKey]}</em>
                  </span>
                  <strong>{event.title}</strong>
                  <span className="live-event-meta">
                    <span>{event.mode} · Build · BR</span>
                  </span>
                </span>
                <span className="live-event-status">
                  <small>{t.viewMap}</small>
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
                eyebrow={t.navLeaderboard.toUpperCase()}
                title={t.rankTitle}
                body={t.rankBody}
              />
              <div className="rank-heading-actions">
                <span>{t.rankRefresh}</span>
                <button
                  className="secondary-button"
                  onClick={() => onNavigate("leaderboard")}
                >
                  {t.viewLeaderboard} <ArrowRight size={16} />
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
              <span className="eyebrow">{t.partnersEyebrow}</span>
              <h2>{t.partnersTitle}</h2>
            </div>
            <div className="partner-rotation">
              <button className="partner-card twitch-card">
                <span className="partner-mark twitch"><TwitchMark /></span>
                <span className="partner-copy">
                  <small>{t.officialPartner}</small>
                  <b>Twitch</b>
                  <em>{t.twitchBlurb}</em>
                </span>
                <span className="partner-number">01</span>
              </button>
              <button className="partner-card fortnite-card">
                <span className="partner-mark fortnite"><FortniteMark /></span>
                <span className="partner-copy">
                  <small>{t.officialPartner}</small>
                  <b>Fortnite</b>
                  <em>{t.fortniteBlurb}</em>
                </span>
                <span className="partner-number">02</span>
              </button>
            </div>
          </div>

          <div className="live-pros">
            <span className="eyebrow">{t.prosEyebrow}</span>
            <h2>{t.prosTitle}</h2>
            <p>{t.prosBody}</p>
            <div className="pro-marquee-wrap">
              <div className="pro-marquee">
                {[...proPlayers, ...proPlayers].map(([name, image], index) => (
                  <figure key={`${name}-${index}`} aria-hidden={index >= proPlayers.length || undefined}>
                    <img src={image} alt={index < proPlayers.length ? name : ""} />
                    <figcaption><b>{name}</b><small>{t.proPlayer}</small></figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="live-invite-section">
          <div className="page-shell tutorial-block">
            <div className="tutorial-copy">
              <span className="tutorial-eyebrow">{t.tutorialEyebrow}</span>
              <h2>{t.tutorialTitle}</h2>
              <p>{t.tutorialCopy}</p>
            </div>
            <TutorialPlayer
              key={locale}
              src={tutorialVideos[locale]}
              label={t.tutorialLabel}
              locale={locale}
            />
          </div>
          <div className="page-shell live-invite-card">
            <div>
              <h2>{t.inviteTitle}</h2>
              <p>{t.inviteBody}</p>
            </div>
            <div>
              <button className="primary-button large">
                <DiscordMark className="discord-mark" />
                {t.joinDiscord}
              </button>
              <button>{t.inviteContact}</button>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

function Tournaments({
  onNavigate,
  onOpenTournament,
  locale,
}: {
  onNavigate: (page: Page) => void
  onOpenTournament: (slug: string) => void
  locale: Locale
}) {
  const t = messages[locale]
  return (
    <main className="inner-page live-listing-page">
      <section className="page-shell live-page-heading">
        <span className="eyebrow">{t.tournamentsPageEyebrow}</span>
        <h1>{t.tournamentsPageTitle}</h1>
        <p>{t.tournamentsPageBody}</p>
      </section>

      <section className="page-shell live-tournament-grid">
        {tournaments.map((event) => (
          <button
            className="live-tournament-card"
            key={event.title}
            onClick={() => onOpenTournament(event.slug)}
          >
            <span className="live-tournament-art">
              {event.image && <img src={event.image} alt="" />}
              <small>{t.statusSoon}</small>
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

function TournamentDetail({
  slug,
  onNavigate,
  locale,
  signedIn,
  onLogin,
}: {
  slug: string
  onNavigate: (page: Page) => void
  locale: Locale
  signedIn: boolean
  onLogin: () => void
}) {
  const t = messages[locale]
  const mapCopy = eventMapCopy(locale)
  const event = tournaments.find((item) => item.slug === slug) ?? tournaments[0]
  const board = demoBoard(event.slug)
  const [comments, setComments] = useState<string[]>([])
  const [draft, setDraft] = useState("")

  return (
    <main className="event-page">
      <header className="event-page-header">
        <div className="event-wide-shell">
          <button
            className="event-back"
            onClick={() => onNavigate("tournaments")}
          >
            {t.backTournaments}
          </button>
          <h1>{event.title}</h1>
          <div className="event-meta-line">
            <span>{t[event.dateKey]}</span>
            <i>·</i><span>{event.mode}</span><i>·</i><span>Build</span><i>·</i>
            <span>BR</span><small>{t.statusSoonSoft}</small>
          </div>
        </div>
      </header>

      <div className="event-phase-bar">
        <button className="active">Finals</button>
        <span><i /> {t.closesIn} <b>16d 06h</b></span>
      </div>

      <section className="event-wide-shell event-workspace">
        <EventMap
          key={`${event.slug}-${signedIn ? "signed-in" : "anon"}`}
          t={mapCopy}
          slug={event.slug}
          windowId="finals"
          mapImage="/images/mapa-br.png"
          zones={board.zones}
          teams={board.teams}
          myKey={signedIn ? board.viewerKey : null}
          canMark={signedIn}
          isStaff={signedIn}
          blockedReason={signedIn ? null : mapCopy.blockAnon}
          highlights={board.highlights}
          closesAt={board.closesAt}
          closed={false}
        />
      </section>

      <section className="event-wide-shell event-comments">
        <div><h2>{t.comments}</h2><span>{comments.length}</span></div>
        {signedIn ? (
          <form
            className="comment-form"
            onSubmit={(event) => {
              event.preventDefault()
              const body = draft.trim()
              if (!body) return
              setComments((current) => [body, ...current])
              setDraft("")
            }}
          >
            <textarea
              value={draft}
              maxLength={500}
              rows={3}
              placeholder={t.commentPlaceholder}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="primary-button" type="submit" disabled={draft.trim().length === 0}>
              {t.commentSend}
            </button>
          </form>
        ) : (
          <p>
            <button type="button" className="comment-login" onClick={onLogin}>
              {t.login}
            </button>{" "}
            {t.commentLogin}
          </p>
        )}
        {comments.length === 0 ? (
          <p>{t.noComments}</p>
        ) : (
          <ul className="comment-list">
            {comments.map((body, index) => (
              <li key={`${index}-${body}`}>
                <b>pardal</b>
                <span>{body}</span>
              </li>
            ))}
          </ul>
        )}
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

function Leaderboard({ locale }: { locale: Locale }) {
  const t = messages[locale]
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
          <span className="eyebrow">// {t.navLeaderboard.toUpperCase()}</span>
          <h1>Season 3</h1>
          <p>
            {t.individualRanking} <span>·</span> 20.039 {t.playersWord}{" "}
            <span>·</span> <em>{t.leaderboardUpdated}</em>
          </p>
        </div>
        <div
          className="season-picker"
          role="group"
          aria-label={t.selectSeason}
        >
          {["S1", "S2", "S3"].map((item) => (
            <button
              className={season === item ? "active" : ""}
              onClick={() => setSeason(item)}
              key={item}
            >
              {item}
              <small>{item === "S3" ? t.seasonCurrent : t.seasonFinal}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="page-shell live-board-content">
        <div className="live-tier-section">
          <span>{t.roles}</span>
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
            placeholder={t.searchPlayerDots}
            aria-label={t.searchPlayer}
          />
        </label>

        <div className="leaderboard-table live-table">
          <div className="table-head">
            <span>{t.colRank}</span>
            <span>{t.colNickname}</span>
            <span>{t.colRole}</span>
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
                <strong>{player.xp.toLocaleString(numberLocale(locale))}</strong>
                <span>{player.kills}</span>
                <span>{player.games}</span>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="empty-state">{t.noPlayer}</div>
          )}
        </div>
      </section>
    </main>
  )
}

function Dashboard({ locale }: { locale: Locale }) {
  const t = messages[locale]
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
            <small>SEASON 3 · {t.live}</small>
            <h1>
              {t.hello} <span>CaduFPS</span>
            </h1>
            <p>{t.dashSubtitle}</p>
          </div>
        </div>
        <button className="secondary-button">
          <CircleUserRound size={18} /> {t.publicProfile}
        </button>
      </section>
      <section className="page-shell dashboard-grid">
        <div className="dashboard-main">
          <div className="rank-overview">
            <div className="rank-summary">
              <span className="overline">{t.yourPosition}</span>
              <div className="big-rank">
                <small>#</small>148
              </div>
              <span className="rank-change">{t.weekChange}</span>
              <p>
                TOP 0,8% <span>{t.ofPlayers}</span>
              </p>
            </div>
            <div className="current-tier">
              <span className="tier-aura">
                <img src="/images/rank-icons/master.png" alt="Master" />
              </span>
              <div>
                <small>{t.currentRole}</small>
                <h3>Master</h3>
                <p>
                  {t.xpMissing} <b>1.240 XP</b> {t.xpMissingEnd}
                </p>
              </div>
            </div>
            <div className="xp-progress">
              <span style={{ width: "72%" }} />
            </div>
          </div>
          <div className="metric-grid">
            {[
              [BarChart3, t.metricPoints, "24.340", t.metricPointsDetail],
              [Gamepad2, t.metricMatches, "109", t.metricMatchesDetail],
              [Crosshair, "KILLS", "372", t.metricKillsDetail],
              [Trophy, t.metricWins, "18", t.metricWinsDetail],
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
                <b>{t.recentPerformance}</b>
              </span>
              <small>{t.last7}</small>
            </div>
            <div className="chart">
              {[35, 48, 42, 60, 54, 76, 88].map((height, index) => (
                <span key={index} style={{ height: `${height}%` }}>
                  <i />
                </span>
              ))}
            </div>
            <div className="chart-labels">
              {t.weekdays.map((day) => (
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
            <span className="overline">{t.weeklyMission}</span>
            <h3>{t.missionTitle}</h3>
            <p>{t.missionBody}</p>
            <div className="mission-progress">
              <span style={{ width: "60%" }} />
            </div>
            <div className="mission-count">
              <b>{t.missionCount}</b>
              <span>60%</span>
            </div>
          </div>
          <div className="account-card">
            <div className="card-title">
              <span>
                <LockKeyhole size={18} />
                <b>{t.linkedAccount}</b>
              </span>
            </div>
            <div className="discord-account">
              <span>CD</span>
              <div>
                <b>@cadufps</b>
                <small>
                  <i /> {t.discordVerified}
                </small>
              </div>
            </div>
            <p>{t.syncNote}</p>
          </div>
          <button className="primary-button full">
            <LayoutDashboard size={17} /> {t.viewOnLeaderboard}
          </button>
        </aside>
      </section>
    </main>
  )
}

function Footer({ locale }: { locale: Locale }) {
  const t = messages[locale]
  return (
    <footer>
      <div className="page-shell live-footer-main">
        <div className="live-footer-founders">
          <Logo />
          <b>{t.founders}</b>
          <div>
            <span><i>B</i><strong>@BLXCKOUTZ<small>Co-owner · BR</small></strong></span>
            <span><i>G</i><strong>@GORILONFN<small>Co-owner · AR</small></strong></span>
          </div>
        </div>
        <div className="live-footer-contact">
          <button>{t.contact} <ArrowRight size={14} /></button>
          <div className="live-socials">
            <span>X</span><span>IG</span><span>TK</span><span>DS</span>
          </div>
          <div><span>{t.privacy}</span><span>{t.terms}</span></div>
          <small>{t.rights}</small>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>("home")
  const [locale, setLocale] = useState<Locale>("pt")
  const [signedIn, setSignedIn] = useState(false)
  const [eventSlug, setEventSlug] = useState("fncs-solo-finals1")
  const navigate = (target: Page) => {
    setPage(target)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const openTournament = (slug: string) => {
    setEventSlug(slug)
    navigate("tournament")
  }

  useEffect(() => {
    document.documentElement.lang = locale === "es" ? "es" : "pt-BR"
  }, [locale])

  return (
    <div className="app">
      <AppHeader
        page={page}
        locale={locale}
        signedIn={signedIn}
        onNavigate={navigate}
        onLocale={setLocale}
        onLogin={() => setSignedIn(true)}
        onLogout={() => setSignedIn(false)}
      />
      {page === "home" && (
        <Home onNavigate={navigate} onOpenTournament={openTournament} locale={locale} />
      )}
      {page === "tournaments" && (
        <Tournaments onNavigate={navigate} onOpenTournament={openTournament} locale={locale} />
      )}
      {page === "tournament" && (
        <TournamentDetail
          slug={eventSlug}
          onNavigate={navigate}
          locale={locale}
          signedIn={signedIn}
          onLogin={() => setSignedIn(true)}
        />
      )}
      {page === "leaderboard" && <Leaderboard locale={locale} />}
      {page === "dashboard" && <Dashboard locale={locale} />}
      <Footer locale={locale} />
    </div>
  )
}
