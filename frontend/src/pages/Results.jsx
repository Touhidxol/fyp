import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAttempts } from '../api/attempts'
import EmptyState from '../components/EmptyState'
import { formatDate } from '../utils/format'

const Results = () => {
    const [attempts, setAttempts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        listAttempts()
            .then((list) => setAttempts(list.filter((a) => a.status === 'submitted')))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Results</h1>
                        <p>How your attempts scored.</p>
                    </div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                {loading ? (
                    <p>Loading…</p>
                ) : attempts.length === 0 ? (
                    <EmptyState
                        title="No results yet"
                        text="Your scores will show up here after you complete an exam."
                        actionTo="/tests"
                        actionLabel="Browse tests"
                    />
                ) : (
                    <div className="ledger">
                        {attempts.map((a) => (
                            <div className="ledger-row" key={a._id}>
                                <span className="ledger-tag blue num">{a.percentage}%</span>
                                <div className="ledger-body">
                                    <h4>{a.testId?.title || 'Deleted test'}</h4>
                                    <p>{a.score} / {a.totalMarks} marks</p>
                                </div>
                                <span className="ledger-meta">{formatDate(a.submittedAt)}</span>
                                <Link to={`/results/${a._id}`} className="btn btn-secondary btn-sm">Review</Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default Results