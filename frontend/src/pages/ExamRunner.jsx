import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAttempt, saveAnswers, submitAttempt } from '../api/attempts'
import { optionLabel } from '../utils/format'

const keyOf = (s, q) => `${s}:${q}`

const toPayload = (map) =>
    Object.entries(map).map(([key, answer]) => {
        const [sectionIndex, questionIndex] = key.split(':').map(Number)
        return { sectionIndex, questionIndex, answer }
    })

const clock = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000))
    const m = String(Math.floor(total / 60)).padStart(2, '0')
    const s = String(total % 60).padStart(2, '0')
    return `${m}:${s}`
}

const ExamRunner = () => {
    const { attemptId } = useParams()
    const navigate = useNavigate()

    const [data, setData] = useState(null) // { attempt, test }
    const [answers, setAnswers] = useState({})
    const [current, setCurrent] = useState(0)
    const [now, setNow] = useState(() => Date.now())
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)

    // refs hold the latest values for timers/auto-submit without re-creating callbacks
    const answersRef = useRef({})
    const submittingRef = useRef(false)
    const saveTimer = useRef(null)

    useEffect(() => {
        getAttempt(attemptId)
            .then(({ attempt, test }) => {
                if (attempt.status === 'submitted') {
                    navigate(`/results/${attemptId}`, { replace: true })
                    return
                }
                const initial = {}
                for (const a of attempt.answers) {
                    initial[keyOf(a.sectionIndex, a.questionIndex)] = a.answer
                }
                answersRef.current = initial
                setAnswers(initial)
                setData({ attempt, test })
            })
            .catch((err) => setError(err.message))
    }, [attemptId, navigate])

    // 1-second clock
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => () => clearTimeout(saveTimer.current), [])

    const questions = useMemo(() => {
        if (!data) return []
        return data.test.sections.flatMap((sec, si) =>
            sec.questions.map((q, qi) => ({ key: keyOf(si, qi), section: sec.title, q }))
        )
    }, [data])

    const minutes = data?.attempt.durationMinutes
    const deadline = minutes ? new Date(data.attempt.startedAt).getTime() + minutes * 60000 : null
    const remaining = deadline ? deadline - now : null

    const setAnswer = (key, value) => {
        const next = { ...answersRef.current, [key]: value }
        answersRef.current = next
        setAnswers(next)

        // debounced autosave so a refresh/crash doesn't lose work
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            saveAnswers(attemptId, toPayload(answersRef.current)).catch(() => { })
        }, 1500)
    }

    const submit = useCallback(async () => {
        if (submittingRef.current) return
        submittingRef.current = true
        setSubmitting(true)
        setError('')
        clearTimeout(saveTimer.current)
        try {
            await submitAttempt(attemptId, toPayload(answersRef.current))
            navigate(`/results/${attemptId}`, { replace: true })
        } catch (err) {
            setError(err.message)
            submittingRef.current = false
            setSubmitting(false)
        }
    }, [attemptId, navigate])

    // time is up: submit automatically
    useEffect(() => {
        if (remaining !== null && remaining <= 0) submit()
    }, [remaining, submit])

    const onSubmitClick = () => {
        const unanswered = questions.filter((x) => !answers[x.key]?.trim()).length
        const msg = unanswered
            ? `You have ${unanswered} unanswered question(s). Submit anyway?`
            : 'Submit your exam?'
        if (window.confirm(msg)) submit()
    }

    if (error && !data) {
        return (
            <main className="container">
                <section className="page"><div className="form-error">{error}</div></section>
            </main>
        )
    }

    if (!data) {
        return <main className="container"><section className="page"><p>Loading…</p></section></main>
    }

    const item = questions[current]
    const value = answers[item.key] || ''

    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>{data.test.title}</h1>
                        <p>{item.section}</p>
                    </div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                <div className="exam-layout">
                    <div className="card q-card">
                        <div className="q-head">
                            <span className="q-num">Question {current + 1} of {questions.length}</span>
                            <span className="ledger-meta">{item.q.marks} marks</span>
                        </div>

                        <p className="q-text">{item.q.question}</p>

                        {item.q.type === 'mcq' ? (
                            item.q.options.map((opt, i) => (
                                <button
                                    type="button"
                                    key={opt}
                                    className={'option' + (value === opt ? ' selected' : '')}
                                    onClick={() => setAnswer(item.key, opt)}
                                >
                                    <span className="option-letter">{optionLabel(i)}</span>
                                    <span className="option-text">{opt}</span>
                                </button>
                            ))
                        ) : (
                            <div className="answer-box">
                                <textarea
                                    value={value}
                                    onChange={(e) => setAnswer(item.key, e.target.value)}
                                    placeholder="Write your answer here…"
                                />
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCurrent((c) => c - 1)}
                                disabled={current === 0}
                            >
                                Previous
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setCurrent((c) => c + 1)}
                                disabled={current === questions.length - 1}
                            >
                                Next
                            </button>
                        </div>
                    </div>

                    <aside className="card exam-side">
                        {remaining !== null && (
                            <div style={{ marginBottom: 18 }}>
                                <div className="stat-label">Time left</div>
                                <div className={'timer' + (remaining < 60000 ? ' low' : '')}>
                                    {clock(remaining)}
                                </div>
                            </div>
                        )}

                        <div className="stat-label" style={{ marginBottom: 8 }}>Questions</div>
                        <div className="nav-grid">
                            {questions.map((x, i) => (
                                <button
                                    type="button"
                                    key={x.key}
                                    className={
                                        'nav-btn' +
                                        (answers[x.key]?.trim() ? ' answered' : '') +
                                        (i === current ? ' current' : '')
                                    }
                                    onClick={() => setCurrent(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 18 }}
                            onClick={onSubmitClick}
                            disabled={submitting}
                        >
                            {submitting ? 'Grading…' : 'Submit exam'}
                        </button>
                        {submitting && <p className="form-hint">Grading your answers. This can take a few seconds.</p>}
                    </aside>
                </div>
            </section>
        </main>
    )
}

export default ExamRunner