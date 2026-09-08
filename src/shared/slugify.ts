/**
 * Utilitários para gerar e validar a URL amigável (slug) de um produto.
 */

const COMBINING_DIACRITICS_REGEX = /[\u0300-\u036f]/g;

/** Converte um texto livre (ex.: título do produto) em um slug de URL. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_REGEX, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150)
    .replace(/-+$/g, "");
}

/** Valida se uma string já está no formato esperado de slug. */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) && slug.length <= 150;
}
