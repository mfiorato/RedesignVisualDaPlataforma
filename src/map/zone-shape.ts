export interface Point {
  x: number
  y: number
}

/**
 * A forma de um spot, sem banco e sem React.
 *
 * Mora sozinha porque os dois lados precisam dela: o servidor para validar o
 * que chegou e a tela para avisar, enquanto a pessoa arrasta, que o retângulo
 * ficou pequeno ou grande demais. Mesma conta nos dois lugares — a tela nunca
 * promete um spot que o servidor vai recusar.
 */

/** Menor e maior área aceitas, em fração do mapa (1 = o mapa inteiro). */
// Mínimo pequeno de propósito: no solo o drop pode ser uma casa só.
export const MIN_AREA = 0.00005;
export const MAX_AREA = 0.02;

export function polygonArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

/**
 * Os quatro cantos a partir das duas pontas da diagonal — o gesto de arrastar.
 * Sempre em ordem, sempre alinhado aos eixos.
 */
export function rectCorners(a: Point, b: Point): Point[] {
  const x0 = Math.min(a.x, b.x);
  const x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y);
  const y1 = Math.max(a.y, b.y);
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
}

export type AreaCheck = "ok" | "small" | "big";

export function checkArea(points: Point[]): AreaCheck {
  const area = polygonArea(points);
  if (area < MIN_AREA) return "small";
  if (area > MAX_AREA) return "big";
  return "ok";
}

/**
 * Coloca os cantos em volta do centro. Um retângulo já chega em ordem, mas a
 * forma antiga (clique canto a canto) podia chegar cruzada como uma gravata —
 * e spots desenhados assim continuam no banco.
 */
export function normalizeCustomPolygon(
  raw: Point[],
): { points: Point[] } | { error: string } {
  if (raw.length < 3 || raw.length > 4) {
    return { error: "O spot precisa de 3 ou 4 cantos." };
  }
  if (raw.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
    return { error: "Ponto inválido." };
  }

  const clamp = (value: number) =>
    Math.min(1, Math.max(0, Math.round(value * 10_000) / 10_000));
  const points = raw.map((p) => ({ x: clamp(p.x), y: clamp(p.y) }));

  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  points.sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );

  const check = checkArea(points);
  if (check === "small") {
    return { error: "Spot pequeno demais. Arraste um pouco mais." };
  }
  if (check === "big") {
    return { error: "Spot grande demais. Marque só a área onde você cai." };
  }
  return { points };
}
