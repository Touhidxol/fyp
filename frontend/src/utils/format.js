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

// Compiler verdicts -> student-facing text
const VERDICTS = {
    accepted: 'Passed',
    wrong_answer: 'Wrong answer',
    runtime_error: 'Runtime error',
    compilation_error: 'Compilation error',
    time_limit_exceeded: 'Time limit exceeded',
    memory_limit_exceeded: 'Memory limit exceeded',
    output_limit_exceeded: 'Output limit exceeded',
    skipped: 'Skipped',
    unavailable: 'Not judged',
}

export const verdictLabel = (v) => VERDICTS[v] || v || ''

// colour class for a verdict pill: ok | bad | muted
export const verdictTone = (v) =>
    v === 'accepted' ? 'ok' : v === 'skipped' || v === 'unavailable' ? 'muted' : 'bad'