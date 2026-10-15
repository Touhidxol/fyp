import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listNotebooks, createNotebook } from '../api/notebooks'
import { formatDate } from '../utils/format'

const roomIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M8 3v18" />
    </svg>
)

const Notebooks = () => {
    const navigate = useNavigate()

    const [notebooks, setNotebooks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        listNotebooks()
            .then(setNotebooks)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    const submit = async (e) => {
        e.preventDefault()
        if (!title.trim()) return
        setSaving(true)
        setError('')
        try {
            const notebook = await createNotebook({
                title: title.trim(),
                description: description.trim(),
            })
            navigate(`/notebooks/${notebook._id}`)
        } catch (err) {
            setError(err.message)
            setSaving(false)
        }
    }

    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Notebooks</h1>
                        <p>Upload material, chat with it, and generate tests from the context.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New notebook
                    </button>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                {showForm && (
                    <form className="card auth-form" style={{ marginBottom: 20 }} onSubmit={submit}>
                        <div className="field">
                            <label htmlFor="nb-title">Title</label>
                            <input id="nb-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Organic Chemistry — Ch. 6–8" autoFocus required />
                        </div>
                        <div className="field">
                            <label htmlFor="nb-desc">Description <span className="hint">optional</span></label>
                            <input id="nb-desc" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>
                        <div className="form-actions" style={{ marginTop: 0 }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Creating…' : 'Create notebook'}
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <p>Loading notebooks…</p>
                ) : notebooks.length === 0 ? (
                    <div className="card">
                        <h3 style={{ marginBottom: 6 }}>No notebooks yet</h3>
                        <p>Create your first notebook, then upload a PDF to it.</p>
                    </div>
                ) : (
                    <div className="room-grid">
                        {notebooks.map((nb) => (
                            <Link to={`/notebooks/${nb._id}`} className="room-card" key={nb._id}>
                                <div className="room-card-top">
                                    <div className="room-icon">{roomIcon}</div>
                                </div>

                                <h3>{nb.title}</h3>
                                {nb.description && <p className="room-desc">{nb.description}</p>}

                                <div className="room-meta-row">
                                    <span>{nb.documents.length} doc{nb.documents.length !== 1 ? 's' : ''}</span>
                                </div>

                                <div className="room-card-footer">
                                    <span>Updated</span>
                                    <span className="num">{formatDate(nb.updatedAt)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}

export default Notebooks