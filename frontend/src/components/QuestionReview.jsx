import React from 'react'
import { optionLabel, verdictLabel, verdictTone } from '../utils/format'

const LANGUAGE_LABELS = {
    python: 'Python 3',
    javascript: 'JavaScript',
    cpp: 'C++',
    java: 'Java',
}

// "Sample 1", "Sample 2", "Hidden 1", ... numbered separately
const labelTests = (tests = []) =>
    tests.map((t, i) => {
        const before = tests.slice(0, i).filter((x) => x.sample === t.sample).length
        return { ...t, label: `${t.sample ? 'Sample' : 'Hidden'} ${before + 1}` }
    })

const CodingReview = ({ yourAnswer, result }) => {
    const judge = result?.judge
    const rows = labelTests(judge?.tests)

    return (
        <>
            <div className="answer-block">
                <span className="label">
                    Your code{result?.language ? ` · ${LANGUAGE_LABELS[result.language] || result.language}` : ''}
                </span>
                {yourAnswer ? (
                    <pre className="code-block">{yourAnswer}</pre>
                ) : (
                    <p>— not answered —</p>
                )}
            </div>

            {judge && judge.verdict !== 'unavailable' && (
                <div className="run-result">
                    <div className="run-summary">
                        <span className={'verdict ' + verdictTone(judge.verdict)}>
                            {verdictLabel(judge.verdict)}
                        </span>
                        <span className="num">{judge.passed}/{judge.total} tests passed</span>
                    </div>

                    {judge.message && <pre className="code-block error">{judge.message}</pre>}

                    {rows.map((t) => (
                        <div className="test-row" key={t.label}>
                            <span>{t.label}</span>
                            <span className={'verdict ' + verdictTone(t.status)}>
                                {verdictLabel(t.status)}
                            </span>
                        </div>
                    ))}

                    <p className="form-hint">Hidden test inputs and outputs are not shown.</p>
                </div>
            )}
        </>
    )
}

const QuestionReview = ({ number, q, yourAnswer, result }) => {
    const answered = yourAnswer !== undefined

    return (
        <div className="card q-card">
            <div className="q-head">
                <span className="q-num">
                    Q{number}{q.difficulty ? ` · ${q.difficulty}` : ''}
                </span>
                <span className="ledger-meta">
                    {result ? `${result.marksAwarded} / ${q.marks}` : `${q.marks} marks`}
                </span>
            </div>

            <p className="q-text">{q.question}</p>

            {q.type === 'coding' ? (
                <CodingReview yourAnswer={yourAnswer} result={result} />
            ) : q.type === 'mcq' ? (
                <>
                    {q.options.map((opt, i) => {
                        let cls = 'option'
                        if (opt === q.correctAnswer) cls += ' correct'
                        else if (answered && opt === yourAnswer) cls += ' wrong'
                        return (
                            <div className={cls} key={opt}>
                                <span className="option-letter">{optionLabel(i)}</span>
                                <span className="option-text">{opt}</span>
                            </div>
                        )
                    })}
                    {answered && !yourAnswer && <p className="form-hint">Not answered</p>}
                </>
            ) : (
                <>
                    {answered && (
                        <div className="answer-block">
                            <span className="label">Your answer</span>
                            <p>{yourAnswer || '— not answered —'}</p>
                        </div>
                    )}
                    <div className="answer-block">
                        <span className="label">Model answer</span>
                        <p>{q.correctAnswer}</p>
                    </div>
                </>
            )}

            {result?.feedback && (
                <p className="explain"><strong>Feedback:</strong> {result.feedback}</p>
            )}
            {q.explanation && (
                <p className="explain"><strong>Explanation:</strong> {q.explanation}</p>
            )}
        </div>
    )
}

export default QuestionReview