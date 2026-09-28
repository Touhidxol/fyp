import React from 'react'
import { Link } from 'react-router-dom'
import { allTests } from '../data/mockData'
import StatusPill from '../components/StatusPill'

const Tests = () => {
    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Tests</h1>
                        <p>Every test generated across your notebooks.</p>
                    </div>
                </div>

                <div className="ledger">
                    {allTests.map((test) => (
                        <div className="ledger-row" key={test.id}>
                            <StatusPill status={test.status} />
                            <div className="ledger-body">
                                <h4>{test.title}</h4>
                                <p>{test.questions} questions</p>
                            </div>
                            <Link to={`/notebooks/${test.notebookId}`} className="ledger-tag blue" style={{ flexShrink: 0 }}>
                                {test.notebookTitle}
                            </Link>
                            <span className="ledger-meta">{test.createdAt}</span>
                        </div>
                    ))}
                    {allTests.length === 0 && (
                        <div className="ledger-row">
                            <p style={{ color: 'var(--text-muted)' }}>No tests generated yet.</p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}

export default Tests