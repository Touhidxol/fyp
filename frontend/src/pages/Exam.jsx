import React from 'react'
import EmptyState from '../components/EmptyState'

const Exam = () => (
    <main className="container">
        <section className="page">
            <div className="page-header">
                <div>
                    <h1>Exam</h1>
                    <p>Take a generated test under timed conditions.</p>
                </div>
            </div>

            <EmptyState
                title="No exam in progress"
                text="Taking exams isn't available yet. Your generated tests are listed under Tests."
                actionTo="/tests"
                actionLabel="Browse tests"
            />
        </section>
    </main>
)

export default Exam