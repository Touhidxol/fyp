import React, { useState } from 'react'

const InstructionBar = ({ onSubmit, disabled = false, hint = '' }) => {
    const [value, setValue] = useState('')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [log, setLog] = useState([])

    const submit = async (e) => {
        e.preventDefault()
        const text = value.trim()
        if (!text || busy || disabled) return

        setBusy(true)
        setError('')
        try {
            await onSubmit(text)
            setLog((prev) => [
                {
                    id: Date.now(),
                    text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
                ...prev,
            ])
            setValue('')
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div>
            <form className="instruction-bar" onSubmit={submit}>
                <input
                    type="text"
                    placeholder="Tell it what to make — e.g. “a 20-question test on Ch. 6–8, moderate difficulty”"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={disabled || busy}
                />
                <button type="submit" className="btn btn-primary" disabled={disabled || busy}>
                    {busy ? 'Generating…' : 'Generate'}
                </button>
            </form>

            {busy && <p className="form-hint">Generating your test. This can take up to a minute.</p>}
            {!busy && hint && <p className="form-hint">{hint}</p>}
            {error && <div className="form-error" style={{ marginTop: 10 }}>{error}</div>}

            {log.length > 0 && (
                <div className="instruction-log">
                    {log.map((item) => (
                        <div className="instruction-log-item" key={item.id}>
                            <span className="num">{item.time}</span>
                            <p>{item.text}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default InstructionBar