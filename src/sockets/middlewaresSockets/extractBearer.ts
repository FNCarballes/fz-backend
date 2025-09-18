// src/utils/auth/extractBearer.ts
export function extractBearer(header?: string | string[]): string | null {
    if (!header) return null;
    const value = Array.isArray(header) ? header[0] : header;
    const normalized = value.trim();
    if (!normalized.toLowerCase().startsWith('bearer ')) return null;
    return normalized.slice(7).trim() || null;
}
