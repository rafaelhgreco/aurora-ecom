export function getCameraErrorMessage(error: unknown): string {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError") {
    return "Permissão de câmera negada. Habilite o acesso à câmera nas configurações do navegador.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "Nenhuma câmera disponível neste dispositivo.";
  }
  return "Não foi possível acessar a câmera.";
}
