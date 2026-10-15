import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Register = () => {
    const { user, loading, register } = useAuth()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    if (!loading && user) return <Navigate to="/dashboard" replace />

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            await register({ name, email, password })
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <h1>Create your account</h1>
                <p>Start turning your notes into practice tests.</p>

                <form className="auth-form" onSubmit={submit}>
                    {error && <div className="form-error">{error}</div>}

                    <div className="field">
                        <label htmlFor="name">Name</label>
                        <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
                    </div>

                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>

                    <div className="field">
                        <label htmlFor="password">Password <span className="hint">at least 8 characters</span></label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={busy}>
                        {busy ? 'Creating account…' : 'Sign up'}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    )
}

export default Register