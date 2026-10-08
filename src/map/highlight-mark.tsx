import type { HighlightIcon } from "./map-types";

/**
 * O símbolo de um destaque, ao lado do nome do jogador.
 *
 * Desenhado à mão e em traço grosso porque aparece a 13px dentro de uma lista
 * apertada: ícone com detalhe fino viraria uma mancha.
 */
const PATHS: Record<Exclude<HighlightIcon, "none">, string> = {
  crown: "M2.4 15.6 3.9 6.2l3.7 3.5L10 3.4l2.4 6.3 3.7-3.5 1.5 9.4z",
  star: "M10 2.4l2.4 5 5.1.7-3.8 3.6.9 5.3L10 14.4l-4.6 2.6.9-5.3L2.5 8.1l5.1-.7z",
  bolt: "M11.9 1.8 4.8 11.4h3.6l-.9 6.8 7.7-10.3h-4.1z",
  shield: "M10 1.8 16.8 4v5.4c0 3.6-2.7 6.6-6.8 8.6-4.1-2-6.8-5-6.8-8.6V4z",
  flame: "M10 1.6c2.4 2.8 4.6 4.6 4.6 7.9A4.6 4.6 0 0 1 10 18.4a4.6 4.6 0 0 1-4.6-4.9c0-1.5.7-2.7 1.7-3.8.1 1.5.7 2.3 1.6 2.6-.4-2.6.2-4.7 1.3-6.6z",
  target:
    "M10 1.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8zm0 2.6a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6zm0 3a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z",
  medal: "M6.2 1.6h7.6l-2.3 4.1H8.5zM10 6.6a5.7 5.7 0 1 0 0 11.4 5.7 5.7 0 0 0 0-11.4zm0 2.5 1 2 2.2.3-1.6 1.6.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.6 2.2-.3z",
};

export function HighlightMark({
  icon,
  color,
  label,
  size = 13,
}: {
  icon: HighlightIcon;
  color: string;
  label: string;
  size?: number;
}) {
  if (icon === "none") {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className="shrink-0 rounded-full"
        style={{ width: size * 0.5, height: size * 0.5, background: color }}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      role="img"
      aria-label={label}
      className="shrink-0"
      style={{ color }}
    >
      <title>{label}</title>
      <path d={PATHS[icon]} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

/** O destaque com o nome ao lado: legenda do mapa e prévia do painel. */
export function HighlightChip({
  icon,
  color,
  label,
  size = 12,
}: {
  icon: HighlightIcon;
  color: string;
  label: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold"
      style={{ borderColor: `${color}66`, color, background: `${color}14` }}
    >
      <HighlightMark icon={icon} color={color} label={label} size={size} />
      {label}
    </span>
  );
}
