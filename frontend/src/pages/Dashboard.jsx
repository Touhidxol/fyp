import React from 'react'

const stats = [
    { label: 'Tests created', value: '24', delta: '+3 this week' },
    { label: 'Avg. score', value: '82%', delta: '+4 pts' },
    { label: 'Questions practiced', value: '1,206', delta: '+140 this week' },
    { label: 'Study streak', value: '12 days', delta: 'Best: 19 days', down: true },
]

const activity = [
    { tag: 'Exam', tone: 'blue', title: 'Organic Chemistry — Ch. 6–8', meta: 'Score 88%', time: 'Today, 9:12 AM' },
    { tag: 'Note', title: 'Krebs cycle — quick recap', meta: '3 paragraphs', time: 'Yesterday' },
    { tag: 'Test', tone: 'blue', title: 'Linear Algebra practice set', meta: '20 questions', time: '2 days ago' },
    { tag: 'Note', title: 'Essay outline: Cold War causes', meta: '5 paragraphs', time: '3 days ago' },
]

const Dashboard = () => {
    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Academic Intelligence Platform</h1>
                        <p>Generate, practice, and analyze exams with AI.</p>
                    </div>
                    <a href="/create-test" className="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        New test
                    </a>
                </div>

                <div className="stat-row" style={{ marginBottom: 20 }}>
                    {stats.map((s) => (
                        <div className="stat" key={s.label}>
                            <div className="stat-label">{s.label}</div>
                            <div className="stat-value accent num">{s.value}</div>
                            <div className={'stat-delta' + (s.down ? ' down' : '')}>{s.delta}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-2">
                    <div className="card">
                        <h3 style={{ marginBottom: 6 }}>Pick up where you left off</h3>
                        <p style={{ marginBottom: 18 }}>
                            Your last attempt on Organic Chemistry, Ch. 6–8 left three questions unreviewed.
                        </p>
                        <a href="/results" className="btn btn-secondary">Review answers</a>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: 6 }}>Build something new</h3>
                        <p style={{ marginBottom: 18 }}>
                            Turn a topic, a set of notes, or a syllabus into a graded practice test in minutes.
                        </p>
                        <a href="/create-test" className="btn btn-secondary">Create a test</a>
                    </div>
                </div>

                <h3 style={{ margin: '28px 0 14px' }}>Recent activity</h3>
                <div className="ledger">
                    {activity.map((item, i) => (
                        <div className="ledger-row" key={i}>
                            <span className={'ledger-tag' + (item.tone ? ' ' + item.tone : '')}>{item.tag}</span>
                            <div className="ledger-body">
                                <h4>{item.title}</h4>
                                <p>{item.meta}</p>
                            </div>
                            <span className="ledger-meta">{item.time}</span>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    )
}

export default Dashboard