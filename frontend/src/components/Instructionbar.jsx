import React, { useState } from 'react'

const InstructionBar = ({ history = [] }) => {
    const [value, setValue] = useState('')
    const [log, setLog] = useState(history)

    const submit = (e) => {
        e.preventDefault()
        if (!value.trim()) return
        setLog([{ id: Date.now(), text: value.trim(), time: 'just now' }, ...log])
        setValue('')
    }

    return (
        <div>
            <form className="instruction-bar" onSubmit={submit}>
                <input
                    type="text"
                    placeholder="Tell it what to make — e.g. “a 20-question test on Ch. 6–8, moderate difficulty”"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Send</button>
            </form>

            {log.length > 0 && (
                <div className="instruction-log">
                    {log.map((item, i) => (
                        <div className="instruction-log-item" key={item.id || i}>
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