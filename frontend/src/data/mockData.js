// Stand-in for the backend/API. Each notebook is a "room": documents +
// their summaries, plus the tests generated from that notebook's context.
// Once the real API exists, these three exports are what it should return.

export const notebooks = [
    {
        id: 'nb-organic-chem',
        title: 'Organic Chemistry — Ch. 6–8',
        subject: 'Chemistry',
        updatedAt: '2026-09-16',
        documents: [
            {
                id: 'doc-1',
                name: 'Ch6 - Alkenes and Alkynes.pdf',
                pages: 22,
                summary:
                    "Addition reactions, Markovnikov's rule, and hydroboration-oxidation across alkenes and alkynes.",
            },
            {
                id: 'doc-2',
                name: 'Ch7 - Aromatic Compounds.pdf',
                pages: 18,
                summary:
                    'Benzene structure, resonance, and electrophilic aromatic substitution mechanisms.',
            },
            {
                id: 'doc-3',
                name: 'Ch8 - Alcohols and Ethers.pdf',
                pages: 20,
                summary:
                    'Nomenclature, synthesis routes, and reactions of alcohols, ethers, and epoxides.',
            },
        ],
        tests: [
            { id: 'test-1', title: 'Ch. 6–8 practice set', status: 'ready', questions: 20, createdAt: '2026-09-16' },
            { id: 'test-2', title: 'Aromatic compounds quick quiz', status: 'generating', questions: 10, createdAt: '2026-09-18' },
        ],
    },
    {
        id: 'nb-linear-algebra',
        title: 'Linear Algebra Prep',
        subject: 'Math',
        updatedAt: '2026-09-12',
        documents: [
            {
                id: 'doc-4',
                name: 'Matrices and Determinants.pdf',
                pages: 15,
                summary: 'Matrix operations, determinants, and conditions for invertibility.',
            },
        ],
        tests: [
            { id: 'test-3', title: 'Matrix inverses practice', status: 'ready', questions: 15, createdAt: '2026-09-12' },
        ],
    },
    {
        id: 'nb-cold-war',
        title: 'Cold War Causes',
        subject: 'History',
        updatedAt: '2026-09-08',
        documents: [
            {
                id: 'doc-5',
                name: 'Cold War Origins.pdf',
                pages: 30,
                summary: 'Ideological conflict, the arms race, and proxy wars as core causes.',
            },
        ],
        tests: [],
    },
]

export const getNotebook = (id) => notebooks.find((n) => n.id === id)

export const allTests = notebooks.flatMap((nb) =>
    nb.tests.map((t) => ({ ...t, notebookId: nb.id, notebookTitle: nb.title }))
)