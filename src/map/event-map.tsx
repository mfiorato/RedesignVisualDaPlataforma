"use client";

import { fill } from "./fill"
import type { EventMapCopy } from "./map-copy"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import type { PlainHighlight, PlainTeam } from "./map-types"
import { checkArea, rectCorners, type AreaCheck } from "./zone-shape"
import { HighlightMark } from "./highlight-mark"
import { lockScroll, unlockScroll } from "./scroll-lock"
import type { PlainPoint, PlainZone } from "./map-types"

/**
 * `mineContested` existe porque a informação mais urgente do mapa é justamente
 * "caiu outra equipe em cima da sua". Se "sua" simplesmente vencesse
 * "disputado", quem mais precisa saber da disputa seria o único a não ver.
 */
type ZoneState = "free" | "mine" | "taken" | "contested" | "mineContested";

/**
 * Janelas do mapa. Guardam só IDs: o conteúdo é lido das props a cada render,
 * então a janela da staff se atualiza sozinha depois de cada mudança.
 */
type Dialog =
  | { kind: "placed"; zoneId: string; label?: string }
  | { kind: "confirmMove"; fromId: string; toId: string }
  | { kind: "confirmRelease"; zoneId: string }
  | { kind: "error"; message: string }
  | { kind: "info"; zoneId: string }
  | { kind: "staffZone"; zoneId: string }
  | { kind: "staffTeam"; teamKey: string };

const MAX_SCALE = 4;

/** Textos da tela, no idioma do site. */
type Labels = EventMapCopy;

