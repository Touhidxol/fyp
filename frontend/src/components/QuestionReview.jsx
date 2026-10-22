import React from 'react'
import { optionLabel } from '../utils/format'

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

            {q.type === 'mcq' ? (
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