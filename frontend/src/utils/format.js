export const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : ''

// 0 → A, 1 → B, ...
export const optionLabel = (i) => String.fromCharCode(65 + i)

export const initials = (name = '') =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('') || '?'