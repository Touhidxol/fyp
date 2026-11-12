import React, { useEffect, useState } from 'react'
import CodeEditor from './CodeEditor'
import { verdictLabel, verdictTone } from '../utils/format'

const LANGUAGE_LABELS = {
    python: 'Python 3',
    javascript: 'JavaScript',
    cpp: 'C++',
    java: 'Java',
}

const starterFor = (coding, language) =>
    coding.starterCode?.find((s) => s.language === language)?.code ?? ''

// Everything for a coding question except the statement (the exam runner
// already renders that): formats, samples, editor, Run and its results.
//   value    the student's code ('' until they edit; the editor shows the starter)
//   result   latest Run result for this question (kept by the parent)
//   onRun    async (code) => void; throws ApiError on failure
const CodingQuestion = ({ q, value, language, available, result, onCode, onLanguage, onRun }) => {
    const coding = q.coding
    const starter = starterFor(coding, language)
    const code = value || starter

    const [running, setRunning] = useState(false)
    const [error, setError] = useState('')
    const [cooldownUntil, setCooldownUntil] = useState(0)
    const [now, setNow] = useState(() => Date.now())

    // tick only while a cooldown is active
    useEffect(() => {
        if (!cooldownUntil) return
        const timer = setInterval(() => {
            const n = Date.now()
            setNow(n)
            if (n >= cooldownUntil) clearInterval(timer)
        }, 500)
        return () => clearInterval(timer)
    }, [cooldownUntil])

    const waitSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000))

    const changeLanguage = (next) => {
        const untouched = !value.trim() || value === starter
        if (!untouched && !window.confirm('Switching language replaces the code in the editor. Continue?')) {
            return
        }
        onCode('') // the editor then shows the new language's starter code
        onLanguage(next)
    }

    const run = async () => {
        setError('')
        setRunning(true)
        try {
            await onRun(code)
        } catch (err) {
            setError(err.message)
            const wait = err.retryAfter ?? (err.code === 'busy' ? 5 : 0)
            if (wait > 0) {
                const n = Date.now()
                setNow(n)
                setCooldownUntil(n + wait * 1000)
            }
        } finally {
            setRunning(false)
        }
    }

    const runDisabled = !available || running || waitSeconds > 0 || !code.trim()

    return (
        <div className="coding">
            {available === false && (
                <div className="banner-warn">
                    Code execution is unavailable right now. You can still write your code and
                    submit, but it can’t be run or judged until the service is back.
                </div>
            )}

            <div className="coding-meta">
                {coding.inputFormat && (
                    <div>
                        <span className="label">Input</span>
                        <p>{coding.inputFormat}</p>
                    </div>
                )}
                {coding.outputFormat && (
                    <div>
                        <span className="label">Output</span>
                        <p>{coding.outputFormat}</p>
                    </div>
                )}
                {coding.constraints && (
                    <div>
                        <span className="label">Constraints</span>
                        <p>{coding.constraints}</p>
                    </div>
                )}
            </div>

            <div className="sample-grid">
                {coding.samples.map((s, i) => (
                    <div className="sample" key={i}>
                        <span className="label">Sample {i + 1}</span>
                        <div className="sample-cols">
                            <div>
                                <span className="label">Input</span>
                                <pre className="code-block">{s.input}</pre>
                            </div>
                            <div>
                                <span className="label">Output</span>
                                <pre className="code-block">{s.expectedOutput}</pre>
                            </div>
                        </div>
                        {s.explanation && <p className="form-hint">{s.explanation}</p>}
                    </div>
                ))}
            </div>

            <div className="coding-toolbar">
                <select
                    className="lang-select"
                    value={language}
                    onChange={(e) => changeLanguage(e.target.value)}
                    aria-label="Language"
                >
                    {coding.allowedLanguages.map((l) => (
                        <option key={l} value={l}>{LANGUAGE_LABELS[l] || l}</option>
                    ))}
                </select>

                <button type="button" className="btn btn-secondary" onClick={run} disabled={runDisabled}>
                    {running
                        ? 'Running…'
                        : waitSeconds > 0
                            ? `Run again in ${waitSeconds}s`
                            : 'Run sample tests'}
                </button>
            </div>

            <CodeEditor language={language} value={code} onChange={onCode} />

            {error && <div className="form-error">{error}</div>}

            {result && (
                <div className="run-result">
                    <div className="run-summary">
                        <span className={'verdict ' + verdictTone(result.verdict)}>
                            {verdictLabel(result.verdict)}
                        </span>
                        <span className="num">
                            {result.passed}/{result.total} sample tests passed
                        </span>
                    </div>

                    {result.compileError && <pre className="code-block error">{result.compileError}</pre>}

                    {result.tests.map((t, i) => {
                        const sample = coding.samples[i]
                        const failed = t.status !== 'accepted' && t.status !== 'skipped'
                        return (
                            <div className="sample" key={i}>
                                <div className="test-row">
                                    <strong>Sample {i + 1}</strong>
                                    <span className={'verdict ' + verdictTone(t.status)}>
                                        {verdictLabel(t.status)}
                                    </span>
                                </div>
                                {failed && sample && (
                                    <div className="sample-cols" style={{ marginTop: 10 }}>
                                        <div>
                                            <span className="label">Expected</span>
                                            <pre className="code-block">{sample.expectedOutput}</pre>
                                        </div>
                                        <div>
                                            <span className="label">Your output</span>
                                            <pre className="code-block">{t.output || '(nothing printed)'}</pre>
                                        </div>
                                    </div>
                                )}
                                {failed && t.error && <pre className="code-block error" style={{ marginTop: 10 }}>{t.error}</pre>}
                            </div>
                        )
                    })}

                    <p className="form-hint">
                        Run only checks the sample tests. Submitting also checks hidden tests.
                    </p>
                </div>
            )}
        </div>
    )
}

export default CodingQuestion