import React, { useEffect, useState } from 'react'
import { AuthContext } from './auth-context'
import * as authApi from '../api/auth'

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // On first load, ask the backend if the cookie is still valid
    useEffect(() => {
        authApi
            .me()
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    const login = async (credentials) => {
        const loggedIn = await authApi.login(credentials)
        setUser(loggedIn)
        return loggedIn
    }

    // The backend's register doesn't set a cookie, so log in right after
    const register = async (data) => {
        await authApi.register(data)
        return login({ email: data.email, password: data.password })
    }

    const logout = async () => {
        await authApi.logout().catch(() => { })
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider