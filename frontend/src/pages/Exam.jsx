import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAttempts } from '../api/attempts'
import EmptyState from '../components/EmptyState'
import { formatDate } from '../utils/format'

const Exam = () => {
    const [attempts, setAttempts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        listAttempts()
            .then((list) => setAttempts(list.filter((a) => a.status === 'in_progress')))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Exam</h1>
                        <p>Resume an exam you started, or start a new one from Tests.</p>
                    </div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                {loading ? (
                    <p>Loading…</p>
                ) : attempts.length === 0 ? (
                    <EmptyState
                        title="No exam in progress"
                        text="Open a test and press “Start exam” to begin."
                        actionTo="/tests"
                        actionLabel="Browse tests"
                    />
                ) : (
                    <div className="ledger">
                        {attempts.map((a) => (
                            <div className="ledger-row" key={a._id}>
                                <span className="ledger-tag">In progress</span>
                                <div className="ledger-body">
                                    <h4>{a.testId?.title || 'Untitled test'}</h4>
                                    <p>Started {formatDate(a.startedAt)}</p>
                                </div>
                                <Link to={`/exam/${a._id}`} className="btn btn-primary btn-sm">Resume</Link>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default Exam