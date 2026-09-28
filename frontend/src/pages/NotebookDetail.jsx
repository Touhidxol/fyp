import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getNotebook } from '../data/mockData'
import StatusPill from '../components/StatusPill'
import InstructionBar from '../components/Instructionbar'

const NotebookDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const notebook = getNotebook(id)

    if (!notebook) {
        return (
            <main className="container">
                <section className="page">
                    <p>Notebook not found.</p>
                    <Link to="/notebooks" className="btn btn-secondary" style={{ marginTop: 16 }}>Back to notebooks</Link>
                </section>
            </main>
        )
    }

    return (
        <main className="container">
            <section className="page">
                <Link to="/notebooks" className="back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Notebooks
                </Link>

                <div className="page-header">
                    <div>
                        <span className="ledger-tag blue" style={{ marginBottom: 8, display: 'inline-block' }}>
                            {notebook.subject}
                        </span>
                        <h1>{notebook.title}</h1>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/create-test', { state: { notebookId: notebook.id } })}
                    >
                        Create test
                    </button>
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                    <h3 style={{ marginBottom: 12 }}>Instructions</h3>
                    <InstructionBar />
                </div>

                <div className="">
                    <div>
                        <h3 style={{ marginBottom: 14 }}>Documents</h3>
                        <div className="ledger">
                            {notebook.documents.map((doc) => (
                                <div className="ledger-row" key={doc.id}>
                                    <span className="ledger-tag">PDF</span>
                                    <div className="ledger-body">
                                        <h4>{doc.name}</h4>
                                        <p>{doc.summary}</p>
                                    </div>
                                    <span className="ledger-meta">{doc.pages}p</span>
                                </div>
                            ))}
                            {notebook.documents.length === 0 && (
                                <div className="ledger-row">
                                    <p style={{ color: 'var(--text-muted)' }}>No documents uploaded yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 style={{ marginBottom: 14 }}>Generated tests</h3>
                        <div className="ledger">
                            {notebook.tests.map((test) => (
                                <div className="ledger-row" key={test.id}>
                                    <StatusPill status={test.status} />
                                    <div className="ledger-body">
                                        <h4>{test.title}</h4>
                                        <p>{test.questions} questions</p>
                                    </div>
                                    <span className="ledger-meta">{test.createdAt}</span>
                                </div>
                            ))}
                            {notebook.tests.length === 0 && (
                                <div className="ledger-row">
                                    <p style={{ color: 'var(--text-muted)' }}>No tests generated yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default NotebookDetail