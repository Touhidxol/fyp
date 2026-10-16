import React from 'react'
import EmptyState from '../components/EmptyState'

const Results = () => (
    <main className="container">
        <section className="page">
            <div className="page-header">
                <div>
                    <h1>Results</h1>
                    <p>How your attempts scored.</p>
                </div>
            </div>

            <EmptyState
                title="No results yet"
                text="Your scores will show up here after you complete an exam."
                actionTo="/tests"
                actionLabel="Browse tests"
            />
        </section>
    </main>
)

export default Results