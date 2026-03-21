/**
 * Regras para pausar produto na vitrine (isActive = false).
 *
 * Ao pausar, o estoque é zerado automaticamente (stock=0, stockBySize={}).
 * Assim qualquer produto pode ser pausado, independente de tamanhos cadastrados.
 */

export function canPauseProductOnVitrine(): boolean {
  return true;
}

export function pauseProductOnVitrineBlockedReason(): string {
  return "";
}
