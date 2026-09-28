import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { notebooks } from '../data/mockData'

const difficulties = ['Easy', 'Moderate', 'Challenging', 'Mixed']

const CreateTest = () => {
    const location = useLocation()
    const preselectedNotebookId = location.state?.notebookId

    const [notebookId, setNotebookId] = useState(preselectedNotebookId || notebooks[0]?.id || '')
    const [difficulty, setDifficulty] = useState('Moderate')
    const [duration, setDuration] = useState(30)
    const [questions, setQuestions] = useState(10)

    const step = (setter, value, delta, min, max) => {
        const next = Math.min(max, Math.max(min, value + delta))
        setter(next)
    }

    return (
        <main className="container">
            <section className="page">
                <div className="page-header">
                    <div>
                        <h1>Create test</h1>
                        <p>Set up a new test for yourself or your students.</p>
                    </div>
                </div>

                <form className="card" onSubmit={(e) => e.preventDefault()}>
                    <div className="form-section">
                        <h3>Context</h3>
                        <p>Choose which notebook this test should be generated from.</p>

                        <div className="field">
                            <label htmlFor="notebook">Notebook</label>
                            <select id="notebook" value={notebookId} onChange={(e) => setNotebookId(e.target.value)}>
                                {notebooks.map((nb) => (
                                    <option key={nb.id} value={nb.id}>{nb.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Basics</h3>
                        <p>Give the test a name.</p>

                        <div className="field">
                            <label htmlFor="testName">Test name</label>
                            <input type="text" id="testName" placeholder="e.g. Ch. 6–8 practice set" />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Difficulty</h3>
                        <p>How challenging should the questions be?</p>

                        <div className="pill-group">
                            {difficulties.map((d) => (
                                <button
                                    type="button"
                                    key={d}
                                    className={'pill' + (difficulty === d ? ' selected' : '')}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Length</h3>
                        <p>Set the duration and how many questions to include.</p>

                        <div className="grid grid-2">
                            <div className="field">
                                <label htmlFor="duration">Duration <span className="hint">minutes</span></label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '10px 14px' }} onClick={() => step(setDuration, duration, -5, 5, 180)}>–</button>
                                    <input
                                        type="number"
                                        id="duration"
                                        value={duration}
                                        onChange={(e) => setDuration(Number(e.target.value))}
                                        style={{ textAlign: 'center' }}
                                    />
                                    <button type="button" className="btn btn-secondary" style={{ padding: '10px 14px' }} onClick={() => step(setDuration, duration, 5, 5, 180)}>+</button>
                                </div>
                            </div>

                            <div className="field">
                                <label htmlFor="questions">Number of questions</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '10px 14px' }} onClick={() => step(setQuestions, questions, -1, 1, 100)}>–</button>
                                    <input
                                        type="number"
                                        id="questions"
                                        value={questions}
                                        onChange={(e) => setQuestions(Number(e.target.value))}
                                        style={{ textAlign: 'center' }}
                                    />
                                    <button type="button" className="btn btn-secondary" style={{ padding: '10px 14px' }} onClick={() => step(setQuestions, questions, 1, 1, 100)}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary">Save as draft</button>
                        <button type="submit" className="btn btn-primary">Create test</button>
                    </div>
                </form>
            </section>
        </main>
    )
}

export default CreateTest