export function EventMap({
  t,
  slug,
  windowId,
  mapImage,
  zones: initialZones,
  teams: initialTeams,
  myKey,
  canMark,
  isStaff,
  blockedReason,
  readOnly = false,
  shareUrl = null,
  highlights = {},
  closesAt,
  closed,
  toolbar,
}: {
  slug: string;
  windowId: string;
  mapImage: string;
  zones: PlainZone[];
  /** Já ordenadas: marcadas primeiro, depois a ordem da lista. */
  teams: PlainTeam[];
  myKey: string | null;
  canMark: boolean;
  isStaff: boolean;
  blockedReason: string | null;
  t: Labels;
  readOnly?: boolean;
  shareUrl?: string | null;
  /** Estilos dos destaques deste evento, por id. Vazio = lista sem destaque. */
  highlights?: Record<string, PlainHighlight>;
  /** Quando as marcações desta ronda fecham (início da ronda ou do torneio). */
  closesAt: string | null;
  /** Já passou do horário: só a staff mexe no mapa. */
  closed: boolean;
  /** Fica à esquerda do contador, acima do mapa — a troca de ronda. */
  toolbar?: React.ReactNode;
}) {
  const [zones, setZones] = useState(initialZones);
  const [teams, setTeams] = useState(initialTeams);
  useEffect(() => {
    setZones(initialZones);
    setTeams(initialTeams);
  }, [initialZones, initialTeams]);
  const [pending, startTransition] = useTransition();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  // Estável entre renders: o aviso de "Spot definido" tem um timer que não
  // pode recomeçar a cada atualização da página.
  const closeDialog = useCallback(() => setDialog(null), []);
  // Staff que não joga o evento abre direto no modo de gestão.
  const [manage, setManage] = useState(isStaff && !canMark);

  const zoneById = useMemo(
    () => new Map(zones.map((zone) => [zone.id, zone])),
    [zones],
  );

  const teamsByZone = useMemo(() => {
    const map = new Map<string, PlainTeam[]>();
    for (const team of teams) {
      if (!team.zoneId || !zoneById.has(team.zoneId)) continue;
      const list = map.get(team.zoneId) ?? [];
      list.push(team);
      map.set(team.zoneId, list);
    }
    return map;
  }, [teams, zoneById]);

  // Só entra na legenda o destaque que aparece de fato nesta lista.
  const usedHighlights = useMemo(() => {
    const ids = new Set<string>();
    for (const team of teams) {
      if (team.topTag) ids.add(team.topTag);
      for (const tag of team.tags ?? []) if (tag) ids.add(tag);
    }
    return [...ids]
      .map((id) => highlights[id])
      .filter((item): item is PlainHighlight => Boolean(item))
      .sort((a, b) => b.priority - a.priority)
      // A legenda fica sobre o mapa: passando disso, ela rouba a tela que a
      // pessoa veio ver. O nome completo continua no título de cada símbolo.
      .slice(0, 6);
  }, [teams, highlights]);

  const myTeam = teams.find((team) => team.key === myKey) ?? null;
  const myZoneId =
    myTeam?.zoneId && zoneById.has(myTeam.zoneId) ? myTeam.zoneId : null;

  const [selectedId, setSelectedId] = useState<string | null>(myZoneId);
  const [hoverZoneId, setHoverZoneId] = useState<string | null>(null);

  // Busca e filtro da lista: com 50 equipes, achar alguém no olho é inviável,
  // e a staff quer ver quem ainda não marcou.
  const [query, setQuery] = useState("");
  const [onlyUnmarked, setOnlyUnmarked] = useState(false);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());

  const visibleTeams = useMemo(() => {
    const term = query.trim().toLowerCase();
    return teams.filter((team) => {
      if (onlyUnmarked && team.zoneId) return false;
      if (!term) return true;
      return team.names.some((name) => name.toLowerCase().includes(term));
    });
  }, [teams, query, onlyUnmarked]);

  // Clicar num spot do mapa traz a equipe dele para a vista na lista.
  useEffect(() => {
    if (!selectedId) return;
    const team = teams.find((item) => item.zoneId === selectedId);
    const row = team ? rowRefs.current.get(team.key) : null;
    row?.scrollIntoView({ block: "nearest" });
  }, [selectedId, teams]);

  const totalPlayers = teams.reduce((sum, team) => sum + team.names.length, 0);
  const markedPlayers = teams.reduce(
    (sum, team) => sum + (team.zoneId ? team.names.length : 0),
    0,
  );

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [aspect, setAspect] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  // Modo transmissão: mapa ocupando a tela, sem lista nem controles, para
  // quem narra o evento ou grava a tela.
  const [broadcast, setBroadcast] = useState(false);
  const [shared, setShared] = useState(false);
  useEffect(() => {
    if (!broadcast) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBroadcast(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [broadcast]);
  const dragging = useRef<{ x: number; y: number; moved: boolean } | null>(
    null,
  );

  // Criação de spot pelo próprio jogador: um retângulo, as duas pontas da
  // diagonal. No computador, arrasta; no celular (toque), uma mira fixa no
  // centro marca um canto e depois o outro — o dedo arrasta o mapa por baixo.
  const [creating, setCreating] = useState(false);
  const [rect, setRect] = useState<{ a: PlainPoint; b: PlainPoint } | null>(null);
  /** Com o mouse, o canto B segue o ponteiro; é ref para não perder o primeiro movimento. */
  const drawing = useRef(false);
  /** Na mira, o canto B segue o centro da tela até o segundo toque. */
  const [aimLive, setAimLive] = useState(false);
  const [coarse, setCoarse] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const aim = creating && coarse;

  useEffect(() => {
    setCoarse(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  /** Tamanho do mapa sem zoom, para a mira saber que ponto está no centro. */
  function boxSize() {
    const rect = boxRef.current?.getBoundingClientRect();
    return { w: rect?.width ?? 1, h: rect?.height ?? 1 };
  }

  function clampPan(next: { x: number; y: number }) {
    if (!aim) return next;
    const { w, h } = boxSize();
    return {
      x: Math.max(-w / 2, Math.min(w / 2, next.x)),
      y: Math.max(-h / 2, Math.min(h / 2, next.y)),
    };
  }

  function startCreating() {
    setDialog(null);
    setRect(null);
    setAimLive(false);
    setCreating(true);
  }

  function stopCreating() {
    setCreating(false);
    setRect(null);
    setAimLive(false);
    drawing.current = false;
    if (scale === 1) setPan({ x: 0, y: 0 });
  }

  function clearDraft() {
    setRect(null);
    setAimLive(false);
    drawing.current = false;
  }

  /** Ponto do mapa sob o ponteiro, em 0–1. */
  function pointAt(event: React.PointerEvent): PlainPoint | null {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return null;
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    return {
      x: clamp((event.clientX - box.left) / box.width),
      y: clamp((event.clientY - box.top) / box.height),
    };
  }

  /** Ponto sob a mira: o centro do painel, descontado o arrasto do mapa. */
  function aimPoint(): PlainPoint {
    const { w, h } = boxSize();
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    return { x: clamp(0.5 - pan.x / w), y: clamp(0.5 - pan.y / h) };
  }

  /** Celular: o primeiro toque fixa um canto, o segundo fecha o retângulo. */
  function markAimCorner() {
    const point = aimPoint();
    if (!rect || !aimLive) {
      setRect({ a: point, b: point });
      setAimLive(true);
      return;
    }
    setRect({ a: rect.a, b: point });
    setAimLive(false);
  }

  function confirmCustom() {
    if (size !== "ok" || !rect) return;
    const points = draft;
    startTransition(async () => {
      const zoneId = `c_${Date.now()}`;
      const label = `Spot de ${myTeam?.names[0] ?? "sua equipe"}`;
      setZones((current) => [
        ...current,
        { id: zoneId, label, points, custom: true },
      ]);
      if (myKey) {
        setTeams((current) =>
          current.map((team) => (team.key === myKey ? { ...team, zoneId } : team)),
        );
      }
      stopCreating();
      setSelectedId(zoneId);
      setDialog({ kind: "placed", zoneId, label });
    });
  }

  // Na mira, mover o mapa é mover o segundo canto: o retângulo cresce junto.
  useEffect(() => {
    if (!aimLive) return;
    const { w, h } = boxSize();
    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const point = { x: clamp(0.5 - pan.x / w), y: clamp(0.5 - pan.y / h) };
    setRect((current) => (current ? { a: current.a, b: point } : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pan, aimLive]);

  // Teclado no modo de criação: Enter confirma, Esc cancela, Ctrl+Z desfaz.
  useEffect(() => {
    if (!creating || dialog) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") stopCreating();
      if (event.key === "Enter") confirmCustom();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
        clearDraft();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // O retângulo vira os quatro cantos que o servidor espera, e o tamanho é
  // conferido com a mesma conta dele — o botão nunca promete um spot recusado.
  const draft = rect ? rectCorners(rect.a, rect.b) : [];
  const size: AreaCheck | "none" = rect ? checkArea(draft) : "none";
  const draftColor = size === "ok" ? "#ffb020" : "#ff3a3a";

  function stateOf(zoneId: string): ZoneState {
    const count = teamsByZone.get(zoneId)?.length ?? 0;
    const mine = zoneId === myZoneId;
    if (count > 1) return mine ? "mineContested" : "contested";
    if (count === 1) return mine ? "mine" : "taken";
    return "free";
  }

  function run(
    action: () => Promise<{ error: string | null }>,
    onDone?: () => void,
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setDialog({ kind: "error", message: result.error });
        return;
      }
      onDone?.();
    });
  }

  function place(zoneId: string) {
    setSelectedId(zoneId);
    run(async () => {
      if (!myKey) return { error: "Sem equipe para marcar." };
      setTeams((current) =>
        current.map((team) => (team.key === myKey ? { ...team, zoneId } : team)),
      );
      return { error: null };
    }, () => setDialog({ kind: "placed", zoneId }));
  }

  function release() {
    run(async () => {
      if (!myKey) return { error: "Sem equipe para desmarcar." };
      setTeams((current) =>
        current.map((team) =>
          team.key === myKey ? { ...team, zoneId: null } : team,
        ),
      );
      return { error: null };
    }, () => {
      setDialog(null);
      setSelectedId(null);
    });
  }

  function staffSet(teamKey: string, zoneId: string | null) {
    run(async () => {
      setTeams((current) =>
        current.map((team) => (team.key === teamKey ? { ...team, zoneId } : team)),
      );
      return { error: null };
    });
  }

  /**
   * O clique no spot É a marcação. As equipes já vêm definidas pela lista,
   * então não há o que confirmar na primeira vez — só trocar e desmarcar pedem
   * confirmação, porque desfazem algo que já estava valendo.
   */
  function onZoneClick(zone: PlainZone) {
    if (dragging.current?.moved || pending || creating) return;
    setSelectedId(zone.id);

    if (manage) return setDialog({ kind: "staffZone", zoneId: zone.id });
    if (!canMark || closed) return setDialog({ kind: "info", zoneId: zone.id });
    if (!myZoneId) return place(zone.id);
    if (myZoneId === zone.id)
      return setDialog({ kind: "confirmRelease", zoneId: zone.id });
    setDialog({ kind: "confirmMove", fromId: myZoneId, toId: zone.id });
  }

  function onTeamClick(team: PlainTeam) {
    if (manage) return setDialog({ kind: "staffTeam", teamKey: team.key });
    if (team.zoneId) setSelectedId(team.zoneId);
  }

  const selected = selectedId ? (zoneById.get(selectedId) ?? null) : null;
  const hovered = hoverZoneId ? (zoneById.get(hoverZoneId) ?? null) : null;

  const markedTeams = teams.filter((team) => team.zoneId).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">{toolbar}</div>
        <div className="ml-auto flex items-center gap-2">
          {shareUrl ? (
            <button
              type="button"
              onClick={async () => {
                const url = new URL(shareUrl, window.location.origin).toString();
                try {
                  if (typeof navigator.share === "function") await navigator.share({ url });
                  else {
                    await navigator.clipboard.writeText(url);
                    setShared(true);
                    window.setTimeout(() => setShared(false), 2200);
                  }
                } catch {
                  window.prompt(t.share, url);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-edge bg-ground-2 px-3 py-2 font-display text-sm text-ink-2 transition hover:border-edge-strong hover:text-ink"
            >
              <ShareIcon />
              {shared ? t.shareCopied : t.share}
            </button>
          ) : null}
          <div className="inline-flex items-center gap-2 rounded-lg border border-edge bg-ground-2 px-3.5 py-2 font-display text-sm text-ink-2">
          <UsersIcon />
          <span className="tabular-nums">
            <b className="font-semibold text-ink">
              {markedPlayers}/{totalPlayers}
            </b>{" "}
            {t.playersMarked}
          </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        {/* ---------------- Lista de equipes ---------------- */}
        <aside className={broadcast ? "hidden" : "order-2 flex max-h-[70vh] flex-col overflow-hidden rounded-xl border border-edge bg-ground-2 lg:order-1 lg:h-[calc(100dvh-340px)] lg:max-h-[calc(100dvh-340px)] lg:min-h-[480px] lg:w-[380px] lg:shrink-0 xl:w-[430px]"}>
          <div className="flex flex-col gap-2.5 border-b border-edge bg-white/[0.02] px-3 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-sm font-semibold text-ink">{t.teams}</h2>
              <span className="text-xs text-ink-4 tabular-nums">
                {fill(t.withSpot, { n: markedTeams, total: teams.length })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">{t.searchPlayer}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.searchPlayer}
                  className="w-full rounded-lg border border-edge bg-ground px-3 py-1.5 text-sm outline-none transition placeholder:text-ink-4 focus:border-edge-strong"
                />
              </label>
              <button
                type="button"
                onClick={() => setOnlyUnmarked((value) => !value)}
                aria-pressed={onlyUnmarked}
                title={t.onlyUnmarkedTitle}
                className={
                  onlyUnmarked
                    ? "shrink-0 rounded-lg border border-amber/60 bg-amber/15 px-2.5 py-1.5 text-xs font-semibold text-amber"
                    : "shrink-0 rounded-lg border border-edge px-2.5 py-1.5 text-xs text-ink-3 transition hover:border-edge-strong hover:text-ink"
                }
              >
                {t.onlyUnmarked}
              </button>
              {myZoneId ? (
                <button
                  type="button"
                  onClick={() => setSelectedId(myZoneId)}
                  title={t.mySpotTitle}
                  className="shrink-0 rounded-lg border border-signal/50 bg-signal/10 px-2.5 py-1.5 text-xs font-semibold text-signal transition hover:bg-signal/20"
                >
                  {t.mySpot}
                </button>
              ) : null}
            </div>
          </div>

          {teams.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-4">
              {t.noTeams}
            </p>
          ) : visibleTeams.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-4">
              {onlyUnmarked && !query.trim() ? t.allMarked : t.noneFound}
            </p>
          ) : (
            <ul
              data-lenis-prevent
              className="flex flex-1 flex-col divide-y divide-white/[0.05] overflow-y-auto [scrollbar-color:var(--color-signal-deep)_transparent] [scrollbar-width:thin]"
            >
              {visibleTeams.map((team) => {
                const mine = team.key === myKey;
                const zoneLabel = team.zoneId ? zoneById.get(team.zoneId)?.label : null;
                const active =
                  Boolean(team.zoneId) &&
                  (team.zoneId === selectedId || team.zoneId === hoverZoneId);
                // A borda é identidade, não estado: fica na cor do destaque
                // mesmo com o mouse em cima. Só "sua equipe" tem precedência.
                const top = team.topTag ? highlights[team.topTag] : null;
                return (
                  <li
                    key={team.key}
                    ref={(node) => {
                      if (node) rowRefs.current.set(team.key, node);
                      else rowRefs.current.delete(team.key);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onTeamClick(team)}
                      onMouseEnter={() => setHoverZoneId(team.zoneId)}
                      onMouseLeave={() => setHoverZoneId(null)}
                      onFocus={() => setHoverZoneId(team.zoneId)}
                      onBlur={() => setHoverZoneId(null)}
                      title={zoneLabel ? fill(t.spotOf, { label: zoneLabel }) : t.withoutSpot}
                      className={[
                        "flex w-full items-center gap-2.5 border-l-2 px-3 py-2.5 text-left transition",
                        mine
                          ? "border-l-signal bg-signal/[0.09] hover:bg-signal/[0.14]"
                          : active
                            ? "border-l-white/35 bg-white/[0.07]"
                            : "border-l-transparent hover:border-l-white/20 hover:bg-white/[0.04]",
                      ].join(" ")}
                      style={top && !mine ? { borderLeftColor: top.color } : undefined}
                    >
                      <StatusMark marked={Boolean(team.zoneId)} size={22} t={t} />
                      <TeamNames
                        names={team.names}
                        marked={Boolean(team.zoneId)}
                        tags={team.tags}
                        styles={highlights}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {blockedReason ? (
            <p className="border-t border-edge px-4 py-3 text-xs leading-relaxed text-ink-3">
              {blockedReason}
            </p>
          ) : null}
        </aside>

        {/* ---------------- Mapa ---------------- */}
        <div
          className={
            broadcast
              ? "fixed inset-0 z-50 min-w-0 overflow-hidden border-0 bg-[#08100b] [container-type:size]"
              : "relative order-1 h-[min(94vw,70dvh)] min-w-0 overflow-hidden rounded-xl border border-edge bg-[#08100b] lg:order-2 lg:h-[calc(100dvh-340px)] lg:max-h-[calc(100dvh-340px)] lg:min-h-[480px] lg:flex-1"
          }
          aria-busy={pending}
          onPointerDown={(event) => {
            // Desenhando, o arrasto é do retângulo. Shift (ou outro botão do
            // mouse) continua movendo o mapa, para alcançar o canto da ilha
            // sem sair do modo de criação.
            if (creating && !aim && event.button === 0 && !event.shiftKey) return;
            if (scale === 1 && !aim) return;
            dragging.current = {
              x: event.clientX,
              y: event.clientY,
              moved: false,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragging.current;
            if (!drag) return;
            const dx = event.clientX - drag.x;
            const dy = event.clientY - drag.y;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;
            drag.x = event.clientX;
            drag.y = event.clientY;
            setPan((current) =>
              clampPan({
                x: current.x + dx / scale,
                y: current.y + dy / scale,
              }),
            );
          }}
          onPointerUp={() => {
            // Arrastar não deve marcar spot ao soltar o dedo.
            setTimeout(() => (dragging.current = null), 0);
          }}
          onPointerLeave={() => (dragging.current = null)}
          style={{
            cursor: pending
              ? "progress"
              : creating && !aim
                ? "crosshair"
                : scale > 1 || aim
                  ? "grab"
                  : "default",
            // Com zoom (ou mira), o dedo arrasta o mapa; sem, rola a página.
            touchAction: scale > 1 || aim ? "none" : "auto",
          }}
        >
          <div className="absolute inset-0 grid place-items-center p-3">
            <div
              ref={boxRef}
              className="relative max-h-full max-w-full"
              style={{
                aspectRatio: aspect,
                height: "100%",
                width: "auto",
              }}
            >
              <div
                className="absolute inset-0 origin-center transition-transform duration-150"
                style={{
                  transform: `scale(${scale}) translate(${pan.x}px, ${pan.y}px)`,
                }}
              >
                <img
                  src={mapImage}
                  alt={t.mapAlt}
                  className="absolute inset-0 block size-full select-none"
                  draggable={false}
                  onLoad={(event) => {
                    const image = event.currentTarget;
                    if (image.naturalWidth && image.naturalHeight) {
                      setAspect(image.naturalWidth / image.naturalHeight);
                    }
                  }}
                />

                <svg
                  ref={svgRef}
                  viewBox="0 0 1 1"
                  preserveAspectRatio="none"
                  className="absolute inset-0 size-full"
                >
                  <defs>
                    {/* Marca d'água dentro de cada spot. O ladrilho precisa ser
                        bem menor que um spot (~0.12 de largura), senão cabe
                        menos de uma logo e o que aparece é um borrão. */}
                    <pattern
                      id="ms-watermark"
                      patternUnits="userSpaceOnUse"
                      width="0.075"
                      height="0.075"
                      patternTransform="rotate(-30)"
                    >
                      <image
                        href="/images/logo_full.png"
                        x="0"
                        y="0.028"
                        width="0.07"
                        height="0.019"
                        opacity="0.3"
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </pattern>
                  </defs>

                  {zones.map((zone) => {
                    const state = stateOf(zone.id);
                    const disputado =
                      state === "contested" || state === "mineContested";
                    const points = zone.points
                      .map((p) => `${p.x},${p.y}`)
                      .join(" ");

                    return (
                      <g key={zone.id}>
                        {/* Camada 1: preenchimento do estado, com um traço
                            preto mais largo por baixo — a borda colorida ganha
                            um vinco escuro e para de sumir sobre terreno claro. */}
                        <polygon
                          points={points}
                          className={disputado ? "zone-contested" : ""}
                          fill={FILL[state]}
                          stroke="rgba(0,0,0,.85)"
                          strokeWidth={STROKE_WIDTH[state] + 3}
                          vectorEffect="non-scaling-stroke"
                          pointerEvents="none"
                        />
                        {/* Camada 2: marca d'água e a borda colorida por cima. */}
                        <polygon
                          points={points}
                          onClick={() => onZoneClick(zone)}
                          className="cursor-pointer"
                          fill="url(#ms-watermark)"
                          stroke={STROKE[state]}
                          strokeWidth={STROKE_WIDTH[state]}
                          // Tracejado: spot desenhado por jogador, não pela staff.
                          strokeDasharray={zone.custom ? "7 4" : undefined}
                          vectorEffect="non-scaling-stroke"
                          pointerEvents={creating ? "none" : undefined}
                        >
                          <title>{zone.label}</title>
                        </polygon>
                      </g>
                    );
                  })}

                  {/* Passar o mouse numa equipe da lista acende o spot dela. */}
                  {hovered && hovered.id !== selected?.id ? (
                    <polygon
                      points={hovered.points
                        .map((p) => `${p.x},${p.y}`)
                        .join(" ")}
                      fill="rgba(255,255,255,.12)"
                      stroke="#ffffff"
                      strokeWidth={3}
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  ) : null}

                  {creating && rect ? (
                    // Vermelho enquanto o tamanho não serve: a pessoa corrige
                    // ainda com o dedo no botão, não depois de confirmar.
                    <polygon
                      points={draft.map((p) => `${p.x},${p.y}`).join(" ")}
                      fill={size === "ok" ? "rgba(255,176,32,.28)" : "rgba(255,58,58,.25)"}
                      stroke={draftColor}
                      strokeWidth={2.5}
                      strokeDasharray={size === "ok" ? undefined : "6 4"}
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  ) : null}

                  {creating && !aim ? (
                    <rect
                      x="0"
                      y="0"
                      width="1"
                      height="1"
                      fill="transparent"
                      onPointerDown={(event) => {
                        if (event.button !== 0 || event.shiftKey) return;
                        const point = pointAt(event);
                        if (!point) return;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        drawing.current = true;
                        setRect({ a: point, b: point });
                      }}
                      onPointerMove={(event) => {
                        if (!drawing.current) return;
                        const point = pointAt(event);
                        if (point) {
                          setRect((current) =>
                            current ? { a: current.a, b: point } : current,
                          );
                        }
                      }}
                      onPointerUp={() => (drawing.current = false)}
                      onPointerCancel={() => (drawing.current = false)}
                    />
                  ) : null}

                  {/* A seleção é um contorno POR CIMA, não uma troca de cor: o
                      spot continua dizendo o seu estado enquanto está
                      selecionado. */}
                  {selected ? (
                    <polygon
                      className="zone-selected"
                      points={selected.points
                        .map((p) => `${p.x},${p.y}`)
                        .join(" ")}
                      fill="none"
                      stroke="#5ad8ff"
                      strokeWidth={4}
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  ) : null}
                </svg>

                {showLabels
                  ? zones.map((zone) => {
                      const state = stateOf(zone.id);
                      const list = teamsByZone.get(zone.id) ?? [];
                      const cx =
                        zone.points.reduce((sum, p) => sum + p.x, 0) /
                        zone.points.length;
                      const cy =
                        zone.points.reduce((sum, p) => sum + p.y, 0) /
                        zone.points.length;

                      return (
                        <span
                          key={zone.id}
                          style={{
                            left: `${cx * 100}%`,
                            top: `${cy * 100}%`,
                            // O nome acompanha o mapa (cqmin, o lado curto do
                            // painel — que é o que limita a imagem) e é dividido
                            // pelo zoom, para ficar do mesmo tamanho na tela em
                            // qualquer aproximação. Medida apertada de propósito:
                            // num evento cheio, o que atrapalha a leitura é um
                            // nome passar por cima do outro.
                            fontSize: `calc(clamp(9px, 1.6cqmin, 16px) / ${scale})`,
                            // Spot disputado junta várias equipes numa linha
                            // só, que fica larga e invade o vizinho. Com teto de
                            // largura, a linha quebra no espaço entre os nomes —
                            // nick nenhum é cortado nem partido ao meio.
                            maxWidth: `calc(24cqmin / ${scale})`,
                            transform: "translate(-50%, -50%)",
                            color: LABEL_COLOR[state],
                          }}
                          className="map-label pointer-events-none absolute flex flex-col items-center text-balance text-center"
                        >
                          {list.length === 0 ? null : list.length === 1 ? (
                            // Uma equipe: um nome por linha, como nos mapas da
                            // comunidade.
                            list[0].names.map((name, index) => (
                              <span key={`${name}-${index}`}>{name}</span>
                            ))
                          ) : (
                            // Disputa: uma linha por equipe.
                            list.map((team) => (
                              <span key={team.key}>{team.names.join(" ")}</span>
                            ))
                          )}
                        </span>
                      );
                    })
                  : null}

                {/* Na mira, o primeiro canto fica marcado enquanto o mapa anda. */}
                {aim && rect ? (
                  <span
                    aria-hidden
                    style={{
                      left: `${rect.a.x * 100}%`,
                      top: `${rect.a.y * 100}%`,
                      transform: `translate(-50%, -50%) scale(${1 / scale})`,
                    }}
                    className="pointer-events-none absolute size-3 rounded-full border-2 border-ground bg-amber shadow-[0_0_0_2px_#ffb020]"
                  />
                ) : null}
              </div>
            </div>
          </div>

          {/* Mira do celular: fixa no centro; o mapa anda por baixo. */}
          {aim ? (
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
            >
              <svg viewBox="0 0 48 48" width="48" height="48">
                <circle
                  cx="24"
                  cy="24"
                  r="10"
                  fill="none"
                  stroke="#000"
                  strokeWidth="4"
                  opacity="0.6"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="10"
                  fill="none"
                  stroke="#ffb020"
                  strokeWidth="2"
                />
                <path
                  d="M24 2v12M24 34v12M2 24h12M34 24h12"
                  stroke="#000"
                  strokeWidth="4"
                  opacity="0.6"
                />
                <path
                  d="M24 2v12M24 34v12M2 24h12M34 24h12"
                  stroke="#ffb020"
                  strokeWidth="2"
                />
                <circle cx="24" cy="24" r="1.8" fill="#ffb020" />
              </svg>
            </div>
          ) : null}

          {/* Marca d'água do painel inteiro, por cima do mapa: print de mapa
              circula no Discord de todo mundo, e a origem vai junto. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: PANEL_WATERMARK,
              backgroundSize: "360px 360px",
            }}
          />

          {/* Selo da marca: é o que identifica a origem quando o print do mapa
              roda no Discord. */}
          <div
            aria-hidden
            className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-2 rounded-lg border border-white/10 bg-black/55 px-2.5 py-1.5 backdrop-blur-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo_full.png" alt="" className="h-4 w-auto opacity-90" />
            <span className="font-display text-[11px] font-bold tracking-wider text-white/80">
              MAJORSCRIMS.COM
            </span>
          </div>

          <div className="absolute left-3 top-3 flex max-w-[60%] flex-col items-start gap-1.5">
            {isStaff && !creating ? (
              <button
                type="button"
                onClick={() => {
                  setManage((value) => !value);
                  setDialog(null);
                }}
                aria-pressed={manage}
                className={
                  manage
                    ? "rounded-lg border border-amber/70 bg-amber/20 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-amber backdrop-blur-sm"
                    : "rounded-lg border border-white/15 bg-black/60 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-ink-2 backdrop-blur-sm transition hover:text-ink"
                }
              >
                {manage ? t.managing : t.manage}
              </button>
            ) : null}

            {/* Só aparece para quem pode marcar: quem usa os spots da staff
                nunca precisa passar por aqui. */}
            {canMark && !closed && !manage && !creating ? (
              <button
                type="button"
                onClick={startCreating}
                className="flex items-center gap-2 rounded-lg border border-amber/60 bg-black/70 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-amber backdrop-blur-sm transition hover:bg-amber/15"
              >
                <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden>
                  <path
                    d="M10 4v12M4 10h12"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                </svg>
                {t.createSpot}
              </button>
            ) : null}

            {closed ? (
              <span className="rounded-lg border border-danger/50 bg-black/70 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wider text-danger backdrop-blur-sm">
                {t.markingClosed}
              </span>
            ) : closesAt && !creating ? (
              <span className="rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 font-display text-[11px] font-semibold text-ink-3 backdrop-blur-sm">
                {fill(t.markingUntil, {
                  date: new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "America/Sao_Paulo",
                  }).format(new Date(closesAt)),
                })}
              </span>
            ) : null}
          </div>

          {/* Barra do modo de criação: só existe enquanto o jogador desenha. */}
          {creating ? (
            <div className="absolute inset-x-3 bottom-3 z-20 flex flex-col gap-2.5 rounded-xl border border-amber/40 bg-black/85 p-3 backdrop-blur-sm sm:left-1/2 sm:right-auto sm:w-[min(560px,calc(100%-24px))] sm:-translate-x-1/2">
              {/* No celular a dica ocupa a linha inteira e o aviso cai para a
                  de baixo: lado a lado, a dica virava uma palavra por linha. */}
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="min-w-[13rem] flex-1 font-display text-sm font-semibold text-amber">
                  {aim ? t.aimHint : t.clickHint}
                </span>
                {size === "small" || size === "big" ? (
                  <span className="font-display text-xs font-semibold text-danger">
                    {size === "small" ? t.tooSmall : t.tooBig}
                  </span>
                ) : !aim && scale > 1 ? (
                  <span className="text-xs text-ink-4">{t.panHint}</span>
                ) : null}
              </div>
              {myZoneId ? (
                <span className="text-xs text-ink-3">
                  {fill(t.leavingFrom, { label: zoneById.get(myZoneId)?.label ?? "" })}
                </span>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {aim ? (
                  <button
                    type="button"
                    onClick={markAimCorner}
                    className="btn-ghost !border-amber/60 !px-3 !py-2 !text-amber"
                  >
                    {aimLive ? t.closeRect : t.addCorner}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={clearDraft}
                  disabled={!rect}
                  className="btn-ghost !px-3 !py-2 disabled:opacity-40"
                >
                  {t.undo}
                </button>
                <button
                  type="button"
                  onClick={stopCreating}
                  className="btn-ghost !px-3 !py-2"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={confirmCustom}
                  disabled={size !== "ok" || pending}
                  className="btn-primary ml-auto !px-4 !py-2 disabled:opacity-40"
                >
                  {pending ? t.saving : t.confirmSpot}
                </button>
              </div>
            </div>
          ) : null}

          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            <ZoomButton
              label={broadcast ? t.broadcastOff : t.broadcastOn}
              onClick={() => setBroadcast((value) => !value)}
            >
              <BroadcastIcon on={broadcast} />
            </ZoomButton>
            <ZoomButton
              label={showLabels ? t.hideNames : t.showNames}
              onClick={() => setShowLabels((value) => !value)}
            >
              <EyeIcon off={!showLabels} />
            </ZoomButton>
            <ZoomButton
              label={t.zoomIn}
              onClick={() => setScale((s) => Math.min(MAX_SCALE, s + 0.5))}
            >
              <ZoomInIcon />
            </ZoomButton>
            <ZoomButton
              label={t.zoomOut}
              onClick={() => setScale((s) => Math.max(1, s - 0.5))}
            >
              <ZoomOutIcon />
            </ZoomButton>
            <ZoomButton
              label={t.fit}
              onClick={() => {
                setScale(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              <FitIcon />
            </ZoomButton>
          </div>

          {creating ? null : <Legend t={t} highlights={usedHighlights} />}
        </div>
      </div>
      {dialog ? (
        <MapDialog
          t={t}
          dialog={dialog}
          pending={pending}
          zoneById={zoneById}
          teams={teams}
          teamsByZone={teamsByZone}
          zones={zones}
          blockedReason={blockedReason}
          onClose={closeDialog}
          onConfirmMove={(zoneId) => {
            setDialog(null);
            place(zoneId);
          }}
          onConfirmRelease={release}
          onStaffSet={staffSet}
          stateLabel={(zoneId) => {
            const count = teamsByZone.get(zoneId)?.length ?? 0;
            return count === 0
              ? t.stateFree
              : count === 1
                ? t.stateOne
                : fill(t.stateMany, { n: count });
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */

function MapDialog({
  t,
  dialog,
  pending,
  zoneById,
  zones,
  teams,
  teamsByZone,
  blockedReason,
  onClose,
  onConfirmMove,
  onConfirmRelease,
  onStaffSet,
  stateLabel,
}: {
  t: Labels;
  dialog: Dialog;
  pending: boolean;
  zoneById: Map<string, PlainZone>;
  zones: PlainZone[];
  teams: PlainTeam[];
  teamsByZone: Map<string, PlainTeam[]>;
  blockedReason: string | null;
  onClose: () => void;
  onConfirmMove: (zoneId: string) => void;
  onConfirmRelease: () => void;
  onStaffSet: (teamKey: string, zoneId: string | null) => void;
  stateLabel: (zoneId: string) => string;
}) {
  // "Spot definido" some sozinho: é aviso, não pergunta.
  useEffect(() => {
    if (dialog.kind !== "placed") return;
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [dialog, onClose]);

  const label = (zoneId: string) =>
    zoneById.get(zoneId)?.label ??
    (dialog.kind === "placed" && dialog.label ? dialog.label : t.removedSpot);

  switch (dialog.kind) {
    case "placed":
      return (
        <Modal onClose={onClose} title={t.placedTitle}>
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <StatusMark marked size={48} t={t} />
            <p className="font-display text-2xl font-bold uppercase text-signal">
              {label(dialog.zoneId)}
            </p>
            <p className="text-sm text-ink-3">
              {t.placedBody}
            </p>
          </div>
          <ModalActions>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="btn-primary flex-1"
            >
              {t.close}
            </button>
          </ModalActions>
        </Modal>
      );

    case "confirmMove":
      return (
        <Modal onClose={onClose} title={t.moveTitle}>
          <div className="flex items-center justify-center gap-3 py-3">
            <SpotChip>{label(dialog.fromId)}</SpotChip>
            <span aria-hidden className="text-lg text-ink-3">
              →
            </span>
            <SpotChip strong>{label(dialog.toId)}</SpotChip>
          </div>
          <p className="text-center text-sm text-ink-3">
            {fill(t.moveBody, { from: label(dialog.fromId), to: label(dialog.toId) })}
          </p>
          <ModalActions>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              autoFocus
              disabled={pending}
              onClick={() => onConfirmMove(dialog.toId)}
              className="btn-primary flex-1"
            >
              {t.moveConfirm}
            </button>
          </ModalActions>
        </Modal>
      );

    case "confirmRelease":
      return (
        <Modal onClose={onClose} title={t.releaseTitle}>
          <p className="py-2 text-center text-sm text-ink-3">
            {fill(t.releaseBody, { label: label(dialog.zoneId) })}
          </p>
          <ModalActions>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirmRelease}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-danger px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-danger/85 disabled:opacity-50"
            >
              {pending ? t.releasing : t.release}
            </button>
          </ModalActions>
        </Modal>
      );

    case "error":
      return (
        <Modal onClose={onClose} title={t.errorTitle}>
          <p className="py-2 text-center text-sm text-ink-2">
            {dialog.message}
          </p>
          <ModalActions>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              {t.gotIt}
            </button>
          </ModalActions>
        </Modal>
      );

    case "info": {
      const list = teamsByZone.get(dialog.zoneId) ?? [];
      return (
        <Modal
          onClose={onClose}
          title={label(dialog.zoneId)}
          subtitle={stateLabel(dialog.zoneId)}
          tone={list.length > 1 ? "danger" : list.length === 0 ? "signal" : undefined}
        >
          {list.length > 0 ? (
            <ul className={list.length > 1 ? "map-modal-teams contested" : "map-modal-teams"}>
              {list.map((team, index) => (
                <li key={team.key}>
                  <span className="map-modal-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="map-modal-names">
                    {team.names.map((name) => (
                      <b key={name}>{name}</b>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          {blockedReason ? <p className="map-modal-note">{blockedReason}</p> : null}
          <ModalActions>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              {t.close}
            </button>
          </ModalActions>
        </Modal>
      );
    }

    case "staffZone": {
      const zoneId = dialog.zoneId;
      const here = teamsByZone.get(zoneId) ?? [];
      const others = teams.filter((team) => team.zoneId !== zoneId);
      return (
        <Modal
          onClose={onClose}
          title={label(zoneId)}
          subtitle={fill(t.staffState, { state: stateLabel(zoneId) })}
          wide
        >
          {here.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {here.map((team) => (
                <li
                  key={team.key}
                  className="flex flex-col gap-2 rounded-lg border border-edge px-3 py-2.5 sm:flex-row sm:items-center"
                >
                  <span className="min-w-0 flex-1 break-words font-display text-sm font-semibold">
                    {team.names.join(" / ")}
                  </span>
                  <div className="flex items-center gap-2">
                    <ZoneSelect
                      zones={zones}
                      exclude={zoneId}
                      placeholder={t.moveTo}
                      disabled={pending}
                      onPick={(target) => onStaffSet(team.key, target)}
                    />
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onStaffSet(team.key, null)}
                      className="rounded-lg border border-danger/50 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
                    >
                      {t.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-4">{t.noTeamHere}</p>
          )}

          <div className="mt-4 flex flex-col gap-2 border-t border-edge pt-4">
            <span className="font-display text-xs font-semibold uppercase tracking-wider text-ink-3">
              {t.placeTeamHere}
            </span>
            <TeamSelect
              t={t}
              teams={others}
              zoneById={zoneById}
              disabled={pending}
              onPick={(teamKey) => onStaffSet(teamKey, zoneId)}
            />
          </div>

          <ModalActions>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              {pending ? t.saving : t.close}
            </button>
          </ModalActions>
        </Modal>
      );
    }

    case "staffTeam": {
      const team = teams.find((item) => item.key === dialog.teamKey);
      if (!team) return null;
      return (
        <Modal
          onClose={onClose}
          title={team.names.join(" / ")}
          subtitle={
            team.zoneId
              ? fill(t.staffIn, { label: label(team.zoneId) })
              : t.staffNoSpot
          }
        >
          <div className="flex flex-col gap-3">
            <ZoneSelect
              zones={zones}
              exclude={team.zoneId}
              placeholder={team.zoneId ? t.moveTo : t.placeIn}
              disabled={pending}
              onPick={(target) => onStaffSet(team.key, target)}
            />
            {team.zoneId ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onStaffSet(team.key, null)}
                className="rounded-lg border border-danger/50 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/10 disabled:opacity-50"
              >
                {t.removeFromSpot}
              </button>
            ) : null}
          </div>
          <ModalActions>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              {pending ? t.saving : t.close}
            </button>
          </ModalActions>
        </Modal>
      );
    }
  }
}

function Modal({
  title,
  subtitle,
  wide,
  tone,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  wide?: boolean;
  tone?: "signal" | "danger";
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Pop-up aberto: a roda do mouse não rola a página por trás.
  useEffect(() => {
    lockScroll();
    return unlockScroll;
  }, []);

  return (
    <div
      data-lenis-prevent
      className="map-modal-backdrop"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={`map-modal${wide ? " wide" : ""}${tone ? ` tone-${tone}` : ""}`}
      >
        <header className="map-modal-head">
          <div>
            {subtitle ? (
              <span className={tone ? `map-modal-kicker ${tone}` : "map-modal-kicker"}>
                {subtitle}
              </span>
            ) : null}
            <h3>{title}</h3>
          </div>
          <button type="button" className="map-modal-x" onClick={onClose} aria-label="Fechar">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
              <path d="M3.2 3.2 12.8 12.8M12.8 3.2 3.2 12.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="map-modal-actions">{children}</div>;
}

function SpotChip({
  children,
  strong,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <span
      className={
        strong
          ? "rounded-lg border border-signal/60 bg-signal/15 px-3 py-1.5 font-display text-sm font-bold uppercase text-signal"
          : "rounded-lg border border-edge bg-white/5 px-3 py-1.5 font-display text-sm font-bold uppercase text-ink-2"
      }
    >
      {children}
    </span>
  );
}

const SELECT_CLASS =
  "min-w-0 flex-1 rounded-lg border border-edge bg-ground px-2.5 py-1.5 text-sm text-ink outline-none focus:border-edge-strong disabled:opacity-50";

function ZoneSelect({
  zones,
  exclude,
  placeholder,
  disabled,
  onPick,
}: {
  zones: PlainZone[];
  exclude: string | null;
  placeholder: string;
  disabled: boolean;
  onPick: (zoneId: string) => void;
}) {
  const sorted = [...zones]
    .filter((zone) => zone.id !== exclude)
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  return (
    <select
      value=""
      disabled={disabled}
      onChange={(event) => event.target.value && onPick(event.target.value)}
      className={SELECT_CLASS}
    >
      <option value="">{placeholder}</option>
      {sorted.map((zone) => (
        <option key={zone.id} value={zone.id}>
          {zone.label}
        </option>
      ))}
    </select>
  );
}

function TeamSelect({
  t,
  teams,
  zoneById,
  disabled,
  onPick,
}: {
  t: Labels;
  teams: PlainTeam[];
  zoneById: Map<string, PlainZone>;
  disabled: boolean;
  onPick: (teamKey: string) => void;
}) {
  const free = teams.filter((team) => !team.zoneId);
  const elsewhere = teams.filter((team) => team.zoneId);
  return (
    <select
      value=""
      disabled={disabled || teams.length === 0}
      onChange={(event) => event.target.value && onPick(event.target.value)}
      className={SELECT_CLASS}
    >
      <option value="">
        {teams.length === 0 ? t.noOtherTeam : t.chooseTeam}
      </option>
      {free.length > 0 ? (
        <optgroup label={t.withoutSpot}>
          {free.map((team) => (
            <option key={team.key} value={team.key}>
              {team.names.join(" / ")}
            </option>
          ))}
        </optgroup>
      ) : null}
      {elsewhere.length > 0 ? (
        <optgroup label={t.inAnotherSpot}>
          {elsewhere.map((team) => (
            <option key={team.key} value={team.key}>
              {team.names.join(" / ")} —{" "}
              {zoneById.get(team.zoneId!)?.label ?? "?"}
            </option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}

/**
 * Status na lista: o check verde cheio é "marcado"; a silhueta do mesmo ícone é
 * "ainda não". Mesma forma nos dois, para a coluna ler como coluna.
 */
/**
 * Nomes da equipe, com a disposição mudando pelo tamanho da fila:
 *  - solo: um nome;
 *  - dupla: os dois na mesma linha;
 *  - trio: capitão em cima, os outros dois embaixo;
 *  - squad: dois e dois.
 * Todos os nomes aparecem — numa lista de drop, sumir com um nome é sumir com
 * a informação que a pessoa veio buscar.
 */
function TeamNames({
  names,
  marked,
  tags,
  styles,
}: {
  names: string[];
  marked: boolean;
  tags?: (string | null)[];
  styles: Record<string, PlainHighlight>;
}) {
  const [first, ...rest] = names;
  // Quem ainda não marcou fica apagado: a diferença se lê de longe, sem
  // depender só do símbolo.
  const lead = marked ? "text-ink" : "text-ink-3";
  const mateTone = marked ? "text-ink-2" : "text-ink-4";

  /** O símbolo do destaque deste jogador, se ele tem um. */
  const markAt = (index: number) => {
    const tag = tags?.[index];
    const style = tag ? styles[tag] : null;
    if (!style) return null;
    return (
      <HighlightMark
        icon={style.icon}
        color={style.color}
        label={style.label}
        size={index === 0 ? 13 : 11}
      />
    );
  };

  const leadName = (
    <span className={`flex min-w-0 items-center gap-1.5 ${lead}`}>
      {markAt(0)}
      <span className="min-w-0 truncate">{first}</span>
    </span>
  );

  // No companheiro, o símbolo do destaque ocupa o lugar do "+": dois sinais
  // antes do mesmo nome seriam ruído.
  const mate = (name: string, index: number) => (
    <span key={`mate-${index}`} className={`flex min-w-0 items-center gap-1 ${mateTone}`}>
      {markAt(index + 1) ?? <span className={marked ? "text-signal" : "text-ink-4"}>+</span>}
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );

  if (rest.length === 0) {
    return (
      <span className="flex min-w-0 flex-1 text-[15px] font-semibold">{leadName}</span>
    );
  }

  if (rest.length === 1) {
    return (
      <span className="flex min-w-0 flex-1 items-center gap-2 text-[15px] font-semibold">
        {leadName}
        {mate(rest[0], 0)}
      </span>
    );
  }

  if (rest.length === 2) {
    return (
      <span className="flex min-w-0 flex-1 flex-col text-[15px] font-semibold leading-tight">
        {leadName}
        <span className="flex min-w-0 gap-2.5">
          {mate(rest[0], 0)}
          {mate(rest[1], 1)}
        </span>
      </span>
    );
  }

  return (
    <span className="grid min-w-0 flex-1 grid-cols-2 gap-x-2.5 text-[15px] font-semibold leading-tight">
      {leadName}
      {rest.map((name, index) => mate(name, index))}
    </span>
  );
}

function StatusMark({ marked, size = 20, t }: { marked: boolean; size?: number; t: Labels }) {
  if (marked) {
    return (
      <svg
        viewBox="0 0 20 20"
        width={size}
        height={size}
        role="img"
        aria-label={t.marked}
        className="shrink-0 drop-shadow-[0_0_6px_rgba(34,217,98,0.45)]"
      >
        <circle cx="10" cy="10" r="9" fill="#22d962" />
        <path
          d="M5.9 10.3l2.7 2.7 5.5-5.9"
          fill="none"
          stroke="#06130a"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      role="img"
      aria-label={t.notMarked}
      className="shrink-0"
    >
      <circle
        cx="10"
        cy="10"
        r="8.25"
        fill="none"
        stroke="rgba(255,255,255,.2)"
        strokeWidth="1.5"
      />
      <path
        d="M5.9 10.3l2.7 2.7 5.5-5.9"
        fill="none"
        stroke="rgba(255,255,255,.2)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Paleta dos spots.
 *
 * Preenchimento fraco e borda grossa: o mapa precisa continuar legível por
 * baixo da marcação. Quem carrega o estado é a cor da borda, não um selo.
 *
 * A borda de "ocupado" é branca, e não preta como nos mapas feitos à mão: um
 * spot pode cair no oceano, onde preto sobre azul-escuro desaparece.
 *
 * Os dois estados de disputa usam cor SÓLIDA: o pulso controla a opacidade por
 * `fill-opacity`, que multiplica o alfa da cor. Cor translúcida somada ao pulso
 * dava um vermelho de 7% — visualmente, nada.
 */
const FILL: Record<ZoneState, string> = {
  free: "rgba(255,255,255,.05)",
  mine: "rgba(34,217,98,.34)",
  taken: "rgba(0,0,0,.38)",
  contested: "#ff3b3b",
  mineContested: "#ff3b3b",
};

const STROKE: Record<ZoneState, string> = {
  free: "rgba(255,255,255,.42)",
  mine: "#22d962",
  taken: "rgba(255,255,255,.92)",
  contested: "#ff6b6b",
  // Borda verde sobre preenchimento vermelho: é seu, e está disputado.
  mineContested: "#22d962",
};

const STROKE_WIDTH: Record<ZoneState, number> = {
  free: 1.5,
  mine: 3,
  taken: 2.5,
  contested: 3.5,
  mineContested: 3.5,
};

/** Cor do nome da equipe. Branco é o padrão; a sua sai em verde para saltar. */
const LABEL_COLOR: Record<ZoneState, string> = {
  free: "rgba(255,255,255,.8)",
  mine: "#22d962",
  taken: "#ffffff",
  contested: "#ffffff",
  mineContested: "#7ef0a6",
};

function ZoomButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-sm text-ink-2 backdrop-blur-sm transition hover:border-edge-strong hover:text-ink"
    >
      {children}
    </button>
  );
}

function Legend({
  t,
  highlights,
}: {
  t: Labels;
  highlights: PlainHighlight[];
}) {
  const items: { state: ZoneState; label: string }[] = [
    { state: "free", label: t.legendFree },
    { state: "mine", label: t.legendMine },
    { state: "taken", label: t.legendTaken },
    { state: "contested", label: t.legendContested },
    { state: "mineContested", label: t.legendMineContested },
  ];

  return (
    <ul className="pointer-events-none absolute bottom-3 left-3 hidden max-w-[70%] flex-wrap items-center gap-x-3.5 gap-y-1 rounded-lg border border-white/10 bg-black/65 px-3 py-1.5 backdrop-blur-sm sm:flex">
      {items.map((item) => (
        <li
          key={item.state}
          className="flex items-center gap-1.5 text-[11px] text-ink-2"
        >
          <span
            className="size-2.5 rounded-[3px] border"
            style={{
              background: FILL[item.state],
              borderColor: STROKE[item.state],
            }}
          />
          {item.label}
        </li>
      ))}

      {/* Os destaques da lista, para quem olha só o mapa saber o que é a borda. */}
      {highlights.length > 0 ? (
        <li aria-hidden className="h-3 w-px bg-white/15" />
      ) : null}
      {highlights.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: item.color }}
        >
          <HighlightMark icon={item.icon} color={item.color} label={item.label} size={11} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * "MAJORSCRIMS.COM" em diagonal, repetido pelo painel. Fonte do sistema de
 * propósito: SVG usado como imagem não carrega fonte da web.
 */
const PANEL_WATERMARK = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'>" +
    "<text x='180' y='190' text-anchor='middle' transform='rotate(-30 180 180)' " +
    "font-family='Arial Black, Arial, sans-serif' font-size='30' font-weight='900' " +
    "letter-spacing='1' fill='white' fill-opacity='0.055'>MAJORSCRIMS.COM</text></svg>",
)}")`;

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="16"
      height="16"
      aria-hidden
      className="text-signal"
    >
      <circle
        cx="7.5"
        cy="6.5"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M2 16.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle
        cx="14"
        cy="7.5"
        r="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M14.5 12.2c1.9.3 3.1 1.6 3.5 3.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 11v4.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V11" />
    </svg>
  );
}

function BroadcastIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      {on ? (
        <>
          <path d="M4 4l16 16" strokeLinecap="round" />
          <rect x="3" y="6" width="18" height="12" rx="2" />
        </>
      ) : (
        <>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M9 21h6M12 18v3" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
      <path
        d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.6" fill="currentColor" />
      {off ? (
        <path
          d="M3 17 17 3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12.4 12.4 17 17M8.5 6.2v4.6M6.2 8.5h4.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden>
      <circle cx="8.5" cy="8.5" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12.4 12.4 17 17M6.2 8.5h4.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden>
      <path
        d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
