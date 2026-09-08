/**
 * Paleta "aurora" — mesmo espectro roxo → magenta usado no glow do header,
 * estendido com verde-água e azul para dar identidade cromática própria a
 * cada bloco da página Sobre (Missão, Visão e os 4 valores).
 */

export const AURORA_RGB = {
  indigo: "89, 50, 230",
  magenta: "224, 50, 230",
  teal: "45, 198, 178",
  sky: "56, 132, 230",
} as const;

export type AuroraColor = keyof typeof AURORA_RGB;

export function auroraRgba(color: AuroraColor, alpha: number) {
  return `rgba(${AURORA_RGB[color]}, ${alpha})`;
}
