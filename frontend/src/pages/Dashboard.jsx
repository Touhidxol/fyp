import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listNotebooks } from '../api/notebooks'
import { listTests } from '../api/tests'
import { listAttempts } from '../api/attempts'
import { formatDate } from '../utils/format'
import EmptyState from '../components/EmptyState'

const Dashboard = () => {
    const [notebooks, setNotebooks] = useState([])
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [attempts, setAttempts] = useState([])

    useEffect(() => {
        Promise.all([listNotebooks(), listTests(), listAttempts()])
            .then(([nbs, ts, ats]) => {
                setNotebooks(nbs)
                setTests(ts)
                setAttempts(ats)
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const documents = notebooks.flatMap((nb) =>
        nb.documents.map((d) => ({ ...d, notebookTitle: nb.title }))
    )


    const submitted = attempts.filter((a) => a.status === 'submitted')
    const avg = submitted.length
        ? Math.round((submitted.reduce((s, a) => s + a.percentage, 0) / submitted.length) * 10) / 10
        : 0

    const stats = [
        { label: 'Tests created', value: tests.length },
        { label: 'Exams taken', value: submitted.length },
        { label: 'Average score', value: `${avg}%` },
        { label: 'Best score', value: `${submitted.length ? Math.max(...submitted.map((a) => a.percentage)) : 0}%` },
    ]

    // Uploads and generated tests merged into one feed, newest first
    const activity = [
        ...tests.map((t) => ({
            key: `t-${t._id}`,
            tag: 'Test',
            tone: 'blue',
            title: t.title,
            meta: `${t.questionCount} questions${t.notebookId ? ` · ${t.notebookId.title}` : ''}`,
            date: t.createdAt,
        })),
        ...documents.map((d) => ({
            key: `d-${d._id}`,
            tag: 'Document',
            title: d.name,
            meta: `${d.notebookTitle} · ${d.status}`,
            date: d.createdAt,
        })),
        ...submitted.map((a) => ({
            key: `a-${a._id}`,
            tag: 'Exam',
            tone: 'blue',
            title: a.testId?.title || 'Deleted test',
            meta: `${a.score}/${a.totalMarks} marks · ${a.percentage}%`,
            date: a.submittedAt,
        })),
    ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 6)

    const latestTest = tests[0] // the backend returns newest first

    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Academic Intelligence Platform</h1>
                        <p>Generate, practice, and analyze exams with AI.</p>
                    </div>
                    <Link to="/create-test" className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New test
                    </Link>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                {loading ? (
                    <p>Loading…</p>
                ) : notebooks.length === 0 ? (
                    <EmptyState
                        title="Welcome to PrepZeno"
                        text="Create a notebook, upload a PDF, and generate your first practice test."
                        actionTo="/notebooks"
                        actionLabel="Create your first notebook"
                    />
                ) : (
                    <>
                        <div className="stat-row" style={{ marginBottom: 20 }}>
                            {stats.map((s) => (
                                <div className="stat" key={s.label}>
                                    <div className="stat-label">{s.label}</div>
                                    <div className="stat-value accent num">{s.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-2">
                            <div className="card">
                                {latestTest ? (
                                    <>
                                        <h3 style={{ marginBottom: 6 }}>Latest test</h3>
                                        <p style={{ marginBottom: 18 }}>
                                            {latestTest.title} · {latestTest.questionCount} questions
                                        </p>
                                        {latestTest.notebookId && (
                                            <Link to={`/notebooks/${latestTest.notebookId._id}`} className="btn btn-secondary">
                                                Open notebook
                                            </Link>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <h3 style={{ marginBottom: 6 }}>No tests yet</h3>
                                        <p style={{ marginBottom: 18 }}>
                                            Upload a PDF to a notebook and generate your first test.
                                        </p>
                                        <Link to="/notebooks" className="btn btn-secondary">Go to notebooks</Link>
                                    </>
                                )}
                            </div>

                            <div className="card">
                                <h3 style={{ marginBottom: 6 }}>Build something new</h3>
                                <p style={{ marginBottom: 18 }}>
                                    Turn a notebook's documents into a practice test in minutes.
                                </p>
                                <Link to="/create-test" className="btn btn-secondary">Create a test</Link>
                            </div>
                        </div>

                        <h3 style={{ margin: '28px 0 14px' }}>Recent activity</h3>
                        <div className="ledger">
                            {activity.map((item) => (
                                <div className="ledger-row" key={item.key}>
                                    <span className={'ledger-tag' + (item.tone ? ' ' + item.tone : '')}>{item.tag}</span>
                                    <div className="ledger-body">
                                        <h4>{item.title}</h4>
                                        <p>{item.meta}</p>
                                    </div>
                                    <span className="ledger-meta">{formatDate(item.date)}</span>
                                </div>
                            ))}
                            {activity.length === 0 && (
                                <div className="ledger-row">
                                    <p style={{ color: 'var(--text-muted)' }}>
                                        Nothing yet. Upload a document to get started.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </section>
        </main>
    )
}

export default Dashboard