import React, { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const Login = () => {
    const { user, loading, login } = useAuth()
    const location = useLocation()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    // Once logged in (or already logged in), go where the user was headed
    if (!loading && user) {
        return <Navigate to={location.state?.from || '/dashboard'} replace />
    }

    const submit = async (e) => {
        e.preventDefault()
        setError('')
        setBusy(true)
        try {
            await login({ email, password })
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="card auth-card">
                <h1>Welcome back</h1>
                <p>Log in to continue to Aptura.</p>

                <form className="auth-form" onSubmit={submit}>
                    {error && <div className="form-error">{error}</div>}

                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                    </div>

                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={busy}>
                        {busy ? 'Logging in…' : 'Log in'}
                    </button>
                </form>

                <p className="auth-switch">
                    New here? <Link to="/register">Create an account</Link>
                </p>
            </div>
        </div>
    )
}

export default Login