import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getTest, deleteTest } from '../api/tests'
import { startAttempt } from '../api/attempts'

const TestView = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [test, setTest] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        getTest(id)
            .then(setTest)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [id])

    const onStart = async () => {
        setBusy(true)
        setError('')
        try {
            const { attempt } = await startAttempt(id)
            navigate(`/exam/${attempt._id}`)
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    const onDelete = async () => {
        if (!window.confirm('Delete this test and its attempts?')) return
        try {
            await deleteTest(id)
            navigate('/tests')
        } catch (err) {
            setError(err.message)
        }
    }

    if (loading) {
        return <main className="container"><section className="page"><p>Loading…</p></section></main>
    }

    if (!test) {
        return (
            <main className="container">
                <section className="page">
                    {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}
                    <p>Test not found.</p>
                    <Link to="/tests" className="btn btn-secondary" style={{ marginTop: 16 }}>Back to tests</Link>
                </section>
            </main>
        )
    }

    const subtitle = [test.subject, test.topic].filter(Boolean).join(' · ')

    const stats = [
        { label: 'Questions', value: test.questionCount },
        { label: 'Total marks', value: test.totalMarks },
        { label: 'Duration', value: test.duration ? `${test.duration} min` : 'Untimed' },
        { label: 'Sections', value: test.sections.length },
    ]

    return (
        <main className="container">
            <section className="page">
                <Link to="/tests" className="back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Tests
                </Link>

                <div className="page-header">
                    <div>
                        <h1>{test.title}</h1>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-danger btn-sm" onClick={onDelete}>Delete</button>
                        <button className="btn btn-primary" onClick={onStart} disabled={busy}>
                            {busy ? 'Starting…' : 'Start exam'}
                        </button>
                    </div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                <div className="stat-row" style={{ marginBottom: 20 }}>
                    {stats.map((s) => (
                        <div className="stat" key={s.label}>
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value accent num">{s.value}</div>
                        </div>
                    ))}
                </div>

                {test.instructions?.length > 0 && (
                    <div className="card" style={{ marginBottom: 20 }}>
                        <h3 style={{ marginBottom: 8 }}>Instructions</h3>
                        <ul style={{ paddingLeft: 18 }}>
                            {test.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
                        </ul>
                    </div>
                )}

                <div className="section-head"><h3>Sections</h3></div>
                <div className="ledger">
                    {test.sections.map((sec, i) => (
                        <div className="ledger-row" key={i}>
                            <span className="ledger-tag blue num">{i + 1}</span>
                            <div className="ledger-body">
                                <h4>{sec.title}</h4>
                                {sec.instructions && <p>{sec.instructions}</p>}
                            </div>
                            <span className="ledger-meta">
                                {sec.questions.length} questions · {sec.marks} marks
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    )
}

export default TestView