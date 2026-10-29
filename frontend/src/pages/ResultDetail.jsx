import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getAttempt } from '../api/attempts'
import QuestionReview from '../components/QuestionReview'

const ResultDetail = () => {
    const { attemptId } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        getAttempt(attemptId)
            .then(({ attempt, test }) => {
                if (attempt.status !== 'submitted') {
                    navigate(`/exam/${attemptId}`, { replace: true })
                    return
                }
                setData({ attempt, test })
            })
            .catch((err) => setError(err.message))
    }, [attemptId, navigate])

    if (error) {
        return <main className="container"><section className="page"><div className="form-error">{error}</div></section></main>
    }
    if (!data) {
        return <main className="container"><section className="page"><p>Loading…</p></section></main>
    }

    const { attempt, test } = data
    const byKey = new Map(attempt.answers.map((a) => [`${a.sectionIndex}:${a.questionIndex}`, a]))
    const needsReview = attempt.answers.some((a) => a.gradedBy === 'none' && a.answer)
    let number = 0

    return (
        <main className="container">
            <section className="page">
                <Link to="/results" className="back-link">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                    Results
                </Link>

                <div className="card score-hero">
                    <div>
                        <h1>{test.title}</h1>
                        <p>Submitted {new Date(attempt.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="score-big num">
                        {attempt.score}<span> / {attempt.totalMarks}</span>
                        <div className="score-pct">{attempt.percentage}%</div>
                    </div>
                </div>

                {needsReview && (
                    <div className="form-error" style={{ margin: '16px 0' }}>
                        Some short answers couldn’t be graded automatically and were given 0 marks.
                    </div>
                )}

                <div className="stack" style={{ marginTop: 24 }}>
                    {test.sections.map((sec, si) => (
                        <div key={si}>
                            <div className="section-head"><h3>{sec.title}</h3></div>
                            <div className="stack" style={{ gap: 14 }}>
                                {sec.questions.map((q, qi) => {
                                    const r = byKey.get(`${si}:${qi}`)
                                    return (
                                        <QuestionReview
                                            key={qi}
                                            number={++number}
                                            q={q}
                                            yourAnswer={r?.answer ?? ''}
                                            result={r}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    )
}

export default ResultDetail