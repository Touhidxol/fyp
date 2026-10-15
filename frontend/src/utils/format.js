export const formatDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
        : ''