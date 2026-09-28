import React from 'react'
import { Link } from 'react-router-dom'
import { notebooks } from '../data/mockData'

const roomIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
        <path d="M8 3v18" />
    </svg>
)

const Notebooks = () => {
    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Notebooks</h1>
                        <p>Upload material, chat with it, and generate tests from the context.</p>
                    </div>
                    <button className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New notebook
                    </button>
                </div>

                <div className="room-grid">
                    {notebooks.map((nb) => (
                        <Link to={`/notebooks/${nb.id}`} className="room-card" key={nb.id}>
                            <div className="room-card-top">
                                <div className="room-icon">{roomIcon}</div>
                                <span className="ledger-tag blue">{nb.subject}</span>
                            </div>

                            <h3>{nb.title}</h3>

                            <div className="room-meta-row">
                                <span>{nb.documents.length} doc{nb.documents.length !== 1 ? 's' : ''}</span>
                                <span>{nb.tests.length} test{nb.tests.length !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="room-card-footer">
                                <span>Updated</span>
                                <span className="num">{nb.updatedAt}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </main>
    )
}

export default Notebooks