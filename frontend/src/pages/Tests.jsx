import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listTests } from '../api/tests'
import StatusPill from '../components/StatusPill'
import { formatDate } from '../utils/format'

const Tests = () => {
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        listTests()
            .then(setTests)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Tests</h1>
                        <p>Every test generated across your notebooks.</p>
                    </div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                <div className="ledger">
                    {tests.map((test) => (
                        <div className="ledger-row" key={test._id}>
                            <StatusPill status="ready" />
                            <div className="ledger-body">
                                <h4>{test.title}</h4>
                                <p>{test.questionCount} questions · {test.totalMarks} marks</p>
                            </div>
                            {/* notebookId is populated by the backend: { _id, title } */}
                            {test.notebookId && (
                                <Link to={`/notebooks/${test.notebookId._id}`} className="ledger-tag blue" style={{ flexShrink: 0 }}>
                                    {test.notebookId.title}
                                </Link>
                            )}
                            <span className="ledger-meta">{formatDate(test.createdAt)}</span>
                        </div>
                    ))}
                    {!loading && tests.length === 0 && (
                        <div className="ledger-row">
                            <p style={{ color: 'var(--text-muted)' }}>No tests generated yet.</p>
                        </div>
                    )}
                    {loading && (
                        <div className="ledger-row">
                            <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Tests