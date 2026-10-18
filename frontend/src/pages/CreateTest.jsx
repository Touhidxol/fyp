import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { listNotebooks, generateTest } from '../api/notebooks'
import EmptyState from '../components/EmptyState'

const difficulties = ['Easy', 'Moderate', 'Challenging', 'Mixed']
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const CreateTest = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const preselectedId = location.state?.notebookId

    const [notebooks, setNotebooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    const [notebookId, setNotebookId] = useState(preselectedId || '')
    const [name, setName] = useState('')
    const [topic, setTopic] = useState('')
    const [difficulty, setDifficulty] = useState('Moderate')
    const [duration, setDuration] = useState(30)
    const [questions, setQuestions] = useState(10)

    useEffect(() => {
        listNotebooks()
            .then((list) => {
                setNotebooks(list)
                // keep the preselected notebook if it still exists, else fall back to the first
                setNotebookId((cur) => (list.some((n) => n._id === cur) ? cur : list[0]?._id || ''))
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const selected = notebooks.find((n) => n._id === notebookId)
    const readyDocs = selected ? selected.documents.filter((d) => d.status === 'ready').length : 0

    const step = (setter, value, delta, min, max) => setter(clamp(value + delta, min, max))

    const submit = async (e) => {
        e.preventDefault()
        if (!selected || readyDocs === 0) return

        const q = clamp(questions, 1, 50)
        const d = clamp(duration, 5, 180)

        const query = [
            name.trim() ? `Title it "${name.trim()}".` : '',
            topic.trim() ? `Focus on: ${topic.trim()}.` : 'Cover the whole uploaded material.',
        ]
            .filter(Boolean)
            .join(' ')

        setBusy(true)
        setError('')
        try {
            await generateTest(notebookId, {
                query,
                numQuestions: q,
                difficulty,
                duration: d,
            })
            navigate(`/notebooks/${notebookId}`)
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    if (loading) {
        return (
            <main className="container">
                <section className="page"><p>Loading…</p></section>
            </main>
        )
    }

    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Create test</h1>
                        <p>Set up a new test generated from one of your notebooks.</p>
                    </div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                {notebooks.length === 0 ? (
                    <EmptyState
                        title="You need a notebook first"
                        text="Tests are generated from the documents inside a notebook."
                        actionTo="/notebooks"
                        actionLabel="Go to notebooks"
                    />
                ) : (
                    <form className="card" onSubmit={submit}>
                        <div className="form-section">
                            <h3>Context</h3>
                            <p>Choose which notebook this test should be generated from.</p>

                            <div className="field">
                                <label htmlFor="notebook">Notebook</label>
                                <select id="notebook" value={notebookId} onChange={(e) => setNotebookId(e.target.value)}>
                                    {notebooks.map((nb) => (
                                        <option key={nb._id} value={nb._id}>{nb.title}</option>
                                    ))}
                                </select>
                            </div>

                            {readyDocs === 0 && (
                                <p className="form-hint" style={{ marginTop: 12 }}>
                                    This notebook has no ready documents yet.{' '}
                                    <Link to={`/notebooks/${notebookId}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                        Upload a PDF
                                    </Link>{' '}
                                    first.
                                </p>
                            )}
                        </div>

                        <div className="form-section">
                            <h3>Basics</h3>
                            <p>Name the test and say what it should cover. Both are optional.</p>

                            <div className="grid grid-2">
                                <div className="field">
                                    <label htmlFor="testName">Test name</label>
                                    <input type="text" id="testName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ch. 6–8 practice set" />
                                </div>
                                <div className="field">
                                    <label htmlFor="topic">Topic <span className="hint">leave empty for the whole material</span></label>
                                    <input type="text" id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. eigenvalues and eigenvectors" />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Difficulty</h3>
                            <p>How challenging should the questions be?</p>

                            <div className="pill-group">
                                {difficulties.map((d) => (
                                    <button
                                        type="button"
                                        key={d}
                                        className={'pill' + (difficulty === d ? ' selected' : '')}
                                        onClick={() => setDifficulty(d)}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-section">
                            <h3>Length</h3>
                            <p>Set the duration and how many questions to include.</p>

                            <div className="grid grid-2">
                                <div className="field">
                                    <label htmlFor="duration">Duration <span className="hint">minutes</span></label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <button type="button" className="btn btn-secondary" style={{ padding: '10px 14px' }} onClick={() => step(setDuration, duration, -5, 5, 180)}>–</button>
                                        <input type="number" id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ textAlign: 'center' }} />
                                        <button type="button" className="btn btn-secondary" style={{ padding: '10px 14px' }} onClick={() => step(setDuration, duration, 5, 5, 180)}>+</button>
                                    </div>
                                </div>

                                <div className="field">
                                    <label htmlFor="questions">Number of questions</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <button type="button" className="btn btn-secondary" style={{ padding: '10px 14px' }} onClick={() => step(setQuestions, questions, -1, 1, 50)}>–</button>
                                        <input type="number" id="questions" value={questions} onChange={(e) => setQuestions(Number(e.target.value))} style={{ textAlign: 'center' }} />
                                        <button type="button" className="btn btn-secondary" style={{ padding: '10px 14px' }} onClick={() => step(setQuestions, questions, 1, 1, 50)}>+</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={busy || readyDocs === 0}>
                                {busy ? 'Generating… (up to a minute)' : 'Create test'}
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </main>
    )
}

export default CreateTest