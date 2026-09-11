/**
 * Dispara o download de um arquivo a partir do seu conteúdo em base64.
 */
export function downloadBase64File(
  base64: string,
  fileName: string,
  mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
