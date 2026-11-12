import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAttempt, saveAnswers, submitAttempt, runCode } from '../api/attempts'
import { getCodingStatus } from '../api/coding'
import { optionLabel } from '../utils/format'
import CodingQuestion from '../components/CodingQuestion'

const keyOf = (s, q) => `${s}:${q}`

// answers: key -> text/code, languages: key -> language id (coding only)
const toPayload = (answers, languages) => {
    const keys = new Set([...Object.keys(answers), ...Object.keys(languages)])
    return [...keys].map((key) => {
        const [sectionIndex, questionIndex] = key.split(':').map(Number)
        const entry = { sectionIndex, questionIndex, answer: answers[key] ?? '' }
        if (languages[key]) entry.language = languages[key]
        return entry
    })
}

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
    const [languages, setLanguages] = useState({})
    const [runResults, setRunResults] = useState({}) // key -> latest Run result
    const [codingAvailable, setCodingAvailable] = useState(null) // null = unknown yet
    const [current, setCurrent] = useState(0)
    const [now, setNow] = useState(() => Date.now())
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [grading, setGrading] = useState(false) // server is already grading this attempt
    const [reloadKey, setReloadKey] = useState(0)

    // refs hold the latest values for timers/auto-submit without re-creating callbacks
    const answersRef = useRef({})
    const languagesRef = useRef({})
    const submittingRef = useRef(false)
    const saveTimer = useRef(null)
    const dirtyRef = useRef(false) // edits not yet sent to the server

    useEffect(() => {
        getAttempt(attemptId)
            .then(({ attempt, test }) => {
                if (attempt.status === 'submitted') {
                    navigate(`/results/${attemptId}`, { replace: true })
                    return
                }
                if (attempt.status === 'grading') {
                    setGrading(true)
                    return
                }
                const initial = {}
                const langs = {}
                for (const a of attempt.answers) {
                    const key = keyOf(a.sectionIndex, a.questionIndex)
                    initial[key] = a.answer
                    if (a.language) langs[key] = a.language
                }
                answersRef.current = initial
                languagesRef.current = langs
                setAnswers(initial)
                setLanguages(langs)
                setData({ attempt, test })
            })
            .catch((err) => setError(err.message))
    }, [attemptId, navigate, reloadKey])

    // Grading is happening on the server: wait for it instead of showing the exam
    useEffect(() => {
        if (!grading) return
        const timer = setInterval(() => {
            getAttempt(attemptId)
                .then(({ attempt }) => {
                    if (attempt.status === 'submitted') {
                        navigate(`/results/${attemptId}`, { replace: true })
                    } else if (attempt.status === 'in_progress') {
                        // grading failed and was rolled back: back to the exam
                        setGrading(false)
                        setReloadKey((k) => k + 1)
                    }
                })
                .catch(() => { })
        }, 3000)
        return () => clearInterval(timer)
    }, [grading, attemptId, navigate])

    // 1-second clock
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Leaving the page: send pending edits instead of dropping them
    useEffect(
        () => () => {
            clearTimeout(saveTimer.current)
            if (dirtyRef.current && !submittingRef.current) {
                saveAnswers(attemptId, toPayload(answersRef.current, languagesRef.current)).catch(() => { })
            }
        },
        [attemptId]
    )

    // Warn before closing or refreshing the tab mid-exam
    useEffect(() => {
        const onBeforeUnload = (e) => {
            e.preventDefault()
            e.returnValue = ''
        }
        window.addEventListener('beforeunload', onBeforeUnload)
        return () => window.removeEventListener('beforeunload', onBeforeUnload)
    }, [])

    const questions = useMemo(() => {
        if (!data) return []
        return data.test.sections.flatMap((sec, si) =>
            sec.questions.map((q, qi) => ({ key: keyOf(si, qi), section: sec.title, q }))
        )
    }, [data])

    // only ask the server about the code runner if this exam needs it
    const hasCoding = useMemo(() => questions.some((x) => x.q.type === 'coding'), [questions])
    useEffect(() => {
        if (!hasCoding) return
        getCodingStatus()
            .then((s) => setCodingAvailable(s.available))
            .catch(() => setCodingAvailable(false))
    }, [hasCoding])

    const minutes = data?.attempt.durationMinutes
    const deadline = minutes ? new Date(data.attempt.startedAt).getTime() + minutes * 60000 : null
    const remaining = deadline ? deadline - now : null

    // debounced autosave so a refresh/crash doesn't lose work
    const scheduleSave = () => {
        dirtyRef.current = true
        clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(() => {
            dirtyRef.current = false
            saveAnswers(attemptId, toPayload(answersRef.current, languagesRef.current)).catch(() => { })
        }, 1500)
    }

    const setAnswer = (key, value) => {
        const next = { ...answersRef.current, [key]: value }
        answersRef.current = next
        setAnswers(next)
        scheduleSave()
    }

    const setLanguage = (key, language) => {
        const next = { ...languagesRef.current, [key]: language }
        languagesRef.current = next
        setLanguages(next)
        scheduleSave()
    }

    const langOf = (item) => languages[item.key] || item.q.coding?.allowedLanguages?.[0] || ''

    const runItem = async (item, code) => {
        const [sectionIndex, questionIndex] = item.key.split(':').map(Number)
        const result = await runCode(attemptId, {
            sectionIndex,
            questionIndex,
            language: langOf(item),
            code,
        })
        setRunResults((prev) => ({ ...prev, [item.key]: result }))
    }

    const submit = useCallback(async () => {
        if (submittingRef.current) return
        submittingRef.current = true
        setSubmitting(true)
        setError('')
        clearTimeout(saveTimer.current)
        dirtyRef.current = false
        try {
            await submitAttempt(attemptId, toPayload(answersRef.current, languagesRef.current))
            navigate(`/results/${attemptId}`, { replace: true })
        } catch (err) {
            submittingRef.current = false
            setSubmitting(false)
            if (err.status === 409) {
                // Already submitted or being graded (another tab, a double click,
                // or a lost response): wait for the server to finish.
                setGrading(true)
                return
            }
            setError(err.message)
        }
    }, [attemptId, navigate])

    // time is up: submit automatically
    useEffect(() => {
        if (!grading && remaining !== null && remaining <= 0) submit()
    }, [grading, remaining, submit])

    const onSubmitClick = () => {
        const unanswered = questions.filter((x) => !answers[x.key]?.trim()).length
        const msg = unanswered
            ? `You have ${unanswered} unanswered question(s). Submit anyway?`
            : 'Submit your exam?'
        if (window.confirm(msg)) submit()
    }

    const onLeave = () => {
        if (window.confirm('Leave the exam? Your timer keeps running. You can resume from the Exam page.')) {
            navigate('/exam')
        }
    }

    if (error && !data) {
        return (
            <main className="container">
                <section className="page"><div className="form-error">{error}</div></section>
            </main>
        )
    }

    if (grading) {
        return (
            <main className="container">
                <section className="page">
                    <div className="card empty-state">
                        <h3>Grading your exam…</h3>
                        <p>
                            Your answers are in. Coding questions are run against every test, so this
                            can take up to a minute. You’ll be taken to your results automatically.
                        </p>
                    </div>
                </section>
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
                    <button className="btn btn-secondary btn-sm" onClick={onLeave}>Leave exam</button>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

                <div className="exam-layout">
                    <div className="card q-card">
                        <div className="q-head">
                            <span className="q-num">Question {current + 1} of {questions.length}</span>
                            <span className="ledger-meta">{item.q.marks} marks</span>
                        </div>

                        <p className="q-text">{item.q.question}</p>

                        {item.q.type === 'coding' ? (
                            <CodingQuestion
                                key={item.key}
                                q={item.q}
                                value={value}
                                language={langOf(item)}
                                available={codingAvailable}
                                result={runResults[item.key]}
                                onCode={(v) => setAnswer(item.key, v)}
                                onLanguage={(l) => setLanguage(item.key, l)}
                                onRun={(code) => runItem(item, code)}
                            />
                        ) : item.q.type === 'mcq' ? (
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
                        {submitting && (
                            <p className="form-hint">
                                Grading your answers.{' '}
                                {hasCoding
                                    ? 'Coding questions are run against every test, which can take up to a minute.'
                                    : 'This can take a few seconds.'}
                            </p>
                        )}
                    </aside>
                </div>
            </section>
        </main>
    )
}

export default ExamRunner