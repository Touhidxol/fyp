import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
    getNotebook,
    deleteNotebook,
    uploadDocument,
    deleteDocument,
    listNotebookTests,
    generateTest,
} from '../api/notebooks'
import StatusPill from '../components/StatusPill'
import InstructionBar from '../components/InstructionBar'
import { formatDate } from '../utils/format'

const MAX_FILE_MB = 25 // keep equal to the backend/ai-service limit

const NotebookDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const fileInput = useRef(null)

    const [notebook, setNotebook] = useState(null)
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [error, setError] = useState('')
    const [uploading, setUploading] = useState(false)

    const refreshNotebook = useCallback(async () => {
        try {
            setNotebook(await getNotebook(id))
        } catch (err) {
            if (err.status === 404) setNotFound(true)
            else setError(err.message)
        }
    }, [id])

    const refreshTests = useCallback(async () => {
        try {
            setTests(await listNotebookTests(id))
        } catch (err) {
            setError(err.message)
        }
    }, [id])

    useEffect(() => {
        Promise.all([refreshNotebook(), refreshTests()]).finally(() => setLoading(false))
    }, [refreshNotebook, refreshTests])

    // While any document is being indexed, re-check every 2.5s
    const hasProcessing = notebook?.documents.some((d) => d.status === 'processing')
    useEffect(() => {
        if (!hasProcessing) return
        const timer = setInterval(refreshNotebook, 2500)
        return () => clearInterval(timer)
    }, [hasProcessing, refreshNotebook])

    const onFileChange = async (e) => {
        const file = e.target.files[0]
        e.target.value = '' // lets the user pick the same file again later
        if (!file) return

        setError('')
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return setError('Only PDF files are supported.')
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            return setError(`File is larger than ${MAX_FILE_MB} MB.`)
        }

        setUploading(true)
        try {
            await uploadDocument(id, file)
            await refreshNotebook()
        } catch (err) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    const onDeleteDocument = async (doc) => {
        if (!window.confirm(`Delete "${doc.name}"?`)) return
        setError('')
        try {
            await deleteDocument(id, doc._id)
            await refreshNotebook()
        } catch (err) {
            setError(err.message)
        }
    }

    const onDeleteNotebook = async () => {
        if (!window.confirm('Delete this notebook, its documents and its tests?')) return
        try {
            await deleteNotebook(id)
            navigate('/notebooks')
        } catch (err) {
            setError(err.message)
        }
    }

    const onGenerate = async (query) => {
        await generateTest(id, { query })
        await refreshTests()
    }

    if (loading) {
        return (
            <main className="container">
                <section className="page"><p>Loading…</p></section>
            </main>
        )
    }

    if (notFound || !notebook) {
        return (
            <main className="container">
                <section className="page">
                    {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}
                    <p>Notebook not found.</p>
                    <Link to="/notebooks" className="btn btn-secondary" style={{ marginTop: 16 }}>Back to notebooks</Link>
                </section>
            </main>
        )
    }

    const readyCount = notebook.documents.filter((d) => d.status === 'ready').length

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
                        <h1>{notebook.title}</h1>
                        {notebook.description && <p>{notebook.description}</p>}
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={onDeleteNotebook}>Delete notebook</button>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                <div className="card" style={{ marginBottom: 28 }}>
                    <h3 style={{ marginBottom: 12 }}>Generate a test</h3>
                    <InstructionBar
                        onSubmit={onGenerate}
                        disabled={readyCount === 0}
                        hint={readyCount === 0 ? 'Upload a PDF and wait until it is ready to generate tests.' : ''}
                    />
                </div>

                <div className="stack">
                    <div>
                        <div className="section-head">
                            <h3>Documents</h3>
                            <div>
                                <input
                                    ref={fileInput}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={onFileChange}
                                    hidden
                                />
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => fileInput.current.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? 'Uploading…' : 'Upload PDF'}
                                </button>
                            </div>
                        </div>

                        <div className="ledger">
                            {notebook.documents.map((doc) => (
                                <div className="ledger-row" key={doc._id}>
                                    <StatusPill status={doc.status === 'processing' ? 'generating' : doc.status} />
                                    <div className="ledger-body">
                                        <h4>{doc.name}</h4>
                                        {doc.status === 'failed' ? (
                                            <p className="error" title={doc.error}>{doc.error || 'Processing failed'}</p>
                                        ) : doc.status === 'processing' ? (
                                            <p>Indexing — this can take a minute…</p>
                                        ) : (
                                            <p>{doc.pages} pages · {doc.chunks} chunks</p>
                                        )}
                                    </div>
                                    <span className="ledger-meta">{formatDate(doc.createdAt)}</span>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => onDeleteDocument(doc)}
                                        disabled={doc.status === 'processing'}
                                    >
                                        Delete
                                    </button>
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
                        <div className="section-head">
                            <h3>Generated tests</h3>
                        </div>
                        <div className="ledger">
                            {tests.map((test) => (
                                <div className="ledger-row" key={test._id}>
                                    <StatusPill status="ready" />
                                    <div className="ledger-body">
                                        <h4>{test.title}</h4>
                                        <p>{test.questionCount} questions · {test.totalMarks} marks</p>
                                    </div>
                                    <span className="ledger-meta">{formatDate(test.createdAt)}</span>
                                </div>
                            ))}
                            {tests.length === 0 && (
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